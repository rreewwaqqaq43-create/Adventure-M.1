/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Star,
  Award,
  Sparkles,
  TrendingUp,
  X,
  ArrowRight,
  Flame,
  CheckCircle2,
  Crown
} from 'lucide-react';
import { sfx } from '../../utils/audioEffects';

export interface GamificationRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLeaderboard?: () => void;
  rewardType: 'minigame' | 'chapter_completed' | 'quiz_passed';
  title: string;
  subtitle: string;
  earnedCoins: number;
  earnedXp: number;
  newTotalCoins: number;
  newTotalXp: number;
  newLevel: number;
  isLevelUp?: boolean;
  badgeName?: string;
  badgeIcon?: string;
  classroom?: string;
  rankInClass?: number;
  totalInClass?: number;
}

export const GamificationRewardModal: React.FC<GamificationRewardModalProps> = ({
  isOpen,
  onClose,
  onOpenLeaderboard,
  rewardType,
  title,
  subtitle,
  earnedCoins,
  earnedXp,
  newTotalCoins,
  newTotalXp,
  newLevel,
  isLevelUp = false,
  badgeName,
  badgeIcon = '🏆',
  classroom = 'ม.1/1',
  rankInClass = 1,
  totalInClass = 8,
}) => {
  useEffect(() => {
    if (isOpen) {
      sfx.playVictory();
      setTimeout(() => sfx.playCoin(), 300);
      setTimeout(() => sfx.playCoin(), 600);

      // Trigger Confetti fanfare
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.5 },
          colors: ['#F59E0B', '#FBBF24', '#10B981', '#6366F1', '#EC4899'],
        });
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#F59E0B', '#10B981', '#FBBF24'],
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#6366F1', '#EC4899', '#38BDF8'],
          });
        }, 300);
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden relative text-slate-100 animate-scale-up">
        {/* Glow ambient backgrounds */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-44 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-0 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Banner Header */}
        <div className="p-6 sm:p-8 text-center relative z-10 border-b border-slate-800/80 bg-gradient-to-b from-amber-500/15 via-slate-900/40 to-slate-900">
          <div className="relative inline-block mb-3">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 p-1 shadow-xl shadow-amber-500/30 flex items-center justify-center animate-bounce">
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-4xl sm:text-5xl">
                {rewardType === 'minigame' ? '🎮' : '🏆'}
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs shadow-md border-2 border-slate-900 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>+{earnedCoins} 🪙</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs tracking-wider uppercase mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>กลไกเกมมิฟิเคชั่น • มอบรางวัลความสำเร็จ</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white font-['Chakra_Petch'] leading-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            {subtitle}
          </p>

          {isLevelUp && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/30 via-emerald-500/20 to-teal-500/30 border border-emerald-400/50 text-emerald-300 text-xs font-black animate-pulse">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>🎉 ยินดีด้วย! เลื่อนขั้นเป็น Level {newLevel} แล้ว!</span>
            </div>
          )}
        </div>

        {/* 4 Pillars Reward Grid */}
        <div className="p-5 sm:p-6 space-y-4 relative z-10">
          <div className="grid grid-cols-2 gap-3">
            {/* 1. เหรียญทอง (Coins) */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/30 flex items-center gap-3 shadow-inner">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-2xl flex items-center justify-center shrink-0">
                🪙
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-slate-400 font-bold block">เหรียญทองที่ได้รับ</span>
                <span className="text-base sm:text-lg font-black text-amber-400 font-['Chakra_Petch']">
                  +{earnedCoins} เหรียญ
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  รวมสะสม: {newTotalCoins} 🪙
                </span>
              </div>
            </div>

            {/* 2. คะแนนสะสม (XP) */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-indigo-500/30 flex items-center gap-3 shadow-inner">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
                <Star className="w-6 h-6 fill-indigo-400" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-slate-400 font-bold block">คะแนนและค่า XP</span>
                <span className="text-base sm:text-lg font-black text-indigo-300 font-['Chakra_Petch']">
                  +{earnedXp} XP
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  รวม: {newTotalXp} XP (Lv.{newLevel})
                </span>
              </div>
            </div>

            {/* 3. เหรียญรางวัลเกียรติยศ (Badge) */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-purple-500/30 flex items-center gap-3 shadow-inner">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-2xl flex items-center justify-center shrink-0">
                {badgeIcon}
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-slate-400 font-bold block">เหรียญรางวัลเกียรติยศ</span>
                <span className="text-xs sm:text-sm font-black text-purple-300 font-['Chakra_Petch'] truncate block">
                  {badgeName || 'เหรียญตรานักผจญภัย'}
                </span>
                <span className="text-[10px] text-emerald-400 block font-semibold">
                  ✓ ปลดล็อคสำเร็จ
                </span>
              </div>
            </div>

            {/* 4. อันดับในห้องเรียน (Leaderboard Standing) */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/30 flex items-center gap-3 shadow-inner">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                <Crown className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-slate-400 font-bold block">อันดับในห้องเรียน</span>
                <span className="text-base sm:text-lg font-black text-emerald-400 font-['Chakra_Petch']">
                  อันดับที่ {rankInClass}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  ห้อง {classroom} (จาก {totalInClass} คน)
                </span>
              </div>
            </div>
          </div>

          {/* Gamification Feedback Note */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-200">
            <Flame className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              คะแนนและเหรียญทองถูกนำไปคำนวณอันดับในกระดานคะแนน (Leaderboard) ของห้องเรียนทันที!
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            {onOpenLeaderboard && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLeaderboard();
                }}
                className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-105 cursor-pointer"
              >
                <Trophy className="w-4 h-4" />
                <span>🥇 ดูกระดานจัดอันดับ</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className={`w-full ${
                onOpenLeaderboard ? 'sm:w-1/2' : 'w-full'
              } py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-105 cursor-pointer`}
            >
              <span>ลุยด่านถัดไป</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
