/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export type ScratchCatCostume = 'walk1' | 'walk2' | 'jump' | 'happy' | 'spin';

interface ScratchCatSpriteProps {
  costume?: ScratchCatCostume;
  width?: number;
  height?: number;
  direction?: number; // 1 for facing right, -1 for facing left
  rotationAngle?: number; // rotation in degrees
  sayText?: string | null;
  className?: string;
  isAnimated?: boolean;
}

export const ScratchCatSprite: React.FC<ScratchCatSpriteProps> = ({
  costume = 'walk1',
  width = 80,
  height = 80,
  direction = 1,
  rotationAngle = 0,
  sayText = null,
  className = '',
  isAnimated = false,
}) => {
  return (
    <div
      className={`relative inline-flex flex-col items-center select-none ${className}`}
      style={{
        transform: `scaleX(${direction}) rotate(${rotationAngle}deg)`,
        transition: 'transform 0.15s ease-out',
      }}
    >
      {/* Scratch Comic Speech Bubble (When cat speaks) */}
      {sayText && (
        <div
          className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-2xl bg-white text-slate-900 border-2 border-slate-800 shadow-xl font-bold text-xs whitespace-nowrap animate-bounce"
          style={{
            transform: `scaleX(${direction}) translate(${direction === 1 ? '10px' : '-10px'}, -10px)`,
          }}
        >
          <span>{sayText}</span>
          {/* Speech bubble pointer tail */}
          <div className="absolute -bottom-2 left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white" />
          <div className="absolute -bottom-2.5 left-4 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[9px] border-t-slate-800 -z-10" />
        </div>
      )}

      {/* Official Authentic Scratch Cat SVG Representation */}
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 100"
        className={`filter drop-shadow-md overflow-visible ${
          isAnimated && costume === 'walk2' ? 'translate-y-0.5' : ''
        }`}
      >
        <defs>
          {/* Gradients for Scratch Cat */}
          <linearGradient id="catOrange" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFB326" />
            <stop offset="100%" stopColor="#FA8C16" />
          </linearGradient>
          <linearGradient id="catEarInner" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE7BA" />
            <stop offset="100%" stopColor="#FFD591" />
          </linearGradient>
        </defs>

        {/* 1. Tail (Behind body) */}
        <path
          d={
            costume === 'jump'
              ? 'M 24 55 Q 10 40 8 26 Q 14 24 20 38 Q 24 48 26 55 Z'
              : 'M 25 60 Q 8 62 6 42 Q 12 38 18 52 Q 23 58 27 60 Z'
          }
          fill="url(#catOrange)"
          stroke="#D46B08"
          strokeWidth="2"
        />

        {/* 2. Back Foot / Leg */}
        {costume === 'walk2' ? (
          <ellipse cx="28" cy="85" rx="8" ry="5" fill="url(#catOrange)" stroke="#D46B08" strokeWidth="2" />
        ) : (
          <ellipse cx="32" cy="86" rx="9" ry="5" fill="url(#catOrange)" stroke="#D46B08" strokeWidth="2" />
        )}

        {/* 3. Main Body */}
        <ellipse
          cx="45"
          cy="62"
          rx="19"
          ry="16"
          fill="url(#catOrange)"
          stroke="#D46B08"
          strokeWidth="2"
        />

        {/* 4. White Belly Patch */}
        <ellipse
          cx="48"
          cy="64"
          rx="12"
          ry="10"
          fill="#FFFFFF"
        />

        {/* 5. Front Foot / Leg */}
        {costume === 'walk2' ? (
          <ellipse cx="62" cy="86" rx="9" ry="5" fill="url(#catOrange)" stroke="#D46B08" strokeWidth="2" />
        ) : costume === 'jump' ? (
          <ellipse cx="58" cy="78" rx="8" ry="6" fill="url(#catOrange)" stroke="#D46B08" strokeWidth="2" />
        ) : (
          <ellipse cx="58" cy="86" rx="9" ry="5" fill="url(#catOrange)" stroke="#D46B08" strokeWidth="2" />
        )}

        {/* 6. Cat Ears */}
        {/* Left Ear */}
        <polygon
          points="40,24 48,6 59,20"
          fill="url(#catOrange)"
          stroke="#D46B08"
          strokeWidth="2"
        />
        <polygon
          points="43,22 49,11 56,19"
          fill="url(#catEarInner)"
        />

        {/* Right Ear */}
        <polygon
          points="62,22 75,7 79,26"
          fill="url(#catOrange)"
          stroke="#D46B08"
          strokeWidth="2"
        />
        <polygon
          points="66,21 73,12 76,23"
          fill="url(#catEarInner)"
        />

        {/* 7. Cat Head */}
        <ellipse
          cx="58"
          cy="34"
          rx="21"
          ry="17"
          fill="url(#catOrange)"
          stroke="#D46B08"
          strokeWidth="2"
        />

        {/* 8. White Muzzle / Cheeks */}
        <ellipse cx="54" cy="40" rx="9" ry="6" fill="#FFFFFF" />
        <ellipse cx="64" cy="40" rx="9" ry="6" fill="#FFFFFF" />

        {/* 9. Whiskers (3 on Left, 3 on Right) */}
        {/* Left Whiskers */}
        <line x1="42" y1="36" x2="28" y2="34" stroke="#262626" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="42" y1="40" x2="26" y2="41" stroke="#262626" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="43" y1="44" x2="30" y2="47" stroke="#262626" strokeWidth="1.8" strokeLinecap="round" />

        {/* Right Whiskers */}
        <line x1="74" y1="37" x2="88" y2="34" stroke="#262626" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="75" y1="41" x2="90" y2="41" stroke="#262626" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="74" y1="44" x2="87" y2="48" stroke="#262626" strokeWidth="1.8" strokeLinecap="round" />

        {/* 10. Cat Eyes */}
        {costume === 'happy' ? (
          // Happy smiling eyes ^ ^
          <g stroke="#1F1F1F" strokeWidth="2.5" fill="none" strokeLinecap="round">
            <path d="M 46 32 Q 51 26 56 32" />
            <path d="M 62 32 Q 67 26 72 32" />
          </g>
        ) : (
          // Expressive eyes with pupils and reflections
          <g>
            {/* Left Eye */}
            <ellipse cx="51" cy="29" rx="5" ry="7" fill="#FFFFFF" stroke="#262626" strokeWidth="1.5" />
            <ellipse cx="52.5" cy="29.5" rx="2.8" ry="4.5" fill="#141414" />
            <circle cx="54" cy="27.5" r="1.2" fill="#FFFFFF" />

            {/* Right Eye */}
            <ellipse cx="67" cy="29" rx="5" ry="7" fill="#FFFFFF" stroke="#262626" strokeWidth="1.5" />
            <ellipse cx="68.5" cy="29.5" rx="2.8" ry="4.5" fill="#141414" />
            <circle cx="70" cy="27.5" r="1.2" fill="#FFFFFF" />
          </g>
        )}

        {/* 11. Cute Nose */}
        <polygon
          points="57,37 61,37 59,40"
          fill="#141414"
        />

        {/* 12. Smile Mouth */}
        <path
          d="M 55 41 Q 59 45 63 41"
          fill="none"
          stroke="#141414"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
