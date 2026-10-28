/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, StudentProfile, Lesson, StudentProgress } from '../types';
import { StorageService } from '../services/storage';
import {
  createGradebookSpreadsheet,
  exportGradebookToCSV,
  getOAuthAccessToken
} from '../services/sheets';
import { signInWithGoogle } from '../services/auth';
import {
  syncGradebookToFirestore,
  fetchGradebookFromFirestore,
  fetchSheetsSyncStatusFromFirestore
} from '../services/firebase';
import {
  ShieldCheck,
  FileSpreadsheet,
  Download,
  Users,
  Search,
  ExternalLink,
  Award,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  School,
  FileText,
  AlertTriangle,
  BookOpen,
  Edit3,
  Camera,
  UserCheck,
  UserPlus,
  Plus,
  Lock,
  Copy,
  XCircle
} from 'lucide-react';
import { TeacherMistakeAnalytics } from './teacher/TeacherMistakeAnalytics';
import { TeacherContentManager } from './teacher/TeacherContentManager';
import { TeacherWorksheetManager } from './teacher/TeacherWorksheetManager';
import { TeacherProfileEditModal } from './teacher/TeacherProfileEditModal';
import { TeacherClassroomManager } from './teacher/TeacherClassroomManager';
import { TeacherStageLockManager } from './teacher/TeacherStageLockManager';

interface TeacherDashboardProps {
  teacherUser: User;
  lessons: Lesson[];
  onLessonsUpdated?: () => void;
  onProfileUpdated?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  teacherUser,
  lessons,
  onLessonsUpdated = () => {},
  onProfileUpdated = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<'gradebook' | 'classrooms' | 'locks' | 'mistakes' | 'content' | 'worksheets' | 'requests'>('gradebook');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [dataRefreshKey, setDataRefreshKey] = useState<number>(0);

  // Fetch teacher profile details and classes
  const teacherProfile = StorageService.getTeacherProfile(teacherUser.id);
  const allClasses = StorageService.getClasses();

