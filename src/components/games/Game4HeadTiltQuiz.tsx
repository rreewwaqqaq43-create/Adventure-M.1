/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Camera,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Video,
  VideoOff,
  Smile,
  ArrowLeft,
  ArrowRight,
  Award,
  HelpCircle,
  Info,
  Volume2,
  VolumeX,
  Flame,
  Zap
} from 'lucide-react';
import { sfx } from '../../utils/audioEffects';

interface Game4HeadTiltQuizProps {
  onComplete: (score: number, maxScore: number, xpEarned: number) => void;
}

interface TiltQuestion {
  id: number;
  question: string;
  topic: string;
  optionA: { text: string; codeBlock: string };
  optionB: { text: string; codeBlock: string };
  correctChoice: 'A' | 'B';
  explanation: string;
}

const QUESTIONS: TiltQuestion[] = [
  {
    id: 1,
    question: 'ต้องการสั่งให้ตัวละครแมวเดินไปข้างหน้า 10 ก้าว ต้องใช้บล็อกคำสั่งใด?',
    topic: 'บล็อกการเคลื่อนที่ (Motion)',
    optionA: { text: 'move (10) steps', codeBlock: 'bg-blue-600' },
    optionB: { text: 'turn right (15) degrees', codeBlock: 'bg-blue-800' },
    correctChoice: 'A',
    explanation: 'บล็อก move (10) steps อยู่ในหมวด Motion สั่งให้ตัวละครเดินหน้าตามทิศทางที่หันอยู่',
  },
  {
    id: 2,
    question: 'ต้องการให้สคริปต์เริ่มรันการทำงานทันทีเมื่อผู้ใช้คลิกปุ่มธงเขียวบนเวที?',
    topic: 'บล็อกเหตุการณ์ (Events)',
    optionA: { text: 'when [space] key pressed', codeBlock: 'bg-amber-600' },
    optionB: { text: 'when green flag clicked ⚑', codeBlock: 'bg-amber-500' },
    correctChoice: 'B',
    explanation: 'when green flag clicked ⚑ เป็นบล็อกหมวก (Hat block) จุดเริ่มต้นหลักของทุกโปรเจกต์ใน Scratch',
  },
  {
    id: 3,
    question: 'ต้องการตรวจสอบเงื่อนไขว่า ตัวละครแมวสัมผัสโดนตัวละครดาว (Star) หรือไม่?',
    topic: 'บล็อกตรวจจับ (Sensing)',
    optionA: { text: 'touching [Star] ?', codeBlock: 'bg-sky-600' },
    optionB: { text: 'distance to [Star]', codeBlock: 'bg-sky-800' },
    correctChoice: 'A',
    explanation: 'touching [Star] ? ในหมวด Sensing ส่งคืนค่า จริง หรือ เท็จ เหมาะสำหรับใส่ในบล็อก if-then',
  },
  {
    id: 4,
    question: 'ในเกมเก็บเหรียญ ต้องการเพิ่มคะแนนในตัวแปร score ขึ้นทีละ 1 คะแนน?',
    topic: 'บล็อกตัวแปร (Variables)',
    optionA: { text: 'set [score] to (0)', codeBlock: 'bg-orange-700' },
    optionB: { text: 'change [score] by (1)', codeBlock: 'bg-orange-500' },
    correctChoice: 'B',
    explanation: 'change [score] by 1 นำค่าเดิมมาบวกเพิ่ม 1 ส่วน set [score] to 0 ใช้รีเซ็ตคะแนนเริ่มต้น',
  },
  {
    id: 5,
    question: 'ต้องการให้ตัวละครเดินลาดตระเวนไปเรื่อยๆ ไม่มีวันสิ้นสุดตลอดทั้งเกม?',
    topic: 'บล็อกควบคุมการวนซ้ำ (Control)',
    optionA: { text: 'forever (วนซ้ำตลอด)', codeBlock: 'bg-yellow-600' },
    optionB: { text: 'repeat (10) (วนซ้ำ 10 รอบ)', codeBlock: 'bg-yellow-800' },
    correctChoice: 'A',
    explanation: 'forever คือลูปไม่รู้จบ ทำคำสั่งภายในซ้ำตลอดเวลาจนกว่าจะกดปุ่มหยุดสีแดง',
  },
];

