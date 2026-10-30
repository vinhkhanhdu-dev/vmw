import React, { useState } from 'react';
import { Mail, Copy, Check, Share2, Sparkles, Heart, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Guest, WeddingInfo } from '../types';
import { generateInvitationMessage } from '../utils/vietnameseNlp';

interface InvitationsTabProps {
  guests: Guest[];
  weddingInfo: WeddingInfo;
  onOpenInvitationModal: (guest: Guest) => void;
}

export const InvitationsTab: React.FC<InvitationsTabProps> = ({
  guests,
  weddingInfo,
  onOpenInvitationModal,
}) => {
  const [selectedGuestId, setSelectedGuestId] = useState<string>(guests[0]?.id || '');
  const [selectedToneIndex, setSelectedToneIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentGuest = guests.find((g) => g.id === selectedGuestId) || guests[0] || {
    id: 'preview',
    name: 'Bạn Thân Yêu',
    relationshipCategory: 'ban_be',
    relationshipDetail: 'Bạn bè',
    side: 'chung',
    count: 2,
    status: 'chua_gui',
    createdAt: '',
    updatedAt: '',
  };

  const templates = generateInvitationMessage(currentGuest, weddingInfo);
  const activeMessage = templates[selectedToneIndex]?.message || '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Thiệp Cưới ${weddingInfo.groomName} & ${weddingInfo.brideName}`,
          text: activeMessage,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF7F2] text-stone-800 overflow-hidden">
      {/* Header - Pinned Top Bar */}
      <div className="p-4 bg-white border-b border-stone-200/80 shrink-0 z-10 shadow-2xs">
        <h1 className="text-base font-semibold text-stone-900 flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-rose-700 fill-rose-700" />
          <span>Soạn Thiệp & Lời Mời Cưới</span>
        </h1>
        <p className="text-[11px] text-stone-500">
          Tự động điều chỉnh lời văn phù hợp với bạn bè, họ hàng và đồng nghiệp
        </p>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 overscroll-contain pb-8">
        {/* Recipient Picker */}
        <div className="bg-white p-3 rounded-xl border border-stone-200/80 shadow-2xs space-y-1.5">
          <label className="text-xs font-semibold text-stone-800 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-rose-700" />
            <span>Chọn khách mời muốn gửi:</span>
          </label>
          <select
            value={selectedGuestId}
            onChange={(e) => setSelectedGuestId(e.target.value)}
            className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:border-rose-600 font-medium"
          >
            {guests.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} · {g.relationshipDetail} ({g.count} suất - {g.side === 'nha_trai' ? 'Nhà Trai' : 'Nhà Gái'})
              </option>
            ))}
          </select>
        </div>

        {/* Tone Selector */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setSelectedToneIndex(0)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              selectedToneIndex === 0
                ? 'bg-rose-800 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            Thân mật (Bạn bè)
          </button>
          <button
            onClick={() => setSelectedToneIndex(1)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              selectedToneIndex === 1
                ? 'bg-rose-800 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            Trang trọng (Họ hàng)
          </button>
          <button
            onClick={() => setSelectedToneIndex(2)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              selectedToneIndex === 2
                ? 'bg-rose-800 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            Lịch sự (Công ty)
          </button>
        </div>

        {/* Virtual Card Graphic */}
        <div className="bg-[#FCF9F2] border-2 border-[#D4AF37]/50 rounded-2xl p-5 shadow-sm text-center relative space-y-3">
          <div className="text-[10px] uppercase tracking-widest text-[#9E1B32] font-semibold">
            — LỄ THÀNH HÔN —
          </div>

          <div className="font-serif-wedding text-2xl font-bold text-stone-900 tracking-wide">
            {weddingInfo.groomName} & {weddingInfo.brideName}
          </div>

          <div className="text-xs text-stone-600 italic">
            Trân trọng kính mời:
          </div>

          <div className="text-sm font-bold text-[#9E1B32] bg-rose-50 border border-rose-200/60 py-1.5 px-3 rounded-xl inline-block max-w-full truncate">
            {currentGuest.name}
          </div>

          <div className="grid grid-cols-3 gap-1 py-2 border-y border-[#D4AF37]/30 text-stone-700 text-xs">
            <div className="flex flex-col items-center">
              <Calendar className="w-3.5 h-3.5 text-[#9E1B32] mb-0.5" />
              <span className="font-semibold text-[11px]">{weddingInfo.weddingDate}</span>
            </div>
            <div className="flex flex-col items-center border-x border-[#D4AF37]/20">
              <Clock className="w-3.5 h-3.5 text-[#9E1B32] mb-0.5" />
              <span className="font-semibold text-[11px]">{weddingInfo.ceremonyTime}</span>
            </div>
            <div className="flex flex-col items-center">
              <MapPin className="w-3.5 h-3.5 text-[#9E1B32] mb-0.5" />
              <span className="font-semibold text-[11px] truncate max-w-[80px]">Melisa</span>
            </div>
          </div>

          <div className="text-left text-xs text-stone-800 leading-relaxed whitespace-pre-line bg-white/80 p-3 rounded-xl border border-stone-200/60">
            {activeMessage}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pb-6">
          <button
            onClick={handleCopy}
            className="flex-1 min-h-[44px] px-3 py-2 bg-rose-800 hover:bg-rose-900 active:scale-95 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Đã sao chép!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Sao chép tin nhắn Zalo/SMS</span>
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            className="min-h-[44px] px-4 py-2 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
          >
            <Share2 className="w-4 h-4 text-stone-600" />
            <span>Gửi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
