import { create } from "zustand";

type TextBannerState = {
  text: string;
  color: string;
  size: number;      // kích cỡ chữ
  depth: number;     // độ dày (height/extrude)
  z: number;         // khoảng cách phía sau avatar (âm là lùi ra sau)
  y: number;         // độ cao (lên xuống)
  bevel: boolean;
  glow: boolean;
  visible: boolean;  // ẩn/hiện banner
  style: "modern" | "retro" | "neon" | "elegant"; // theme styles
  animation: "float" | "pulse" | "bounce" | "static"; // animation types
  set: (p: Partial<TextBannerState>) => void;
};

export const useTextBanner = create<TextBannerState>((set) => ({
  text: "MEGA LIVE",
  color: "#ff66cc",
  size: 1.2,
  depth: 0.3,
  z: -6,
  y: 3.2,
  bevel: true,
  glow: true,
  visible: true,
  style: "modern",
  animation: "float",
  set: (p) => set((state) => ({ ...state, ...p })),
}));