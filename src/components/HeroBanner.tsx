/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, StudentProfile } from '../types';
import {
  Compass,
  Sparkles,
  MapPin,
  PlayCircle,
  Award,
  Video,
  FileSpreadsheet,
  CheckCircle2,
  Gamepad2,
  ChevronRight,
  ShieldAlert,
  BookOpen,
  Globe,
  ExternalLink
} from 'lucide-react';

interface HeroBannerProps {
  currentUser: User | null;
  currentStudent: StudentProfile | null;
  onStartAdventure: () => void;
  onOpenVideos: () => void;
  onOpenDashboard: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  currentUser,
  currentStudent,
  onStartAdventure,
  onOpenVideos,
  onOpenDashboard,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-10 mb-8">
      {/* Background ambient glow shapes */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Headline & Intro */}
        <div className="lg:col-span-7 space-y-5 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-semibold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>หลักสูตรแกนกลาง สสวท. • เทคโนโลยี (วิทยาการคำนวณ) ม.1</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-['Chakra_Petch'] leading-tight">
              Adventure <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">M.1</span>
            </h1>
            <p className="text-lg sm:text-xl font-bold text-amber-200/90 font-['Prompt']">
              “ผจญภัย สนุกคิด พิชิตวิทยาการคำนวณ”
            </p>
          </div>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-['Prompt']">
            เรียนรู้บทเรียนทั้ง 6 บทอย่างสนุกสนานด้วยระบบเกมมิฟิเคชันสะสม XP และเหรียญตราเกียรติยศ 
            พร้อมมินิเกมโต้ตอบ 6 รูปแบบ, คลังวิดีโอ Project 14 สสวท. และระบบส่งออกคะแนนสู่ Google Sheets อัตโนมัติ
          </p>

