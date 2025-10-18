'use client';

import { useState, useRef } from 'react';
import { VRM } from '@pixiv/three-vrm';
import { MultiVRMUploader } from './MultiVRMUploader';

interface ControlPanelProps {
  onUploadVRM: (file: File) => void;
  onUploadAnimation?: (file: File) => void; // New prop for animation upload
  isLoading: boolean;
  modelName: string;
  setModelName: (name: string) => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onModeChange?: (mode: 'single' | 'multi') => void; // New prop for mode change
  // Multi-VRM props
  multiVRM?: {
    vrms: (VRM | null)[];
    byIndex: {
      get: (idx: number) => VRM | null;
      isLoading: (idx: number) => boolean;
      error: (idx: number) => string | null;
    };
    loadVRM: (index: number, file: File) => Promise<void>;
    unloadVRM: (index: number) => void;
    loadedCount: number;
  };
}

export default function ControlPanel({
  onUploadVRM,
  onUploadAnimation,
  isLoading,
  modelName,
  setModelName,
  backgroundColor,
  setBackgroundColor,
  isOpen,
  setIsOpen,
  onModeChange,
  multiVRM,
}: ControlPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationInputRef = useRef<HTMLInputElement>(null); // New ref for animation files
  const [modelNameSaved, setModelNameSaved] = useState(false);
  const [vrmUploaded, setVrmUploaded] = useState(false); // New state for VRM upload success
  const [isDragging, setIsDragging] = useState(false); // New state for drag & drop
  const [uploadMode, setUploadMode] = useState<'single' | 'multi'>('single'); // New state for upload mode

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadVRM(file);
      setVrmUploaded(true);
      // Reset success message after 3 seconds
      setTimeout(() => {
        setVrmUploaded(false);
      }, 3000);
      // Reset the input so the same file can be selected again
      e.target.value = '';
    }
  };

  // Drag and drop handlers for VRM upload
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const vrmFile = files.find(file => 
      file.name.toLowerCase().endsWith('.vrm') || file.name.toLowerCase().endsWith('.glb')
    );
    
    if (vrmFile) {
      onUploadVRM(vrmFile);
      setVrmUploaded(true);
      setTimeout(() => {
        setVrmUploaded(false);
      }, 3000);
    }
  };

  const handleAnimationFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadAnimation) {
      onUploadAnimation(file);
      // Reset the input so the same file can be selected again
      e.target.value = '';
    }
  };

  const handleSaveModelName = () => {
    // Lưu tên model (có thể lưu vào localStorage hoặc gọi API)
    localStorage.setItem('vrm-model-name', modelName);
    setModelNameSaved(true);
    
    // Ẩn thông báo sau 2 giây
    setTimeout(() => {
      setModelNameSaved(false);
    }, 2000);
  };

  return (
    <>

      {/* Control Panel */}
      {isOpen && (
        <div className="fixed top-4 left-[400px] z-40 w-80 bg-gray-900 rounded-lg border border-gray-700 shadow-xl animate-fade-in">
          {/* Header - Fixed */}
          <div className="p-6 pb-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Cài đặt</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/50 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
               style={{
                 scrollbarWidth: 'thin',
                 scrollbarColor: 'rgba(255,255,255,0.2) transparent'
               }}>

          {/* Model & User Info */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Tên model</label>
            <input
              type="text"
              value={modelName}
              onChange={e => setModelName(e.target.value)}
              className="w-full p-2 rounded bg-white/10 text-white mb-2"
              placeholder="Nhập tên model..."
            />
            <button
              onClick={handleSaveModelName}
              className="w-full py-2 rounded bg-primary text-white font-bold hover:bg-blue-600 transition"
            >
              Lưu tên model
            </button>
            {modelNameSaved && (
              <div className="text-green-400 text-xs mt-2">Đã lưu tên model!</div>
            )}
          </div>
          
          {/* Single VRM Upload - only show in single mode */}
          {uploadMode === 'single' && (
          <div>
            <label className="block text-sm font-medium text-white/70 mb-3">
              Tải lên mô hình VRM
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".vrm,.glb"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 border font-medium ${
                isDragging 
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 border-purple-400 scale-105 shadow-lg' 
                  : isLoading
                    ? 'bg-gradient-to-r from-gray-600 to-gray-700 border-gray-500/20 text-white'
                    : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 border-purple-500/20 text-white hover:scale-105 hover:shadow-lg'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Đang tải mô hình...</span>
                </span>
              ) : isDragging ? (
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
                  </svg>
                  <span>🎯 Thả file VRM vào đây!</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>📤 Chọn hoặc kéo thả file VRM</span>
                </span>
              )}
            </button>
            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-300 leading-relaxed">
                💡 <strong>Hướng dẫn:</strong> Chọn file VRM để nhân vật hiện ngay trong không gian 3D. 
                Hỗ trợ định dạng .vrm và .glb
              </p>
            </div>
            {vrmUploaded && (
              <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg animate-fade-in">
                <p className="text-xs text-green-300 leading-relaxed flex items-center">
                  <span className="mr-2">✅</span>
                  <span><strong>Thành công!</strong> Nhân vật VRM đã được tải lên và hiển thị trong không gian 3D</span>
                </p>
              </div>
            )}
          </div>
          )}

          {/* Upload Mode Toggle */}
          <div className="border-t border-gray-700 pt-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-white/70 mb-3">
                Chế độ tải VRM
              </label>
              <div className="flex rounded-lg bg-gray-800 p-1">
                <button
                  onClick={() => {
                    setUploadMode('single');
                    onModeChange?.('single');
                    console.log('Mode changed to single');
                  }}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    uploadMode === 'single'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span>�</span>
                    <span>Đơn lẻ</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setUploadMode('multi');
                    onModeChange?.('multi');
                    console.log('Mode changed to multi');
                  }}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    uploadMode === 'multi'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span>�</span>
                    <span>Nhiều (3)</span>
                  </div>
                </button>
              </div>
              <p className="text-xs text-white/50 mt-2">
                {uploadMode === 'single' 
                  ? 'Tải 1 model VRM duy nhất' 
                  : 'Tải tối đa 3 model VRM cùng lúc'}
              </p>
            </div>

            {/* Multi VRM Upload when in multi mode */}
            {uploadMode === 'multi' && multiVRM && (
              <div>
                <MultiVRMUploader
                  vrms={multiVRM.vrms}
                  byIndex={multiVRM.byIndex}
                  loadVRM={multiVRM.loadVRM}
                  unloadVRM={multiVRM.unloadVRM}
                  loadedCount={multiVRM.loadedCount}
                  onUploadComplete={(index, fileName) => {
                    console.log(`Model ${index} uploaded: ${fileName}`);
                  }}
                  onUploadError={(index, error) => {
                    console.error(`Model ${index} upload error:`, error);
                  }}
                />
              </div>
            )}
          </div>

          {/* Animation Upload Section */}
          {onUploadAnimation && (
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Tải lên Animation tùy chỉnh
              </label>
              <input
                ref={animationInputRef}
                type="file"
                accept=".vrma,.fbx,.gltf,.glb"
                onChange={handleAnimationFileSelect}
                className="hidden"
              />
              <button
                onClick={() => animationInputRef.current?.click()}
                className="btn btn-secondary w-full"
              >
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Chọn Animation
                </span>
              </button>
              <p className="text-xs text-white/50 mt-2">
                Hỗ trợ: .vrma, .fbx, .gltf, .glb
              </p>
            </div>
          )}

          {/* Background Color */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-white/70">Màu nền studio</label>
              <div 
                className="w-8 h-6 rounded border border-white/30 flex-shrink-0"
                style={{ background: backgroundColor }}
                title="Màu hiện tại"
              ></div>
            </div>
            
            {/* Custom Color Picker */}
            <div className="flex items-center gap-2 mb-4">
              <input
                type="color"
                value={backgroundColor.startsWith('linear-gradient') ? '#87CEEB' : backgroundColor}
                onChange={e => setBackgroundColor(e.target.value)}
                className="w-12 h-10 rounded border border-white/20 bg-transparent cursor-pointer"
                title="Chọn màu tùy chỉnh"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={e => setBackgroundColor(e.target.value)}
                  placeholder="#87CEEB hoặc linear-gradient(...)"
                  className="w-full p-2 rounded bg-white/10 text-white font-mono text-xs"
                />
              </div>
              <button
                onClick={() => {
                  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FFB6C1', '#F0E68C'];
                  const randomColor = colors[Math.floor(Math.random() * colors.length)];
                  setBackgroundColor(randomColor);
                }}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded text-xs text-white transition-colors"
                title="Màu ngẫu nhiên"
              >
                🎲
              </button>
            </div>

            {/* Preset Solid Colors */}
            <div className="mb-4">
              <h5 className="text-xs font-medium text-white/60 mb-2">Màu đơn sắc</h5>
              <div className="grid grid-cols-8 gap-1">
                {[
                  { color: '#FF6B6B', name: 'Đỏ san hô' },
                  { color: '#4ECDC4', name: 'Xanh mint' },
                  { color: '#45B7D1', name: 'Xanh dương' },
                  { color: '#96CEB4', name: 'Xanh lá nhạt' },
                  { color: '#FFEAA7', name: 'Vàng kem' },
                  { color: '#DDA0DD', name: 'Tím lavender' },
                  { color: '#FFB6C1', name: 'Hồng nhạt' },
                  { color: '#F0E68C', name: 'Vàng khaki' },
                  { color: '#87CEEB', name: 'Xanh trời' },
                  { color: '#98FB98', name: 'Xanh lá' },
                  { color: '#FFA07A', name: 'Cam nhạt' },
                  { color: '#20B2AA', name: 'Xanh ngọc' },
                  { color: '#9370DB', name: 'Tím medium' },
                  { color: '#32CD32', name: 'Xanh lime' },
                  { color: '#FF69B4', name: 'Hồng đậm' },
                  { color: '#00CED1', name: 'Xanh dương đậm' },
                  { color: '#FFFFFF', name: 'Trắng' },
                  { color: '#2C2C2C', name: 'Xám đen' },
                  { color: '#000000', name: 'Đen' },
                  { color: '#1A1A1A', name: 'Đen nhạt' },
                ].map((item) => (
                  <button
                    key={item.color}
                    onClick={() => setBackgroundColor(item.color)}
                    className="w-8 h-8 rounded border border-white/30 hover:scale-110 transition-transform relative group"
                    style={{ backgroundColor: item.color }}
                    title={item.name}
                  >
                    {backgroundColor === item.color && (
                      <div className="absolute inset-0 rounded border-2 border-yellow-400"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Gradient Presets */}
            <div className="mb-4">
              <h5 className="text-xs font-medium text-white/60 mb-2">Gradient màu sắc</h5>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { 
                    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                    name: 'Tím xanh' 
                  },
                  { 
                    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
                    name: 'Hồng cam' 
                  },
                  { 
                    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
                    name: 'Xanh dương' 
                  },
                  { 
                    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', 
                    name: 'Xanh lá' 
                  },
                  { 
                    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', 
                    name: 'Hồng vàng' 
                  },
                  { 
                    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', 
                    name: 'Pastel' 
                  },
                  { 
                    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', 
                    name: 'Hồng nhẹ' 
                  },
                  { 
                    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', 
                    name: 'Cam nhẹ' 
                  },
                ].map((item) => (
                  <button
                    key={item.gradient}
                    onClick={() => setBackgroundColor(item.gradient)}
                    className="h-12 rounded border border-white/30 hover:scale-105 transition-transform relative group flex items-center justify-center"
                    style={{ background: item.gradient }}
                    title={item.name}
                  >
                    <span className="text-xs font-medium text-white drop-shadow-lg">
                      {item.name}
                    </span>
                    {backgroundColor === item.gradient && (
                      <div className="absolute inset-0 rounded border-2 border-yellow-400"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Themed Color Sets */}
            <div>
              <h5 className="text-xs font-medium text-white/60 mb-2">Bảng màu chủ đề</h5>
              <div className="space-y-2">
                {/* Sunset Theme */}
                <div>
                  <span className="text-xs text-white/50 mb-1 block">🌅 Hoàng hôn</span>
                  <div className="flex gap-1">
                    {[
                      '#FF6B35', '#F7931E', '#FFD23F', '#FF8C94', '#FF6B9D'
                    ].map((color) => (
                      <button
                        key={color}
                        onClick={() => setBackgroundColor(color)}
                        className="w-6 h-6 rounded border border-white/30 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Ocean Theme */}
                <div>
                  <span className="text-xs text-white/50 mb-1 block">🌊 Đại dương</span>
                  <div className="flex gap-1">
                    {[
                      '#006A6B', '#0582CA', '#4FB3D9', '#7DDBD7', '#A8E6CF'
                    ].map((color) => (
                      <button
                        key={color}
                        onClick={() => setBackgroundColor(color)}
                        className="w-6 h-6 rounded border border-white/30 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Forest Theme */}
                <div>
                  <span className="text-xs text-white/50 mb-1 block">🌲 Rừng xanh</span>
                  <div className="flex gap-1">
                    {[
                      '#2F5233', '#4A7C59', '#8FB996', '#B4E7CE', '#D8F3DC'
                    ].map((color) => (
                      <button
                        key={color}
                        onClick={() => setBackgroundColor(color)}
                        className="w-6 h-6 rounded border border-white/30 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

            {/* Info */}
            <div className="pt-4 border-t border-white/10">
              <h4 className="text-sm font-medium text-white/70 mb-2">Hướng dẫn</h4>
              <ul className="text-xs text-white/50 space-y-1">
                <li>• Tải lên file VRM của bạn</li>
                <li>• Chat với AI bằng tiếng Việt</li>
                <li>• AI sẽ trả lời bằng giọng nói</li>
                <li>• Avatar sẽ cử động theo ngữ cảnh</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
