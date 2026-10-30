import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initNativeShell } from './utils/nativeShell';

// Thanh trạng thái bản APK cùng màu header (không làm gì trên web/Electron)
initNativeShell();

createRoot(document.getElementById('root')!).render(<App />);
