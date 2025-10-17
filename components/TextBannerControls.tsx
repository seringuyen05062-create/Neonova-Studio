"use client";
import { useTextBanner } from "@/lib/stores/textBanner";
import { useEffect, useState } from "react";

export function TextBannerControls() {
  const { text, color, size, depth, z, y, bevel, glow, visible, style, animation, set } = useTextBanner();
  const [showPresets, setShowPresets] = useState(false);

  // Lưu/khôi phục setting
  useEffect(() => {
    console.log('TextBannerControls mount, current state:', { text, visible, color, size });
    
    const raw = localStorage.getItem("textBanner.v2") || localStorage.getItem("textBanner.v1");
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        console.log('Loading saved settings:', saved);
        set(saved);
      } catch (e) {
        console.warn("Failed to load text banner settings");
        // Force reset to default
        set({ text: "MEGA LIVE", visible: true, color: "#ff66cc", size: 1.2 });
      }
    } else {
      // Force set defaults if no saved data
      console.log('No saved data, setting defaults');
      set({ text: "MEGA LIVE", visible: true, color: "#ff66cc", size: 1.2, y: 3.2, z: -6 });
    }
  }, [set]);

  useEffect(() => {
    localStorage.setItem(
      "textBanner.v2",
      JSON.stringify({ text, color, size, depth, z, y, bevel, glow, visible, style, animation })
    );
  }, [text, color, size, depth, z, y, bevel, glow, visible, style, animation]);

  const presets = [
    { name: "MEGA LIVE", text: "MEGA LIVE", color: "#ff66cc" },
    { name: "SHOP NOW", text: "SHOP NOW", color: "#00ff88" },
    { name: "FOLLOW & SHARE", text: "FOLLOW & SHARE", color: "#66ccff" },
    { name: "LIVE STREAM", text: "LIVE STREAM", color: "#ff6666" },
    { name: "NEW SONG", text: "NEW SONG", color: "#ffcc66" },
    { name: "DANCE TIME", text: "DANCE TIME", color: "#cc66ff" },
  ];

  return (
    <div className="rounded-xl bg-white/90 backdrop-blur-sm p-4 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-bold text-lg text-gray-800">🎬 Banner 3D</div>
        <button
          onClick={() => set({ visible: !visible })}
          className={`px-3 py-1 rounded-full text-sm font-medium transition ${
            visible 
              ? "bg-green-500 text-white" 
              : "bg-gray-300 text-gray-600"
          }`}
        >
          {visible ? "HIỆN" : "ẨN"}
        </button>
      </div>

      {visible && (
        <>
          {/* Text Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 Nội dung
            </label>
            <input
              className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 focus:border-pink-400 focus:outline-none"
              value={text}
              onChange={(e) => set({ text: e.target.value })}
              placeholder="Nhập text hiển thị..."
              maxLength={20}
            />
            <div className="text-xs text-gray-500 mt-1">
              {text.length}/20 ký tự
            </div>
          </div>

          {/* Presets */}
          <div>
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-pink-400 to-purple-500 text-white font-medium hover:from-pink-500 hover:to-purple-600 transition"
            >
              🎨 Mẫu có sẵn {showPresets ? "▲" : "▼"}
            </button>
            
            {showPresets && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {presets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => set({ text: preset.text, color: preset.color })}
                    className="p-2 text-xs rounded-md bg-gray-100 hover:bg-gray-200 transition border"
                    style={{ borderColor: preset.color }}
                  >
                    <div style={{ color: preset.color }} className="font-bold">
                      {preset.name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🎨 Màu chữ
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => set({ color: e.target.value })}
                className="w-12 h-10 rounded-lg border-2 border-gray-200 cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => set({ color: e.target.value })}
                className="flex-1 rounded-lg border-2 border-gray-200 px-3 py-2 font-mono text-sm"
                placeholder="#ff66cc"
              />
            </div>
          </div>

          {/* Size Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📏 Kích cỡ: {size.toFixed(1)}
              </label>
              <input
                type="range"
                min={0.5}
                max={3}
                step={0.1}
                value={size}
                onChange={(e) => set({ size: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔲 Độ dày: {depth.toFixed(1)}
              </label>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.1}
                value={depth}
                onChange={(e) => set({ depth: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          {/* Position Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📍 Sau/Trước: {z.toFixed(1)}
              </label>
              <input
                type="range"
                min={-15}
                max={-2}
                step={0.5}
                value={z}
                onChange={(e) => set({ z: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ⬆️ Cao/Thấp: {y.toFixed(1)}
              </label>
              <input
                type="range"
                min={1}
                max={5}
                step={0.2}
                value={y}
                onChange={(e) => set({ y: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          {/* Style & Animation */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎨 Phong cách
              </label>
              <select
                value={style}
                onChange={(e) => set({ style: e.target.value as any })}
                className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm"
              >
                <option value="modern">🚀 Modern</option>
                <option value="retro">📼 Retro</option>
                <option value="neon">✨ Neon</option>
                <option value="elegant">💎 Elegant</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎬 Animation
              </label>
              <select
                value={animation}
                onChange={(e) => set({ animation: e.target.value as any })}
                className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm"
              >
                <option value="float">🎈 Float</option>
                <option value="pulse">💗 Pulse</option>
                <option value="bounce">⚡ Bounce</option>
                <option value="static">📌 Static</option>
              </select>
            </div>
          </div>

          {/* Effects */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={bevel}
                onChange={(e) => set({ bevel: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium">✨ Bo viền 3D</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={glow}
                onChange={(e) => set({ glow: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium">🌟 Hiệu ứng sáng</span>
            </label>
          </div>
        </>
      )}
    </div>
  );
}