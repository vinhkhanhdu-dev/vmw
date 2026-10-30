import React from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { WeddingInfo } from '../types';

interface InvitationCardProps {
  guestName: string;
  weddingInfo: WeddingInfo;
  message: string;
}

const Meta: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex flex-col items-center gap-1 min-w-0 px-1">
    <span className="text-wine-700">{icon}</span>
    <span className="text-[9.5px] uppercase tracking-wider text-stone-400 font-semibold">{label}</span>
    <span className="text-[11.5px] font-semibold text-stone-800 truncate max-w-full">{value}</span>
  </div>
);

/** Wedding invitation preview, shared by the Invitations tab and the invitation modal. */
export const InvitationCard: React.FC<InvitationCardProps> = ({ guestName, weddingInfo, message }) => {
  const venueShort = weddingInfo.venueName.replace(/^Trung Tâm Tiệc Cưới\s*/i, '');

  return (
    <div
      className="rounded-3xl p-[3px] shadow-soft"
      style={{
        background: 'linear-gradient(135deg, #ead9a6 0%, #c2923a 40%, #ead9a6 70%, #a4752e 100%)',
      }}
    >
      <div className="relative rounded-[21px] bg-ivory px-5 pt-6 pb-5 text-center overflow-hidden">
        <div className="absolute inset-2 rounded-2xl border border-gold-300/60 pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-wine-100/50 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-gold-100/70 blur-2xl pointer-events-none" />

        <div className="relative">
          <div className="eyebrow">Lễ Thành Hôn</div>
          <div className="text-gold-500 text-xl leading-none my-1.5">❧</div>

          <div className="font-serif text-[26px] leading-tight text-stone-900">
            {weddingInfo.groomName}
            <span className="font-serif italic text-gold-500 text-xl mx-1.5">&</span>
            {weddingInfo.brideName}
          </div>

          <p className="text-xs italic text-stone-500 mt-4">Trân trọng kính mời</p>
          <div className="mt-1 inline-block max-w-full truncate font-serif text-lg text-wine-700 border-b border-gold-300 px-3 pb-0.5">
            {guestName}
          </div>

          <div className="mt-4 grid grid-cols-3 divide-x divide-gold-200/80 py-3 border-y border-gold-200/80">
            <Meta icon={<Calendar className="w-4 h-4" />} label="Ngày" value={weddingInfo.weddingDate} />
            <Meta icon={<Clock className="w-4 h-4" />} label="Giờ" value={weddingInfo.ceremonyTime} />
            <Meta icon={<MapPin className="w-4 h-4" />} label="Nơi" value={venueShort} />
          </div>

          <div className="mt-4 text-left text-[12.5px] leading-relaxed text-stone-700 whitespace-pre-line bg-white/70 rounded-xl p-3.5 border border-gold-100">
            {message}
          </div>
        </div>
      </div>
    </div>
  );
};
