/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { StudentProgress, Lesson } from '../../types';
import { BarChart3, Gamepad2, FileCheck2 } from 'lucide-react';

interface ScoreComparisonChartProps {
  progressList: StudentProgress[];
  lessons: Lesson[];
}

export const ScoreComparisonChart: React.FC<ScoreComparisonChartProps> = ({
  progressList,
  lessons,
}) => {
  const chartData = lessons.map((lesson) => {
    const prog = progressList.find((p) => p.lessonId === lesson.id);
    const rawGame = prog?.gameScore || 0;
    const rawQuiz = prog?.quizScore || 0;
    // Standardize to 100%
    const maxQuestions = lesson.quiz?.questions?.length || 5;
    const quizPercent = Math.min(100, Math.round((rawQuiz / maxQuestions) * 100));
    const gamePercent = Math.min(100, rawGame);

    return {
      chapter: `บทที่ ${lesson.chapterNumber}`,
      title: lesson.title,
      gameScore: gamePercent,
      quizScore: quizPercent,
    };
  });

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-lg text-white font-['Chakra_Petch']">
            เปรียบเทียบคะแนน: มินิเกม vs แบบทดสอบ (Score Comparison)
          </h3>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-cyan-400 font-medium">
            <span className="w-3 h-3 rounded bg-cyan-500 inline-block" />
            <span>มินิเกม (% เต็ม 100)</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400 font-medium">
            <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
            <span>แบบทดสอบ (% เต็ม 100)</span>
          </div>
        </div>
      </div>

      <div className="h-72 sm:h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="chapter"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Prompt' }}
            />
            <YAxis
              stroke="#64748b"
              domain={[0, 100]}
              tick={{ fill: '#64748b', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '12px',
                color: '#f8fafc',
                fontSize: '12px',
                fontFamily: 'Prompt',
              }}
              formatter={(val: any, name: any) => [
                `${val}%`,
                name === 'gameScore' ? 'คะแนนมินิเกม' : 'คะแนนแบบทดสอบ',
              ]}
              labelFormatter={(label, payload) => {
                const item = payload?.[0]?.payload;
                return `${label}: ${item?.title || ''}`;
              }}
            />
            <Bar
              dataKey="gameScore"
              name="gameScore"
              fill="#06b6d4"
              radius={[6, 6, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey="quizScore"
              name="quizScore"
              fill="#f59e0b"
              radius={[6, 6, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-400">
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2.5">
          <Gamepad2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>มินิเกมเน้นประเมินการแก้ปัญหาเชิงปฏิบัติการและการตัดสินใจในสถานการณ์จำลอง</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2.5">
          <FileCheck2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>แบบทดสอบเน้นวัดความเข้าใจในหลักการ ความรู้รวบยอด และนิยามตามตำราเรียน สสวท.</span>
        </div>
      </div>
    </div>
  );
};
