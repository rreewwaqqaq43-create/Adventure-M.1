/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Plus,
  Trash2,
  Layers,
  Code2,
  Flag,
  Square,
  Lightbulb,
  Trophy,
  ArrowRight,
  Volume2
} from 'lucide-react';
import { sfx } from '../../utils/audioEffects';
import { ScratchCatSprite, ScratchCatCostume } from './ScratchCatSprite';

interface Game4ScratchAIStudioProps {
  onComplete: (score: number, maxScore: number, xpEarned: number) => void;
}

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
  targetScore: number;
  starPosition?: { x: number; y: number };
}

const SCRATCH_STAGES: ScratchStageLevel[] = [
  {
    stageNumber: 1,
    title: 'ด่านที่ 1: ก้าวแรกสู่ Scratch & ธงเขียว (Events & Motion)',
    subtitle: 'เริ่มต้นโปรแกรมด้วยการคลิกธงเขียวและการเดินของตัวละครแมว',
    objective: 'เมื่อคลิกธงเขียว ⚑ ให้แมวสีส้มเดินไปข้างหน้า (move steps) แล้วพูดว่า "Hello Scratch!"',
    conceptName: 'บล็อกเหตุการณ์ (Events) และบล็อกเคลื่อนไหว (Motion)',
    textbookPage: 'หนังสือ สสวท. ม.1 หน้า 90–95',
    mascotHint: 'วางบล็อก "when green flag clicked ⚑" ตามด้วย "move (30) steps" และ "say [Hello Scratch!] for 2 secs"',
    requiredBlockKeywords: ['when green flag', 'move', 'say'],
    initialBlocks: ['when green flag clicked ⚑'],
    targetScore: 20,
  },
  {
    stageNumber: 2,
    title: 'ด่านที่ 2: การวนซ้ำและการสะท้อนขอบเวที (Forever & Bounce)',
    subtitle: 'สั่งให้แมวสีส้มเดินตลอดเวลาโดยไม่หลุดออกจากขอบเวที',
    objective: 'ใช้บล็อกวนซ้ำตลอด (forever) สั่งให้แมวเดินไปข้างหน้า สลับท่าเดิน (next costume) และถ้าชนขอบให้สะท้อนกลับ (if on edge, bounce)',
    conceptName: 'การวนซ้ำและการตรวจสอบขอบเขต (Loops & Sensing)',
    textbookPage: 'หนังสือ สสวท. ม.1 หน้า 102–105',
    mascotHint: 'ใส่ "forever", "move (10) steps", "next costume" และ "if on edge, bounce"',
    requiredBlockKeywords: ['forever', 'move', 'if on edge, bounce'],
    initialBlocks: ['when green flag clicked ⚑', 'forever'],
    targetScore: 40,
  },
  {
    stageNumber: 3,
    title: 'ด่านที่ 3: ตัวแปรและการเก็บคะแนน (Variables & Score)',
    subtitle: 'สร้างระบบสะสมคะแนนเมื่อแมวเดินทางไปเก็บเหรียญดาวบนเวที',
    objective: 'ตั้งค่าคะแนนเริ่มต้นเป็น 0 (set score to 0) และสั่งให้แมวเดินไปเก็บดาว เมื่อแตะดาวให้เพิ่มคะแนน (change score by 1)',
    conceptName: 'ตัวแปรใน Scratch (Variables & Scoring)',
    textbookPage: 'หนังสือ สสวท. ม.1 หน้า 109–115',
    mascotHint: 'ใส่ "set [score] to 0", "move (30) steps" และ "change [score] by 1"',
    requiredBlockKeywords: ['set [score]', 'change [score]', 'move'],
    initialBlocks: ['when green flag clicked ⚑', 'set [score] to 0'],
    targetScore: 60,
    starPosition: { x: 70, y: -20 },
  },
  {
    stageNumber: 4,
    title: 'ด่านที่ 4: การทำงานแบบมีทางเลือก (If-Then & Turn)',
    subtitle: 'ตรวจสอบเงื่อนไขและควบคุมการหมุนทิศทางของตัวละคร',
    objective: 'สั่งให้แมวกระโดด (change y by 50) และหมุนเลี้ยว (turn right 15 degrees) พร้อมส่งเสียงร้อง (play sound Meow)',
    conceptName: 'โครงสร้างแบบมีทางเลือกและการหมุน (Conditions & Rotation)',
    textbookPage: 'หนังสือ สสวท. ม.1 หน้า 122–126',
    mascotHint: 'ใส่ "turn right 15 degrees", "change y by 50 (กระโดด)" และ "play sound [Meow]"',
    requiredBlockKeywords: ['turn right', 'change y', 'play sound'],
    initialBlocks: ['when green flag clicked ⚑'],
    targetScore: 80,
  },
  {
    stageNumber: 5,
    title: 'ด่านที่ 5: ภารกิจมหาบัณฑิต Scratch (Master Cat Challenge)',
    subtitle: 'บูรณาการครบทั้ง เหตุการณ์ เคลื่อนที่ วนซ้ำ ตัวแปร และเสียง',
    objective: 'ประกอบบล็อกให้ครบทั้งการวนซ้ำ (repeat 5), การเดิน, หมุนเลี้ยว, เพิ่มคะแนน และแสดงข้อความสำเร็จ!',
    conceptName: 'โครงงานการสร้างเกมแอนิเมชัน Scratch แบบบูรณาการ',
    textbookPage: 'หนังสือ สสวท. ม.1 หน้า 128–132',
    mascotHint: 'ใส่ "repeat (5)", "move (30) steps", "change [score] by 1" และ "say [ไชโย! ผ่านฉลุย!] for 2 secs"',
    requiredBlockKeywords: ['repeat', 'move', 'change [score]', 'say'],
    initialBlocks: ['when green flag clicked ⚑', 'repeat (5)'],
    targetScore: 100,
    starPosition: { x: 100, y: -20 },
  },
];

