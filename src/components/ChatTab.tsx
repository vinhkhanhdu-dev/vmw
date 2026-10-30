import React, { useState, useRef, useEffect } from 'react';
import { Send, AlertTriangle, UserPlus, Check, Copy, ArrowRight, Sparkles, MessageCircle, RefreshCw, X, ChevronRight, Phone } from 'lucide-react';
import { Guest, ChatMessage, DuplicateCandidate, WeddingInfo } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

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
  onNavigateToTab: (tabId: 'chat' | 'guests' | 'invitations' | 'tables') => void;
  onOpenInvitation: (guest: Guest) => void;
  weddingInfo: WeddingInfo;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onAddGuest,
  onResolveDuplicate,
  onNavigateToTab,
  onOpenInvitation,
  weddingInfo,
}) => {
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
    <div className="flex flex-col h-full bg-[#FAF7F2] text-stone-800 overflow-hidden">
      {/* Bot Chat Header Info strip - Pinned */}
      <div className="px-4 py-2.5 bg-white border-b border-stone-200/80 flex items-center justify-between shadow-xs shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-rose-700 via-rose-800 to-amber-700 flex items-center justify-center text-white shadow-xs">
              <span className="font-serif-wedding font-bold text-xs tracking-wider">MV</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold text-stone-900">Mỹ Vinh AI</h2>
              <span className="text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200/60 px-1.5 py-0.2 rounded-full">Trợ lý cưới</span>
            </div>
            <p className="text-[11px] text-stone-500">Tự động lập danh sách · Báo trùng lặp</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <PWAInstallButton />
          <button
            onClick={() => onNavigateToTab('guests')}
            className="text-xs font-medium text-rose-800 hover:text-rose-900 bg-rose-50 hover:bg-rose-100/80 px-2.5 py-1.5 rounded-lg border border-rose-200/60 transition-colors flex items-center gap-1 min-h-[36px]"
          >
            <span>Danh sách</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4 overscroll-contain">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              {/* Message Bubble */}
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[88%] shadow-xs break-words ${
                  isUser
                    ? 'bg-rose-800 text-white rounded-br-xs'
                    : 'bg-white text-stone-800 border border-stone-200/70 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-line text-[13.5px]">{msg.text}</div>

                <div
                  className={`text-[10px] mt-1 text-right ${
                    isUser ? 'text-rose-200/80' : 'text-stone-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {/* Duplicate Warning Card */}
              {msg.actionType === 'duplicate_warning' && msg.duplicateCandidates && msg.duplicateCandidates.length > 0 && (
                <div className="w-full max-w-[95%] mt-2.5 bg-amber-50/90 border-2 border-amber-300 rounded-xl p-3.5 shadow-sm text-stone-900">
                  <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs mb-2 pb-1.5 border-b border-amber-200/70">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>PHÁT HIỆN TRÙNG LẶP TIỀM ẨN</span>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200 text-xs">
                      <div className="text-[11px] font-medium text-stone-500 mb-1">Đã có trong danh sách:</div>
                      {msg.duplicateCandidates.map((cand, idx) => (
                        <div key={idx} className="flex flex-col gap-0.5">
                          <div className="font-semibold text-stone-900 flex items-center justify-between">
                            <span>{cand.existingGuest.name}</span>
                            <span className="text-[10px] text-amber-700 font-mono bg-amber-100 px-1.5 py-0.5 rounded">
                              Trùng {cand.similarityScore}%
                            </span>
                          </div>
                          <div className="text-stone-600 text-[11px] flex flex-wrap gap-x-2">
                            <span>{cand.existingGuest.relationshipDetail}</span>
                            <span>·</span>
                            <span>{cand.existingGuest.count} suất</span>
                            <span>·</span>
                            <span>{cand.existingGuest.side === 'nha_trai' ? 'Nhà Trai' : cand.existingGuest.side === 'nha_gai' ? 'Nhà Gái' : 'Chung'}</span>
                            {cand.existingGuest.phone && (
                              <>
                                <span>·</span>
                                <span className="font-mono">{cand.existingGuest.phone}</span>
                              </>
                            )}
                          </div>
                          <div className="text-[10px] text-amber-800 italic mt-0.5">
                            Lý do: {cand.reason}
                          </div>
                        </div>
                      ))}
                    </div>

                    {msg.extractedGuest && (
                      <div className="bg-amber-100/60 p-2.5 rounded-lg border border-amber-300/80 text-xs">
                        <div className="text-[11px] font-medium text-amber-900 mb-0.5">Thông tin bạn vừa nhắn:</div>
                        <div className="font-semibold text-stone-900">
                          {msg.extractedGuest.name} ({msg.extractedGuest.relationshipDetail || 'Khách'}, {msg.extractedGuest.count || 1} người)
                        </div>
                        {msg.extractedGuest.phone && (
                          <div className="text-[11px] text-stone-600 font-mono">SĐT: {msg.extractedGuest.phone}</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Resolution Buttons */}
                  {!msg.resolved ? (
                    <div className="flex flex-col sm:flex-row gap-1.5 pt-1">
                      <button
                        onClick={() =>
                          msg.extractedGuest &&
                          msg.duplicateCandidates &&
                          onResolveDuplicate(
                            'merge',
                            msg.extractedGuest,
                            msg.duplicateCandidates[0].existingGuest,
                            msg.id
                          )
                        }
                        className="flex-1 min-h-[40px] px-3 py-2 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Gộp & Cập nhật</span>
                      </button>

                      <button
                        onClick={() =>
                          msg.extractedGuest &&
                          onResolveDuplicate('keep_both', msg.extractedGuest, undefined, msg.id)
                        }
                        className="flex-1 min-h-[40px] px-3 py-2 bg-white hover:bg-stone-50 active:scale-[0.98] text-stone-700 border border-stone-300 font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Khách khác (Vẫn thêm)</span>
                      </button>

                      <button
                        onClick={() =>
                          onResolveDuplicate('cancel', {}, undefined, msg.id)
                        }
                        className="min-h-[40px] px-2.5 py-2 bg-transparent text-stone-500 hover:text-stone-700 text-xs rounded-lg flex items-center justify-center transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Hủy</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md py-1.5 px-2.5 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã xử lý thông tin trùng lặp</span>
                    </div>
                  )}
                </div>
              )}

              {/* New Extracted Guest Confirmation Card */}
              {msg.actionType === 'add_guest' && msg.extractedGuest && (
                <div className="w-full max-w-[95%] mt-2.5 bg-white border border-rose-200/90 rounded-xl p-3.5 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-900">
                      <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                      <span>THÔNG TIN BÓC TÁCH ĐƯỢC</span>
                    </div>
                    <span className="text-[10px] font-medium bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200/60">
                      {msg.extractedGuest.side === 'nha_trai'
                        ? 'Nhà Trai'
                        : msg.extractedGuest.side === 'nha_gai'
                        ? 'Nhà Gái'
                        : 'Chung'}
                    </span>
                  </div>

                  <div className="py-2.5 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-[11px] text-stone-500">Họ tên / Danh xưng:</div>
                      <div className="font-semibold text-stone-900 text-[13px]">{msg.extractedGuest.name}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-stone-500">Mối quan hệ:</div>
                      <div className="font-medium text-stone-800">{msg.extractedGuest.relationshipDetail || 'Bạn bè'}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-stone-500">Số lượng tham dự:</div>
                      <div className="font-semibold text-stone-900">{msg.extractedGuest.count || 1} người (suất cỗ)</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-stone-500">Số điện thoại:</div>
                      <div className="font-mono text-stone-800">{msg.extractedGuest.phone || 'Chưa có'}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex gap-2">
                    <button
                      onClick={() => msg.extractedGuest && onAddGuest(msg.extractedGuest)}
                      className="flex-1 min-h-[42px] px-3 py-2 bg-rose-800 hover:bg-rose-900 active:scale-[0.98] text-white font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Xác nhận lưu vào danh sách</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Reply Chips from Bot Message */}
              {!isUser && msg.suggestedQuickReplies && msg.suggestedQuickReplies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[95%]">
                  {msg.suggestedQuickReplies.map((reply, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickReply(reply)}
                      className="text-xs bg-white hover:bg-rose-50 text-stone-700 hover:text-rose-800 border border-stone-200/80 hover:border-rose-300 rounded-lg px-2.5 py-1.5 transition-all shadow-2xs active:scale-95 text-left"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-stone-500 text-xs py-2 px-3 bg-white rounded-xl border border-stone-200/70 w-fit shadow-xs">
            <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
            <span>Mỹ Vinh đang bóc tách thông tin & kiểm tra trùng...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Carousel */}
      <div className="px-3 pt-2 pb-1 bg-stone-50 border-t border-stone-200/70 overflow-x-auto scrollbar-none flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => handleQuickReply('Mời anh Nam bạn cấp 3 đi 2 người')}
          className="whitespace-nowrap shrink-0 text-[11px] font-medium bg-white text-stone-700 border border-stone-200 rounded-full px-2.5 py-1 hover:border-rose-300 hover:text-rose-700 transition-colors"
        >
          💬 Mời anh Nam (2 người)
        </button>
        <button
          onClick={() => handleQuickReply('Chị Hương đồng nghiệp Tech 0987654321, nhà gái')}
          className="whitespace-nowrap shrink-0 text-[11px] font-medium bg-white text-stone-700 border border-stone-200 rounded-full px-2.5 py-1 hover:border-rose-300 hover:text-rose-700 transition-colors"
        >
          💬 Chị Hương Tech (Nhà gái)
        </button>
        <button
          onClick={() => handleQuickReply('Bác Tuấn họ nội ở quê, 3 suất')}
          className="whitespace-nowrap shrink-0 text-[11px] font-medium bg-white text-stone-700 border border-stone-200 rounded-full px-2.5 py-1 hover:border-rose-300 hover:text-rose-700 transition-colors"
        >
          💬 Bác Tuấn họ nội (Test trùng)
        </button>
        <button
          onClick={() => handleQuickReply('Kiểm tra trùng lặp')}
          className="whitespace-nowrap shrink-0 text-[11px] font-medium bg-white text-stone-700 border border-stone-200 rounded-full px-2.5 py-1 hover:border-rose-300 hover:text-rose-700 transition-colors"
        >
          🔍 Quét trùng toàn bộ
        </button>
        <button
          onClick={() => handleQuickReply('Tổng kết cỗ & khách')}
          className="whitespace-nowrap shrink-0 text-[11px] font-medium bg-white text-stone-700 border border-stone-200 rounded-full px-2.5 py-1 hover:border-rose-300 hover:text-rose-700 transition-colors"
        >
          📊 Tổng kết mâm cỗ
        </button>
      </div>

      {/* Input Form with Mobile Thumb-Zone Ergonomics */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-white border-t border-stone-200/80 flex items-center gap-2 shrink-0 pb-safe"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Nhắn thông tin khách... (ví dụ: Anh Tuấn bạn ĐH 2 vé)"
          disabled={isLoading}
          className="flex-1 min-h-[44px] px-3.5 py-2.5 bg-stone-100 hover:bg-stone-50 focus:bg-white text-sm text-stone-900 placeholder:text-stone-400 rounded-xl border border-stone-200 focus:border-rose-600 focus:outline-hidden transition-all"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="min-h-[44px] min-w-[44px] bg-rose-800 hover:bg-rose-900 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl flex items-center justify-center transition-all shadow-xs"
          aria-label="Gửi tin nhắn"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
