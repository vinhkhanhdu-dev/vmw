import React, { useRef, useState } from 'react';
import { Lock, Delete, ShieldCheck, ImagePlus, Image as ImageIcon, Upload, RotateCcw } from 'lucide-react';
import { WeddingInfo } from '../types';
import { Monogram, Modal, IconTile } from './ui';
import { API_BASE } from '../utils/api';
import {
  loadLockScreenImage,
  saveLockScreenImage,
  clearLockScreenImage,
  compressImageFile,
} from '../utils/lockScreenImage';

interface PinLockScreenProps {
  onUnlockSuccess: () => void;
  weddingInfo?: WeddingInfo;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ onUnlockSuccess, weddingInfo }) => {
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  // Background image (per device)
  const [bgImage, setBgImage] = useState<string | null>(() => loadLockScreenImage());
  const [isBgPickerOpen, setIsBgPickerOpen] = useState(false);
  const [bgError, setBgError] = useState('');
  const [isProcessingBg, setIsProcessingBg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handlePickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setBgError('');
    setIsProcessingBg(true);
    try {
      const dataUrl = await compressImageFile(file);
      if (!saveLockScreenImage(dataUrl)) {
        setBgError('Ảnh quá lớn, không lưu được. Hãy chọn ảnh nhỏ hơn.');
        return;
      }
      setBgImage(dataUrl);
      setIsBgPickerOpen(false);
    } catch (err) {
      setBgError(err instanceof Error ? err.message : 'Không xử lý được ảnh.');
    } finally {
      setIsProcessingBg(false);
    }
  };

  const handleResetBg = () => {
    clearLockScreenImage();
    setBgImage(null);
    setBgError('');
    setIsBgPickerOpen(false);
  };

  const onImage = !!bgImage;

  const keyClass = `h-[62px] rounded-2xl backdrop-blur text-xl font-semibold flex items-center justify-center transition-all active:scale-95 ${
    onImage
      ? 'bg-white/20 border border-white/30 text-white hover:bg-white/30 active:bg-white/40'
      : 'bg-white/90 border border-white shadow-card text-stone-800 hover:bg-white active:bg-wine-50'
  }`;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between px-6 pb-6 select-none overflow-hidden ${
        onImage ? 'bg-stone-900' : 'bg-cream'
      }`}
      // Keep content below the native status bar (APK) / window title bar (Electron)
      style={{ paddingTop: 'calc(var(--app-safe-top, 0px) + 2.5rem)' }}
    >
      {onImage ? (
        <>
          {/* Custom background photo with legibility overlay */}
          <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
          <div className="absolute inset-0 bg-linear-to-b from-black/55 via-black/25 to-black/65 pointer-events-none" />
        </>
      ) : (
        <>
          {/* Ambient glow */}
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[480px] h-[480px] rounded-full bg-wine-200/50 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-24 w-[380px] h-[380px] rounded-full bg-gold-200/60 blur-3xl pointer-events-none" />
        </>
      )}

      {/* Change background */}
      <button
        onClick={() => setIsBgPickerOpen(true)}
        className={`absolute right-4 btn btn-icon ${
          onImage ? 'bg-white/15 text-white hover:bg-white/25' : 'btn-ghost text-stone-500'
        }`}
        style={{ top: 'calc(var(--app-safe-top, 0px) + 1rem)' }}
        title="Thay ảnh nền"
        aria-label="Thay ảnh nền"
      >
        <ImagePlus className="w-[18px] h-[18px]" />
      </button>

      {/* Brand */}
      <div className="relative flex flex-col items-center text-center animate-fade-up">
        <Monogram className="w-20 h-20 text-xl" />
        <div className={`eyebrow mt-5 ${onImage ? 'text-gold-300' : ''}`}>Trợ lý mời cưới</div>
        <h1 className={`font-serif text-3xl mt-1.5 leading-tight ${onImage ? 'text-white drop-shadow-md' : 'text-stone-900'}`}>
          {weddingInfo?.groomName || 'Mỹ'}
          <span className={`italic text-2xl mx-1.5 ${onImage ? 'text-gold-300' : 'text-gold-500'}`}>&</span>
          {weddingInfo?.brideName || 'Vinh'}
        </h1>
        <p className={`text-xs mt-2 max-w-[250px] ${onImage ? 'text-white/75' : 'text-stone-500'}`}>
          Quản lý khách mời, thiệp cưới và bàn tiệc trong một nơi.
        </p>
      </div>

      {/* PIN indicator */}
      <div className="relative flex flex-col items-center gap-4 my-auto">
        <div className={`flex items-center gap-1.5 text-xs font-medium ${onImage ? 'text-white/85' : 'text-stone-600'}`}>
          <Lock className={`w-3.5 h-3.5 ${onImage ? 'text-gold-300' : 'text-wine-700'}`} />
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
                    ? onImage
                      ? 'bg-white scale-110 shadow-lg'
                      : 'bg-wine-700 scale-110 shadow-wine'
                    : onImage
                    ? 'bg-white/10 border-2 border-white/60'
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
          className={`h-[62px] rounded-2xl active:scale-95 disabled:opacity-20 flex items-center justify-center transition-all ${
            onImage ? 'text-white/80 hover:bg-white/15' : 'text-stone-500 hover:bg-white/60'
          }`}
          aria-label="Xóa ký tự"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      <div className={`relative flex items-center gap-1.5 text-[11px] ${onImage ? 'text-white/60' : 'text-stone-400'}`}>
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Bảo mật bằng mã PIN · Dữ liệu đồng bộ MongoDB</span>
      </div>

      {/* Background picker */}
      <Modal
        open={isBgPickerOpen}
        onClose={() => setIsBgPickerOpen(false)}
        title="Ảnh nền màn khóa"
        subtitle="Ảnh được lưu trên thiết bị này"
        icon={
          <IconTile className="bg-wine-50 text-wine-700">
            <ImageIcon className="w-[18px] h-[18px]" />
          </IconTile>
        }
        footer={
          <div className="flex gap-2">
            {onImage && (
              <button onClick={handleResetBg} className="btn btn-secondary btn-md flex-1" disabled={isProcessingBg}>
                <RotateCcw className="w-4 h-4" />
                <span>Nền mặc định</span>
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-primary btn-md flex-[1.4]"
              disabled={isProcessingBg}
            >
              <Upload className="w-4 h-4" />
              <span>{isProcessingBg ? 'Đang xử lý…' : onImage ? 'Chọn ảnh khác' : 'Chọn ảnh từ máy'}</span>
            </button>
          </div>
        }
      >
        <div className="p-5 space-y-3">
          <div className="relative aspect-[9/14] max-h-72 mx-auto w-auto rounded-2xl overflow-hidden border border-stone-200 bg-cream">
            {onImage ? (
              <>
                <img src={bgImage} alt="Xem trước ảnh nền" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-linear-to-b from-black/55 via-black/25 to-black/65" />
              </>
            ) : (
              <>
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full bg-wine-200/50 blur-2xl" />
                <div className="absolute -bottom-16 -right-10 w-40 h-40 rounded-full bg-gold-200/60 blur-2xl" />
              </>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Monogram className="w-12 h-12 text-sm" />
              <span className={`font-serif text-base ${onImage ? 'text-white drop-shadow' : 'text-stone-900'}`}>
                {weddingInfo?.groomName || 'Mỹ'} <span className={onImage ? 'text-gold-300' : 'text-gold-500'}>&</span>{' '}
                {weddingInfo?.brideName || 'Vinh'}
              </span>
            </div>
          </div>

          <p className="text-[11.5px] text-stone-500 leading-relaxed text-center">
            Nên chọn ảnh dọc (ảnh cưới, ảnh đôi). Ảnh sẽ được thu nhỏ tự động và chỉ lưu trên thiết bị này.
          </p>

          {bgError && (
            <div className="text-xs font-medium text-wine-700 bg-wine-50 border border-wine-200 rounded-xl px-3 py-2 text-center">
              {bgError}
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePickFile} />
        </div>
      </Modal>
    </div>
  );
};