export const Game4HeadTiltQuiz: React.FC<Game4HeadTiltQuizProps> = ({ onComplete }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [allowSimulationFallback, setAllowSimulationFallback] = useState(false);

  // Tilt value: -100 (full left A) to +100 (full right B)
  const [tiltValue, setTiltValue] = useState(0);
  const [tiltSelection, setTiltSelection] = useState<'A' | 'B' | null>(null);
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100%
  const [baselineOffset, setBaselineOffset] = useState(0);
  const rawDiffRef = useRef<number>(0);

  // Answer status
  const [confirmedChoice, setConfirmedChoice] = useState<'A' | 'B' | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [floatingPopup, setFloatingPopup] = useState<string | null>(null);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [isMuted, setIsMuted] = useState(sfx.isMuted);
  const [isFinished, setIsFinished] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const prevFrameRef = useRef<Uint8Array | null>(null);

  const currentQ = QUESTIONS[currentIdx];

  // Start Camera
  const startCamera = async () => {
    try {
      setIsCameraLoading(true);
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 360 } },
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
      console.warn('Camera error:', err);
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

  // Auto-request camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Frame processing for Head Tilt detection
  useEffect(() => {
    if (!isCameraActive || isAnswered) return;

    let animId: number;
    let lastTime = Date.now();

    const processVideoFrame = () => {
      const now = Date.now();
      if (now - lastTime > 80) {
        lastTime = now;
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video && canvas && video.readyState >= 2) {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = frame.data;

            // Compute center of brightness / motion on left half vs right half
            const midX = canvas.width / 2;
            let leftEnergy = 0;
            let rightEnergy = 0;

            for (let y = 0; y < canvas.height; y += 4) {
              for (let x = 0; x < canvas.width; x += 4) {
                const idx = (y * canvas.width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                // Skin/brightness proxy
                const val = (r * 2 + g * 3 + b) / 6;

                // Video is mirrored
                if (x < midX) {
                  leftEnergy += val;
                } else {
                  rightEnergy += val;
                }
              }
            }

            const total = leftEnergy + rightEnergy || 1;
            // Raw difference between right and left energy
            const rawDiff = ((rightEnergy - leftEnergy) / total) * 350;
            rawDiffRef.current = rawDiff;
            // Subtract calibrated baseline to eliminate lighting bias
            const calibratedDiff = rawDiff - baselineOffset;
            const smoothed = Math.max(-100, Math.min(100, calibratedDiff));
            setTiltValue((prev) => Math.round(prev * 0.65 + smoothed * 0.35));
          }
        }
      }
      animId = requestAnimationFrame(processVideoFrame);
    };

    animId = requestAnimationFrame(processVideoFrame);
    return () => cancelAnimationFrame(animId);
  }, [isCameraActive, isAnswered, baselineOffset]);

  // Hold Timer for Tilt Selection
  useEffect(() => {
    if (isAnswered) return;

    // Left tilt threshold: <= -25 (Option A)
    // Right tilt threshold: >= 25 (Option B)
    if (tiltValue <= -25) {
      setTiltSelection('A');
    } else if (tiltValue >= 25) {
      setTiltSelection('B');
    } else {
      setTiltSelection(null);
      setHoldProgress(0);
      return;
    }

    const timer = setInterval(() => {
      setHoldProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          handleConfirmChoice(tiltSelection || 'A');
          return 100;
        }
        sfx.playLock(0.8 + (prev / 100) * 0.6);
        return prev + 15;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [tiltValue, tiltSelection, isAnswered]);

  // Keyboard controls listener (ArrowLeft = A, ArrowRight = B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnswered) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handleConfirmChoice('A');
      } else if (e.key === 'ArrowRight' || e.key === 'b' || e.key === 'B') {
        handleConfirmChoice('B');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered]);

  const handleConfirmChoice = (choice: 'A' | 'B') => {
    if (isAnswered) return;
    setConfirmedChoice(choice);
    setIsAnswered(true);

    const isCorrect = choice === currentQ.correctChoice;
    if (isCorrect) {
      const nextCombo = comboStreak + 1;
      setComboStreak(nextCombo);
      const earned = 20 + nextCombo * 5;
      setScore((prev) => prev + earned);

      if (nextCombo >= 2) {
        sfx.playCombo(nextCombo);
        setFloatingPopup(`+${earned} XP 🔥 COMBO x${nextCombo}!`);
      } else {
        sfx.playCorrect();
        setFloatingPopup(`+${earned} XP ถูกต้อง!`);
      }
    } else {
      setComboStreak(0);
      sfx.playError();
      setIsScreenShaking(true);
      setTimeout(() => setIsScreenShaking(false), 400);
      setFloatingPopup('❌ คำตอบยังไม่ถูก');
    }

    setTimeout(() => setFloatingPopup(null), 1200);
  };

  const handleNext = () => {
    if (currentIdx < QUESTIONS.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setConfirmedChoice(null);
      setIsAnswered(false);
      setHoldProgress(0);
      setTiltSelection(null);
      sfx.playCorrect();
    } else {
      setIsFinished(true);
      sfx.playVictory();
      const totalScore = Math.round((score / 100) * 100);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      onComplete(totalScore, 100, 250);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setConfirmedChoice(null);
    setIsAnswered(false);
    setHoldProgress(0);
    setScore(0);
    setComboStreak(0);
    setIsFinished(false);
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 text-slate-100 max-w-4xl mx-auto shadow-2xl transition-transform ${isScreenShaking ? 'scale-[0.99] translate-x-1 ring-2 ring-rose-500/50' : ''}`}>
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} width={80} height={60} className="hidden" />

      {/* Floating score / combo popup */}
      {floatingPopup && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none px-4 py-2 rounded-2xl bg-slate-950/90 border border-purple-400 text-purple-300 font-bold text-sm sm:text-base shadow-2xl animate-bounce backdrop-blur-md">
          {floatingPopup}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Smile className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white font-['Chakra_Petch'] flex items-center gap-2">
              <span>Head-Tilt Quiz: เอียงหัวเลือกบล็อก Scratch</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                ม.1 บทที่ 4
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              ใช้กล้องตรวจจับการเอียงศีรษะ (เอียงซ้าย = ข้อ A / เอียงขวา = ข้อ B) หรือกดปุ่ม A / B
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {comboStreak >= 2 && (
            <div className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/50 text-purple-300 font-bold text-xs flex items-center gap-1 animate-pulse shadow-lg shadow-purple-500/10">
              <Flame className="w-3.5 h-3.5 text-purple-400" />
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
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
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
            <span>{isCameraActive ? 'เปิดกล้องตรวจจับอยู่' : 'เปิดกล้องตรวจจับหัว'}</span>
          </button>

          <div className="text-xs px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400">ข้อที่: </span>
            <span className="font-bold text-purple-400 font-['Chakra_Petch']">
              {currentIdx + 1} / {QUESTIONS.length}
            </span>
          </div>
        </div>
      </div>

      {cameraError && (
        <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{cameraError}</span>
          </div>
          <button
            onClick={() => setAllowSimulationFallback(true)}
            className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 text-[11px] font-semibold whitespace-nowrap"
          >
            ใช้โหมดปุ่มกด
          </button>
        </div>
      )}

      {/* CAMERA REQUIRED SETUP SCREEN (If camera not active and not in simulation fallback) */}
      {!isCameraActive && !allowSimulationFallback && !isFinished ? (
        <div className="mt-6 p-8 rounded-3xl bg-slate-950 border-2 border-dashed border-purple-500/40 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-purple-500/30 to-purple-400/10 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-xl shadow-purple-500/10">
            <Smile className="w-10 h-10 animate-bounce" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono uppercase tracking-wider">
              Real Camera Head-Tilt Required
            </span>
            <h3 className="text-xl font-bold text-white font-['Chakra_Petch']">
              ต้องเปิดกล้องเว็บแคมเพื่อเริ่มตอบคำถาม Scratch
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              เกม Head-Tilt Quiz ใช้ระบบประมวลผลวิดีโอตรวจจับการเอียงศีรษะของนักเรียนผ่านกล้องหน้าจริง
              (เอียงซ้ายเลือกข้อ A / เอียงขวาเลือกข้อ B) ตอบโจทย์บล็อกคำสั่ง Scratch
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={startCamera}
              disabled={isCameraLoading}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-purple-500/20 transition-all hover:scale-105 active:scale-95"
            >
              {isCameraLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังเชื่อมต่อกล้อง...</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  <span>เปิดกล้องเว็บแคมจริงเพื่อเริ่มเล่น</span>
                </>
              )}
            </button>

            <button
              onClick={() => setAllowSimulationFallback(true)}
              className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-800 transition-colors"
            >
              อุปกรณ์ไม่มีกล้อง? ใช้โหมดปุ่มกด
            </button>
          </div>

          <div className="pt-4 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-400">
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              <span>เอียงซ้ายเลือกข้อ A</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              <span>เอียงขวาเลือกข้อ B</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              <span>ภาพกล้องประมวลผลปลอดภัย</span>
            </div>
          </div>
        </div>
      ) : !isFinished ? (
        <div className="mt-4 space-y-4">
          {/* Question Banner */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="text-purple-300 font-semibold">{currentQ.topic}</span>
              <span className="text-amber-400 font-mono">คะแนนสะสม: {score}</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
              {currentQ.question}
            </p>
          </div>

          {/* Camera Viewport & Tilt Meter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Left Choice A */}
            <button
              onClick={() => handleConfirmChoice('A')}
              disabled={isAnswered}
              className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between min-h-[160px] shadow-lg ${
                confirmedChoice === 'A'
                  ? currentQ.correctChoice === 'A'
                    ? 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500'
                    : 'bg-rose-500/20 border-rose-500'
                  : tiltSelection === 'A' && !isAnswered
                  ? 'bg-purple-950/60 border-purple-400 ring-4 ring-purple-400/50 scale-102 shadow-xl shadow-purple-500/20'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-black font-['Chakra_Petch'] flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>ข้อ A (เอียงซ้าย ⟵)</span>
                </span>
                {tiltSelection === 'A' && !isAnswered && (
                  <span className="text-[10px] text-purple-300 font-mono font-bold bg-purple-500/30 px-2 py-0.5 rounded-full animate-pulse">
                    ล็อกคำตอบ {holdProgress}%
                  </span>
                )}
              </div>
              <div className="my-2">
                <div className="text-sm font-bold text-white font-mono bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                  {currentQ.optionA.text}
                </div>
              </div>
              <div className="text-[11px] text-slate-400 text-right">
                เอียงศีรษะไปทางซ้ายค้างไว้ หรือคลิกที่นี่
              </div>
            </button>

            {/* Center: Live Camera & Tilt Indicator */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[220px] shadow-xl">
              {isCameraActive ? (
                <div className="relative w-48 h-36 rounded-2xl overflow-hidden border-2 border-purple-500/40 shadow-xl bg-slate-900">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100 filter contrast-110 brightness-100"
                  />
                  {/* Real-time Face Oval Reticle */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className={`w-28 h-32 rounded-[45%] border-2 border-dashed transition-all duration-100 ${
                        tiltSelection === 'A'
                          ? 'border-purple-400 -rotate-12 scale-105'
                          : tiltSelection === 'B'
                          ? 'border-indigo-400 rotate-12 scale-105'
                          : 'border-white/30'
                      }`}
                    />
                  </div>
                  {/* Virtual Head Tilt Overlay Pointer */}
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-100"
                    style={{ transform: `rotate(${tiltValue * 0.4}deg)` }}
                  >
                    <div className="w-10 h-10 rounded-full border-2 border-purple-400/90 bg-purple-500/30 backdrop-blur-xs flex items-center justify-center text-lg shadow-lg">
                      👦
                    </div>
                  </div>
                  {/* Live Stream Label */}
                  <div className="absolute bottom-1 inset-x-0 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-slate-950/80 text-[9px] font-mono text-emerald-300 border border-emerald-500/40">
                      LIVE CAMERA
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-3xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-4xl mb-1 shadow-inner">
                  👤
                </div>
              )}

              {/* Real-time Tilt Meter Bar */}
              <div className="w-full max-w-[200px] mt-3 space-y-1.5">
                <div className="flex justify-between text-[10px] text-slate-300 font-mono font-bold">
                  <span className={tiltSelection === 'A' ? 'text-purple-300 font-black' : ''}>
                    ◀ ข้อ A ({tiltValue < -10 ? `${Math.abs(Math.round(tiltValue * 0.45))}°` : 'ซ้าย'})
                  </span>
                  <span className={tiltSelection === 'B' ? 'text-indigo-300 font-black' : ''}>
                    ({tiltValue > 10 ? `${Math.round(tiltValue * 0.45)}°` : 'ขวา'}) ข้อ B ▶
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-900 border border-slate-800 rounded-full overflow-hidden relative p-0.5">
                  <div
                    className={`h-full transition-all duration-75 rounded-full ${
                      tiltSelection === 'A'
                        ? 'bg-gradient-to-r from-purple-500 to-purple-400'
                        : tiltSelection === 'B'
                        ? 'bg-gradient-to-r from-indigo-400 to-indigo-500'
                        : 'bg-slate-600'
                    }`}
                    style={{
                      width: '32%',
                      marginLeft: `${Math.max(0, Math.min(68, 34 + tiltValue * 0.34))}%`,
                    }}
                  />
                </div>
              </div>

              {isCameraActive && (
                <button
                  type="button"
                  onClick={() => setBaselineOffset(rawDiffRef.current)}
                  className="mt-2.5 text-[10px] text-purple-300 hover:text-white px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-800 hover:border-purple-600 transition-colors flex items-center gap-1 font-medium"
                >
                  <span>🎯 ตั้งศูนย์หน้าตรง (Calibrate)</span>
                </button>
              )}
            </div>

            {/* Right Choice B */}
            <button
              onClick={() => handleConfirmChoice('B')}
              disabled={isAnswered}
              className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between min-h-[160px] shadow-lg ${
                confirmedChoice === 'B'
                  ? currentQ.correctChoice === 'B'
                    ? 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500'
                    : 'bg-rose-500/20 border-rose-500'
                  : tiltSelection === 'B' && !isAnswered
                  ? 'bg-indigo-950/60 border-indigo-400 ring-4 ring-indigo-400/50 scale-102 shadow-xl shadow-indigo-500/20'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-black font-['Chakra_Petch'] flex items-center gap-1">
                  <span>ข้อ B (เอียงขวา ⟶)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
                {tiltSelection === 'B' && !isAnswered && (
                  <span className="text-[10px] text-indigo-300 font-mono font-bold bg-indigo-500/30 px-2 py-0.5 rounded-full animate-pulse">
                    ล็อกคำตอบ {holdProgress}%
                  </span>
                )}
              </div>
              <div className="my-2">
                <div className="text-sm font-bold text-white font-mono bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                  {currentQ.optionB.text}
                </div>
              </div>
              <div className="text-[11px] text-slate-400 text-right">
                เอียงศีรษะไปทางขวาค้างไว้ หรือคลิกที่นี่
              </div>
            </button>
          </div>

          {/* Explanation Banner */}
          {isAnswered && (
            <div
              className={`p-4 rounded-xl border text-xs sm:text-sm animate-fade-in ${
                confirmedChoice === currentQ.correctChoice
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 mb-1">
                {confirmedChoice === currentQ.correctChoice ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>เอียงหัวเลือกคำตอบได้ถูกต้อง! 🎉</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>ยังไม่ถูกต้องนะจ๊ะ 💡</span>
                  </>
                )}
              </div>
              <p className="text-slate-300 leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Next Button */}
          {isAnswered && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
              >
                <span>
                  {currentIdx < QUESTIONS.length - 1 ? 'ข้อถัดไป' : 'ดูสรุปผลคะแนน'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Finished Screen */
        <div className="mt-8 py-6 text-center space-y-5">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-4xl shadow-xl">
            🏆
          </div>

          <div>
            <h4 className="text-2xl font-black text-white font-['Chakra_Petch']">
              ยินดีด้วย! คุณพิชิตภารกิจ Head-Tilt Quiz (Scratch)
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              ทำคะแนนได้ {score} จาก 100 คะแนน
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>ได้รับ +250 XP พิชิตบล็อกคำสั่ง Scratch!</span>
          </div>

          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={handleRestart}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>เล่นใหม่อีกครั้ง</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
