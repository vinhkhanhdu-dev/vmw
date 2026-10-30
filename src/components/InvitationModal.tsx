import React, { useState } from 'react';
import { Copy, Check, Share2, Heart } from 'lucide-react';
import { Guest, WeddingInfo } from '../types';
import { generateInvitationMessage } from '../utils/vietnameseNlp';
import { Modal, IconTile } from './ui';
import { InvitationCard } from './InvitationCard';

interface InvitationModalProps {
  guest: Guest | null;
  weddingInfo: WeddingInfo;
  onClose: () => void;
  onSelectAnotherGuest?: (guest: Guest) => void;
  allGuests?: Guest[];
}

const TONE_LABELS = ['Thân mật', 'Trang trọng', 'Lịch sự'];

export const InvitationModal: React.FC<InvitationModalProps> = ({ guest, weddingInfo, onClose, allGuests = [] }) => {
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
    <Modal
      open
      onClose={onClose}
      title="Soạn lời mời"
      subtitle={`Gửi cho ${activeGuest.name}`}
      icon={
        <IconTile className="bg-wine-50 text-wine-700">
          <Heart className="w-[18px] h-[18px] fill-wine-700" />
        </IconTile>
      }
      footer={
        <div className="flex gap-2">
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
          <button onClick={handleShare} className="btn btn-secondary btn-md px-5" title="Chia sẻ nhanh">
            <Share2 className="w-4 h-4" />
            <span>Chia sẻ</span>
          </button>
        </div>
      }
    >
      <div className="p-4 space-y-3 bg-cream/60">
        {allGuests.length > 1 && (
          <select
            value={activeGuest.id}
            onChange={(e) => {
              const found = allGuests.find((g) => g.id === e.target.value);
              if (found) setActiveGuest(found);
            }}
            className="field field-sm select font-medium"
            aria-label="Chọn khách mời"
          >
            {allGuests.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.relationshipDetail} · {g.count} suất)
              </option>
            ))}
          </select>
        )}

        <div className="seg bg-white border border-stone-200/70">
          {styles.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedStyleIndex(idx)}
              className={`seg-btn ${selectedStyleIndex === idx ? 'seg-on bg-stone-100' : ''}`}
            >
              {TONE_LABELS[idx] ?? `Mẫu ${idx + 1}`}
            </button>
          ))}
        </div>

        <InvitationCard guestName={activeGuest.name} weddingInfo={weddingInfo} message={activeMessage} />
      </div>
    </Modal>
  );
};