// Clean, standard Scratch blocks palette grouped by official Scratch categories
const BLOCK_TOOLBOX = [
  {
    category: 'Events (เหตุการณ์ - สีเหลืองส้ม)',
    color: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold',
    blocks: [
      'when green flag clicked ⚑',
      'when [space] key pressed',
    ],
  },
  {
    category: 'Motion (การเคลื่อนไหว - สีน้ำเงิน)',
    color: 'bg-blue-600 hover:bg-blue-500 text-white font-bold',
    blocks: [
      'move (30) steps',
      'move (10) steps',
      'turn right 15 degrees',
      'turn right 90 degrees',
      'change y by 50 (กระโดด)',
      'if on edge, bounce',
    ],
  },
  {
    category: 'Looks (รูปลักษณ์ - สีม่วง)',
    color: 'bg-purple-600 hover:bg-purple-500 text-white font-bold',
    blocks: [
      'say [Hello Scratch!] for 2 secs',
      'say [Meow!] for 2 secs',
      'say [ไชโย! ผ่านฉลุย!] for 2 secs',
      'next costume',
    ],
  },
  {
    category: 'Control (การควบคุม - สีส้มทอง)',
    color: 'bg-yellow-600 hover:bg-yellow-500 text-white font-bold',
    blocks: [
      'forever',
      'repeat (5)',
    ],
  },
  {
    category: 'Variables (ตัวแปร - สีส้มเข้ม)',
    color: 'bg-orange-600 hover:bg-orange-500 text-white font-bold',
    blocks: [
      'change [score] by 1',
      'set [score] to 0',
    ],
  },
  {
    category: 'Sound (เสียง - สีชมพู)',
    color: 'bg-pink-600 hover:bg-pink-500 text-white font-bold',
    blocks: [
      'play sound [Meow]',
    ],
  },
];

