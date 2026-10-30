import React from 'react';
import {
  MessageSquare,
  Users,
  Mail,
  UtensilsCrossed,
} from 'lucide-react';
import { WeddingInfo } from '../types';

interface PhoneContainerProps {
  children: React.ReactNode;
  activeTab: 'chat' | 'guests' | 'invitations' | 'tables';
  onTabChange: (tab: 'chat' | 'guests' | 'invitations' | 'tables') => void;
  guestCount: number;
  duplicateCount: number;
  weddingInfo: WeddingInfo;
}

export const PhoneContainer: React.FC<PhoneContainerProps> = ({
  children,
  activeTab,
  onTabChange,
  guestCount,
  duplicateCount,
  weddingInfo,
}) => {
  return (
    <div className="min-h-dvh h-dvh bg-stone-100 flex flex-col items-center justify-center text-stone-900">
      {/* Clean Application Frame without any simulated phone notches, bezels or status bars */}
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl h-dvh md:h-[94vh] md:max-h-[920px] flex flex-col bg-white overflow-hidden md:rounded-2xl md:shadow-xl md:border md:border-stone-200/90 relative">
        {/* Dynamic Content Body */}
        <main className="flex-1 overflow-hidden relative flex flex-col">
          {children}
        </main>

        {/* Clean Bottom Tab Bar (App Navigation) */}
        <nav
          className="bg-white/95 backdrop-blur-md border-t border-stone-200/90 grid grid-cols-4 items-center shrink-0 z-30 pb-safe shadow-xs"
          aria-label="Điều hướng ứng dụng"
        >
          {/* Tab 1: Chatbot AI */}
          <button
            onClick={() => onTabChange('chat')}
            className={`min-h-[54px] flex flex-col items-center justify-center transition-colors relative cursor-pointer ${
              activeTab === 'chat' ? 'text-rose-800' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <div className="relative">
              <MessageSquare className="w-5 h-5" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full" />
            </div>
            <span className="text-[10px] font-semibold tracking-tight mt-1">Trợ Lý Chat</span>
          </button>

          {/* Tab 2: Guest List */}
          <button
            onClick={() => onTabChange('guests')}
            className={`min-h-[54px] flex flex-col items-center justify-center transition-colors relative cursor-pointer ${
              activeTab === 'guests' ? 'text-rose-800' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <div className="relative">
              <Users className="w-5 h-5" />
              {guestCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-rose-800 text-white text-[9px] font-bold px-1 rounded-full font-mono">
                  {guestCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold tracking-tight mt-1">
              Danh Sách {duplicateCount > 0 && `(⚠️)`}
            </span>
          </button>

          {/* Tab 3: Invitations */}
          <button
            onClick={() => onTabChange('invitations')}
            className={`min-h-[54px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
              activeTab === 'invitations' ? 'text-rose-800' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <Mail className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-tight mt-1">Mẫu Thiệp</span>
          </button>

          {/* Tab 4: Tables & Stats */}
          <button
            onClick={() => onTabChange('tables')}
            className={`min-h-[54px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
              activeTab === 'tables' ? 'text-rose-800' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <UtensilsCrossed className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-tight mt-1">Bàn & Cỗ</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
