/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Puzzle,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Layers,
  Flag,
  Move
} from 'lucide-react';

interface Game4ScratchStudioProps {
  onComplete: (score: number, maxScore: number, xpEarned: number) => void;
}

interface ScratchMission {
  id: number;
  title: string;
  category: string;
  goal: string;
  situation: string;
  blockOptions: {
    id: string;
    text: string;
    color: string;
    isCorrect: boolean;
  }[];
  explanation: string;
  catPosition: { x: number; y: number };
}

const MISSIONS: ScratchMission[] = [
  {
    id: 1,
    title: 'ภารกิจที่ 1: จุดเริ่มต้นการทำงาน (Events & Green Flag)',
    category: 'บทที่ 4.1 หน้าต่างและการทำงานของ Scratch',
    goal: 'เริ่มต้นสคริปต์เมื่อผู้ใช้กดปุ่มธงเขียวบนเวที',
    situation: 'ต้องการให้แมวสแครชเริ่มเคลื่อนไหวทันทีที่ผู้เล่นกดปุ่มธงเขียว (Go) ต้องวางบล็อกคำสั่งใดเป็นบล็อกแรกสุด?',
    blockOptions: [
      { id: 'b1', text: 'เมื่อคลิก ⚑ (when green flag clicked)', color: 'bg-amber-500 text-slate-950 font-bold', isCorrect: true },
      { id: 'b2', text: 'เมื่อกดปุ่ม space (when space key pressed)', color: 'bg-amber-600/60 text-white', isCorrect: false },
      { id: 'b3', text: 'เคลื่อนที่ 10 ก้าว (move 10 steps)', color: 'bg-blue-600/60 text-white', isCorrect: false },
      { id: 'b4', text: 'วนซ้ำตลอด (forever)', color: 'bg-yellow-600/60 text-white', isCorrect: false },
    ],
    explanation: 'บล็อก "เมื่อคลิก ⚑" (when green flag clicked) ในกลุ่มเหตุการณ์ (Events) คือจุดเริ่มต้นมาตรฐานของการรันสคริปต์ใน Scratch',
    catPosition: { x: 30, y: 70 },
  },
  {
    id: 2,
    title: 'ภารกิจที่ 2: เคลื่อนไหวไม่สิ้นสุดและเด้งกลับ (Motion & Bounce)',
    category: 'บทที่ 4.2 การควบคุมและการเคลื่อนที่',
    goal: 'สั่งให้แมวเดินไปข้างหน้าเรื่อยๆ และไม่หลุดออกจากขอบจอ',
    situation: 'ต้องการให้ตัวละครเดินหน้าตลอดเวลา และถ้าแตะขอบเวทีให้สะท้อนกลับ ต้องใช้บล็อกคำสั่งใดร่วมกับ forever?',
    blockOptions: [
      { id: 'b1', text: 'ถ้าชนขอบให้สะท้อนกลับ (if on edge, bounce)', color: 'bg-blue-500 text-white font-bold', isCorrect: true },
      { id: 'b2', text: 'หยุดทั้งหมด (stop all)', color: 'bg-rose-600/60 text-white', isCorrect: false },
      { id: 'b3', text: 'ซ่อนตัวละคร (hide)', color: 'bg-purple-600/60 text-white', isCorrect: false },
      { id: 'b4', text: 'พูด สวัสดี! (say Hello!)', color: 'bg-purple-600/60 text-white', isCorrect: false },
    ],
    explanation: 'บล็อก "ถ้าชนขอบให้สะท้อนกลับ" (if on edge, bounce) อยู่ในหมวด Motion ใช้ป้องกันไม่ให้ตัวละครเดินทะลุหลุดหายไปจากเวที',
    catPosition: { x: 90, y: 70 },
  },
  {
    id: 3,
    title: 'ภารกิจที่ 3: ตัวแปรเก็บคะแนน (Variables)',
    category: 'บทที่ 4.3 ตัวแปรใน Scratch (หน้า 109)',
    goal: 'เพิ่มคะแนนให้กับผู้เล่นเมื่อเก็บเหรียญรางวัลสำเร็จ',
    situation: 'ในเกมมีตัวแปรชื่อ score ต้องการให้คะแนนเพิ่มขึ้น 1 คะแนนทุกครั้งที่ผู้เล่นเก็บเหรียญได้ บล็อกใดถูกต้อง?',
    blockOptions: [
      { id: 'b1', text: 'เปลี่ยน [score] ทีละ 1 (change score by 1)', color: 'bg-orange-500 text-slate-950 font-bold', isCorrect: true },
      { id: 'b2', text: 'ตั้งค่า [score] เป็น 0 (set score to 0)', color: 'bg-orange-600/60 text-white', isCorrect: false },
      { id: 'b3', text: 'แสดงตัวแปร [score] (show variable)', color: 'bg-orange-600/60 text-white', isCorrect: false },
      { id: 'b4', text: 'บวกเลข (1 + 1)', color: 'bg-emerald-600/60 text-white', isCorrect: false },
    ],
    explanation: 'change [score] by 1 จะนำค่าเดิมในตัวแปร score มาบวกเพิ่มอีก 1 ส่วน set score to 0 ใช้รีเซ็ตคะแนนเริ่มต้นเกม',
    catPosition: { x: 150, y: 70 },
  },
  {
    id: 4,
    title: 'ภารกิจที่ 4: การตรวจจับการสัมผัส (Sensing & Touching)',
    category: 'บทที่ 4.4 การตรวจสอบเงื่อนไข if-then (หน้า 122)',
    goal: 'ตรวจสอบว่าแมวสัมผัสโดนตัวละครดาว หรืออุปสรรคหรือไม่',
    situation: 'ต้องการเขียนเงื่อนไข "ถ้าแตะโดนตัวละคร Star ให้ส่งเสียง Meow" ต้องนำบล็อกใดมาใส่ในช่องเงื่อนไขของ if <...>?',
    blockOptions: [
      { id: 'b1', text: 'แตะ [Star] หรือไม่? (touching Star?)', color: 'bg-sky-500 text-white font-bold', isCorrect: true },
      { id: 'b2', text: 'เมาส์ชี้อยู่หรือไม่? (mouse-pointer)', color: 'bg-sky-600/60 text-white', isCorrect: false },
      { id: 'b3', text: 'ตัวจับเวลา > 10 (timer > 10)', color: 'bg-sky-600/60 text-white', isCorrect: false },
      { id: 'b4', text: 'ระยะทางไปยัง [Star] (distance to Star)', color: 'bg-sky-600/60 text-white', isCorrect: false },
    ],
    explanation: 'บล็อกรูปหกเหลี่ยม "touching [Star]?" ในหมวด Sensing ใช้ส่งค่า จริง/เท็จ เข้าสู่โครงสร้าง if-then เพื่อตรวจสอบการชน',
    catPosition: { x: 210, y: 70 },
  },
  {
    id: 5,
    title: 'ภารกิจที่ 5: การวนซ้ำแบบมีเงื่อนไข (Repeat Until)',
    category: 'บทที่ 4.5 การวนซ้ำแบบมีเงื่อนไข (หน้า 126)',
    goal: 'วนซ้ำเก็บแต้มจนกว่าคะแนนจะครบ 5 คะแนนแล้วจบเกม',
    situation: 'ต้องการให้แมวเดินเก็บแต้มเรื่อยๆ และจะหยุดทำงานเมื่อผู้เล่นได้คะแนน score ครบ 5 คะแนน ต้องใช้คำสั่งใด?',
    blockOptions: [
      { id: 'b1', text: 'วนซ้ำจนกระทั่ง <score = 5> (repeat until)', color: 'bg-yellow-500 text-slate-950 font-bold', isCorrect: true },
      { id: 'b2', text: 'วนซ้ำ (5) รอบ (repeat 5)', color: 'bg-yellow-600/60 text-white', isCorrect: false },
      { id: 'b3', text: 'วนซ้ำตลอด (forever)', color: 'bg-yellow-600/60 text-white', isCorrect: false },
      { id: 'b4', text: 'ถ้า <score = 5> หยุด (if score = 5 stop)', color: 'bg-yellow-600/60 text-white', isCorrect: false },
    ],
    explanation: 'repeat until <เงื่อนไข> จะทำคำสั่งข้างในซ้ำไปเรื่อยๆ จนกว่าเงื่อนไข score = 5 จะกลายเป็นจริง จึงจะหลุดออกจากลูป',
    catPosition: { x: 250, y: 70 },
  },
];

