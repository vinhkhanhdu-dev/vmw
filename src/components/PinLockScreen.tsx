import React, { useState } from 'react';
import { Lock, Delete, ShieldCheck } from 'lucide-react';
import { WeddingInfo } from '../types';
import { Monogram } from './ui';
import { API_BASE } from '../utils/api';

interface PinLockScreenProps {
  onUnlockSuccess: () => void;
  weddingInfo?: WeddingInfo;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ onUnlockSuccess, weddingInfo }) => {
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleNumberClick = (digit: string) => {
    if (pin.length >= 4 || isChecking) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setIsError(false);
    setErrorMessage('');

    if (nextPin.length === 4) {
      verifyCode(nextPin);
    }
  };

  const handleDelete = () => {
    if (isChecking) return;
    setPin((prev) => prev.slice(0, -1));
    setIsError(false);
    setErrorMessage('');
  };

  const verifyCode = async (code: string) => {
    setIsChecking(true);

    // Direct check for required 0610 and server verification
    try {
      const res = await fetch(API_BASE + '/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: code }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('myvinh_unlocked', 'true');
        onUnlockSuccess();
        return;
      }
    } catch {
      // Local fallback check
      if (code === '0610') {
        sessionStorage.setItem('myvinh_unlocked', 'true');
        onUnlockSuccess();
        return;
      }
    }

    // If incorrect
    if (code === '0610') {
      sessionStorage.setItem('myvinh_unlocked', 'true');
      onUnlockSuccess();
      return;
    }

    setIsError(true);
    setErrorMessage('Mã PIN không đúng. Vui lòng nhập lại!');
    setTimeout(() => {
      setPin('');
      setIsChecking(false);
    }, 400);
  };

  const keyClass =
    'h-[62px] rounded-2xl bg-white/90 backdrop-blur border border-white shadow-card text-xl font-semibold text-stone-800 flex items-center justify-center transition-all hover:bg-white active:bg-wine-50 active:scale-95';

  return (
    <div className="fixed inset-0 z-50 bg-cream flex flex-col items-center justify-between px-6 pt-10 pb-6 select-none overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[480px] h-[480px] rounded-full bg-wine-200/50 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-24 w-[380px] h-[380px] rounded-full bg-gold-200/60 blur-3xl pointer-events-none" />

      {/* Brand */}
      <div className="relative flex flex-col items-center text-center animate-fade-up">
        <Monogram className="w-20 h-20 text-xl" />
        <div className="eyebrow mt-5">Trợ lý mời cưới</div>
        <h1 className="font-serif text-3xl text-stone-900 mt-1.5 leading-tight">
          {weddingInfo?.groomName || 'Mỹ'}
          <span className="italic text-gold-500 text-2xl mx-1.5">&</span>
          {weddingInfo?.brideName || 'Vinh'}
        </h1>
        <p className="text-xs text-stone-500 mt-2 max-w-[250px]">
          Quản lý khách mời, thiệp cưới và bàn tiệc trong một nơi.
        </p>
      </div>

      {/* PIN indicator */}
      <div className="relative flex flex-col items-center gap-4 my-auto">
        <div className="flex items-center gap-1.5 text-xs font-medium text-stone-600">
          <Lock className="w-3.5 h-3.5 text-wine-700" />
          <span>Nhập mã PIN để mở khóa</span>
        </div>

        <div className={`flex items-center gap-4 ${isError ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  isError
                    ? 'bg-wine-100 border-2 border-wine-400'
                    : isFilled
                    ? 'bg-wine-700 scale-110 shadow-wine'
                    : 'bg-white border-2 border-stone-300'
                }`}
              />
            );
          })}
        </div>

        <div className="h-7">
          {errorMessage && (
            <div className="text-xs font-medium text-wine-700 bg-wine-50 border border-wine-200 px-3 py-1 rounded-full animate-fade-in">
              {errorMessage}
            </div>
          )}
        </div>
      </div>

      {/* Keypad */}
      <div className="relative w-full max-w-[290px] grid grid-cols-3 gap-3 mb-5">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button key={digit} onClick={() => handleNumberClick(digit)} className={keyClass}>
            {digit}
          </button>
        ))}

        <div className="h-[62px]" />

        <button onClick={() => handleNumberClick('0')} className={keyClass}>
          0
        </button>

        <button
          onClick={handleDelete}
          disabled={pin.length === 0}
          className="h-[62px] rounded-2xl text-stone-500 hover:bg-white/60 active:scale-95 disabled:opacity-20 flex items-center justify-center transition-all"
          aria-label="Xóa ký tự"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      <div className="relative flex items-center gap-1.5 text-[11px] text-stone-400">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Bảo mật bằng mã PIN · Dữ liệu đồng bộ MongoDB</span>
      </div>
    </div>
  );
};
