import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import './motion.css';
import { PhoneContainer } from './components/PhoneContainer';
import { ChatTab } from './components/ChatTab';
import { GuestListTab } from './components/GuestListTab';
import { InvitationsTab } from './components/InvitationsTab';
import { TablesTab } from './components/TablesTab';
import { InvitationModal } from './components/InvitationModal';
import { EditGuestModal } from './components/EditGuestModal';
import { PinLockScreen } from './components/PinLockScreen';
import { PlannerTab, PlannerView } from './components/PlannerTab';
import { Guest, ChatMessage, WeddingInfo, InvitationStatus, TabId, Expense, PrepItem, PrepSuggestion } from './types';
import { initialGuests, initialWeddingInfo, initialChatMessages } from './data/initialData';
import { findDuplicateCandidates, extractGuestInfoFromText } from './utils/vietnameseNlp';
import { API_BASE } from './utils/api';
import { processPlannerMessage } from './utils/plannerBot';
import { clearPinSession, isPinSessionValid, touchPinSession } from './utils/pinSession';
import {
  buildDailyReminder,
  getUpcomingPayments,
  getUrgentPrepItems,
  newId,
  suggestionToPrepItem,
  toIsoDate,
} from './utils/weddingPlanner';

function loadCached<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveCached(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to save ${key} to localStorage:`, e);
  }
}

function postJson(path: string, body: unknown) {
  fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {});
}

const REMINDER_KEY = 'myvinh_last_reminder_date';

export default function App() {
  // PIN lock authentication state
  // Nhớ PIN 1 giờ kể từ lần dùng gần nhất (xem utils/pinSession)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => isPinSessionValid());

  useEffect(() => {
    if (!isUnlocked) return;
    touchPinSession();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        touchPinSession(); // hạn 1 giờ tính từ lúc rời app
      } else if (isPinSessionValid()) {
        touchPinSession();
      } else {
        clearPinSession();
        setIsUnlocked(false); // mở lại sau hơn 1 giờ chạy nền
      }
    };
    const onPageHide = () => touchPinSession();
    // Đang dùng app thì liên tục gia hạn, không bị khóa giữa chừng
    const keepAlive = window.setInterval(() => {
      if (document.visibilityState === 'visible') touchPinSession();
    }, 60_000);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.clearInterval(keepAlive);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [isUnlocked]);

  // State loaded initially from cache, then synced from MongoDB
  const [guests, setGuests] = useState<Guest[]>(() => {
    try {
      const saved = localStorage.getItem('myvinh_guests');
      return saved ? JSON.parse(saved) : initialGuests;
    } catch {
      return initialGuests;
    }
  });

  const [weddingInfo, setWeddingInfo] = useState<WeddingInfo>(() => {
    try {
      const saved = localStorage.getItem('myvinh_wedding_info');
      return saved ? JSON.parse(saved) : initialWeddingInfo;
    } catch {
      return initialWeddingInfo;
    }
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('myvinh_chat_messages');
      return saved ? JSON.parse(saved) : initialChatMessages;
    } catch {
      return initialChatMessages;
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => loadCached<Expense[]>('myvinh_expenses', []));
  const [prepItems, setPrepItems] = useState<PrepItem[]>(() => loadCached<PrepItem[]>('myvinh_prep_items', []));
  const [plannerView, setPlannerView] = useState<PlannerView>('finance');
  const [dataReady, setDataReady] = useState(false);

  const [activeTab, setActiveTab] = useState<TabId>('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGuestForInvitation, setSelectedGuestForInvitation] = useState<Guest | null>(null);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync from MongoDB backend on mount
  useEffect(() => {
    fetch(API_BASE + '/api/data')
      .then((res) => {
        if (!res.ok) throw new Error('API offline');
        return res.json();
      })
      .then((data) => {
        if (data.guests && Array.isArray(data.guests) && data.guests.length > 0) {
          setGuests(data.guests);
        }
        if (data.weddingInfo) {
          setWeddingInfo(data.weddingInfo);
        }
        if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages);
        }
        if (Array.isArray(data.expenses) && data.expenses.length > 0) {
          setExpenses(data.expenses);
        }
        if (Array.isArray(data.prepItems) && data.prepItems.length > 0) {
          setPrepItems(data.prepItems);
        }
      })
      .catch((err) => {
        console.log('[Storage] Working in local synchronized mode:', err);
      })
      .finally(() => setDataReady(true));
  }, []);

  useEffect(() => saveCached('myvinh_expenses', expenses), [expenses]);
  useEffect(() => saveCached('myvinh_prep_items', prepItems), [prepItems]);

  // Trợ lý chủ động nhắc việc: tối đa 1 lần mỗi ngày, sau khi đã đồng bộ dữ liệu
  useEffect(() => {
    if (!dataReady || !isUnlocked) return;
    const today = toIsoDate(new Date());
    try {
      if (localStorage.getItem(REMINDER_KEY) === today) return;
    } catch {
      /* storage blocked: vẫn nhắc */
    }
    const reminder = buildDailyReminder(prepItems, expenses, weddingInfo);
    try {
      localStorage.setItem(REMINDER_KEY, today);
    } catch {
      /* ignore */
    }
    if (!reminder) return;
    const reminderMsg: ChatMessage = {
      id: `bot-reminder-${today}`,
      sender: 'bot',
      text: reminder.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionType: reminder.suggestions.length > 0 ? 'prep_suggestion' : 'general',
      suggestedPrepItems: reminder.suggestions,
      suggestedQuickReplies: ['Cần chuẩn bị gì?', 'Tình hình chi tiêu'],
    };
    setMessages((prev) => (prev.some((m) => m.id === reminderMsg.id) ? prev : [...prev, reminderMsg]));
    postJson('/api/chat/messages', reminderMsg);
    // Chỉ chạy khi dữ liệu sẵn sàng / mở khoá; không chạy lại mỗi lần sửa checklist
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataReady, isUnlocked]);

  const plannerAlertCount = React.useMemo(
    () => getUrgentPrepItems(prepItems).length + getUpcomingPayments(expenses).length,
    [prepItems, expenses]
  );

  // Sync to LocalStorage as instant local cache
  useEffect(() => {
    try {
      localStorage.setItem('myvinh_guests', JSON.stringify(guests));
    } catch (e) {
      console.warn('Failed to save guests to localStorage:', e);
    }
  }, [guests]);

  useEffect(() => {
    try {
      localStorage.setItem('myvinh_wedding_info', JSON.stringify(weddingInfo));
    } catch (e) {
      console.warn('Failed to save wedding info:', e);
    }
  }, [weddingInfo]);

  useEffect(() => {
    try {
      localStorage.setItem('myvinh_chat_messages', JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat messages:', e);
    }
  }, [messages]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleLockApp = () => {
    clearPinSession();
    setIsUnlocked(false);
    showToast('Đã khóa ứng dụng.');
  };

  // Duplicate count for badges
  const totalDuplicateAlerts = React.useMemo(() => {
    let count = 0;
    for (let i = 0; i < guests.length; i++) {
      for (let j = i + 1; j < guests.length; j++) {
        if (findDuplicateCandidates(guests[i], [guests[j]]).length > 0) {
          count++;
        }
      }
    }
    return count;
  }, [guests]);

  // Handle user message in chat
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Persist user message to MongoDB
    fetch(API_BASE + '/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userMsg),
    }).catch(() => {});

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      const response = await fetch(API_BASE + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: text,
          existingGuests: guests,
          weddingInfo,
          expenses,
          prepItems,
        }),
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('API server returned error');
      }

      const data = await response.json();

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionType: data.actionType || 'general',
        extractedGuest: data.extractedGuest,
        duplicateCandidates: data.duplicateCandidates,
        extractedExpense: data.extractedExpense,
        suggestedPrepItems: data.suggestedPrepItems,
        budgetUpdate: data.budgetUpdate,
        suggestedQuickReplies: data.suggestedQuickReplies,
      };

      if (typeof data.budgetUpdate === 'number' && data.budgetUpdate > 0) {
        handleUpdateBudget(data.budgetUpdate, false);
      }

      setMessages((prev) => [...prev, botMsg]);

      // Persist bot message to MongoDB
      fetch(API_BASE + '/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(botMsg),
      }).catch(() => {});
    } catch (err) {
      console.warn('Chat request failed, using client-side fallback:', err);

      // Chi tiêu / chuẩn bị: xử lý được hoàn toàn trên máy khi mất mạng
      const planner = processPlannerMessage(text, guests, weddingInfo, { expenses, prepItems });
      if (planner) {
        const plannerMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: planner.replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionType: planner.actionType,
          extractedExpense: planner.extractedExpense,
          suggestedPrepItems: planner.suggestedPrepItems,
          budgetUpdate: planner.budgetUpdate,
          suggestedQuickReplies: planner.suggestedQuickReplies,
        };
        if (planner.budgetUpdate) handleUpdateBudget(planner.budgetUpdate, false);
        setMessages((prev) => [...prev, plannerMsg]);
        postJson('/api/chat/messages', plannerMsg);
        return;
      }

      const nlp = extractGuestInfoFromText(text);
      let botText = `Dạ Mỹ Vinh đã nhận tin nhắn!`;
      let actionType: ChatMessage['actionType'] = 'general';
      let dups = undefined;

      if (nlp.guest && nlp.guest.name) {
        dups = findDuplicateCandidates(nlp.guest as any, guests);
        if (dups.length > 0) {
          botText = `⚠️ Phát hiện có thể trùng với "${dups[0].existingGuest.name}" (${dups[0].reason}). Bạn xem qua và chọn gộp hoặc thêm mới nhé!`;
          actionType = 'duplicate_warning';
        } else {
          botText = `Dạ mình đã bóc tách thông tin khách "${nlp.guest.name}" (${nlp.guest.relationshipDetail}, ${nlp.guest.count} người). Bạn bấm xác nhận để lưu nhé!`;
          actionType = 'add_guest';
        }
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionType,
        extractedGuest: nlp.guest,
        duplicateCandidates: dups,
        suggestedQuickReplies: ['Thêm khách tiếp', 'Kiểm tra trùng', 'Xem danh sách'],
      };

      setMessages((prev) => [...prev, botMsg]);

      fetch(API_BASE + '/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(botMsg),
      }).catch(() => {});
    } finally {
      setIsLoading(false);
    }
  };

  // Add guest to master list and MongoDB
  const handleAddGuest = (guestData: Partial<Guest>) => {
    const newGuest: Guest = {
      id: `g-${Date.now()}`,
      name: guestData.name || 'Khách Mời',
      relationshipCategory: guestData.relationshipCategory || 'ban_be',
      relationshipDetail: guestData.relationshipDetail || 'Bạn bè',
      side: guestData.side || 'chung',
      count: guestData.count || 1,
      childCount: guestData.childCount,
      phone: guestData.phone || '',
      status: guestData.status || 'chua_gui',
      tableNumber: guestData.tableNumber || '',
      note: guestData.note || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setGuests((prev) => [newGuest, ...prev]);
    showToast(`Đã thêm "${newGuest.name}" vào danh sách! 🎉`);

    // Save to MongoDB
    fetch(API_BASE + '/api/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGuest),
    }).catch(() => {});

    // Confirmation message to chat
    const confirmMsg: ChatMessage = {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      text: `✅ Đã lưu thành công "${newGuest.name}" (${newGuest.relationshipDetail}, ${newGuest.count} suất) vào danh sách cưới!\n\nBạn có thể soạn lời mời ngay hoặc nhắn thêm khách tiếp theo nhé.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionType: 'general',
      suggestedQuickReplies: ['Soạn thiệp mời', 'Thêm khách tiếp', 'Xem danh sách cỗ'],
    };
    setMessages((prev) => [...prev, confirmMsg]);

    fetch(API_BASE + '/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(confirmMsg),
    }).catch(() => {});
  };

  // Resolve duplicate from chat warning card
  const handleResolveDuplicate = (
    action: 'merge' | 'keep_both' | 'cancel',
    newGuest: Partial<Guest>,
    targetExistingGuest?: Guest,
    messageId?: string
  ) => {
    if (messageId) {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, resolved: true } : m))
      );
    }

    if (action === 'cancel') {
      showToast('Đã hủy thêm khách trùng lặp.');
      return;
    }

    if (action === 'keep_both') {
      handleAddGuest(newGuest);
      return;
    }

    if (action === 'merge' && targetExistingGuest) {
      const addedCount = newGuest.count || 1;
      const updatedTarget: Guest = {
        ...targetExistingGuest,
        count: targetExistingGuest.count + (addedCount > 1 ? addedCount - 1 : 0),
        phone: newGuest.phone || targetExistingGuest.phone,
        note: [targetExistingGuest.note, newGuest.note ? `(Gộp: ${newGuest.note})` : '']
          .filter(Boolean)
          .join(' · '),
        updatedAt: new Date().toISOString(),
      };

      setGuests((prev) =>
        prev.map((g) => (g.id === targetExistingGuest.id ? updatedTarget : g))
      );

      // Save merged to MongoDB
      fetch(API_BASE + '/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTarget),
      }).catch(() => {});

      showToast(`Đã gộp thông tin vào khách "${targetExistingGuest.name}"!`);
    }
  };

  // Merge 2 existing guests from Duplicate Scanner Modal
  const handleMergeGuests = (primaryId: string, secondaryId: string) => {
    const primary = guests.find((g) => g.id === primaryId);
    const secondary = guests.find((g) => g.id === secondaryId);
    if (!primary || !secondary) return;

    const merged: Guest = {
      ...primary,
      count: Math.max(primary.count, secondary.count),
      phone: primary.phone || secondary.phone,
      note: [primary.note, secondary.note].filter(Boolean).join(' · '),
      updatedAt: new Date().toISOString(),
    };

    setGuests((prev) =>
      prev.filter((g) => g.id !== secondaryId).map((g) => (g.id === primaryId ? merged : g))
    );

    // Update in MongoDB
    fetch(API_BASE + '/api/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged),
    }).catch(() => {});

    fetch(`${API_BASE}/api/guests/${secondaryId}`, { method: 'DELETE' }).catch(() => {});

    showToast(`Đã gộp thành công ${secondary.name} vào ${primary.name}!`);
  };

  // Update status directly from list row
  const handleUpdateStatus = (id: string, status: InvitationStatus) => {
    const target = guests.find((g) => g.id === id);
    if (!target) return;

    const updated = { ...target, status, updatedAt: new Date().toISOString() };
    setGuests((prev) => prev.map((g) => (g.id === id ? updated : g)));

    // Save status to MongoDB
    fetch(API_BASE + '/api/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(() => {});

    showToast('Đã cập nhật trạng thái thiệp mời.');
  };

  // Delete guest
  const handleDeleteGuest = (id: string) => {
    const toDelete = guests.find((g) => g.id === id);
    if (!toDelete) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa khách "${toDelete.name}" khỏi danh sách cưới không?`)) {
      setGuests((prev) => prev.filter((g) => g.id !== id));

      // Delete from MongoDB
      fetch(`${API_BASE}/api/guests/${id}`, { method: 'DELETE' }).catch(() => {});
      showToast(`Đã xóa "${toDelete.name}" khỏi danh sách.`);
    }
  };

  // Save guest from Edit/Add modal
  const handleSaveEditGuest = (guestData: Partial<Guest>) => {
    if (editingGuest) {
      const updated = {
        ...editingGuest,
        ...guestData,
        updatedAt: new Date().toISOString(),
      };
      setGuests((prev) => prev.map((g) => (g.id === editingGuest.id ? updated : g)));

      fetch(API_BASE + '/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});

      showToast(`Đã cập nhật thông tin "${guestData.name}".`);
      setEditingGuest(null);
    } else {
      handleAddGuest(guestData);
    }
  };

  // Save wedding info to MongoDB
  const handleUpdateWeddingInfo = (info: WeddingInfo) => {
    setWeddingInfo(info);
    fetch(API_BASE + '/api/wedding-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(info),
    }).catch(() => {});
    showToast('Đã cập nhật thông tin đám cưới vào MongoDB.');
  };

  // ---------- Kế hoạch: tài chính & checklist ----------

  const handleUpdateBudget = (budget: number, toast = true) => {
    setWeddingInfo((prev) => {
      const next = { ...prev, totalBudget: budget };
      postJson('/api/wedding-info', next);
      return next;
    });
    if (toast) showToast('Đã cập nhật ngân sách cưới.');
  };

  const handleSaveExpense = (expense: Expense) => {
    const exists = expenses.some((e) => e.id === expense.id);
    setExpenses((prev) => (exists ? prev.map((e) => (e.id === expense.id ? expense : e)) : [expense, ...prev]));
    postJson('/api/expenses', expense);
    showToast(exists ? `Đã cập nhật "${expense.title}".` : `Đã ghi khoản chi "${expense.title}".`);
  };

  const handleDeleteExpense = (id: string) => {
    const target = expenses.find((e) => e.id === id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    fetch(`${API_BASE}/api/expenses/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
    if (target) showToast(`Đã xóa khoản chi "${target.title}".`);
  };

  const handleAddExpenseFromChat = (data: Partial<Expense>, messageId: string) => {
    const nowIso = new Date().toISOString();
    const expense: Expense = {
      id: newId('e'),
      title: data.title || 'Khoản chi cưới',
      category: data.category || 'khac',
      amount: data.amount || 0,
      paidAmount: data.paidAmount || 0,
      payer: data.payer || 'chung',
      vendor: data.vendor,
      dueDate: data.dueDate,
      note: data.note,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    handleSaveExpense(expense);
    setMessages((prev) => {
      const next = prev.map((m) => (m.id === messageId ? { ...m, resolved: true } : m));
      const updated = next.find((m) => m.id === messageId);
      if (updated) postJson('/api/chat/messages', updated);
      return next;
    });
  };

  const handleSavePrepItem = (item: PrepItem) => {
    const exists = prepItems.some((p) => p.id === item.id);
    setPrepItems((prev) => (exists ? prev.map((p) => (p.id === item.id ? item : p)) : [item, ...prev]));
    postJson('/api/prep-items', item);
    if (!exists) showToast(`Đã thêm "${item.title}" vào checklist.`);
    else if (item.done && !prepItems.find((p) => p.id === item.id)?.done) showToast(`Xong: ${item.title} ✓`);
  };

  const handleDeletePrepItem = (id: string) => {
    const target = prepItems.find((p) => p.id === id);
    setPrepItems((prev) => prev.filter((p) => p.id !== id));
    fetch(`${API_BASE}/api/prep-items/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
    if (target) showToast(`Đã xóa "${target.title}" khỏi checklist.`);
  };

  const handleAddSuggestions = (suggestions: PrepSuggestion[]) => {
    const existingKeys = new Set(prepItems.map((p) => p.templateKey).filter(Boolean));
    const fresh = suggestions.filter((s) => !existingKeys.has(s.templateKey)).map(suggestionToPrepItem);
    if (fresh.length === 0) return;
    setPrepItems((prev) => [...fresh, ...prev]);
    fresh.forEach((item) => postJson('/api/prep-items', item));
    showToast(fresh.length === 1 ? `Đã thêm "${fresh[0].title}" vào checklist.` : `Đã thêm ${fresh.length} việc vào checklist.`);
  };

  // If not unlocked, render PIN lock screen
  if (!isUnlocked) {
    return (
      <PinLockScreen
        onUnlockSuccess={() => {
          touchPinSession();
          setIsUnlocked(true);
        }}
        weddingInfo={weddingInfo}
      />
    );
  }

  return (
    <MotionConfig reducedMotion="user">
    <PhoneContainer
      activeTab={activeTab}
      onTabChange={setActiveTab}
      guestCount={guests.length}
      duplicateCount={totalDuplicateAlerts}
      plannerAlertCount={plannerAlertCount}
    >
      {/* Active tab slides/fades in when switching */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
        className="h-full flex flex-col"
      >
      {/* Tab 1: Conversational Chatbot */}
      {activeTab === 'chat' && (
        <ChatTab
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onAddGuest={handleAddGuest}
          onResolveDuplicate={handleResolveDuplicate}
          onNavigateToTab={setActiveTab}
          onOpenInvitation={(guest) => setSelectedGuestForInvitation(guest)}
          weddingInfo={weddingInfo}
          prepItems={prepItems}
          onAddExpense={handleAddExpenseFromChat}
          onAddPrepSuggestions={handleAddSuggestions}
        />
      )}

      {/* Tab 2: Guest List */}
      {activeTab === 'guests' && (
        <GuestListTab
          guests={guests}
          onAddGuestClick={() => {
            setEditingGuest(null);
            setIsEditModalOpen(true);
          }}
          onEditGuest={(guest) => {
            setEditingGuest(guest);
            setIsEditModalOpen(true);
          }}
          onDeleteGuest={handleDeleteGuest}
          onUpdateStatus={handleUpdateStatus}
          onOpenInvitation={(guest) => setSelectedGuestForInvitation(guest)}
          onMergeGuests={handleMergeGuests}
        />
      )}

      {/* Tab 3: Invitations & Cards */}
      {activeTab === 'invitations' && (
        <InvitationsTab
          guests={guests}
          weddingInfo={weddingInfo}
          onOpenInvitationModal={(guest) => setSelectedGuestForInvitation(guest)}
        />
      )}

      {/* Tab 4: Tables & Headcount Stats */}
      {activeTab === 'tables' && (
        <TablesTab
          guests={guests}
          weddingInfo={weddingInfo}
          onUpdateWeddingInfo={handleUpdateWeddingInfo}
        />
      )}

      {/* Tab 5: Kế hoạch - tài chính & checklist chuẩn bị */}
      {activeTab === 'planner' && (
        <PlannerTab
          guests={guests}
          weddingInfo={weddingInfo}
          expenses={expenses}
          prepItems={prepItems}
          view={plannerView}
          onViewChange={setPlannerView}
          onSaveExpense={handleSaveExpense}
          onDeleteExpense={handleDeleteExpense}
          onSavePrepItem={handleSavePrepItem}
          onDeletePrepItem={handleDeletePrepItem}
          onAddSuggestions={handleAddSuggestions}
          onUpdateBudget={handleUpdateBudget}
        />
      )}
      </motion.div>

      {/* Invitation Modal */}
      <AnimatePresence>
        {selectedGuestForInvitation && (
          <InvitationModal
            key="invitation-modal"
            guest={selectedGuestForInvitation}
            weddingInfo={weddingInfo}
            allGuests={guests}
            onClose={() => setSelectedGuestForInvitation(null)}
          />
        )}
      </AnimatePresence>

      {/* Edit / Add Guest Modal */}
      <EditGuestModal
        guest={editingGuest}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingGuest(null);
        }}
        onSave={handleSaveEditGuest}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 520, damping: 34 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-[88%]"
          >
            <div className="flex items-center gap-2 bg-stone-900/95 backdrop-blur-md text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-lift">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PhoneContainer>
    </MotionConfig>
  );
}