export const Game4ScratchStudio: React.FC<Game4ScratchStudioProps> = ({ onComplete }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [catAnimation, setCatAnimation] = useState(false);

  const mission = MISSIONS[currentIdx];

  const handleSelectBlock = (optId: string) => {
    if (isAnswered) return;
    setSelectedBlockId(optId);
    setIsAnswered(true);

    const chosen = mission.blockOptions.find((b) => b.id === optId);
    if (chosen?.isCorrect) {
      setScore((prev) => prev + 1);
      setCatAnimation(true);
      setTimeout(() => setCatAnimation(false), 800);
    }
  };

  const handleNext = () => {
    if (currentIdx < MISSIONS.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedBlockId(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      const totalScore = Math.round((score / MISSIONS.length) * 100);
      const xp = 200 + score * 30;
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      onComplete(totalScore, 100, xp);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedBlockId(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 text-slate-100 max-w-3xl mx-auto shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Puzzle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white font-['Chakra_Petch'] flex items-center gap-2">
              <span>Scratch Block Studio & Game Maker</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                ม.1 บทที่ 4
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              ต่อบล็อกคำสั่งเชิงภาพ สร้างสคริปต์เกม ควบคุมตัวละคร และจัดการตัวแปร
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-slate-400">ภารกิจ: </span>
            <span className="font-bold text-orange-400 font-['Chakra_Petch'] text-sm">
              {currentIdx + 1} / {MISSIONS.length}
            </span>
          </div>
          <div>
            <span className="text-slate-400">คะแนน: </span>
            <span className="font-bold text-emerald-400 font-['Chakra_Petch'] text-sm">
              {score}
            </span>
          </div>
        </div>
      </div>

      {!isFinished ? (
        <div className="mt-5 space-y-5">
          {/* Mission Category */}
          <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="font-semibold text-orange-300">{mission.title}</span>
            <span className="text-[11px] text-slate-400">{mission.category}</span>
          </div>

          {/* Interactive Scratch Mini Stage */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 relative overflow-hidden min-h-[160px] flex flex-col justify-between">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  ⚑
                </span>
                <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                  ⏹
                </span>
                <span className="text-slate-400 font-mono text-[11px]">เวที Scratch Stage (x: 0, y: 0)</span>
              </div>
              <div className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Score: {score}
              </div>
            </div>

            {/* Stage Canvas Area */}
            <div className="relative h-24 w-full flex items-center justify-between px-6">
              {/* Scratch Cat Sprite */}
              <div
                className={`w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-3xl shadow-lg transition-all duration-300 select-none ${
                  catAnimation ? 'scale-125 rotate-12' : ''
                }`}
                title="Scratch Cat (Sprite1)"
              >
                🐱
              </div>

              {/* Goal / Target */}
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-xl animate-pulse">
                    ⭐
                  </div>
                  <span className="text-[10px] text-yellow-400 font-mono">Star</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <span className="text-orange-400 font-bold">เป้าหมาย: </span>
              {mission.goal}
            </div>
          </div>

          {/* Situation Question */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>โจทย์บล็อกคำสั่ง</span>
            </div>
            <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed">
              {mission.situation}
            </p>
          </div>

          {/* Block Snapping Choices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mission.blockOptions.map((opt) => {
              const isSelected = selectedBlockId === opt.id;
              const isCorrect = opt.isCorrect;

              let style = 'bg-slate-950 border-slate-800 hover:border-orange-500/50 text-slate-200';
              if (isAnswered) {
                if (isCorrect) {
                  style = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold ring-1 ring-emerald-500';
                } else if (isSelected && !isCorrect) {
                  style = 'bg-rose-500/20 border-rose-500 text-rose-300 font-semibold';
                } else {
                  style = 'opacity-40 border-slate-800 text-slate-500';
                }
              }

              return (
                <button
                  key={opt.id}
                  disabled={isAnswered}
                  onClick={() => handleSelectBlock(opt.id)}
                  className={`text-left p-3.5 rounded-xl border transition-all flex items-center justify-between text-xs sm:text-sm group ${style}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-sm bg-orange-500/80 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="font-mono">{opt.text}</span>
                  </div>

                  {isAnswered && isCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                  )}
                  {isAnswered && isSelected && !isCorrect && (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Banner */}
          {isAnswered && (
            <div
              className={`p-4 rounded-xl border text-xs sm:text-sm animate-fade-in ${
                selectedBlockId && mission.blockOptions.find((b) => b.id === selectedBlockId)?.isCorrect
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 mb-1">
                {selectedBlockId && mission.blockOptions.find((b) => b.id === selectedBlockId)?.isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>ต่อบล็อกคำสั่งได้ถูกต้อง! 🐱🚀</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>บล็อกนี้ยังทำงานไม่ตรงเป้าหมายนะจ๊ะ 💡</span>
                  </>
                )}
              </div>
              <p className="text-slate-300 leading-relaxed">
                {mission.explanation}
              </p>
            </div>
          )}

          {/* Action Button */}
          {isAnswered && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all"
              >
                <span>
                  {currentIdx < MISSIONS.length - 1 ? 'ภารกิจถัดไป' : 'ดูสรุปผลคะแนน'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Finished Screen */
        <div className="mt-8 py-6 text-center space-y-5">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-4xl shadow-xl">
            🎨
          </div>

          <div>
            <h4 className="text-2xl font-black text-white font-['Chakra_Petch']">
              ยินดีด้วย! คุณพิชิต Scratch Block Studio
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              ทำคะแนนได้ {score} จาก {MISSIONS.length} ภารกิจ ({Math.round((score / MISSIONS.length) * 100)}%)
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>ได้รับ +{200 + score * 30} XP สู่การเป็นนักสร้างเกม Scratch!</span>
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
