import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  AlertTriangle,
  UserPlus,
  Check,
  ArrowRight,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Phone,
  Users,
  Info,
  Plus,
  Receipt,
  ListChecks,
} from 'lucide-react';
import { Guest, ChatMessage, WeddingInfo, TabId, Expense, PrepItem, PrepSuggestion } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { Avatar, Monogram, SidePill, SIDE_LABEL } from './ui';
import { EXPENSE_CATEGORY_META, PAYER_LABEL, formatShortDate, formatVnd } from '../utils/weddingPlanner';

interface ChatTabProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onAddGuest: (guest: Partial<Guest>) => void;
  onResolveDuplicate: (
    action: 'merge' | 'keep_both' | 'cancel',
    newGuest: Partial<Guest>,
    targetExistingGuest?: Guest,
    messageId?: string
  ) => void;
  onNavigateToTab: (tabId: TabId) => void;
  onOpenInvitation: (guest: Guest) => void;
  weddingInfo: WeddingInfo;
  prepItems?: PrepItem[];
  onAddExpense?: (expense: Partial<Expense>, messageId: string) => void;
  onAddPrepSuggestions?: (suggestions: PrepSuggestion[]) => void;
}

const QUICK_PROMPTS: { label: string; text: string }[] = [
  { label: '💬 Mời anh Nam (2 người)', text: 'Mời anh Nam bạn cấp 3 đi 2 người' },
  { label: '💬 Chị Hương Tech (Nhà gái)', text: 'Chị Hương đồng nghiệp Tech 0987654321, nhà gái' },
  { label: '💬 Bác Tuấn họ nội', text: 'Bác Tuấn họ nội ở quê, 3 suất' },
  { label: '🔍 Quét trùng toàn bộ', text: 'Kiểm tra trùng lặp' },
  { label: '📊 Tổng kết mâm cỗ', text: 'Tổng kết cỗ & khách' },
  { label: '💡 Cần chuẩn bị gì?', text: 'Cần chuẩn bị gì?' },
  { label: '💰 Tình hình chi tiêu', text: 'Tình hình chi tiêu' },
  { label: '🧾 Cọc 10tr nhà hàng', text: 'Đặt cọc 10tr nhà hàng' },
];

const Field: React.FC<{ icon: React.ReactNode; label: string; value: string; mono?: boolean }> = ({
  icon,
  label,
  value,
  mono,
}) => (
  <div className="bg-stone-50 rounded-lg px-2.5 py-2 border border-stone-100">
    <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
      {icon}
      <span>{label}</span>
    </div>
    <div className={`text-[12.5px] font-semibold text-stone-800 mt-0.5 ${mono ? 'font-mono' : ''}`}>{value}</div>
  </div>
);

