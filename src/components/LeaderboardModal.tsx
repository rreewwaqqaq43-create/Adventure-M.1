/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { User, StudentProfile } from '../types';
import { StorageService } from '../services/storage';
import {
  Trophy,
  Award,
  Star,
  TrendingUp,
  Target,
  Users,
  Medal,
  Crown,
  ChevronUp,
  X,
  Sparkles,
  Flame,
  CheckCircle2,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  currentStudent?: StudentProfile | null;
}

interface RankedStudent {
  userId: string;
  name: string;
  studentId: string;
  classroom: string;
  seatNumber: number;
  avatarUrl: string;
  level: number;
  xp: number;
  starPoints: number; // ตอบถูกข้อละ 10 คะแนน
  badgesCount: number; // 🏆 เหรียญรางวัล
  completedStages: number; // 🎯 ภารกิจผ่านด่าน
  isCurrentUser: boolean;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentStudent,
}) => {
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('my_class');
  const [showGuide, setShowGuide] = useState(false);

  // Compute live rankings
  const rankings = useMemo(() => {
    const defaultClassroom = currentStudent?.classroom || 'ม.1/1';
    const users = StorageService.getUsers().filter((u) => u.role === 'student');
    const profiles = StorageService.getStudentProfiles();
    const attempts = StorageService.getQuizAttempts();

    // Default seeded classmates if needed
    const studentSeedList = [
      { id: 'student-2', name: 'เด็กหญิงมนัสนันท์ ขยันเรียน', classroom: 'ม.1/1', seat: 2, xp: 1250, level: 5, stars: 480, badges: 6, stages: 5 },
      { id: 'student-1', name: 'เด็กชายปภพ สุขใจ', classroom: 'ม.1/1', seat: 1, xp: 850, level: 3, stars: 320, badges: 3, stages: 3 },
      { id: 'student-3', name: 'เด็กชายธนวินท์ รวดเร็ว', classroom: 'ม.1/1', seat: 3, xp: 520, level: 2, stars: 210, badges: 2, stages: 2 },
      { id: 'student-4', name: 'เด็กหญิงกัญญารัตน์ ฉลาดคิด', classroom: 'ม.1/1', seat: 4, xp: 980, level: 4, stars: 390, badges: 4, stages: 4 },
      { id: 'student-5', name: 'เด็กชายชลธีร์ เทคโนลอยด์', classroom: 'ม.1/1', seat: 5, xp: 420, level: 2, stars: 160, badges: 1, stages: 1 },
      { id: 'student-6', name: 'เด็กหญิงพิมพ์มาดา รักเรียน', classroom: 'ม.1/2', seat: 1, xp: 1100, level: 4, stars: 430, badges: 5, stages: 4 },
      { id: 'student-7', name: 'เด็กชายวรเมธ วิทยาการ', classroom: 'ม.1/2', seat: 2, xp: 940, level: 3, stars: 370, badges: 4, stages: 3 },
      { id: 'student-8', name: 'เด็กหญิงณิชาภา โค้ดแล็บ', classroom: 'ม.1/2', seat: 3, xp: 680, level: 3, stars: 260, badges: 3, stages: 2 },
    ];

    const currentUserId = currentUser?.id || 'anonymous-student';
    const currentUserProgress = StorageService.getProgress(currentUserId);
    const currentUserBadges = StorageService.getUserBadges(currentUserId);
    const currentUserAttempts = attempts.filter((a) => a.userId === currentUserId);

    // Calculate current user's star points (⭐ ตอบถูกข้อละ 10 คะแนน)
    const quizCorrectCount = currentUserAttempts.reduce((acc, a) => acc + (a.score || 0), 0);
    const calculatedStarPoints = (quizCorrectCount * 10) + Math.round((currentStudent?.xp || 0) / 4);

    const completedStagesCount = currentUserProgress.filter((p) => p.status === 'completed').length;

    const list: RankedStudent[] = studentSeedList.map((seed) => {
      const isMe = seed.id === currentUserId;
      if (isMe) {
        return {
          userId: currentUserId,
          name: currentUser?.name || 'คุณ (นักเรียน)',
          studentId: currentStudent?.studentId || '6701001',
          classroom: currentStudent?.classroom || defaultClassroom,
          seatNumber: currentStudent?.seatNumber || 1,
          avatarUrl: currentUser?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUserId}`,
          level: currentStudent?.level || 1,
          xp: currentStudent?.xp || 100,
          starPoints: Math.max(seed.stars, calculatedStarPoints),
          badgesCount: Math.max(seed.badges, currentUserBadges.length),
          completedStages: Math.max(seed.stages, completedStagesCount),
          isCurrentUser: true,
        };
      }
      return {
        userId: seed.id,
        name: seed.name,
        studentId: `670100${seed.seat}`,
        classroom: seed.classroom,
        seatNumber: seed.seat,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${seed.id}`,
        level: seed.level,
        xp: seed.xp,
        starPoints: seed.stars,
        badgesCount: seed.badges,
        completedStages: seed.stages,
        isCurrentUser: false,
      };
    });

    // If current user is not in seed list, inject them
    if (!list.some((s) => s.isCurrentUser)) {
      list.push({
        userId: currentUserId,
        name: currentUser?.name || 'คุณ (นักเรียน)',
        studentId: currentStudent?.studentId || '6701001',
        classroom: currentStudent?.classroom || defaultClassroom,
        seatNumber: currentStudent?.seatNumber || 1,
        avatarUrl: currentUser?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUserId}`,
        level: currentStudent?.level || 1,
        xp: currentStudent?.xp || 100,
        starPoints: Math.max(100, calculatedStarPoints),
        badgesCount: currentUserBadges.length,
        completedStages: completedStagesCount,
        isCurrentUser: true,
      });
    }

    // Sort descending by star points, then by level, then by xp
    return list.sort((a, b) => b.starPoints - a.starPoints || b.level - a.level || b.xp - a.xp);
  }, [currentUser, currentStudent]);

  const myClassroom = currentStudent?.classroom || 'ม.1/1';

  // Filter list by classroom
  const filteredRankings = useMemo(() => {
    if (selectedClassFilter === 'my_class') {
      return rankings.filter((s) => s.classroom === myClassroom);
    }
    if (selectedClassFilter === 'all') {
      return rankings;
    }
    return rankings.filter((s) => s.classroom === selectedClassFilter);
  }, [rankings, selectedClassFilter, myClassroom]);

  // Find my current standing
  const myIndexInFiltered = filteredRankings.findIndex((s) => s.isCurrentUser);
  const myRank = myIndexInFiltered >= 0 ? myIndexInFiltered + 1 : 1;
  const myData = filteredRankings[myIndexInFiltered] || rankings.find((s) => s.isCurrentUser) || filteredRankings[0];
  const firstPlace = filteredRankings[0];
  const diffToFirst = firstPlace && myData ? Math.max(0, firstPlace.starPoints - myData.starPoints) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 text-2xl">
              🥇
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold tracking-wider uppercase border border-amber-500/40">
                  CLASSROOM LEADERBOARD
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  • จัดอันดับคะแนนจริงเทียบกับเพื่อนร่วมห้อง
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white font-['Chakra_Petch'] mt-0.5 flex items-center gap-2">
                <span>กระดานจัดอันดับคะแนน & เกียรติยศ (Leaderboard)</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
              title="วิธีเก็บคะแนนและไต่อันดับ"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">เกณฑ์เก็บคะแนน</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Gamification Guide Accordion */}
        {showGuide && (
          <div className="p-4 bg-slate-950 border-b border-amber-500/30 text-xs space-y-2.5 animate-fade-in">
            <div className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
              <Sparkles className="w-4 h-4" />
              <span>กติกาและระบบเกมมิฟิเคชั่น (Gamification Rules):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-slate-300">
              <div className="p-3 bg-slate-900 rounded-xl border border-amber-500/30">
                <div className="font-bold text-amber-400 flex items-center gap-1 mb-1">
                  <span>⭐ ได้คะแนน</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  ตอบคำถามแบบทดสอบถูกได้รับ <strong className="text-white">10 คะแนน / ข้อ</strong> (เช่น สอบ 30 ข้อได้ 300 คะแนน)
                </p>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-indigo-500/30">
                <div className="font-bold text-indigo-400 flex items-center gap-1 mb-1">
                  <span>🏆 ได้รางวัล/เหรียญ</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  ทำภารกิจและสอบผ่านเกณฑ์ <strong className="text-white">60% ขึ้นไป</strong> จะปลดล็อคเหรียญรางวัลประจำด่าน
                </p>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-emerald-500/30">
                <div className="font-bold text-emerald-400 flex items-center gap-1 mb-1">
                  <span>📈 มีเลเวล</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  สะสม XP จากการเรียน มินิเกม และทำแบบทดสอบเพื่อเลื่อนจาก <strong className="text-white">Level 1 → Level 2 → Level 3+</strong>
                </p>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-rose-500/30">
                <div className="font-bold text-rose-400 flex items-center gap-1 mb-1">
                  <span>🎯 มีภารกิจ</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  ทำโจทย์ก่อนเรียน มินิเกม และหลังเรียนให้สำเร็จเพื่อ <strong className="text-white">ผ่านด่าน 1-7</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Comparison Hero Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-purple-500/15 border-2 border-amber-500/40 relative overflow-hidden shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={myData?.avatarUrl}
                    alt={myData?.name}
                    className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-amber-400 object-cover shadow"
                  />
                  <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[10px]">
                    อันดับ {myRank}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
                      ตำแหน่งของคุณ (Your Rank)
                    </span>
                    <span className="text-xs text-slate-400">ห้อง {myData?.classroom} เลขที่ {myData?.seatNumber}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white font-['Chakra_Petch'] mt-0.5">
                    {myData?.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs">
                    <span className="flex items-center gap-1 font-bold text-amber-300">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{myData?.starPoints} คะแนนสะสม (⭐ ข้อละ 10 คะแนน)</span>
                    </span>
                    <span className="flex items-center gap-1 text-indigo-300 font-semibold">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Level {myData?.level}</span>
                    </span>
                    <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                      <Award className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{myData?.badgesCount} เหรียญ</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Note */}
              <div className="sm:text-right pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                <div className="text-xs text-slate-400">สถานะการแข่งขันในห้องเรียน</div>
                <div className="mt-1">
                  {myRank === 1 ? (
                    <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/40 inline-flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>🎉 คุณครองอันดับที่ 1 ของห้องเรียน!</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 font-medium text-xs border border-indigo-500/40 inline-flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <span>ตามหลังอันดับ 1 ({firstPlace?.name}) อยู่ <strong className="text-amber-300 font-bold">{diffToFirst} คะแนน</strong></span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  ทำแบบทดสอบให้ถูกต้องและพิชิตมินิเกม เพื่อแซงขึ้นอันดับสูงขึ้น!
                </p>
              </div>
            </div>
          </div>

          {/* Classroom Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-300">ตัวกรองห้องเรียน:</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setSelectedClassFilter('my_class')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  selectedClassFilter === 'my_class'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ห้องของฉัน ({myClassroom})
              </button>
              <button
                type="button"
                onClick={() => setSelectedClassFilter('ม.1/1')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  selectedClassFilter === 'ม.1/1'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ม.1/1
              </button>
              <button
                type="button"
                onClick={() => setSelectedClassFilter('ม.1/2')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  selectedClassFilter === 'ม.1/2'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ม.1/2
              </button>
              <button
                type="button"
                onClick={() => setSelectedClassFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  selectedClassFilter === 'all'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                รวมทั้งระดับชั้น ม.1 ({rankings.length} คน)
              </button>
            </div>
          </div>

          {/* Top 3 Podium Cards */}
          {filteredRankings.length >= 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {/* 2nd Place */}
              <div className="order-2 sm:order-1 p-4 rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900 border border-slate-700/80 flex flex-col items-center text-center shadow-lg relative">
                <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-950 font-black flex items-center justify-center text-sm shadow mb-2">
                  🥈 2
                </div>
                <img
                  src={filteredRankings[1].avatarUrl}
                  alt={filteredRankings[1].name}
                  className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-slate-400 object-cover mb-2"
                />
                <h4 className="font-bold text-sm text-white font-['Chakra_Petch'] truncate max-w-full">
                  {filteredRankings[1].name}
                </h4>
                <div className="text-[11px] text-slate-400">ห้อง {filteredRankings[1].classroom} เลขที่ {filteredRankings[1].seatNumber}</div>
                <div className="mt-2 text-xs font-bold text-amber-300 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{filteredRankings[1].starPoints} คะแนน</span>
                </div>
                <div className="text-[10px] text-indigo-300 font-semibold mt-0.5">Level {filteredRankings[1].level} • {filteredRankings[1].badgesCount} เหรียญ</div>
              </div>

              {/* 1st Place */}
              <div className="order-1 sm:order-2 p-5 rounded-2xl bg-gradient-to-b from-amber-950/70 via-slate-900 to-amber-950/40 border-2 border-amber-400/80 flex flex-col items-center text-center shadow-2xl relative sm:-translate-y-2">
                <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow-lg">
                  <Crown className="w-3.5 h-3.5" />
                  <span>อันดับ 1 ของห้อง</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-lg shadow-lg mb-2 mt-1">
                  🥇
                </div>
                <img
                  src={filteredRankings[0].avatarUrl}
                  alt={filteredRankings[0].name}
                  className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-amber-400 object-cover mb-2 ring-4 ring-amber-400/20"
                />
                <h4 className="font-black text-base text-amber-300 font-['Chakra_Petch'] truncate max-w-full">
                  {filteredRankings[0].name}
                </h4>
                <div className="text-xs text-slate-300 font-medium">ห้อง {filteredRankings[0].classroom} เลขที่ {filteredRankings[0].seatNumber}</div>
                <div className="mt-2 text-sm font-black text-amber-400 flex items-center gap-1 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{filteredRankings[0].starPoints} คะแนนสะสม</span>
                </div>
                <div className="text-xs text-indigo-300 font-bold mt-1">Level {filteredRankings[0].level} • 🏆 {filteredRankings[0].badgesCount} เหรียญรางวัล</div>
              </div>

              {/* 3rd Place */}
              <div className="order-3 p-4 rounded-2xl bg-gradient-to-b from-amber-950/30 to-slate-900 border border-amber-700/50 flex flex-col items-center text-center shadow-lg relative">
                <div className="w-8 h-8 rounded-full bg-amber-700 text-amber-100 font-black flex items-center justify-center text-sm shadow mb-2">
                  🥉 3
                </div>
                <img
                  src={filteredRankings[2].avatarUrl}
                  alt={filteredRankings[2].name}
                  className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-amber-700 object-cover mb-2"
                />
                <h4 className="font-bold text-sm text-white font-['Chakra_Petch'] truncate max-w-full">
                  {filteredRankings[2].name}
                </h4>
                <div className="text-[11px] text-slate-400">ห้อง {filteredRankings[2].classroom} เลขที่ {filteredRankings[2].seatNumber}</div>
                <div className="mt-2 text-xs font-bold text-amber-300 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{filteredRankings[2].starPoints} คะแนน</span>
                </div>
                <div className="text-[10px] text-indigo-300 font-semibold mt-0.5">Level {filteredRankings[2].level} • {filteredRankings[2].badgesCount} เหรียญ</div>
              </div>
            </div>
          )}

          {/* Full Rank Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
              <span>ตารางอันดับนักเรียนทั้งหมด ({filteredRankings.length} คน)</span>
              <span>เกณฑ์: ⭐ ตอบถูกได้ 10 คะแนน</span>
            </div>

            <div className="divide-y divide-slate-800/80">
              {filteredRankings.map((student, idx) => {
                const rankNum = idx + 1;
                const isMe = student.isCurrentUser;

                return (
                  <div
                    key={student.userId}
                    className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors ${
                      isMe
                        ? 'bg-amber-500/15 border-l-4 border-l-amber-400'
                        : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank Number */}
                      <div className="w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center shrink-0">
                        {rankNum === 1 ? (
                          <span className="text-xl">🥇</span>
                        ) : rankNum === 2 ? (
                          <span className="text-xl">🥈</span>
                        ) : rankNum === 3 ? (
                          <span className="text-xl">🥉</span>
                        ) : (
                          <span className="text-slate-400">#{rankNum}</span>
                        )}
                      </div>

                      {/* Avatar & Name */}
                      <img
                        src={student.avatarUrl}
                        alt={student.name}
                        className={`w-10 h-10 rounded-xl object-cover shrink-0 border ${
                          isMe ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-700'
                        }`}
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-xs sm:text-sm font-['Chakra_Petch'] truncate ${
                            isMe ? 'text-amber-300 font-black' : 'text-white'
                          }`}>
                            {student.name}
                          </span>
                          {isMe && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] shrink-0">
                              คุณ
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>ห้อง {student.classroom}</span>
                          <span>•</span>
                          <span>เลขที่ {student.seatNumber}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline text-indigo-300 font-semibold">📈 Level {student.level}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats & Points */}
                    <div className="flex items-center gap-4 shrink-0 text-right">
                      <div className="hidden sm:block">
                        <div className="text-xs text-slate-400">เหรียญ/ภารกิจ</div>
                        <div className="text-xs font-bold text-emerald-400">
                          🏆 {student.badgesCount} เหรียญ ({student.completedStages}/7 ด่าน)
                        </div>
                      </div>

                      <div>
                        <div className="text-xs sm:text-sm font-black text-amber-400 flex items-center gap-1 justify-end font-['Chakra_Petch']">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span>{student.starPoints}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">คะแนนสะสม</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>💡 คะแนนจะอัปเดตอัตโนมัติเมื่อทำแบบทดสอบหรือมินิเกมสำเร็จ</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
