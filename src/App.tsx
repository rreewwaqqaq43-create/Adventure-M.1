/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, StudentProfile, StudentProgress, Lesson, Badge, YouTubeVideo } from './types';
import { StorageService, initializeDatabaseSync } from './services/storage';
import { logoutAuth } from './services/auth';
import { logoutFirebase } from './services/firebase';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { LearningMap } from './components/LearningMap';
import { VideoLibrary } from './components/VideoLibrary';
import { StudentDashboard } from './components/StudentDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { AdminUserManager } from './components/admin/AdminUserManager';
import { AuthModal } from './components/AuthModal';
import { LoginPortal } from './components/LoginPortal';
import { LessonDetailModal } from './components/LessonDetailModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { StudentMailboxModal } from './components/StudentMailboxModal';
import { StudentTeacherChatModal } from './components/StudentTeacherChatModal';
import { ActionFeedbackToast } from './components/common/ActionFeedbackToast';
import { GitHubExportModal } from './components/common/GitHubExportModal';
import {
  Compass,
  MapPin,
  BookOpen,
  Video,
  Award,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  ExternalLink,
  Heart,
  Crown,
  MessageSquare
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return StorageService.getCurrentUser();
  });

  const [activeView, setActiveView] = useState<
    'home' | 'learning_map' | 'videos' | 'student_dashboard' | 'teacher_dashboard' | 'admin_dashboard'
  >('home');

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isMailboxOpen, setIsMailboxOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedLessonTab, setSelectedLessonTab] = useState<
    'content' | 'video' | 'game' | 'quiz' | 'worksheet' | 'badge'
  >('content');

  // State caches for lessons, progress, and badges
  const [lessons, setLessons] = useState<Lesson[]>(() => StorageService.getLessons());
  const [badges, setBadges] = useState<Badge[]>(() => StorageService.getBadges());
  const [userProgress, setUserProgress] = useState<StudentProgress[]>(() => {
    return currentUser ? StorageService.getProgress(currentUser.id) : [];
  });

  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(() => {
    if (!currentUser || currentUser.role !== 'student') return null;
    const profiles = StorageService.getStudentProfiles();
    return profiles.find((p) => p.userId === currentUser.id) || null;
  });

  // Refresh progress and profile
  const refreshUserData = (user: User | null = currentUser) => {
    if (!user) {
      setUserProgress([]);
      setStudentProfile(null);
      return;
    }
    const prog = StorageService.getProgress(user.id);
    setUserProgress(prog);

    if (user.role === 'student') {
      const profiles = StorageService.getStudentProfiles();
      const prof = profiles.find((p) => p.userId === user.id) || null;
      setStudentProfile(prof);
    } else {
      setStudentProfile(null);
    }
  };

  useEffect(() => {
    refreshUserData(currentUser);
  }, [currentUser?.id]);

  // Synchronize with persistent storage (Node Express DB + Cloud Firestore) on startup
  useEffect(() => {
    initializeDatabaseSync().then((res) => {
      if (res.synced) {
        setLessons(StorageService.getLessons());
        const savedUser = StorageService.getCurrentUser();
        if (savedUser) {
          refreshUserData(savedUser);
        }
      }
    });
  }, []);

  // Global Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutAuth();
      await logoutFirebase();
    } catch (e) {
      console.warn('Logout cleanup warning:', e);
    }
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
    setUserProgress([]);
    setStudentProfile(null);
    setActiveView('home');
    setAuthModalOpen(false);
  };

  const handleAuthSuccess = (user: User) => {
    StorageService.setCurrentUser(user);
    setCurrentUser(user);
    refreshUserData(user);
    setAuthModalOpen(false);
    if (user.role === 'admin') {
      setActiveView('admin_dashboard');
    } else if (user.role === 'teacher') {
      setActiveView('teacher_dashboard');
    } else {
      setActiveView('home');
    }
  };

  const handleOpenLessonWithTab = (
    lesson: Lesson,
    tab: 'content' | 'video' | 'game' | 'quiz' | 'worksheet' | 'badge' = 'content'
  ) => {
    setSelectedLessonTab(tab);
    setSelectedLesson(lesson);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Prompt'] flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        currentStudent={studentProfile}
        activeView={activeView as any}
        onNavigate={(view) => setActiveView(view)}
        onOpenAuth={(mode) => {
          if (!currentUser) {
            const el = document.getElementById('login-identifier-input');
            if (el) {
              el.focus();
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              return;
            }
          }
          setAuthModalMode(mode || 'login');
          setAuthModalOpen(true);
        }}
        onOpenSearch={() => setIsGlobalSearchOpen(true)}
        onOpenMailbox={() => setIsMailboxOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenGitHubExport={() => setIsGitHubModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* When not logged in: Clean single-page login screen without search or outer view distractions */}
        {!currentUser ? (
          <LoginPortal
            onLoginSuccess={handleAuthSuccess}
          />
        ) : activeView === 'videos' ? (
          <div className="space-y-6">
            <VideoLibrary
              lessons={lessons}
              currentUser={currentUser}
              onSelectLesson={(l) => handleOpenLessonWithTab(l, 'video')}
              onVideosUpdated={() => setLessons(StorageService.getLessons())}
            />
          </div>
        ) : (
          <>
            {/* VIEW: Home */}
            {activeView === 'home' && (
              <div className="space-y-10">
                {/* Hero Banner */}
                <HeroBanner
                  currentUser={currentUser}
                  currentStudent={studentProfile}
                  onStartAdventure={() => setActiveView('learning_map')}
                  onOpenVideos={() => setActiveView('videos')}
                  onOpenDashboard={() =>
                    setActiveView(
                      currentUser?.role === 'admin'
                        ? 'admin_dashboard'
                        : currentUser?.role === 'teacher'
                        ? 'teacher_dashboard'
                        : 'student_dashboard'
                    )
                  }
                />

                {/* Quick Preview of the Learning Map */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-white font-['Chakra_Petch'] flex items-center gap-2">
                        <Compass className="w-6 h-6 text-amber-400" />
                        <span>ด่านการผจญภัยทั้ง 6 บท (Adventure Chapters)</span>
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-400">
                        เลือกบทเรียนที่ต้องการเพื่อเริ่มต้นการเรียนรู้และเล่นมินิเกม
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveView('learning_map')}
                      className="text-xs sm:text-sm font-semibold text-amber-400 hover:text-amber-300 hover:underline"
                    >
                      ดูแผนที่เต็มรูปแบบ →
                    </button>
                  </div>

                  <LearningMap
                    lessons={lessons}
                    userProgress={userProgress}
                    badges={badges}
                    currentUser={currentUser}
                    onSelectLesson={(l) => handleOpenLessonWithTab(l, 'content')}
                  />
                </div>
              </div>
            )}

            {/* VIEW: Learning Map Full */}
            {activeView === 'learning_map' && (
              <div className="space-y-6">
                <LearningMap
                  lessons={lessons}
                  userProgress={userProgress}
                  badges={badges}
                  currentUser={currentUser}
                  onSelectLesson={(l) => handleOpenLessonWithTab(l, 'content')}
                />
              </div>
            )}

            {/* VIEW: Student Dashboard */}
            {activeView === 'student_dashboard' && currentUser && (
              <div className="space-y-6">
                <StudentDashboard
                  user={currentUser}
                  studentProfile={studentProfile}
                  progressList={userProgress}
                  lessons={lessons}
                  badges={badges}
                  onOpenLesson={(l) => handleOpenLessonWithTab(l, 'content')}
                  onProfileUpdated={() => refreshUserData(currentUser)}
                />
              </div>
            )}

            {/* VIEW: Teacher Dashboard */}
            {activeView === 'teacher_dashboard' && (
              <div className="space-y-6">
                <TeacherDashboard
                  teacherUser={currentUser}
                  lessons={lessons}
                  onLessonsUpdated={() => setLessons(StorageService.getLessons())}
                  onProfileUpdated={() => refreshUserData(currentUser)}
                />
              </div>
            )}

            {/* VIEW: Admin Dashboard */}
            {activeView === 'admin_dashboard' && currentUser && (
              <div className="space-y-6">
                <AdminUserManager
                  currentAdmin={currentUser}
                  onUserSwitched={handleAuthSuccess}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Lesson Detail / Game / Quiz Modal */}
      {selectedLesson && (
        <LessonDetailModal
          lesson={selectedLesson}
          initialTab={selectedLessonTab}
          progress={userProgress.find((p) => p.lessonId === selectedLesson.id)}
          badge={badges.find((b) => b.id === selectedLesson.badgeRewardId)}
          currentUser={currentUser}
          onClose={() => setSelectedLesson(null)}
          onProgressUpdated={() => refreshUserData(currentUser)}
          onLessonUpdated={(updated) => {
            setSelectedLesson(updated);
            setLessons(StorageService.getLessons());
          }}
        />
      )}

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        lessons={lessons}
        onOpenLesson={(lesson, tab) => handleOpenLessonWithTab(lesson, tab || 'content')}
        onOpenVideoView={(video) => {
          setActiveView('videos');
        }}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Student Mailbox Modal */}
      <StudentMailboxModal
        isOpen={isMailboxOpen}
        onClose={() => setIsMailboxOpen(false)}
        currentUser={currentUser}
        onOpenWorksheet={(chNum) => {
          const targetLesson = lessons.find((l) => l.chapterNumber === chNum) || lessons[0];
          if (targetLesson) {
            handleOpenLessonWithTab(targetLesson, 'worksheet');
          }
        }}
      />

      {/* Student-Teacher Live Chat Modal */}
      <StudentTeacherChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentUser={currentUser}
      />

      {/* GitHub Export & Code Download Modal */}
      <GitHubExportModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
      />

      {/* Global Interactive Action Feedback (Sound, Haptic, Visual Toasts for Add, Save, Edit, Delete) */}
      <ActionFeedbackToast />

      {/* Floating Chat Quick Button (When Logged In) */}
      {currentUser && (
        <button
          id="floating-chat-btn"
          type="button"
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 p-3.5 sm:px-4 sm:py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-2xl sm:rounded-full shadow-2xl flex items-center gap-2 border border-white/20 transition-all hover:scale-105 active:scale-95 group"
          title="แชทกับคุณครูผู้สอน / ตอบคำถามนักเรียน"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-indigo-900 animate-pulse" />
          </div>
          <span className="hidden sm:inline text-xs font-['Chakra_Petch'] tracking-wide">
            {currentUser.role === 'student' ? 'แชทกับคุณครู' : 'แชทนักเรียน'}
          </span>
        </button>
      )}

      {/* Global Footer */}
      <footer className="mt-16 border-t border-slate-800/80 bg-slate-950 py-10 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Compass className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-base text-white font-['Chakra_Petch']">
                Adventure M.1
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
              “ผจญภัย สนุกคิด พิชิตวิทยาการคำนวณ” — เว็บแอปพลิเคชันสื่อการเรียนรู้แบบเกมมิฟิเคชัน 
              ตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พ.ศ. 2551 (ฉบับปรับปรุง พ.ศ. 2560) 
              สาระเทคโนโลยี (วิทยาการคำนวณ) มัธยมศึกษาปีที่ 1 สถาบันส่งเสริมการสอนวิทยาศาสตร์และเทคโนโลยี (สสวท.)
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">
              แหล่งอ้างอิงการเรียนรู้
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <a
                  href="https://pubhtml5.com/ztml/rbqf/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:text-amber-300 font-semibold transition-colors inline-flex items-center gap-1"
                >
                  <span>• หนังสือเรียน เทคโนโลยี วิทยาการคำนวณ ม.1 (E-Book) ↗</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div>
            © 2026 Adventure M.1. เพื่อประโยชน์ทางการศึกษาของนักเรียนและคุณครูไทย
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>ผจญภัย สนุกคิด พิชิตวิทยาการคำนวณ</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
