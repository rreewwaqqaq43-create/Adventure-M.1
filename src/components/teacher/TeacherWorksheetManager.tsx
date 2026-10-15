/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Worksheet, WorksheetSubmission, WorksheetTask, User } from '../../types';
import { StorageService } from '../../services/storage';
import {
  FileText,
  CheckCircle2,
  Clock,
  Save,
  Plus,
  Trash2,
  UserCheck,
  Award,
  AlertCircle,
  Eye,
  Send,
  Sparkles,
  MoveUp,
  MoveDown,
  RotateCcw
} from 'lucide-react';

interface TeacherWorksheetManagerProps {
  teacherUser: User;
}

const getDefaultWorksheet = (chapterNumber: number): Worksheet => ({
  id: `ws-${chapterNumber}`,
  chapterNumber,
  title: `ใบงานประจำบทเรียนที่ ${chapterNumber}: การประยุกต์ใช้วิทยาการคำนวณ`,
  description: `แบบฝึกหัดและการประยุกต์ใช้ความรู้ประจำบทที่ ${chapterNumber} ตามมาตรฐานหลักสูตร สสวท. ม.1`,
  instructions: 'ให้นักเรียนศึกษาโจทย์และสถานการณ์ที่กำหนด แล้วตอบคำถามให้ถูกต้อง ครบถ้วน พร้อมให้เหตุผลประกอบอย่างเป็นระบบ',
  textbookRef: `หนังสือ สสวท. ม.1 บทที่ ${chapterNumber}`,
  maxScore: 10,
  dueDate: '2026-06-30',
  tasks: [
    {
      id: `task-${chapterNumber}-1`,
      question: `ข้อที่ 1: อธิบายหลักการสำคัญและยกตัวอย่างการนำความรู้ในบทที่ ${chapterNumber} ไปประยุกต์ใช้ในชีวิตประจำวันอย่างน้อย 2 ตัวอย่าง`,
      type: 'essay',
      maxScore: 5,
      hint: 'พิจารณาสถานการณ์จริงใกล้ตัว เช่น การวางแผนขั้นตอน หรือการจัดการข้อมูล',
      sampleAnswer: 'คำตอบที่ถูกต้องควรระบุสถานการณ์ เหตุผล และขั้นตอนการประยุกต์ใช้จริงอย่างเป็นรูปธรรม',
    },
    {
      id: `task-${chapterNumber}-2`,
      question: `ข้อที่ 2: วิเคราะห์สถานการณ์และอธิบายขั้นตอนการแก้ปัญหาตามกระบวนการวิทยาการคำนวณ`,
      type: 'essay',
      maxScore: 5,
      hint: 'อ้างอิงเนื้อหา สาระสำคัญ และแบบฝึกหัดในหนังสือ สสวท. ม.1',
      sampleAnswer: 'คำตอบควรแสดงถึงลำดับขั้นตอนการคิดที่เป็นระบบและการตัดสินใจจากข้อมูลที่น่าเชื่อถือ',
    },
  ],
});

