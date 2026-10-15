/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  HelpCircle,
  Layers,
  Search,
  EyeOff,
  GitCommit
} from 'lucide-react';

interface Game1DetectiveProps {
  onComplete: (score: number, maxScore: number, xpEarned: number) => void;
}

interface Scenario {
  id: number;
  story: string;
  correctPillar: 'decomposition' | 'pattern' | 'abstraction' | 'algorithm';
  explanation: string;
}

const PILLARS = [
  {
    id: 'decomposition',
    title: '1. การแบ่งย่อยปัญหา (Decomposition)',
    shortTitle: 'Decomposition',
    icon: Layers,
    color: 'from-blue-600 to-cyan-600',
    desc: 'แตกปัญหาใหญ่ออกเป็นส่วนย่อยๆ ที่จัดการได้ง่ายขึ้น',
  },
  {
    id: 'pattern',
    title: '2. การหารูปแบบ (Pattern Recognition)',
    shortTitle: 'Pattern',
    icon: Search,
    color: 'from-emerald-600 to-teal-600',
    desc: 'มองหาความเหมือน คล้ายคลึง หรือแบบแผนที่เคยพบเจอ',
  },
  {
    id: 'abstraction',
    title: '3. การคิดเชิงนามธรรม (Abstraction)',
    shortTitle: 'Abstraction',
    icon: EyeOff,
    color: 'from-amber-600 to-orange-600',
    desc: 'คัดกรองเฉพาะข้อมูลที่สำคัญ ละทิ้งรายละเอียดที่ไม่จำเป็น',
  },
  {
    id: 'algorithm',
    title: '4. การออกแบบขั้นตอนวิธี (Algorithm)',
    shortTitle: 'Algorithm',
    icon: GitCommit,
    color: 'from-purple-600 to-indigo-600',
    desc: 'กำหนดลำดับขั้นตอนการแก้ปัญหาที่ชัดเจนและทำตามได้',
  },
];

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    story: 'คุณครูมอบหมายให้นักเรียนจัดนิทรรศการวันวิทยาศาสตร์ จึงแบ่งหน้าที่ออกเป็น: ฝ่ายสถานที่, ฝ่ายจัดบอร์ด, และฝ่ายของรางวัล',
    correctPillar: 'decomposition',
    explanation: 'การแยกหน้าที่จัดนิทรรศการออกเป็นฝ่ายย่อยๆ คือการแบ่งปัญหาใหญ่เป็นส่วนย่อย (Decomposition)',
  },
  {
    id: 2,
    story: 'นักเรียนสังเกตเห็นว่าโจทย์คณิตศาสตร์ข้อนี้มีสูตรโครงสร้างคล้ายกับข้อที่เคยทำเมื่อวาน จึงนำวิธีการเดิมมาปรับใช้',
    correctPillar: 'pattern',
    explanation: 'การมองเห็นความเหมือนหรือโครงสร้างที่คุ้นเคยในอดีต คือการหารูปแบบ (Pattern Recognition)',
  },
  {
    id: 3,
    story: 'ในการเขียนแผนที่เดินทางจากโรงเรียนไปร้านเครื่องเขียน ผู้วาดระบุเฉพาะชื่อถนนและจุดเลี้ยว โดยไม่วาดสีหลังคาบ้านหรือต้นไม้ริมทาง',
    correctPillar: 'abstraction',
    explanation: 'การเก็บเฉพาะเส้นทางและจุดสำคัญ ละทิ้งสิ่งไม่จำเป็น คือการคิดเชิงนามธรรม (Abstraction)',
  },
  {
    id: 4,
    story: 'คู่มือการต้มบะหมี่กึ่งสำเร็จรูป: 1. ต้มน้ำ 350 มล. ให้เดือด 2. ใส่เส้นต้ม 3 นาที 3. ยกลงและเทเครื่องปรุงคลุกเคล้า',
    correctPillar: 'algorithm',
    explanation: 'การระบุขั้นตอนเป็นลำดับ 1, 2, 3 ที่ชัดเจนและปฏิบัติตามได้ คือการออกแบบขั้นตอนวิธี (Algorithm Design)',
  },
  {
    id: 5,
    story: 'ก่อนจะลงมือเขียนโปรแกรมเกม นักเรียนแยกส่วนประกอบของเกมเป็น: ระบบคะแนน, ระบบควบคุมตัวละคร, และระบบด่าน',
    correctPillar: 'decomposition',
    explanation: 'การแตกโครงสร้างเกมเป็นระบบย่อยๆ คือการแบ่งย่อยปัญหา (Decomposition)',
  },
  {
    id: 6,
    story: 'แอปแผนที่รถไฟฟ้าแสดงเฉพาะสถานีและเส้นทางเชื่อมต่อ เพื่อให้ผู้โดยสารดูเข้าใจง่าย ไม่แสดงตึกรามบ้านช่องบนผืนดิน',
    correctPillar: 'abstraction',
    explanation: 'การสรุปเอาเฉพาะแนวเส้นทางสถานี ไม่นำภาพสิ่งก่อสร้างรอบๆ มาให้เกะกะ คือการคิดเชิงนามธรรม (Abstraction)',
  },
];

