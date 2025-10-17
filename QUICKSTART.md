# 🚀 Quick Start Guide

## Bước 1: Cài đặt Dependencies

```bash
cd vrm-ai-avatar
npm install
```

## Bước 2: Cấu hình API Key

1. Mở file `.env.local`
2. Thay thế `your_deepseek_api_key_here` bằng API key thực của bạn từ [DeepSeek Platform](https://platform.deepseek.com/)

```env
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

## Bước 3: Chạy Development Server

```bash
npm run dev
```

Mở trình duyệt tại: http://localhost:3000

## Bước 4: Upload VRM Model

1. Click nút **Cài đặt** (⚙️) ở góc trên bên phải
2. Click **"Chọn file VRM"**
3. Chọn file `.vrm` từ máy tính của bạn

### Tải VRM Models miễn phí:

- **VRoid Hub**: https://hub.vroid.com/
- **Booth.pm**: https://booth.pm/
- **VRChat**: https://vrchat.com/

## Bước 5: Bắt đầu Chat!

1. Nhập tin nhắn vào ô chat bên trái
2. Nhấn Enter hoặc click nút gửi
3. AI sẽ trả lời bằng text và giọng nói
4. Avatar sẽ cử động theo ngữ cảnh

## 🎯 Tính năng chính

### Chat với AI
- Gõ tin nhắn tiếng Việt
- AI phản hồi thông minh với DeepSeek
- Giọng nói tự nhiên bằng tiếng Việt

### Animations tự động
- **Chào hỏi** → Avatar vẫy tay
- **Đồng ý** → Avatar gật đầu
- **Không đồng ý** → Avatar lắc đầu
- **Vui vẻ** → Biểu cảm vui
- **Buồn** → Biểu cảm buồn

### Lip Sync
- Môi đồng bộ với giọng nói
- Phân tích phoneme tiếng Việt
- Chuyển động tự nhiên

## 🔧 Troubleshooting

### Lỗi: "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Lỗi: VRM không hiển thị
- Kiểm tra file VRM có hợp lệ
- Thử file VRM khác
- Xem console log (F12)

### Lỗi: Không có giọng nói
- Kiểm tra trình duyệt hỗ trợ Web Speech API
- Cho phép quyền audio
- Kiểm tra âm lượng

### Lỗi: API Error
- Kiểm tra DeepSeek API key
- Kiểm tra kết nối internet
- Xem API usage limit

## 📦 Build cho Production

```bash
npm run build
npm start
```

## 🌐 Deploy lên Vercel

```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main

# Deploy on Vercel
# 1. Import project from GitHub
# 2. Add environment variable: DEEPSEEK_API_KEY
# 3. Deploy
```

## 💡 Tips

1. **Tối ưu hiệu suất**: Sử dụng VRM models nhẹ (< 10MB)
2. **Giọng nói tốt hơn**: Chọn giọng Vietnamese trong settings
3. **Animations mượt**: Đảm bảo GPU acceleration được bật
4. **Chat tốt hơn**: Viết câu rõ ràng, ngắn gọn

## 🆘 Cần trợ giúp?

- Đọc [README.md](README.md) đầy đủ
- Tạo issue trên GitHub
- Kiểm tra console log (F12)

---

Chúc bạn có trải nghiệm tuyệt vời! 🎉