export const TeacherWorksheetManager: React.FC<TeacherWorksheetManagerProps> = ({
  teacherUser,
}) => {
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'edit' | 'submissions'>('edit');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const currentWorksheet = React.useMemo(() => {
    const list = StorageService.getWorksheets();
    let ws = list.find((w) => w.chapterNumber === selectedChapter);
    if (!ws) {
      ws = getDefaultWorksheet(selectedChapter);
      StorageService.updateWorksheet(ws);
    }
    return ws;
  }, [selectedChapter, refreshTrigger]);

  const [worksheetForm, setWorksheetForm] = useState<Worksheet>(currentWorksheet);

  React.useEffect(() => {
    setWorksheetForm(currentWorksheet);
  }, [currentWorksheet]);

  // Submissions for this worksheet
  const currentSubmissions = React.useMemo(() => {
    const all = StorageService.getWorksheetSubmissions();
    return all.filter(
      (s) => s.worksheetId === currentWorksheet.id || s.chapterNumber === selectedChapter
    );
  }, [currentWorksheet.id, selectedChapter, refreshTrigger]);

  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  // Active submission
  const activeSubmission = React.useMemo(() => {
    if (!selectedSubmissionId) return currentSubmissions[0] || null;
    return currentSubmissions.find((s) => s.id === selectedSubmissionId) || currentSubmissions[0] || null;
  }, [currentSubmissions, selectedSubmissionId]);

  const [gradeScore, setGradeScore] = useState<number>(0);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');

  React.useEffect(() => {
    if (activeSubmission) {
      setGradeScore(activeSubmission.score || 0);
      setGradeFeedback(activeSubmission.feedback || '');
    }
  }, [activeSubmission?.id]);

  const handleSelectChapter = (chNum: number) => {
    setSelectedChapter(chNum);
    setSelectedSubmissionId(null);
    setFeedbackNotice(null);
  };

  const handleSelectSubmission = (sub: WorksheetSubmission) => {
    setSelectedSubmissionId(sub.id);
    setGradeScore(sub.score || 0);
    setGradeFeedback(sub.feedback || '');
  };

  const handleSaveWorksheet = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.updateWorksheet(worksheetForm);
    setRefreshTrigger((prev) => prev + 1);
    setFeedbackNotice(`บันทึกใบงานบทเรียนที่ ${worksheetForm.chapterNumber} สำเร็จเรียบร้อย!`);
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  const handleResetWorksheet = () => {
    if (window.confirm('คุณครูต้องการคืนค่าใบงานบทนี้กลับเป็นเนื้อหามาตรฐาน สสวท. หรือไม่?')) {
      const def = getDefaultWorksheet(selectedChapter);
      setWorksheetForm(def);
      StorageService.updateWorksheet(def);
      setRefreshTrigger((prev) => prev + 1);
      setFeedbackNotice(`คืนค่าใบงานบทเรียนที่ ${selectedChapter} ตามเกณฑ์ สสวท. เรียบร้อย!`);
      setTimeout(() => setFeedbackNotice(null), 3000);
    }
  };

  const handleAddTask = () => {
    const newTask: WorksheetTask = {
      id: `task-${Date.now()}`,
      question: 'โจทย์ภารกิจข้อใหม่',
      type: 'essay',
      maxScore: 5,
      hint: 'คำใบ้ประกอบการทำใบงานสำหรับนักเรียน',
      sampleAnswer: 'แนวทางการตอบตามเกณฑ์ สสวท.',
    };
    setWorksheetForm((prev) => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }));
  };

  const handleMoveTaskUp = (idx: number) => {
    if (idx === 0) return;
    setWorksheetForm((prev) => {
      const tasks = [...prev.tasks];
      const temp = tasks[idx - 1];
      tasks[idx - 1] = tasks[idx];
      tasks[idx] = temp;
      return { ...prev, tasks };
    });
  };

  const handleMoveTaskDown = (idx: number) => {
    if (idx >= worksheetForm.tasks.length - 1) return;
    setWorksheetForm((prev) => {
      const tasks = [...prev.tasks];
      const temp = tasks[idx + 1];
      tasks[idx + 1] = tasks[idx];
      tasks[idx] = temp;
      return { ...prev, tasks };
    });
  };

  const handleUpdateTask = (taskIdx: number, updated: Partial<WorksheetTask>) => {
    setWorksheetForm((prev) => {
      const tasks = [...prev.tasks];
      tasks[taskIdx] = { ...tasks[taskIdx], ...updated };
      return { ...prev, tasks };
    });
  };

  const handleDeleteTask = (taskIdx: number) => {
    if (worksheetForm.tasks.length <= 1) {
      alert('ใบงานต้องมีคำถามอย่างน้อย 1 ข้อ');
      return;
    }
    setWorksheetForm((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== taskIdx),
    }));
  };

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission) return;

    StorageService.gradeWorksheet(
      activeSubmission.id,
      Number(gradeScore),
      gradeFeedback,
      teacherUser.name
    );

    setRefreshTrigger((prev) => prev + 1);
    setFeedbackNotice(`บันทึกผลการตรวจของ ${activeSubmission.studentName} สำเร็จเรียบร้อย!`);
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Chapter Selector & Tab Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
          {[1, 2, 3, 4, 5, 6].map((ch) => (
            <button
              key={ch}
              onClick={() => handleSelectChapter(ch)}
              className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                selectedChapter === ch
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ใบงานบทที่ {ch}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'edit'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>แก้ไขข้อคำถามในใบงาน</span>
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'submissions'
                ? 'bg-emerald-600 text-white shadow font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>ตรวจและให้คะแนน ({currentSubmissions.length})</span>
          </button>
        </div>
      </div>

      {feedbackNotice && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-emerald-300 text-xs font-semibold shadow-lg animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* TAB 1: EDIT WORKSHEET SPECIFICATIONS */}
      {activeTab === 'edit' && (
        <form onSubmit={handleSaveWorksheet} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
            <div>
              <h3 className="font-bold text-lg text-white font-['Chakra_Petch']">
                แก้ไขใบงานเก็บคะแนน บทที่ {worksheetForm.chapterNumber}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                ออกแบบโจทย์ คำชี้แจง และเกณฑ์คะแนนตามแบบฝึกหัด สสวท. ม.1
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetWorksheet}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
                title="คืนค่ามาตรฐาน สสวท."
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>คืนค่ามาตรฐาน</span>
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกใบงาน</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                ชื่อใบงาน
              </label>
              <input
                type="text"
                value={worksheetForm.title}
                onChange={(e) => setWorksheetForm({ ...worksheetForm, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                คะแนนเต็มรวม (Max Score)
              </label>
              <input
                type="number"
                value={worksheetForm.maxScore}
                onChange={(e) => setWorksheetForm({ ...worksheetForm, maxScore: Number(e.target.value) || 20 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              คำชี้แจงสำหรับนักเรียน (Instructions)
            </label>
            <textarea
              rows={2}
              value={worksheetForm.instructions}
              onChange={(e) => setWorksheetForm({ ...worksheetForm, instructions: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>

          {/* Worksheet Tasks List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                รายการข้อคำถาม/ภารกิจในใบงาน ({worksheetForm.tasks.length} ข้อ):
              </span>
              <button
                type="button"
                onClick={handleAddTask}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มข้อในใบงาน</span>
              </button>
            </div>

            {worksheetForm.tasks.map((task, tIdx) => (
              <div
                key={task.id || tIdx}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center">
                      {tIdx + 1}
                    </span>
                    <span className="text-xs font-bold text-white">ข้อที่ {tIdx + 1}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400">คะแนนเต็ม:</span>
                      <input
                        type="number"
                        value={task.maxScore}
                        onChange={(e) => handleUpdateTask(tIdx, { maxScore: Number(e.target.value) || 5 })}
                        className="w-14 px-2 py-0.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-amber-400 font-bold text-center"
                      />
                    </div>

                    <div className="flex items-center gap-0.5 border-l border-slate-800 pl-2">
                      <button
                        type="button"
                        disabled={tIdx === 0}
                        onClick={() => handleMoveTaskUp(tIdx)}
                        className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                        title="เลื่อนข้อขึ้น"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={tIdx === worksheetForm.tasks.length - 1}
                        onClick={() => handleMoveTaskDown(tIdx)}
                        className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                        title="เลื่อนข้อลง"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {worksheetForm.tasks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(tIdx)}
                        className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 ml-1 p-1 hover:bg-rose-500/10 rounded"
                        title="ลบข้อนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    โจทย์คำถามหรือสถานการณ์
                  </label>
                  <textarea
                    rows={2}
                    value={task.question}
                    onChange={(e) => handleUpdateTask(tIdx, { question: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      คำใบ้หรือข้อแนะนำ (Hint)
                    </label>
                    <input
                      type="text"
                      value={task.hint || ''}
                      onChange={(e) => handleUpdateTask(tIdx, { hint: e.target.value })}
                      placeholder="เช่น อ้างอิงหนังสือ สสวท. ม.1 หน้า 15"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      แนวคำตอบที่สมบูรณ์ (Sample Answer)
                    </label>
                    <input
                      type="text"
                      value={task.sampleAnswer || ''}
                      onChange={(e) => handleUpdateTask(tIdx, { sampleAnswer: e.target.value })}
                      placeholder="แนวคำตอบเพื่อใช้ตรวจ"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกใบงาน</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: VIEW SUBMISSIONS & GRADE WORK */}
      {activeTab === 'submissions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submissions List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>รายชื่อนักเรียนที่ส่งใบงาน ({currentSubmissions.length} คน)</span>
            </div>

            {currentSubmissions.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-sm">
                ยังไม่มีนักเรียนส่งใบงานบทนี้
              </div>
            ) : (
              currentSubmissions.map((sub) => {
                const isSelected = sub.id === selectedSubmissionId;
                const isGraded = sub.gradedAt !== undefined && sub.score !== undefined;

                return (
                  <div
                    key={sub.id}
                    onClick={() => handleSelectSubmission(sub)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-emerald-500 ring-1 ring-emerald-500/40 shadow-lg'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-white">
                        {sub.studentName || 'นักเรียน ม.1'}
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isGraded
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {isGraded ? `ตรวจแล้ว (${sub.score}/${currentWorksheet.maxScore})` : 'รอตรวจ'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>ส่งเมื่อ: {new Date(sub.submittedAt).toLocaleDateString('th-TH')}</span>
                      <span className="text-emerald-400 font-medium">ตรวจใบงาน →</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Submission Details & Grading Panel */}
          <div className="lg:col-span-2">
            {activeSubmission ? (
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h4 className="font-bold text-base text-white font-['Chakra_Petch']">
                      ตรวจใบงาน: {activeSubmission.studentName}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {currentWorksheet.title} (ส่งเมื่อ {new Date(activeSubmission.submittedAt).toLocaleString('th-TH')})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">สถานะ: </span>
                    <span className="text-xs font-bold text-emerald-400">
                      {activeSubmission.gradedAt ? 'ตรวจแล้ว' : 'ยังไม่ได้ตรวจ'}
                    </span>
                  </div>
                </div>

                {/* Answers List */}
                <div className="space-y-4">
                  {currentWorksheet.tasks.map((task, tIdx) => {
                    const studentAns = activeSubmission.answers[task.id] || 'ยังไม่มีคำตอบ';

                    return (
                      <div key={task.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                          <span>ข้อที่ {tIdx + 1}: {task.question}</span>
                          <span className="text-amber-400">เต็ม {task.maxScore} คะแนน</span>
                        </div>

                        {/* Student Answer */}
                        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 whitespace-pre-wrap leading-relaxed">
                          <span className="text-[10px] text-slate-400 block mb-1 font-semibold">
                            คำตอบของนักเรียน:
                          </span>
                          {studentAns}
                        </div>

                        {/* Teacher's sample reference */}
                        {task.sampleAnswer && (
                          <div className="text-[11px] text-slate-400 p-2 rounded bg-slate-900/40 border border-slate-800/80">
                            💡 <strong>แนวคำตอบอ้างอิง:</strong> {task.sampleAnswer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Grading Form */}
                <form onSubmit={handleGradeSubmit} className="p-4 bg-slate-950 border border-emerald-500/30 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                    <Award className="w-4 h-4" />
                    <span>บันทึกคะแนนและข้อเสนอแนะของครู:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        คะแนนที่ได้ (เต็ม {currentWorksheet.maxScore})
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={currentWorksheet.maxScore}
                        value={gradeScore}
                        onChange={(e) => setGradeScore(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-base font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-slate-400 block mb-1">
                        ข้อคิดเห็นและข้อเสนอแนะเพิ่มเติมสำหรับนักเรียน
                      </label>
                      <textarea
                        rows={2}
                        value={gradeFeedback}
                        onChange={(e) => setGradeFeedback(e.target.value)}
                        placeholder="เช่น ดีมาก! วิเคราะห์ได้ตรงประเด็น อย่าลืมทบทวนเรื่องการจัดเรียงข้อมูลเพิ่มเติม"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow transition-transform hover:scale-105"
                    >
                      <Send className="w-4 h-4" />
                      <span>บันทึกผลการตรวจใบงาน</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-sm">
                เลือกคลิกที่รายชื่อนักเรียนทางด้านซ้ายเพื่อเปิดดูและตรวจใบงาน
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
