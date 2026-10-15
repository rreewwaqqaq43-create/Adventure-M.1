/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StorageService } from '../../services/storage';
import { syncChapterLocksToFirestore } from '../../services/firebase';
import {
  Lock,
  Unlock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  BookOpen,
  Layers,
  GraduationCap
} from 'lucide-react';

interface TeacherStageLockManagerProps {
  onLocksUpdated?: () => void;
}

export const TeacherStageLockManager: React.FC<TeacherStageLockManagerProps> = ({
  onLocksUpdated = () => {},
}) => {
  const [globalLocked, setGlobalLocked] = useState<number[]>([]);
  const [allClasses, setAllClasses] = useState(StorageService.getClasses());
  const [selectedClassId, setSelectedClassId] = useState<string>('global'); // 'global' or classId
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const chapters = [
    { number: 1, title: 'แนวคิดเชิงคำนวณ (Computational Thinking)' },
    { number: 2, title: 'การเขียนโปรแกรมด้วยภาษา Scratch' },
    { number: 3, title: 'การเขียนโปรแกรมด้วยภาษา Python' },
    { number: 4, title: 'การจัดการข้อมูลสารสนเทศ' },
    { number: 5, title: 'การใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย' },
    { number: 6, title: 'โครงงานวิทยาการคำนวณสร้างสรรค์' },
    { number: 7, title: 'แบบทดสอบวัดผลสัมฤทธิ์รวม 6 บท (Comprehensive Final Exam)' },
  ];

  const refreshState = () => {
    setGlobalLocked(StorageService.getGlobalLockedChapters());
    setAllClasses(StorageService.getClasses());
  };

  useEffect(() => {
    refreshState();
  }, []);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 3500);
  };

  const handleToggleGlobalChapter = async (chNum: number) => {
    const isLocked = globalLocked.includes(chNum);
    let updated: number[];
    if (isLocked) {
      updated = globalLocked.filter((c) => c !== chNum);
    } else {
      updated = [...globalLocked, chNum];
    }
    StorageService.setGlobalLockedChapters(updated);
    setGlobalLocked(updated);
    await syncChapterLocksToFirestore('global', updated);
    onLocksUpdated();
    showFeedback('success', `${isLocked ? 'ปลดล็อค' : 'ล็อค'}บทเรียนที่ ${chNum} เรียบร้อยแล้ว`);
  };

  const handleToggleClassChapter = async (classId: string, chNum: number) => {
    const cls = allClasses.find((c) => c.id === classId || c.name === classId);
    if (!cls) return;
    const currentLocks = StorageService.getClassLockedChapters(cls.name);
    const isLocked = currentLocks.includes(chNum);
    const updatedLocks = isLocked
      ? currentLocks.filter((n) => n !== chNum)
      : [...currentLocks, chNum].sort((a, b) => a - b);

    StorageService.setClassLockedChapters(cls.name, updatedLocks);
    setAllClasses(StorageService.getClasses());
    await syncChapterLocksToFirestore(cls.name, updatedLocks);
    onLocksUpdated();
    showFeedback('success', `${isLocked ? 'ปลดล็อค' : 'ล็อค'}บทที่ ${chNum} สำหรับห้อง ${cls.name}`);
  };

  const handleApplyPreset = async (lockedList: number[], label: string) => {
    if (selectedClassId === 'global') {
      StorageService.setGlobalLockedChapters(lockedList);
      setGlobalLocked(lockedList);
      await syncChapterLocksToFirestore('global', lockedList);
    } else {
      const cls = allClasses.find((c) => c.id === selectedClassId || c.name === selectedClassId);
      if (cls) {
        StorageService.setClassLockedChapters(cls.name, lockedList);
        await syncChapterLocksToFirestore(cls.name, lockedList);
      }
      setAllClasses(StorageService.getClasses());
    }
    onLocksUpdated();
    showFeedback('success', `ปรับใช้สถานะ: ${label} สำเร็จ`);
  };

  // Determine currently active locks depending on selection
  const selectedClass = allClasses.find((c) => c.id === selectedClassId || c.name === selectedClassId);
  const currentLocks = selectedClassId === 'global'
    ? globalLocked
    : StorageService.getClassLockedChapters(selectedClass?.name || '');

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-rose-950/70 via-slate-900 to-indigo-950/70 border border-rose-500/30 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white font-['Chakra_Petch']">
                ระบบจัดการการล็อคด่านบทเรียน (Stage Access Control)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                ครูผู้สอน & Admin
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              คลิกปุ่มล็อคหรือปลดล็อคด่านได้ทันที เพื่อควบคุมจังหวะการสอนในห้องเรียน และป้องกันไม่ให้นักเรียนข้ามบทเรียนล่วงหน้า
            </p>
          </div>
        </div>

        {/* Quick Summary Badge */}
        <div className="flex items-center gap-2 shrink-0 bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400">สถานะปัจจุบัน:</span>
          <span className="text-xs font-bold text-amber-400 font-['Chakra_Petch']">
            ล็อคอยู่ {currentLocks.length} / {chapters.length} ด่าน
          </span>
        </div>
      </div>

      {/* Feedback message banner */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 transition-all shadow-lg animate-fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Scope Selector: Global vs Classroom Specific */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-white">เลือกขอบเขตการควบคุม:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setSelectedClassId('global')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              selectedClassId === 'global'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            🌐 ค่าเริ่มต้นทุกห้อง (Global)
          </button>

          {allClasses.map((cls) => (
            <button
              key={cls.id}
              type="button"
              onClick={() => setSelectedClassId(cls.id)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedClassId === cls.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              ห้อง {cls.name}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Quick Actions */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>คำสั่งด่วน (Quick Presets):</span>
          </span>
          <span className="text-[11px] text-slate-400">
            ปรับสถานะทั้งหลักสูตรได้ในคลิกเดียว
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => handleApplyPreset([], 'ปลดล็อคทุกบทเรียน')}
            className="p-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <Unlock className="w-4 h-4 text-emerald-400" />
            <span>ปลดล็อคทุกบท</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset([2, 3, 4, 5, 6, 7], 'เปิดเฉพาะบทที่ 1')}
            className="p-3 rounded-xl bg-amber-950/60 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>เปิดเฉพาะบทที่ 1</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset([7], 'เปิดบทที่ 1-6 (ล็อคข้อสอบรวม)')}
            className="p-3 rounded-xl bg-indigo-950/60 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>เปิดบท 1-6 (ล็อคข้อสอบรวม)</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset([1, 2, 3, 4, 5, 6, 7], 'ล็อคทุกบทเรียน')}
            className="p-3 rounded-xl bg-rose-950/60 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <Lock className="w-4 h-4 text-rose-400" />
            <span>ล็อคทุกบท (1-7)</span>
          </button>
        </div>
      </div>

      {/* Chapters Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {chapters.map((ch) => {
          const isLocked = currentLocks.includes(ch.number);

          return (
            <div
              key={ch.number}
              className={`p-5 rounded-3xl border transition-all flex items-center justify-between gap-4 shadow-lg ${
                isLocked
                  ? 'bg-rose-950/20 border-rose-500/40'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black font-['Chakra_Petch'] shrink-0 shadow ${
                    isLocked
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400">บทที่ {ch.number}</span>
                    <span
                      className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                        isLocked
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {isLocked ? '🔒 ล็อคอยู่' : '🔓 เปิดให้นักเรียนเข้า'}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
                    {ch.title}
                  </h4>
                </div>
              </div>

              {/* Direct 1-Click Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  if (selectedClassId === 'global') {
                    handleToggleGlobalChapter(ch.number);
                  } else {
                    handleToggleClassChapter(selectedClassId, ch.number);
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow cursor-pointer shrink-0 ${
                  isLocked
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse hover:scale-105'
                    : 'bg-rose-600 hover:bg-rose-500 text-white hover:scale-105'
                }`}
                title={isLocked ? 'คลิกเพื่อปลดล็อคบทนี้' : 'คลิกเพื่อล็อคบทนี้'}
              >
                {isLocked ? (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>ปลดล็อค</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>ล็อคด่าน</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
