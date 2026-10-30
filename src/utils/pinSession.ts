// Ghi nhớ trạng thái đã nhập PIN trong 1 giờ kể từ lần dùng app gần nhất.
// Lưu ở localStorage (khác sessionStorage) nên tắt app mở lại trong 1 giờ không phải nhập lại PIN.

const KEY = 'myvinh_unlocked_until';
export const PIN_SESSION_MS = 60 * 60 * 1000; // 1 giờ

export function isPinSessionValid(now = Date.now()): boolean {
  try {
    const until = Number(localStorage.getItem(KEY));
    return Number.isFinite(until) && until > now;
  } catch {
    return false;
  }
}

/** Gọi khi mở khóa thành công và mỗi khi người dùng còn đang dùng app (gia hạn thêm 1 giờ). */
export function touchPinSession(now = Date.now()): void {
  try {
    localStorage.setItem(KEY, String(now + PIN_SESSION_MS));
  } catch {
    /* storage bị chặn: chỉ nhớ trong phiên hiện tại */
  }
}

export function clearPinSession(): void {
  try {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem('myvinh_unlocked'); // khóa cũ dùng sessionStorage
  } catch {
    /* ignore */
  }
}
