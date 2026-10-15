/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  Sparkles,
  Camera,
  RotateCcw
} from 'lucide-react';

interface Game4CyberDefenderProps {
  onComplete: (score: number, maxScore: number, xpEarned: number) => void;
}

interface CaseStudy {
  id: number;
  title: string;
  situation: string;
  type: 'PHISHING' | 'COPYRIGHT_OK' | 'CYBER_CRIME' | 'WEAK_PASSWORD' | 'FAKE_NEWS';
  correctDecision: 'SAFE' | 'DANGER' | 'ILLEGAL';
  lawReference: string;
  explanation: string;
}

const CASES: CaseStudy[] = [
  {
    id: 1,
    title: 'ข้อความ SMS ปริศนาพร้อมลิงก์',
    situation: 'คุณได้รับ SMS จากเบอร์แปลกหน้า: "ยินดีด้วย คุณคือผู้โชคดีได้รับเงินรางวัล 500,000 บาท กรุณากดลิงก์ bit.ly/bank-reward เพื่อยืนยัน OTP ภายใน 10 นาที"',
    type: 'PHISHING',
    correctDecision: 'DANGER',
    lawReference: 'การหลอกลวงทางไซเบอร์ (Phishing Scam) เสี่ยงโดนขโมยบัญชีธนาคารและข้อมูลส่วนบุคคล',
    explanation: 'ข้อความลักษณะนี้เป็น Phishing มุ่งขโมยรหัส OTP และข้อมูลสำคัญ ห้ามกดลิงก์และห้ามส่ง OTP ให้ผู้อื่นเด็ดขาด',
  },
  {
    id: 2,
    title: 'การนำภาพประกอบมาทำรายงานส่งครู',
    situation: 'นักเรียนค้นหาภาพจากอินเทอร์เน็ต โดยเลือกใช้ภาพที่มีสัญญาอนุญาต Creative Commons (CC-BY) พร้อมเขียนระบุแหล่งที่มาและชื่อผู้สร้างสรรค์อย่างถูกต้อง',
    type: 'COPYRIGHT_OK',
    correctDecision: 'SAFE',
    lawReference: 'พ.ร.บ. ลิขสิทธิ์ และสัญญาอนุญาต Creative Commons',
    explanation: 'การใช้ภาพ CC-BY พร้อมให้เกียรติระบุชื่อเจ้าของผลงานเป็นการใช้ที่ถูกต้องตามกฎหมายและมีจริยธรรมดิจิทัล',
  },
  {
    id: 3,
    title: 'แกล้งโพสต์เฟซบุ๊กเมื่อเพื่อนลืมออกจากระบบ',
    situation: 'ในคาบเรียนคอมพิวเตอร์ เพื่อนสนิทลืม Logout ออกจากบัญชีโซเชียลมีเดีย จึงแอบพิมพ์ข้อความแกล้งเพื่อนและกดโพสต์สาธารณะ',
    type: 'CYBER_CRIME',
    correctDecision: 'ILLEGAL',
    lawReference: 'พ.ร.บ. ว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ พ.ศ. 2550 และที่แก้ไขเพิ่มเติม (มาตรา 5 เข้าถึงระบบโดยมิชอบ)',
    explanation: 'การแอบเข้าถึงบัญชีของผู้อื่นโดยไม่ได้รับอนุญาตและโพสต์ข้อความ ถือเป็นความผิดตามกฎหมาย แม้จะเป็นเพื่อนสนิทกันก็ตาม',
  },
  {
    id: 4,
    title: 'การตั้งรหัสผ่านและการแบ่งปัน',
    situation: 'ตั้งรหัสผ่านเข้าเล่นเกมและอีเมลเป็น "123456" เหมือนกันทุกแพลตฟอร์มเพื่อให้จำง่าย และบอกรหัสผ่านให้เพื่อนในกลุ่มทุกคนรู้เพื่อช่วยกันล็อกอิน',
    type: 'WEAK_PASSWORD',
    correctDecision: 'DANGER',
    lawReference: 'หลักการความปลอดภัยด้านอัตลักษณ์ดิจิทัล (Digital Identity Security)',
    explanation: 'รหัสผ่าน 123456 เป็นรหัสที่ถูกแฮกง่ายที่สุดในโลก และการแชร์รหัสผ่านให้ผู้อื่นจะทำให้สูญเสียการควบคุมบัญชีส่วนตัว',
  },
  {
    id: 5,
    title: 'ข่าวแชร์ในกลุ่มแชตครอบครัว',
    situation: 'มีข้อความส่งต่อมาว่า: "ด่วนที่สุด! น้ำต้มใบกะเพราผสมมะนาวสามารถรักษาโรคร้ายแรงหายขาดได้ใน 24 ชั่วโมง แชร์ด่วนก่อนโดนลบ"',
    type: 'FAKE_NEWS',
    correctDecision: 'DANGER',
    lawReference: 'พ.ร.บ. คอมพิวเตอร์ฯ มาตรา 14 (นำเข้าข้อมูลเท็จสู่ระบบคอมพิวเตอร์ที่อาจก่อให้เกิดความเสียหาย)',
    explanation: 'เป็นข่าวปลอม (Fake News) ด้านสุขภาพ ต้องตรวจสอบกับศูนย์ต่อต้านข่าวปลอมหรือกระทรวงสาธารณสุขก่อน และไม่ควรแชร์ต่อ',
  },
];