export const ChatTab: React.FC<ChatTabProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onAddGuest,
  onResolveDuplicate,
  onNavigateToTab,
  prepItems = [],
  onAddExpense,
  onAddPrepSuggestions,
}) => {
  const addedTemplateKeys = new Set(prepItems.map((p) => p.templateKey).filter(Boolean));
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleQuickReply = (text: string) => {
    if (isLoading) return;
    onSendMessage(text);
  };

  return (
    <div className="flex flex-col h-full bg-cream text-stone-800 overflow-hidden">
      {/* Assistant header */}
      <header className="shrink-0 z-10 bg-white/90 backdrop-blur-md border-b border-stone-200/70 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Monogram online />
          <div className="min-w-0">
            <h1 className="font-serif text-lg leading-tight text-stone-900">Mỹ Vinh</h1>
            <div className="flex items-center gap-1.5 text-[11.5px] text-stone-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="truncate">Trợ lý mời cưới · Trực tuyến</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <PWAInstallButton />
          <button onClick={() => onNavigateToTab('guests')} className="btn btn-soft btn-sm pr-2">
            <span>Danh sách</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 overscroll-contain">
        {messages.map((msg, i) => {
          const isUser = msg.sender === 'user';
          const prevSame = i > 0 && messages[i - 1].sender === msg.sender;
          const nextSame = i < messages.length - 1 && messages[i + 1].sender === msg.sender;
          const hasCard =
            (msg.actionType === 'duplicate_warning' && !!msg.duplicateCandidates?.length) ||
            (msg.actionType === 'add_guest' && !!msg.extractedGuest);

          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${prevSame ? 'mt-1.5' : 'mt-4'} first:mt-0 animate-fade-up`}
            >
              {!isUser && (
                <div className="w-7 mr-2 shrink-0 self-end">
                  {(!nextSame || hasCard) && <Monogram className="w-7 h-7 text-[8px]" />}
                </div>
              )}

              <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[86%] gap-2.5 min-w-0`}>
                {/* Bubble */}
                <div
                  className={`px-4 py-2.5 text-[13.5px] leading-relaxed break-words ${
                    isUser
                      ? 'bg-linear-to-br from-wine-600 to-wine-800 text-white rounded-2xl rounded-br-md shadow-wine'
                      : 'bg-white text-stone-800 rounded-2xl rounded-bl-md border border-stone-200/60 shadow-card'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>
                  <div className={`text-[10px] mt-1 text-right ${isUser ? 'text-white/60' : 'text-stone-400'}`}>
                    {msg.timestamp}
                  </div>
                </div>

                {/* Duplicate warning card */}
                {msg.actionType === 'duplicate_warning' && msg.duplicateCandidates && msg.duplicateCandidates.length > 0 && (
                  <div className="w-full card overflow-hidden border-amber-200">
                    <div className="px-4 py-2.5 flex items-center gap-2 bg-amber-50 border-b border-amber-100 text-amber-800">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Có thể trùng lặp</span>
                    </div>

                    <div className="p-4 space-y-3">
                      {msg.duplicateCandidates.map((cand, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100">
                          <Avatar name={cand.existingGuest.name} side={cand.existingGuest.side} className="w-9 h-9 text-[10px]" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-sm text-stone-900 truncate">{cand.existingGuest.name}</span>
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md shrink-0">
                                {cand.similarityScore}%
                              </span>
                            </div>
                            <div className="text-[11.5px] text-stone-500 mt-0.5">
                              {cand.existingGuest.relationshipDetail} · {cand.existingGuest.count} suất ·{' '}
                              {SIDE_LABEL[cand.existingGuest.side]}
                              {cand.existingGuest.phone && (
                                <>
                                  {' '}
                                  · <span className="font-mono">{cand.existingGuest.phone}</span>
                                </>
                              )}
                            </div>
                            <div className="text-[11px] text-amber-700 mt-1.5 flex items-start gap-1">
                              <Info className="w-3 h-3 mt-0.5 shrink-0" />
                              <span>{cand.reason}</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {msg.extractedGuest && (
                        <div className="flex items-center gap-2 text-xs text-stone-600 px-1">
                          <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate">
                            Bạn vừa nhắn: <span className="font-semibold text-stone-900">{msg.extractedGuest.name}</span> (
                            {msg.extractedGuest.relationshipDetail || 'Khách'}, {msg.extractedGuest.count || 1} người)
                          </span>
                        </div>
                      )}

                      {!msg.resolved ? (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() =>
                              msg.extractedGuest &&
                              msg.duplicateCandidates &&
                              onResolveDuplicate('merge', msg.extractedGuest, msg.duplicateCandidates[0].existingGuest, msg.id)
                            }
                            className="btn btn-warn btn-md"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Gộp & cập nhật</span>
                          </button>
                          <button
                            onClick={() => msg.extractedGuest && onResolveDuplicate('keep_both', msg.extractedGuest, undefined, msg.id)}
                            className="btn btn-secondary btn-md"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Vẫn thêm mới</span>
                          </button>
                          <button
                            onClick={() => onResolveDuplicate('cancel', {}, undefined, msg.id)}
                            className="btn btn-ghost btn-sm col-span-2"
                          >
                            Bỏ qua
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã xử lý thông tin trùng lặp</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Extracted guest confirmation card */}
                {msg.actionType === 'add_guest' && msg.extractedGuest && (
                  <div className="w-full card overflow-hidden">
                    <div className="px-4 py-2.5 flex items-center justify-between bg-linear-to-r from-wine-50 to-gold-50 border-b border-stone-100">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-wine-700">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Thông tin bóc tách</span>
                      </div>
                      <SidePill side={msg.extractedGuest.side || 'chung'} />
                    </div>

                    <div className="p-4 flex items-start gap-3">
                      <Avatar name={msg.extractedGuest.name || '?'} side={msg.extractedGuest.side || 'chung'} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-stone-900 text-sm leading-tight">{msg.extractedGuest.name}</div>
                        <div className="text-xs text-stone-500 mt-0.5">{msg.extractedGuest.relationshipDetail || 'Bạn bè'}</div>
                        <div className="mt-2.5 grid grid-cols-2 gap-2">
                          <Field icon={<Users className="w-3 h-3" />} label="Số suất" value={`${msg.extractedGuest.count || 1} người`} />
                          <Field icon={<Phone className="w-3 h-3" />} label="Điện thoại" value={msg.extractedGuest.phone || 'Chưa có'} mono />
                        </div>
                      </div>
                    </div>

                    <div className="px-4 pb-4">
                      <button
                        onClick={() => msg.extractedGuest && onAddGuest(msg.extractedGuest)}
                        className="btn btn-primary btn-md w-full"
                      >
                        <Check className="w-4 h-4" />
                        <span>Lưu vào danh sách</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Expense confirmation card */}
                {msg.actionType === 'add_expense' && msg.extractedExpense && (
                  <div className="w-full card overflow-hidden">
                    <div className="px-4 py-2.5 flex items-center justify-between bg-linear-to-r from-wine-50 to-gold-50 border-b border-stone-100">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-wine-700">
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Khoản chi mới</span>
                      </div>
                      <span className="text-[11px] font-semibold text-stone-600">
                        {EXPENSE_CATEGORY_META[msg.extractedExpense.category || 'khac'].emoji}{' '}
                        {EXPENSE_CATEGORY_META[msg.extractedExpense.category || 'khac'].label}
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="font-semibold text-stone-900 text-sm">{msg.extractedExpense.title}</div>
                      <div className="mt-2.5 grid grid-cols-2 gap-2">
                        <Field icon={<Receipt className="w-3 h-3" />} label="Số tiền" value={formatVnd(msg.extractedExpense.amount || 0)} />
                        <Field
                          icon={<Check className="w-3 h-3" />}
                          label="Đã trả"
                          value={formatVnd(msg.extractedExpense.paidAmount || 0)}
                        />
                      </div>
                      <div className="text-[11px] text-stone-500 mt-2">
                        Người chi: {PAYER_LABEL[msg.extractedExpense.payer || 'chung']}
                        {msg.extractedExpense.note ? ` · ${msg.extractedExpense.note}` : ''}
                      </div>
                    </div>
                    <div className="px-4 pb-4">
                      {msg.resolved ? (
                        <button onClick={() => onNavigateToTab('planner')} className="btn btn-soft btn-md w-full">
                          <Check className="w-4 h-4" />
                          <span>Đã lưu · Xem sổ chi tiêu</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => msg.extractedExpense && onAddExpense?.(msg.extractedExpense, msg.id)}
                          className="btn btn-primary btn-md w-full"
                        >
                          <Check className="w-4 h-4" />
                          <span>Lưu vào sổ chi tiêu</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Prep suggestions card */}
                {msg.actionType === 'prep_suggestion' && msg.suggestedPrepItems && msg.suggestedPrepItems.length > 0 && (
                  <div className="w-full card overflow-hidden">
                    <div className="px-4 py-2.5 flex items-center justify-between bg-gold-50/80 border-b border-gold-100">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gold-700">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Gợi ý chuẩn bị</span>
                      </div>
                      {msg.suggestedPrepItems.some((s) => !addedTemplateKeys.has(s.templateKey)) && (
                        <button
                          className="text-[11px] font-semibold text-wine-700 hover:text-wine-800"
                          onClick={() =>
                            onAddPrepSuggestions?.(msg.suggestedPrepItems!.filter((s) => !addedTemplateKeys.has(s.templateKey)))
                          }
                        >
                          Thêm tất cả
                        </button>
                      )}
                    </div>
                    <ul className="divide-y divide-stone-100">
                      {msg.suggestedPrepItems.map((s) => {
                        const added = addedTemplateKeys.has(s.templateKey);
                        return (
                          <li key={s.templateKey} className="px-4 py-2.5 flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-medium text-stone-900 leading-snug">{s.title}</div>
                              <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">{s.tip}</div>
                              {s.dueDate && (
                                <div className={`text-[10.5px] font-semibold mt-1 ${s.urgency === 'overdue' ? 'text-rose-600' : 'text-stone-500'}`}>
                                  {s.urgency === 'overdue' ? 'Nên làm ngay' : `Nên xong trước ${formatShortDate(s.dueDate)}`}
                                </div>
                              )}
                            </div>
                            <button
                              disabled={added}
                              onClick={() => onAddPrepSuggestions?.([s])}
                              className={`btn btn-icon shrink-0 ${added ? 'bg-emerald-50 text-emerald-600' : 'btn-soft'}`}
                              aria-label={added ? 'Đã thêm vào checklist' : `Thêm ${s.title} vào checklist`}
                            >
                              {added ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    <button
                      onClick={() => onNavigateToTab('planner')}
                      className="w-full py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 border-t border-stone-100 flex items-center justify-center gap-1.5"
                    >
                      <ListChecks className="w-3.5 h-3.5" />
                      Mở checklist chuẩn bị
                    </button>
                  </div>
                )}

                {/* Quick replies */}
                {!isUser && msg.suggestedQuickReplies && msg.suggestedQuickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {msg.suggestedQuickReplies.map((reply, idx) => (
                      <button key={idx} onClick={() => handleQuickReply(reply)} className="chip chip-off hover:border-wine-300 hover:text-wine-700">
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-end gap-2 mt-4 animate-fade-in">
            <Monogram className="w-7 h-7 text-[8px]" />
            <div className="bg-white border border-stone-200/60 rounded-2xl rounded-bl-md shadow-card px-4 py-3 flex items-center gap-2">
              <span className="flex items-center gap-1">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="w-1.5 h-1.5 rounded-full bg-wine-600 animate-bounce-dot"
                    style={{ animationDelay: `${d * 0.15}s` }}
                  />
                ))}
              </span>
              <span className="text-xs text-stone-500">Đang bóc tách & kiểm tra trùng…</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Quick prompts */}
      <div className="shrink-0 px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none snap-row bg-cream border-t border-stone-200/50">
        {QUICK_PROMPTS.map((p) => (
          <button key={p.text} onClick={() => handleQuickReply(p.text)} className="chip chip-off text-[11px] hover:border-wine-300 hover:text-wine-700">
            {p.label}
          </button>
        ))}
      </div>

      {/* Composer */}
      <form onSubmit={handleSubmit} className="shrink-0 px-3 pt-2 pb-safe bg-white/95 backdrop-blur-md border-t border-stone-200/70">
        <div className="flex items-center gap-2 bg-stone-100 rounded-full p-1.5 pl-4 border border-transparent transition-all focus-within:bg-white focus-within:border-wine-300 focus-within:ring-4 focus-within:ring-wine-500/10">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nhắn thông tin khách… (vd: Anh Tuấn bạn ĐH 2 vé)"
            disabled={isLoading}
            className="flex-1 min-w-0 bg-transparent min-h-10 text-sm text-stone-900 placeholder:text-stone-400 outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="btn btn-primary w-10 h-10 min-h-0 px-0 rounded-full shrink-0"
            aria-label="Gửi tin nhắn"
          >
            <Send className="w-4 h-4 -ml-0.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
