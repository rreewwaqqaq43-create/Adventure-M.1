/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Camera,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Crosshair,
  Radar,
  Video,
  VideoOff,
  RotateCcw,
  Sparkles,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Volume2,
  VolumeX,
  Flame,
  Zap
} from 'lucide-react';
import { sfx } from '../../utils/audioEffects';
import { StorageService } from '../../services/storage';

interface Game6AugmentedRealityProps {
  onComplete: (score: number, maxScore: number, xpEarned: number) => void;
}

interface ARTarget {
  id: string;
  name: string;
  type: 'THREAT' | 'SAFE';
  icon: string;
  x: number; // percentage
  y: number; // percentage
  vx: number;
  vy: number;
  lawRef: string;
  advice: string;
  scanned: boolean;
}

const INITIAL_TARGETS: ARTarget[] = [
  {
    id: 't1',
    name: 'Phishing SMS หลอกแจกเงิน',
    type: 'THREAT',
    icon: '🚨',
    x: 20,
    y: 35,
    vx: 0.15,
    vy: 0.1,
    lawRef: 'ภัยคุกคามฟิชชิ่ง หลอกเอา OTP และรหัสธนาคาร',
    advice: 'ห้ามกดลิงก์แปลกปลอมและห้ามส่งรหัส OTP ให้ใครเด็ดขาด',
    scanned: false,
  },
  {
    id: 't2',
    name: 'สัญญาอนุญาต Creative Commons (CC-BY)',
    type: 'SAFE',
    icon: '🛡️',
    x: 75,
    y: 25,
    vx: -0.12,
    vy: 0.15,
    lawRef: 'การใช้งานผลงานอย่างถูกลิขสิทธิ์พร้อมระบุที่มา',
    advice: 'ใช้งานได้ถูกต้องตามกฎหมายลิขสิทธิ์และมีจริยธรรมดิจิทัล',
    scanned: false,
  },
  {
    id: 't3',
    name: 'มัลแวร์แฝงไฟล์ cracked_game.exe',
    type: 'THREAT',
    icon: '🦠',
    x: 35,
    y: 70,
    vx: 0.18,
    vy: -0.12,
    lawRef: 'พ.ร.บ.คอมพิวเตอร์ มาตรา 10 (รบกวนการทำงานของระบบ)',
    advice: 'ดาวน์โหลดโปรแกรมจากผู้ผลิตที่น่าเชื่อถือเท่านั้น',
    scanned: false,
  },
  {
    id: 't4',
    name: 'รหัสผ่านอ่อนแอ "12345678"',
    type: 'THREAT',
    icon: '🔓',
    x: 65,
    y: 65,
    vx: -0.14,
    vy: -0.1,
    lawRef: 'ความเสี่ยงถูกแฮกบัญชีและขโมยข้อมูลส่วนบุคคล (PDPA)',
    advice: 'ตั้งรหัสผ่านยาวกว่า 8 ตัว ผสมตัวพิมพ์ใหญ่ เล็ก ตัวเลข และสัญลักษณ์',
    scanned: false,
  },
  {
    id: 't5',
    name: 'การยืนยันตัวตนสองชั้น (2FA)',
    type: 'SAFE',
    icon: '🔑',
    x: 50,
    y: 20,
    vx: 0.1,
    vy: -0.08,
    lawRef: 'เกราะป้องกันบัญชีดิจิทัลมาตรฐานสากล',
    advice: 'เปิดใช้งาน 2FA บนทุกบัญชีสำคัญเพื่อความปลอดภัยสูงสุด',
    scanned: false,
  },
];