export const Game4CyberDefender: React.FC<Game4CyberDefenderProps> = ({ onComplete }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedDecision, setSelectedDecision] = useState<'SAFE' | 'DANGER' | 'ILLEGAL' | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const currentCase = CASES[currentIdx];

  const handleDecision = (decision: 'SAFE' | 'DANGER' | 'ILLEGAL') => {
    if (isAnswered) return;
    setSelectedDecision(decision);
    setIsAnswered(true);

    if (decision === currentCase.correctDecision) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < CASES.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedDecision(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      const totalScore = score + (selectedDecision === currentCase.correctDecision ? 0 : 0);
      const xpEarned = totalScore * 30 + 50;
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      onComplete(totalScore, CASES.length, xpEarned);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setScore(0);
    setSelectedDecision(null);
    setIsAnswered(false);
    setIsFinished(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 max-w-3xl mx-auto shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white font-['Chakra_Petch']">
              มินิเกม: ปราการไซเบอร์และจริยธรรมดิจิทัล (Cyber Defender)
            </h3>
            <p className="text-xs text-slate-400">
              วิเคราะห์กรณีศึกษา 5 เหตุการณ์ด้านความปลอดภัย ลิขสิทธิ์ และ พ.ร.บ. คอมพิวเตอร์
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-400">ระดับโล่ป้องกัน</div>
          <div className="text-xl font-black text-rose-400 font-['Chakra_Petch']">
            {score} / {CASES.length}
          </div>
        </div>
      </div>

      {!isFinished ? (
        <div className="mt-6 space-y-6">
          {/* Progress */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>กรณีศึกษาที่ {currentIdx + 1} จาก {CASES.length}</span>
            <span>ความก้าวหน้า {Math.round(((currentIdx + 1) / CASES.length) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-rose-500 h-full transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / CASES.length) * 100}%` }}
            />
          </div>

          {/* Case Card */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20">
                🚨 {currentCase.title}
              </span>
              <span className="text-[11px] text-slate-500">มัธยมศึกษาปีที่ 1</span>
            </div>
            <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-medium">
              "{currentCase.situation}"
            </p>
          </div>

          {/* Action Decision Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              disabled={isAnswered}
              onClick={() => handleDecision('SAFE')}
              className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                isAnswered
                  ? currentCase.correctDecision === 'SAFE'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                    : selectedDecision === 'SAFE'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                    : 'opacity-40 border-slate-800'
                  : 'bg-slate-950 hover:bg-emerald-950/40 border-slate-800 hover:border-emerald-500/50 text-slate-200'
              }`}
            >
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <div className="text-sm font-bold">1. ปลอดภัย / ทำได้</div>
              <div className="text-[11px] text-slate-400">ถูกต้องตามหลักการ</div>
            </button>

            <button
              disabled={isAnswered}
              onClick={() => handleDecision('DANGER')}
              className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                isAnswered
                  ? currentCase.correctDecision === 'DANGER'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : selectedDecision === 'DANGER'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                    : 'opacity-40 border-slate-800'
                  : 'bg-slate-950 hover:bg-amber-950/40 border-slate-800 hover:border-amber-500/50 text-slate-200'
              }`}
            >
              <AlertTriangle className="w-6 h-6 text-amber-400" />
              <div className="text-sm font-bold">2. มีความเสี่ยง / หลอกลวง</div>
              <div className="text-[11px] text-slate-400">เสี่ยงถูกแฮก หรือ ข่าวปลอม</div>
            </button>

            <button
              disabled={isAnswered}
              onClick={() => handleDecision('ILLEGAL')}
              className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                isAnswered
                  ? currentCase.correctDecision === 'ILLEGAL'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                    : selectedDecision === 'ILLEGAL'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                    : 'opacity-40 border-slate-800'
                  : 'bg-slate-950 hover:bg-rose-950/40 border-slate-800 hover:border-rose-500/50 text-slate-200'
              }`}
            >
              <ShieldAlert className="w-6 h-6 text-rose-400" />
              <div className="text-sm font-bold">3. ผิดกฎหมาย พ.ร.บ.</div>
              <div className="text-[11px] text-slate-400">ละเมิดสิทธิ์ / ผิด พ.ร.บ.คอมฯ</div>
            </button>
          </div>

          {/* Feedback & Law Explanation */}
          {isAnswered && (
            <div
              className={`p-4 rounded-xl border text-sm space-y-2 ${
                selectedDecision === currentCase.correctDecision
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {selectedDecision === currentCase.correctDecision ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>คำวินิจฉัยถูกต้อง! คุณรู้ทันภัยไซเบอร์</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-400" />
                    <span>คำวินิจฉัยยังไม่ถูกต้อง ระวังภัยในจุดนี้</span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentCase.explanation}
              </p>
              <div className="text-[11px] text-amber-300 pt-1 border-t border-slate-800">
                ⚖️ <strong>ข้อกฎหมาย/หลักการอ้างอิง:</strong> {currentCase.lawReference}
              </div>
            </div>
          )}

          {/* Next Button */}
          {isAnswered && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md hover:scale-105"
              >
                {currentIdx < CASES.length - 1 ? 'กรณีศึกษาถัดไป →' : 'ดูผลคะแนนรวม'}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Finished */
        <div className="py-10 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <Award className="w-9 h-9" />
          </div>
          <h4 className="text-2xl font-black text-white font-['Chakra_Petch']">
            ภารกิจปกป้องไซเบอร์เสร็จสิ้น!
          </h4>
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            คุณมีความรู้ความเข้าใจเรื่องการใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย มีจริยธรรม และถูกกฎหมาย
          </p>

          <div className="inline-flex items-center gap-6 px-6 py-3 bg-slate-950 rounded-2xl border border-slate-800">
            <div>
              <div className="text-xs text-slate-400">เกราะป้องกัน</div>
              <div className="text-2xl font-black text-rose-400">{score} / {CASES.length}</div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <div className="text-xs text-slate-400">XP ที่ได้รับ</div>
              <div className="text-2xl font-black text-emerald-400">+{score * 30 + 50} XP</div>
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
