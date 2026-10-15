/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Camera,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Layers,
  Cpu,
  Zap,
  Award,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Code2,
  Gamepad2,
  Eye,
  Check,
  Flag,
  Square,
  Bot,
  Move,
  MessageSquare,
  Volume2,
  Lightbulb,
  Trophy,
  Star,
  ChevronRight
} from 'lucide-react';
import { sfx } from '../../utils/audioEffects';

interface Game4ScratchAIStudioProps {
  onComplete: (score: number, maxScore: number, xpEarned: number) => void;
}

// Stage Level Definition for the 5 Scratch Learning Stages
interface ScratchStageLevel {
  stageNumber: number;
  title: string;
  subtitle: string;
  objective: string;
  conceptName: string;
  textbookPage: string;
  mascotHint: string;
  requiredBlockKeywords: string[];
  initialBlocks: string[];
  availableBlocks: {
    category: string;
    color: string;
    blocks: string[];
  }[];
  targetScore: number;
  starPosition?: { x: number; y: number };
  hasObstacle?: boolean;
}

const SCRATCH_STAGES: ScratchStageLevel[] = [
  {
    stageNumber: 1,
    title: 'ด่านที่ 1: ก้าวแรกสู่ Scratch & ธงเขียว (Events & Motion)',
    subtitle: 'เริ่มต้นโปรแกรมด้วยการคลิกธงเขียวและการเดินของตัวละคร',
    objective: 'เมื่อคลิกธงเขียว ⚑ ให้แมว Scratch เดินไปข้างหน้า 30 ก้าว แล้วพูดว่า "Hello Scratch!"',
    conceptName: 'บล็อกเหตุการณ์ (Events) และบล็อกเคลื่อนไหว (Motion)',
    textbookPage: 'หนังสือ สสวท. ม.1 หน้า 90–95',
    mascotHint: 'วางบล็อก "when green flag clicked ⚑" เป็นบล็อกแรก ตามด้วย "move (30) steps" และ "say [Hello Scratch!] for 2 secs"',
    requiredBlockKeywords: ['when green flag', 'move', 'say'],
    initialBlocks: ['when green flag clicked ⚑'],
    targetScore: 20,
    availableBlocks: [
      {
        category: 'Events (เหตุการณ์)',
        color: 'bg-amber-500 text-slate-950 font-bold',
        blocks: ['when green flag clicked ⚑', 'when [space] key pressed'],
      },
      {
        category: 'Motion (เคลื่อนไหว)',
        color: 'bg-blue-600 text-white font-bold',
        blocks: ['move (30) steps', 'move (10) steps', 'turn right 15 degrees'],
      },
      {
        category: 'Looks (แสดงผล)',
        color: 'bg-purple-600 text-white font-bold',
        blocks: ['say [Hello Scratch!] for 2 secs', 'next costume', 'say [Meow!]'],
      },
    ],
  },
  {
    stageNumber: 2,
    title: 'ด่านที่ 2: การวนซ้ำและการสะท้อนขอบเวที (Forever & Bounce)',
    subtitle: 'สั่งให้แมวเดินลาดตระเวนตลอดเวลาโดยไม่หลุดออกจากจอ',
    objective: 'ใช้บล็อกวนซ้ำตลอด (forever) สั่งให้แมวเดินไปข้างหน้า สลับท่าเดิน (next costume) และถ้าชนขอบให้สะท้อนกลับ (if on edge, bounce)',
    conceptName: 'โครงสร้างควบคุมแบบวนซ้ำ (Loop) และการตรวจจับขอบเวที',
    textbookPage: 'หนังสือ สสวท. ม.1 หน้า 102–108',
    mascotHint: 'นำบล็อก "forever" มาครอบคำสั่ง "move (10) steps", "next costume" และ "if on edge, bounce"',
    requiredBlockKeywords: ['forever', 'move', 'if on edge, bounce'],
    initialBlocks: ['when green flag clicked ⚑'],
    targetScore: 40,
    availableBlocks: [
      {
        category: 'Control (ควบคุม)',
        color: 'bg-orange-500 text-slate-950 font-bold',
        blocks: ['forever', 'repeat (10)', 'wait 0.1 secs'],
      },
      {
        category: 'Motion (เคลื่อนไหว)',
        color: 'bg-blue-600 text-white font-bold',
        blocks: ['move (15) steps', 'if on edge, bounce', 'point in direction (90)'],
      },
      {
        category: 'Looks (แสดงผล)',
        color: 'bg-purple-600 text-white font-bold',
        blocks: ['next costume', 'switch costume to [costume2]'],
      },
    ],
  },
  {
    stageNumber: 3,
    title: 'ด่านที่ 3: ตัวแปรเก็บคะแนนและการตรวจจับ (Variables & Sensing)',
    subtitle: 'เก็บไอเทมดาวทองเพื่อเพิ่มคะแนนในเกม',
    objective: 'ตั้งค่าตัวแปร [score] เป็น 0 เมื่อเริ่มเกม และเมื่อแมวสัมผัสโดนดาว (touching Star) ให้เพิ่มคะแนนขึ้น 1 แต้มพร้อมเล่นเสียง',
    conceptName: 'ตัวแปร (Variables) และเงื่อนไข if-then (Conditionals)',
    textbookPage: 'หนังสือ สสวท. ม.1 หน้า 109–122',
    mascotHint: 'ใช้ "set [score] to 0" ตอนเริ่ม จากนั้นใน forever ใส่ "if <touching [Star] ?> then" -> "change [score] by 1"',
    requiredBlockKeywords: ['set [score]', 'forever', 'touching [Star]', 'change [score]'],
    initialBlocks: ['when green flag clicked ⚑', 'set [score] to 0'],
    targetScore: 60,
    starPosition: { x: 140, y: 0 },
    availableBlocks: [
      {
        category: 'Variables (ตัวแปร)',
        color: 'bg-amber-600 text-white font-bold',
        blocks: ['set [score] to 0', 'change [score] by 1', 'show variable [score]'],
      },
      {
        category: 'Control & Sensing (ควบคุมและตรวจจับ)',
        color: 'bg-orange-500 text-slate-950 font-bold',
        blocks: ['forever', 'if <touching [Star] ?> then', 'wait 0.2 secs'],
      },
      {
        category: 'Motion & Sound (การเคลื่อนที่และเสียง)',
        color: 'bg-blue-600 text-white font-bold',
        blocks: ['move (10) steps', 'play sound [Coin 🔔]', 'if on edge, bounce'],
      },
    ],
  },
  {
    stageNumber: 4,
    title: 'ด่านที่ 4: การกระโดดหลบสิ่งกีดขวาง (Keyboard & Jump Logic)',
    subtitle: 'สร้างระบบเกมกระโดด (Platformer Jump) ด้วยการเปลี่ยนพิกัดแกน Y',
    objective: 'เมื่อผู้เล่นกดปุ่ม Spacebar ให้แมวกระโดดขึ้น (change y by 50) รอ 0.2 วินาที แล้วตกลงมา (change y by -50) เพื่อหลบสิ่งกีดขวาง',
    conceptName: 'ระบบพิกัดฉาก (X, Y Coordinates) และการรับค่าจากแป้นพิมพ์',
    textbookPage: 'หนังสือ สสวท. ม.1 หน้า 115–126',
    mascotHint: 'ใน forever ตรวจสอบ "if <key [space] pressed ?> then" สั่ง "change y by 50" -> "wait 0.2 secs" -> "change y by -50"',
    requiredBlockKeywords: ['key [space] pressed', 'change y by 50', 'change y by -50'],
    initialBlocks: ['when green flag clicked ⚑', 'forever'],
    targetScore: 80,
    hasObstacle: true,
    availableBlocks: [
      {
        category: 'Sensing & Control',
        color: 'bg-sky-500 text-slate-950 font-bold',
        blocks: ['if <key [space] pressed ?> then', 'forever', 'wait 0.2 secs'],
      },
      {
        category: 'Motion (แกนพิกัด X, Y)',
        color: 'bg-blue-600 text-white font-bold',
        blocks: ['change y by 50', 'change y by -50', 'move (5) steps', 'change x by 10'],
      },
      {
        category: 'Looks & Sound',
        color: 'bg-purple-600 text-white font-bold',
        blocks: ['say [Jump! 🦘] for 0.5 secs', 'play sound [Jump_Boing 💨]'],
      },
    ],
  },
  {
    stageNumber: 5,
    title: 'ด่านที่ 5: ภารกิจสูงสุด! เชื่อมโยงโมเดล AI สู่ Scratch (AI Machine Learning Extension 🤖)',
    subtitle: 'ผสานพลัง Computer Vision & NLP Model เข้ากับเกม Scratch',
    objective: 'ใช้บล็อก AI Extension: เมื่อ AI ตรวจพบภาพเป็น "ขยะรีไซเคิล" หรือได้ยินเสียงคำสั่ง ให้เพิ่มคะแนน 5 แต้ม และเปลี่ยนคอสตูมฉลองชัยชนะ!',
    conceptName: 'การประยุกต์ใช้โมเดลปัญญาประดิษฐ์ (AI / Machine Learning for Scratch)',
    textbookPage: 'ประยุกต์วิทยาการคำนวณ ม.1 & AI Extensions',
    mascotHint: 'ใส่บล็อก "if <AI Vision detects [Recyclable]> then" หรือ "if <AI NLP classifies [Fire Attack]> then" เพื่อรับคะแนนโบนัส +5!',
    requiredBlockKeywords: ['AI', 'change [score]', 'say'],
    initialBlocks: ['when green flag clicked ⚑', 'set [score] to 0', 'forever'],
    targetScore: 100,
    availableBlocks: [
      {
        category: '🤖 AI Machine Learning Blocks (โมเดล AI ของฉัน)',
        color: 'bg-indigo-600 text-white font-bold border border-indigo-400',
        blocks: [
          'if <AI Vision detects [ขยะรีไซเคิล 🧴]> then',
          'if <AI NLP classifies [เวทไฟโจมตี 🔥]> then',
          'if <AI Audio hears [กระโดด Jump ⬆️]> then',
          'AI: สแกนข้อมูลนำเข้า (Process Input)',
        ],
      },
      {
        category: 'Variables & Actions',
        color: 'bg-amber-500 text-slate-950 font-bold',
        blocks: ['change [score] by 5', 'say [AI ตรวจพบถูกต้อง! 🎉] for 1 secs', 'play sound [LevelUp 🏆]'],
      },
      {
        category: 'Motion & Looks',
        color: 'bg-blue-600 text-white font-bold',
        blocks: ['switch costume to [Victory_Cat 😺]', 'turn right 360 degrees', 'move (10) steps'],
      },
    ],
  },
];

