"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useVRM } from '@/hooks/useVRM';
import { useMultiVRM } from '@/hooks/useMultiVRM';
import { useMultiAnimation } from '@/hooks/useMultiAnimation';
import { useVRMA } from '@/hooks/useVRMA';
import { useChat } from '@/hooks/useChat';
import { useAnimation } from '@/hooks/useAnimation';
import { useBackgroundColor } from '@/hooks/useBackgroundColor';
import ChatInterface from '@/components/ChatInterface';
import ControlPanel from '@/components/ControlPanel';
import HamburgerMenu from '@/components/HamburgerMenu';
import { LipSyncController } from '@/lib/lip-sync';
import { AnimationType } from '@/types';
import type { SceneRef } from '@/components/Scene';
import axios from 'axios';

// Dynamically import Scene to avoid SSR issues with Three.js
const Scene = dynamic(() => import('@/components/Scene'), { ssr: false });
const MultiVRMScene = dynamic(() => import('@/components/MultiVRMScene').then(mod => ({ default: mod.MultiVRMScene })), { ssr: false });

// VRMA animation files mapping
const VRMA_FILES = [
  { name: 'show_full_body', path: '/models/VRMA_01 Hiển thị toàn thân.vrma' },
  { name: 'peace_sign', path: '/models/VRMA_03 Ký hiệu hòa bình.vrma' },
  { name: 'shoot', path: '/models/VRMA_04 Bắn.vrma' },
  { name: 'spin', path: '/models/VRMA_05 Xoay.vrma' },
  { name: 'model_pose', path: '/models/VRMA_06 Tư thế mẫu.vrma' },
  { name: 'squat', path: '/models/VRMA_07 Tập squat.vrma' },
  { name: 'nhung_ngay_mau_huou', path: '/models/nhung_ngay_mau_huou.vrma' },
  { name: 'bling_bang_bang_born', path: '/models/Bling-Bang-Bang-Born.vrma' },
  { name: 'aiaiai', path: '/models/aiaiai.vrma' },
  { name: 'batlayemgiua_canhdongluamachnon', path: '/models/batlayemgiua canhdongluamachnon.vrma' },
  { name: 'tetris', path: '/models/tetris.vrma' },
  { name: 'shikairodeizu', path: '/models/shikairodeizu.vrma' },
  { name: 'funfunwandafurudays', path: '/models/FUNFUNwandafuruDAYS.vrma' },
  { name: 'katanapikurisasunotemasongu2023', path: '/models/katanapikurisasunotemasongu2023.vrma' },
];

