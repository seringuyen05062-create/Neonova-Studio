## 🎨 **HƯỚNG DẪN THÊM BACKGROUND TÙY CHỈNH**

### 📁 **Thư mục Background:**
- Path: `public/backgrounds/`
- File chính: `studio-bg.jpg`

### 🖼️ **Định dạng được hỗ trợ:**
- **JPG/JPEG** - Recommended (kích thước nhỏ)
- **PNG** - Cho background trong suốt
- **WEBP** - Tối ưu hiệu suất

### 📐 **Kích thước khuyến nghị:**
- **1920x1080** (Full HD) - Tốt nhất
- **1280x720** (HD) - Tối thiểu  
- **Tỷ lệ 16:9** - Để không bị deform

### 🎯 **Cách thêm background mới:**

1. **Thêm file vào thư mục:**
   ```
   public/backgrounds/studio-bg.jpg
   public/backgrounds/studio-bg-2.jpg  
   public/backgrounds/custom-bg.jpg
   ```

2. **Sửa StudioBackground.tsx để switch:**
   ```typescript
   const backgroundOptions = [
     '/backgrounds/studio-bg.jpg',
     '/backgrounds/studio-bg-2.jpg', 
     '/backgrounds/custom-bg.jpg'
   ];
   ```

### 🌟 **Background themes gợi ý:**
- **Studio Photography** - Đèn studio, backdrop trắng
- **Modern Office** - Clean, minimalist  
- **Neon Cyberpunk** - RGB lighting, futuristic
- **Nature/Outdoor** - Sky, clouds, landscape
- **Abstract Geometric** - Patterns, gradients

### ⚡ **Performance Tips:**
- **Tối ưu kích thước**: < 500KB cho web
- **Sử dụng WEBP**: Nhỏ hơn 30% so với JPG
- **Compression**: 80-90% quality là đủ

### 🔧 **Fallback System:**
Nếu file không tồn tại → tự động chuyển về gradient màu sky-pink với hiệu ứng clouds.