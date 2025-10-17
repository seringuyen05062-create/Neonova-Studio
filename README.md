# VRM AI Avatar Chat 🤖

Ứng dụng web tương tác với AI Avatar 3D sử dụng mô hình VRM, có khả năng trò chuyện bằng tiếng Việt với giọng nói và lip sync.

## ✨ Tính năng

- 🎭 **Hiển thị mô hình 3D VRM** - Hỗ trợ upload và hiển thị mô hình VRM tùy chỉnh
- 🤖 **AI Chatbot** - Sử dụng DeepSeek API để trò chuyện thông minh
- 🗣️ **Text-to-Speech tiếng Việt** - Phản hồi bằng giọng nói tự nhiên
- 💋 **Lip Sync nâng cao** - Đồng bộ môi với giọng nói chính xác
- 🎬 **Animations đa dạng** - Cử động tự nhiên (vẫy tay, gật đầu, cảm xúc, v.v.)
- 🎨 **Giao diện Dark Theme** - Thiết kế hiện đại, dễ sử dụng
- ⚡ **Real-time** - Phản hồi nhanh chóng và mượt mà

## 🛠️ Công nghệ sử dụng

- **Frontend**: Next.js 14, React, TypeScript
- **3D Rendering**: Three.js, @react-three/fiber, @pixiv/three-vrm
- **AI**: DeepSeek API
- **TTS**: Web Speech API
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## 📋 Yêu cầu

- Node.js 18+ 
- npm hoặc yarn
- DeepSeek API Key

## 🚀 Cài đặt

### 1. Clone repository

```bash
git clone <your-repo-url>
cd vrm-ai-avatar
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình Environment Variables

Tạo file `.env.local` trong thư mục gốc:

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_API_URL=https://api.deepseek.com/v1
```

**Lấy DeepSeek API Key:**
1. Truy cập [DeepSeek Platform](https://platform.deepseek.com/)
2. Đăng ký/Đăng nhập
3. Tạo API key mới
4. Copy và paste vào `.env.local`

### 4. Chạy development server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trong trình duyệt.

## 📖 Hướng dẫn sử dụng

### Upload mô hình VRM

1. Click vào nút **Cài đặt** (⚙️) ở góc trên bên phải
2. Click **"Chọn file VRM"**
3. Chọn file `.vrm` hoặc `.glb` từ máy tính
4. Đợi mô hình tải lên và hiển thị

**Lưu ý:** Bạn có thể tải mô hình VRM miễn phí từ:
- [VRoid Hub](https://hub.vroid.com/)
- [Booth.pm](https://booth.pm/)
- [VRChat](https://vrchat.com/)

### Chat với AI Avatar

1. Nhập tin nhắn vào ô chat bên trái
2. Nhấn Enter hoặc click nút gửi
3. AI sẽ trả lời bằng text và giọng nói
4. Avatar sẽ cử động theo ngữ cảnh

### Điều chỉnh âm lượng

1. Mở panel Cài đặt
2. Kéo thanh trượt "Âm lượng"
3. Âm lượng sẽ được áp dụng cho giọng nói

## 🎭 Animations

Avatar hỗ trợ các loại animation:

- **Idle** - Đứng yên, thở tự nhiên
- **Wave** - Vẫy tay chào
- **Nod** - Gật đầu đồng ý
- **Shake** - Lắc đầu không đồng ý
- **Point** - Chỉ tay
- **Happy** - Cảm xúc vui vẻ
- **Sad** - Cảm xúc buồn
- **Surprised** - Ngạc nhiên
- **Talk** - Nói chuyện với lip sync

## 🌐 Deploy lên Vercel

### 1. Push code lên GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

### 2. Deploy trên Vercel

1. Truy cập [Vercel](https://vercel.com/)
2. Import repository từ GitHub
3. Thêm Environment Variables:
   - `DEEPSEEK_API_KEY`
   - `DEEPSEEK_API_URL`
4. Click **Deploy**

### 3. Cấu hình Domain (Optional)

- Vercel sẽ tự động cung cấp domain `.vercel.app`
- Bạn có thể thêm custom domain trong Settings

## 📁 Cấu trúc dự án

```
vrm-ai-avatar/
├── app/
│   ├── api/
│   │   ├── chat/route.ts       # DeepSeek API endpoint
│   │   └── tts/route.ts        # TTS endpoint
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Main page
│   └── globals.css             # Global styles
├── components/
│   ├── Scene.tsx               # 3D scene
│   ├── ChatInterface.tsx       # Chat UI
│   └── ControlPanel.tsx        # Settings panel
├── hooks/
│   ├── useVRM.ts               # VRM management
│   ├── useChat.ts              # Chat logic
│   └── useAnimation.ts         # Animation control
├── lib/
│   ├── vrm-loader.ts           # VRM loader
│   ├── animation-controller.ts # Animation system
│   ├── lip-sync.ts             # Lip sync engine
│   ├── deepseek-client.ts      # DeepSeek client
│   └── audio-analyzer.ts       # Audio processing
├── types/
│   └── index.ts                # TypeScript types
└── public/
    └── models/                 # VRM models (optional)
```

## 🔧 Troubleshooting

### Mô hình VRM không hiển thị

- Kiểm tra file VRM có hợp lệ không
- Thử với file VRM khác
- Xem console log để biết lỗi chi tiết

### Giọng nói không hoạt động

- Kiểm tra trình duyệt có hỗ trợ Web Speech API không
- Cho phép quyền microphone/audio
- Kiểm tra âm lượng hệ thống

### API Error

- Kiểm tra DeepSeek API key có đúng không
- Kiểm tra kết nối internet
- Xem API usage limit

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng:

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📝 License

MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 🙏 Credits

- [Three.js](https://threejs.org/) - 3D library
- [@pixiv/three-vrm](https://github.com/pixiv/three-vrm) - VRM support
- [DeepSeek](https://www.deepseek.com/) - AI model
- [Next.js](https://nextjs.org/) - React framework
- [Vercel](https://vercel.com/) - Hosting platform

## 📧 Liên hệ

Nếu có câu hỏi hoặc góp ý, vui lòng tạo issue trên GitHub.

---

Made with ❤️ using Next.js and Three.js
