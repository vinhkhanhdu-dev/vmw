// Preload (sandbox): báo cho giao diện biết đang chạy trong Electron
// và tạo vùng kéo cửa sổ ở thanh tiêu đề tùy biến.
const TITLEBAR_HEIGHT = 36; // khớp với main.cjs

window.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  root.classList.add('is-electron');
  // PhoneContainer chèn dải trắng cao bằng --app-safe-top (xem index.css)
  root.style.setProperty('--app-titlebar', `${TITLEBAR_HEIGHT}px`);

  const drag = document.createElement('div');
  drag.setAttribute('aria-hidden', 'true');
  drag.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'right:0',
    `height:${TITLEBAR_HEIGHT}px`,
    'z-index:2147483647',
    '-webkit-app-region:drag',
    'app-region:drag',
  ].join(';');
  document.body.appendChild(drag);
});
