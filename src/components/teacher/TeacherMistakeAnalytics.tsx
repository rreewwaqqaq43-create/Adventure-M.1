/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StorageService, QuizAttemptRecord } from '../../services/storage';
import { QuestionMistakeStat, User } from '../../types';
import { feedback } from '../../utils/feedback';
import {
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Users,
  Search,
  Filter,
  BookOpen,
  Sparkles,
  TrendingDown,
  Info,
  ChevronRight,
  Eye,
  Download,
  FileSpreadsheet
} from 'lucide-react';

interface TeacherMistakeAnalyticsProps {
  teacherUser: User;
}

export const TeacherMistakeAnalytics: React.FC<TeacherMistakeAnalyticsProps> = ({
  teacherUser,
}) => {
  const [selectedChapter, setSelectedChapter] = useState<number | 'all'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'pre_test' | 'post_test'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  const stats: QuestionMistakeStat[] = StorageService.getMistakeAnalytics();
  const allAttempts: QuizAttemptRecord[] = StorageService.getQuizAttempts();

  // Filtered stats
  const filteredStats = stats.filter((s) => {
    const matchChapter = selectedChapter === 'all' || s.chapterNumber === selectedChapter;
    const matchType = selectedType === 'all' || s.quizType === selectedType;
    const matchSearch =
      s.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.mostCommonWrongAnswer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchChapter && matchType && matchSearch;
  });

  // Calculate high-level mistake overview
  const totalWrongAnswers = stats.reduce((acc, s) => acc + s.wrongCount, 0);
  const totalAttemptsCount = stats.reduce((acc, s) => acc + s.totalAttempts, 0);
  const overallWrongRate =
    totalAttemptsCount > 0 ? Math.round((totalWrongAnswers / totalAttemptsCount) * 100) : 0;
  const criticalQuestionsCount = stats.filter((s) => s.wrongPercentage >= 50).length;

  // Selected question detail
  const activeQuestionStat = stats.find((s) => s.questionId === selectedQuestionId);

  // Find all student attempts for this question
  const questionAttempts = selectedQuestionId
    ? allAttempts
        .map((att) => {
          const ans = att.answers.find((a) => a.questionId === selectedQuestionId);
          if (!ans) return null;
          return {
            userName: att.userName,
            userId: att.userId,
            isCorrect: ans.isCorrect,
            selectedText: ans.selectedText,
            completedAt: att.completedAt,
            quizType: att.quizType,
          };
        })
        .filter(Boolean)
    : [];

  return (
    <div className="space-y-6">
      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-rose-500/15 text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">ข้อที่นักเรียนผิดบ่อย (≥ 50%)</div>
            <div className="text-2xl font-black text-rose-400 font-['Chakra_Petch']">
              {criticalQuestionsCount} ข้อ
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-500/15 text-amber-400">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">อัตราการตอบผิดเฉลี่ยรวม</div>
            <div className="text-2xl font-black text-amber-400 font-['Chakra_Petch']">
              {overallWrongRate}%
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-500/15 text-indigo-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">แบบทดสอบที่บันทึกข้อมูล</div>
            <div className="text-2xl font-black text-white font-['Chakra_Petch']">
              {allAttempts.length} ครั้ง
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Chapter filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setSelectedChapter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
              selectedChapter === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ทุกบทเรียน
          </button>
          {[1, 2, 3, 4, 5, 6, 7].map((ch) => (
            <button
              key={ch}
              onClick={() => setSelectedChapter(ch)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                selectedChapter === ch
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {ch === 7 ? 'บทที่ 7 (สอบรวม)' : `บทที่ ${ch}`}
            </button>
          ))}
        </div>

        {/* Type filter & search & Export */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-2.5 py-1.5 rounded-lg font-medium ${
                selectedType === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setSelectedType('pre_test')}
              className={`px-2.5 py-1.5 rounded-lg font-medium ${
                selectedType === 'pre_test'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ก่อนเรียน
            </button>
            <button
              onClick={() => setSelectedType('post_test')}
              className={`px-2.5 py-1.5 rounded-lg font-medium ${
                selectedType === 'post_test'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              หลังเรียน
            </button>
          </div>

          <div className="relative flex-1 md:w-48">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาข้อคำถาม..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Export Mistake Data button */}
          <button
            onClick={() => {
              StorageService.exportMistakesAsCsv();
              feedback.save('ส่งออกรายงานข้อผิดพลาด CSV สำเร็จ', 'mistake_analytics_report.csv');
            }}
            title="ดาวน์โหลดรายงานสรุปข้อที่นักเรียนตอบผิดบ่อยเป็นไฟล์ CSV / Excel"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
            <span>ส่งออก CSV</span>
          </button>
        </div>
      </div>

      {/* Main Content: Mistakes List & Detail Modal / Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Questions List sorted by error rate */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>รายการข้อสอบเรียงตามอัตราการตอบผิดสูงสุด ({filteredStats.length} ข้อ)</span>
            <span>คลิกที่ข้อเพื่อดูรายชื่อนักเรียนที่ตอบผิด</span>
          </div>

          {filteredStats.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-sm">
              ไม่พบข้อสอบที่ตรงกับเงื่อนไขการค้นหา
            </div>
          ) : (
            filteredStats.map((item) => {
              const isSelected = selectedQuestionId === item.questionId;
              const isHighMistake = item.wrongPercentage >= 50;

              return (
                <div
                  key={item.questionId}
                  onClick={() => setSelectedQuestionId(item.questionId)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-left space-y-3 ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500 ring-1 ring-amber-500/40 shadow-xl'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-[11px] font-bold text-slate-300">
                        บทที่ {item.chapterNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          item.quizType === 'pre_test'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {item.quizType === 'pre_test' ? 'ก่อนเรียน' : 'หลังเรียน'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                          isHighMistake
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        ตอบผิด {item.wrongPercentage}% ({item.wrongCount}/{item.totalAttempts} คน)
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-white leading-relaxed">
                    {item.questionText}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/80">
                    <div className="p-2 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-300">
                      <span className="text-[10px] text-slate-400 block">
                        คำตอบที่เด็กมักเข้าใจผิดมากที่สุด:
                      </span>
                      <span className="font-semibold text-rose-200 mt-0.5 block">
                        ❌ {item.mostCommonWrongAnswer}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
                      <span className="text-[10px] text-slate-400 block">
                        คำตอบที่ถูกต้องตามหลักสูตร:
                      </span>
                      <span className="font-semibold text-emerald-200 mt-0.5 block">
                        ✓ {item.correctAnswerText}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>📖 อ้างอิง: {item.textbookReference}</span>
                    <span className="text-amber-400 hover:underline flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>ดูรายละเอียดนักเรียน</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Question Detail & Student Breakdown */}
        <div className="space-y-4">
          {activeQuestionStat ? (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 sticky top-20 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h4 className="font-bold text-sm text-white font-['Chakra_Petch']">
                    วิเคราะห์เจาะลึกข้อที่นักเรียนผิด
                  </h4>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  บทที่ {activeQuestionStat.chapterNumber}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block font-semibold">ข้อคำถาม:</span>
                <p className="text-xs font-bold text-slate-100 mt-1 leading-relaxed">
                  {activeQuestionStat.questionText}
                </p>
              </div>

              {/* Teaching guidance recommendation */}
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1 text-xs">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>คำแนะนำการสอนซ่อมเสริมสำหรับครู:</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {activeQuestionStat.explanation || 'เน้นย้ำความแตกต่างระหว่างตัวแปรและเงื่อนไขตามตัวอย่างในหนังสือ สสวท.'}
                </p>
              </div>

              {/* Student responses log */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>รายชื่อนักเรียนที่ทำข้อนี้ ({questionAttempts.length} คน)</span>
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                  {questionAttempts.length === 0 ? (
                    <div className="text-xs text-slate-500 text-center py-4">
                      ยังไม่มีประวัติการส่งคำตอบของนักเรียนในข้อนี้
                    </div>
                  ) : (
                    questionAttempts.map((stu: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                          stu.isCorrect
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : 'bg-rose-950/30 border-rose-500/30'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-200 flex items-center gap-1.5">
                            {stu.isCorrect ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            )}
                            <span>{stu.userName}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            ตอบ: <span className={stu.isCorrect ? 'text-emerald-300' : 'text-rose-300'}>{stu.selectedText}</span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            stu.isCorrect
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {stu.isCorrect ? 'ถูก' : 'ผิด'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs space-y-2">
              <Info className="w-8 h-8 text-slate-500 mx-auto" />
              <p>เลือกคลิกข้อคำถามทางด้านซ้ายเพื่อดูว่านักเรียนแต่ละคนตอบอะไรและเข้าใจผิดตรงจุดไหน</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
