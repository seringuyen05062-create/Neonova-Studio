'use client';

import { useState, useRef, useCallback } from 'react';
import { VRM } from '@pixiv/three-vrm';
import { useVRM } from '@/hooks/useVRM';
import { useVRMA } from '@/hooks/useVRMA';
import { useAnimation } from '@/hooks/useAnimation';
import { useChat } from '@/hooks/useChat';
import Scene, { SceneRef } from '@/components/Scene';
import ChatInterface from '@/components/ChatInterface';
import ControlPanel from '@/components/ControlPanel';
import HamburgerMenu from '@/components/HamburgerMenu';
import MultipleVRMUploader from '@/components/MultipleVRMUploader';
import { useBackgroundColor } from '@/hooks/useBackgroundColor';

const VRMA_ANIMATIONS = [
  { name: 'Hiển thị toàn thân', path: '/models/VRMA_01 Hiển thị toàn thân.vrma' },
  { name: 'Chào hỏi', path: '/models/VRMA_02 Chào hỏi.vrma' },
  { name: 'Ký hiệu hòa bình', path: '/models/VRMA_03 Ký hiệu hòa bình.vrma' },
  { name: 'Bắn', path: '/models/VRMA_04 Bắn.vrma' },
  { name: 'Xoay', path: '/models/VRMA_05 Xoay.vrma' },
  { name: 'Tư thế mẫu', path: '/models/VRMA_06 Tư thế mẫu.vrma' },
  { name: 'Tập squat', path: '/models/VRMA_07 Tập squat.vrma' },
  { name: 'tetris', path: '/models/tetris.vrma' },
  { name: 'aiaiai', path: '/models/aiaiai.vrma' },
  { name: 'Bling-Bang-Bang-Born', path: '/models/Bling-Bang-Bang-Born.vrma' },
  { name: 'nhung_ngay_mau_huou', path: '/models/nhung_ngay_mau_huou.vrma' },
  { name: 'katanapikurisasunotemasongu2023', path: '/models/katanapikurisasunotemasongu2023.vrma' },
  { name: 'batlayemgiua_canhdongluamachnon', path: '/models/batlayemgiua canhdongluamachnon.vrma' },
  { name: 'FUNFUNwandafuruDAYS', path: '/models/FUNFUNwandafuruDAYS.vrma' },
  { name: 'shikairodeizu', path: '/models/shikairodeizu.vrma' },
];

export default function Home() {
  // State management
  const [selectedVrm, setSelectedVrm] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [showUI, setShowUI] = useState(true);
  
  // VRM hooks
  const { vrm, isLoading: isVrmLoading, error: vrmError, loadVRM } = useVRM();
  const { animations, loadVRMA, isLoading: isVrmaLoading, error: vrmaError } = useVRMA();
  const { playAnimation, stopAnimation, update: updateAnimation, pauseAutoMouthExpressions, resumeAutoMouthExpressions } = useAnimation(vrm, animations);
  
  // Chat functionality  
  const { messages, isLoading: isChatLoading, sendMessage, clearMessages } = useChat();
  
  // Background color
  const { backgroundColor, setBackgroundColor } = useBackgroundColor();
  
  // Scene reference
  const sceneRef = useRef<SceneRef>(null);

  // File upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    if (file.name.toLowerCase().endsWith('.vrm')) {
      try {
        console.log('Loading VRM file:', file.name);
        await loadVRM(file);
        setSelectedVrm(file.name);
      } catch (error) {
        console.error('Failed to load VRM:', error);
      }
    } else {
      console.warn('Unsupported file type:', file.name);
    }
  }, [loadVRM]);

  // VRMA animation loader
  const handleVRMALoad = useCallback(async (animationName: string) => {
    const animation = VRMA_ANIMATIONS.find(anim => anim.name === animationName);
    if (animation) {
      try {
        await loadVRMA(animation.path, animationName);
      } catch (error) {
        console.error('Failed to load VRMA:', error);
      }
    }
  }, [loadVRMA]);

  // Confetti trigger
  const triggerConfetti = useCallback(() => {
    sceneRef.current?.triggerConfetti();
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-gray-100">
      {/* Hamburger Menu */}
      <HamburgerMenu 
        onDance={() => {}}
        onCelebrate={triggerConfetti}
        onSettings={() => {}}
      />

      <div className="flex h-full">
        {/* Left Panel - Controls */}
        {showUI && (
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            {/* VRM Uploader */}
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold mb-3">VRM Model</h3>
              <MultipleVRMUploader onFileUpload={handleFileUpload} />
              {selectedVrm && (
                <p className="text-sm text-gray-600 mt-2">
                  Loaded: {selectedVrm}
                </p>
              )}
              {vrmError && (
                <p className="text-sm text-red-600 mt-2">
                  Error: {vrmError}
                </p>
              )}
            </div>

            {/* Control Panel */}
            <ControlPanel
              onUploadVRM={handleFileUpload}
              isLoading={isVrmLoading}
              modelName={selectedVrm}
              setModelName={setSelectedVrm}
              backgroundColor={backgroundColor}
              setBackgroundColor={setBackgroundColor}
              isOpen={true}
              setIsOpen={() => {}}
            />

            {/* Chat Interface */}
            <ChatInterface
              messages={messages}
              isLoading={isChatLoading}
              onSendMessage={sendMessage}
              onClear={clearMessages}
            />
          </div>
        )}

        {/* Main Content - 3D Scene */}
        <div className="flex-1">
          <Scene
            ref={sceneRef}
            vrm={vrm}
            onUpdate={updateAnimation}
            aspectRatio={aspectRatio}
            backgroundColor={backgroundColor}
          />
        </div>
      </div>
    </div>
  );
}
