# Hỷ Tín - Trợ Lý Mời Cưới Thông Minh (Wedding Guest AI Assistant)

Ứng dụng trợ lý ảo chatbot quản lý danh sách khách mời đám cưới, tự động bóc tách thông tin, phát hiện trùng lặp và tối ưu trên điện thoại di động.

## 🚀 Hướng Dẫn Deploy Lên Vercel

Dự án đã được cấu hình sẵn file `vercel.json` và Serverless Function `/api/chat.ts`. Bạn có thể deploy lên Vercel chỉ trong 1-2 phút:

### Cách 1: Deploy qua GitHub & Vercel Dashboard (Khuyên dùng)
1. Đẩy mã nguồn dự án lên GitHub của bạn:
   ```bash
   git init
   git add .
   git commit -m "feat: Hỷ Tín Wedding Bot"
   git branch -M main
   git remote add origin <URL_REPO_GITHUB_CUA_BAN>
   git push -u origin main
   ```
2. Truy cập [vercel.com](https://vercel.com) và đăng nhập.
3. Bấm **"Add New..."** -> **"Project"** -> chọn repository vừa tạo và nhấn **"Import"**.
4. Cấu hình Build & Output Settings (Vercel đã tự động nhận diện từ `vercel.json`):
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. (Tùy chọn) Thêm biến môi trường:
   - Vào mục **Environment Variables**:
     - Key: `GEMINI_API_KEY`
     - Value: `<API_KEY_CUA_BAN>` (để kích hoạt AI Gemini 3.8 Flash; nếu không cấu hình thì hệ thống vẫn tự động hoạt động mượt mà với bộ phân tích NLP tiếng Việt có sẵn).
6. Bấm **"Deploy"** và nhận link web sau ~1 phút!

### Cách 2: Deploy qua Vercel CLI
Nếu bạn đã cài Vercel CLI trên máy tính:
```bash
npm install -g vercel
vercel login
vercel
```
Chọn các tùy chọn mặc định, Vercel sẽ tự động build và cung cấp URL production.

---

## 📱 Hướng Dẫn Cài Đặt và Xuất File APK cho Android

Ứng dụng đã được tích hợp chuẩn **Progressive Web App (PWA / WebAPK)** với manifest và service worker đầy đủ. Bạn có thể sử dụng dưới dạng ứng dụng Android theo 2 cách:

### Cách 1: Cài đặt trực tiếp thành WebAPK (Khuyên dùng - Không cần build)
1. Mở link trang web trên trình duyệt Chrome của điện thoại Android.
2. Bấm vào nút **"Cài App"** trên thanh tiêu đề của ứng dụng (hoặc menu 3 chấm của Chrome -> chọn **"Cài đặt ứng dụng"**).
3. Hệ điều hành Android sẽ tự động tạo icon ứng dụng riêng biệt ngoài màn hình chính, khởi chạy toàn màn hình (Standalone) 100% giống như app tải từ CH Play!

### Cách 2: Tải file .APK hoặc .AAB độc lập qua PWABuilder (1 phút)
1. Sau khi deploy lên Vercel, sao chép URL trang web của bạn (ví dụ: `https://ten-app-cua-ban.vercel.app`).
2. Truy cập công cụ chính thức của Microsoft: [pwabuilder.com](https://www.pwabuilder.com).
3. Dán link web vào ô tìm kiếm và bấm **"Start"**.
4. Chọn **"Android"** -> bấm **"Generate Package"**.
5. Bạn sẽ nhận được file **`.apk`** để cài đặt trực tiếp vào điện thoại, hoặc file **`.aab`** để phát hành lên Google Play Store!

