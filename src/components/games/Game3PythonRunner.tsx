/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Terminal,
  Play,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  Sparkles,
  ArrowRight,
  Code2,
  HelpCircle,
  Compass
} from 'lucide-react';

interface Game3PythonRunnerProps {
  onComplete: (score: number, maxScore: number, xpEarned: number) => void;
}

interface PythonLevel {
  id: number;
  title: string;
  topic: string;
  description: string;
  codeSnippet: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  turtleTask?: {
    shape: 'square' | 'triangle' | 'circle';
    expectedMoves: string[];
  };
}

const PYTHON_LEVELS: PythonLevel[] = [
  {
    id: 1,
    title: 'ภารกิจที่ 1: ตัวแปรและการแสดงผล (Print & Variables)',
    topic: 'บทที่ 3.1–3.4 ตัวแปรและคำสั่งแสดงผล',
    description: 'พิจารณาโค้ดภาษา Python ต่อไปนี้ แล้วทายผลลัพธ์ที่จะแสดงบนหน้าจอคอนโซล',
    codeSnippet: `x = 15\ny = 5\nname = "Python"\nprint(name + " " + str(x + y))`,
    question: 'เมื่อโปรแกรมประมวลผลเสร็จสิ้น หน้าจอจะพิมพ์ผลลัพธ์ใด?',
    options: ['Python 20', 'Python 155', 'Error ไม่สามารถคำนวณได้', 'Python x+y'],
    correctIndex: 0,
    explanation: 'x + y = 20 แปลงเป็น str(20) แล้วนำมาเชื่อมกับข้อความ "Python " ได้เป็น "Python 20"',
  },
  {
    id: 2,
    title: 'ภารกิจที่ 2: แปลงชนิดข้อมูล (Type Casting)',
    topic: 'บทที่ 3.4 การแปลงชนิดข้อมูล int() float() str()',
    description: 'โปรแกรมรับข้อมูลราคาสินค้าจากผู้ใช้ผ่านคำสั่ง input() ซึ่งส่งคืนค่าเป็นข้อความ (string)',
    codeSnippet: `price = "150"\ndiscount = "30"\ntotal = int(price) - int(discount)\nprint("ต้องจ่ายเงิน:", total, "บาท")`,
    question: 'คำสั่ง int(price) ทำหน้าที่สำคัญอย่างไรในโค้ดนี้?',
    options: [
      'แปลงข้อความ "150" ให้เป็นจำนวนเต็ม 150 เพื่อนำไปลบเลขได้',
      'ลบเครื่องหมายคำพูดออกแต่ยังคำนวณไม่ได้',
      'แปลงค่าตัวเลขให้กลายเป็นทศนิยม float',
      'สั่งให้พิมพ์ค่า 150 ทันที',
    ],
    correctIndex: 0,
    explanation: 'ข้อมูลที่ได้จาก input() หรืออยู่ในเครื่องหมายคำพูดเป็น string ต้องใช้ int() แปลงเป็นตัวเลขจำนวนเต็มก่อนนำมาคำนวณทางคณิตศาสตร์',
  },
  {
    id: 3,
    title: 'ภารกิจที่ 3: สั่งเต่าไพทอนวาดรูปสี่เหลี่ยม (Turtle Graphics)',
    topic: 'บทที่ 3.6 คำสั่งเต่าไพทอน turtle module',
    description: 'ต้องการสั่งให้เต่าเดินหน้า 100 หน่วย และเลี้ยวขวา 90 องศา วนซ้ำ 4 รอบเพื่อวาดรูปสี่เหลี่ยมจัตุรัส',
    codeSnippet: `import turtle\nt = turtle.Turtle()\nfor i in range(4):\n    t.forward(100)\n    t._______(90)`,
    question: 'ในช่องว่าง _______ ต้องเติมคำสั่งใดเพื่อให้เต่าเลี้ยวขวา 90 องศา?',
    options: ['right', 'turn', 'turn_right', 'rotate'],
    correctIndex: 0,
    explanation: 'ในโมดูล turtle ของ Python คำสั่งเลี้ยวขวาคือ t.right(angle) และเลี้ยวซ้ายคือ t.left(angle)',
  },
  {
    id: 4,
    title: 'ภารกิจที่ 4: การวนซ้ำและสูตรคูณ (For Loop)',
    topic: 'บทที่ 3.7 การวนซ้ำด้วย for loop',
    description: 'พิจารณาคำสั่งวนซ้ำ range(1, 4) ต่อไปนี้',
    codeSnippet: `total = 0\nfor i in range(1, 4):\n    total = total + i\nprint("ผลรวม =", total)`,
    question: 'ตัวแปร i จะมีค่าในแต่ละรอบเป็นเท่าใด และผลรวมสุดท้ายคือข้อใด?',
    options: [
      'i มีค่า 1, 2, 3 และผลรวม = 6',
      'i มีค่า 1, 2, 3, 4 และผลรวม = 10',
      'i มีค่า 0, 1, 2, 3 และผลรวม = 6',
      'i มีค่า 1, 4 และผลรวม = 5',
    ],
    correctIndex: 0,
    explanation: 'range(1, 4) จะเริ่มจาก 1 ถึง 3 (ไม่รวม 4) ดังนั้น total = 1 + 2 + 3 = 6',
  },
  {
    id: 5,
    title: 'ภารกิจที่ 5: โครงสร้างทางเลือก (If-Elif-Else)',
    topic: 'บทที่ 3.8 ทางเลือกและการตัดสินใจเงื่อนไข',
    description: 'โปรแกรมตัดเกรดวิชาเทคโนโลยี วิทยาการคำนวณ',
    codeSnippet: `score = 78\nif score >= 80:\n    grade = "4"\nelif score >= 70:\n    grade = "3"\nelif score >= 60:\n    grade = "2"\nelse:\n    grade = "1"\nprint("เกรดของคุณคือ:", grade)`,
    question: 'เมื่อนักเรียนได้คะแนน score = 78 โปรแกรมจะแสดงเกรดใด?',
    options: ['เกรดของคุณคือ: 3', 'เกรดของคุณคือ: 4', 'เกรดของคุณคือ: 2', 'เกรดของคุณคือ: 1'],
    correctIndex: 0,
    explanation: 'คะแนน 78 ไม่ผ่านเงื่อนไขแรก (>= 80) จึงมาตรวจสอบ elif score >= 70 ซึ่งเป็นจริง (78 >= 70) จึงได้เกรด 3',
  },
];

