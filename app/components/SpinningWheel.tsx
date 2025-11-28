'use client';

import { useEffect, useRef, useState } from 'react';

interface SpinningWheelProps {
  options: string[];
  isSpinning: boolean;
  onSpinComplete: (winner: string) => void;
}

export default function SpinningWheel({ options, isSpinning, onSpinComplete }: SpinningWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const animationRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number>(0);
  const finalRotationRef = useRef<number>(0);

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
    '#FF8C94', '#A8E6CF', '#FFD3B6', '#FFAAA5', '#FF8B94'
  ];

  useEffect(() => {
    drawWheel();
  }, [options, rotation]);

  useEffect(() => {
    if (isSpinning) {
      startSpin();
    }
  }, [isSpinning]);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);

    const sliceAngle = (2 * Math.PI) / options.length;

    options.forEach((option, index) => {
      const startAngle = index * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();

      // Draw border
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px Arial';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      const text = option.length > 15 ? option.substring(0, 13) + '...' : option;
      ctx.fillText(text, radius * 0.65, 5);
      ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();

    // Draw pointer/arrow at top
    ctx.beginPath();
    ctx.moveTo(centerX - 15, 20);
    ctx.lineTo(centerX + 15, 20);
    ctx.lineTo(centerX, 50);
    ctx.closePath();
    ctx.fillStyle = '#FF4444';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const startSpin = () => {
    // Generate a truly random final rotation
    // Multiple full rotations (10-15) plus random final position
    const minRotations = 10;
    const maxRotations = 15;
    const randomRotations = Math.random() * (maxRotations - minRotations) + minRotations;
    const randomFinalAngle = Math.random() * 360;

    finalRotationRef.current = randomRotations * 360 + randomFinalAngle;
    startTimeRef.current = Date.now();

    animate();
  };

  const animate = () => {
    const currentTime = Date.now();
    const elapsed = currentTime - startTimeRef.current;
    const duration = 5000; // 5 seconds

    if (elapsed < duration) {
      // Easing function for smooth deceleration
      const progress = elapsed / duration;
      const easeOut = 1 - Math.pow(1 - progress, 4);

      const currentRotation = finalRotationRef.current * easeOut;
      setRotation(currentRotation);

      animationRef.current = requestAnimationFrame(animate);
    } else {
      // Spin complete
      setRotation(finalRotationRef.current);

      // Calculate winner
      const normalizedRotation = finalRotationRef.current % 360;
      const sliceAngle = 360 / options.length;

      // The arrow is at the top (270 degrees in canvas coordinates)
      // After rotating, we need to find which original slice is at that position
      // We subtract the rotation from the arrow position to find the original angle
      const arrowPosition = 270; // Top of the wheel in canvas coordinates (where 0° is at 3 o'clock)
      const originalAngle = (arrowPosition - normalizedRotation + 360) % 360;
      const winningIndex = Math.floor(originalAngle / sliceAngle) % options.length;

      setTimeout(() => {
        onSpinComplete(options[winningIndex]);
      }, 100);
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        className="max-w-full h-auto drop-shadow-2xl"
      />
    </div>
  );
}
