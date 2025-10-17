# 🔍 Checklist Kiểm Tra Lỗi

## ✅ Files đã tạo (25+ files)

### Configuration Files
- [x] package.json
- [x] tsconfig.json
- [x] next.config.js
- [x] tailwind.config.js
- [x] postcss.config.js
- [x] .gitignore
- [x] .env.local.example
- [x] .env.local
- [x] .eslintrc.json
- [x] next-env.d.ts
- [x] vercel.json

### App Files
- [x] app/layout.tsx
- [x] app/page.tsx
- [x] app/globals.css

### API Routes
- [x] app/api/chat/route.ts
- [x] app/api/tts/route.ts

### Components
- [x] components/Scene.tsx
- [x] components/ChatInterface.tsx
- [x] components/ControlPanel.tsx

### Hooks
- [x] hooks/useVRM.ts
- [x] hooks/useChat.ts
- [x] hooks/useAnimation.ts

### Libraries
- [x] lib/vrm-loader.ts
- [x] lib/animation-controller.ts
- [x] lib/lip-sync.ts
- [x] lib/deepseek-client.ts
- [x] lib/audio-analyzer.ts

### Types
- [x] types/index.ts

### Documentation
- [x] README.md
- [x] QUICKSTART.md
- [x] TODO.md

### Other
- [x] public/models/.gitkeep
- [x] scripts/check-imports.js

---

## 🧪 Kiểm Tra Lỗi Thường Gặp

### 1. Dependencies Installation
```bash
cd vrm-ai-avatar
npm install --legacy-peer-deps
```

**Kiểm tra:**
- [ ] node_modules folder được tạo
- [ ] package-lock.json được tạo
- [ ] Không có error trong quá trình install

### 2. TypeScript Compilation
```bash
npx tsc --noEmit
```

**Kiểm tra:**
- [ ] Không có TypeScript errors
- [ ] Tất cả imports được resolve đúng
- [ ] Types được định nghĩa đầy đủ

### 3. ESLint Check
```bash
npm run lint
```

**Kiểm tra:**
- [ ] Không có linting errors
- [ ] Warnings (nếu có) không critical

### 4. Build Test
```bash
npm run build
```

**Kiểm tra:**
- [ ] Build thành công
- [ ] .next folder được tạo
- [ ] Không có compilation errors

### 5. Development Server
```bash
npm run dev
```

**Kiểm tra:**
- [ ] Server khởi động tại http://localhost:3000
- [ ] Không có runtime errors
- [ ] Page load thành công

---

## 🔧 Các Lỗi Có Thể Gặp & Cách Fix

### Lỗi 1: Peer Dependencies Conflict
**Triệu chứng:** npm install fails với peer dependency errors

**Giải pháp:**
```bash
npm install --legacy-peer-deps
```

### Lỗi 2: TypeScript Cannot Find Module
**Triệu chứng:** Cannot find module '@/...' or its corresponding type declarations

**Giải pháp:**
- Kiểm tra tsconfig.json có paths mapping
- Restart TypeScript server trong VSCode (Ctrl+Shift+P > TypeScript: Restart TS Server)

### Lỗi 3: Three.js SSR Issues
**Triệu chứng:** ReferenceError: window is not defined

**Giải pháp:**
- Scene component đã được dynamic import với ssr: false
- Kiểm tra không có Three.js code chạy trên server

### Lỗi 4: VRM Loading Fails
**Triệu chứng:** Cannot load VRM model

**Giải pháp:**
- Kiểm tra file VRM hợp lệ (VRM 0.x hoặc 1.0)
- Kiểm tra file size không quá lớn
- Thử với VRM model khác

### Lỗi 5: DeepSeek API Error
**Triệu chứng:** API calls fail

**Giải pháp:**
- Kiểm tra DEEPSEEK_API_KEY trong .env.local
- Verify API key còn valid
- Kiểm tra network connection

### Lỗi 6: TTS Not Working
**Triệu chứng:** No voice output

**Giải pháp:**
- Kiểm tra browser support Web Speech API (Chrome/Edge recommended)
- Kiểm tra volume settings
- Thử với browser khác

### Lỗi 7: Lip Sync Not Syncing
**Triệu chứng:** Mouth movements don't match audio

**Giải pháp:**
- Kiểm tra VRM model có blend shapes cho mouth
- Verify audio is playing
- Check console for lip sync errors

---

## 📊 Performance Checks

### Memory Usage
- [ ] No memory leaks khi load/unload VRM
- [ ] Animation cleanup khi unmount
- [ ] Audio cleanup khi stop

### Rendering Performance
- [ ] FPS >= 30 với VRM model
- [ ] No stuttering during animations
- [ ] Smooth camera controls

### API Performance
- [ ] Chat response < 3 seconds
- [ ] TTS generation < 2 seconds
- [ ] No rate limiting issues

---

## 🌐 Browser Compatibility

### Desktop Browsers
- [ ] Chrome/Edge (Recommended)
- [ ] Firefox
- [ ] Safari

### Mobile Browsers
- [ ] Chrome Mobile
- [ ] Safari iOS

### Features Support
- [ ] WebGL 2.0
- [ ] Web Speech API
- [ ] File API
- [ ] Audio API

---

## 🚀 Deployment Checks

### Vercel Deployment
- [ ] vercel.json configured
- [ ] Environment variables set
- [ ] Build succeeds on Vercel
- [ ] Production site loads

### Environment Variables
- [ ] DEEPSEEK_API_KEY set in Vercel
- [ ] DEEPSEEK_API_URL (optional)
- [ ] Other env vars if needed

---

## ✅ Final Verification

### Functional Tests
- [ ] Upload VRM model works
- [ ] Chat sends messages
- [ ] AI responds correctly
- [ ] Voice plays with Vietnamese accent
- [ ] Lip sync animates
- [ ] Gestures trigger appropriately
- [ ] Emotions display correctly
- [ ] Volume control works
- [ ] Clear chat works

### UI/UX Tests
- [ ] Dark theme displays correctly
- [ ] Chat scrolls properly
- [ ] Loading states show
- [ ] Error messages display
- [ ] Responsive on different screen sizes

### Edge Cases
- [ ] Invalid VRM file handled
- [ ] API errors handled gracefully
- [ ] Network errors handled
- [ ] Empty messages rejected
- [ ] Long messages handled

---

## 📝 Notes

**Lỗi đã biết:**
- Terminal output không capture được trong một số commands
- Browser tool bị disabled nên không test được UI trực tiếp

**Khuyến nghị:**
1. Chạy `npm run dev` và test thủ công trên browser
2. Upload một VRM model để test rendering
3. Thêm DeepSeek API key để test chat
4. Test tất cả features theo checklist trên

**Next Steps:**
1. ✅ Tất cả files đã được tạo
2. ⏳ Cần test thủ công trên browser
3. ⏳ Cần verify với VRM model thật
4. ⏳ Cần test với DeepSeek API key thật