export const Game4ScratchAIStudio: React.FC<Game4ScratchAIStudioProps> = ({ onComplete }) => {
  // Mode selection: 5-Stage Adventure OR AI Trainer Sandbox
  const [activeMode, setActiveMode] = useState<'stages' | 'ai_trainer'>('stages');

  // Stage state
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const currentStage = SCRATCH_STAGES[currentStageIdx];
  const [blocksInWorkspace, setBlocksInWorkspace] = useState<string[]>(currentStage.initialBlocks);

  // Completed stages tracker
  const [completedStages, setCompletedStages] = useState<boolean[]>([false, false, false, false, false]);

  // Stage Runtime Simulation State
  const [isRunning, setIsRunning] = useState(false);
  const [catPos, setCatPos] = useState({ x: -160, y: -40 });
  const [catDirection, setCatDirection] = useState<1 | -1>(1);
  const [catCostume, setCatCostume] = useState<'walk1' | 'walk2' | 'happy' | 'jump'>('walk1');
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [stageScore, setStageScore] = useState(0);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [stageSuccess, setStageSuccess] = useState(false);
  const [activeExecutingBlockIdx, setActiveExecutingBlockIdx] = useState<number | null>(null);

  // Star collection state
  const [starCollected, setStarCollected] = useState(false);

  // When stage changes, update workspace
  useEffect(() => {
    setBlocksInWorkspace(currentStage.initialBlocks);
    resetStageState();
  }, [currentStageIdx]);

  const resetStageState = () => {
    setIsRunning(false);
    setCatPos({ x: -160, y: -40 });
    setCatDirection(1);
    setCatCostume('walk1');
    setSpeechBubble(null);
    setStageScore(0);
    setSimulationLogs([]);
    setStageSuccess(false);
    setStarCollected(false);
    setActiveExecutingBlockIdx(null);
  };

  // Add block to workspace
  const handleAddBlock = (block: string) => {
    sfx.playClick();
    setBlocksInWorkspace((prev) => [...prev, block]);
  };

  // Remove block from workspace
  const handleRemoveBlock = (index: number) => {
    if (index === 0 && blocksInWorkspace[0].includes('green flag')) {
      return; // Keep flag
    }
    sfx.playClick();
    setBlocksInWorkspace((prev) => prev.filter((_, i) => i !== index));
  };

  // Run Scratch Script Simulation
  const handleRunScript = () => {
    if (isRunning) return;

    resetStageState();
    setIsRunning(true);
    sfx.playPowerUp();

    const workspaceStr = blocksInWorkspace.join(' ');

    // Check if required blocks for this stage are present
    const isPassing = currentStage.requiredBlockKeywords.every((req) =>
      workspaceStr.toLowerCase().includes(req.toLowerCase())
    );

    let stepCounter = 0;
    const maxSteps = 12;

    const interval = setInterval(() => {
      stepCounter++;
      setActiveExecutingBlockIdx(stepCounter % blocksInWorkspace.length);

      // Cat walking animation & position update
      setCatCostume((prev) => (prev === 'walk1' ? 'walk2' : 'walk1'));

      if (workspaceStr.includes('move')) {
        setCatPos((prev) => {
          let newX = prev.x + 25 * catDirection;
          let newDir = catDirection;

          // If on edge, bounce logic
          if (newX > 160) {
            newX = 160;
            if (workspaceStr.includes('if on edge, bounce')) {
              newDir = -1;
              setCatDirection(-1);
              sfx.playHit();
            }
          } else if (newX < -160) {
            newX = -160;
            if (workspaceStr.includes('if on edge, bounce')) {
              newDir = 1;
              setCatDirection(1);
              sfx.playHit();
            }
          }
          return { ...prev, x: newX };
        });
      }

      // Say block logic
      if (workspaceStr.includes('say [Hello Scratch!]')) {
        setSpeechBubble('Hello Scratch! 🐱✨');
      } else if (workspaceStr.includes('say [Jump!]')) {
        setSpeechBubble('Jump! 🦘');
      } else if (workspaceStr.includes('say [AI ตรวจพบถูกต้อง!]') || workspaceStr.includes('say')) {
        setSpeechBubble('AI ตรวจพบสำเร็จ! 🤖🎉');
      }

      // Jump (change y) logic
      if (workspaceStr.includes('change y by 50') || workspaceStr.includes('key [space] pressed')) {
        if (stepCounter % 3 === 0) {
          setCatPos((prev) => ({ ...prev, y: 20 }));
          setCatCostume('jump');
          sfx.playCoin();
          setTimeout(() => {
            setCatPos((prev) => ({ ...prev, y: -40 }));
            setCatCostume('walk1');
          }, 400);
        }
      }

      // Variable score change & touching star logic
      if (workspaceStr.includes('touching [Star]') || workspaceStr.includes('change [score]')) {
        setStarCollected(true);
        setStageScore((prev) => prev + 1);
        sfx.playCoin();
      }

      // AI Block Execution
      if (workspaceStr.includes('AI') && (workspaceStr.includes('Recyclable') || workspaceStr.includes('ขยะ') || workspaceStr.includes('NLP'))) {
        setStageScore(5);
        setCatCostume('happy');
      }

      // Check if finished simulation
      if (stepCounter >= maxSteps) {
        clearInterval(interval);
        setIsRunning(false);
        setActiveExecutingBlockIdx(null);

        if (isPassing) {
          setStageSuccess(true);
          sfx.playVictory();
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });

          // Mark current stage completed
          setCompletedStages((prev) => {
            const next = [...prev];
            next[currentStageIdx] = true;
            return next;
          });
        } else {
          sfx.playIncorrect();
        }
      }
    }, 280);
  };

  // Next Stage Button
  const handleNextStage = () => {
    sfx.playClick();
    if (currentStageIdx < SCRATCH_STAGES.length - 1) {
      setCurrentStageIdx((prev) => prev + 1);
    } else {
      // Completed all 5 stages!
      handleFinishAllStages();
    }
  };

  const handleFinishAllStages = () => {
    sfx.playVictory();
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.5 },
    });
    onComplete(100, 100, 150);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Mode Switcher */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-2xl shrink-0">
            🐱
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white font-['Chakra_Petch']">
                Scratch Coding & AI Simulator
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold">
                บทที่ 4 มินิเกม 5 ด่าน
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              เลือกบล็อกคำสั่งมาต่อ รันสคริปต์บนเวที Scratch จำลอง และเรียนรู้ครบ 5 ด่าน ตั้งแต่พื้นฐานจนถึง AI!
            </p>
          </div>
        </div>

        {/* 5 Stages Navigation Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {SCRATCH_STAGES.map((st, idx) => (
            <button
              key={st.stageNumber}
              type="button"
              onClick={() => {
                sfx.playClick();
                setCurrentStageIdx(idx);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                currentStageIdx === idx
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg scale-105'
                  : completedStages[idx]
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {completedStages[idx] ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <span className="font-mono">{idx + 1}</span>
              )}
              <span>ด่าน {idx + 1}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Current Stage Objective Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              {currentStage.conceptName} • {currentStage.textbookPage}
            </span>
            <h3 className="text-base sm:text-lg font-black text-white mt-0.5 font-['Chakra_Petch']">
              {currentStage.title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-950 text-amber-300 border border-amber-500/30">
              เป้าหมาย: ด่านที่ {currentStageIdx + 1}/5
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>ภารกิจ:</strong> {currentStage.objective}
          </div>
        </div>

        {/* Mascot Cat Hint */}
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5 text-xs text-amber-200">
          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>คำแนะนำจากแมว Scratch:</strong> {currentStage.mascotHint}
          </span>
        </div>
      </div>

      {/* Main Studio Area: Blocks Palette (Left) + Workspace (Middle) + Live Stage Canvas (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. Block Palette (4 cols) */}
        <div className="lg:col-span-4 p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-black text-xs sm:text-sm text-white font-['Chakra_Petch'] flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-amber-400" />
                <span>คลังบล็อกคำสั่ง (Toolbox)</span>
              </h4>
              <span className="text-[10px] text-slate-400">กดเพื่อต่อบล็อก</span>
            </div>

            <div className="mt-3 space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
              {currentStage.availableBlocks.map((cat, cIdx) => (
                <div key={cIdx} className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400">{cat.category}</div>
                  <div className="space-y-1.5">
                    {cat.blocks.map((blockText, bIdx) => (
                      <button
                        key={bIdx}
                        type="button"
                        onClick={() => handleAddBlock(blockText)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between group shadow hover:scale-[1.02] active:scale-95 cursor-pointer ${cat.color}`}
                      >
                        <span className="font-mono text-[11px]">{blockText}</span>
                        <Plus className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 text-center border-t border-slate-800">
            💡 กดเลือกบล็อกสีด้านบนเพื่อเพิ่มเข้าไปในสคริปต์
          </div>
        </div>

        {/* 2. Workspace Scripts Stack (4 cols) */}
        <div className="lg:col-span-4 p-4 sm:p-5 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-black text-xs sm:text-sm text-slate-200 font-['Chakra_Petch'] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>พื้นที่สคริปต์ (Scripts Stack)</span>
              </h4>
              <button
                type="button"
                onClick={() => setBlocksInWorkspace(currentStage.initialBlocks)}
                className="text-[10px] text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>รีเซ็ต</span>
              </button>
            </div>

            {/* Block Stack Visualizer */}
            <div className="mt-3 space-y-1.5 min-h-[300px] max-h-[380px] overflow-y-auto p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              {blocksInWorkspace.map((blockText, idx) => {
                const isFlag = blockText.includes('green flag');
                const isAI = blockText.includes('AI');
                const isControl = blockText.includes('forever') || blockText.includes('if') || blockText.includes('repeat');
                const isVariable = blockText.includes('score') || blockText.includes('variable');
                const isExecuting = activeExecutingBlockIdx === idx;

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs font-mono font-bold transition-all shadow ${
                      isExecuting
                        ? 'ring-4 ring-amber-400 scale-105 z-10'
                        : ''
                    } ${
                      isFlag
                        ? 'bg-amber-500 text-slate-950 w-full rounded-t-2xl'
                        : isAI
                        ? 'bg-indigo-600 text-white ml-2 border border-indigo-400'
                        : isVariable
                        ? 'bg-amber-600 text-white ml-2'
                        : isControl
                        ? 'bg-orange-500 text-slate-950 ml-1.5'
                        : 'bg-blue-600 text-white ml-3'
                    }`}
                  >
                    <span className="truncate pr-1">{blockText}</span>
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBlock(idx)}
                        className="p-1 text-slate-300 hover:text-white transition-colors shrink-0"
                        title="ลบบล็อกนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              disabled={isRunning}
              onClick={handleRunScript}
              className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all ${
                isRunning
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:scale-105 cursor-pointer ring-2 ring-emerald-400/30'
              }`}
            >
              <Flag className="w-3.5 h-3.5 fill-current" />
              <span>▶️ รันธงเขียว (Test Script)</span>
            </button>
            <button
              type="button"
              onClick={resetStageState}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              title="หยุด / รีเซ็ตเวที"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        </div>

        {/* 3. Live Scratch Stage Simulation Canvas (4 cols) */}
        <div className="lg:col-span-4 p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between">
          <div>
            {/* Stage Top Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h4 className="font-black text-xs text-white font-['Chakra_Petch']">
                  เวทีจำลอง Scratch (Stage Preview)
                </h4>
              </div>

              {/* Stage Controls */}
              <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={handleRunScript}
                  className="text-emerald-400 hover:text-emerald-300 p-1"
                  title="เริ่มรันธงเขียว"
                >
                  <Flag className="w-3.5 h-3.5 fill-current" />
                </button>
                <button
                  type="button"
                  onClick={resetStageState}
                  className="text-rose-400 hover:text-rose-300 p-1"
                  title="หยุดเวที"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            </div>

            {/* The Visual Scratch Stage Window */}
            <div className="relative mt-3 rounded-2xl bg-gradient-to-b from-sky-950 via-slate-900 to-slate-950 border-2 border-slate-700 h-[260px] overflow-hidden shadow-inner flex items-center justify-center">
              {/* Coordinates Grid Lines (Scratch style) */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="w-full h-1/2 border-b border-white" />
                <div className="h-full w-1/2 border-r border-white absolute top-0 left-0" />
              </div>

              {/* Variables HUD on Stage */}
              <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-mono font-black text-[11px] shadow">
                score: {stageScore}
              </div>

              {/* Coordinates Indicator */}
              <div className="absolute bottom-2 left-2 text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded">
                x: {catPos.x}, y: {catPos.y}
              </div>

              {/* Target Star if stage 3 */}
              {currentStage.starPosition && !starCollected && (
                <div
                  className="absolute transition-all duration-300 text-2xl animate-bounce"
                  style={{
                    transform: `translate(${currentStage.starPosition.x}px, ${currentStage.starPosition.y}px)`,
                  }}
                >
                  ⭐
                </div>
              )}

              {/* Obstacle if stage 4 */}
              {currentStage.hasObstacle && (
                <div
                  className="absolute text-2xl"
                  style={{ transform: `translate(0px, -40px)` }}
                >
                  🪨
                </div>
              )}

              {/* AI Vision Scanner Box if stage 5 */}
              {currentStage.stageNumber === 5 && (
                <div
                  className="absolute top-4 right-4 p-2 rounded-xl bg-indigo-950/80 border border-indigo-400 text-center text-[10px] text-indigo-300 shadow animate-pulse"
                >
                  <div>👁️ AI Vision Scanner</div>
                  <div className="text-xs font-bold text-white mt-0.5">🧴 Recyclable (98%)</div>
                </div>
              )}

              {/* Scratch Cat Sprite Character */}
              <div
                className="absolute transition-all duration-200 flex flex-col items-center select-none"
                style={{
                  transform: `translate(${catPos.x}px, ${-catPos.y}px) scaleX(${catDirection})`,
                }}
              >
                {/* Speech Bubble */}
                {speechBubble && (
                  <div className="mb-1 px-2.5 py-1 rounded-xl bg-white text-slate-950 text-[11px] font-black shadow-lg animate-fade-in whitespace-nowrap border border-slate-300">
                    {speechBubble}
                  </div>
                )}

                {/* Animated Cat Icon */}
                <div
                  className={`text-4xl filter drop-shadow-md transition-transform ${
                    catCostume === 'walk2' ? 'rotate-6' : catCostume === 'jump' ? '-translate-y-4' : ''
                  }`}
                >
                  {catCostume === 'happy' ? '😸' : '🐱'}
                </div>
              </div>
            </div>
          </div>

          {/* Stage Result Banner & Next Button */}
          {stageSuccess ? (
            <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-center space-y-2 animate-fade-in">
              <div className="text-xs font-black text-emerald-300 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>ผ่านด่านที่ {currentStageIdx + 1} สำเร็จ! 🎉</span>
              </div>
              <button
                type="button"
                onClick={handleNextStage}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs transition-all shadow flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>
                  {currentStageIdx < SCRATCH_STAGES.length - 1
                    ? `ไปด่านที่ ${currentStageIdx + 2} →`
                    : 'รับรางวัลและจบมินิเกม (+150 XP) 🏆'}
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="text-center p-2 rounded-xl bg-slate-950 text-[11px] text-slate-400">
              {isRunning ? '⏳ กำลังรันสคริปต์บนเวที...' : 'กดปุ่ม "▶️ รันธงเขียว" เพื่อทดสอบสคริปต์'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
