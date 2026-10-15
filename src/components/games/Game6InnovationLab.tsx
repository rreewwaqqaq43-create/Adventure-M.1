/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Lightbulb,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Target,
  FileText,
  Palette,
  Hammer,
  CheckCheck,
  Presentation
} from 'lucide-react';

interface Game6InnovationLabProps {
  onComplete: (score: number, maxScore: number, xpEarned: number) => void;
}

interface StepItem {
  stepNumber: number;
  name: string;
  icon: any;
  correctActionId: string;
  scenario: string;
  choices: { id: string; label: string; isCorrect: boolean }[];
  reflection: string;
}

const PROJECT_STEPS: StepItem[] = [
  {
    stepNumber: 1,
    name: 'ขั้นที่ 1: การระบุปัญหา (Problem Identification)',
    icon: Target,
    correctActionId: 'c1_2',
    scenario: 'ปัญหาในโรงเรียน: ถังขยะแยกประเภทเต็มล้นและนักเรียนทิ้งขยะไม่ถูกถัง ทำให้เกิดกลิ่นและสกปรก',
    choices: [
      { id: 'c1_1', label: 'รีบซื้อถังขยะใหม่ 100 ใบโดยไม่ต้องสำรวจ', isCorrect: false },
      { id: 'c1_2', label: 'ระบุปัญหาให้ชัดเจน: นักเรียนสับสนสัญลักษณ์สีถังขยะและไม่มีสิ่งจูงใจในการคัดแยก', isCorrect: true },
      { id: 'c1_3', label: 'ลงโทษตัดคะแนนทุกคนในโรงเรียน', isCorrect: false },
    ],
    reflection: 'การระบุสาเหตุที่แท้จริงของปัญหา (Root Cause) คือจุดเริ่มต้นที่สำคัญที่สุด',
  },
  {
    stepNumber: 2,
    name: 'ขั้นที่ 2: การรวบรวมข้อมูลและแนวคิดที่เกี่ยวข้อง (Information Gathering)',
    icon: FileText,
    correctActionId: 'c2_1',
    scenario: 'ต้องการทราบพฤติกรรมการทิ้งขยะและเทคโนโลยีที่สามารถนำมาช่วยได้',
    choices: [
      { id: 'c2_1', label: 'ทำแบบสอบถามสัมภาษณ์เพื่อนๆ และค้นคว้าเรื่องระบบสะสมแต้ม/สแกน QR Code เพื่อแยกขยะ', isCorrect: true },
      { id: 'c2_2', label: 'นั่งเดาข้อมูลเอาเองตามความรู้สึก', isCorrect: false },
      { id: 'c2_3', label: 'ลอกการบ้านโครงงานของปีก่อนมาทั้งหมด', isCorrect: false },
    ],
    reflection: 'ข้อมูลที่น่าเชื่อถือจากการสำรวจจริงช่วยให้เห็นแนวทางการออกแบบที่ตรงจุด',
  },
  {
    stepNumber: 3,
    name: 'ขั้นที่ 3: ออกแบบวิธีการแก้ปัญหา (Solution Design)',
    icon: Palette,
    correctActionId: 'c3_3',
    scenario: 'ออกแบบแอปพลิเคชันหรือสื่อต้นแบบเพื่อแก้ปัญหา',
    choices: [
      { id: 'c3_1', label: 'เริ่มพิมพ์โค้ดทันทีโดยไม่วาดแผนภาพผังงาน (Flowchart)', isCorrect: false },
      { id: 'c3_2', label: 'จ้างคนอื่นทำให้โดยตนเองไม่ต้องคิด', isCorrect: false },
      { id: 'c3_3', label: 'วาดภาพหน้าจอ Storyboard และเขียนผังงานแสดงลำดับขั้นตอนการให้แต้มเมื่อหย่อนขยะถูกประเภท', isCorrect: true },
    ],
    reflection: 'การออกแบบด้วย Storyboard และ Flowchart ช่วยลดความผิดพลาดก่อนเริ่มสร้างจริง',
  },
  {
    stepNumber: 4,
    name: 'ขั้นที่ 4: วางแผนและดำเนินการแก้ปัญหา (Planning & Action)',
    icon: Hammer,
    correctActionId: 'c4_2',
    scenario: 'ลงมือพัฒนาชิ้นงานตามแบบที่ได้วางไว้',
    choices: [
      { id: 'c4_1', label: 'ทำคนเดียวทั้งหมดและไม่แบ่งหน้าที่ให้เพื่อนในกลุ่ม', isCorrect: false },
      { id: 'c4_2', label: 'จัดทำตารางเวลา กำหนดบทบาทสมาชิก และลงมือสร้างโปรแกรม/สื่อตามขั้นตอน', isCorrect: true },
      { id: 'c4_3', label: 'รอทำคืนก่อนวันส่งงาน 1 วัน', isCorrect: false },
    ],
    reflection: 'การบริหารเวลาและแบ่งงานตามความถนัดของสมาชิกทำให้โครงงานเสร็จทันเวลา',
  },
  {
    stepNumber: 5,
    name: 'ขั้นที่ 5: ทดสอบ ประเมินผล และปรับปรุงแก้ไข (Testing & Evaluation)',
    icon: CheckCheck,
    correctActionId: 'c5_1',
    scenario: 'นำต้นแบบแอปพลิเคชันไปทดลองใช้จริงกับเพื่อนๆ ชั้น ม.1',
    choices: [
      { id: 'c5_1', label: 'ให้กลุ่มตัวอย่างทดลองใช้ บันทึกข้อบกพร่อง และนำคำติชมมาปรับปรุง UI ให้อ่านง่ายขึ้น', isCorrect: true },
      { id: 'c5_2', label: 'ไม่ยอมรับฟังข้อผิดพลาด และบอกว่าระบบตนเองสมบูรณ์แบบแล้ว', isCorrect: false },
      { id: 'c5_3', label: 'ลบแอปทิ้งทันทีเมื่อเจอจุดผิดพลาดข้อแรก', isCorrect: false },
    ],
    reflection: 'การทดสอบและการยอมรับคำติชมเพื่อพัฒนา (Iterative Improvement) ทำให้ผลงานสมบูรณ์แบบ',
  },
  {
    stepNumber: 6,
    name: 'ขั้นที่ 6: นำเสนอวิธีการแก้ปัญหา (Presentation & Reflection)',
    icon: Presentation,
    correctActionId: 'c6_2',
    scenario: 'เตรียมนำเสนอผลงานในคาบเรียนวิทยาการคำนวณ',
    choices: [
      { id: 'c6_1', label: 'อ่านสไลด์คำต่อคำอย่างรวดเร็วเพื่อจะได้รีบจบ', isCorrect: false },
      { id: 'c6_2', label: 'สรุปปัญหา วิธีการแก้ปัญหา สาธิตการทำงาน และบทเรียนที่ได้รับจากการทำงานร่วมกัน', isCorrect: true },
      { id: 'c6_3', label: 'ไม่เตรียมตัวและให้เพื่อนพูดคนเดียว', isCorrect: false },
    ],
    reflection: 'การสื่อสารที่ชัดเจนและการสะท้อนคิด (Reflection) คือหัวใจของนักนวัตกรยุคใหม่',
  },
];