export const Game3PythonRunner: React.FC<Game3PythonRunnerProps> = ({ onComplete }) => {
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [turtleAngle, setTurtleAngle] = useState(0);
  const [turtleSteps, setTurtleSteps] = useState<{ x: number; y: number }[]>([{ x: 120, y: 120 }]);

  const currentLevel = PYTHON_LEVELS[currentLevelIdx];

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentLevel.correctIndex;
    if (isCorrect) {
      setScore((prev) => prev + 1);
      // Animate turtle simulation
      setTurtleAngle((prev) => (prev + 90) % 360);
      setTurtleSteps((prev) => {
        const last = prev[prev.length - 1] || { x: 120, y: 120 };
        return [...prev, { x: (last.x + 35) % 220, y: (last.y + 35) % 220 }];
      });
    }
  };

  const handleNext = () => {
    if (currentLevelIdx < PYTHON_LEVELS.length - 1) {
      setCurrentLevelIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      const totalScore = Math.round((score / PYTHON_LEVELS.length) * 100);
      const xp = 200 + score * 30;
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      onComplete(totalScore, 100, xp);
    }
  };

  const handleRestart = () => {
    setCurrentLevelIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
    setTurtleAngle(0);
    setTurtleSteps([{ x: 120, y: 120 }]);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 text-slate-100 max-w-3xl mx-auto shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white font-['Chakra_Petch'] flex items-center gap-2">
              <span>Python Code Runner & Turtle</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                ม.1 บทที่ 3
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              ฝึกอ่านโค้ด คำนวณตัวแปร ควบคุมการวนซ้ำ และสั่งงานเต่าไพทอน
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-slate-400">ด่านที่: </span>
            <span className="font-bold text-blue-400 font-['Chakra_Petch'] text-sm">
              {currentLevelIdx + 1} / {PYTHON_LEVELS.length}
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
          {/* Level Info */}
          <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="font-semibold text-blue-300">{currentLevel.title}</span>
            <span className="text-[11px] text-slate-400">{currentLevel.topic}</span>
          </div>

          {/* Interactive Python Terminal & Turtle Canvas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Terminal Code Display */}
            <div className="md:col-span-2 bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs sm:text-sm">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-[11px]">script.py</span>
                </div>
                <Code2 className="w-3.5 h-3.5 text-slate-600" />
              </div>
              <pre className="text-blue-300 leading-relaxed overflow-x-auto whitespace-pre">
                {currentLevel.codeSnippet}
              </pre>
            </div>

            {/* Python Turtle Graphics Mini Stage */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[140px]">
              <div className="absolute top-2 left-2 text-[10px] text-slate-500 font-mono">
                Turtle Screen
              </div>
              <div
                className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl transition-all duration-500 shadow-lg"
                style={{ transform: `rotate(${turtleAngle}deg)` }}
                title={`เต่าไพทอน หันมุม ${turtleAngle}°`}
              >
                🐢
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-mono">
                angle: {turtleAngle}°
              </p>
              <span className="text-[10px] text-emerald-400">
                พร้อมวาดรูปเรขาคณิต
              </span>
            </div>
          </div>

          {/* Question Prompt */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>โจทย์ท้าทาย</span>
            </div>
            <p className="text-sm sm:text-base text-slate-100 font-medium">
              {currentLevel.question}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {currentLevel.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectOpt = idx === currentLevel.correctIndex;

              let btnStyle = 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200';
              if (isAnswered) {
                if (isCorrectOpt) {
                  btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold';
                } else if (isSelected && !isCorrectOpt) {
                  btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300 font-semibold';
                } else {
                  btnStyle = 'opacity-40 border-slate-800 text-slate-500';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between text-xs sm:text-sm ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </div>

                  {isAnswered && isCorrectOpt && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  {isAnswered && isSelected && !isCorrectOpt && (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Banner */}
          {isAnswered && (
            <div
              className={`p-4 rounded-xl border text-xs sm:text-sm animate-fade-in ${
                selectedOption === currentLevel.correctIndex
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 mb-1">
                {selectedOption === currentLevel.correctIndex ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>ถูกต้องยอดเยี่ยม! 🎉</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>ยังไม่ถูกต้องนะจ๊ะ 💡</span>
                  </>
                )}
              </div>
              <p className="text-slate-300 leading-relaxed">
                {currentLevel.explanation}
              </p>
            </div>
          )}

          {/* Action Button */}
          {isAnswered && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all"
              >
                <span>
                  {currentLevelIdx < PYTHON_LEVELS.length - 1 ? 'ด่านถัดไป' : 'ดูสรุปผลคะแนน'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Finished Screen */
        <div className="mt-8 py-6 text-center space-y-5">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-4xl shadow-xl">
            🏆
          </div>

          <div>
            <h4 className="text-2xl font-black text-white font-['Chakra_Petch']">
              ยินดีด้วย! คุณพิชิตภารกิจ Python Runner
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              ทำคะแนนได้ {score} จาก {PYTHON_LEVELS.length} ด่าน ({Math.round((score / PYTHON_LEVELS.length) * 100)}%)
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>ได้รับ +{200 + score * 30} XP สู่การเป็นเซียนไพทอน!</span>
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
