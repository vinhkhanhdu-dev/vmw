import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, ExternalLink } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already running as installed standalone app, show small badge or hide
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-800 hover:bg-rose-900 active:scale-95 text-white rounded-lg text-xs font-medium transition-all shadow-xs"
        title="Cài đặt app APK lên điện thoại"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Cài App</span>
        <span className="sm:hidden">Cài</span>
      </button>

      {/* Guide Modal for APK & Installation */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden text-stone-800">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-rose-50/60">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-rose-800" />
                <h3 className="font-semibold text-stone-900 text-sm">Cài Đặt App Cho Điện Thoại</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs">
              {/* Android Guide */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
                <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Cách 1: Cài trực tiếp trên Android (Chrome)</span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  1. Mở link web này trên trình duyệt Chrome điện thoại.<br />
                  2. Bấm vào dấu <strong>3 chấm (⋮)</strong> ở góc trên bên phải.<br />
                  3. Chọn <strong>"Cài đặt ứng dụng"</strong> (hoặc "Thêm vào màn hình chính").<br />
                  <em>Hệ thống Android sẽ tự động tạo file WebAPK và icon riêng ngoài màn hình chính!</em>
                </p>
              </div>

              {/* iOS Guide */}
              {isIOS && (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
                  <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Dành cho iPhone / iPad (Safari)</span>
                  </div>
                  <p className="text-stone-600 leading-relaxed">
                    1. Bấm nút <strong>Chia sẻ (Share)</strong> ở thanh dưới của Safari.<br />
                    2. Kéo xuống và chọn <strong>"Thêm vào MH chính" (Add to Home Screen)</strong>.
                  </p>
                </div>
              )}

              {/* PWABuilder option */}
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 space-y-1.5">
                <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
                  <span>Cách 2: Xuất file .APK độc lập</span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  Sau khi deploy web lên Vercel, bạn vào trang <strong>pwabuilder.com</strong>, dán link web vào để tải ngay file cài đặt <strong>.apk</strong> hoặc <strong>.aab</strong> cho Google Play!
                </p>
              </div>
            </div>

            <div className="p-3 border-t border-stone-200 bg-stone-50 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-medium transition-colors"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
