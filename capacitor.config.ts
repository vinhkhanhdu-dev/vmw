import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'vn.myvinh.wedding',
  appName: 'Mỹ Vinh',
  webDir: 'dist',
  plugins: {
    // Edge-to-edge: web vẽ cả vùng thanh trạng thái (dải trắng --app-safe-top), icon hệ thống màu tối
    SystemBars: {
      insetsHandling: 'css',
      style: 'LIGHT',
      initialViewportFitValueHint: 'cover',
    },
    // Android cũ (trước 15): tô nền thanh trạng thái trắng như header
    StatusBar: {
      overlaysWebView: false,
      backgroundColor: '#ffffff',
      style: 'LIGHT',
    },
  },
};

export default config;
