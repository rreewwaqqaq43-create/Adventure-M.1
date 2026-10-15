/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Lesson, StudentProgress, Badge } from '../../types';
import {
  Gamepad2,
  Star,
  Trophy,
  CheckCircle2,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface StageClearedSectionProps {
  lessons: Lesson[];
  progressList: StudentProgress[];
  badges: Badge[];
  userBadges: string[];
  onOpenLesson: (lesson: Lesson) => void;
}

export const StageClearedSection: React.FC<StageClearedSectionProps> = ({
  lessons,
  progressList,
  badges,
  userBadges,
  onOpenLesson,
}) => {
  // Game details per chapter
  const stageMeta: Record<
    number,
    {
      stageName: string;
      subTitle: string;
      gameType: string;
      color: string;
      icon: string;
      badgeName: string;
    }
  > = {
    1: {
      stageName: 'ด่าน 1: ขุมทรัพย์นามธรรม',
      subTitle: 'แยกขยะอัจฉริยะ & คัดกรองสาระสำคัญ',
      gameType: 'Drag & Drop Feature Sorting',
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-300',
      icon: '💎',
      badgeName: 'ผู้ค้นพบแก่นแท้',
    },
    2: {
      stageName: 'ด่าน 2: ทางวงกตของอัลกอริทึม',
      subTitle: 'เขียนคำสั่งบล็อกแก้ปริศนา & รหัสลำลอง',
      gameType: 'Blockly Logic Maze Runner',
      color: 'from-indigo-500/20 to-blue-500/20 border-indigo-500/40 text-indigo-300',
      icon: '🧭',
      badgeName: 'นักวางผังงาน',
    },
    3: {
      stageName: 'ด่าน 3: สวนผลไม้ Scratch มหัศจรรย์',
      subTitle: 'จับผลไม้ด้วยบล็อกการเคลื่อนที่ & พิกัด X, Y',
      gameType: 'Interactive Scratch Fruit Catcher',
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-300',
      icon: '🍎',
      badgeName: 'จอมเวท Scratch',
    },
    4: {
      stageName: 'ด่าน 4: หอคอยลอจิกวนซ้ำ',
      subTitle: 'จับจังหวะลูปซ้ำ & การตัดสินใจ If-Else',
      gameType: 'Condition & Loop Speed Challenge',
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/40 text-purple-300',
      icon: '⚡',
      badgeName: 'ปรมาจารย์ลูปซ้ำ',
    },
    5: {
      stageName: 'ด่าน 5: กำแพงพิทักษ์ไซเบอร์',
      subTitle: 'ตรวจจับฟิชชิ่ง & ตั้งรหัสผ่านสุดแกร่ง',
      gameType: 'Cyber Scam Defender & Firewall',
      color: 'from-rose-500/20 to-red-500/20 border-rose-500/40 text-rose-300',
      icon: '🛡️',
      badgeName: 'ผู้พิทักษ์ไซเบอร์',
    },
    6: {
      stageName: 'ด่าน 6: สัญญาอนุญาตเสรี & แฟร์ยูส',
      subTitle: 'จำแนกเครื่องหมาย Creative Commons & สิทธิเผยแพร่',
      gameType: 'Creative Commons Card Matcher',
      color: 'from-cyan-500/20 to-sky-500/20 border-cyan-500/40 text-cyan-300',
      icon: '⚖️',
      badgeName: 'ทูตจริยธรรมดิจิทัล',
    },
  };

  // Calculate total stars
  let totalStars = 0;
  let clearedCount = 0;

  const stageStatuses = lessons.map((lesson) => {
    const prog = progressList.find((p) => p.lessonId === lesson.id);
    const score = prog?.gameScore || 0;
    const isCompleted = prog?.status === 'completed';
    const isUnlocked = true; // All 6 stages accessible

    // Calculate stars: 0, 1, 2, or 3
    let stars = 0;
    if (score >= 90) stars = 3;
    else if (score >= 60) stars = 2;
    else if (score >= 30) stars = 1;

    if (isCompleted) clearedCount++;
    totalStars += stars;

    const hasBadge = userBadges.includes(lesson.badgeRewardId || '');

    return {
      lesson,
      prog,
      score,
      stars,
      isCompleted,
      isUnlocked,
      hasBadge,
      meta: stageMeta[lesson.chapterNumber] || {
        stageName: `ด่าน ${lesson.chapterNumber}`,
        subTitle: lesson.title,
        gameType: 'Mini-Game',
        color: 'from-slate-800 to-slate-900 border-slate-700 text-slate-300',
        icon: '🎮',
        badgeName: 'เหรียญเกียรติยศ',
      },
    };
  });

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
      {/* Header with Star Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-lg text-white font-['Chakra_Petch']">
              บันทึกการพิชิตด่านมินิเกม (Cleared Stages & Adventure Stats)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            สถิติด่านที่ผ่าน คะแนนสูงสุด และการสะสมดวงดาวแห่งปัญญาครบทั้ง 6 ด่าน
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Stars Box */}
          <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <div>
              <div className="text-[10px] text-slate-400">ดวงดาวที่เก็บได้</div>
              <div className="text-base font-black text-amber-300 font-['Chakra_Petch']">
                {totalStars} / 18 ⭐
              </div>
            </div>
          </div>

          {/* Cleared Count Box */}
          <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400">ด่านที่ผ่านแล้ว</div>
              <div className="text-base font-black text-emerald-300 font-['Chakra_Petch']">
                {clearedCount} / 6 ด่าน
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of 6 Stages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stageStatuses.map(({ lesson, prog, score, stars, isCompleted, hasBadge, meta }) => (
          <div
            key={lesson.id}
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden group ${
              isCompleted
                ? 'bg-slate-950/80 border-slate-700 hover:border-amber-400/60 shadow-lg'
                : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            {/* Ambient subtle glow if completed */}
            {isCompleted && (
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
            )}

            <div className="space-y-3">
              {/* Header Badge & Chapter */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{meta.icon}</span>
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      บทที่ {lesson.chapterNumber}
                    </span>
                  </div>
                </div>

                {/* Stars display */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((starIdx) => (
                    <Star
                      key={starIdx}
                      className={`w-4 h-4 ${
                        starIdx <= stars
                          ? 'text-amber-400 fill-amber-400 drop-shadow'
                          : 'text-slate-700 fill-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Title and game type */}
              <div>
                <h4 className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">
                  {meta.stageName}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                  {meta.subTitle}
                </p>
                <div className="text-[11px] text-slate-500 font-mono mt-1">
                  โหมด: {meta.gameType}
                </div>
              </div>

              {/* Stats Bar */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">คะแนนสูงสุด:</span>
                  <span className="font-bold text-amber-300 font-['Chakra_Petch']">
                    {score > 0 ? `${score} คะแนน` : 'ยังไม่มีคะแนน'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">สถานะด่าน:</span>
                  {isCompleted ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      พิชิตสำเร็จ
                    </span>
                  ) : score > 0 ? (
                    <span className="text-amber-400 font-semibold">กำลังผจญภัย</span>
                  ) : (
                    <span className="text-slate-500">ยังไม่ได้เริ่ม</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">เหรียญตรา:</span>
                  <span className={hasBadge ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                    {hasBadge ? `🎖️ ${meta.badgeName}` : '🔒 ล็อกอยู่'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action button */}
            <div className="pt-4 mt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500">
                {stars === 3 ? '🌟 ยอดเยี่ยม 3 ดาว!' : `เก็บเพิ่มอีก ${3 - stars} ดาว`}
              </span>

              <button
                onClick={() => onOpenLesson(lesson)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isCompleted
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md hover:scale-105'
                }`}
              >
                {isCompleted ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>เล่นซ้ำ</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>เริ่มลุยด่าน</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
