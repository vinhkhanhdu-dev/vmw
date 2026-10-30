import React, { useState } from 'react';
import { Smartphone, ExternalLink } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Modal, IconTile } from './ui';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already running as installed standalone app, hide
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
        className="btn btn-ghost btn-icon"
        title="Cài đặt ứng dụng lên điện thoại"
        aria-label="Cài đặt ứng dụng"
      >
        <Smartphone className="w-[18px] h-[18px]" />
      </button>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Cài đặt ứng dụng"
        subtitle="Thêm Mỹ Vinh vào màn hình chính điện thoại"
        icon={
          <IconTile className="bg-wine-50 text-wine-700">
            <Smartphone className="w-[18px] h-[18px]" />
          </IconTile>
        }
        footer={
          <button onClick={() => setShowModal(false)} className="btn btn-primary btn-md w-full">
            Đã hiểu
          </button>
        }
      >
        <div className="p-5 space-y-3 text-xs">
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100 space-y-1.5">
            <div className="font-semibold text-stone-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Cách 1: Cài trực tiếp trên Android (Chrome)</span>
            </div>
            <p className="text-stone-600 leading-relaxed">
              1. Mở link web này trên trình duyệt Chrome điện thoại.
              <br />
              2. Bấm vào dấu <strong>3 chấm (⋮)</strong> ở góc trên bên phải.
              <br />
              3. Chọn <strong>"Cài đặt ứng dụng"</strong> (hoặc "Thêm vào màn hình chính").
              <br />
              <em>Android sẽ tự tạo icon riêng ngoài màn hình chính.</em>
            </p>
          </div>

          {isIOS && (
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100 space-y-1.5">
              <div className="font-semibold text-stone-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span>Dành cho iPhone / iPad (Safari)</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                1. Bấm nút <strong>Chia sẻ (Share)</strong> ở thanh dưới của Safari.
                <br />
                2. Kéo xuống và chọn <strong>"Thêm vào MH chính" (Add to Home Screen)</strong>.
              </p>
            </div>
          )}

          <div className="p-3.5 bg-gold-50 rounded-xl border border-gold-100 space-y-1.5">
            <div className="font-semibold text-gold-700 flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Cách 2: Xuất file .APK độc lập</span>
            </div>
            <p className="text-stone-600 leading-relaxed">
              Sau khi deploy web lên Vercel, vào trang <strong>pwabuilder.com</strong>, dán link web để tải file cài đặt{' '}
              <strong>.apk</strong> hoặc <strong>.aab</strong> cho Google Play.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};