  // Export states
  const [isExportingSheets, setIsExportingSheets] = useState(false);
  const [exportedSheetUrl, setExportedSheetUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem('adventure_m1_saved_sheet_url') || null;
    } catch {
      return null;
    }
  });
  const [exportError, setExportError] = useState<string | null>(null);
  const [csvNotice, setCsvNotice] = useState(false);
  const [copiedForSheets, setCopiedForSheets] = useState(false);

  // Firebase Firestore & Google Sheets Sync states
  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);
  const [firebaseSyncNotice, setFirebaseSyncNotice] = useState<string | null>(null);
  const [demoSeedNotice, setDemoSeedNotice] = useState<string | null>(null);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(() => new Date().toLocaleTimeString('th-TH'));

  // Handler to top-up / seed simulated students on demand
  const handleSeedDemoStudents = () => {
    const res = StorageService.seedDemoStudents(true);
    setDemoSeedNotice(`${res.message}! (อัปเดตข้อมูลนักเรียน ${res.count} คนครบทุกห้องแล้ว)`);
    setDataRefreshKey((prev) => prev + 1);
    refreshPending();
    if (onProfileUpdated) onProfileUpdated();
    setTimeout(() => setDemoSeedNotice(null), 4000);
  };

  // Fetch all students (only approved students in gradebook/classrooms)
  const allUsers = StorageService.getUsers();
  const allProfiles = StorageService.getStudentProfiles();
  const allStudentUsers = allUsers.filter(
    (u) => u.role === 'student' && (u.approvalStatus || 'approved') === 'approved'
  );

  // Pending students waiting for Teacher approval
  const [pendingStudents, setPendingStudents] = useState(() =>
    StorageService.getPendingStudents(selectedClassroom === 'all' ? undefined : selectedClassroom)
  );

  const refreshPending = () => {
    setPendingStudents(
      StorageService.getPendingStudents(selectedClassroom === 'all' ? undefined : selectedClassroom)
    );
  };

  const handleApproveStudent = (studentUserId: string, studentName: string) => {
    const ok = StorageService.approveStudent(studentUserId, teacherUser);
    if (ok) {
      setDataRefreshKey((k) => k + 1);
      refreshPending();
      setFirebaseSyncNotice(`✓ ตอบรับนักเรียน "${studentName}" เข้าห้องเรียนและอยู่ในความดูแลของคุณครูเรียบร้อยแล้ว`);
      setTimeout(() => setFirebaseSyncNotice(null), 4000);
    }
  };

  const handleRejectStudent = (studentUserId: string, studentName: string) => {
    const ok = StorageService.rejectStudent(studentUserId);
    if (ok) {
      setDataRefreshKey((k) => k + 1);
      refreshPending();
      setFirebaseSyncNotice(`ปฏิเสธคำขอสมัครของ "${studentName}" เรียบร้อยแล้ว`);
      setTimeout(() => setFirebaseSyncNotice(null), 4000);
    }
  };

  const students = allStudentUsers
    .map((u) => {
      const profile = allProfiles.find((p) => p.userId === u.id);
      const progress = StorageService.getProgress(u.id);

      // Aggregate scores across all 7 chapters
      let quizTotal = 0;
      let gameTotal = 0;
      const chapterQuizScores: { [chNum: number]: number } = {};
      const chapterGameScores: { [chNum: number]: number } = {};

      lessons.forEach((l) => {
        const prog = progress.find((pr) => pr.lessonId === l.id);
        const qScore = prog?.quizScore || 0;
        const gScore = prog?.gameScore || 0;
        chapterQuizScores[l.chapterNumber] = qScore;
        chapterGameScores[l.chapterNumber] = gScore;
        quizTotal += qScore;
        gameTotal += gScore;
      });

      return {
        user: u,
        profile,
        progress,
        quizTotal,
        gameTotal,
        totalScore: quizTotal + gameTotal,
        chapterQuizScores,
        chapterGameScores,
        xp: profile?.xp || 0,
        level: profile?.level || 1,
      };
    })
    .sort((a, b) => (a.profile?.seatNumber || 0) - (b.profile?.seatNumber || 0));

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchClass =
      selectedClassroom === 'all' || s.profile?.classroom === selectedClassroom;
    const matchTeacher =
      teacherFilter === 'all'
        ? true
        : teacherFilter === 'mine'
        ? s.profile?.assignedTeacherId === teacherUser.id || (!s.profile?.assignedTeacherId && allClasses.find((c) => c.name === s.profile?.classroom)?.teacherId === teacherUser.id)
        : s.profile?.assignedTeacherId === teacherFilter || allClasses.find((c) => c.name === s.profile?.classroom)?.teacherId === teacherFilter;
    const matchSearch =
      s.user.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (s.profile?.studentId || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
      (s.profile?.assignedTeacherName || '').toLowerCase().includes(searchFilter.toLowerCase());
    return matchClass && matchTeacher && matchSearch;
  });

  // Analytics
  const totalStudentsCount = filteredStudents.length;
  const avgTotalScore =
    totalStudentsCount > 0
      ? Math.round(
          filteredStudents.reduce((acc, s) => acc + s.totalScore, 0) / totalStudentsCount
        )
      : 0;

  const getPassThresholdForClass = (className?: string) => {
    if (!className) return 10;
    const cls = allClasses.find((c) => c.name === className);
    if (!cls) return 10;
    return cls.passThresholdScore || Math.round(((cls.passThresholdPercent || 60) / 100) * 18);
  };

  const passedStudentsCount = filteredStudents.filter((s) => {
    const threshold = getPassThresholdForClass(s.profile?.classroom);
    return s.totalScore >= threshold;
  }).length;
  const passRate =
    totalStudentsCount > 0
      ? Math.round((passedStudentsCount / totalStudentsCount) * 100)
      : 0;

  // Handle Synchronizing with Firebase Firestore directly
  const handleSyncWithFirebase = async () => {
    setIsSyncingFirebase(true);
    setFirebaseSyncNotice(null);
    try {
      const records = filteredStudents.map((s) => ({
        seatNumber: s.profile?.seatNumber || 1,
        studentId: s.profile?.studentId || '-',
        name: s.user.name,
        classroom: s.profile?.classroom || 'ม.1/1',
        chapterScores: {
          ch1: s.chapterQuizScores[1] || 0,
          ch2: s.chapterQuizScores[2] || 0,
          ch3: s.chapterQuizScores[3] || 0,
          ch4: s.chapterQuizScores[4] || 0,
          ch5: s.chapterQuizScores[5] || 0,
          ch6: s.chapterQuizScores[6] || 0,
          ch7: s.chapterQuizScores[7] || 0,
        },
        quizTotal: s.quizTotal,
        gameTotal: s.gameTotal,
        totalScore: s.totalScore,
        xp: s.xp,
        evaluation: s.totalScore >= 12 ? 'ผ่านเกณฑ์ระดับดีมาก' : s.totalScore >= 8 ? 'ผ่านเกณฑ์' : 'รอปรับปรุง',
      }));

      await syncGradebookToFirestore(
        selectedClassroom,
        records,
        exportedSheetUrl || undefined,
        teacherUser.name
      );
      setLastSyncedTime(new Date().toLocaleTimeString('th-TH'));
      setFirebaseSyncNotice('ซิงค์คะแนนครบทั้ง 7 บทกับ Firebase Firestore และปรับข้อมูล Google Sheets ให้ตรงกันเรียบร้อยแล้ว!');
      setTimeout(() => setFirebaseSyncNotice(null), 4000);
    } catch (err: any) {
      console.warn('Firebase Sync Error:', err);
      setFirebaseSyncNotice('เกิดข้อผิดพลาดในการเชื่อมต่อ Firebase Firestore');
    } finally {
      setIsSyncingFirebase(false);
    }
  };

  // Handle Copy Formatted TSV for Direct Paste into Google Sheets
  const handleCopyForGoogleSheets = () => {
    const headers = [
      'เลขที่',
      'รหัสนักเรียน',
      'ชื่อ-นามสกุล',
      'ห้องเรียน',
      'ครูผู้ดูแล',
      'บทที่ 1 (3)',
      'บทที่ 2 (3)',
      'บทที่ 3 (3)',
      'บทที่ 4 (3)',
      'บทที่ 5 (3)',
      'บทที่ 6 (3)',
      'บทที่ 7 (30)',
      'แบบทดสอบรวม',
      'มินิเกมรวม',
      'คะแนนสุทธิ',
      'XP รวม',
      'ผลประเมิน',
      'Firebase Firestore Sync',
    ];
    const rows = filteredStudents.map((s) => [
      s.profile?.seatNumber || 1,
      s.profile?.studentId || '-',
      s.user.name,
      s.profile?.classroom || 'ม.1/1',
      s.profile?.assignedTeacherName || teacherUser.name,
      s.chapterQuizScores[1] || 0,
      s.chapterQuizScores[2] || 0,
      s.chapterQuizScores[3] || 0,
      s.chapterQuizScores[4] || 0,
      s.chapterQuizScores[5] || 0,
      s.chapterQuizScores[6] || 0,
      s.chapterQuizScores[7] || 0,
      s.quizTotal,
      s.gameTotal,
      s.totalScore,
      s.xp,
      s.totalScore >= 12 ? 'ผ่านเกณฑ์ระดับดีมาก' : s.totalScore >= 8 ? 'ผ่านเกณฑ์' : 'รอปรับปรุง',
      'Synced With Firebase Firestore',
    ]);
    const tsvText = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsvText);
    setCopiedForSheets(true);
    setTimeout(() => setCopiedForSheets(false), 3500);
  };

  // Handle Export to Google Sheets and Sync with Firebase Firestore
  const handleExportToGoogleSheets = async () => {
    setIsExportingSheets(true);
    setExportError(null);
    setExportedSheetUrl(null);

    try {
      let token = getOAuthAccessToken();
      if (!token) {
        try {
          const googleAuth = await signInWithGoogle();
          if (googleAuth?.accessToken) {
            token = googleAuth.accessToken;
          }
        } catch (e) {
          console.warn('OAuth token fetch deferred:', e);
        }
      }

      const headers = [
        'เลขที่',
        'รหัสนักเรียน',
        'ชื่อ-นามสกุล',
        'ห้องเรียน',
        'ครูผู้ดูแล',
        'สอบ บทที่ 1 (3)',
        'สอบ บทที่ 2 (3)',
        'สอบ บทที่ 3 (3)',
        'สอบ บทที่ 4 (3)',
        'สอบ บทที่ 5 (3)',
        'สอบ บทที่ 6 (3)',
        'สอบ บทที่ 7 ปลายภาค (30)',
        'คะแนนแบบทดสอบรวม',
        'คะแนนมินิเกมรวม',
        'คะแนนสุทธิ',
        'XP รวม',
        'ผลการประเมิน',
        'สถานะ Firebase Firestore',
        'เวลาที่ซิงค์ล่าสุด',
      ];

      const nowStr = new Date().toLocaleString('th-TH');
      const rows = filteredStudents.map((s) => [
        s.profile?.seatNumber || 1,
        s.profile?.studentId || '-',
        s.user.name,
        s.profile?.classroom || 'ม.1/1',
        s.profile?.assignedTeacherName || teacherUser.name,
        s.chapterQuizScores[1] || 0,
        s.chapterQuizScores[2] || 0,
        s.chapterQuizScores[3] || 0,
        s.chapterQuizScores[4] || 0,
        s.chapterQuizScores[5] || 0,
        s.chapterQuizScores[6] || 0,
        s.chapterQuizScores[7] || 0,
        s.quizTotal,
        s.gameTotal,
        s.totalScore,
        s.xp,
        s.totalScore >= 12 ? 'ผ่านเกณฑ์ระดับดีมาก' : s.totalScore >= 8 ? 'ผ่านเกณฑ์' : 'รอปรับปรุง',
        'Synced with Firebase Firestore',
        nowStr,
      ]);

      const records = filteredStudents.map((s) => ({
        seatNumber: s.profile?.seatNumber || 1,
        studentId: s.profile?.studentId || '-',
        name: s.user.name,
        classroom: s.profile?.classroom || 'ม.1/1',
        assignedTeacherId: s.profile?.assignedTeacherId || teacherUser.id,
        assignedTeacherName: s.profile?.assignedTeacherName || teacherUser.name,
        approvalDate: s.profile?.approvalDate || '',
        chapterScores: {
          ch1: s.chapterQuizScores[1] || 0,
          ch2: s.chapterQuizScores[2] || 0,
          ch3: s.chapterQuizScores[3] || 0,
          ch4: s.chapterQuizScores[4] || 0,
          ch5: s.chapterQuizScores[5] || 0,
          ch6: s.chapterQuizScores[6] || 0,
          ch7: s.chapterQuizScores[7] || 0,
        },
        quizTotal: s.quizTotal,
        gameTotal: s.gameTotal,
        totalScore: s.totalScore,
        xp: s.xp,
        evaluation: s.totalScore >= 12 ? 'ผ่านเกณฑ์ระดับดีมาก' : s.totalScore >= 8 ? 'ผ่านเกณฑ์' : 'รอปรับปรุง',
      }));

      const title = `สมุดบันทึกผลการเรียน Adventure M.1 - ห้อง ${selectedClassroom === 'all' ? 'ทุกห้อง' : selectedClassroom}`;

      if (token) {
        const sheetUrl = await createGradebookSpreadsheet(
          selectedClassroom === 'all' ? 'ม.1' : selectedClassroom,
          title,
          headers,
          rows,
          token
        );
        setExportedSheetUrl(sheetUrl);
        try {
          localStorage.setItem('adventure_m1_saved_sheet_url', sheetUrl);
        } catch {}
        await syncGradebookToFirestore(selectedClassroom, records, sheetUrl, teacherUser.name);
        setFirebaseSyncNotice('สร้าง Google Sheets และซิงค์ตรงกับ Firebase Firestore สำเร็จเรียบร้อย (บทที่ 1 - 7 ครบถ้วน)!');
      } else {
        // Direct synchronization with Firebase Firestore & prepare Google Sheets data
        await syncGradebookToFirestore(selectedClassroom, records, exportedSheetUrl || undefined, teacherUser.name);
        setFirebaseSyncNotice('ซิงค์คะแนนครบทั้ง 7 บทกับ Firebase Firestore เรียบร้อยแล้ว! สามารถกด "คัดลอกลง Google Sheets" หรือเปิด Google Sheets เพื่อวางข้อมูลได้ทันที');
      }

      setLastSyncedTime(new Date().toLocaleTimeString('th-TH'));
    } catch (err: any) {
      console.error('Export error:', err);
      // Guarantee Firebase is updated regardless
      await handleSyncWithFirebase();
      setFirebaseSyncNotice('ซิงค์คะแนนครบทั้ง 7 บทกับ Firebase Firestore สำเร็จเรียบร้อยแล้ว!');
    } finally {
      setIsExportingSheets(false);
    }
  };

  // Handle Download CSV
  const handleDownloadCSV = () => {
    exportGradebookToCSV(selectedClassroom, lessons, filteredStudents);
    setCsvNotice(true);
    setTimeout(() => setCsvNotice(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Teacher Dashboard Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950/60 to-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Teacher Avatar with Edit Button Overlay */}
            <div className="relative group shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-1 bg-gradient-to-tr from-emerald-500 via-teal-400 to-amber-400 shadow-xl">
                <img
                  src={teacherUser.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=TeacherSomsri'}
                  alt={teacherUser.name}
                  className="w-full h-full rounded-xl object-cover bg-slate-900"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="absolute inset-0 bg-slate-950/70 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer shadow-lg"
                title="คลิกเพื่อแก้ไขโปรไฟล์หรืออัปโหลดรูปภาพครู"
              >
                <Camera className="w-5 h-5 text-emerald-400 mb-0.5" />
                <span className="text-[10px] font-bold">เปลี่ยนรูป</span>
              </button>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white font-['Chakra_Petch']">
                  แดชบอร์ดครูผู้สอน
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                  {teacherProfile.teacherId || 'ครูประจำการ'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold">
                  {teacherProfile.schoolName || 'สสวท. ม.1'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-300 mt-1">
                <span>คุณครู: <strong className="text-white text-sm sm:text-base font-bold">{teacherUser.name}</strong></span>
                <span className="text-slate-500 hidden sm:inline">•</span>
                <span className="text-emerald-300">{teacherProfile.subjectTaught || 'เทคโนโลยี (วิทยาการคำนวณ) ม.1'}</span>
              </div>
            </div>
          </div>

          {/* High-Impact Export Controls & Edit Profile Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="seed-demo-students-btn"
              type="button"
              onClick={handleSeedDemoStudents}
              className="px-3.5 py-2.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-500/50 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-md hover:scale-105 cursor-pointer"
              title="เติมและรีเซ็ตข้อมูลนักเรียนจำลอง (S01-S15 ม.1/1, ม.1/2, ม.1/3 และคำขอใหม่ P01-P03)"
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>🎓 เติม/รีเซ็ตนักเรียนจำลอง</span>
            </button>

            <button
              id="edit-teacher-profile-btn"
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-emerald-950/80 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-md hover:scale-105"
              title="แก้ไขข้อมูลชื่อ-นามสกุล, โรงเรียน และอัปโหลดรูปโปรไฟล์"
            >
              <Edit3 className="w-4 h-4 text-emerald-400" />
              <span>แก้ไขโปรไฟล์ครู / อัพรูป</span>
            </button>

            <button
              id="export-google-sheets-btn"
              disabled={isExportingSheets}
              onClick={handleExportToGoogleSheets}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg hover:scale-105 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isExportingSheets ? 'กำลังสร้าง Google Sheets...' : 'ส่งออกสู่ Google Sheets'}</span>
            </button>

            <button
              id="copy-google-sheets-btn"
              type="button"
              onClick={handleCopyForGoogleSheets}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white border border-amber-500/30 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="คัดลอกตารางคะแนนสำหรับวางลงใน Google Sheets (Ctrl+V) ได้ทันที"
            >
              <Copy className="w-4 h-4 text-amber-400" />
              <span>{copiedForSheets ? 'คัดลอกข้อมูลตารางแล้ว!' : 'คัดลอกลง Google Sheets'}</span>
            </button>

            <button
              id="export-csv-btn"
              onClick={handleDownloadCSV}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{csvNotice ? 'ดาวน์โหลด CSV เรียบร้อย!' : 'ดาวน์โหลด CSV'}</span>
            </button>
          </div>
        </div>

        {/* Sync Status Badge */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>สถานะระบบ: Google Sheets และ Firebase Firestore เชื่อมต่อตรงกัน (บทที่ 1 - 7 ครบถ้วน)</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            ซิงค์ตรงกันล่าสุดเมื่อ: <span className="text-white font-medium">{lastSyncedTime}</span>
          </div>
        </div>
      </div>

      {/* Demo Students Seeding Notice Banner */}
      {demoSeedNotice && (
        <div
          id="demo-seed-notice-banner"
          className="p-3.5 bg-indigo-500/20 border border-indigo-500/50 rounded-2xl flex items-center gap-3 text-indigo-200 text-xs sm:text-sm shadow-xl animate-fade-in"
        >
          <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
          <div className="font-semibold">{demoSeedNotice}</div>
        </div>
      )}

      {/* Firebase Sync Notice Banner */}
      {firebaseSyncNotice && (
        <div
          id="firebase-sync-notice-banner"
          className="p-3.5 bg-amber-500/15 border border-amber-500/40 rounded-2xl flex items-center gap-3 text-amber-200 text-xs sm:text-sm shadow-xl animate-fade-in"
        >
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="font-semibold">{firebaseSyncNotice}</div>
        </div>
      )}

      {/* Export Alerts & Success Link */}
      {exportedSheetUrl && (
        <div
          id="sheets-success-banner"
          className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center justify-between gap-4 text-emerald-200 text-xs sm:text-sm shadow-xl"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-emerald-300">
                สร้างสมุดบันทึกคะแนนใน Google Sheets สำเร็จเรียบร้อย! (ซิงค์ตรงกับ Firebase)
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                คลิกลิงก์เพื่อเปิดดูและแชร์ตารางคะแนนในบัญชี Google Workspace ของคุณ
              </div>
            </div>
          </div>

          <a
            href={exportedSheetUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-all shadow"
          >
            <span>เปิด Google Sheets</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {exportError && (
        <div
          id="sheets-error-banner"
          className="p-4 bg-amber-500/15 border border-amber-500/40 rounded-2xl flex items-center justify-between gap-4 text-amber-200 text-xs shadow-xl"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="font-bold text-amber-300">แจ้งเตือนระบบส่งออก:</div>
              <div>{exportError}</div>
            </div>
          </div>
          <button
            onClick={handleDownloadCSV}
            className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs shrink-0"
          >
            ใช้ไฟล์ CSV แทน
          </button>
        </div>
      )}

      {/* Teacher Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-x-auto text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveTab('gradebook')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'gradebook'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>สมุดคะแนนและส่งออก (Gradebook)</span>
        </button>

        <button
          onClick={() => setActiveTab('classrooms')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'classrooms'
              ? 'bg-teal-500 text-slate-950 font-bold shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <School className="w-4 h-4" />
          <span>จัดการชั้นเรียน & ดึงนักเรียน</span>
        </button>

        <button
          onClick={() => setActiveTab('locks')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'locks'
              ? 'bg-rose-600 text-white font-bold shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Lock className="w-4 h-4 text-rose-300" />
          <span>ระบบล็อคด่าน (Stage Lock)</span>
        </button>

        <button
          onClick={() => setActiveTab('mistakes')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'mistakes'
              ? 'bg-rose-500 text-white font-bold shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>วิเคราะห์จุดผิดพลาดของนักเรียน (Mistakes)</span>
        </button>

        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'content'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>จัดการเนื้อหา วิดีโอ ข้อสอบ และเกม</span>
        </button>

        <button
          onClick={() => setActiveTab('worksheets')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'worksheets'
              ? 'bg-indigo-600 text-white font-bold shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>จัดการใบงานและตรวจให้คะแนน</span>
        </button>

        <button
          id="teacher-tab-requests"
          onClick={() => {
            setActiveTab('requests');
            refreshPending();
          }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'requests'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <UserCheck className="w-4 h-4 text-amber-300" />
          <span>คำขอสมัครเรียน (Student Requests)</span>
          {pendingStudents.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950 animate-pulse">
              {pendingStudents.length}
            </span>
          )}
        </button>
      </div>

      {/* VIEW: STUDENT REQUESTS (คำขอสมัครเรียน) */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-white font-['Chakra_Petch'] flex items-center gap-2.5">
                <UserCheck className="w-6 h-6 text-amber-400" />
                <span>คำขอสมัครเรียนของนักเรียนใหม่ (Pending Student Registrations)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                เมื่อคุณครูกด "ตอบรับเข้าห้องเรียน" นักเรียนจะได้รับการอนุมัติให้เข้าสู่ระบบได้ทันที และจะถูกบันทึกให้อยู่ในความรับผิดชอบของครูผู้กดรับ
              </p>
            </div>

            {/* Classroom Filter */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">กรองห้องเรียน:</span>
              <select
                value={selectedClassroom}
                onChange={(e) => {
                  setSelectedClassroom(e.target.value);
                  setPendingStudents(
                    StorageService.getPendingStudents(e.target.value === 'all' ? undefined : e.target.value)
                  );
                }}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="all">ทุกห้องเรียน</option>
                {allClasses.map((cls) => (
                  <option key={cls.id} value={cls.name}>
                    ห้อง {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {pendingStudents.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white">ไม่มีคำขอสมัครเรียนใหม่ที่รอดำเนินการ</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                นักเรียนทุกคนในห้องเรียนได้รับการตอบรับเรียบร้อยแล้ว หรือยังไม่มีนักเรียนสมัครเข้ามาใหม่
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingStudents.map((item) => (
                <div
                  key={item.user.id}
                  className="p-5 rounded-3xl bg-slate-900 border border-amber-500/30 shadow-xl space-y-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-start gap-3 relative">
                    <img
                      src={item.user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.user.id}`}
                      alt={item.user.name}
                      className="w-12 h-12 rounded-2xl bg-slate-800 border border-amber-500/40 p-0.5 object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-base truncate">
                        {item.user.name}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                        {item.user.email}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs space-y-2 text-slate-300">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">รหัสนักเรียน:</span>
                      <span className="font-mono font-bold text-indigo-300">{item.profile.studentId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">ห้องเรียนที่สมัคร:</span>
                      <span className="font-bold text-amber-300">ห้อง {item.profile.classroom}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">เลขที่:</span>
                      <span className="font-semibold text-slate-200">เลขที่ {item.profile.seatNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">สมัครเมื่อ:</span>
                      <span className="text-slate-400">{new Date(item.user.createdAt).toLocaleString('th-TH')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleApproveStudent(item.user.id, item.user.name)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg hover:scale-[1.02] active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>ตอบรับเข้าห้องเรียน</span>
                    </button>
                    <button
                      onClick={() => handleRejectStudent(item.user.id, item.user.name)}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 border border-slate-700 hover:border-rose-500 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>ปฏิเสธ</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 1: GRADEBOOK */}
      {activeTab === 'gradebook' && (
        <div className="space-y-6">
          {/* Analytics KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">จำนวนนักเรียนในมุมมอง</div>
            <div className="text-2xl font-black text-white font-['Chakra_Petch']">
              {totalStudentsCount} คน
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/15 text-amber-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">คะแนนเฉลี่ยรวม</div>
            <div className="text-2xl font-black text-amber-400 font-['Chakra_Petch']">
              {avgTotalScore} คะแนน
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center gap-3">
          <div className="p-3 rounded-xl bg-teal-500/15 text-teal-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">ผ่านเกณฑ์ขั้นต่ำ</div>
            <div className="text-2xl font-black text-white font-['Chakra_Petch']">
              {passedStudentsCount} คน ({passRate}%)
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/15 text-indigo-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">หลักสูตรและตัวชี้วัด</div>
            <div className="text-2xl font-black text-white font-['Chakra_Petch']">
              6 บทเรียน
            </div>
          </div>
        </div>
      </div>

      {/* Classroom Filter & Search Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Class switcher tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setSelectedClassroom('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
              selectedClassroom === 'all'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ทุกห้องเรียน ({allStudentUsers.length})
          </button>
          {allClasses.map((cls) => {
            const count = allProfiles.filter((p) => p.classroom === cls.name).length;
            return (
              <button
                key={cls.id}
                onClick={() => setSelectedClassroom(cls.name)}
                className={`px-3 py-1.5 rounded-lg transition-colors shrink-0 flex items-center gap-1.5 ${
                  selectedClassroom === cls.name
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{cls.name}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setActiveTab('classrooms')}
            className="px-2.5 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 text-xs font-bold transition-colors shrink-0 flex items-center gap-1"
            title="เพิ่มห้องเรียนใหม่ หรือดึงนักเรียนเข้าห้อง"
          >
            <Plus className="w-3 h-3" />
            <span>จัดการชั้นเรียน / ดึงนักเรียน</span>
          </button>
        </div>

        {/* Teacher Filter & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
          {/* Teacher Selector */}
          <select
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-medium"
          >
            <option value="all">👨‍🏫 คุณครูทุกคน (ทุกห้อง)</option>
            <option value="mine">⭐ ในความดูแลของฉัน (ครู{teacherUser.name})</option>
            {allUsers
              .filter((u) => u.role === 'teacher' && u.id !== teacherUser.id)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  ครู {t.name}
                </option>
              ))}
          </select>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="ค้นหาชื่อ, รหัสนักเรียน หรือครู..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>
      </div>

      {/* Gradebook Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-white font-['Chakra_Petch'] flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>ตารางคะแนนผลการเรียนรู้รายบุคคล (Gradebook Table)</span>
          </h3>
          <span className="text-xs text-slate-400">
            แสดงข้อมูลนักเรียน {filteredStudents.length} คน
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/40">
                <th className="py-3 px-3">เลขที่</th>
                <th className="py-3 px-3">รหัสนักเรียน</th>
                <th className="py-3 px-3">ชื่อ-นามสกุล</th>
                <th className="py-3 px-3">ห้อง</th>
                <th className="py-3 px-3">ครูผู้ดูแล</th>
                <th className="py-3 px-2 text-center" title="สอบ บทที่ 1">บท 1</th>
                <th className="py-3 px-2 text-center" title="สอบ บทที่ 2">บท 2</th>
                <th className="py-3 px-2 text-center" title="สอบ บทที่ 3">บท 3</th>
                <th className="py-3 px-2 text-center" title="สอบ บทที่ 4">บท 4</th>
                <th className="py-3 px-2 text-center" title="สอบ บทที่ 5">บท 5</th>
                <th className="py-3 px-2 text-center" title="สอบ บทที่ 6">บท 6</th>
                <th className="py-3 px-2 text-center text-amber-400 font-bold" title="สอบ บทที่ 7 ข้อสอบประมวลผลสัมฤทธิ์ปลายภาค (30 ข้อ)">บท 7 (สอบรวม)</th>
                <th className="py-3 px-3 text-center">สอบรวม</th>
                <th className="py-3 px-3 text-center">มินิเกม</th>
                <th className="py-3 px-3 text-center">คะแนนรวม</th>
                <th className="py-3 px-3 text-center">XP สะสม</th>
                <th className="py-3 px-3 text-center">ผลการประเมิน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={17} className="text-center py-8 text-slate-500">
                    ไม่พบข้อมูลนักเรียนที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu) => (
                  <tr key={stu.user.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-300">
                      {stu.profile?.seatNumber || '-'}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono">
                      {stu.profile?.studentId || '-'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-white flex items-center gap-2">
                        <img
                          src={stu.user.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=Adventure'}
                          alt={stu.user.name}
                          className="w-6 h-6 rounded-full bg-slate-800"
                        />
                        <span>{stu.user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {stu.profile?.classroom || 'ม.1/1'}
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-medium text-xs">
                      {stu.profile?.assignedTeacherName || teacherUser.name}
                    </td>

                    {/* Chapters 1 - 7 quiz scores */}
                    {[1, 2, 3, 4, 5, 6, 7].map((ch) => (
                      <td key={ch} className="py-3 px-2 text-center font-medium">
                        {stu.chapterQuizScores[ch] !== undefined ? (
                          <span className={ch === 7 ? 'text-amber-400 font-bold' : stu.chapterQuizScores[ch] >= 2 ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                            {stu.chapterQuizScores[ch]}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    ))}

                    <td className="py-3 px-3 text-center font-bold text-emerald-400">
                      {stu.quizTotal}
                    </td>

                    <td className="py-3 px-3 text-center font-semibold text-amber-400">
                      {stu.gameTotal}
                    </td>

                    <td className="py-3 px-3 text-center font-black text-amber-300">
                      {stu.totalScore}
                    </td>

                    <td className="py-3 px-3 text-center text-xs font-semibold text-indigo-300">
                      {stu.xp} XP
                    </td>

                    <td className="py-3 px-3 text-center">
                      {stu.totalScore >= 12 ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold">
                          ดีมาก
                        </span>
                      ) : stu.totalScore >= 8 ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-semibold">
                          ผ่านเกณฑ์
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-semibold">
                          รอประเมิน
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

  {/* VIEW 2: CLASSROOM & STUDENT ROSTER MANAGER */}
  {activeTab === 'classrooms' && (
    <TeacherClassroomManager
      teacherUser={teacherUser}
      initialSelectedClass={selectedClassroom === 'all' ? (allClasses[0]?.name || 'ม.1/1') : selectedClassroom}
      onDataChanged={() => {
        setDataRefreshKey((k) => k + 1);
        onProfileUpdated();
      }}
    />
  )}

  {/* VIEW: STAGE LOCK CONTROL CENTER (ล็อคด่าน) */}
  {activeTab === 'locks' && (
    <TeacherStageLockManager
      onLocksUpdated={() => {
        setDataRefreshKey((k) => k + 1);
        onLessonsUpdated();
      }}
    />
  )}

  {/* VIEW 3: MISTAKE ANALYTICS */}
  {activeTab === 'mistakes' && (
    <TeacherMistakeAnalytics teacherUser={teacherUser} />
  )}

  {/* VIEW 4: LESSON / VIDEO / QUIZ / GAME CONTENT MANAGER */}
  {activeTab === 'content' && (
    <TeacherContentManager
      lessons={lessons}
      onLessonsUpdated={onLessonsUpdated}
    />
  )}

  {/* VIEW 5: WORKSHEET MANAGER & GRADING */}
  {activeTab === 'worksheets' && (
    <TeacherWorksheetManager teacherUser={teacherUser} />
  )}

  {/* VIEW 6: STUDENT ADMISSION REQUESTS (คำขอสมัครเรียน) */}
  {activeTab === 'requests' && (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-xl text-white font-['Chakra_Petch'] flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-amber-400" />
              <span>คำขอสมัครเข้าเรียนของนักเรียน (Student Requests)</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              ตรวจสอบรายชื่อนักเรียนที่ลงทะเบียนใหม่ เลือกว่าจะอนุมัติเพื่อรับเข้าเป็นนักเรียนในความดูแล หรือปฏิเสธคำขอ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSeedDemoStudents}
              className="px-3 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="เติมตัวอย่างนักเรียนจำลองและคำขอใหม่ 3 รายการ (P01-P03)"
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>เติมตัวอย่างคำขอจำลอง</span>
            </button>
          </div>
        </div>

        {/* Classroom filter for requests */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
          <span className="text-slate-400 font-medium shrink-0">กรองตามห้อง:</span>
          <button
            type="button"
            onClick={() => {
              setSelectedClassroom('all');
              setPendingStudents(StorageService.getPendingStudents(undefined));
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
              selectedClassroom === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white bg-slate-800'
            }`}
          >
            ทั้งหมด ({StorageService.getPendingStudents(undefined).length})
          </button>
          {allClasses.map((cls) => {
            const count = StorageService.getPendingStudents(cls.name).length;
            return (
              <button
                key={cls.id}
                type="button"
                onClick={() => {
                  setSelectedClassroom(cls.name);
                  setPendingStudents(StorageService.getPendingStudents(cls.name));
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                  selectedClassroom === cls.name
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white bg-slate-800'
                }`}
              >
                {cls.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Requests List */}
        {pendingStudents.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-slate-950/40 border border-slate-800/80">
            <CheckCircle2 className="w-12 h-12 text-emerald-400/80 mx-auto mb-3" />
            <div className="text-white font-bold text-base">ไม่มีคำขอสมัครเรียนที่รอการอนุมัติในขณะนี้</div>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              นักเรียนทุกคนได้รับการอนุมัติเรียบร้อยแล้ว หรือสามารถกดปุ่ม "เติมตัวอย่างคำขอจำลอง" ด้านบนเพื่อทดสอบระบบได้
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {pendingStudents.map((req) => (
              <div
                key={req.user.id}
                className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition-all shadow-lg flex flex-col justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <img
                    src={req.user.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=Adventure'}
                    alt={req.user.name}
                    className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm truncate">{req.user.name}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">{req.user.email}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold">
                        ห้อง {req.profile?.classroom || 'ม.1/1'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold font-mono">
                        {req.profile?.studentId || 'S16'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApproveStudent(req.user.id, req.user.name)}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>อนุมัติเข้าเรียน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRejectStudent(req.user.id, req.user.name)}
                    className="py-2 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-white border border-rose-800/50 text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="ปฏิเสธคำขอ"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>ปฏิเสธ</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )}

  {/* Teacher Profile & Avatar Edit Modal */}
  {isProfileModalOpen && (
    <TeacherProfileEditModal
      isOpen={isProfileModalOpen}
      user={teacherUser}
      onClose={() => setIsProfileModalOpen(false)}
      onProfileUpdated={() => {
        onProfileUpdated();
      }}
    />
  )}
</div>
);
};
