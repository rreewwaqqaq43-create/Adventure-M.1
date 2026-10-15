/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Lesson, StudentProgress, Badge, User } from '../types';
import { StorageService } from '../services/storage';
import {
  MapPin,
  Lock,
  Unlock,
  CheckCircle2,
  Sparkles,
  Gamepad2,
  Video,
  FileCheck,
  ChevronRight,
  Award,
  Layers,
  LayoutGrid,
  BookOpen,
  ExternalLink,
  Search,
  X,
  Filter,
  ShieldAlert,
  AlertCircle,
  Edit3,
  ShieldCheck,
  Crown,
  Trophy,
  Star,
  Target,
  TrendingUp,
  Flame,
  GraduationCap,
} from 'lucide-react';
import { LeaderboardModal } from './LeaderboardModal';

interface LearningMapProps {
  lessons: Lesson[];
  userProgress: StudentProgress[];
  badges: Badge[];
  currentUser: User | null;
  onSelectLesson: (lesson: Lesson) => void;
}

export const LearningMap: React.FC<LearningMapProps> = ({
  lessons,
  userProgress,
  badges,
  currentUser,
  onSelectLesson,
}) => {
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress'>('all');
  const [lockedModalLesson, setLockedModalLesson] = useState<Lesson | null>(null);
  const [lockUpdateKey, setLockUpdateKey] = useState(0);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [selectedLockScope, setSelectedLockScope] = useState<string>('global'); // 'global' or class name e.g. 'ม.1/1'

  const allClasses = useMemo(() => StorageService.getClasses(), [lockUpdateKey]);
  const studentProfile = currentUser ? StorageService.getStudentProfile(currentUser.id) : null;
  const isTeacherOrAdmin = currentUser?.role === 'teacher' || currentUser?.role === 'admin';

  const getProgressForLesson = (lessonId: string) => userProgress.find((p) => p.lessonId === lessonId);
  const getBadgeForLesson = (badgeId?: string) => badges.find((b) => b.id === badgeId);
  const lockedChapters = useMemo(() => StorageService.getGlobalLockedChapters(), [lockUpdateKey]);

  const getStageLockState = (chapterNum: number) => {
    if (isTeacherOrAdmin) {
      if (selectedLockScope === 'global') {
        const isLocked = StorageService.getGlobalLockedChapters().includes(chapterNum);
        return {
          isLocked,
          scope: 'global',
          badgeText: isLocked ? 'ล็อค (ภาพรวมทุกห้อง)' : 'เปิด (ภาพรวมทุกห้อง)',
        };
      } else {
        const classLocks = StorageService.getClassLockedChapters(selectedLockScope);
        const isLocked = classLocks.includes(chapterNum);
        return {
          isLocked,
          scope: selectedLockScope,
          badgeText: isLocked ? `ล็อค (ห้อง ${selectedLockScope})` : `เปิด (ห้อง ${selectedLockScope})`,
        };
      }
    } else {
      // For student
      const info = StorageService.getChapterLockInfoForUser(chapterNum, currentUser);
      return {
        isLocked: info.isLocked,
        scope: info.lockType,
        classroomName: info.classroomName,
        badgeText: info.isLocked
          ? (info.lockType === 'classroom' ? `ครูล็อคไว้ (ห้อง ${info.classroomName})` : 'ครูล็อคด่านไว้')
          : 'พร้อมเรียน',
      };
    }
  };

  const isLessonLocked = (chapterNum: number) => {
    return getStageLockState(chapterNum).isLocked;
  };

  const handleToggleLock = (chapterNum: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedLockScope === 'global') {
      StorageService.toggleGlobalChapterLock(chapterNum);
    } else {
      StorageService.toggleClassChapterLock(selectedLockScope, chapterNum);
    }
    setLockUpdateKey((k) => k + 1);
  };

  const handleLockAll = () => {
    const allChs = lessons.map((l) => l.chapterNumber);
    if (selectedLockScope === 'global') {
      StorageService.setGlobalLockedChapters(allChs);
    } else {
      StorageService.setClassLockedChapters(selectedLockScope, allChs);
    }
    setLockUpdateKey((k) => k + 1);
  };

  const handleUnlockAll = () => {
    if (selectedLockScope === 'global') {
      StorageService.setGlobalLockedChapters([]);
    } else {
      StorageService.setClassLockedChapters(selectedLockScope, []);
    }
    setLockUpdateKey((k) => k + 1);
  };

  const activeLockCount = useMemo(() => {
    if (selectedLockScope === 'global') {
      return StorageService.getGlobalLockedChapters().length;
    } else {
      return StorageService.getClassLockedChapters(selectedLockScope).length;
    }
  }, [selectedLockScope, lockUpdateKey]);

  const handleLessonClick = (lesson: Lesson) => {
    if (isLessonLocked(lesson.chapterNumber) && !isTeacherOrAdmin) {
      setLockedModalLesson(lesson);
      return;
    }
    onSelectLesson(lesson);
  };

  const completedCount = userProgress.filter((p) => p.status === 'completed').length;
  const completionPercent = Math.round((completedCount / lessons.length) * 100);
  const globalLockedList = lockedChapters;

  // Filter lessons according to search query and status
  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const prog = getProgressForLesson(lesson.id);
      const isCompleted = prog?.status === 'completed';
      const isInProgress = prog?.status === 'in_progress' || (prog?.quizScore || 0) > 0 || (prog?.gameScore || 0) > 0;

      if (statusFilter === 'completed' && !isCompleted) return false;
      if (statusFilter === 'in_progress' && (!isInProgress || isCompleted)) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = lesson.title.toLowerCase().includes(q);
      const matchDesc = lesson.description.toLowerCase().includes(q);
      const matchObj = lesson.objectives?.some((o) => o.toLowerCase().includes(q));
      const matchCh = `บทที่ ${lesson.chapterNumber}`.includes(q) || `${lesson.chapterNumber}` === q;

      return matchTitle || matchDesc || matchObj || matchCh;
    });
  }, [lessons, searchQuery, statusFilter, userProgress]);

  return (
    <div className="space-y-6">
      {/* Map Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Chakra_Petch']">
              แผนที่การผจญภัย 7 ด่าน & คลังข้อสอบวัดผลสัมฤทธิ์ (Learning Map)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              พิชิต 6 บทเรียน + มหาคลังข้อสอบวัดผลสัมฤทธิ์รวม 6 บท (ก่อน 30 ข้อ / หลัง 30 ข้อ)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsLeaderboardOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-black shadow-md transition-transform hover:scale-105 cursor-pointer"
          >
            <Trophy className="w-4 h-4" />
            <span>🥇 อันดับคะแนนเทียบเพื่อน</span>
          </button>

          <a
            id="learning-map-read-ebook"
            href="https://pubhtml5.com/ztml/rbqf/"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all hover:scale-105"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>เทคโนโลยี วิทยาการคำนวณ ม.1</span>
            <ExternalLink className="w-3 h-3 text-amber-400" />
          </a>

          <div className="text-right">
            <div className="text-xs text-slate-400">ความก้าวหน้ารวม</div>
            <div className="text-lg font-black text-amber-400 font-['Chakra_Petch']">
              {completedCount} / {lessons.length} บท ({completionPercent}%)
            </div>
          </div>

          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                viewMode === 'map'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>เส้นทางแผนที่</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>ตารางบทเรียน</span>
            </button>
          </div>
        </div>
      </div>

      {/* Gamification 5-Pillars System (⭐ คะแนน, 🏆 เหรียญ, 📈 เลเวล, 🎯 ภารกิจ, 🥇 อันดับ) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 shadow-lg text-left">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold shrink-0">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <div className="text-[11px] font-black text-amber-300 font-['Chakra_Petch']">⭐ ได้คะแนน</div>
            <div className="text-[10px] text-slate-400">ตอบถูกได้ 10 คะแนน/ข้อ</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold shrink-0">
            <Trophy className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <div className="text-[11px] font-black text-yellow-300 font-['Chakra_Petch']">🏆 ได้รางวัล/เหรียญ</div>
            <div className="text-[10px] text-slate-400">ทำภารกิจครบได้เหรียญ</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-[11px] font-black text-emerald-300 font-['Chakra_Petch']">📈 มีเลเวล</div>
            <div className="text-[10px] text-slate-400">จาก Level 1 → Level 2</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
            <Target className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-[11px] font-black text-indigo-300 font-['Chakra_Petch']">🎯 มีภารกิจ</div>
            <div className="text-[10px] text-slate-400">ทำโจทย์เพื่อผ่านด่าน</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsLeaderboardOpen(true)}
          className="col-span-2 sm:col-span-1 flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/40 transition-transform hover:scale-105 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-black text-amber-300 font-['Chakra_Petch']">🥇 มีอันดับ</div>
              <div className="text-[10px] text-slate-300">ดูคะแนนเทียบเพื่อน</div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
        </button>
      </div>

      {/* Teacher / Admin Stage Lock Control Banner (แยกตามห้องเรียนได้) */}
      {isTeacherOrAdmin && (
        <div className="p-5 bg-gradient-to-r from-slate-900 via-rose-950/25 to-slate-900 border-2 border-amber-500/40 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-md">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-white font-['Chakra_Petch']">
                    ระบบล็อคด่านแยกตามห้องเรียน (Teacher & Admin Stage Lock by Classroom)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-300 font-mono text-xs border border-amber-500/30 font-bold">
                    ล็อคอยู่ {activeLockCount} / {lessons.length} ด่าน ({selectedLockScope === 'global' ? 'ภาพรวมทุกห้อง' : `ห้อง ${selectedLockScope}`})
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  คุณครูและ Admin สามารถเลือกห้องเรียนที่ต้องการ แล้วกดล็อค/ปลดล็อคในแต่ละด่านได้เป็นรายห้องอย่างอิสระ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleLockAll}
                className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>ล็อคทุกด่าน ({selectedLockScope === 'global' ? 'ทุกห้อง' : selectedLockScope})</span>
              </button>
              <button
                type="button"
                onClick={handleUnlockAll}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>ปลดล็อคทุกด่าน ({selectedLockScope === 'global' ? 'ทุกห้อง' : selectedLockScope})</span>
              </button>
            </div>
          </div>

          {/* Classroom Selector Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 mr-1">
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span>เลือกห้องเรียนเพื่อจัดการ:</span>
            </span>

            <button
              type="button"
              onClick={() => setSelectedLockScope('global')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedLockScope === 'global'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg scale-105'
                  : 'bg-slate-950 text-slate-300 border border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              <span>🌐 ทุกห้องเรียน (Global Lock)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedLockScope === 'global' ? 'bg-slate-900 text-amber-400 font-mono' : 'bg-slate-800 text-slate-400'
              }`}>
                {StorageService.getGlobalLockedChapters().length}
              </span>
            </button>

            {allClasses.map((cls) => {
              const classLocks = StorageService.getClassLockedChapters(cls.name);
              const isSelected = selectedLockScope === cls.name;
              return (
                <button
                  key={cls.id || cls.name}
                  type="button"
                  onClick={() => setSelectedLockScope(cls.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-black shadow-lg scale-105 ring-2 ring-indigo-400'
                      : 'bg-slate-950 text-slate-300 border border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span>🏫 ห้อง {cls.name}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-indigo-950 text-indigo-200 font-mono' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {classLocks.length > 0 ? `🔒 ${classLocks.length}` : 'เปิดหมด'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* In-Map Search & Status Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาบทเรียน เช่น Scratch, Python, ผังงาน..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-1">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>สถานะ:</span>
          </div>

          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            ทั้งหมด ({lessons.length})
          </button>

          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
              statusFilter === 'completed'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>เรียนผ่านแล้ว ({completedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'in_progress'
                ? 'bg-indigo-500 text-white font-bold shadow'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            กำลังเรียนอยู่
          </button>
        </div>
      </div>

      {filteredLessons.length === 0 && (
        <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3">
          <Search className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">ไม่พบบทเรียนที่ตรงกับคำค้นหา "{searchQuery}"</h3>
          <p className="text-xs text-slate-400">ลองค้นหาด้วยคำอื่น เช่น "อัลกอริทึม", "Scratch", "Python", หรือ "ข้อมูล"</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all"
          >
            ล้างตัวกรองและดูทั้งหมด
          </button>
        </div>
      )}

      {/* VIEW 1: Visual Adventure Trail / Island Map */}
      {viewMode === 'map' && filteredLessons.length > 0 && (
        <div className="relative p-6 sm:p-10 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          {/* Ambient Background Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto space-y-8">
            {filteredLessons.map((lesson, index) => {
              const prog = getProgressForLesson(lesson.id);
              const badge = getBadgeForLesson(lesson.badgeRewardId || '');
              const isCompleted = prog?.status === 'completed';
              const stageLockInfo = getStageLockState(lesson.chapterNumber);
              const locked = stageLockInfo.isLocked;
              const isEven = index % 2 === 1;

              return (
                <div key={lesson.id} className="relative">
                  {/* Vertical connecting line */}
                  {index < lessons.length - 1 && (
                    <div
                      className={`absolute left-8 sm:left-1/2 top-20 bottom-0 w-1 -ml-0.5 z-0 ${
                        isCompleted
                          ? 'bg-gradient-to-b from-amber-400 to-amber-500/40'
                          : 'bg-slate-800'
                      }`}
                      style={{ height: 'calc(100% + 32px)' }}
                    />
                  )}

                  <div
                    className={`flex flex-col sm:flex-row items-start sm:items-center gap-6 ${
                      isEven ? 'sm:flex-row-reverse' : ''
                    }`}
                  >
                    {/* Chapter Node Landmark Icon */}
                    <button
                      onClick={() => handleLessonClick(lesson)}
                      className={`relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 group hover:scale-110 focus:outline-none shrink-0 ${
                        locked
                          ? 'bg-rose-950/70 text-rose-300 border-2 border-rose-500/40 opacity-80 cursor-not-allowed'
                          : isCompleted
                          ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 ring-4 ring-amber-400/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-2 border-slate-700 hover:border-amber-500/50'
                      }`}
                    >
                      <div className="text-center">
                        <span className="text-xl sm:text-2xl">{locked ? '🔒' : badge?.icon || '🚩'}</span>
                        <div className="text-[10px] font-black uppercase tracking-wider mt-0.5">
                          บทที่ {lesson.chapterNumber}
                        </div>
                      </div>

                      {locked && (
                        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-600 border-2 border-slate-950 flex items-center justify-center text-white shadow">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      )}

                      {!locked && isCompleted && (
                        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-white">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>

                    {/* Chapter Card Content */}
                    <div
                      onClick={() => handleLessonClick(lesson)}
                      className={`flex-1 p-5 rounded-2xl bg-slate-900/95 border transition-all cursor-pointer shadow-lg group hover:shadow-amber-500/5 ${
                        locked
                          ? 'border-rose-900/50 bg-rose-950/15 hover:border-rose-500/60'
                          : isCompleted
                          ? 'border-amber-500/30 hover:border-amber-500/50'
                          : 'border-slate-800 hover:border-amber-500/40'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            locked
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}>
                            ด่านที่ {lesson.chapterNumber}
                          </span>
                          <span className="text-xs text-slate-400 hidden sm:inline">
                            สสวท. ม.1
                          </span>
                          {locked && (
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              <span>{stageLockInfo.badgeText}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          {locked ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold flex items-center gap-1">
                              <Lock className="w-3.5 h-3.5" />
                              <span>รอปลดล็อคในคาบ</span>
                            </span>
                          ) : isCompleted ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>สำเร็จแล้ว</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">พร้อมเรียน</span>
                          )}
                          <span className="font-semibold text-amber-400">+{lesson.xpReward} XP</span>
                        </div>
                      </div>

                      <h3 className={`font-bold text-base sm:text-lg transition-colors font-['Chakra_Petch'] ${
                        locked ? 'text-rose-200 group-hover:text-white' : 'text-white group-hover:text-amber-300'
                      }`}>
                        {lesson.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                        {lesson.description}
                      </p>

                      {/* Micro Action Badges & Teacher Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {lesson.chapterNumber !== 7 ? (
                            <>
                              <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-950 border border-slate-800">
                                <Video className="w-3 h-3 text-amber-400" />
                                <span>วิดีโอ สสวท.</span>
                              </span>
                              <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-950 border border-slate-800">
                                <Gamepad2 className="w-3 h-3 text-indigo-400" />
                                <span>มินิเกม</span>
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 font-bold">
                                <BookOpen className="w-3 h-3 text-indigo-400" />
                                <span>📖 ทบทวนเนื้อหา 6 บท</span>
                              </span>
                              <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-950/40 border border-amber-500/30 text-amber-300 font-bold">
                                <span>📝 สอบวัดผลสัมฤทธิ์</span>
                              </span>
                            </>
                          )}
                          <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-950 border border-slate-800">
                            <FileCheck className="w-3 h-3 text-emerald-400" />
                            <span>ก่อน/หลังเรียน</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isTeacherOrAdmin && (
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={(e) => handleToggleLock(lesson.chapterNumber, e)}
                                title={`คลิกเพื่อ${locked ? 'ปลดล็อค' : 'ล็อค'}ด่านที่ ${lesson.chapterNumber} สำหรับ${selectedLockScope === 'global' ? 'ทุกห้องเรียน' : `ห้อง ${selectedLockScope}`}`}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                  locked
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                                }`}
                              >
                                {locked ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-rose-400" />}
                                <span>{locked ? 'ปลดล็อค' : 'ล็อคด่าน'} {selectedLockScope !== 'global' && `(${selectedLockScope})`}</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectLesson(lesson);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3 text-amber-400" />
                                <span>แก้ไข</span>
                              </button>
                            </div>
                          )}

                          <div className={`flex items-center gap-1 font-semibold group-hover:translate-x-1 transition-transform ${
                            locked ? 'text-rose-400' : 'text-amber-400'
                          }`}>
                            {locked && !isTeacherOrAdmin ? (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span>ถูกล็อค</span>
                              </>
                            ) : (
                              <>
                                <span>เข้าสู่ด่าน</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grand Finale Chapter 7 Gateway Card (หลังครบเจ็ดด่าน / รวมข้อสอบ 6 บท ก่อน 30 ข้อ หลัง 30 ข้อ) */}
          {(() => {
            const compLesson = lessons.find((l) => l.chapterNumber === 7);
            if (!compLesson) return null;
            const compLocked = isLessonLocked(7);
            const compLockInfo = getStageLockState(7);

            return (
              <div className="mt-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950/60 border-2 border-amber-500/60 shadow-2xl relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-10 w-60 h-60 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-3.5 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg">
                        <Crown className="w-4 h-4" />
                        <span>ด่านพิเศษ: รวมข้อสอบทั้ง 6 บทเรียน (สสวท. ม.1)</span>
                      </span>
                      <span className="px-3 py-1 rounded-full bg-slate-950 border border-amber-500/40 text-amber-300 font-bold text-xs">
                        ก่อน 30 ข้อ & หลัง 30 ข้อ (สอบล้วนๆ ไม่มีมินิเกม)
                      </span>
                      <span className="px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 font-bold text-xs flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-400" />
                        <span>⭐ ตอบถูกได้ 10 คะแนน (เต็ม 300 คะแนน)</span>
                      </span>

                      {/* Lock Status Badge */}
                      {compLocked ? (
                        <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" />
                          <span>{compLockInfo.badgeText}</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-1">
                          <Unlock className="w-3.5 h-3.5" />
                          <span>เปิดให้นักเรียนเข้าทำข้อสอบ</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-white font-['Chakra_Petch'] leading-tight">
                      {compLesson.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      คลังข้อสอบวัดผลสัมฤทธิ์ปลายภาคเรียน ครอบคลุมทั้ง 6 บทเรียน มีแบบทดสอบก่อนเรียน 30 ข้อ และแบบทดสอบหลังเรียน 30 ข้อ เพื่อวัดพัฒนาการองค์รวม (ต้องทำแบบทดสอบก่อนเรียนให้ครบก่อน จึงจะส่งคำตอบแบบทดสอบหลังเรียนได้) พิชิตเกณฑ์ 60% ขึ้นไปเพื่อรับ <strong>เหรียญทองคำมหาบัณฑิต 6 บทเรียน 🏆</strong>
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                      <span className="flex items-center gap-1.5 text-amber-300 font-bold bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
                        <FileCheck className="w-4 h-4 text-amber-400" />
                        <span>แบบทดสอบก่อนเรียน (30 ข้อ)</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-300 font-bold bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>แบบทดสอบหลังเรียน (30 ข้อ)</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-indigo-300 font-bold bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
                        <Award className="w-4 h-4 text-indigo-400" />
                        <span>วัดผลสัมฤทธิ์ปลายภาคเรียน ม.1 ครบ 6 บท</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                    {/* Teacher/Admin Stage Lock Toggle for Chapter 7 */}
                    {isTeacherOrAdmin && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleToggleLock(7, e)}
                          title={`คลิกเพื่อ${compLocked ? 'ปลดล็อค' : 'ล็อค'}ด่านข้อสอบรวมสำหรับ${selectedLockScope === 'global' ? 'ทุกห้องเรียน' : `ห้อง ${selectedLockScope}`}`}
                          className={`w-full px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow ${
                            compLocked
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                          }`}
                        >
                          {compLocked ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-rose-400" />}
                          <span>{compLocked ? 'ปลดล็อคข้อสอบรวม' : 'ล็อคข้อสอบรวม'} {selectedLockScope !== 'global' && `(${selectedLockScope})`}</span>
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleLessonClick(compLesson)}
                      className={`px-6 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all cursor-pointer ${
                        compLocked && !isTeacherOrAdmin
                          ? 'bg-slate-900 border-2 border-rose-500/50 text-rose-300 hover:bg-rose-950/40'
                          : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 hover:scale-105'
                      }`}
                    >
                      {compLocked && !isTeacherOrAdmin ? (
                        <>
                          <Lock className="w-5 h-5 text-rose-400" />
                          <span>ข้อสอบถูกล็อค (รอครูปลดล็อค)</span>
                        </>
                      ) : (
                        <>
                          <Trophy className="w-5 h-5 text-slate-950" />
                          <span>เข้าสู่คลังข้อสอบ 60 ข้อ (ก่อน/หลัง 30 ข้อ) →</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* VIEW 2: Grid Cards Layout */}
      {viewMode === 'grid' && filteredLessons.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => {
            const prog = getProgressForLesson(lesson.id);
            const isCompleted = prog?.status === 'completed';
            const locked = isLessonLocked(lesson.chapterNumber);

            return (
              <div
                key={lesson.id}
                onClick={() => handleLessonClick(lesson)}
                className={`rounded-2xl bg-slate-900 border p-5 shadow-xl transition-all cursor-pointer group flex flex-col justify-between hover:scale-[1.02] ${
                  locked
                    ? 'border-rose-900/50 hover:border-rose-500/60'
                    : 'border-slate-800 hover:border-amber-500/40'
                }`}
              >
                <div>
                  <div className="relative rounded-xl overflow-hidden h-36 bg-slate-950 mb-4 border border-slate-800">
                    <img
                      src={lesson.coverImageUrl}
                      alt={lesson.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-70"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-sm border border-slate-700 text-amber-300 text-xs font-bold">
                      บทที่ {lesson.chapterNumber}
                    </div>

                    {locked && (
                      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] flex flex-col items-center justify-center text-rose-300 gap-1.5 p-2 text-center">
                        <div className="w-9 h-9 rounded-full bg-rose-600/80 flex items-center justify-center text-white shadow-lg">
                          <Lock className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-rose-200">ถูกล็อคโดยครูผู้สอน</span>
                      </div>
                    )}

                    {!locked && isCompleted && (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-emerald-500/90 text-slate-950 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ผ่านแล้ว</span>
                      </div>
                    )}
                  </div>

                  <h3 className={`font-bold text-base transition-colors font-['Chakra_Petch'] leading-snug ${
                    locked ? 'text-rose-200 group-hover:text-white' : 'text-white group-hover:text-amber-300'
                  }`}>
                    {lesson.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1.5 line-clamp-2">
                    {lesson.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-amber-400">+{lesson.xpReward} XP</span>

                  <div className="flex items-center gap-1.5">
                    {isTeacherOrAdmin && (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleToggleLock(lesson.chapterNumber, e)}
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                            locked
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                          }`}
                        >
                          {locked ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-rose-400" />}
                          <span>{locked ? 'ปลดล็อค' : 'ล็อค'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectLesson(lesson);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3 text-amber-400" />
                          <span>แก้ไข</span>
                        </button>
                      </div>
                    )}

                    <span className={`flex items-center gap-1 ${
                      locked && !isTeacherOrAdmin ? 'text-rose-400 font-bold' : 'text-slate-400 group-hover:text-white'
                    }`}>
                      {locked && !isTeacherOrAdmin ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>ครูล็อคด่าน</span>
                        </>
                      ) : (
                        <>
                          <span>เปิดดูบทเรียน</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Chapter Locked Modal Dialog */}
      {lockedModalLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border-2 border-rose-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                ด่านที่ {lockedModalLesson.chapterNumber} ถูกล็อค
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white font-['Chakra_Petch']">
                {lockedModalLesson.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
                {studentProfile?.classroom
                  ? `คุณครูผู้สอนได้ตั้งค่าล็อคด่านนี้ไว้สำหรับห้องเรียน ${studentProfile.classroom} ของคุณ เพื่อให้นักเรียนในชั้นเรียนได้ศึกษาและทำกิจกรรมไปพร้อมกันในห้องเรียนครับ`
                  : 'คุณครูผู้สอนได้ตั้งค่าล็อคด่านนี้ไว้ชั่วคราว เพื่อให้นักเรียนทุกคนในชั้นเรียนได้ศึกษาและทำกิจกรรมไปพร้อมกันในห้องเรียนครับ'}
              </p>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-400 text-left flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                เมื่อคุณครูเริ่มสอนในบทนี้ ระบบจะปลดล็อคให้เข้าทำกิจกรรม วิดีโอ มินิเกม และแบบทดสอบได้ทันที
              </span>
            </div>

            <button
              onClick={() => setLockedModalLesson(null)}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg hover:scale-105"
            >
              รับทราบ / กลับไปเลือกด่านที่เปิดอยู่
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard Modal (ดูอันดับเทียบเพื่อน) */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        currentUser={currentUser}
        currentStudent={studentProfile}
      />
    </div>
  );
};