export const Game6InnovationLab: React.FC<Game6InnovationLabProps> = ({ onComplete }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentStep = PROJECT_STEPS[currentStepIdx];
  const Icon = currentStep.icon;

  const handleSelectChoice = (choiceId: string, isCorrect: boolean) => {
    if (isAnswered) return;
    setSelectedChoiceId(choiceId);
    setIsAnswered(true);

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentStepIdx < PROJECT_STEPS.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
      setSelectedChoiceId(null);
      setIsAnswered(false);
    } else {
      setIsCompleted(true);
      const totalScore = score + (selectedChoiceId === currentStep.correctActionId ? 0 : 0);
      const xpEarned = totalScore * 30 + 80;
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      onComplete(totalScore, PROJECT_STEPS.length, xpEarned);
    }
  };

  const handleRestart = () => {
    setCurrentStepIdx(0);
    setScore(0);
    setSelectedChoiceId(null);
    setIsAnswered(false);
    setIsCompleted(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 max-w-3xl mx-auto shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white font-['Chakra_Petch']">
              มินิเกม: ห้องทดลองนวัตกรชุมชน (App Innovation Lab)
            </h3>
            <p className="text-xs text-slate-400">
              เรียนรู้ 6 ขั้นตอนกระบวนการทางวิศวกรรมและการแก้ปัญหาด้วยโครงงาน ม.1
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-400">คะแนนความก้าวหน้า</div>
          <div className="text-xl font-black text-amber-400 font-['Chakra_Petch']">
            {score} / {PROJECT_STEPS.length}
          </div>
        </div>
      </div>

      {!isCompleted ? (
        <div className="mt-6 space-y-6">
          {/* Step Breadcrumbs */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{currentStep.name}</span>
            <span>ขั้นตอนที่ {currentStepIdx + 1} / 6</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-amber-500 h-full transition-all duration-300"
              style={{ width: `${((currentStepIdx + 1) / PROJECT_STEPS.length) * 100}%` }}
            />
          </div>

          {/* Scenario Box */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
              <Icon className="w-4 h-4" />
              <span>สถานการณ์โครงงาน: แอปแยกขยะอัจฉริยะ</span>
            </div>
            <p className="text-base text-slate-200 font-medium">
              "{currentStep.scenario}"
            </p>
          </div>

          {/* Choices */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-slate-400">
              ในฐานะหัวหน้าโครงงาน คุณจะเลือกแนวทางใด?
            </div>
            {currentStep.choices.map((choice) => {
              const isSelected = selectedChoiceId === choice.id;
              let style = 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-200';
              if (isAnswered) {
                if (choice.isCorrect) {
                  style = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold';
                } else if (isSelected && !choice.isCorrect) {
                  style = 'bg-rose-500/20 border-rose-500 text-rose-300';
                } else {
                  style = 'opacity-40 border-slate-800 text-slate-500';
                }
              }

              return (
                <button
                  key={choice.id}
                  disabled={isAnswered}
                  onClick={() => handleSelectChoice(choice.id, choice.isCorrect)}
                  className={`w-full p-3.5 rounded-xl border text-left text-sm transition-all flex items-center justify-between ${style}`}
                >
                  <span>{choice.label}</span>
                  {isAnswered && choice.isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 ml-2" />
                  )}
                  {isAnswered && isSelected && !choice.isCorrect && (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Reflection */}
          {isAnswered && (
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-indigo-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ข้อคิดสำคัญของขั้นตอนนี้:</span>
              </div>
              <p>{currentStep.reflection}</p>
            </div>
          )}

          {/* Next Button */}
          {isAnswered && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md hover:scale-105"
              >
                {currentStepIdx < PROJECT_STEPS.length - 1 ? 'ก้าวสู่ขั้นต่อไป →' : 'สรุปผลโครงงานนวัตกรรม'}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Finished */
        <div className="py-10 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Award className="w-9 h-9" />
          </div>
          <h4 className="text-2xl font-black text-white font-['Chakra_Petch']">
            สำเร็จ 6 ขั้นตอนกระบวนการทางวิศวกรรม!
          </h4>
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            คุณได้รับเหรียญตรา "สุดยอดนักนวัตกร ม.1" และพร้อมนำทักษะวิทยาการคำนวณไปประยุกต์ใช้ในชีวิตจริง
          </p>

          <div className="inline-flex items-center gap-6 px-6 py-3 bg-slate-950 rounded-2xl border border-slate-800">
            <div>
              <div className="text-xs text-slate-400">คะแนนการตัดสินใจ</div>
              <div className="text-2xl font-black text-amber-400">{score} / {PROJECT_STEPS.length}</div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <div className="text-xs text-slate-400">XP ที่ได้รับ</div>
              <div className="text-2xl font-black text-emerald-400">+{score * 30 + 80} XP</div>
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
