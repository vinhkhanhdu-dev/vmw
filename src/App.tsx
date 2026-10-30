import React, { useState, useEffect } from 'react';
import { PhoneContainer } from './components/PhoneContainer';
import { ChatTab } from './components/ChatTab';
import { GuestListTab } from './components/GuestListTab';
import { InvitationsTab } from './components/InvitationsTab';
import { TablesTab } from './components/TablesTab';
import { InvitationModal } from './components/InvitationModal';
import { EditGuestModal } from './components/EditGuestModal';
import { PinLockScreen } from './components/PinLockScreen';
import { Guest, ChatMessage, WeddingInfo, InvitationStatus } from './types';
import { initialGuests, initialWeddingInfo, initialChatMessages } from './data/initialData';
import { findDuplicateCandidates, extractGuestInfoFromText } from './utils/vietnameseNlp';

export default function App() {
  // PIN lock authentication state
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('myvinh_unlocked') === 'true';
    } catch {
      return false;
    }
  });

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

  const [activeTab, setActiveTab] = useState<'chat' | 'guests' | 'invitations' | 'tables'>('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGuestForInvitation, setSelectedGuestForInvitation] = useState<Guest | null>(null);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync from MongoDB backend on mount
  useEffect(() => {
    fetch('/api/data')
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
      })
      .catch((err) => {
        console.log('[Storage] Working in local synchronized mode:', err);
      });
  }, []);

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
    sessionStorage.removeItem('myvinh_unlocked');
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
    fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userMsg),
    }).catch(() => {});

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: text,
          existingGuests: guests,
          weddingInfo,
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
        suggestedQuickReplies: data.suggestedQuickReplies,
      };

      setMessages((prev) => [...prev, botMsg]);

      // Persist bot message to MongoDB
      fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(botMsg),
      }).catch(() => {});
    } catch (err) {
      console.warn('Chat request failed, using client-side fallback:', err);
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

      fetch('/api/chat/messages', {
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
    fetch('/api/guests', {
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

    fetch('/api/chat/messages', {
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
      fetch('/api/guests', {
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
    fetch('/api/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged),
    }).catch(() => {});

    fetch(`/api/guests/${secondaryId}`, { method: 'DELETE' }).catch(() => {});

    showToast(`Đã gộp thành công ${secondary.name} vào ${primary.name}!`);
  };

  // Update status directly from list row
  const handleUpdateStatus = (id: string, status: InvitationStatus) => {
    const target = guests.find((g) => g.id === id);
    if (!target) return;

    const updated = { ...target, status, updatedAt: new Date().toISOString() };
    setGuests((prev) => prev.map((g) => (g.id === id ? updated : g)));

    // Save status to MongoDB
    fetch('/api/guests', {
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
      fetch(`/api/guests/${id}`, { method: 'DELETE' }).catch(() => {});
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

      fetch('/api/guests', {
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
    fetch('/api/wedding-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(info),
    }).catch(() => {});
    showToast('Đã cập nhật thông tin đám cưới vào MongoDB.');
  };

  // If not unlocked, render PIN lock screen
  if (!isUnlocked) {
    return <PinLockScreen onUnlockSuccess={() => setIsUnlocked(true)} />;
  }

  return (
    <PhoneContainer
      activeTab={activeTab}
      onTabChange={setActiveTab}
      guestCount={guests.length}
      duplicateCount={totalDuplicateAlerts}
      weddingInfo={weddingInfo}
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

      {/* Invitation Modal */}
      {selectedGuestForInvitation && (
        <InvitationModal
          guest={selectedGuestForInvitation}
          weddingInfo={weddingInfo}
          allGuests={guests}
          onClose={() => setSelectedGuestForInvitation(null)}
        />
      )}

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
      {toastMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-stone-900/90 backdrop-blur-md text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg border border-white/20 animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2 max-w-[90%] text-center">
          <span>{toastMessage}</span>
        </div>
      )}
    </PhoneContainer>
  );
}
