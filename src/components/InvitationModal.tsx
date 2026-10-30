import React, { useState } from 'react';
import { X, Copy, Check, Share2, Sparkles, Heart, Calendar, Clock, MapPin } from 'lucide-react';
import { Guest, WeddingInfo } from '../types';
import { generateInvitationMessage } from '../utils/vietnameseNlp';

interface InvitationModalProps {
  guest: Guest | null;
  weddingInfo: WeddingInfo;
  onClose: () => void;
  onSelectAnotherGuest?: (guest: Guest) => void;
  allGuests?: Guest[];
}

export const InvitationModal: React.FC<InvitationModalProps> = ({
  guest,
  weddingInfo,
  onClose,
  allGuests = [],
}) => {
  const [selectedStyleIndex, setSelectedStyleIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [activeGuest, setActiveGuest] = useState<Guest | null>(guest);

  if (!activeGuest) return null;

  const styles = generateInvitationMessage(activeGuest, weddingInfo);
  const activeMessage = styles[selectedStyleIndex]?.message || '';

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
          title: `Thiệp cưới ${weddingInfo.groomName} & ${weddingInfo.brideName}`,
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-3.5 border-b border-stone-200 flex items-center justify-between bg-[#FDFBF7]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-800 text-white flex items-center justify-center">
              <Heart className="w-4 h-4 fill-rose-200 text-rose-200" />
            </div>
            <div>
              <h2 className="font-semibold text-stone-900 text-sm">Soạn Lời Mời Cưới</h2>
              <p className="text-[11px] text-stone-500">Gửi cho {activeGuest.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guest Selector & Tone Tabs */}
        <div className="p-3 bg-stone-50 border-b border-stone-200 space-y-2">
          {/* Guest Selector if multiple */}
          {allGuests.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-stone-500 whitespace-nowrap">Khách:</span>
              <select
                value={activeGuest.id}
                onChange={(e) => {
                  const found = allGuests.find((g) => g.id === e.target.value);
                  if (found) setActiveGuest(found);
                }}
                className="flex-1 bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-stone-800 text-xs focus:outline-hidden focus:border-rose-600 truncate"
              >
                {allGuests.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.relationshipDetail} - {g.count} suất)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tone Selector */}
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {styles.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedStyleIndex(idx)}
                className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  selectedStyleIndex === idx
                    ? 'bg-rose-800 text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'
                }`}
              >
                {idx === 0 ? 'Thân mật' : idx === 1 ? 'Trang trọng' : 'Lịch sự'}
              </button>
            ))}
          </div>
        </div>

        {/* Invitation Preview Card */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-stone-100/60">
          <div className="bg-[#FCF9F2] border-2 border-[#D4AF37]/50 rounded-2xl p-5 shadow-sm relative overflow-hidden text-center space-y-3">
            {/* Corner Decorative Ornaments */}
            <div className="absolute top-2 left-2 text-[#D4AF37]/40 text-xs">✤</div>
            <div className="absolute top-2 right-2 text-[#D4AF37]/40 text-xs">✤</div>
            <div className="absolute bottom-2 left-2 text-[#D4AF37]/40 text-xs">✤</div>
            <div className="absolute bottom-2 right-2 text-[#D4AF37]/40 text-xs">✤</div>

            <div className="text-[10px] uppercase tracking-widest text-[#9E1B32] font-semibold">
              — THIỆP MỜI BÁO HỶ —
            </div>

            <div className="font-serif-wedding text-2xl font-bold text-stone-900 tracking-wide">
              {weddingInfo.groomName} & {weddingInfo.brideName}
            </div>

            <div className="text-xs text-stone-600 italic">
              Trân trọng kính mời:
            </div>

            <div className="text-base font-bold text-[#9E1B32] bg-rose-50/70 border border-rose-200/50 py-1.5 px-3 rounded-xl inline-block max-w-full truncate">
              {activeGuest.name}
            </div>

            {/* Wedding Meta */}
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
                <span className="font-semibold text-[11px] truncate max-w-[80px]">Melisa Center</span>
              </div>
            </div>

            {/* Message Body */}
            <div className="text-left text-xs text-stone-800 leading-relaxed whitespace-pre-line bg-white/80 p-3 rounded-xl border border-stone-200/60 font-sans">
              {activeMessage}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-3 border-t border-stone-200 bg-white flex gap-2">
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
                <span>Sao chép lời mời</span>
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            className="min-h-[44px] px-4 py-2 bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
            title="Chia sẻ nhanh"
          >
            <Share2 className="w-4 h-4" />
            <span>Chia sẻ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
