import { VRM } from '@pixiv/three-vrm';
import * as THREE from 'three';

// Chat Types
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

// VRM Types
export interface VRMState {
  vrm: VRM | null;
  isLoading: boolean;
  error: string | null;
  loadVRM: (file: File | string) => Promise<void>;
  setVRM: (vrm: VRM | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Animation Types
export type AnimationType =
  | 'idle'
  | 'wave'
  | 'nod'
  | 'shake'
  | 'point'
  | 'happy'
  | 'sad'
  | 'surprised'
  | 'thinking'
  | 'walk'
  | 'talk'
  | 'jump'
  | 'run'
  | 'dance'
  | 'sit'
  | 'stand'
  | 'clap'
  | 'thumbs_up'
  | 'bow'
  | 'show_full_body'
  | 'peace'
  | 'peace_sign'
  | 'greeting'
  | 'shoot'
  | 'spin'
  | 'model_pose'
  | 'squat'
  | 'nhung_ngay_mau_huou'
  | 'bling_bang_bang_born'
  | 'aiaiai'
  | 'batlayemgiua_canhdongluamachnon'
  | 'tetris'
  | 'shikairodeizu'
  | 'funfunwandafurudays'
  | 'katanapikurisasunotemasongu2023'
  | 'thankful'

export interface AnimationState {
  currentAnimation: AnimationType;
  isAnimating: boolean;
  playAnimation: (type: AnimationType, duration?: number) => void;
  stopAnimation: () => void;
}

// Lip Sync Types
export interface Viseme {
  name: string;
  weight: number;
  duration: number;
}

export interface PhonemeData {
  phoneme: string;
  start: number;
  end: number;
  viseme: string;
}

export interface LipSyncData {
  phonemes: PhonemeData[];
  duration: number;
}

// Audio Types
export interface AudioState {
  isPlaying: boolean;
  currentAudio: HTMLAudioElement | null;
  play: (audioUrl: string, lipSyncData?: LipSyncData) => Promise<void>;
  stop: () => void;
}

// API Types
export interface DeepSeekRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface DeepSeekResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface TTSRequest {
  text: string;
  voice?: string;
  rate?: number;
  pitch?: number;
}

export interface TTSResponse {
  audioUrl: string;
  lipSyncData: LipSyncData;
  duration: number;
}

// Settings Types
export interface Settings {
  voice: string;
  animationSpeed: number;
  volume: number;
  autoPlay: boolean;
  showSubtitles: boolean;
}

export interface SettingsState extends Settings {
  updateSettings: (settings: Partial<Settings>) => void;
}

// Control Panel Types
export interface ControlPanelProps {
  onUploadVRM: (file: File) => void;
  onResetChat: () => void;
  settings: Settings;
  onSettingsChange: (settings: Partial<Settings>) => void;
}

// Scene Types
export interface SceneProps {
  vrm: VRM | null;
  currentAnimation: AnimationType;
  lipSyncData: LipSyncData | null;
  isPlaying: boolean;
}
