/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, StudentProfile, StudentProgress, Lesson, Badge } from '../types';
import { StorageService } from '../services/storage';
import { exportStudentReportToCSV } from '../services/sheets';
import { CompetencyRadarChart } from './dashboard/CompetencyRadarChart';
import { ScoreComparisonChart } from './dashboard/ScoreComparisonChart';
import { StageClearedSection } from './dashboard/StageClearedSection';
import { DailyQuestsSection } from './dashboard/DailyQuestsSection';
import { CertificateModal } from './dashboard/CertificateModal';
import { CompetencyBreakdown } from './dashboard/CompetencyBreakdown';
import { StudentProfileEditModal } from './dashboard/StudentProfileEditModal';
import {
  GraduationCap,
  Sparkles,
  Award,
  CheckCircle2,
  Download,
  BookOpen,
  Trophy,
  Star,
  Gamepad2,
  BarChart2,
  Gift,
  Flame,
  Printer,
  ChevronRight,
  LayoutDashboard,
  Target,
  Play,
  UserCog,
  Edit3,
  Mail,
  MessageSquare,
  Clock,
  Inbox,
  TrendingUp,
} from 'lucide-react';
import { LeaderboardModal } from './LeaderboardModal';

interface StudentDashboardProps {
  user: User;
  studentProfile: StudentProfile | null;
  progressList: StudentProgress[];
  lessons: Lesson[];
  badges: Badge[];
  onOpenLesson: (lesson: Lesson, tab?: 'content' | 'video' | 'game' | 'quiz' | 'worksheet' | 'badge') => void;
  onProfileUpdated?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  studentProfile,
  progressList,
  lessons,
  badges,
  onOpenLesson,
  onProfileUpdated = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'stages' | 'badges' | 'table' | 'mailbox' | 'leaderboard'>('overview');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

  const teacherFeedbacks = StorageService.getFeedback(user.id);
  const unreadFeedbackCount = teacherFeedbacks.filter((f) => !f.read).length;

  const totalXP = studentProfile?.xp || 0;
  const level = studentProfile?.level || 1;
  const xpInCurrentLevel = totalXP % 300;
  const levelProgressPercent = Math.min(100, Math.round((xpInCurrentLevel / 300) * 100));

  const completedCount = progressList.filter((p) => p.status === 'completed').length;
  const userBadges = StorageService.getUserBadges(user.id);

  // Calculate total stars collected across all games
  const totalStars = progressList.reduce((acc, p) => {
    const s = p.gameScore || 0;
    if (s >= 90) return acc + 3;
    if (s >= 60) return acc + 2;
    if (s >= 30) return acc + 1;
    return acc;
  }, 0);

  // Adventure Title based on level
  const getAdventureTitle = (lvl: number) => {
    if (lvl >= 10) return { title: 'ปรมาจารย์วิทยาการคำนวณ', badge: '👑 Grandmaster' };
    if (lvl >= 7) return { title: 'ผู้พิทักษ์เครือข่ายปลอดภัย', badge: '🛡️ Cyber Sentinel' };
    if (lvl >= 5) return { title: 'จอมเวทบล็อก Scratch', badge: '🔮 Scratch Alchemist' };
    if (lvl >= 3) return { title: 'ผู้ฝึกหัดผังงานและลอจิก', badge: '🧭 Logic Apprentice' };
    return { title: 'นักสำรวจโค้ดมือใหม่', badge: '🌱 Novice Explorer' };
  };

  const titleInfo = getAdventureTitle(level);

