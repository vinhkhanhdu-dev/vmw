// Electron main process: đóng gói bản web (dist/) thành app desktop.
// Chạy thử:   npm run electron:start      (build rồi mở app)
// Dev:        npm run dev  +  npm run electron:dev   (nạp http://localhost:3000)
// Đóng gói:   npm run electron:build      (ra file cài đặt trong release/)
const { app, BrowserWindow, protocol, net, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

const DIST = path.join(__dirname, '..', 'dist');
const DEV_URL = process.argv.includes('--dev') ? process.env.ELECTRON_START_URL || 'http://localhost:3000' : null;

// Thanh tiêu đề cùng màu header (trắng), nút điều khiển màu chữ stone-700
const HEADER_COLOR = '#ffffff';
const SYMBOL_COLOR = '#44403c';
const TITLEBAR_HEIGHT = 36; // khớp với preload.cjs

// Phục vụ dist/ qua scheme app:// (an toàn hơn file:// và đường dẫn /assets/... vẫn đúng)
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

function serveDist(request) {
  const { pathname } = new URL(request.url);
  if (pathname.startsWith('/api/')) {
    // Bản desktop gọi API qua VITE_API_BASE_URL; không có thì app chạy chế độ offline
    return new Response(JSON.stringify({ error: 'API offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  let filePath = path.normalize(path.join(DIST, decodeURIComponent(pathname)));
  if (!filePath.startsWith(DIST)) return new Response('Forbidden', { status: 403 });
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html'); // SPA fallback
  }
  return net.fetch(pathToFileURL(filePath).toString());
}

function createWindow() {
  const isMac = process.platform === 'darwin';
  const iconPath = path.join(__dirname, 'resources', 'icon.png'); // logo MV, cũng là icon file cài đặt

  const win = new BrowserWindow({
    width: 440,
    height: 900,
    minWidth: 380,
    minHeight: 640,
    title: 'Mỹ Vinh',
    backgroundColor: HEADER_COLOR,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    titleBarStyle: 'hidden',
    titleBarOverlay: isMac ? undefined : { color: HEADER_COLOR, symbolColor: SYMBOL_COLOR, height: TITLEBAR_HEIGHT },
    trafficLightPosition: isMac ? { x: 14, y: 11 } : undefined,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  // Link ngoài (Zalo, Google Maps...) mở bằng trình duyệt mặc định
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  win.loadURL(DEV_URL || 'app://bundle/index.html');
}

app.whenReady().then(() => {
  protocol.handle('app', serveDist);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