export const Game4ScratchAIStudio: React.FC<Game4ScratchAIStudioProps> = ({ onComplete }) => {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const currentStage = SCRATCH_STAGES[currentStageIdx];

  // Workspace blocks stack
  const [blocksInWorkspace, setBlocksInWorkspace] = useState<string[]>(currentStage.initialBlocks);
  const [isRunning, setIsRunning] = useState(false);
  const [activeExecutingBlockIdx, setActiveExecutingBlockIdx] = useState<number | null>(null);

  // Scratch Cat Real Simulation State on the Stage
  const [catPos, setCatPos] = useState<{ x: number; y: number }>({ x: -140, y: -20 });
  const [catDirection, setCatDirection] = useState<number>(1); // 1 = right, -1 = left
  const [catRotation, setCatRotation] = useState<number>(0);
  const [catCostume, setCatCostume] = useState<ScratchCatCostume>('walk1');
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [stageScore, setStageScore] = useState<number>(0);
  const [starCollected, setStarCollected] = useState(false);
  const [stageSuccess, setStageSuccess] = useState(false);

  // Timer ref to cleanly stop execution
  const executionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset stage state when changing stage
  useEffect(() => {
    setBlocksInWorkspace(currentStage.initialBlocks);
    resetStageState();
  }, [currentStageIdx]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (executionTimerRef.current) {
        clearInterval(executionTimerRef.current);
      }
    };
  }, []);

  const resetStageState = () => {
    if (executionTimerRef.current) {
      clearInterval(executionTimerRef.current);
      executionTimerRef.current = null;
    }
    setIsRunning(false);
    setCatPos({ x: -140, y: -20 });
    setCatDirection(1);
    setCatRotation(0);
    setCatCostume('walk1');
    setSpeechBubble(null);
    setStageScore(0);
    setStarCollected(false);
    setStageSuccess(false);
    setActiveExecutingBlockIdx(null);
  };

  // Add block to workspace stack
  const handleAddBlock = (block: string) => {
    sfx.playClick();
    setBlocksInWorkspace((prev) => [...prev, block]);
  };

  // Remove block from workspace stack
  const handleRemoveBlock = (index: number) => {
    if (index === 0 && blocksInWorkspace[0].includes('green flag')) {
      return; // Keep flag
    }
    sfx.playClick();
    setBlocksInWorkspace((prev) => prev.filter((_, i) => i !== index));
  };

  // 100% REAL Scratch Block Execution Engine
  const handleRunScript = () => {
    if (isRunning) return;

    // Reset before running
    if (executionTimerRef.current) {
      clearInterval(executionTimerRef.current);
    }
    setIsRunning(true);
    setSpeechBubble(null);
    sfx.playPowerUp();

    const workspaceStr = blocksInWorkspace.join(' ');

    // Check if required blocks for this stage are met
    const isPassing = currentStage.requiredBlockKeywords.every((keyword) =>
      workspaceStr.toLowerCase().includes(keyword.toLowerCase())
    );

    let stepIndex = 0;
    const totalSteps = blocksInWorkspace.includes('forever') ? 16 : Math.max(blocksInWorkspace.length * 2, 8);

    executionTimerRef.current = setInterval(() => {
      stepIndex++;
      const curBlockIdx = stepIndex % blocksInWorkspace.length;
      setActiveExecutingBlockIdx(curBlockIdx);
      const activeBlock = blocksInWorkspace[curBlockIdx] || '';

      // Alternate walk animation
      setCatCostume((prev) => (prev === 'walk1' ? 'walk2' : 'walk1'));

      // 1. MOTION: Move Steps
      if (activeBlock.includes('move (30) steps') || activeBlock.includes('move (10) steps')) {
        const stepAmount = activeBlock.includes('(30)') ? 30 : 15;
        setCatPos((prev) => {
          let newX = prev.x + stepAmount * catDirection;

          // Check star collection if star is nearby
          if (currentStage.starPosition && !starCollected) {
            const dist = Math.abs(newX - currentStage.starPosition.x);
            if (dist < 35) {
              setStarCollected(true);
              setStageScore((s) => s + 1);
              sfx.playCoin();
            }
          }

          // Edge bounce logic
          if (workspaceStr.includes('if on edge, bounce')) {
            if (newX > 140) {
              newX = 140;
              setCatDirection(-1);
              sfx.playHit();
            } else if (newX < -140) {
              newX = -140;
              setCatDirection(1);
              sfx.playHit();
            }
          } else {
            // clamp
            if (newX > 150) newX = 150;
            if (newX < -150) newX = -150;
          }

          return { ...prev, x: newX };
        });
      }

      // 2. MOTION: Turn Degrees
      if (activeBlock.includes('turn right 15')) {
        setCatRotation((prev) => (prev + 15) % 360);
      } else if (activeBlock.includes('turn right 90')) {
        setCatRotation((prev) => (prev + 90) % 360);
      }

      // 3. MOTION: Jump (change y by 50)
      if (activeBlock.includes('change y by 50')) {
        setCatPos((prev) => ({ ...prev, y: 30 }));
        setCatCostume('jump');
        sfx.playJump();
        setTimeout(() => {
          setCatPos((prev) => ({ ...prev, y: -20 }));
          setCatCostume('walk1');
        }, 400);
      }

      // 4. LOOKS: Speech Bubbles
      if (activeBlock.includes('say [Hello Scratch!]')) {
        setSpeechBubble('Hello Scratch! 🐱✨');
      } else if (activeBlock.includes('say [Meow!]')) {
        setSpeechBubble('Meow! เหมียว 🐾');
        sfx.playClick();
      } else if (activeBlock.includes('say [ไชโย! ผ่านฉลุย!]')) {
        setSpeechBubble('ไชโย! ผ่านฉลุย! 🏆🎉');
        setCatCostume('happy');
      }

      // 5. LOOKS: Next Costume
      if (activeBlock.includes('next costume')) {
        setCatCostume((prev) => (prev === 'walk1' ? 'walk2' : 'walk1'));
      }

      // 6. SOUND: Meow
      if (activeBlock.includes('play sound [Meow]')) {
        sfx.playSuccess();
        setSpeechBubble('Meow! 🎵');
      }

      // 7. VARIABLES: Change Score / Set Score
      if (activeBlock.includes('set [score] to 0')) {
        setStageScore(0);
      } else if (activeBlock.includes('change [score] by 1')) {
        setStageScore((prev) => prev + 1);
        sfx.playCoin();
      }

      // Check if simulation step finished
      if (stepIndex >= totalSteps) {
        if (executionTimerRef.current) {
          clearInterval(executionTimerRef.current);
          executionTimerRef.current = null;
        }
        setIsRunning(false);
        setActiveExecutingBlockIdx(null);

        if (isPassing) {
          setStageSuccess(true);
          setCatCostume('happy');
          sfx.playVictory();
          confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });

          // If final stage 5 completed
          if (currentStageIdx === SCRATCH_STAGES.length - 1) {
            onComplete(100, 100, 250);
          }
        }
      }
    }, 450);
  };

  const handleNextStage = () => {
    if (currentStageIdx < SCRATCH_STAGES.length - 1) {
      setCurrentStageIdx((prev) => prev + 1);
    } else {
      onComplete(100, 100, 250);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 text-slate-100 max-w-6xl mx-auto shadow-2xl relative space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white font-['Chakra_Petch'] flex items-center gap-2">
              <span>มินิเกมสตูดิโอการโปรแกรมด้วย Scratch (Scratch Block Game)</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ม.1 บทที่ 4
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              ต่อบล็อกคำสั่งควบคุมแมวสีส้ม Scratch (Scratch Cat) เคลื่อนไหว ทำงานจริง 100% ตามหลักสูตร สสวท.
            </p>
          </div>
        </div>

        {/* Stage Progress Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {SCRATCH_STAGES.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentStageIdx(idx)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                currentStageIdx === idx
                  ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/40'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              ด่าน {s.stageNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Current Stage Objective Card */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              {currentStage.conceptName} • {currentStage.textbookPage}
            </span>
            <h4 className="text-base sm:text-lg font-black text-white font-['Chakra_Petch']">
              {currentStage.title}
            </h4>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 w-fit">
            ภารกิจด่านที่ {currentStageIdx + 1} / {SCRATCH_STAGES.length}
          </span>
        </div>

        <div className="text-xs sm:text-sm text-slate-200 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>เป้าหมาย:</strong> {currentStage.objective}
          </div>
        </div>

        {/* Hint from Scratch Cat */}
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-xs text-amber-200">
          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>คำแนะนำจากแมว Scratch:</strong> {currentStage.mascotHint}
          </span>
        </div>
      </div>

      {/* 3-Column Studio Interface: ToolBox (Left) + Scripts Stack (Middle) + Authentic Live Stage (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 1. Toolbox: Standard Scratch Blocks (4 cols) */}
        <div className="lg:col-span-4 p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white font-['Chakra_Petch'] flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-amber-400" />
                <span>คลังบล็อกคำสั่ง (Scratch Blocks)</span>
              </span>
              <span className="text-[10px] text-slate-400">กดเพื่อต่อบล็อก</span>
            </div>

            <div className="mt-3 space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {BLOCK_TOOLBOX.map((cat, cIdx) => (
                <div key={cIdx} className="space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400">{cat.category}</div>
                  <div className="space-y-1">
                    {cat.blocks.map((blockText, bIdx) => (
                      <button
                        key={bIdx}
                        type="button"
                        onClick={() => handleAddBlock(blockText)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between group shadow hover:scale-[1.02] active:scale-95 cursor-pointer ${cat.color}`}
                      >
                        <span className="font-mono text-[11px] truncate">{blockText}</span>
                        <Plus className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-[10px] text-slate-400 text-center border-t border-slate-800">
            💡 คลิกเลือกบล็อกสีเพื่อต่อคำสั่งสั่งแมวสีส้ม
          </div>
        </div>

        {/* 2. Scripts Stack Workspace (4 cols) */}
        <div className="lg:col-span-4 p-4 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 font-['Chakra_Petch'] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>พื้นที่ต่อสคริปต์ (Scripts Workspace)</span>
              </span>
              <button
                type="button"
                onClick={() => setBlocksInWorkspace(currentStage.initialBlocks)}
                className="text-[10px] text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1"
                title="รีเซ็ตบล็อก"
              >
                <RotateCcw className="w-3 h-3" />
                <span>รีเซ็ต</span>
              </button>
            </div>

            {/* Block Stack Container */}
            <div className="mt-3 space-y-1.5 min-h-[300px] max-h-[380px] overflow-y-auto p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              {blocksInWorkspace.map((blockText, idx) => {
                const isFlag = blockText.includes('green flag');
                const isControl = blockText.includes('forever') || blockText.includes('repeat');
                const isVariable = blockText.includes('score');
                const isSound = blockText.includes('sound');
                const isMotion = blockText.includes('move') || blockText.includes('turn') || blockText.includes('bounce') || blockText.includes('change y');
                const isLooks = blockText.includes('say') || blockText.includes('costume');
                const isExecuting = activeExecutingBlockIdx === idx;

                let blockBg = 'bg-blue-600 text-white';
                if (isFlag) blockBg = 'bg-amber-500 text-slate-950 font-bold';
                else if (isControl) blockBg = 'bg-yellow-600 text-white font-bold';
                else if (isVariable) blockBg = 'bg-orange-600 text-white font-bold';
                else if (isSound) blockBg = 'bg-pink-600 text-white font-bold';
                else if (isLooks) blockBg = 'bg-purple-600 text-white font-bold';
                else if (isMotion) blockBg = 'bg-blue-600 text-white font-bold';

                return (
                  <div
                    key={idx}
                    className={`relative p-2.5 rounded-xl text-xs font-mono transition-all flex items-center justify-between shadow ${blockBg} ${
                      isExecuting
                        ? 'ring-4 ring-yellow-300 scale-105 z-10 brightness-110 shadow-lg'
                        : ''
                    }`}
                  >
                    <span className="truncate pr-1">{blockText}</span>
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBlock(idx)}
                        className="opacity-70 hover:opacity-100 p-0.5 hover:text-rose-200 transition-colors"
                        title="ลบบล็อกนี้"
                      >
                        <Trash2 className="w-3 h-3" />
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
              className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                isRunning
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:scale-105 cursor-pointer ring-2 ring-emerald-400/30'
              }`}
            >
              <Flag className="w-4 h-4 fill-current text-slate-950" />
              <span>▶️ รันธงเขียว (Execute 100%)</span>
            </button>
            <button
              type="button"
              onClick={resetStageState}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs border border-slate-700"
              title="หยุด / รีเซ็ตเวที"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>

        {/* 3. Live Authentic Scratch Stage with Orange Cat (4 cols) */}
        <div className="lg:col-span-4 p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between">
          <div>
            {/* Stage Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-xs text-white font-['Chakra_Petch']">
                  เวทีจำลอง Scratch (Stage Canvas)
                </span>
              </div>

              {/* Green Flag & Red Stop on Stage */}
              <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={handleRunScript}
                  disabled={isRunning}
                  className="text-emerald-400 hover:text-emerald-300 p-1"
                  title="เริ่มรันธงเขียว"
                >
                  <Flag className="w-3.5 h-3.5 fill-current" />
                </button>
                <button
                  type="button"
                  onClick={resetStageState}
                  className="text-rose-500 hover:text-rose-400 p-1"
                  title="หยุดเวที"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            </div>

            {/* Stage Box */}
            <div className="relative mt-3 rounded-2xl bg-gradient-to-b from-sky-950/70 via-slate-900 to-slate-950 border-2 border-slate-700 h-[270px] overflow-hidden shadow-inner flex items-center justify-center">
              {/* Coordinates Grid Lines */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="w-full h-1/2 border-b border-white" />
                <div className="h-full w-1/2 border-r border-white absolute top-0 left-0" />
              </div>

              {/* Stage Floor */}
              <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-slate-950 to-transparent border-t border-slate-800/60 pointer-events-none" />

              {/* Variables HUD on Stage */}
              <div className="absolute top-2 left-2 px-3 py-1 rounded-md bg-amber-500 text-slate-950 font-mono font-black text-xs shadow-md">
                score: {stageScore}
              </div>

              {/* Coordinates Indicator */}
              <div className="absolute bottom-2 left-2 text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                x: {catPos.x}, y: {catPos.y}
              </div>

              {/* Star Target */}
              {currentStage.starPosition && !starCollected && (
                <div
                  className="absolute text-2xl animate-bounce filter drop-shadow-lg"
                  style={{
                    transform: `translate(${currentStage.starPosition.x}px, ${currentStage.starPosition.y}px)`,
                  }}
                >
                  ⭐
                </div>
              )}

              {/* THE AUTHENTIC ORANGE SCRATCH CAT */}
              <div
                className="absolute transition-all duration-300"
                style={{
                  transform: `translate(${catPos.x}px, ${-catPos.y}px)`,
                }}
              >
                <ScratchCatSprite
                  costume={catCostume}
                  direction={catDirection}
                  rotationAngle={catRotation}
                  sayText={speechBubble}
                  width={80}
                  height={80}
                  isAnimated={isRunning}
                />
              </div>
            </div>
          </div>

          {/* Success Banner & Next Stage */}
          {stageSuccess ? (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/50 text-center space-y-2.5 animate-fade-in shadow-xl">
              <div className="text-xs font-black text-emerald-300 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>ผ่านด่านที่ {currentStageIdx + 1} เรียบร้อยแล้ว! 🎉</span>
              </div>
              <button
                type="button"
                onClick={handleNextStage}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow transition-all hover:scale-105 flex items-center justify-center gap-1.5"
              >
                <span>{currentStageIdx < SCRATCH_STAGES.length - 1 ? 'ไปด่านถัดไป →' : 'รับเหรียญรางวัลผู้พิชิต Scratch! 🏆'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-center text-[11px] text-slate-400">
              {isRunning ? (
                <span className="text-amber-300 font-bold animate-pulse">
                  ⚙️ แมว Scratch กำลังทำงานตามสคริปต์...
                </span>
              ) : (
                <span>ต่อบล็อกคำสั่งแล้วกดปุ่ม ▶️ รันธงเขียว เพื่อทดสอบ</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
