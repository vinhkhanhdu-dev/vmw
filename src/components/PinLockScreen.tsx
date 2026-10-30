import React, { useState } from 'react';
import { Lock, Delete, Heart, CheckCircle2, ShieldCheck } from 'lucide-react';

interface PinLockScreenProps {
  onUnlockSuccess: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ onUnlockSuccess }) => {
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
      const res = await fetch('/api/auth/verify-pin', {
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

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF7F2] flex flex-col items-center justify-between p-6 select-none font-sans">
      {/* Top Header & Brand */}
      <div className="flex flex-col items-center mt-8 space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-linear-to-br from-rose-700 via-rose-800 to-amber-700 flex items-center justify-center text-white shadow-md">
          <span className="font-serif-wedding font-bold text-xl tracking-wider">MV</span>
        </div>

        <div className="text-center">
          <h1 className="font-serif-wedding text-xl font-bold text-stone-900 tracking-wide flex items-center justify-center gap-1.5">
            <span>Mỹ Vinh</span>
            <Heart className="w-3.5 h-3.5 text-rose-700 fill-rose-700" />
          </h1>
          <p className="text-xs text-stone-500 mt-1">Trợ lý quản lý khách mời đám cưới</p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-stone-600 bg-white px-3 py-1.5 rounded-full border border-stone-200/80 shadow-2xs mt-2">
          <Lock className="w-3.5 h-3.5 text-rose-800" />
          <span>Ứng dụng được bảo vệ bằng mã PIN</span>
        </div>
      </div>

      {/* Center PIN Dots Display */}
      <div className="flex flex-col items-center space-y-4 my-auto">
        <div className={`flex items-center gap-4 transition-transform ${isError ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-rose-800 scale-110 shadow-xs'
                    : 'border-2 border-stone-300 bg-white'
                } ${isError ? 'border-rose-600 bg-rose-100' : ''}`}
              />
            );
          })}
        </div>

        {errorMessage && (
          <div className="text-xs font-medium text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 animate-in fade-in duration-200">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Numeric Keypad (Touch Ergonomics >= 64px) */}
      <div className="w-full max-w-[280px] grid grid-cols-3 gap-3 mb-6">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            onClick={() => handleNumberClick(digit)}
            className="w-full h-16 rounded-2xl bg-white hover:bg-stone-50 active:bg-rose-50 text-xl font-semibold text-stone-800 shadow-2xs border border-stone-200/80 active:scale-95 transition-all flex items-center justify-center font-mono cursor-pointer"
          >
            {digit}
          </button>
        ))}

        {/* Empty placeholder */}
        <div className="h-16 flex items-center justify-center" />

        {/* Digit 0 */}
        <button
          onClick={() => handleNumberClick('0')}
          className="w-full h-16 rounded-2xl bg-white hover:bg-stone-50 active:bg-rose-50 text-xl font-semibold text-stone-800 shadow-2xs border border-stone-200/80 active:scale-95 transition-all flex items-center justify-center font-mono cursor-pointer"
        >
          0
        </button>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={pin.length === 0}
          className="w-full h-16 rounded-2xl bg-transparent hover:bg-stone-200/50 active:scale-95 text-stone-600 disabled:opacity-20 flex items-center justify-center transition-all cursor-pointer"
          aria-label="Xóa ký tự"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      {/* Footer hint */}
      <div className="text-[11px] text-stone-400 text-center pb-2">
        Mã PIN bảo mật · Dữ liệu đồng bộ MongoDB
      </div>
    </div>
  );
};
