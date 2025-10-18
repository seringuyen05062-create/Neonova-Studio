'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useMultiVRM } from '@/hooks/useMultiVRM';
import { useMultiAnimation } from '@/hooks/useMultiAnimation';
import { useVbeeTTS } from '@/hooks/useVbeeTTS';
import { MultiVRMUploader } from '@/components/MultiVRMUploader';
import { log } from '@/lib/utils/logger';

// Dynamically import Scene to avoid SSR issues with Three.js
const MultiVRMScene = dynamic(() => import('@/components/MultiVRMScene').then(mod => ({ default: mod.MultiVRMScene })), { ssr: false });

// Animation options for testing
const ANIMATION_OPTIONS = [
  { type: 'greeting', label: 'Greeting', duration: 3000 },
  { type: 'peace_sign', label: 'Peace Sign', duration: 2000 },
  { type: 'spin', label: 'Spin', duration: 4000 },
  { type: 'thinking', label: 'Thinking', duration: 3000 },
  { type: 'model_pose', label: 'Model Pose', duration: 3000 },
  { type: 'squat', label: 'Squat Exercise', duration: 5000 },
  { type: 'shoot', label: 'Shoot', duration: 2000 },
] as const;

const EMOTION_OPTIONS = [
  { type: 'happy', label: '😊 Happy' },
  { type: 'sad', label: '😢 Sad' },
  { type: 'angry', label: '😠 Angry' },
  { type: 'surprised', label: '😲 Surprised' },
  { type: 'neutral', label: '😐 Neutral' },
] as const;

