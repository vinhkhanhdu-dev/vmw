// Trạng thái đã nhập PIN, chỉ tồn tại trong phiên chạy hiện tại của app.
// Lưu ở sessionStorage nên tắt app (đóng tab / tắt app Android / đóng cửa sổ Electron) rồi mở lại
// sẽ phải nhập PIN. Trong lúc app còn mở, nếu rời app (chạy nền) quá 1 giờ cũng bị khóa lại.

const KEY = 'myvinh_unlocked_until';
const LEGACY_KEYS = ['myvinh_unlocked']; // khóa cũ trong sessionStorage
export const PIN_SESSION_MS = 60 * 60 * 1000; // 1 giờ

// Bản trước lưu ở localStorage (sống qua lần tắt app) → dọn đi để không còn mở khóa sẵn.
try {
  localStorage.removeItem(KEY);
} catch {
  /* ignore */
}

export function isPinSessionValid(now = Date.now()): boolean {
  try {
    const until = Number(sessionStorage.getItem(KEY));
    return Number.isFinite(until) && until > now;
  } catch {
    return false;
  }
}

/** Gọi khi mở khóa thành công và mỗi khi người dùng còn đang dùng app (gia hạn thêm 1 giờ). */
export function touchPinSession(now = Date.now()): void {
  try {
    sessionStorage.setItem(KEY, String(now + PIN_SESSION_MS));
  } catch {
    /* storage bị chặn: chỉ nhớ trong bộ nhớ của lần chạy hiện tại */
  }
}

export function clearPinSession(): void {
  try {
    sessionStorage.removeItem(KEY);
    for (const k of LEGACY_KEYS) sessionStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}
