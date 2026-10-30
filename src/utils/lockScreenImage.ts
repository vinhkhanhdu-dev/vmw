// Lock-screen background image, stored per device in localStorage as a compressed JPEG data URL.

const STORAGE_KEY = 'myvinh_lock_bg';
const MAX_EDGE = 1440; // px, longest side after resize
const JPEG_QUALITY = 0.82;

export function loadLockScreenImage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveLockScreenImage(dataUrl: string): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, dataUrl);
    return true;
  } catch {
    // Quota exceeded or storage blocked
    return false;
  }
}

export function clearLockScreenImage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Resize + re-encode an image file so it fits comfortably in localStorage. */
export function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Tệp đã chọn không phải là ảnh.'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Trình duyệt không hỗ trợ xử lý ảnh.'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Không đọc được ảnh. Hãy thử ảnh khác.'));
    };

    img.src = objectUrl;
  });
}
