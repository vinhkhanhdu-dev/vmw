import React from 'react';
import { MessageSquare, Users, Mail, UtensilsCrossed, Wallet } from 'lucide-react';
import { motion } from 'motion/react';
import { TabId } from '../types';

interface PhoneContainerProps {
  children: React.ReactNode;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  guestCount: number;
  duplicateCount: number;
  plannerAlertCount?: number; // Việc chuẩn bị / khoản chi đến hạn
}

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'chat', label: 'Trợ lý', icon: MessageSquare },
  { id: 'guests', label: 'Khách mời', icon: Users },
  { id: 'invitations', label: 'Thiệp mời', icon: Mail },
  { id: 'tables', label: 'Bàn tiệc', icon: UtensilsCrossed },
  { id: 'planner', label: 'Kế hoạch', icon: Wallet },
];

export const PhoneContainer: React.FC<PhoneContainerProps> = ({
  children,
  activeTab,
  onTabChange,
  guestCount,
  duplicateCount,
  plannerAlertCount = 0,
}) => {
  return (
    <div className="min-h-dvh h-dvh flex items-center justify-center text-stone-900 relative overflow-hidden">
      {/* Ambient backdrop, only visible around the app frame on larger screens */}
      <div className="hidden md:block absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-wine-200/40 blur-3xl" />
        <div className="absolute -bottom-40 -right-20 w-[560px] h-[560px] rounded-full bg-gold-200/50 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md h-dvh md:h-[92vh] md:max-h-[900px] flex flex-col bg-cream overflow-hidden md:rounded-[32px] md:shadow-lift md:ring-1 md:ring-stone-900/5">
        <main className="flex-1 overflow-hidden relative flex flex-col">{children}</main>

        <nav
          className="shrink-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200/70 pb-safe-0"
          aria-label="Điều hướng ứng dụng"
        >
          <div className="grid grid-cols-5 px-1 pt-1.5 pb-1.5">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => onTabChange(id)}
                  className="relative flex flex-col items-center justify-center min-h-[52px] gap-0.5 group"
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="relative flex items-center justify-center w-14 h-7 rounded-full">
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full bg-wine-50"
                        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                      />
                    )}
                    <Icon
                      className={`relative w-[19px] h-[19px] transition-colors ${
                        active ? 'text-wine-700' : 'text-stone-400 group-hover:text-stone-600'
                      }`}
                      strokeWidth={active ? 2.25 : 2}
                    />
                    {id === 'chat' && (
                      <span className="absolute top-0 right-2.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                    {id === 'guests' && guestCount > 0 && (
                      <span className="absolute -top-1 right-0.5 min-w-4 h-4 px-1 rounded-full bg-wine-700 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                        {guestCount}
                      </span>
                    )}
                    {id === 'planner' && plannerAlertCount > 0 && (
                      <span
                        className="absolute -top-1 right-0.5 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white"
                        title={`${plannerAlertCount} việc / khoản chi đến hạn`}
                      >
                        {plannerAlertCount}
                      </span>
                    )}
                    {id === 'guests' && duplicateCount > 0 && (
                      <span
                        className="absolute -top-0.5 left-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"
                        title={`${duplicateCount} cặp nghi trùng`}
                      />
                    )}
                  </span>
                  <span
                    className={`text-[10.5px] font-semibold transition-colors ${
                      active ? 'text-wine-700' : 'text-stone-400 group-hover:text-stone-600'
                    }`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};
