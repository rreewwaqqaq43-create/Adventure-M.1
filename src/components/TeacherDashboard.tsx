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
  Lock
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
  const [activeTab, setActiveTab] = useState<'gradebook' | 'classrooms' | 'locks' | 'mistakes' | 'content' | 'worksheets'>('gradebook');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [dataRefreshKey, setDataRefreshKey] = useState<number>(0);

  // Fetch teacher profile details and classes
  const teacherProfile = StorageService.getTeacherProfile(teacherUser.id);
  const allClasses = StorageService.getClasses();

  // Export states
  const [isExportingSheets, setIsExportingSheets] = useState(false);
  const [exportedSheetUrl, setExportedSheetUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [csvNotice, setCsvNotice] = useState(false);

  // Fetch all students
  const allUsers = StorageService.getUsers();
  const allProfiles = StorageService.getStudentProfiles();
  const allStudentUsers = allUsers.filter((u) => u.role === 'student');

  const students = allStudentUsers
    .map((u) => {
      const profile = allProfiles.find((p) => p.userId === u.id);
      const progress = StorageService.getProgress(u.id);

      // Aggregate scores across 6 chapters
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
    const matchSearch =
      s.user.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (s.profile?.studentId || '').toLowerCase().includes(searchFilter.toLowerCase());
    return matchClass && matchSearch;
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

  // Handle Export to Google Sheets
  const handleExportToGoogleSheets = async () => {
    setIsExportingSheets(true);
    setExportError(null);
    setExportedSheetUrl(null);

    try {
      let token = getOAuthAccessToken();
      if (!token) {
        // Automatically request Google authorization popup with Google Sheets scope
        const googleAuth = await signInWithGoogle();
        if (googleAuth?.accessToken) {
          token = googleAuth.accessToken;
        } else {
          throw new Error('กรุณาลงชื่อเข้าใช้ด้วย Google และอนุญาตสิทธิ์การเข้าถึง Google Sheets');
        }
      }

      const headers = [
        'เลขที่',
        'รหัสนักเรียน',
        'ชื่อ-นามสกุล',
        'ห้องเรียน',
        'สอบ บทที่ 1 (3)',
        'สอบ บทที่ 2 (3)',
        'สอบ บทที่ 3 (3)',
        'สอบ บทที่ 4 (3)',
        'สอบ บทที่ 5 (3)',
        'สอบ บทที่ 6 (3)',
        'คะแนนแบบทดสอบรวม (18)',
        'คะแนนมินิเกมรวม',
        'คะแนนสุทธิ',
        'XP รวม',
        'ผลการประเมิน',
      ];

      const rows = filteredStudents.map((s) => [
        s.profile?.seatNumber || 1,
        s.profile?.studentId || '-',
        s.user.name,
        s.profile?.classroom || 'ม.1/1',
        s.chapterQuizScores[1] || 0,
        s.chapterQuizScores[2] || 0,
        s.chapterQuizScores[3] || 0,
        s.chapterQuizScores[4] || 0,
        s.chapterQuizScores[5] || 0,
        s.chapterQuizScores[6] || 0,
        s.quizTotal,
        s.gameTotal,
        s.totalScore,
        s.xp,
        s.totalScore >= 12 ? 'ผ่านเกณฑ์ระดับดีมาก' : s.totalScore >= 8 ? 'ผ่านเกณฑ์' : 'รอปรับปรุง',
      ]);

      const title = `สมุดบันทึกผลการเรียน Adventure M.1 - ห้อง ${selectedClassroom === 'all' ? 'ทุกห้อง' : selectedClassroom}`;
      const sheetUrl = await createGradebookSpreadsheet(
        selectedClassroom === 'all' ? 'ม.1' : selectedClassroom,
        title,
        headers,
        rows,
        token
      );

      setExportedSheetUrl(sheetUrl);
    } catch (err: any) {
      console.error('Export error:', err);
      setExportError(
        err?.message ||
          'การเชื่อมต่อ Google Sheets ต้องการการอนุญาต OAuth กรุณากด Sign in with Google หรือดาวน์โหลดไฟล์ CSV แทนได้ทันที'
      );
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
              id="export-csv-btn"
              onClick={handleDownloadCSV}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{csvNotice ? 'ดาวน์โหลด CSV เรียบร้อย!' : 'ดาวน์โหลด CSV'}</span>
            </button>
          </div>
        </div>
      </div>

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
                สร้างสมุดบันทึกคะแนนใน Google Sheets สำเร็จเรียบร้อย!
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
      </div>

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

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="ค้นหาชื่อ หรือ รหัสนักเรียน..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
          />
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
                <th className="py-3 px-2 text-center" title="สอบ บทที่ 1">บท 1</th>
                <th className="py-3 px-2 text-center" title="สอบ บทที่ 2">บท 2</th>
                <th className="py-3 px-2 text-center" title="สอบ บทที่ 3">บท 3</th>
                <th className="py-3 px-2 text-center" title="สอบ บทที่ 4">บท 4</th>
                <th className="py-3 px-2 text-center" title="สอบ บทที่ 5">บท 5</th>
                <th className="py-3 px-2 text-center" title="สอบ บทที่ 6">บท 6</th>
                <th className="py-3 px-3 text-center">สอบรวม (18)</th>
                <th className="py-3 px-3 text-center">มินิเกม</th>
                <th className="py-3 px-3 text-center">คะแนนรวม</th>
                <th className="py-3 px-3 text-center">XP สะสม</th>
                <th className="py-3 px-3 text-center">ผลการประเมิน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={15} className="text-center py-8 text-slate-500">
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

                    {/* Chapters 1 - 6 quiz scores */}
                    {[1, 2, 3, 4, 5, 6].map((ch) => (
                      <td key={ch} className="py-3 px-2 text-center font-medium">
                        {stu.chapterQuizScores[ch] !== undefined ? (
                          <span className={stu.chapterQuizScores[ch] >= 2 ? 'text-emerald-400' : 'text-slate-400'}>
                            {stu.chapterQuizScores[ch]}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    ))}

                    <td className="py-3 px-3 text-center font-bold text-emerald-400">
                      {stu.quizTotal} / 18
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
