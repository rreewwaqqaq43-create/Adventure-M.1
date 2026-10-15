/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StudentProgress, Lesson } from '../../types';
import { BookMarked, CheckCircle2, ChevronRight, Award, Lightbulb } from 'lucide-react';

interface CompetencyBreakdownProps {
  progressList: StudentProgress[];
  lessons: Lesson[];
  onOpenLesson: (lesson: Lesson) => void;
}

export const CompetencyBreakdown: React.FC<CompetencyBreakdownProps> = ({
  progressList,
  lessons,
  onOpenLesson,
}) => {
  // Official สสวท. Standard Indicators for Grade 7 Computing Science
  const indicators = [
    {
      code: 'ว 4.2 ม.1/1',
      title: 'การออกแบบอัลกอริทึมและแนวคิดเชิงนามธรรม',
      desc: 'ออกแบบอัลกอริทึมที่ใช้แนวคิดเชิงนามธรรมเพื่อแก้ปัญหาหรืออธิบายการทำงานที่พบในชีวิตจริง',
      relatedChapters: [1, 2],
      color: 'from-amber-500 to-orange-500',
    },
    {
      code: 'ว 4.2 ม.1/2',
      title: 'การออกแบบและเขียนโปรแกรมอย่างง่าย (Scratch)',
      desc: 'ออกแบบและเขียนโปรแกรมอย่างง่ายเพื่อแก้ปัญหาทางคณิตศาสตร์หรือวิทยาศาสตร์ โดยใช้การวนซ้ำและการกำหนดเงื่อนไข',
      relatedChapters: [3, 4],
      color: 'from-indigo-500 to-cyan-500',
    },
    {
      code: 'ว 4.2 ม.1/3',
      title: 'การจัดการข้อมูลและเทคโนโลยีสารสนเทศ',
      desc: 'รวบรวมข้อมูล ปฐมภูมิ ประมวลผล ประเมินผล และนำเสนอข้อมูลสารสนเทศตามวัตถุประสงค์อย่างเป็นระบบ',
      relatedChapters: [1, 2, 6],
      color: 'from-emerald-500 to-teal-500',
    },
    {
      code: 'ว 4.2 ม.1/4',
      title: 'การใช้เทคโนโลยีอย่างปลอดภัยและมีจริยธรรม',
      desc: 'ใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย มีความรับผิดชอบ สร้างและแสดงสิทธิในการเผยแพร่ผลงานและเคารพลิขสิทธิ์',
      relatedChapters: [5, 6],
      color: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-lg text-white font-['Chakra_Petch']">
              การประเมินตามตัวชี้วัด สสวท. (Standard Indicators Breakdown)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            ติดตามระดับความรู้ความเข้าใจตามกลุ่มตัวชี้วัด สาระเทคโนโลยี (วิทยาการคำนวณ) ม.1
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {indicators.map((ind) => {
          // Calculate score based on related chapters
          const chapterScores = ind.relatedChapters.map((chNum) => {
            const prog = progressList.find((p) => p.lessonId === `lesson-${chNum}`);
            if (!prog) return 30;
            const g = prog.gameScore || 0;
            const q = prog.quizScore ? (prog.quizScore / 5) * 100 : 0;
            return Math.round((g + q) / 2) || 40;
          });
          const avgScore = Math.round(
            chapterScores.reduce((a, b) => a + b, 0) / chapterScores.length
          );

          let levelLabel = 'กำลังพัฒนา';
          let levelColor = 'text-slate-400';
          if (avgScore >= 80) {
            levelLabel = 'ดีเยี่ยม (Mastered)';
            levelColor = 'text-emerald-400';
          } else if (avgScore >= 60) {
            levelLabel = 'ผ่านเกณฑ์ (Proficient)';
            levelColor = 'text-amber-400';
          }

          return (
            <div
              key={ind.code}
              className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-800 text-amber-300 font-mono">
                    {ind.code}
                  </span>
                  <span className={`text-xs font-bold ${levelColor}`}>
                    {levelLabel} ({avgScore}%)
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white">{ind.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {ind.desc}
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-2 pt-1">
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${ind.color}`}
                    style={{ width: `${Math.min(100, avgScore)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>บทเรียนที่เกี่ยวข้อง: บทที่ {ind.relatedChapters.join(', ')}</span>
                  <div className="flex gap-1">
                    {ind.relatedChapters.map((chNum) => {
                      const lesson = lessons.find((l) => l.chapterNumber === chNum);
                      if (!lesson) return null;
                      return (
                        <button
                          key={chNum}
                          onClick={() => onOpenLesson(lesson)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        >
                          บทที่ {chNum} →
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
