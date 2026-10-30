import React, { useState } from 'react';
import { Copy, Check, Share2, Users, Heart } from 'lucide-react';
import { Guest, WeddingInfo } from '../types';
import { generateInvitationMessage } from '../utils/vietnameseNlp';
import { TabHeader, SIDE_LABEL } from './ui';
import { InvitationCard } from './InvitationCard';

interface InvitationsTabProps {
  guests: Guest[];
  weddingInfo: WeddingInfo;
  onOpenInvitationModal: (guest: Guest) => void;
}

const TONE_LABELS = ['Thân mật', 'Trang trọng', 'Lịch sự'];

export const InvitationsTab: React.FC<InvitationsTabProps> = ({ guests, weddingInfo }) => {
  const [selectedGuestId, setSelectedGuestId] = useState<string>(guests[0]?.id || '');
  const [selectedToneIndex, setSelectedToneIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentGuest: Guest = guests.find((g) => g.id === selectedGuestId) ||
    guests[0] || {
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
  const activeTemplate = templates[selectedToneIndex];
  const activeMessage = activeTemplate?.message || '';

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
    <div className="flex flex-col h-full bg-cream text-stone-800 overflow-hidden">
      <TabHeader
        title="Thiệp mời"
        subtitle="Lời mời tự điều chỉnh theo từng mối quan hệ"
        leading={
          <div className="w-10 h-10 rounded-full bg-wine-50 text-wine-700 flex items-center justify-center shrink-0">
            <Heart className="w-[18px] h-[18px] fill-wine-700" />
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain pb-8">
        {/* Recipient */}
        <div className="card p-3.5 space-y-2">
          <label className="label mb-0 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-wine-700" />
            <span>Người nhận</span>
          </label>
          <select
            value={selectedGuestId}
            onChange={(e) => setSelectedGuestId(e.target.value)}
            className="field field-sm select font-medium"
            disabled={guests.length === 0}
          >
            {guests.length === 0 && <option value="">Chưa có khách mời</option>}
            {guests.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} · {g.relationshipDetail} ({g.count} suất · {SIDE_LABEL[g.side]})
              </option>
            ))}
          </select>
        </div>

        {/* Tone */}
        <div className="space-y-1.5">
          <div className="seg">
            {TONE_LABELS.map((label, idx) => (
              <button
                key={label}
                onClick={() => setSelectedToneIndex(idx)}
                className={`seg-btn ${selectedToneIndex === idx ? 'seg-on' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
          {activeTemplate?.style && <p className="text-[11px] text-stone-500 text-center">{activeTemplate.style}</p>}
        </div>

        <InvitationCard guestName={currentGuest.name} weddingInfo={weddingInfo} message={activeMessage} />

        {/* Actions */}
        <div className="flex gap-2 pb-4">
          <button onClick={handleCopy} className="btn btn-primary btn-md flex-1">
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Đã sao chép</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Sao chép lời mời</span>
              </>
            )}
          </button>
          <button onClick={handleShare} className="btn btn-secondary btn-md px-5">
            <Share2 className="w-4 h-4" />
            <span>Gửi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
