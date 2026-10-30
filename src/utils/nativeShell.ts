import { Capacitor, SystemBars, SystemBarsStyle, SystemBarType } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

/** Màu header của app; thanh trạng thái Android dùng cùng màu này. */
export const HEADER_COLOR = '#ffffff';

/**
 * Cho thanh trạng thái của bản APK cùng màu header:
 * - Android 15+ (edge-to-edge): thanh trong suốt, phía sau là dải trắng `--app-safe-top` trong PhoneContainer.
 * - Android cũ hơn: tô nền trắng trực tiếp bằng plugin StatusBar.
 * Cả hai đều dùng chữ/biểu tượng tối để đọc được trên nền trắng.
 */
export async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await SystemBars.setStyle({ style: SystemBarsStyle.Light, bar: SystemBarType.StatusBar });
  } catch {
    /* plugin không có trên nền tảng này */
  }

  try {
    await StatusBar.setStyle({ style: Style.Light });
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: HEADER_COLOR });
    }
  } catch {
    /* Android 15+ bỏ qua setBackgroundColor: đã xử lý bằng dải trắng phía trên */
  }
}
