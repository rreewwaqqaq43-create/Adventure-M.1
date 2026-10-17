/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, StudentProfile } from '../types';
import { StorageService } from '../services/storage';
import {
  Compass,
  MapPin,
  Video,
  Award,
  BookOpen,
  LogOut,
  LogIn,
  UserCheck,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Users,
  Globe,
  ExternalLink,
  Search,
  Command,
  Mail,
  Crown,
  MessageSquare,
  Github
} from 'lucide-react';
import { ThemeToggle } from './common/ThemeToggle';

interface NavbarProps {
  currentUser: User | null;
  currentStudent: StudentProfile | null;
  activeView: 'home' | 'learning_map' | 'lesson_detail' | 'videos' | 'student_dashboard' | 'teacher_dashboard' | 'admin_dashboard';
  onNavigate: (view: any) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenSearch?: () => void;
  onOpenMailbox?: () => void;
  onOpenChat?: () => void;
  onOpenGitHubExport?: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentStudent,
  activeView,
  onNavigate,
  onOpenAuth,
  onOpenSearch,
  onOpenMailbox,
  onOpenChat,
  onOpenGitHubExport,
  onLogout,
}) => {
  const unreadFeedbackCount = currentUser && currentUser.role === 'student'
    ? StorageService.getUnreadFeedbackCount(currentUser.id)
    : 0;
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <button
            id="nav-brand-btn"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 group text-left focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 p-0.5 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Compass className="w-6 h-6 text-amber-400 group-hover:rotate-45 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-amber-300 via-yellow-200 to-white bg-clip-text text-transparent font-['Chakra_Petch']">
                  Adventure M.1
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                  สสวท. ม.1
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                ผจญภัย สนุกคิด พิชิตวิทยาการคำนวณ
              </p>
            </div>
          </button>

          {/* Center Navigation Links (Only shown when logged in) */}
          {currentUser && (
            <nav className="hidden lg:flex items-center gap-1">
              <button
                id="nav-home-btn"
                onClick={() => onNavigate('home')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  activeView === 'home'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>หน้าแรก</span>
              </button>

              <button
                id="nav-map-btn"
                onClick={() => onNavigate('learning_map')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  activeView === 'learning_map' || activeView === 'lesson_detail'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>แผนที่ผจญภัย (6 บท)</span>
              </button>

              <button
                id="nav-videos-btn"
                onClick={() => onNavigate('videos')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  activeView === 'videos'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>วิดีโอ สสวท.</span>
              </button>

              {currentUser?.role === 'student' && (
                <button
                  id="nav-student-dashboard-btn"
                  onClick={() => onNavigate('student_dashboard')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeView === 'student_dashboard'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>แดชบอร์ดนักเรียน</span>
                </button>
              )}

              {currentUser?.role === 'teacher' && (
                <button
                  id="nav-teacher-dashboard-btn"
                  onClick={() => onNavigate('teacher_dashboard')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeView === 'teacher_dashboard'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>แดชบอร์ดครู</span>
                </button>
              )}

              {currentUser?.role === 'admin' && (
                <>
                  <button
                    id="nav-admin-dashboard-btn"
                    onClick={() => onNavigate('admin_dashboard')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      activeView === 'admin_dashboard'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>จัดการผู้ใช้ (Admin)</span>
                  </button>
                  <button
                    id="nav-admin-teacher-view-btn"
                    onClick={() => onNavigate('teacher_dashboard')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      activeView === 'teacher_dashboard'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>แดชบอร์ดครู</span>
                  </button>
                </>
              )}
            </nav>
          )}

          {/* User Controls & Global Search Trigger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Universal Search Bar Trigger (Only shown when logged in) */}
            {currentUser && onOpenSearch && (
              <button
                id="nav-global-search-btn"
                type="button"
                onClick={onOpenSearch}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/40 text-slate-300 hover:text-white text-xs transition-all shadow-inner group"
                title="ค้นหาบทเรียน, วิดีโอ, ผังงาน, Scratch, Python, ใบงาน (Ctrl+K)"
              >
                <Search className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline font-medium text-slate-400 group-hover:text-slate-200">
                  ค้นหาบทเรียน / วิดีโอ...
                </span>
                <span className="hidden md:inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300/90 font-bold">
                  ⌘K
                </span>
              </button>
            )}

            {/* GitHub Export / Upload Button (Only visible for authenticated users) */}
            {currentUser && onOpenGitHubExport && (
              <button
                id="nav-github-export-btn"
                type="button"
                onClick={onOpenGitHubExport}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/40 text-slate-300 hover:text-white text-xs transition-all shadow-inner group"
                title="นำโค้ดและข้อมูลขึ้น GitHub หรือดาวน์โหลดไฟล์ (.tar.gz)"
              >
                <Github className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline font-semibold">GitHub</span>
              </button>
            )}

            {currentUser ? (
              <>
                <div className="flex items-center gap-2">
                  {/* Student-Teacher Live Chat Button */}
                  {onOpenChat && (
                    <button
                      id="nav-chat-btn"
                      type="button"
                      onClick={onOpenChat}
                      title={currentUser.role === 'student' ? 'แชทปรึกษาคุณครูผู้สอน' : 'ห้องแชท & ตอบคำถามนักเรียน'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 hover:text-white text-xs font-bold transition-all hover:scale-105 shadow-sm"
                    >
                      <MessageSquare className="w-4 h-4 text-sky-400" />
                      <span className="hidden sm:inline">
                        {currentUser.role === 'student' ? 'แชทกับครู' : 'แชทนักเรียน'}
                      </span>
                    </button>
                  )}

                  {/* Student Mailbox Notification Button */}
                  {currentUser.role === 'student' && onOpenMailbox && (
                    <button
                      id="nav-student-mailbox-btn"
                      type="button"
                      onClick={onOpenMailbox}
                      title="กล่องจดหมาย & ฟีดแบ็กจากคุณครู"
                      className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all hover:scale-105"
                    >
                      <Mail className="w-4 h-4 text-indigo-400" />
                      {unreadFeedbackCount > 0 && (
                        <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-slate-900 animate-pulse">
                          {unreadFeedbackCount}
                        </span>
                      )}
                    </button>
                  )}

                  {/* XP badge strictly for students */}
                  {currentUser.role === 'student' && currentStudent && (
                    <div
                      id="student-xp-pill"
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full text-amber-300 text-xs font-semibold"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{currentStudent.xp} XP (Lv.{currentStudent.level})</span>
                    </div>
                  )}

                  {/* Teacher Role Badge */}
                  {currentUser.role === 'teacher' && (
                    <div
                      id="teacher-role-pill"
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-emerald-300 text-xs font-bold"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ครูผู้สอน</span>
                    </div>
                  )}

                  {/* Admin Role Badge */}
                  {currentUser.role === 'admin' && (
                    <div
                      id="admin-role-pill"
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-rose-500/15 border border-rose-500/30 rounded-full text-rose-300 text-xs font-bold"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>Admin สูงสุด</span>
                    </div>
                  )}

                  {/* Profile Pill */}
                  <button
                    id="user-profile-btn"
                    onClick={() =>
                      onNavigate(
                        currentUser.role === 'admin'
                          ? 'admin_dashboard'
                          : currentUser.role === 'teacher'
                          ? 'teacher_dashboard'
                          : 'student_dashboard'
                      )
                    }
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                  >
                    <img
                      src={currentUser.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=Adventure'}
                      alt={currentUser.name}
                      className="w-7 h-7 rounded-lg bg-slate-700 object-cover"
                    />
                    <div className="text-left hidden lg:block">
                      <div className="text-xs font-semibold text-white leading-tight max-w-[120px] truncate">
                        {currentUser.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {currentUser.role === 'admin'
                          ? 'ผู้ดูแลระบบ (Admin)'
                          : currentUser.role === 'teacher'
                          ? 'ครูผู้สอน'
                          : `นักเรียน ${currentStudent?.classroom || 'ม.1'}`}
                      </div>
                    </div>
                  </button>

                  {/* Theme Toggle Button (Light/Dark Mode) */}
                  <ThemeToggle showLabel={false} />

                  {/* Logout Button */}
                  <button
                    id="nav-logout-btn"
                    onClick={onLogout}
                    title="ออกจากระบบ"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-700 hover:border-rose-500/20 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ออกจากระบบ</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {/* Theme Toggle Button (For non-logged in users) */}
                <ThemeToggle showLabel={false} />

                <button
                  id="nav-login-btn"
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>เข้าสู่ระบบ (Login)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Sub-bar (Only shown when logged in) */}
      {currentUser && (
        <div className="md:hidden border-t border-slate-800/80 px-4 py-2 flex items-center justify-around text-xs bg-slate-950/80">
          <button
            onClick={() => onNavigate('home')}
            className={`flex flex-col items-center gap-1 ${
              activeView === 'home' ? 'text-amber-400' : 'text-slate-400'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>หน้าแรก</span>
          </button>
          <button
            onClick={() => onNavigate('learning_map')}
            className={`flex flex-col items-center gap-1 ${
              activeView === 'learning_map' || activeView === 'lesson_detail'
                ? 'text-amber-400'
                : 'text-slate-400'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>ด่าน 6 บท</span>
          </button>
          <button
            onClick={() => onNavigate('videos')}
            className={`flex flex-col items-center gap-1 ${
              activeView === 'videos' ? 'text-amber-400' : 'text-slate-400'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>วิดีโอ</span>
          </button>
          <button
            onClick={() =>
              onNavigate(
                currentUser.role === 'admin'
                  ? 'admin_dashboard'
                  : currentUser.role === 'teacher'
                  ? 'teacher_dashboard'
                  : 'student_dashboard'
              )
            }
            className={`flex flex-col items-center gap-1 ${
              activeView === 'student_dashboard' ||
              activeView === 'teacher_dashboard' ||
              activeView === 'admin_dashboard'
                ? 'text-amber-400'
                : 'text-slate-400'
            }`}
          >
            {currentUser.role === 'admin' ? (
              <Crown className="w-4 h-4 text-amber-400" />
            ) : currentUser.role === 'teacher' ? (
              <ShieldCheck className="w-4 h-4" />
            ) : (
              <GraduationCap className="w-4 h-4" />
            )}
            <span>แดชบอร์ด</span>
          </button>
        </div>
      )}
    </header>
  );
};
