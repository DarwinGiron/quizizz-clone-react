import { useEffect } from 'react';
import confetti from '../../utils/confetti';

export const useConfetti = () => {
  useEffect(() => {
    if (!document.getElementById('confetti-canvas')) {
      const canvas = document.createElement('canvas');
      canvas.id = 'confetti-canvas';
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '9999';
      document.body.appendChild(canvas);
      confetti.create(canvas, { resize: true, useWorker: true });
    }
  }, []);
};