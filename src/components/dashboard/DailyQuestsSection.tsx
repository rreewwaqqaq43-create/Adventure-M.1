/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { User, StudentProfile } from '../../types';
import { StorageService } from '../../services/storage';
import {
  Flame,
  CheckCircle2,
  Gift,
  Clock,
  Sparkles,
  Award,
  Calendar,
} from 'lucide-react';

interface DailyQuestsSectionProps {
  user: User;
  studentProfile: StudentProfile | null;
  onXPClaimed: () => void;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  progress: number;
  target: number;
  unit: string;
  completed: boolean;
  claimed: boolean;
  icon: string;
}

export const DailyQuestsSection: React.FC<DailyQuestsSectionProps> = ({
  user,
  studentProfile,
  onXPClaimed,
}) => {
  // Key for local storage quest tracking
  const questStorageKey = `adventure_quests_${user.id}`;
  const [claimedIds, setClaimedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(questStorageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const quests: Quest[] = [
    {
      id: 'quest-1',
      title: 'พิชิตมินิเกมได้ 2 ดาวขึ้นไป',
      description: 'เข้าเล่นมินิเกมบทใดก็ได้และทำคะแนนเพื่อคว้าดาวอย่างน้อย 2 ดาว',
      xpReward: 40,
      progress: 1,
      target: 1,
      unit: 'ครั้ง',
      completed: true,
      claimed: claimedIds.includes('quest-1'),
      icon: '⭐',
    },
    {
      id: 'quest-2',
      title: 'รับชมคลิปความรู้ สสวท. Project 14',
      description: 'เปิดดูวิดีโอเสริมการเรียนรู้ในคลังวิดีโออย่างน้อย 1 คลิป',
      xpReward: 30,
      progress: 1,
      target: 1,
      unit: 'คลิป',
      completed: true,
      claimed: claimedIds.includes('quest-2'),
      icon: '🎬',
    },
    {
      id: 'quest-3',
      title: 'ทำแบบทดสอบผ่านเกณฑ์ 80%',
      description: 'ทดสอบความรู้ท้ายบทเรียนและทำคะแนนได้ 4 ข้อขึ้นไป',
      xpReward: 60,
      progress: 1,
      target: 1,
      unit: 'บทเรียน',
      completed: true,
      claimed: claimedIds.includes('quest-3'),
      icon: '📝',
    },
    {
      id: 'quest-4',
      title: 'เช็กชื่อเข้าเรียนต่อเนื่อง (Daily Streak)',
      description: 'ล็อกอินเข้าสู่ระบบติดต่อกัน 3 วันเพื่อรับโบนัสนักผจญภัย',
      xpReward: 50,
      progress: 3,
      target: 3,
      unit: 'วัน',
      completed: true,
      claimed: claimedIds.includes('quest-4'),
      icon: '🔥',
    },
  ];

  const handleClaim = (quest: Quest) => {
    if (claimedIds.includes(quest.id)) return;
    const newClaimed = [...claimedIds, quest.id];
    setClaimedIds(newClaimed);
    try {
      localStorage.setItem(questStorageKey, JSON.stringify(newClaimed));
    } catch (e) {
      // ignore
    }

    // Award XP
    if (studentProfile) {
      const newXP = studentProfile.xp + quest.xpReward;
      const newLevel = Math.floor(newXP / 300) + 1;
      StorageService.updateStudentProfile({
        ...studentProfile,
        xp: newXP,
        level: newLevel,
      });
    }

    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    onXPClaimed();
  };

  const streakDays = 3;

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-lg text-white font-['Chakra_Petch']">
              ภารกิจประจำวัน & โบนัสสะสม (Daily Quests & Streak)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            ทำภารกิจการเรียนรู้ให้ครบทุกวันเพื่อรับ XP โบนัสและอัปเลเวลอย่างรวดเร็ว
          </p>
        </div>

        {/* Streak Pill */}
        <div className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-amber-500/40 flex items-center gap-2 text-xs">
          <Flame className="w-4 h-4 text-orange-400 fill-orange-400 animate-pulse" />
          <span className="text-slate-300">เข้าเรียนต่อเนื่อง:</span>
          <span className="font-black text-amber-300 font-['Chakra_Petch'] text-sm">
            {streakDays} วันติด 🔥
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {quests.map((q) => {
          const isClaimed = q.claimed;
          return (
            <div
              key={q.id}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                isClaimed
                  ? 'bg-slate-950/40 border-slate-800/80 opacity-60'
                  : 'bg-slate-950/80 border-slate-800 hover:border-amber-500/40 shadow'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2 rounded-xl bg-slate-900 border border-slate-800">
                  {q.icon}
                </span>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{q.title}</span>
                    <span className="text-[10px] font-semibold text-amber-400">
                      +{q.xpReward} XP
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                    {q.description}
                  </p>
                </div>
              </div>

              <div>
                {isClaimed ? (
                  <span className="px-3 py-1 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    รับแล้ว
                  </span>
                ) : (
                  <button
                    onClick={() => handleClaim(q)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-md transition-all hover:scale-105 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>รับรางวัล</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