export default function Home() {
  
  // Initialize refs first
  const lipSyncControllerRef = useRef<LipSyncController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  
  // const { vrm, isLoading: vrmLoading, loadVRM } = useVRM(); // Comment out single VRM
  
  // Multi-VRM system
  const multiVRM = useMultiVRM();
  const { vrms, byIndex, loadedCount, isAnyLoading: multiLoading } = multiVRM;
  
  // For compatibility, use main VRM as single VRM
  const vrm = byIndex.get(0);
  const vrmLoading = byIndex.isLoading(0);
  const loadVRM = (file: File) => multiVRM.loadVRM(0, file);
  const multiAnimation = useMultiAnimation(vrms);

  // State to track which mode we're in
  const [isMultiMode, setIsMultiMode] = useState(false);
  
  // Debug mode changes
  useEffect(() => {
    console.log('isMultiMode changed to:', isMultiMode);
  }, [isMultiMode]);
  const vrmaHook = useVRMA();
  const { animations: vrmaAnimations, loadVRMA, reloadAllWithVRM } = vrmaHook;
  const { playAnimation, stopAnimation, update: updateAnimation, pauseAutoFacialExpressions, resumeAutoFacialExpressions } = useAnimation(vrm, vrmaAnimations);
  const { sendMessage, messages, isLoading: chatLoading, clearMessages } = useChat();
  const { backgroundColor, setBackgroundColor } = useBackgroundColor();
  
  const [volume, setVolume] = useState(0.8);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const musicRef = useRef<HTMLAudioElement | null>(null); // audio cho nhạc nền
  const danceIntervalRef = useRef<NodeJS.Timeout | null>(null); // Ref cho interval nhảy
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref cho idle timeout
  const idleSequenceRef = useRef<NodeJS.Timeout | null>(null); // Ref cho idle sequence
  const allIdleTimeoutsRef = useRef<NodeJS.Timeout[]>([]); // Array chứa TẤT CẢ timeouts của idle sequence
  const sceneRef = useRef<SceneRef>(null); // Ref for Scene component

  // State cho model và user info
  const [modelName, setModelName] = useState('');
  const [userName, setUserName] = useState('');
  const [userAge, setUserAge] = useState('');
  const [userGender, setUserGender] = useState('');
  const [userInfoSaved, setUserInfoSaved] = useState(false);

  // Thêm state cho tỷ lệ khung hình
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('16:9');

  // Đặt nền đen cho body khi app mount
  useEffect(() => {
    document.body.style.backgroundColor = '#000000';
    document.body.style.backgroundImage = 'none';

    return () => {
      // Cleanup nếu cần thiết
    };
  }, []);

  // Idle animation sequence: model_pose -> spin -> shoot -> squat -> model_pose (loop)
  const startIdleSequence = useCallback(() => {
    // Clear any existing idle sequence và TẤT CẢ timeouts
    if (idleSequenceRef.current) {
      clearTimeout(idleSequenceRef.current);
      idleSequenceRef.current = null;
    }
    
    // Clear tất cả timeouts cũ
    allIdleTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    allIdleTimeoutsRef.current = [];

    const runSequence = () => {
      console.log('[Idle] Starting idle sequence...');
      
      // Clear tất cả timeouts cũ trước khi tạo mới
      allIdleTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      allIdleTimeoutsRef.current = [];
      
      // Get animation durations
      const spinClips = vrmaAnimations?.get('spin');
      const shootClips = vrmaAnimations?.get('shoot');
      const squatClips = vrmaAnimations?.get('squat');
      const modelPoseClips = vrmaAnimations?.get('model_pose');

      const spinDuration = (spinClips && spinClips[0]?.duration) || 2.0;
      const shootDuration = (shootClips && shootClips[0]?.duration) || 2.0;
      const squatDuration = (squatClips && squatClips[0]?.duration) || 2.0;
      const modelPoseDuration = (modelPoseClips && modelPoseClips[0]?.duration) || 3.0;

      let totalTime = 0;

      // Spin animation
      const timeout1 = setTimeout(() => {
        console.log('[Idle] Playing spin animation');
        playAnimation('spin', spinDuration);
      }, totalTime);
      allIdleTimeoutsRef.current.push(timeout1);
      totalTime += spinDuration * 1000;

      // Shoot animation
      const timeout2 = setTimeout(() => {
        console.log('[Idle] Playing shoot animation');
        playAnimation('shoot', shootDuration);
      }, totalTime);
      allIdleTimeoutsRef.current.push(timeout2);
      totalTime += shootDuration * 1000;

      // Squat animation
      const timeout3 = setTimeout(() => {
        console.log('[Idle] Playing squat animation');
        playAnimation('squat', squatDuration);
      }, totalTime);
      allIdleTimeoutsRef.current.push(timeout3);
      totalTime += squatDuration * 1000;

      // Back to model_pose
      const timeout4 = setTimeout(() => {
        console.log('[Idle] Playing model_pose');
        playAnimation('model_pose', modelPoseDuration);
        // After model_pose, wait 10s then start sequence again
        idleTimeoutRef.current = setTimeout(() => {
          runSequence();
        }, 10000);
      }, totalTime);
      allIdleTimeoutsRef.current.push(timeout4);
    };

    // Start sequence after 10s of inactivity
    idleTimeoutRef.current = setTimeout(() => {
      runSequence();
    }, 10000);
  }, [playAnimation, vrmaAnimations]);

  // Reset idle timer when any action occurs
  const resetIdleTimer = useCallback(() => {
    // Clear existing timers
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
    if (idleSequenceRef.current) {
      clearTimeout(idleSequenceRef.current);
      idleSequenceRef.current = null;
    }
    // Start new idle timer
    startIdleSequence();
  }, [startIdleSequence]);

  // When VRM is loaded, load and retarget all VRMA animations
  useEffect(() => {
    // Chỉ sử dụng model chính (index 0) cho lip sync
    const mainVRM = byIndex.get(0);
    if (mainVRM) {
      // Initialize lip sync controller with pause/resume callbacks
      lipSyncControllerRef.current = new LipSyncController(mainVRM, {
        onLipSyncStart: () => {
          console.log('[Page] Pausing auto facial expressions for lip sync');
          pauseAutoFacialExpressions();
        },
        onLipSyncEnd: () => {
          console.log('[Page] Resuming auto facial expressions after lip sync');
          resumeAutoFacialExpressions();
        }
      });

      // Load và retarget tất cả VRMA, sau đó play tư thế mẫu mặc định
      const loadAndRetargetAnimations = async () => {
        console.log('🔄 Loading VRMA animations with official API...');
        console.log('📋 VRMA_FILES to load:', VRMA_FILES);
        await reloadAllWithVRM(mainVRM, VRMA_FILES);

        // Đảm bảo lấy lại animations mới nhất sau khi reload
        console.log('✅ Available animations after reload:', Array.from(vrmaHook.animations.keys()));
        const modelPoseClips = vrmaHook.animations.get('model_pose');
        const duration = modelPoseClips && modelPoseClips[0] ? modelPoseClips[0].duration : 3.0;
        playAnimation('model_pose', duration);
      };

      loadAndRetargetAnimations();
    }

    return () => {
      lipSyncControllerRef.current?.stopLipSync();
      // Cleanup dance interval when component unmounts or VRM changes
      if (danceIntervalRef.current) {
        clearInterval(danceIntervalRef.current);
        danceIntervalRef.current = null;
      }
      // Cleanup idle timers
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = null;
      }
      if (idleSequenceRef.current) {
        clearTimeout(idleSequenceRef.current);
        idleSequenceRef.current = null;
      }
      // 🔥 Clear tất cả idle timeouts
      allIdleTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      allIdleTimeoutsRef.current = [];
    };
  }, [byIndex, reloadAllWithVRM, playAnimation, pauseAutoFacialExpressions, resumeAutoFacialExpressions]);

  // Start idle sequence when VRM and animations are loaded
  useEffect(() => {
    const mainVRM = byIndex.get(0);
    if (mainVRM && vrmaAnimations.size > 0) {
      // Start idle sequence after initial setup
      const timer = setTimeout(() => {
        startIdleSequence();
      }, 1000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [byIndex, vrmaAnimations.size, startIdleSequence]);

  // Handle VRM upload
  const handleUploadVRM = async (file: File) => {
    try {
      await loadVRM(file);
    } catch (error) {
      console.error('Error uploading VRM:', error);
      alert('Không thể tải mô hình VRM. Vui lòng thử file khác.');
    }
  };

  // Handle sending message

  // Helper: Clear tất cả timers (idle, dance, sequence)
  const clearAllTimers = () => {
    console.log('[Timer] Clearing all timers...');
    
    // Clear idle timers
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
    if (idleSequenceRef.current) {
      clearTimeout(idleSequenceRef.current);
      idleSequenceRef.current = null;
    }
    
    // 🔥 QUAN TRỌNG: Clear TẤT CẢ timeouts của idle sequence
    console.log(`[Timer] Clearing ${allIdleTimeoutsRef.current.length} idle timeouts`);
    allIdleTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    allIdleTimeoutsRef.current = [];
    
    // Clear dance interval
    if (danceIntervalRef.current) {
      clearInterval(danceIntervalRef.current);
      danceIntervalRef.current = null;
    }
    
    // Stop music if playing
    if (musicRef.current && !musicRef.current.paused) {
      musicRef.current.pause();
      musicRef.current.currentTime = 0;
    }
  };

  // Logic phát nhạc và nhảy động với animation và nhạc tuỳ chỉnh
  const playDanceWithMusic = (animationName: string = 'nhung_ngay_mau_huou', musicPath: string = '/music/nhung_ngay_mau_huou.mp3') => {
    if (!musicRef.current || !vrmaAnimations) {
      console.error('[Dance] Missing musicRef or vrmaAnimations');
      return;
    }
    
    // 🔥 QUAN TRỌNG: Clear ALL timers và STOP tất cả animations
    clearAllTimers();
    stopAnimation(); // Dừng hẳn animation hiện tại
    console.log('[Dance] Cleared all timers and stopped all animations');
    
    // 🔍 DEBUG: Kiểm tra animations có sẵn
    console.log('[Dance] 🔍 Available animations:', Array.from(vrmaAnimations.keys()));
    console.log('[Dance] 🎯 Looking for animation:', animationName);
    
    // Lấy duration THỰC của animation clip
    const danceClips = vrmaAnimations.get(animationName);
    if (!danceClips || danceClips.length === 0) {
      console.error(`[Dance] ❌ Animation "${animationName}" not found!`);
      console.error(`[Dance] Available: ${Array.from(vrmaAnimations.keys()).join(', ')}`);
      return;
    }
    
    const danceClip = danceClips[0];
    const animationDuration = danceClip.duration; // Duration thật từ VRMA file
    
    console.log(`[Dance] Playing: ${animationName}, duration: ${animationDuration}s, music: ${musicPath}`);
    
    musicRef.current.src = musicPath;
    musicRef.current.volume = 0.8;
    
    musicRef.current.onplay = () => {
      console.log('[Dance] Music started, playing dance animation with auto-loop...');
      
      // Play animation MỘT LẦN - animation sẽ tự loop vô hạn (LoopRepeat)
      // KHÔNG cần setInterval nữa vì animation đã được set LoopRepeat trong animation-controller
      playAnimation(animationName as any, animationDuration);
      console.log(`[Dance] Animation "${animationName}" will auto-loop until music ends`);
    };
    
    musicRef.current.onended = () => {
      console.log('[Dance] Music ended, stopping dance animation...');
      
      // Dừng animation nhảy bằng cách stop action hiện tại
      stopAnimation();
      
      // Về tư thế mẫu
      playAnimation('model_pose', 2.0);
      
      // QUAN TRỌNG: Restart idle timer SAU khi về pose mẫu
      setTimeout(() => {
        console.log('[Dance] Restarting idle sequence...');
        startIdleSequence();
      }, 2000); // Chờ 2s sau model_pose rồi mới start idle timer
    };
    
    // Xử lý khi nhạc bị pause (user dừng giữa chừng)
    musicRef.current.onpause = () => {
      console.log('[Dance] Music paused, stopping dance animation');
      stopAnimation();
    };
    
    musicRef.current.play().catch(error => {
      console.error('[Dance] Error playing music:', error);
    });
  };

  const handleSendMessage = async (content: string) => {
    // QUAN TRỌNG: Clear tất cả timers khi user gửi message
    // Điều này đảm bảo idle sequence không trigger trong khi đang chat/nhảy
    clearAllTimers();
    console.log('[Message] User sent message, all timers cleared');
    
    const result = await sendMessage(content);

    if (result && result.analysis) {
      const { emotion, shouldGesture, gestureType, actionRequested } = result.analysis;

      // Play emotion animation
      if (emotion !== 'neutral') {
        playAnimation(emotion, 2.0);
      }

      // Play gesture or action animation
      if (shouldGesture && gestureType) {
        // For action requests, play immediately with longer duration
        const delay = actionRequested ? 0 : 500;
        const duration = actionRequested ? 3.0 : 1.5;

        setTimeout(() => {
          playAnimation(gestureType, duration);
        }, delay);
      }

      // Generate speech
      await handleTextToSpeech(result.message.content);
    }
  };

  // Handle Text-to-Speech
  const handleTextToSpeech = async (text: string) => {
    try {
      setIsSpeaking(true);
      console.log('[TTS] Starting text-to-speech for:', text);

      // DỪNG IDLE LOOP VÀ TẤT CẢ ANIMATIONS
      clearAllTimers();
      stopAnimation();
      console.log('[TTS] Stopped idle loop and all animations');

      // ANIMATION SEQUENCE WHILE WAITING FOR VOICE
      // 1. Play Animation 01 (Show Full Body) - ~2s
      const showFullBodyClips = vrmaAnimations?.get('show_full_body');
      const anim01Duration = showFullBodyClips && showFullBodyClips[0] ? showFullBodyClips[0].duration : 2.0;
      console.log('[TTS] Playing Animation 01 (Show Full Body) while waiting...');
      playAnimation('show_full_body', anim01Duration);
      
      // 2. After Animation 01, play Animation 03 (Peace Sign) - ~2s
      setTimeout(() => {
        const peaceSignClips = vrmaAnimations?.get('peace_sign');
        const anim03Duration = peaceSignClips && peaceSignClips[0] ? peaceSignClips[0].duration : 2.0;
        console.log('[TTS] Playing Animation 03 (Peace Sign) while waiting...');
        playAnimation('peace_sign', anim03Duration);
        // Animation 03 sẽ dừng ở khung hình cuối (clampWhenFinished = true)
      }, anim01Duration * 1000);

      // Start API call (this runs in parallel with animations)
      // Get TTS data from Vbee API with anime voice settings
      const response = await axios.post('/api/tts', { 
        text,
        rate: 1.1,  // ⚡ Tốc độ vui nhộn cho giọng anime
        voice: 's_hochiminh_female_vyquangcao_advertise_vc'  // 🎤 Giọng nữ Hồ Chí Minh - phong cách quảng cáo sôi động
      });
      
      console.log('[TTS] Response received:', response.data);
      const { audio, lipSyncData, duration } = response.data;

      if (audio) {
        console.log('[TTS] ========== AUDIO AND LIPSYNC DEBUG ==========');
        console.log('[TTS] Audio data received, length:', audio.length);
        console.log('[TTS] LipSync data:', lipSyncData);
        console.log('[TTS] LipSync phonemes count:', lipSyncData?.phonemes?.length || 0);
        console.log('[TTS] LipSync duration:', duration);
        console.log('[TTS] First 3 phonemes:', lipSyncData?.phonemes?.slice(0, 3) || []);
        console.log('[TTS] Voice ready! Starting lip sync (keeping current pose)...');
        // Use Vbee TTS audio with anime voice
        // Model sẽ giữ nguyên pose cuối của Animation 03, chỉ miệng động
        await speakWithVbeeAudio(audio, lipSyncData);
      } else {
        console.error('[TTS] No audio data in response');
      }
    } catch (error) {
      console.error('[TTS] Error with TTS:', error);
      if (axios.isAxiosError(error)) {
        console.error('[TTS] Response data:', error.response?.data);
        console.error('[TTS] Response status:', error.response?.status);
      }
    } finally {
      setIsSpeaking(false);
    }
  };


  // Speak using Vbee TTS audio (Anime Voice)
  const speakWithVbeeAudio = async (audioBase64: string, lipSyncData: any) => {
    return new Promise<void>((resolve) => {
      if (!audioRef.current) {
        console.error('[Audio] Audio element not available');
        resolve();
        return;
      }

      const audio = audioRef.current;
      const audioSrc = `data:audio/mp3;base64,${audioBase64}`;
      console.log('[Audio] Setting audio source, base64 length:', audioBase64.length);
      audio.src = audioSrc;
      audio.volume = volume;
      console.log('[Audio] Volume set to:', volume);

      // Start lip sync animation
      audio.onplay = () => {
        console.log('[Audio] Audio started playing');
        console.log('[LipSync] VRM model available:', !!vrm);
        console.log('[LipSync] LipSync controller available:', !!lipSyncControllerRef.current);
        console.log('[LipSync] LipSync data:', lipSyncData);
        
        // Chỉ lip sync miệng, giữ nguyên pose cuối cùng
        if (lipSyncControllerRef.current) {
          console.log('[LipSync] Starting lip sync with data:', {
            phonemes: lipSyncData?.phonemes?.length || 0,
            duration: lipSyncData?.duration || 0
          });
          lipSyncControllerRef.current.startLipSync(lipSyncData, audio);
        } else {
          console.error('[LipSync] LipSync controller not available');
        }
      };

      // Sau khi lip sync kết thúc, restart idle timer
      audio.onended = () => {
        console.log('[Audio] Audio playback ended');
        lipSyncControllerRef.current?.stopLipSync();
        console.log('[VRMA] Speech ended, restart idle timer');
        // Restart idle timer sau khi nói xong
        setTimeout(() => {
          startIdleSequence();
        }, 2000); // Chờ 2s rồi mới start idle sequence
        resolve();
      };

      audio.onerror = (e) => {
        console.error('[Audio] Error playing audio:', e);
        console.error('[Audio] Audio error details:', audio.error);
        lipSyncControllerRef.current?.stopLipSync();
        resolve();
      };

      console.log('[Audio] Attempting to play audio...');
      audio.play().catch((error) => {
        console.error('[Audio] Play() promise rejected:', error);
        lipSyncControllerRef.current?.stopLipSync();
        resolve();
      });
    });
  };

  // Load thông tin từ localStorage khi mount
  useEffect(() => {
    const info = localStorage.getItem('userInfo');
    if (info) {
      const { modelName, userName, userAge, userGender } = JSON.parse(info);
      setModelName(modelName || '');
      setUserName(userName || '');
      setUserAge(userAge || '');
      setUserGender(userGender || '');
    }
  }, []);

  // Hàm lưu thông tin vào localStorage
  const handleSaveUserInfo = () => {
    localStorage.setItem('userInfo', JSON.stringify({ modelName, userName, userAge, userGender }));
    setUserInfoSaved(true);
    setTimeout(() => setUserInfoSaved(false), 2000);
  };

  // Handler để trigger confetti - Dùng trực tiếp canvas-confetti
  const handleTriggerConfetti = async () => {
    console.log('[Page] 🎉 Button clicked!');
    
    try {
      // Phát âm thanh pháo giấy
      const audio = new Audio('/music/tiengphaogiay.MP3');
      audio.volume = 0.6; // Âm lượng 60%
      audio.play().catch(err => console.error('[Page] Error playing sound:', err));
      
      // Import canvas-confetti dynamically
      const confettiModule = await import('canvas-confetti');
      const confetti = confettiModule.default;
      
      console.log('[Page] Confetti loaded, firing...');
      
      const colors = ['#bb0000', '#ffffff', '#ff8800', '#ffdd00', '#00ff00', '#00bbff', '#aa00ff'];
      
      // Bắn từ góc DƯỚI BÊN TRÁI
      confetti({
        particleCount: 150,
        angle: 45,
        spread: 60,
        origin: { x: 0, y: 1 },
        colors: colors,
        startVelocity: 70,
        decay: 0.92,
        gravity: 1.2,
        scalar: 1.3,
        ticks: 500
      });

      // Bắn từ góc DƯỚI BÊN PHẢI
      setTimeout(() => {
        confetti({
          particleCount: 150,
          angle: 135,
          spread: 60,
          origin: { x: 1, y: 1 },
          colors: colors,
          startVelocity: 70,
          decay: 0.92,
          gravity: 1.2,
          scalar: 1.3,
          ticks: 500
        });
      }, 100);

      // Burst giữa
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { x: 0.5, y: 0.4 },
          colors: colors,
          startVelocity: 40,
          gravity: 1.0,
          scalar: 1.2,
          ticks: 400
        });
      }, 200);
      
      console.log('[Page] Confetti fired successfully!');
    } catch (error) {
      console.error('[Page] Error firing confetti:', error);
    }
  };

  // State cho nút nhảy và modal chọn bài hát
  const [showDanceModal, setShowDanceModal] = useState(false);
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  const [showControlPanel, setShowControlPanel] = useState(false);
  // Danh sách bài hát thực tế từ thư mục music
  const songs = [
    { name: 'Những ngày màu hươu', id: 'nhung_ngay_mau_huou', file: '/music/nhung_ngay_mau_huou.mp3', animationName: 'nhung_ngay_mau_huou' },
    { name: 'Bling-Bang-Bang-Born', id: 'bling_bang_bang_born', file: '/music/Bling-Bang-Bang-Born.mp3', animationName: 'bling_bang_bang_born' },
    { name: 'AIAIAI', id: 'aiaiai', file: '/music/aiaiai.mp3', animationName: 'aiaiai' },
    { name: 'Bắt Lá Yêm Giữa Cảnh Đồng', id: 'batlayemgiua_canhdongluamachnon', file: '/music/batlayemgiua canhdongluamachnon.mp3', animationName: 'batlayemgiua_canhdongluamachnon' },
    { name: 'Tetris Theme', id: 'tetris', file: '/music/tetris.mp3', animationName: 'tetris' },
    { name: 'Shika Iro Deizu', id: 'shikairodeizu', file: '/music/shikairodeizu.mp3', animationName: 'shikairodeizu' },
    { name: 'FUNFUN Wandafuru DAYS', id: 'funfunwandafurudays', file: '/music/FUNFUNwandafuruDAYS.mp3', animationName: 'funfunwandafurudays' },
    { name: 'Katana Pikurisasu No Tema Song 2023', id: 'katanapikurisasunotemasongu2023', file: '/music/katanapikurisasunotemasongu2023.mp3', animationName: 'katanapikurisasunotemasongu2023' },
  ];
  // Xử lý khi chọn bài hát từ nút UI
  const handleSelectSong = (songId: string) => {
    console.log('[Dance] Song selected from UI:', songId);
    
    setSelectedSong(songId);
    setShowDanceModal(false);
    
    // Tìm bài hát được chọn
    const song = songs.find(s => s.id === songId);
    if (!song) {
      console.error('[Dance] Song not found:', songId);
      return;
    }

    console.log(`[Dance] Playing: ${song.name} - animation: ${song.animationName}, music: ${song.file}`);

    // Sử dụng system dance mới với auto-loop
    playDanceWithMusic(song.animationName, song.file);
  };
  return (
  <main className="flex h-screen w-screen overflow-hidden">
      {/* Chat Interface - Left Side */}
      <div className="w-96 h-full flex-shrink-0">
        <div className="flex flex-col h-full">

          {/* Chat Interface */}
          <div className="flex-1">
            <ChatInterface
              messages={messages}
              isLoading={chatLoading || isSpeaking}
              onSendMessage={handleSendMessage}
              onClear={clearMessages}
              menuComponent={
                <HamburgerMenu
                  onDance={() => setShowDanceModal(true)}
                  onCelebrate={handleTriggerConfetti}
                  onSettings={() => setShowControlPanel(!showControlPanel)}
                />
              }
            />
          </div>
        </div>
  {/* Modal chọn bài hát cho nút nhảy ở cột chat */}
  {showDanceModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-start pl-4 pointer-events-none">
      <div className="bg-white rounded-lg p-6 w-80 shadow-xl animate-fade-in ml-4 pointer-events-auto">
        <h3 className="text-lg font-bold mb-4 text-pink-600">Chọn bài hát để nhảy</h3>
        <ul className="space-y-2 mb-4">
          {songs.map(song => (
            <li key={song.id}>
              <button
                className="w-full py-2 rounded bg-pink-100 text-pink-700 font-bold hover:bg-pink-200 transition"
                onClick={() => handleSelectSong(song.id)}
              >
                {song.name}
              </button>
            </li>
          ))}
        </ul>
        <button
          className="w-full py-2 rounded bg-gray-300 text-gray-700 font-bold hover:bg-gray-400 transition"
          onClick={() => setShowDanceModal(false)}
        >
          Đóng
        </button>
      </div>
    </div>
  )}
      </div>

      {/* 3D Scene - Right Side with Frame */}
      <div className={`flex-1 h-full p-4 ${aspectRatio === '9:16' ? 'flex flex-col items-center justify-center' : 'flex flex-col'}`}>
        {/* 3D Viewport Label */}
        <div className="mb-3 text-center">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent drop-shadow-lg">
            Neonova Studio
          </h3>
        </div>
        
        <div className={`
          relative flex-1 w-full 
          ${aspectRatio === '9:16' ? 'aspect-[9/16] max-w-[450px]' : 'w-full'} 
          border-4 border-black/80 rounded-2xl 
          bg-gradient-to-br from-black/20 to-black/40 
          backdrop-blur-sm shadow-2xl overflow-hidden
          ring-2 ring-black/60 hover:border-black/90 transition-all duration-300
          before:absolute before:inset-0 before:rounded-2xl 
          before:bg-gradient-to-br before:from-black/10 before:to-transparent before:pointer-events-none
        `}>
          {/* Corner decorations */}
          <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-black/60 rounded-tl-lg"></div>
          <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-black/60 rounded-tr-lg"></div>
          <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-black/60 rounded-bl-lg"></div>
          <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-black/60 rounded-br-lg"></div>
          
          {/* Status indicator */}
          <div className="absolute top-4 left-4 z-10">
            <div className="flex items-center space-x-2 text-xs text-white/70">
              <div className={`w-2 h-2 rounded-full ${
                isMultiMode ? (loadedCount > 0 ? 'bg-green-400' : 'bg-gray-400') : (vrm ? 'bg-green-400' : 'bg-gray-400')
              } animate-pulse`}></div>
              <span>{
                isMultiMode 
                  ? (loadedCount > 0 ? `LIVE (${loadedCount}/3)` : 'OFFLINE')
                  : (vrm ? 'LIVE' : 'OFFLINE')
              }</span>
            </div>
          </div>
          
          {/* Conditional Scene Rendering */}
          {(() => {
            console.log('[DEBUG] vrms in page:', {
              count: vrms.filter(Boolean).length,
              slots: [!!byIndex.get(0), !!byIndex.get(1), !!byIndex.get(2)],
              isMultiMode,
              loadedCount
            });
            return isMultiMode ? (
              <MultiVRMScene 
                vrms={vrms} 
                showStudioBackground={true}
                enableGroundSnapper={true}
              />
            ) : (
              <Scene ref={sceneRef} vrm={vrm} onUpdate={updateAnimation} aspectRatio={aspectRatio} backgroundColor={backgroundColor} />
            );
          })()}
        
          {/* Loading Overlay */}
          {(isMultiMode ? multiLoading : vrmLoading) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-white text-lg">Đang tải mô hình VRM...</p>
              </div>
            </div>
          )}

          {/* No VRM Message */}
          {(isMultiMode ? (loadedCount === 0 && !multiLoading) : (!vrm && !vrmLoading)) && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
              <div className="text-center text-white/70">
                <svg className="w-24 h-24 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="text-xl mb-2">Chưa có mô hình VRM</p>
                <p className="text-sm">Nhấn vào nút cài đặt để tải lên mô hình của bạn</p>
              </div>
            </div>
          )}
        </div>
      </div>



      {/* Control Panel */}
      <ControlPanel
        onUploadVRM={handleUploadVRM}
        isLoading={isMultiMode ? multiLoading : vrmLoading}
        modelName={modelName}
        setModelName={setModelName}
        backgroundColor={backgroundColor}
        setBackgroundColor={setBackgroundColor}
        isOpen={showControlPanel}
        setIsOpen={setShowControlPanel}
        onModeChange={(mode) => {
          console.log('App: Mode changing to:', mode, 'was:', isMultiMode);
          setIsMultiMode(mode === 'multi');
        }}
        multiVRM={{
          vrms,
          byIndex,
          loadVRM: multiVRM.loadVRM,
          unloadVRM: multiVRM.unloadVRM,
          loadedCount
        }}
      />

  {/* Hidden audio element for lip sync & dance */}
  <audio id="dance-audio" style={{ display: 'none' }} />
  <audio ref={audioRef} style={{ display: 'none' }} />
  {/* Hidden audio element for music */}
  <audio ref={musicRef} style={{ display: 'none' }} />
    </main>
  );
}
