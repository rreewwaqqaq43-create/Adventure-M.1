/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Gamepad2,
  Terminal,
  Sparkles,
  RotateCcw,
  Heart,
  Award,
  ArrowRight,
  Code2,
  Zap,
  HelpCircle,
  CheckCircle2,
  Volume2,
  VolumeX,
  ArrowLeft,
  ArrowUp
} from 'lucide-react';
import { sfx } from '../../utils/audioEffects';

interface Game3PlatformerProps {
  onComplete: (score: number, maxScore: number, xpEarned: number) => void;
}

interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'ground' | 'floating';
}

interface CodeToken {
  id: number;
  x: number;
  y: number;
  label: string;
  topic: string;
  collected: boolean;
  color: string;
}

interface BugHazard {
  id: number;
  x: number;
  y: number;
  speed: number;
  range: [number, number];
}

export const Game3Platformer: React.FC<Game3PlatformerProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [tokensCollected, setTokensCollected] = useState(0);
  const [activeCodeChallenge, setActiveCodeChallenge] = useState<{
    prompt: string;
    code: string;
    options: string[];
    correctIdx: number;
    explanation: string;
  } | null>(null);

  // Player physics
  const playerRef = useRef({
    x: 40,
    y: 200,
    w: 28,
    h: 36,
    vx: 0,
    vy: 0,
    isGrounded: false,
    facing: 'right' as 'left' | 'right',
  });

  // Keys pressed
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Tokens in the level
  const tokensRef = useRef<CodeToken[]>([
    { id: 1, x: 120, y: 190, label: 'print("Hello")', topic: 'ฟังก์ชันแสดงผล', collected: false, color: '#38bdf8' },
    { id: 2, x: 260, y: 130, label: 'x = int("25")', topic: 'แปลงชนิดข้อมูล int()', collected: false, color: '#34d399' },
    { id: 3, x: 420, y: 100, label: 'for i in range(5):', topic: 'คำสั่งวนซ้ำ for loop', collected: false, color: '#fbbf24' },
    { id: 4, x: 580, y: 150, label: 't.forward(100)', topic: 'โมดูลเต่าไพทอน', collected: false, color: '#a78bfa' },
    { id: 5, x: 700, y: 190, label: 'if score >= 50:', topic: 'เงื่อนไข if-else', collected: false, color: '#f472b6' },
  ]);

  // Bug Hazards (moving enemies)
  const bugsRef = useRef<BugHazard[]>([
    { id: 1, x: 200, y: 232, speed: 1.2, range: [160, 240] },
    { id: 2, x: 480, y: 232, speed: 1.5, range: [440, 540] },
  ]);

  // Level platforms
  const platforms: Platform[] = [
    // Ground floor
    { x: 0, y: 260, w: 800, h: 40, type: 'ground' },
    // Floating platforms
    { x: 100, y: 220, w: 90, h: 14, type: 'floating' },
    { x: 230, y: 165, w: 110, h: 14, type: 'floating' },
    { x: 380, y: 135, w: 120, h: 14, type: 'floating' },
    { x: 550, y: 185, w: 100, h: 14, type: 'floating' },
    { x: 670, y: 225, w: 100, h: 14, type: 'floating' },
  ];

  // End gateway position
  const exitPortal = { x: 740, y: 195, w: 35, h: 65 };

  // Key listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main game loop
  useEffect(() => {
    let animId: number;

    const updateGame = () => {
      if (!isPlaying || isGameOver || isVictory || activeCodeChallenge) {
        animId = requestAnimationFrame(updateGame);
        return;
      }

      const p = playerRef.current;
      const keys = keysRef.current;

      // Horizontal movement
      const moveSpeed = 3.5;
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        p.vx = -moveSpeed;
        p.facing = 'left';
      } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        p.vx = moveSpeed;
        p.facing = 'right';
      } else {
        p.vx *= 0.75; // Friction
      }

      // Jump
      const jumpPower = -8.2;
      if ((keys['ArrowUp'] || keys['w'] || keys['W'] || keys[' ']) && p.isGrounded) {
        p.vy = jumpPower;
        p.isGrounded = false;
        sfx.playJump();
      }

      // Gravity
      p.vy += 0.42;
      if (p.vy > 9) p.vy = 9;

      // Apply movement
      p.x += p.vx;
      p.y += p.vy;

      // Keep inside bounds
      if (p.x < 10) p.x = 10;
      if (p.x > 760) p.x = 760;

      // Platform Collisions
      p.isGrounded = false;
      for (const plat of platforms) {
        // Landing on top
        if (
          p.x + p.w > plat.x &&
          p.x < plat.x + plat.w &&
          p.y + p.h >= plat.y &&
          p.y + p.h <= plat.y + 14 &&
          p.vy >= 0
        ) {
          p.y = plat.y - p.h;
          p.vy = 0;
          p.isGrounded = true;
          break;
        }
      }

      // Token Collection
      tokensRef.current.forEach((t) => {
        if (!t.collected) {
          const dist = Math.hypot(p.x + p.w / 2 - t.x, p.y + p.h / 2 - t.y);
          if (dist < 26) {
            t.collected = true;
            sfx.playCoin();
            setScore((s) => s + 20);
            setTokensCollected((c) => c + 1);
          }
        }
      });

      // Bug Hazards patrol & collision
      bugsRef.current.forEach((b) => {
        b.x += b.speed;
        if (b.x < b.range[0] || b.x > b.range[1]) {
          b.speed *= -1;
        }

        // Check player collision with bug
        if (
          p.x + p.w > b.x - 12 &&
          p.x < b.x + 12 &&
          p.y + p.h > b.y - 12 &&
          p.y < b.y + 12
        ) {
          // Hurt player! Reset to safe platform
          sfx.playError();
          setLives((l) => {
            const nextLives = l - 1;
            if (nextLives <= 0) {
              setIsGameOver(true);
            }
            return nextLives;
          });
          p.x = 40;
          p.y = 180;
          p.vx = 0;
          p.vy = 0;
        }
      });

      // Check Victory at Exit Portal
      const allTokensDone = tokensRef.current.every((t) => t.collected);
      if (
        allTokensDone &&
        p.x + p.w > exitPortal.x &&
        p.x < exitPortal.x + exitPortal.w &&
        p.y + p.h > exitPortal.y
      ) {
        setIsVictory(true);
        sfx.playVictory();
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        onComplete(100, 100, 300);
      }

      // RENDER CANVAS
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Clear background
          ctx.fillStyle = '#020617';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Digital cyber grid
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          for (let gx = 0; gx < canvas.width; gx += 40) {
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, canvas.height);
            ctx.stroke();
          }

          // Draw Platforms
          platforms.forEach((plat) => {
            if (plat.type === 'ground') {
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(plat.x, plat.y);
              ctx.lineTo(plat.x + plat.w, plat.y);
              ctx.stroke();
            } else {
              // Floating neon blocks
              ctx.fillStyle = '#1e293b';
              ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
              ctx.strokeStyle = '#06b6d4';
              ctx.lineWidth = 1.5;
              ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
            }
          });

          // Draw Tokens
          tokensRef.current.forEach((t) => {
            if (!t.collected) {
              ctx.save();
              ctx.fillStyle = t.color;
              ctx.shadowColor = t.color;
              ctx.shadowBlur = 10;
              ctx.beginPath();
              ctx.arc(t.x, t.y, 8, 0, Math.PI * 2);
              ctx.fill();

              // Token label text
              ctx.font = '10px monospace';
              ctx.fillStyle = '#e2e8f0';
              ctx.textAlign = 'center';
              ctx.fillText(t.label, t.x, t.y - 12);
              ctx.restore();
            }
          });

          // Draw Bug Glitches (Enemies)
          bugsRef.current.forEach((b) => {
            ctx.save();
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('👾', b.x, b.y);
            ctx.restore();
          });

          // Draw Exit Portal
          ctx.save();
          if (allTokensDone) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.strokeRect(exitPortal.x, exitPortal.y, exitPortal.w, exitPortal.h);
            ctx.fillRect(exitPortal.x, exitPortal.y, exitPortal.w, exitPortal.h);
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🚪', exitPortal.x + exitPortal.w / 2, exitPortal.y + 35);
          } else {
            ctx.strokeStyle = '#475569';
            ctx.strokeRect(exitPortal.x, exitPortal.y, exitPortal.w, exitPortal.h);
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🔒', exitPortal.x + exitPortal.w / 2, exitPortal.y + 35);
          }
          ctx.restore();

          // Draw Player Character (Python Coder Sprite)
          ctx.save();
          ctx.fillStyle = '#38bdf8';
          // Body
          ctx.fillRect(p.x, p.y, p.w, p.h);
          // Face / Visor
          ctx.fillStyle = '#0f172a';
          if (p.facing === 'right') {
            ctx.fillRect(p.x + 14, p.y + 6, 10, 8);
          } else {
            ctx.fillRect(p.x + 4, p.y + 6, 10, 8);
          }
          // Python emblem
          ctx.font = '14px sans-serif';
          ctx.fillText('🐍', p.x + 6, p.y + 28);
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(updateGame);
    };

    animId = requestAnimationFrame(updateGame);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isGameOver, isVictory, activeCodeChallenge]);

  const handleStartGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setIsVictory(false);
    setLives(3);
    setScore(0);
    setTokensCollected(0);
    playerRef.current = {
      x: 40,
      y: 200,
      w: 28,
      h: 36,
      vx: 0,
      vy: 0,
      isGrounded: false,
      facing: 'right',
    };
    tokensRef.current.forEach((t) => (t.collected = false));
  };

  // Mobile virtual controls
  const handleTouchControl = (key: string, isDown: boolean) => {
    keysRef.current[key] = isDown;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 text-slate-100 max-w-4xl mx-auto shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white font-['Chakra_Petch'] flex items-center gap-2">
              <span>Python Platformer: ผจญภัยเก็บโทเคนไพทอน</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                ม.1 บทที่ 3
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              ควบคุมตัวละครวิ่งกระโดดข้ามสิ่งกีดขวาง เก็บชิ้นส่วนโค้ด Python ให้ครบเพื่อเปิดประตูทางออก
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2.5 text-xs">
          <button
            onClick={() => sfx.toggleMute()}
            title="เปิด/ปิดเสียง"
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5 text-blue-400" />
          </button>
          <div className="flex items-center gap-1 text-rose-400 font-bold bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <Heart className="w-3.5 h-3.5 fill-rose-500" />
            <span>x{lives}</span>
          </div>
          <div className="text-emerald-400 font-bold bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 font-mono">
            โค้ด: {tokensCollected} / 5
          </div>
          <div className="text-amber-400 font-bold bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 font-mono">
            คะแนน: {score}
          </div>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="mt-4 relative bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col items-center">
        <canvas
          ref={canvasRef}
          width={800}
          height={300}
          className="w-full max-w-[800px] h-auto block select-none"
        />

        {/* Start Overlay */}
        {!isPlaying && !isVictory && !isGameOver && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-3xl shadow-lg">
              🐍
            </div>
            <div>
              <h4 className="text-xl font-bold text-white font-['Chakra_Petch']">
                ภารกิจ Python Code Platformer
              </h4>
              <p className="text-xs text-slate-400 max-w-md mt-1">
                ใช้ปุ่มลูกศร ◀ ▶ หรือ A/D เพื่อวิ่ง และปุ่ม ▲ / Spacebar เพื่อกระโดด 
                เก็บโค้ด Python ทั้ง 5 ข้อแล้ววิ่งเข้าประตูสู่ปลายทาง
              </p>
            </div>
            <button
              onClick={handleStartGame}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl flex items-center gap-2 transition-transform hover:scale-105"
            >
              <Zap className="w-4 h-4" />
              <span>เริ่มเกม Platformer ทันที</span>
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="text-4xl">💥</div>
            <h4 className="text-xl font-bold text-rose-400 font-['Chakra_Petch']">
              พลังชีวิตหมดแล้ว! โดนบั๊กคอมพิวเตอร์ขัดขวาง
            </h4>
            <p className="text-xs text-slate-400">
              ลองอีกครั้ง หลบตัวบั๊ก 👾 และเก็บโทเคนโค้ดให้ครบเพื่อเปิดประตู
            </p>
            <button
              onClick={handleStartGame}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 border border-slate-700"
            >
              <RotateCcw className="w-4 h-4" />
              <span>ลองใหม่อีกครั้ง</span>
            </button>
          </div>
        )}

        {/* Victory Overlay */}
        {isVictory && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="text-4xl">🏆</div>
            <h4 className="text-2xl font-black text-white font-['Chakra_Petch']">
              ยินดีด้วย! คุณพิชิตด่าน Python Platformer สำเร็จ
            </h4>
            <p className="text-xs text-slate-300 max-w-sm">
              เก็บโค้ด Python ครบทุกโทเคนและผ่านเข้าสู่ประตู Terminal สำเร็จอย่างยอดเยี่ยม!
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ได้รับ +300 XP ประจำบทเรียนที่ 3!</span>
            </div>
            <button
              onClick={handleStartGame}
              className="mt-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>เล่นรอบใหม่อีกครั้ง</span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile Touch On-Screen Controls */}
      <div className="mt-3 flex items-center justify-between sm:hidden bg-slate-950 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onPointerDown={() => handleTouchControl('ArrowLeft', true)}
            onPointerUp={() => handleTouchControl('ArrowLeft', false)}
            className="w-12 h-12 rounded-xl bg-slate-800 active:bg-blue-600 text-white font-bold flex items-center justify-center text-lg shadow active:scale-95"
          >
            ◀
          </button>
          <button
            onPointerDown={() => handleTouchControl('ArrowRight', true)}
            onPointerUp={() => handleTouchControl('ArrowRight', false)}
            className="w-12 h-12 rounded-xl bg-slate-800 active:bg-blue-600 text-white font-bold flex items-center justify-center text-lg shadow active:scale-95"
          >
            ▶
          </button>
        </div>
        <button
          onPointerDown={() => handleTouchControl('ArrowUp', true)}
          onPointerUp={() => handleTouchControl('ArrowUp', false)}
          className="px-6 h-12 rounded-xl bg-blue-600 active:bg-blue-500 text-white font-bold flex items-center justify-center text-sm shadow active:scale-95"
        >
          กระโดด (JUMP)
        </button>
      </div>

      {/* Control Help Note */}
      <div className="mt-3 text-center text-[11px] text-slate-500">
        💡 ใช้แป้นพิมพ์ ลูกศรซ้าย/ขวา (A / D) วิ่ง, ลูกศรขึ้น / Spacebar กระโดด หรือใช้ปุ่มสัมผัสบนหน้าจอ
      </div>
    </div>
  );
};
