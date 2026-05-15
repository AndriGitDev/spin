'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

interface SpinningWheelProps {
  options: string[];
  spinKey: number;
  onSpinComplete: (winner: string) => void;
}

const CENTER = 320;
const RADIUS = 286;
const POINTER_ANGLE = 270;

const WHEEL_COLORS = [
  '#f43f5e',
  '#22d3ee',
  '#f59e0b',
  '#34d399',
  '#a78bfa',
  '#fb7185',
  '#2dd4bf',
  '#f97316',
  '#60a5fa',
  '#c084fc',
  '#84cc16',
  '#eab308',
  '#06b6d4',
  '#f472b6',
];

function normalizeDegrees(degrees: number) {
  return ((degrees % 360) + 360) % 360;
}

function polarToCartesian(angle: number, radius = RADIUS) {
  const radians = (angle * Math.PI) / 180;

  return {
    x: CENTER + radius * Math.cos(radians),
    y: CENTER + radius * Math.sin(radians),
  };
}

function createSlicePath(startAngle: number, endAngle: number) {
  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${CENTER} ${CENTER}`,
    `L ${start.x} ${start.y}`,
    `A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

function randomFloat() {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const value = new Uint32Array(1);
    window.crypto.getRandomValues(value);
    return value[0] / 4294967296;
  }

  return Math.random();
}

function randomInt(max: number) {
  return Math.floor(randomFloat() * max);
}

function shortenLabel(label: string) {
  return label.length > 18 ? `${label.slice(0, 16)}...` : label;
}

export default function SpinningWheel({ options, spinKey, onSpinComplete }: SpinningWheelProps) {
  const rotationRef = useRef(0);
  const lastSpinKeyRef = useRef(0);
  const completeTimerRef = useRef<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const slices = useMemo(() => {
    const sliceAngle = 360 / Math.max(options.length, 1);

    return options.map((option, index) => {
      const startAngle = index * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const middleAngle = startAngle + sliceAngle / 2;
      const labelPoint = polarToCartesian(middleAngle, RADIUS * 0.62);
      const isUpsideDown = middleAngle > 90 && middleAngle < 270;

      return {
        color: WHEEL_COLORS[index % WHEEL_COLORS.length],
        label: shortenLabel(option),
        labelAngle: isUpsideDown ? middleAngle + 180 : middleAngle,
        labelPoint,
        path: createSlicePath(startAngle, endAngle),
      };
    });
  }, [options]);

  useEffect(() => {
    if (spinKey === 0 || spinKey === lastSpinKeyRef.current || options.length < 2) {
      return;
    }

    lastSpinKeyRef.current = spinKey;

    if (completeTimerRef.current) {
      window.clearTimeout(completeTimerRef.current);
    }

    const winningIndex = randomInt(options.length);
    const sliceAngle = 360 / options.length;
    const safeLandingPoint = (winningIndex + 0.2 + randomFloat() * 0.6) * sliceAngle;
    const targetRotation = normalizeDegrees(POINTER_ANGLE - safeLandingPoint);
    const startRotation = rotationRef.current;
    const rotationDelta = normalizeDegrees(targetRotation - normalizeDegrees(startRotation));
    const finalRotation = startRotation + (7 + randomInt(4)) * 360 + rotationDelta;

    rotationRef.current = finalRotation;
    window.requestAnimationFrame(() => {
      setIsAnimating(true);
      window.requestAnimationFrame(() => {
        setRotation(finalRotation);
      });
    });

    completeTimerRef.current = window.setTimeout(() => {
      setIsAnimating(false);
      onSpinComplete(options[winningIndex]);
    }, 4300);
  }, [onSpinComplete, options, spinKey]);

  useEffect(() => {
    return () => {
      if (completeTimerRef.current) {
        window.clearTimeout(completeTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[38rem]">
      <div className="absolute inset-0 rounded-full bg-cyan-300/20 blur-3xl" />
      <svg
        aria-label="Decision wheel"
        className="relative h-full w-full drop-shadow-[0_30px_55px_rgba(0,0,0,0.45)]"
        role="img"
        viewBox="0 0 640 640"
      >
        <circle cx={CENTER} cy={CENTER} fill="#111827" r={310} />
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transformBox: 'fill-box',
            transformOrigin: 'center',
            transition: isAnimating ? 'transform 4.3s cubic-bezier(0.11, 0.72, 0, 1)' : 'none',
          }}
        >
          {options.length === 0 ? (
            <circle cx={CENTER} cy={CENTER} fill="#273244" r={RADIUS} />
          ) : (
            slices.map((slice) => (
              <g key={`${slice.label}-${slice.path}`}>
                <path d={slice.path} fill={slice.color} stroke="rgba(255,255,255,0.82)" strokeWidth="5" />
                <text
                  fill="#ffffff"
                  fontSize={options.length > 10 ? 17 : 21}
                  fontWeight="900"
                  paintOrder="stroke"
                  stroke="rgba(15,23,42,0.42)"
                  strokeWidth="5"
                  textAnchor="middle"
                  transform={`rotate(${slice.labelAngle} ${slice.labelPoint.x} ${slice.labelPoint.y})`}
                  x={slice.labelPoint.x}
                  y={slice.labelPoint.y}
                >
                  {slice.label}
                </text>
              </g>
            ))
          )}
          <circle cx={CENTER} cy={CENTER} fill="#fff7ed" r="58" stroke="#111827" strokeWidth="9" />
          <circle cx={CENTER} cy={CENTER} fill="#111827" r="23" />
        </g>
        <path
          d="M 284 31 L 356 31 L 320 103 Z"
          fill="#fff7ed"
          stroke="#111827"
          strokeLinejoin="round"
          strokeWidth="8"
        />
      </svg>
    </div>
  );
}