export default function MultiVRMDemo() {
  const multiVRM = useMultiVRM();
  const { vrms, loadedCount, isAnyLoading } = multiVRM;
  
  const multiAnimation = useMultiAnimation(vrms);
  const { 
    playAnimation, 
    stopAnimation, 
    playEmotion, 
    startLipSync, 
    stopLipSync,
    isAnyAnimating,
    currentAnimations,
    getModelAnimationStatus
  } = multiAnimation;

  const { speakAnime, loading: ttsLoading, clearAudio } = useVbeeTTS();

  const [selectedAnimation, setSelectedAnimation] = useState<string>('greeting');
  const [selectedEmotion, setSelectedEmotion] = useState<string>('happy');
  const [selectedModel, setSelectedModel] = useState<number | 'all'>('all');
  const [ttsText, setTtsText] = useState<string>('Xin chào! Tôi là nhân vật ảo VRM. Rất vui được gặp bạn!');
  const [showStudioBackground, setShowStudioBackground] = useState<boolean>(true);
  const [enableGroundSnapper, setEnableGroundSnapper] = useState<boolean>(true);

  // Initialize component
  useEffect(() => {
    log.info('MultiVRMDemo', 'Component initialized', undefined, {
      loadedModels: loadedCount,
      maxModels: multiVRM.MAX_VRM_COUNT
    });
  }, [loadedCount, multiVRM.MAX_VRM_COUNT]);

  // Handle animation playback
  const handlePlayAnimation = useCallback(async () => {
    if (!selectedAnimation) return;

    const animationType = selectedAnimation as any;
    const options = selectedModel === 'all' ? {} : { modelIndex: selectedModel as number };

    try {
      await playAnimation(animationType, options);
      log.info('MultiVRMDemo', 'Animation started', undefined, {
        animation: selectedAnimation,
        target: selectedModel
      });
    } catch (error) {
      log.error('MultiVRMDemo', 'Failed to play animation', error as Error);
    }
  }, [selectedAnimation, selectedModel, playAnimation]);

  // Handle animation stop
  const handleStopAnimation = useCallback(async () => {
    const options = selectedModel === 'all' ? {} : { modelIndex: selectedModel as number };
    
    try {
      await stopAnimation(options);
      log.info('MultiVRMDemo', 'Animation stopped', undefined, {
        target: selectedModel
      });
    } catch (error) {
      log.error('MultiVRMDemo', 'Failed to stop animation', error as Error);
    }
  }, [selectedModel, stopAnimation]);

  // Handle emotion playback
  const handlePlayEmotion = useCallback(async () => {
    if (!selectedEmotion) return;

    const options = selectedModel === 'all' ? {} : { modelIndex: selectedModel as number };

    try {
      await playEmotion(selectedEmotion, options);
      log.info('MultiVRMDemo', 'Emotion played', undefined, {
        emotion: selectedEmotion,
        target: selectedModel
      });
    } catch (error) {
      log.error('MultiVRMDemo', 'Failed to play emotion', error as Error);
    }
  }, [selectedEmotion, selectedModel, playEmotion]);

  // Handle TTS with lip sync
  const handlePlayTTS = useCallback(async () => {
    if (!ttsText.trim()) return;

    try {
      // Clear any existing audio
      clearAudio();
      stopLipSync();

      // Start TTS (simplified for now - full lip sync integration would need more work)
      const audioUrl = await speakAnime(ttsText);
      
      if (audioUrl) {
        log.info('MultiVRMDemo', 'TTS started', undefined, {
          textLength: ttsText.length,
          audioUrl
        });
      }
    } catch (error) {
      log.error('MultiVRMDemo', 'Failed to start TTS', error as Error);
    }
  }, [ttsText, speakAnime, clearAudio, stopLipSync]);

  // Handle TTS stop
  const handleStopTTS = useCallback(() => {
    clearAudio();
    stopLipSync();
    log.info('MultiVRMDemo', 'TTS and lip sync stopped');
  }, [clearAudio, stopLipSync]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Multi-VRM Avatar System
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Upload and control up to 3 VRM characters simultaneously
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${loadedCount > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-gray-600 dark:text-gray-400">
                  {loadedCount}/{multiVRM.MAX_VRM_COUNT} Models
                </span>
              </div>
              {isAnyAnimating && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-blue-600 dark:text-blue-400">Animating</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 3D Scene - Takes up most space */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="aspect-video bg-gray-900 relative">
                {loadedCount > 0 ? (
                  <MultiVRMScene
                    vrms={vrms}
                    showStudioBackground={showStudioBackground}
                    enableGroundSnapper={enableGroundSnapper}
                    onSceneReady={() => {
                      log.info('MultiVRMDemo', 'Scene ready with models', undefined, {
                        loadedCount,
                        models: vrms.map((vrm, i) => ({ index: i, loaded: !!vrm }))
                      });
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <div className="text-6xl mb-4">🎭</div>
                      <div className="text-lg font-medium">No VRM Models Loaded</div>
                      <div className="text-sm">Upload VRM files to get started</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Scene Controls */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showStudioBackground}
                      onChange={(e) => setShowStudioBackground(e.target.checked)}
                      className="rounded"
                    />
                    Studio Background
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={enableGroundSnapper}
                      onChange={(e) => setEnableGroundSnapper(e.target.checked)}
                      className="rounded"
                    />
                    Ground Snapping
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Model Upload */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <MultiVRMUploader
                onUploadComplete={(index, fileName) => {
                  log.info('MultiVRMDemo', 'Model uploaded successfully', undefined, {
                    index,
                    fileName,
                    totalLoaded: loadedCount + 1
                  });
                }}
                onUploadError={(index, error) => {
                  log.error('MultiVRMDemo', 'Model upload failed', new Error(error), {
                    index
                  });
                }}
              />
            </div>

            {/* Animation Controls */}
            {loadedCount > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Animation Controls
                </h3>

                {/* Target Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="all">All Models</option>
                    {vrms.map((vrm, index) => (
                      vrm && (
                        <option key={index} value={index}>
                          {index === 0 ? 'Main Character' : `Assistant ${index}`}
                        </option>
                      )
                    ))}
                  </select>
                </div>

                {/* Animation Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Animation
                  </label>
                  <select
                    value={selectedAnimation}
                    onChange={(e) => setSelectedAnimation(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    {ANIMATION_OPTIONS.map(({ type, label }) => (
                      <option key={type} value={type}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Animation Buttons */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={handlePlayAnimation}
                    disabled={isAnyLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
                  >
                    Play
                  </button>
                  <button
                    onClick={handleStopAnimation}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                  >
                    Stop
                  </button>
                </div>

                {/* Emotion Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Emotion
                  </label>
                  <select
                    value={selectedEmotion}
                    onChange={(e) => setSelectedEmotion(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    {EMOTION_OPTIONS.map(({ type, label }) => (
                      <option key={type} value={type}>{label}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handlePlayEmotion}
                  disabled={isAnyLoading}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-md transition-colors mb-4"
                >
                  Play Emotion
                </button>

                {/* TTS Controls - Only for main model */}
                {vrms[0] && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Text-to-Speech (Main Character)
                      </h4>
                      <textarea
                        value={ttsText}
                        onChange={(e) => setTtsText(e.target.value)}
                        placeholder="Enter text for the main character to speak..."
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={handlePlayTTS}
                          disabled={isAnyLoading || ttsLoading || !ttsText.trim()}
                          className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors text-sm"
                        >
                          {ttsLoading ? 'Speaking...' : 'Speak'}
                        </button>
                        <button
                          onClick={handleStopTTS}
                          disabled={!ttsLoading}
                          className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-md transition-colors text-sm"
                        >
                          Stop
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Model Status */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Model Status
                  </h4>
                  <div className="space-y-1 text-xs">
                    {vrms.map((vrm, index) => {
                      const status = getModelAnimationStatus(index);
                      const modelType = index === 0 ? 'Main' : `Assist${index}`;
                      
                      return vrm ? (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">{modelType}:</span>
                          <span className={`${status.isPlaying ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>
                            {status.isPlaying ? status.currentAnimation : 'Idle'}
                          </span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}