export const Game1Detective: React.FC<Game1DetectiveProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentScenario = SCENARIOS[currentIndex];

  const handleSelectPillar = (pillarId: string) => {
    if (isAnswered) return;
    setSelectedPillar(pillarId);
    setIsAnswered(true);

    const isCorrect = pillarId === currentScenario.correctPillar;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < SCENARIOS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedPillar(null);
      setIsAnswered(false);
    } else {
      setIsCompleted(true);
      const totalScore = score + (selectedPillar === currentScenario.correctPillar ? 0 : 0);
      const xpEarned = totalScore * 25 + 50;
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      onComplete(totalScore, SCENARIOS.length, xpEarned);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setScore(0);
    setSelectedPillar(null);
    setIsAnswered(false);
    setIsCompleted(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 max-w-3xl mx-auto shadow-2xl">
      {/* Game Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white font-['Chakra_Petch']">
              มินิเกม: นักสืบปัญหา (Problem Detective)
            </h3>
            <p className="text-xs text-slate-400">
              วิเคราะห์สถานการณ์แล้วเลือก 4 เสาหลักการคิดเชิงคำนวณที่ตรงที่สุด
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-400">คะแนนสะสม</div>
          <div className="text-xl font-black text-amber-400 font-['Chakra_Petch']">
            {score} / {SCENARIOS.length}
          </div>
        </div>
      </div>

      {!isCompleted ? (
        <div className="mt-6 space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>สถานการณ์ที่ {currentIndex + 1} จาก {SCENARIOS.length}</span>
            <span>ความคืบหน้า {Math.round(((currentIndex + 1) / SCENARIOS.length) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-amber-500 h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / SCENARIOS.length) * 100}%` }}
            />
          </div>

          {/* Scenario Question Card */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>โจทย์สืบสวนคดีที่ #{currentScenario.id}</span>
            </div>
            <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-medium">
              "{currentScenario.story}"
            </p>
          </div>

          {/* 4 Pillars Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              const isSelected = selectedPillar === pillar.id;
              const isCorrectPillar = pillar.id === currentScenario.correctPillar;

              let btnStyle = 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-200';
              if (isAnswered) {
                if (isCorrectPillar) {
                  btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold';
                } else if (isSelected && !isCorrectPillar) {
                  btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300 font-semibold';
                } else {
                  btnStyle = 'opacity-40 border-slate-800 text-slate-500';
                }
              }

              return (
                <button
                  key={pillar.id}
                  disabled={isAnswered}
                  onClick={() => handleSelectPillar(pillar.id)}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between group ${btnStyle}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${pillar.color} flex items-center justify-center text-white shadow-sm`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                        {pillar.shortTitle}
                      </div>
                    </div>
                    {isAnswered && isCorrectPillar && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    )}
                    {isAnswered && isSelected && !isCorrectPillar && (
                      <XCircle className="w-5 h-5 text-rose-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{pillar.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Answer Feedback */}
          {isAnswered && (
            <div className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${
              selectedPillar === currentScenario.correctPillar
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-200'
            }`}>
              {selectedPillar === currentScenario.correctPillar ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-bold">
                  {selectedPillar === currentScenario.correctPillar
                    ? 'ถูกต้องยอดเยี่ยม! (+25 XP)'
                    : 'ยังไม่ถูกต้อง'}
                </div>
                <div className="text-xs mt-1 text-slate-300">
                  {currentScenario.explanation}
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          {isAnswered && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md hover:scale-105"
              >
                {currentIndex < SCENARIOS.length - 1 ? 'สถานการณ์ถัดไป →' : 'ดูผลคะแนนรวม'}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Completed Screen */
        <div className="py-10 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Award className="w-9 h-9" />
          </div>
          <h4 className="text-2xl font-black text-white font-['Chakra_Petch']">
            ภารกิจสืบสวนปัญหาสำเร็จ!
          </h4>
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            คุณได้ฝึกแยกแยะ 4 เสาหลักการคิดเชิงคำนวณได้อย่างเชี่ยวชาญ
          </p>

          <div className="inline-flex items-center gap-6 px-6 py-3 bg-slate-950 rounded-2xl border border-slate-800">
            <div>
              <div className="text-xs text-slate-400">คะแนนที่ได้</div>
              <div className="text-2xl font-black text-amber-400">{score} / {SCENARIOS.length}</div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <div className="text-xs text-slate-400">XP ที่ได้รับ</div>
              <div className="text-2xl font-black text-emerald-400">+{score * 25 + 50} XP</div>
            </div>
          </div>

          <div className="pt-4 flex justify-center gap-3">
            <button
              onClick={handleRestart}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
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