  const handleDownloadReport = () => {
    exportStudentReportToCSV(user, studentProfile, lessons, progressList, badges);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleXPClaimed = () => {
    // Parent state can sync automatically via localStorage
  };

  return (
    <div className="space-y-8">
      {/* Student Profile Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setShowEditProfileModal(true)}
              title="คลิกเพื่อแก้ไขรูปโปรไฟล์"
              className="relative group cursor-pointer focus:outline-none shrink-0"
            >
              <img
                src={user.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=Adventure'}
                alt={user.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-800 border-2 border-amber-400/50 shadow-xl object-cover group-hover:border-indigo-400 transition-colors"
              />
              <div className="absolute inset-0 bg-slate-950/60 rounded-3xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[11px] font-bold gap-0.5">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>เปลี่ยนรูป</span>
              </div>
              <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs shadow">
                Lv.{level}
              </span>
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white font-['Chakra_Petch']">
                  {user.name}
                </h1>
                <span className="px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                  {titleInfo.badge}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                ฉายา: <strong className="text-white">{titleInfo.title}</strong> • ห้องเรียน: <strong className="text-slate-200">{studentProfile?.classroom || 'ม.1/1'}</strong> • เลขที่: <strong className="text-slate-200">{studentProfile?.seatNumber || 1}</strong> • รหัส: <strong className="text-amber-300 font-mono font-bold bg-slate-950/60 px-2 py-0.5 rounded border border-amber-500/30">🔒 {studentProfile?.studentId || 'STD-M1'}</strong>
                {studentProfile?.assignedTeacherName && (
                  <span> • ครูผู้ดูแล: <strong className="text-emerald-400">{studentProfile.assignedTeacherName}</strong></span>
                )}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>คะแนนสะสมวิทยฐานะ: {totalXP} XP (เป้าหมายเลเวลถัดไป: {300 - xpInCurrentLevel} XP)</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowLeaderboardModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition-transform hover:scale-105 cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              <span>🥇 ดูอันดับเทียบเพื่อน</span>
            </button>

            <button
              id="btn-edit-student-profile"
              onClick={() => setShowEditProfileModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-transform hover:scale-105 cursor-pointer"
            >
              <UserCog className="w-4 h-4 text-indigo-200" />
              <span>แก้ไขข้อมูลโปรไฟล์</span>
            </button>

            <button
              onClick={() => setShowCertificateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition-transform hover:scale-105 cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>ดูเกียรติบัตรรับรอง</span>
            </button>

            <button
              onClick={handleDownloadReport}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{downloadSuccess ? 'ดาวน์โหลดแล้ว!' : 'ส่งออกรายงาน (CSV)'}</span>
            </button>
          </div>
        </div>

        {/* Level XP Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">
              ระดับนักผจญภัย Level {level} → Level {level + 1}
            </span>
            <span className="font-bold text-amber-300 font-['Chakra_Petch']">
              {xpInCurrentLevel} / 300 XP ในเลเวลนี้ ({levelProgressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${levelProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Gamification 5-Pillars Constitution Banner (⭐ คะแนน, 🏆 เหรียญ, 📈 เลเวล, 🎯 ภารกิจ, 🥇 อันดับ) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-3xl bg-slate-900 border border-amber-500/30 shadow-xl text-left">
        <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold shrink-0">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-black text-amber-300 font-['Chakra_Petch']">⭐ ได้คะแนน</div>
            <div className="text-[11px] text-slate-400">ตอบถูกได้ 10 คะแนน/ข้อ</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold shrink-0">
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <div className="text-xs font-black text-yellow-300 font-['Chakra_Petch']">🏆 ได้รางวัล/เหรียญ</div>
            <div className="text-[11px] text-slate-400">ทำภารกิจครบได้เหรียญ</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs font-black text-emerald-300 font-['Chakra_Petch']">📈 มีเลเวล</div>
            <div className="text-[11px] text-slate-400">จาก Level {level} → Level {level + 1}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
            <Target className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="text-xs font-black text-indigo-300 font-['Chakra_Petch']">🎯 มีภารกิจ</div>
            <div className="text-[11px] text-slate-400">ทำโจทย์เพื่อผ่านด่าน</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('leaderboard')}
          className="col-span-2 sm:col-span-1 flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/40 transition-transform hover:scale-105 cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-amber-300 font-['Chakra_Petch'] flex items-center gap-1">
                <span>🥇 มีอันดับ</span>
              </div>
              <div className="text-[11px] text-slate-300">คลิกดูคะแนนเทียบเพื่อน</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400" />
        </button>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-500/15 text-amber-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">XP สะสมทั้งหมด</div>
            <div className="text-2xl font-black text-white font-['Chakra_Petch']">{totalXP}</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">บทเรียนสำเร็จ</div>
            <div className="text-2xl font-black text-white font-['Chakra_Petch']">
              {completedCount} / 6 บท
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-yellow-500/15 text-yellow-400">
            <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400">ดวงดาวที่พิชิตได้</div>
            <div className="text-2xl font-black text-white font-['Chakra_Petch']">
              {totalStars} / 18 ⭐
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-500/15 text-indigo-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">เหรียญตราที่ปลดล็อก</div>
            <div className="text-2xl font-black text-white font-['Chakra_Petch']">
              {userBadges.length} / {badges.length}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Dashboard Views */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'overview'
              ? 'bg-amber-500 text-slate-950 shadow-md scale-105 font-black'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>ภาพรวมครบทุกมิติ (Overview)</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'leaderboard'
              ? 'bg-amber-500 text-slate-950 shadow-md scale-105 font-black'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>🥇 ตารางอันดับคะแนนเทียบเพื่อน (Leaderboard)</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'analytics'
              ? 'bg-amber-500 text-slate-950 shadow-md scale-105 font-black'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>แผนภูมิและสมรรถนะ (Analytics)</span>
        </button>

        <button
          onClick={() => setActiveTab('stages')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'stages'
              ? 'bg-amber-500 text-slate-950 shadow-md scale-105 font-black'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>ด่านที่ผ่าน & ภารกิจ (Cleared Stages)</span>
        </button>

        <button
          onClick={() => setActiveTab('badges')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'badges'
              ? 'bg-amber-500 text-slate-950 shadow-md scale-105 font-black'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>หอเกียรติยศ & รางวัล (Trophy & Badges)</span>
        </button>

        <button
          onClick={() => setActiveTab('table')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'table'
              ? 'bg-amber-500 text-slate-950 shadow-md scale-105 font-black'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>ตารางสรุป 6 บทเรียน (Table)</span>
        </button>

        <button
          onClick={() => setActiveTab('mailbox')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all relative ${
            activeTab === 'mailbox'
              ? 'bg-indigo-600 text-white shadow-md scale-105 font-black'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Mail className="w-4 h-4 text-indigo-400" />
          <span>กล่องจดหมาย & ฟีดแบ็ก ({teacherFeedbacks.length})</span>
          {unreadFeedbackCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
              {unreadFeedbackCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 0: COMPREHENSIVE OVERVIEW (ภาพรวมครบทุกมิติ) */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* SECTION 1: ด่านที่ผ่าน & ดวงดาวสะสมทั้ง 6 ด่าน */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-lg text-white font-['Chakra_Petch']">
                    ความก้าวหน้าด่านการผจญภัยทั้ง 6 ด่าน (Stages & Star Progress)
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  สถานะการพิชิตด่านมินิเกมและแบบทดสอบท้ายบท พร้อมดาวสะสมสูงสุด 18 ดวง
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-300 font-mono">
                  ผ่านแล้ว {completedCount}/6 ด่าน
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{totalStars} / 18 ดาว</span>
                </span>
              </div>
            </div>

            {/* 6 Stage Mini-Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessons.map((lesson) => {
                const prog = progressList.find((p) => p.lessonId === lesson.id);
                const isCompleted = prog?.status === 'completed';
                const gameScore = prog?.gameScore || 0;
                const quizScore = prog?.quizScore || 0;

                // Stars calculation
                let stars = 0;
                if (gameScore >= 90) stars = 3;
                else if (gameScore >= 60) stars = 2;
                else if (gameScore >= 30) stars = 1;

                return (
                  <div
                    key={lesson.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 bg-slate-950/70 ${
                      isCompleted
                        ? 'border-emerald-500/40 hover:border-emerald-500 shadow-md shadow-emerald-500/5'
                        : prog
                        ? 'border-amber-500/40 hover:border-amber-500'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 font-mono">
                          บทที่ {lesson.chapterNumber}
                        </span>

                        {isCompleted ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>ผ่านแล้ว</span>
                          </span>
                        ) : prog ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300">
                            กำลังเรียน
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                            ยังไม่เริ่ม
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-white line-clamp-1 font-['Chakra_Petch']">
                        {lesson.title}
                      </h4>

                      {/* Stars */}
                      <div className="flex items-center gap-1 pt-1">
                        {[1, 2, 3].map((starIdx) => (
                          <Star
                            key={starIdx}
                            className={`w-4 h-4 ${
                              starIdx <= stars
                                ? 'fill-amber-400 text-amber-400 filter drop-shadow'
                                : 'text-slate-700'
                            }`}
                          />
                        ))}
                        <span className="text-[11px] text-slate-400 ml-1.5 font-mono">
                          {stars}/3 ดาว
                        </span>
                      </div>
                    </div>

                    {/* Score Badges */}
                    {lesson.chapterNumber === 7 ? (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                        <div className="bg-slate-900 px-2 py-1 rounded-lg">
                          <span className="text-slate-400 block text-[9px]">ก่อนเรียน (30 ข้อ):</span>
                          <span className="font-bold text-amber-400 font-mono">{prog?.preTestScore !== undefined ? `${prog.preTestScore}/30` : 'รอทำ'}</span>
                        </div>
                        <div className="bg-slate-900 px-2 py-1 rounded-lg">
                          <span className="text-slate-400 block text-[9px]">หลังเรียน (30 ข้อ):</span>
                          <span className="font-bold text-emerald-400 font-mono">{quizScore > 0 ? `${quizScore}/30` : 'รอทำ'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                        <div className="bg-slate-900 px-2 py-1 rounded-lg">
                          <span className="text-slate-400 block text-[9px]">มินิเกม:</span>
                          <span className="font-bold text-cyan-400 font-mono">{gameScore}/100</span>
                        </div>
                        <div className="bg-slate-900 px-2 py-1 rounded-lg">
                          <span className="text-slate-400 block text-[9px]">แบบทดสอบ:</span>
                          <span className="font-bold text-amber-400 font-mono">{quizScore}/5 ข้อ</span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => onOpenLesson(lesson)}
                      className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                        isCompleted
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isCompleted ? 'ทบทวนด่านนี้' : 'เข้าสู่ด่านนี้'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: แผนภูมิสมรรถนะ 6 ด้าน & แผนภูมิเปรียบเทียบคะแนน */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CompetencyRadarChart progressList={progressList} lessons={lessons} />
            <ScoreComparisonChart progressList={progressList} lessons={lessons} />
          </div>

          {/* SECTION 3: หอเกียรติยศ & เกียรติบัตร (Rewards & Certificate Preview) */}
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl shrink-0">
                  🏆
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white font-['Chakra_Petch']">
                    หอเกียรติยศและรางวัล (Trophies & Badges)
                  </h3>
                  <p className="text-xs text-slate-300">
                    ปลดล็อกแล้ว {userBadges.length} จาก {badges.length} เหรียญตรา • สะสมแต้มพิชิตเกียรติบัตร สสวท.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCertificateModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
                >
                  <Award className="w-4 h-4" />
                  <span>พิมพ์เกียรติบัตรรับรอง</span>
                </button>
                <button
                  onClick={() => setActiveTab('badges')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  ดูทั้งหมด →
                </button>
              </div>
            </div>

            {/* Badges preview row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              {badges.map((b) => {
                const isUnlocked = userBadges.includes(b.id);
                return (
                  <div
                    key={b.id}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between space-y-2 ${
                      isUnlocked
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-md shadow-amber-500/10'
                        : 'bg-slate-950/60 border-slate-800/80 opacity-50'
                    }`}
                  >
                    <div className="text-3xl filter drop-shadow-md">{b.icon}</div>
                    <div>
                      <div className="text-xs font-bold text-white line-clamp-1">{b.name}</div>
                      <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                        {b.rarity ? b.rarity.toUpperCase() : 'SPECIAL'} • +50 XP
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        isUnlocked
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isUnlocked ? 'ปลดล็อกแล้ว' : 'ยังไม่ปลดล็อก'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: ใบงานเก็บคะแนน 6 บท และข้อคิดเห็นจากคุณครู (Worksheets & Teacher Feedback Hub) */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-lg text-white font-['Chakra_Petch']">
                    ใบงานเก็บคะแนน & ผลการตรวจจากคุณครู (Worksheets & Teacher Feedback)
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  ติดตามสถานะการส่งใบงาน คะแนนที่ได้รับ และข้อเสนอแนะพัฒนาตนเองจากคุณครูผู้สอน
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessons.map((l) => {
                const ws = StorageService.getWorksheetByChapter(l.chapterNumber);
                const allSubs = StorageService.getWorksheetSubmissions();
                const sub = allSubs.find(
                  (s) =>
                    (s.chapterNumber === l.chapterNumber || (ws && s.worksheetId === ws.id)) &&
                    s.userId === user.id
                );

                return (
                  <div
                    key={l.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                      sub?.gradedAt
                        ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                        : sub
                        ? 'bg-amber-950/20 border-amber-500/30'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          บทที่ {l.chapterNumber}
                        </span>
                        {sub?.gradedAt ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            ⭐ ตรวจแล้ว ({sub.score}/{ws?.maxScore || 20} คะแนน)
                          </span>
                        ) : sub ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ⏳ ส่งแล้ว (รอตรวจ)
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            ยังไม่ได้ส่ง
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-white text-xs line-clamp-1">{l.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {ws?.title || `ใบงานประจำบทที่ ${l.chapterNumber}`}
                      </p>

                      {sub?.feedback && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-[11px] text-slate-200">
                          <span className="font-bold text-emerald-400 block mb-0.5">
                            💬 ความเห็นจาก{sub.gradedBy || 'คุณครู'}:
                          </span>
                          <p className="italic text-slate-300">"{sub.feedback}"</p>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenLesson(l)}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-700/80"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{sub ? 'ดูใบงาน / คำแนะนำ' : 'ทำใบงานส่งคุณครู'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: ANALYTICS & CHARTS */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Competency Radar Chart (แผนภูมิใยแมงมุม 6 ด้าน) */}
          <CompetencyRadarChart progressList={progressList} lessons={lessons} />

          {/* Bar Chart comparing Game vs Quiz score across 6 chapters */}
          <ScoreComparisonChart progressList={progressList} lessons={lessons} />

          {/* Official Indicator Breakdown (ว 4.2 ม.1/1 - ว 4.2 ม.1/4) */}
          <CompetencyBreakdown
            progressList={progressList}
            lessons={lessons}
            onOpenLesson={onOpenLesson}
          />
        </div>
      )}

      {/* TAB 2: STAGES & QUESTS */}
      {activeTab === 'stages' && (
        <div className="space-y-8">
          {/* Daily Quests & Streak */}
          <DailyQuestsSection
            user={user}
            studentProfile={studentProfile}
            onXPClaimed={handleXPClaimed}
          />

          {/* 6 Cleared Stages with Stars */}
          <StageClearedSection
            lessons={lessons}
            progressList={progressList}
            badges={badges}
            userBadges={userBadges}
            onOpenLesson={onOpenLesson}
          />
        </div>
      )}

      {/* TAB 3: TROPHY & BADGES */}
      {activeTab === 'badges' && (
        <div className="space-y-8">
          {/* Certificate Promo Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/30 border border-amber-500/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl shrink-0">
                📜
              </div>
              <div>
                <h3 className="font-bold text-lg text-white font-['Chakra_Petch']">
                  เกียรติบัตรวิทยาการคำนวณ ม.1 สสวท.
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  เกียรติบัตรประกาศเกียรติคุณอย่างเป็นทางการ เมื่อพิชิตบทเรียนและสะสมแต้ม XP ถึงเกณฑ์มาตรฐาน สามารถสั่งพิมพ์หรือบันทึกเป็น PDF ได้
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCertificateModal(true)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl transition-all hover:scale-105 shrink-0 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>เปิดดู & พิมพ์เกียรติบัตร</span>
            </button>
          </div>

          {/* Badges Showcase Grid */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-white font-['Chakra_Petch'] flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span>หอเกียรติยศเหรียญตรา (Badge Showcase)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  เหรียญรางวัลพิเศษที่ได้รับจากการพิชิตด่านและทำคะแนนได้ยอดเยี่ยม
                </p>
              </div>
              <span className="text-xs text-slate-400">
                ครอบครองแล้ว {userBadges.length} จาก {badges.length} เหรียญ
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {badges.map((b) => {
                const isUnlocked = userBadges.includes(b.id);
                return (
                  <div
                    key={b.id}
                    className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-between ${
                      isUnlocked
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-lg scale-100'
                        : 'bg-slate-950/60 border-slate-800 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="text-3xl sm:text-4xl my-2">{b.icon || '🎖️'}</div>
                    <div>
                      <div className="text-xs font-bold text-white truncate max-w-[120px]">
                        {b.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        {b.description}
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] font-semibold">
                      {isUnlocked ? (
                        <span className="text-emerald-400">✓ ปลดล็อกแล้ว</span>
                      ) : (
                        <span>🔒 ยังไม่ปลดล็อก</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CHAPTER PROGRESS TABLE */}
      {activeTab === 'table' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="font-bold text-lg text-white font-['Chakra_Petch'] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span>รายละเอียดความก้าวหน้าทั้ง 6 บทเรียน</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3 px-3">บทเรียน</th>
                  <th className="pb-3 px-3">สถานะ</th>
                  <th className="pb-3 px-3">คะแนนมินิเกม</th>
                  <th className="pb-3 px-3">คะแนนแบบทดสอบ</th>
                  <th className="pb-3 px-3">XP ที่ได้</th>
                  <th className="pb-3 px-3 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {lessons.map((lesson) => {
                  const prog = progressList.find((p) => p.lessonId === lesson.id);
                  const isCompleted = prog?.status === 'completed';

                  return (
                    <tr key={lesson.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-white">
                          บทที่ {lesson.chapterNumber}: {lesson.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {lesson.description}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        {isCompleted ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                            สำเร็จแล้ว
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs">
                            ยังไม่สำเร็จ
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-semibold text-amber-400">
                        {lesson.chapterNumber === 7 ? (
                          <span className="text-slate-400 text-xs italic">ไม่มีมินิเกม (สอบล้วนๆ)</span>
                        ) : prog?.gameScore !== undefined ? (
                          `${prog.gameScore} คะแนน`
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-semibold text-emerald-400">
                        {lesson.chapterNumber === 7 ? (
                          <span>{prog?.quizScore !== undefined ? `${prog.quizScore} / 30 ข้อ` : 'ยังไม่ได้ทำ'}</span>
                        ) : prog?.quizScore !== undefined ? (
                          `${prog.quizScore} / ${lesson.quiz?.questions?.length || 5}`
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-bold text-amber-300">
                        +{prog?.xpEarned || 0} XP
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => onOpenLesson(lesson)}
                          className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-colors"
                        >
                          {isCompleted ? 'ทบทวน' : 'เข้าเรียน'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: TEACHER FEEDBACK & MAILBOX (กล่องจดหมาย & ฟีดแบ็กจากคุณครู) */}
      {activeTab === 'mailbox' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Mail className="w-6 h-6 text-indigo-400" />
                  <h3 className="font-bold text-lg text-white font-['Chakra_Petch']">
                    กล่องจดหมายแจ้งเตือนผลการตรวจใบงาน & ฟีดแบ็ก (Teacher Mailbox)
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  รวบรวมข้อเสนอแนะ ผลคะแนน และคำแนะนำเฉพาะบุคคลจากคุณครูผู้สอนเพื่อยกระดับทักษะของคุณ
                </p>
              </div>

              {unreadFeedbackCount > 0 && (
                <button
                  onClick={() => {
                    StorageService.markAllFeedbackAsRead(user.id);
                    onProfileUpdated();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>อ่านทั้งหมดแล้ว</span>
                </button>
              )}
            </div>

            {teacherFeedbacks.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto text-slate-500">
                  <Inbox className="w-8 h-8" />
                </div>
                <div className="text-slate-300 font-bold text-sm">
                  ยังไม่มีจดหมายฟีดแบ็กจากคุณครู
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  เมื่อคุณครูทำการตรวจใบงานเก็บคะแนนทั้ง 6 บทเรียนของคุณ ผลคะแนนและคำแนะนำจะถูกส่งมายังที่นี่ทันที
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teacherFeedbacks.map((fb) => {
                  const targetLesson = lessons.find((l) => l.chapterNumber === fb.chapterNumber);
                  const isUnread = !fb.read;

                  return (
                    <div
                      key={fb.id}
                      className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                        isUnread
                          ? 'bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-500/60 ring-1 ring-indigo-500/20 shadow-lg'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {isUnread && (
                        <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse ring-4 ring-indigo-400/20" />
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-lg">
                            👨‍🏫
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">
                                {fb.teacherName || 'คุณครูผู้สอน'}
                              </span>
                              {fb.chapterNumber && (
                                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                                  บทที่ {fb.chapterNumber}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>
                                {new Date(fb.createdAt).toLocaleDateString('th-TH', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })} น.
                              </span>
                            </div>
                          </div>
                        </div>

                        {fb.score !== undefined && (
                          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                            <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-emerald-400" />
                              <span>ผลคะแนนใบงานที่ได้รับ:</span>
                            </span>
                            <span className="text-xs font-black text-emerald-400 font-mono">
                              {fb.score} / {fb.maxScore || 10} คะแนน
                            </span>
                          </div>
                        )}

                        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200">
                          <div className="flex items-center gap-1 text-amber-400 text-[11px] font-bold mb-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>ข้อคิดเห็นและคำแนะนำ:</span>
                          </div>
                          <p className="italic text-slate-300 leading-relaxed">
                            "{fb.message}"
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <button
                          onClick={() => {
                            StorageService.markFeedbackAsRead(fb.id);
                            onProfileUpdated();
                          }}
                          className="text-[11px] text-slate-400 hover:text-slate-200"
                        >
                          {isUnread ? 'คลิกเพื่ออ่านแล้ว' : 'อ่านแล้ว'}
                        </button>

                        {targetLesson && (
                          <button
                            onClick={() => {
                              StorageService.markFeedbackAsRead(fb.id);
                              onOpenLesson(targetLesson, 'worksheet');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>ดูใบงานบทที่ {fb.chapterNumber} →</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: LEADERBOARD & PEER COMPARISON */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6 text-left">
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-amber-400" />
                  <h3 className="font-bold text-xl text-white font-['Chakra_Petch']">
                    ตารางจัดอันดับคะแนนเทียบเพื่อนในห้องเรียน (Classroom Leaderboard)
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  ระบบจัดอันดับคะแนนสะสม (⭐ ตอบถูกได้ข้อละ 10 คะแนน) และเหรียญรางวัล เทียบกับเพื่อนในชั้นเรียน ม.1
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowLeaderboardModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-105 cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Trophy className="w-4 h-4 text-slate-950" />
                <span>เปิดโหมดอันดับเต็มจอ (Full View)</span>
              </button>
            </div>

            {/* My Rank Summary Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-950 to-indigo-950/40 border border-amber-500/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg shrink-0">
                  <Trophy className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base sm:text-lg font-black text-white font-['Chakra_Petch']">
                      {user.name}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                      ห้อง {studentProfile?.classroom || 'ม.1/1'} • เลขที่ {studentProfile?.seatNumber || 1}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                      Level {level}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    คะแนนสะสม: <strong className="text-amber-300">{totalXP} XP</strong> • เหรียญตรา: <strong className="text-yellow-300">{userBadges.length} เหรียญ</strong> • ด่านที่ผ่าน: <strong className="text-emerald-300">{completedCount} / 6 บท</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">สถานะอันดับในห้อง</div>
                  <div className="text-lg font-black text-amber-400 font-['Chakra_Petch']">
                    ★ กลุ่มผู้นำ (Top Rank)
                  </div>
                </div>
              </div>
            </div>

            {/* Embedded Leaderboard Full Component Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Rank 1 */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-500/20 via-slate-950 to-slate-950 border border-amber-500/40 text-center relative overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center mx-auto mb-2 shadow-lg">
                  🥇 1
                </div>
                <img
                  src="https://api.dicebear.com/7.x/bottts/svg?seed=student-2"
                  alt="มนัสนันท์"
                  className="w-16 h-16 rounded-2xl mx-auto bg-slate-800 border-2 border-amber-400 mb-2 object-cover"
                />
                <h4 className="font-bold text-sm text-white font-['Chakra_Petch']">เด็กหญิงมนัสนันท์ ขยันเรียน</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">ห้อง ม.1/1 • เลขที่ 2</p>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold">⭐ 480 คะแนน</span>
                  <span className="px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold">Lv.5</span>
                </div>
              </div>

              {/* Rank 2 (Current User or peer) */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-800/40 via-slate-950 to-slate-950 border border-slate-700 text-center relative overflow-hidden ring-2 ring-indigo-500/40">
                <div className="w-10 h-10 rounded-full bg-slate-300 text-slate-950 font-black text-sm flex items-center justify-center mx-auto mb-2 shadow-lg">
                  🥈 2
                </div>
                <img
                  src={user.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=Adventure'}
                  alt={user.name}
                  className="w-16 h-16 rounded-2xl mx-auto bg-slate-800 border-2 border-indigo-400 mb-2 object-cover"
                />
                <h4 className="font-bold text-sm text-indigo-300 font-['Chakra_Petch']">{user.name} (คุณ)</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">ห้อง {studentProfile?.classroom || 'ม.1/1'} • เลขที่ {studentProfile?.seatNumber || 1}</p>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold">⭐ {Math.max(380, totalXP / 3)} คะแนน</span>
                  <span className="px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold">Lv.{level}</span>
                </div>
              </div>

              {/* Rank 3 */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-700/20 via-slate-950 to-slate-950 border border-amber-700/30 text-center relative overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-amber-600 text-slate-950 font-black text-sm flex items-center justify-center mx-auto mb-2 shadow-lg">
                  🥉 3
                </div>
                <img
                  src="https://api.dicebear.com/7.x/bottts/svg?seed=student-4"
                  alt="กัญญารัตน์"
                  className="w-16 h-16 rounded-2xl mx-auto bg-slate-800 border-2 border-amber-600 mb-2 object-cover"
                />
                <h4 className="font-bold text-sm text-white font-['Chakra_Petch']">เด็กหญิงกัญญารัตน์ ฉลาดคิด</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">ห้อง ม.1/1 • เลขที่ 4</p>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold">⭐ 390 คะแนน</span>
                  <span className="px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold">Lv.4</span>
                </div>
              </div>
            </div>

            {/* Quick Actions to Open Full Modal */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <h4 className="font-bold text-sm text-white">ต้องการตรวจสอบตารางรายชื่อเพื่อนทุกคนในห้องหรือไม่?</h4>
                <p className="text-xs text-slate-400 mt-0.5">ดูรายชื่อเพื่อนร่วมห้อง ม.1/1 และ ม.1/2 ทั้งหมด พร้อมจำนวนด่านที่ผ่านและเหรียญรางวัล</p>
              </div>
              <button
                type="button"
                onClick={() => setShowLeaderboardModal(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow"
              >
                <span>เปิดตารางอันดับแบบเต็ม →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {showCertificateModal && (
        <CertificateModal
          user={user}
          studentProfile={studentProfile}
          totalXP={totalXP}
          completedLessonsCount={completedCount}
          onClose={() => setShowCertificateModal(false)}
        />
      )}

      {/* Edit Student Profile Modal */}
      {showEditProfileModal && (
        <StudentProfileEditModal
          isOpen={showEditProfileModal}
          user={user}
          studentProfile={studentProfile}
          onClose={() => setShowEditProfileModal(false)}
          onProfileUpdated={() => {
            onProfileUpdated();
          }}
        />
      )}

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
        currentUser={user}
        currentStudent={studentProfile}
      />
    </div>
  );
};
