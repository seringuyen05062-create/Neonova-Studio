/**
 * Canvas Confetti Wrapper - Sử dụng thư viện canvas-confetti
 * Dynamic import để tránh SSR issues
 */
export class CanvasConfetti {
  constructor() {
    console.log('[CanvasConfetti] System initialized');
  }

  /**
   * Bắn pháo giấy từ 2 góc dưới màn hình, rơi vào giữa (nơi model 3D)
   */
  async fireBothSides() {
    console.log('[CanvasConfetti] fireBothSides called!');
    
    try {
      // Dynamic import để tránh SSR issues
      const confettiModule = await import('canvas-confetti');
      const confetti = confettiModule.default;
      
      console.log('[CanvasConfetti] Confetti module loaded!');
      
      const colors = ['#bb0000', '#ffffff', '#ff8800', '#ffdd00', '#00ff00', '#00bbff', '#aa00ff'];
      
      // Bắn từ góc DƯỚI BÊN TRÁI
      console.log('[CanvasConfetti] Firing from left corner...');
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
        console.log('[CanvasConfetti] Firing from right corner...');
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
        console.log('[CanvasConfetti] Firing center burst...');
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
      
      console.log('[CanvasConfetti] All confetti fired!');
    } catch (error) {
      console.error('[CanvasConfetti] Error:', error);
    }
  }

  /**
   * Bắn pháo giấy nổ tung từ giữa màn hình
   */
  async burst() {
    try {
      const confettiModule = await import('canvas-confetti');
      const confetti = confettiModule.default;
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (error) {
      console.error('[CanvasConfetti] Error in burst:', error);
    }
  }

  /**
   * Cleanup
   */
  dispose() {
    console.log('[CanvasConfetti] Disposed');
  }
}