          {/* Key pillars */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">6 ด่านผจญภัย</div>
                <div className="text-[11px] text-slate-400">ครอบคลุมเนื้อหา ม.1</div>
              </div>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">6 มินิเกมโต้ตอบ</div>
                <div className="text-[11px] text-slate-400">เสริมทักษะความคิด</div>
              </div>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center gap-2.5 col-span-2 sm:col-span-1">
              <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Google Sheets</div>
                <div className="text-[11px] text-slate-400">ส่งออกเกรด/คะแนนทันที</div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              id="hero-start-btn"
              onClick={onStartAdventure}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm sm:text-base transition-all shadow-lg hover:scale-105 flex items-center gap-2"
            >
              <Compass className="w-5 h-5" />
              <span>เริ่มการผจญภัย (แผนที่ 6 บท)</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              id="hero-videos-btn"
              onClick={onOpenVideos}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-sm border border-slate-700 transition-all flex items-center gap-2"
            >
              <Video className="w-4 h-4 text-amber-400" />
              <span>คลังวิดีโอ สสวท.</span>
            </button>

            {currentUser && (
              <button
                id="hero-dashboard-btn"
                onClick={onOpenDashboard}
                className="px-4 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-sm border border-slate-800 transition-all flex items-center gap-2"
              >
                <Award className="w-4 h-4 text-indigo-400" />
                <span>
                  {currentUser.role === 'teacher' ? 'ดูแดชบอร์ดครู' : 'ดูความก้าวหน้าของฉัน'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: IPST Textbook E-Book & Website Links & User Status */}
        <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col items-center gap-3">
          {/* Official IPST Textbook Flipbook E-Book Button */}
          <a
            id="hero-read-textbook-btn"
            href="https://pubhtml5.com/ztml/rbqf/"
            target="_blank"
            rel="noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-between shadow-xl shadow-amber-950/40 border border-amber-300 transition-all hover:scale-[1.02] group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-950/20 flex items-center justify-center text-slate-950 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-['Chakra_Petch'] font-black text-xs sm:text-sm text-slate-950 flex items-center gap-1.5">
                  <span>เปิดอ่านหนังสือเรียนออนไลน์ (E-Book)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-amber-300 font-bold">
                    ม.1
                  </span>
                </div>
                <div className="text-[10px] text-slate-900 font-medium mt-0.5">
                  เทคโนโลยี วิทยาการคำนวณ ม.1 • สสวท. ฉบับเต็ม
                </div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform shrink-0" />
          </a>

          {/* Official IPST Website Button */}
          <a
            id="hero-ipst-web-btn"
            href="https://proj14.ipst.ac.th/m1/m1-cs/"
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-between border border-slate-700/80 transition-all hover:border-sky-500/50 group"
          >
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-sky-400" />
              <span>เว็บไซต์ทางการ สสวท. Project 14 (วิดีโอ & สื่อประกอบ)</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-300 transition-colors shrink-0" />
          </a>

          {/* User Status Card */}
          <div className="w-full relative rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 p-4 border border-amber-500/20 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-300">สถานะผู้ใช้งาน</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                มัธยมศึกษาปีที่ 1
              </span>
            </div>

            {currentUser ? (
              <div className="space-y-3">
                {currentUser.role === 'teacher' ? (
                  /* Teacher Status Card (No XP / Level) */
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={currentUser.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=TeacherSomsri'}
                        alt={currentUser.name}
                        className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-emerald-500/50 object-cover"
                      />
                      <div className="overflow-hidden">
                        <h3 className="font-bold text-white text-sm leading-snug truncate">
                          {currentUser.name}
                        </h3>
                        <p className="text-[11px] text-emerald-300 font-medium truncate flex items-center gap-1 mt-0.5">
                          <span>👨‍🏫 ครูผู้สอนประจำรายวิชา</span>
                        </p>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          วิทยาการคำนวณ ม.1 • สสวท.
                        </div>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-200 flex items-center justify-between">
                      <span>สถานะ: ระบบจัดการเรียนรู้</span>
                      <span className="font-bold text-emerald-400">โหมดครูผู้สอน</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={onOpenDashboard}
                        className="py-1.5 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-lg text-center transition-colors"
                      >
                        📊 แดชบอร์ดครู
                      </button>
                      <button
                        onClick={onStartAdventure}
                        className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg text-center transition-colors"
                      >
                        🗺️ ดูแผนที่ 6 บท
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Student Status Card (With XP / Level) */
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={currentUser.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=Adventure'}
                        alt={currentUser.name}
                        className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-amber-500/40 object-cover"
                      />
                      <div className="overflow-hidden">
                        <h3 className="font-bold text-white text-sm leading-snug truncate">
                          {currentUser.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate">
                          {`นักเรียนห้อง ${currentStudent?.classroom || 'ม.1/1'} เลขที่ ${currentStudent?.seatNumber || 1}`}
                        </p>
                        {currentStudent && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-amber-400">
                              Lv.{currentStudent.level}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {currentStudent.xp} / {currentStudent.level * 300} XP
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {currentStudent && (
                      <div className="space-y-1">
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round((currentStudent.xp / (currentStudent.level * 300)) * 100)
                              )}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>บทเรียนสำเร็จ: {currentStudent.totalCompletedLessons} / 6 บท</span>
                          <span>
                            {Math.round((currentStudent.totalCompletedLessons / 6) * 100)}%
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={onStartAdventure}
                        className="py-1.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-semibold rounded-lg text-center transition-colors"
                      >
                        ผจญภัยต่อ →
                      </button>
                      <button
                        onClick={onOpenDashboard}
                        className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg text-center transition-colors"
                      >
                        เปิดแดชบอร์ด
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-2 text-center space-y-2">
                <div className="text-xs font-semibold text-slate-200">
                  ยินดีต้อนรับสู่เกาะการเรียนรู้วิทยาการคำนวณ
                </div>
                <p className="text-[11px] text-slate-400">
                  กรุณาลงชื่อเข้าใช้เพื่อบันทึก XP และคะแนนสอบ
                </p>
                <button
                  onClick={onStartAdventure}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow"
                >
                  เข้าสู่ระบบเพื่อเริ่มเรียน
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