export const Game6AugmentedReality: React.FC<Game6AugmentedRealityProps> = ({ onComplete }) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [allowSimulationFallback, setAllowSimulationFallback] = useState(false);

  // Targets in AR space
  const [targets, setTargets] = useState<ARTarget[]>(() => {
    const custom = StorageService.games.getGame6Targets();
    if (custom && custom.length > 0) {
      return custom.map((ct, idx) => ({
        id: ct.id || ct.targetId || `target-${idx}`,
        name: ct.name || ct.threatName || 'ภัยคุกคามไซเบอร์',
        type: (ct.type || 'THREAT') as 'THREAT' | 'SAFE',
        icon: ct.icon || '⚠️',
        x: ct.x ?? (20 + ((idx * 25) % 60)),
        y: ct.y ?? (25 + ((idx * 20) % 50)),
        vx: ct.vx ?? (idx % 2 === 0 ? 0.35 : -0.35),
        vy: ct.vy ?? (idx % 3 === 0 ? 0.25 : -0.25),
        lawRef: ct.lawRef || `ความเสี่ยงระดับ: ${ct.riskLevel || 'สูง'}`,
        advice: ct.advice || ct.mitigationGuide || 'ระมัดระวังการเปิดเผยข้อมูลส่วนบุคคล',
        scanned: false,
      }));
    }
    return INITIAL_TARGETS;
  });
  const [crosshairPos, setCrosshairPos] = useState({ x: 50, y: 50 });
  const [activeTarget, setActiveTarget] = useState<ARTarget | null>(null);

  const [shieldHealth, setShieldHealth] = useState(100);
  const [score, setScore] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [floatingPopup, setFloatingPopup] = useState<string | null>(null);
  const [blastEffect, setBlastEffect] = useState<{ x: number; y: number } | null>(null);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [isMuted, setIsMuted] = useState(sfx.isMuted);
  const [feedback, setFeedback] = useState<{ message: string; isCorrect: boolean } | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const prevFrameData = useRef<Uint8Array | null>(null);

  // Camera setup
  const startCamera = async () => {
    try {
      setIsCameraLoading(true);
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (e) {
          console.warn('Video play error:', e);
        }
      }
      setIsCameraActive(true);
      setIsCameraLoading(false);
    } catch (err: any) {
      console.warn('AR Camera access error:', err);
      setCameraError('ไม่สามารถเข้าถึงกล้องเว็บแคมได้ กรุณาอนุญาตสิทธิ์การเข้าถึงกล้องในเบราว์เซอร์');
      setIsCameraActive(false);
      setIsCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Auto start camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Real-time Optical Motion Tracking through real webcam
  useEffect(() => {
    if (!isCameraActive || isFinished) return;

    let animId: number;
    let lastTime = Date.now();

    const trackMotion = () => {
      const now = Date.now();
      if (now - lastTime > 65) {
        lastTime = now;
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video && canvas && video.readyState >= 2) {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = frame.data;
            const w = canvas.width;
            const h = canvas.height;

            let motionSumX = 0;
            let motionSumY = 0;
            let motionPixels = 0;

            const prev = prevFrameData.current;
            const currGray = new Uint8Array(w * h);

            for (let y = 0; y < h; y += 3) {
              for (let x = 0; x < w; x += 3) {
                const idx = (y * w + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const gray = (r + g + b) / 3;
                const pixelIndex = y * w + x;
                currGray[pixelIndex] = gray;

                if (prev) {
                  const diff = Math.abs(gray - prev[pixelIndex]);
                  if (diff > 25) {
                    motionSumX += (w - x); // Mirroring
                    motionSumY += y;
                    motionPixels += 1;
                  }
                }
              }
            }

            prevFrameData.current = currGray;

            if (motionPixels > 15) {
              const targetX = Math.max(8, Math.min(92, (motionSumX / motionPixels / w) * 100));
              const targetY = Math.max(10, Math.min(90, (motionSumY / motionPixels / h) * 100));

              setCrosshairPos((prevPos) => {
                const newX = Math.round(prevPos.x * 0.7 + targetX * 0.3);
                const newY = Math.round(prevPos.y * 0.7 + targetY * 0.3);

                // Auto hover target when crosshair passes by
                const hovered = targets.find(
                  (t) => !t.scanned && Math.hypot(t.x - newX, t.y - newY) < 12
                );
                setActiveTarget(hovered || null);

                return { x: newX, y: newY };
              });
            }
          }
        }
      }
      animId = requestAnimationFrame(trackMotion);
    };

    animId = requestAnimationFrame(trackMotion);
    return () => cancelAnimationFrame(animId);
  }, [isCameraActive, isFinished, targets]);

  // Floating AR targets animation loop
  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      setTargets((prev) =>
        prev.map((t) => {
          if (t.scanned) return t;
          let nx = t.x + t.vx;
          let ny = t.y + t.vy;
          let nvx = t.vx;
          let nvy = t.vy;

          if (nx < 15 || nx > 85) nvx *= -1;
          if (ny < 15 || ny > 80) nvy *= -1;

          return { ...t, x: nx, y: ny, vx: nvx, vy: nvy };
        })
      );
    }, 50);

    return () => clearInterval(interval);
  }, [isFinished]);

  // Pointer move inside viewport to aim AR crosshair
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
    setCrosshairPos({ x, y });

    // Check if aiming at any target
    const hovered = targets.find(
      (t) => !t.scanned && Math.hypot(t.x - x, t.y - y) < 9
    );
    setActiveTarget(hovered || null);
  };

  // Action on active target
  const handleAction = (actionType: 'BLOCK_THREAT' | 'AUTHORIZE_SAFE') => {
    if (!activeTarget) return;

    if (actionType === 'BLOCK_THREAT') {
      sfx.playLaser();
    }

    const isCorrect =
      (actionType === 'BLOCK_THREAT' && activeTarget.type === 'THREAT') ||
      (actionType === 'AUTHORIZE_SAFE' && activeTarget.type === 'SAFE');

    if (isCorrect) {
      const nextCombo = comboStreak + 1;
      setComboStreak(nextCombo);
      const earned = 20 + nextCombo * 10;
      setScore((s) => s + earned);

      if (actionType === 'BLOCK_THREAT') {
        setBlastEffect({ x: activeTarget.x, y: activeTarget.y });
        setTimeout(() => setBlastEffect(null), 600);
        if (nextCombo >= 2) {
          sfx.playCombo(nextCombo);
          setFloatingPopup(`💥 ทำลายสำเร็จ! +${earned} XP 🔥 x${nextCombo} STREAK!`);
        } else {
          sfx.playCorrect();
          setFloatingPopup(`💥 ทำลายสำเร็จ! +${earned} XP`);
        }
      } else {
        sfx.playCorrect();
        setShieldHealth((h) => Math.min(100, h + 15));
        setFloatingPopup('🛡️ อนุญาตข้อมูลปลอดภัย! ฟื้นฟูเกราะ +15%');
      }

      setFeedback({
        message: `สแกนสำเร็จ! ${activeTarget.name} — ${activeTarget.advice} (${activeTarget.lawRef})`,
        isCorrect: true,
      });
    } else {
      setComboStreak(0);
      sfx.playError();
      setIsScreenShaking(true);
      setTimeout(() => setIsScreenShaking(false), 400);
      setShieldHealth((h) => Math.max(0, h - 25));
      setFloatingPopup('⚡ ตอบสนองผิดพลาด! โดนดาเมจ -25%');
      setFeedback({
        message: `ตอบสนองผิดพลาด! ${activeTarget.name} คือ ${
          activeTarget.type === 'THREAT' ? 'ภัยคุกคามที่ต้องบล็อก' : 'องค์ประกอบปลอดภัยที่ควรอนุญาต'
        }`,
        isCorrect: false,
      });
    }

    setTimeout(() => setFloatingPopup(null), 1200);

    // Mark as scanned
    setTargets((prev) => {
      const next = prev.map((t) => (t.id === activeTarget.id ? { ...t, scanned: true } : t));
      const remaining = next.filter((t) => !t.scanned);
      if (remaining.length === 0) {
        setIsFinished(true);
        sfx.playVictory();
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        onComplete(100, 100, 300);
      }
      return next;
    });

    setActiveTarget(null);
  };

  const handleRestart = () => {
    setTargets(INITIAL_TARGETS.map((t) => ({ ...t, scanned: false })));
    setShieldHealth(100);
    setScore(0);
    setComboStreak(0);
    setFeedback(null);
    setIsFinished(false);
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 text-slate-100 max-w-4xl mx-auto shadow-2xl transition-transform ${isScreenShaking ? 'scale-[0.99] translate-x-1 ring-2 ring-rose-500/50' : ''}`}>
      {/* Hidden motion processing canvas */}
      <canvas ref={canvasRef} width={160} height={120} className="hidden" />

      {/* Floating score / combo popup */}
      {floatingPopup && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none px-4 py-2 rounded-2xl bg-slate-950/90 border border-rose-500 text-rose-300 font-bold text-sm sm:text-base shadow-2xl animate-bounce backdrop-blur-md">
          {floatingPopup}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Radar className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white font-['Chakra_Petch'] flex items-center gap-2">
              <span>AR Cyber Scanner: ตรวจจับภัยคุกคามไซเบอร์</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                ม.1 บทที่ 6
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              ใช้กล้องสแกน AR ค้นหาและกำจัดภัยไซเบอร์ ฟิชชิ่ง มัลแวร์ รหัสผ่าน และการละเมิดลิขสิทธิ์
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {comboStreak >= 2 && (
            <div className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-rose-500/20 to-pink-500/20 border border-rose-500/50 text-rose-300 font-bold text-xs flex items-center gap-1 animate-pulse shadow-lg shadow-rose-500/10">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>x{comboStreak} STREAK!</span>
            </div>
          )}

          <button
            onClick={() => {
              const muted = sfx.toggleMute();
              setIsMuted(muted);
            }}
            title={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-rose-400" />}
          </button>

          <button
            onClick={isCameraActive ? stopCamera : startCamera}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              isCameraActive
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {isCameraActive ? <Video className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
            <span>{isCameraActive ? 'กล้อง AR สแกนเนอร์ทำงานอยู่' : 'เปิดกล้อง AR'}</span>
          </button>

          <div className="text-xs px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-rose-400">
            เกราะ: {shieldHealth}%
          </div>
        </div>
      </div>

      {cameraError && (
        <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{cameraError}</span>
          </div>
          <button
            onClick={() => setAllowSimulationFallback(true)}
            className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 text-[11px] font-semibold whitespace-nowrap"
          >
            ใช้โหมดจำลองเมาส์
          </button>
        </div>
      )}

      {/* CAMERA REQUIRED SETUP SCREEN (If camera not active and not in simulation fallback) */}
      {!isCameraActive && !allowSimulationFallback && !isFinished ? (
        <div className="mt-6 p-8 rounded-3xl bg-slate-950 border-2 border-dashed border-rose-500/40 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-rose-500/30 to-rose-400/10 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/10">
            <Radar className="w-10 h-10 animate-spin" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono uppercase tracking-wider">
              Real AR Camera Scanner Required
            </span>
            <h3 className="text-xl font-bold text-white font-['Chakra_Petch']">
              ต้องเปิดกล้องเว็บแคมเพื่อเริ่มสแกน AR จริง
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              เกม AR Cyber Scanner ใช้ระบบ Augmented Reality และภาพจากกล้องหน้าจริงของคุณ
              เพื่อจำลองเป้าหมายภัยไซเบอร์ (มัลแวร์, ฟิชชิ่ง, รหัสผ่านรั่วไหล) ซ้อนทับลงในโลกจริง
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={startCamera}
              disabled={isCameraLoading}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-rose-500/20 transition-all hover:scale-105 active:scale-95"
            >
              {isCameraLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังเชื่อมต่อกล้อง...</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  <span>เปิดกล้องเว็บแคมจริงเพื่อเริ่มสแกน</span>
                </>
              )}
            </button>

            <button
              onClick={() => setAllowSimulationFallback(true)}
              className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-800 transition-colors"
            >
              อุปกรณ์ไม่มีกล้อง? ใช้โหมดจำลองเมาส์
            </button>
          </div>

          <div className="pt-4 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-400">
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
              <span>ภาพกล้องประมวลผลปลอดภัย</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
              <span>ตรวจจับความเคลื่อนไหว 30 FPS</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
              <span>เล็งเป้ากากบาท AR ในโลกจริง</span>
            </div>
          </div>
        </div>
      ) : !isFinished ? (
        <div className="mt-4 space-y-4">
          {/* AR Viewport */}
          <div
            ref={viewportRef}
            onPointerMove={handlePointerMove}
            className="relative h-[380px] sm:h-[440px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden cursor-crosshair select-none shadow-2xl"
          >
            {/* Real Webcam Stream with High Clarity */}
            {isCameraActive && (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover opacity-85 -scale-x-100 filter contrast-110 saturate-125"
                />
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-rose-500/40 text-[10px] text-rose-300 font-mono flex items-center gap-1.5 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                  <span>AR REAL WEBCAM SCANNER (30 FPS) • ขยับตัว/โบกมือเพื่อเล็งเป้า</span>
                </div>
              </>
            )}

            {/* Cyber Radar Grid HUD */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#0f172a_10%,transparent_70%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-25 pointer-events-none" />

            {/* Scanning radar sweep circle */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 rounded-full border border-rose-500/20 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full border border-rose-500/30 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border border-rose-500/40" />
                </div>
              </div>
            </div>

            {/* Floating AR Targets */}
            {targets.map((t) => {
              if (t.scanned) return null;
              const isLocked = activeTarget?.id === t.id;

              return (
                <div
                  key={t.id}
                  style={{ left: `${t.x}%`, top: `${t.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-100 flex flex-col items-center pointer-events-none ${
                    isLocked ? 'scale-125 z-20' : 'scale-100 z-10'
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xl transition-all ${
                      isLocked
                        ? t.type === 'THREAT'
                          ? 'border-2 border-rose-500 bg-rose-500/30 ring-4 ring-rose-500/40 animate-pulse'
                          : 'border-2 border-emerald-500 bg-emerald-500/30 ring-4 ring-emerald-500/40 animate-pulse'
                        : t.type === 'THREAT'
                        ? 'border border-rose-500/60 bg-rose-950/60 text-rose-300'
                        : 'border border-emerald-500/60 bg-emerald-950/60 text-emerald-300'
                    }`}
                  >
                    {t.icon}
                  </div>
                  <span className="mt-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-700 text-slate-200 whitespace-nowrap shadow">
                    {t.name}
                  </span>
                </div>
              );
            })}

            {/* Laser Blast Explosion Effect */}
            {blastEffect && (
              <div
                style={{ left: `${blastEffect.x}%`, top: `${blastEffect.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
              >
                <div className="w-24 h-24 rounded-full border-4 border-rose-400 bg-rose-500/30 animate-ping" />
                <div className="absolute inset-0 flex items-center justify-center text-rose-300 font-black text-sm animate-bounce font-mono">
                  ⚡ BLAST!
                </div>
              </div>
            )}

            {/* AR Crosshair Cursor */}
            <div
              className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 z-30 transition-transform duration-75"
              style={{ left: `${crosshairPos.x}%`, top: `${crosshairPos.y}%` }}
            >
              <div
                className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all ${
                  activeTarget
                    ? activeTarget.type === 'THREAT'
                      ? 'border-rose-400 bg-rose-500/20 scale-125 rotate-45'
                      : 'border-emerald-400 bg-emerald-500/20 scale-125'
                    : 'border-cyan-400/80'
                }`}
              >
                <Crosshair className={`w-6 h-6 ${activeTarget ? 'text-white' : 'text-cyan-400'}`} />
              </div>
            </div>

            {/* Target Lock Action Panel (when hovering target) */}
            {activeTarget && (
              <div className="absolute bottom-4 inset-x-6 bg-slate-950/95 backdrop-blur-md border border-rose-500/50 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 z-40 animate-fade-in">
                <div className="flex items-center gap-3 text-left">
                  <div className="text-3xl">{activeTarget.icon}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        เป้าหมาย: {activeTarget.name}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          activeTarget.type === 'THREAT'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {activeTarget.type === 'THREAT' ? 'ต้องสงสัยภัยคุกคาม' : 'สินทรัพย์ปลอดภัย'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {activeTarget.lawRef}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAction('BLOCK_THREAT')}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>บล็อกและกำจัดภัย (Block)</span>
                  </button>
                  <button
                    onClick={() => handleAction('AUTHORIZE_SAFE')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>อนุญาตสิ่งปลอดภัย (Allow)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Instruction Banner at top of HUD */}
            <div className="absolute top-3 inset-x-4 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <span>🎯 เลื่อนเมาส์/สัมผัส เล็งเป้ากากบาท AR ไปที่วัตถุไซเบอร์ลอยน้ำ แล้วเลือกตอบสนอง</span>
              <span className="text-rose-400 font-mono font-bold">
                คงเหลือ {targets.filter((t) => !t.scanned).length} เป้าหมาย
              </span>
            </div>
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center gap-2.5 animate-fade-in ${
                feedback.isCorrect
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              }`}
            >
              {feedback.isCorrect ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className="leading-relaxed">{feedback.message}</span>
            </div>
          )}
        </div>
      ) : (
        /* Finished Screen */
        <div className="mt-8 py-6 text-center space-y-5">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-4xl shadow-xl">
            🏆
          </div>

          <div>
            <h4 className="text-2xl font-black text-white font-['Chakra_Petch']">
              ยินดีด้วย! คุณพิชิตภารกิจ AR Cyber Scanner ครบทุกจุด
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              ทำคะแนนได้ {score} คะแนน เกราะป้องกันคงเหลือ {shieldHealth}%
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>ได้รับ +300 XP ผู้พิทักษ์ความปลอดภัยไซเบอร์!</span>
          </div>

          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={handleRestart}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>สแกนใหม่อีกครั้ง</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
