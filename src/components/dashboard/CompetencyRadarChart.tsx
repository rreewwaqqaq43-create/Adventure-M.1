/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import { StudentProgress, Lesson } from '../../types';
import { Target, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';

interface CompetencyRadarChartProps {
  progressList: StudentProgress[];
  lessons: Lesson[];
}

export const CompetencyRadarChart: React.FC<CompetencyRadarChartProps> = ({
  progressList,
  lessons,
}) => {
  // Map 6 lessons to 5 core computing competencies (สสวท. ม.1)
  // 1. แนวคิดเชิงนามธรรม (Ch 1)
  // 2. ขั้นตอนวิธีและผังงาน (Ch 2)
  // 3. การเขียนโปรแกรม Scratch (Ch 3, 4)
  // 4. การจัดการข้อมูลและการคิดเชิงคำนวณ (Ch 1, 2, 4)
  // 5. ความปลอดภัยและจริยธรรมดิจิทัล (Ch 5, 6)

  const getChapterScorePercent = (chNum: number): number => {
    const prog = progressList.find((p) => p.lessonId === `lesson-${chNum}`);
    if (!prog) return 20; // baseline for beginner
    const game = prog.gameScore !== undefined ? Math.min(100, (prog.gameScore / 100) * 100) : 30;
    const quiz = prog.quizScore !== undefined ? Math.min(100, (prog.quizScore / 5) * 100) : 30;
    return Math.round((game + quiz) / 2);
  };

  const ch1 = getChapterScorePercent(1);
  const ch2 = getChapterScorePercent(2);
  const ch3 = getChapterScorePercent(3);
  const ch4 = getChapterScorePercent(4);
  const ch5 = getChapterScorePercent(5);
  const ch6 = getChapterScorePercent(6);

  const competencyData = [
    {
      subject: 'แนวคิดเชิงนามธรรม',
      score: ch1,
      standard: 'ว 4.2 ม.1/1',
      fullMark: 100,
    },
    {
      subject: 'ขั้นตอนวิธี & ผังงาน',
      score: ch2,
      standard: 'ว 4.2 ม.1/1',
      fullMark: 100,
    },
    {
      subject: 'ทักษะโค้ดดิ้ง Scratch',
      score: Math.round((ch3 + ch4) / 2),
      standard: 'ว 4.2 ม.1/2',
      fullMark: 100,
    },
    {
      subject: 'ตรรกะ & การวนซ้ำ',
      score: ch4,
      standard: 'ว 4.2 ม.1/2',
      fullMark: 100,
    },
    {
      subject: 'ความปลอดภัยไซเบอร์',
      score: ch5,
      standard: 'ว 4.2 ม.1/4',
      fullMark: 100,
    },
    {
      subject: 'จริยธรรม & ลิขสิทธิ์',
      score: ch6,
      standard: 'ว 4.2 ม.1/4',
      fullMark: 100,
    },
  ];

  // Calculate highest and lowest competency
  const sorted = [...competencyData].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  const overallAvg = Math.round(
    competencyData.reduce((acc, c) => acc + c.score, 0) / competencyData.length
  );

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-lg text-white font-['Chakra_Petch']">
              แผนภูมิสมรรถนะ 6 ด้าน (Competency Radar)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            ประเมินทักษะการเรียนรู้ตามตัวชี้วัดมาตรฐาน สสวท. กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">ระดับสมรรถนะรวม:</span>
          <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs">
            {overallAvg}% (
            {overallAvg >= 80
              ? 'ระดับดีเยี่ยม'
              : overallAvg >= 60
              ? 'ระดับดี'
              : overallAvg >= 40
              ? 'กำลังพัฒนา'
              : 'เริ่มต้น'}
            )
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Radar Chart */}
        <div className="lg:col-span-7 h-72 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={competencyData}>
              <PolarGrid stroke="#334155" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Prompt' }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: '#64748b', fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [`${val}%`, 'ระดับคะแนน']}
              />
              <Radar
                name="คะแนนสมรรถนะ"
                dataKey="score"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.45}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Competency Insights & Analysis */}
        <div className="lg:col-span-5 space-y-3.5">
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>จุดเด่นที่ทำได้ยอดเยี่ยม:</span>
            </div>
            <div className="text-sm font-semibold text-white">
              {strongest.subject} ({strongest.score}%)
            </div>
            <div className="text-xs text-slate-400">
              สอดคล้องตัวชี้วัด {strongest.standard} เข้าใจและประยุกต์ใช้ได้คล่องแคล่ว
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <TrendingUp className="w-4 h-4" />
              <span>ทักษะที่ควรฝึกฝนและทบทวน:</span>
            </div>
            <div className="text-sm font-semibold text-white">
              {weakest.subject} ({weakest.score}%)
            </div>
            <div className="text-xs text-slate-400">
              แนะนำให้เล่นมินิเกมซ้ำเพื่อเก็บแต้มและดูวิดีโอเสริมในหัวข้อนี้
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-slate-300 space-y-1">
            <div className="font-bold text-indigo-300 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>เกณฑ์การประเมิน สสวท.</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              คะแนนวิเคราะห์จากความถูกต้องของการตอบแบบทดสอบท้ายบท ความเร็ว และการพิชิตมินิเกมจำลองสถานการณ์จริง
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
