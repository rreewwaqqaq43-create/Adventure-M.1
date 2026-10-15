/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, StudentProfile, ClassRoom, TeacherProfile } from '../../types';
import { StorageService } from '../../services/storage';
import { feedback } from '../../utils/feedback';
import {
  Users,
  Plus,
  UserPlus,
  UserCheck,
  Search,
  School,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit2,
  ArrowRightLeft,
  FileText,
  Upload,
  KeyRound,
  Check,
  X,
  RefreshCw,
  Award,
  BookOpen,
  HelpCircle,
  Download,
  Lock,
  Unlock,
  BarChart3,
  Layers,
  ShieldAlert,
  Gauge,
  Sliders,
  ChevronRight,
  TrendingUp,
  Flame
} from 'lucide-react';

interface TeacherClassroomManagerProps {
  teacherUser: User;
  onDataChanged: () => void;
  initialSelectedClass?: string;
}

export const TeacherClassroomManager: React.FC<TeacherClassroomManagerProps> = ({
  teacherUser,
  onDataChanged,
  initialSelectedClass = 'ม.1/1',
}) => {
  const [classes, setClasses] = useState<ClassRoom[]>(() => StorageService.getClasses());
  const [selectedClass, setSelectedClass] = useState<string>(initialSelectedClass);
  const [activeSubTab, setActiveSubTab] = useState<
    'roster' | 'pull' | 'add_single' | 'batch_import' | 'classes' | 'progress' | 'locks'
  >('roster');

  // Search & Filters
  const [rosterSearch, setRosterSearch] = useState('');
  const [pullSearch, setPullSearch] = useState('');
  const [selectedPullUserIds, setSelectedPullUserIds] = useState<string[]>([]);

  // Modals & Feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Class Form State
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('ม.1');
  const [newClassYear, setNewClassYear] = useState('2569');
  const [newClassPassScore, setNewClassPassScore] = useState<number>(11); // คะแนนผ่าน เช่น 11 จาก 18
  const [newClassPassRate, setNewClassPassRate] = useState<number>(60);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  // Single Student Add Form State
  const [singleStudentId, setSingleStudentId] = useState('');
  const [singleName, setSingleName] = useState('');
  const [singleEmail, setSingleEmail] = useState('');
  const [singleSeatNumber, setSingleSeatNumber] = useState<number>(1);
  const [singlePassword, setSinglePassword] = useState('password123');

  // Batch Import State
  const [batchText, setBatchText] = useState(
    `6701004, เด็กชายกรวิชญ์ พัฒนา, 4\n6701005, เด็กหญิงกัญญารัตน์ ฉลาดดี, 5\n6701006, เด็กชายจิรภัทร ปรีชากุล, 6`
  );

  // Editing Student Seat / Classroom
  const [movingStudent, setMovingStudent] = useState<{ user: User; profile?: StudentProfile } | null>(null);
  const [targetClassroom, setTargetClassroom] = useState<string>('ม.1/1');
  const [targetSeatNumber, setTargetSeatNumber] = useState<number>(1);

  // Chapter locking state helper
  const [lockingClassTarget, setLockingClassTarget] = useState<string>(selectedClass);

  // Chapter definitions for locking & progress
  const CHAPTERS = [
    { number: 1, title: 'แนวคิดเชิงนามธรรม (Abstraction)', icon: '🧩' },
    { number: 2, title: 'การแก้ปัญหาและขั้นตอนวิธี (Algorithm & Flowchart)', icon: '📝' },
    { number: 3, title: 'การเขียนโปรแกรมด้วยภาษา Python (Python & Text Adventure)', icon: '🐍' },
    { number: 4, title: 'การเขียนโปรแกรมด้วย Scratch (Scratch Blocks)', icon: '🐱' },
    { number: 5, title: 'ข้อมูลและการประมวลผล (Data Processing)', icon: '📊' },
    { number: 6, title: 'การใช้เทคโนโลยีอย่างปลอดภัย (Cyber Safety)', icon: '🛡️' },
    { number: 7, title: 'แบบทดสอบวัดผลสัมฤทธิ์รวม 6 บท (Comprehensive Final Exam)', icon: '🏆' },
  ];

  // Load all users and profiles fresh
  const allUsers = StorageService.getUsers();
  const allProfiles = StorageService.getStudentProfiles();
  const allStudentUsers = allUsers.filter((u) => u.role === 'student');

  // Students in selected class
  const classStudents = allStudentUsers
    .map((u) => {
      const profile = allProfiles.find((p) => p.userId === u.id);
      return { user: u, profile };
    })
    .filter((s) => s.profile?.classroom === selectedClass)
    .sort((a, b) => (a.profile?.seatNumber || 0) - (b.profile?.seatNumber || 0));

  // Filtered class roster by search
  const filteredClassStudents = classStudents.filter((s) => {
    const q = rosterSearch.toLowerCase();
    return (
      s.user.name.toLowerCase().includes(q) ||
      (s.profile?.studentId || '').toLowerCase().includes(q) ||
      s.user.email.toLowerCase().includes(q)
    );
  });

  // Students available to pull (either from other classes or unassigned)
  const availableToPull = allStudentUsers
    .map((u) => {
      const profile = allProfiles.find((p) => p.userId === u.id);
      return { user: u, profile };
    })
    .filter((s) => s.profile?.classroom !== selectedClass)
    .filter((s) => {
      const q = pullSearch.toLowerCase();
      return (
        s.user.name.toLowerCase().includes(q) ||
        (s.profile?.studentId || '').toLowerCase().includes(q) ||
        (s.profile?.classroom || '').toLowerCase().includes(q) ||
        s.user.email.toLowerCase().includes(q)
      );
    });

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setSuccessMsg(null);
      feedback.error(msg);
    } else {
      setSuccessMsg(msg);
      setErrorMsg(null);
      feedback.save(msg);
    }
    setTimeout(() => {
      setSuccessMsg(null);
      setErrorMsg(null);
    }, 4000);
  };

  // 1. Create or Update Classroom
  const handleSaveClassroom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) {
      showNotification('กรุณาระบุชื่อชั้นเรียน เช่น ม.1/3', true);
      return;
    }

    const trimmedName = newClassName.trim();
    const currentClasses = StorageService.getClasses();

    if (editingClassId) {
      // Edit mode
      const target = currentClasses.find((c) => c.id === editingClassId);
      if (target) {
        const oldName = target.name;
        target.name = trimmedName;
        target.grade = newClassGrade.trim() || 'ม.1';
        target.academicYear = newClassYear.trim() || '2569';
        target.passThresholdScore = newClassPassScore;
        target.passThresholdPercent = Math.round((newClassPassScore / 18) * 100);
        StorageService.saveClasses(currentClasses);

        // Update students that belonged to old class name
        if (oldName !== trimmedName) {
          const profiles = StorageService.getStudentProfiles();
          profiles.forEach((p) => {
            if (p.classroom === oldName) {
              p.classroom = trimmedName;
            }
          });
          StorageService.saveStudentProfiles(profiles);
        }

        setClasses(StorageService.getClasses());
        setSelectedClass(trimmedName);
        setEditingClassId(null);
        setNewClassName('');
        feedback.edit(`แก้ไขข้อมูลชั้นเรียน "${trimmedName}" เรียบร้อยแล้ว`);
        showNotification(`แก้ไขข้อมูลชั้นเรียน "${trimmedName}" เรียบร้อยแล้ว!`);
        onDataChanged();
      }
    } else {
      // Create mode
      if (currentClasses.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())) {
        showNotification(`ชั้นเรียน "${trimmedName}" มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น`, true);
        return;
      }

      const calculatedPercent = Math.round((newClassPassScore / 18) * 100);

      const newCls: ClassRoom = {
        id: `class-${Date.now()}`,
        name: trimmedName,
        grade: newClassGrade.trim() || 'ม.1',
        academicYear: newClassYear.trim() || '2569',
        teacherId: teacherUser.id,
        assistantTeacherIds: [],
        studentCount: 0,
        passThresholdScore: newClassPassScore || 11,
        passThresholdPercent: calculatedPercent || 60,
        lockedChapters: [],
      };

      StorageService.addClass(newCls);
      setClasses(StorageService.getClasses());
      setSelectedClass(trimmedName);
      setNewClassName('');
      feedback.add(`เพิ่มชั้นเรียนใหม่ "${trimmedName}" สำเร็จ`);
      showNotification(`เพิ่มชั้นเรียนใหม่ "${trimmedName}" สำเร็จเรียบร้อย!`);
      onDataChanged();
    }
  };

  // 2. Delete Classroom
  const handleDeleteClassroom = (cls: ClassRoom) => {
    if (classes.length <= 1) {
      showNotification('ต้องมีชั้นเรียนคงเหลือในระบบอย่างน้อย 1 ห้อง', true);
      return;
    }

    const confirmDel = window.confirm(
      `คุณต้องการลบชั้นเรียน "${cls.name}" หรือไม่?\n(นักเรียนในห้องนี้จะถูกย้ายไปยังห้อง ${classes[0].id === cls.id ? classes[1].name : classes[0].name})`
    );
    if (!confirmDel) return;

    const fallbackClass = classes.find((c) => c.id !== cls.id)?.name || 'ม.1/1';

    // Reassign students
    const profiles = StorageService.getStudentProfiles();
    profiles.forEach((p) => {
      if (p.classroom === cls.name) {
        p.classroom = fallbackClass;
      }
    });
    StorageService.saveStudentProfiles(profiles);

    StorageService.deleteClass(cls.id);
    const updated = StorageService.getClasses();
    setClasses(updated);
    setSelectedClass(fallbackClass);
    feedback.delete(`ลบชั้นเรียน "${cls.name}" เรียบร้อยแล้ว`);
    showNotification(`ลบชั้นเรียน "${cls.name}" และย้ายนักเรียนไปยัง "${fallbackClass}" แล้ว`);
    onDataChanged();
  };

  // 3. Pull a Single Student into Current Class
  const handlePullSingleStudent = (studentUser: User, currentProfile?: StudentProfile) => {
    const nextSeat = classStudents.length + 1;
    const profiles = StorageService.getStudentProfiles();
    const idx = profiles.findIndex((p) => p.userId === studentUser.id);

    if (idx >= 0) {
      profiles[idx] = {
        ...profiles[idx],
        classroom: selectedClass,
        seatNumber: nextSeat,
      };
    } else {
      profiles.push({
        userId: studentUser.id,
        studentId: `67010${profiles.length + 10}`,
        gradeLevel: 'ม.1',
        classroom: selectedClass,
        seatNumber: nextSeat,
        xp: 150,
        level: 1,
        totalCompletedLessons: 0,
      });
    }

    StorageService.saveStudentProfiles(profiles);
    showNotification(`ดึง "${studentUser.name}" เข้าชั้นเรียน ${selectedClass} (เลขที่ ${nextSeat}) เรียบร้อย!`);
    onDataChanged();
  };

  // 4. Batch Pull Selected Students
  const handleBatchPullSelected = () => {
    if (selectedPullUserIds.length === 0) return;

    const profiles = StorageService.getStudentProfiles();
    let currentSeat = classStudents.length + 1;

    selectedPullUserIds.forEach((uid) => {
      const idx = profiles.findIndex((p) => p.userId === uid);
      if (idx >= 0) {
        profiles[idx] = {
          ...profiles[idx],
          classroom: selectedClass,
          seatNumber: currentSeat++,
        };
      }
    });

    StorageService.saveStudentProfiles(profiles);
    showNotification(`ดึงนักเรียนจำนวน ${selectedPullUserIds.length} คน เข้าชั้นเรียน ${selectedClass} เรียบร้อยแล้ว!`);
    setSelectedPullUserIds([]);
    onDataChanged();
  };

  // 5. Add Individual Student Form Submit
  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim() || !singleStudentId.trim()) {
      showNotification('กรุณากรอกชื่อ-นามสกุล และรหัสนักเรียน', true);
      return;
    }

    const currentUsers = StorageService.getUsers();
    const currentProfiles = StorageService.getStudentProfiles();

    // Check duplicate studentId
    if (currentProfiles.some((p) => p.studentId === singleStudentId.trim())) {
      showNotification(`รหัสนักเรียน "${singleStudentId}" มีอยู่ในระบบแล้ว`, true);
      return;
    }

    const newUserId = `student-${Date.now()}`;
    const cleanEmail =
      singleEmail.trim() || `${singleStudentId.trim()}@student.school.ac.th`;

    const newUser: User = {
      id: newUserId,
      name: singleName.trim(),
      email: cleanEmail,
      role: 'student',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${newUserId}`,
      password: singlePassword.trim() || 'password123',
      createdAt: new Date().toISOString(),
    };

    const newProfile: StudentProfile = {
      userId: newUserId,
      studentId: singleStudentId.trim(),
      gradeLevel: 'ม.1',
      classroom: selectedClass,
      seatNumber: singleSeatNumber || classStudents.length + 1,
      xp: 150,
      level: 1,
      totalCompletedLessons: 0,
    };

    StorageService.addUser(newUser);
    currentProfiles.push(newProfile);
    StorageService.saveStudentProfiles(currentProfiles);

    showNotification(`เพิ่มนักเรียน "${singleName.trim()}" เข้าห้อง ${selectedClass} สำเร็จ!`);
    setSingleName('');
    setSingleStudentId('');
    setSingleEmail('');
    setSingleSeatNumber(classStudents.length + 2);
    setActiveSubTab('roster');
    onDataChanged();
  };

  // 6. Batch Import Students Submit
  const handleBatchImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchText.trim()) {
      showNotification('กรุณาวางรายชื่อนักเรียนในกล่องข้อความ', true);
      return;
    }

    const lines = batchText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) return;

    const currentUsers = StorageService.getUsers();
    const currentProfiles = StorageService.getStudentProfiles();
    let addedCount = 0;
    let nextSeat = classStudents.length + 1;

    lines.forEach((line, index) => {
      // Format: StudentID, Name, [SeatNumber]
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        const sId = parts[0];
        const sName = parts[1];
        const sSeat = parts[2] ? parseInt(parts[2], 10) || nextSeat : nextSeat;
        nextSeat = sSeat + 1;

        const uId = `student-batch-${Date.now()}-${index}`;
        const uEmail = `${sId}@student.school.ac.th`;

        // Check if user exists
        const existingIdx = currentProfiles.findIndex((p) => p.studentId === sId);
        if (existingIdx >= 0) {
          currentProfiles[existingIdx].classroom = selectedClass;
          currentProfiles[existingIdx].seatNumber = sSeat;
        } else {
          currentUsers.push({
            id: uId,
            name: sName,
            email: uEmail,
            role: 'student',
            avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${uId}`,
            password: 'password123',
            createdAt: new Date().toISOString(),
          });
          StorageService.saveUsers(currentUsers);

          currentProfiles.push({
            userId: uId,
            studentId: sId,
            gradeLevel: 'ม.1',
            classroom: selectedClass,
            seatNumber: sSeat,
            xp: 150,
            level: 1,
            totalCompletedLessons: 0,
          });
        }
        addedCount++;
      }
    });

    StorageService.saveStudentProfiles(currentProfiles);
    showNotification(`นำเข้ารายชื่อนักเรียนจำนวน ${addedCount} คน เข้าห้อง ${selectedClass} เรียบร้อยแล้ว!`);
    setActiveSubTab('roster');
    onDataChanged();
  };

  // 7. Move Student to another class or change seat
  const handleConfirmMoveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movingStudent) return;

    const profiles = StorageService.getStudentProfiles();
    const idx = profiles.findIndex((p) => p.userId === movingStudent.user.id);
    if (idx >= 0) {
      profiles[idx] = {
        ...profiles[idx],
        classroom: targetClassroom,
        seatNumber: targetSeatNumber,
      };
      StorageService.saveStudentProfiles(profiles);
      showNotification(`ย้ายนักเรียน "${movingStudent.user.name}" ไปยังห้อง ${targetClassroom} (เลขที่ ${targetSeatNumber}) สำเร็จ!`);
      setMovingStudent(null);
      onDataChanged();
    }
  };

  // 8. Remove student from this class (sets classroom to 'ยังไม่ระบุ')
  const handleRemoveFromClass = (studentUser: User) => {
    const confirmRemove = window.confirm(`ต้องการนำนักเรียน "${studentUser.name}" ออกจากชั้นเรียน ${selectedClass} หรือไม่?`);
    if (!confirmRemove) return;

    const profiles = StorageService.getStudentProfiles();
    const idx = profiles.findIndex((p) => p.userId === studentUser.id);
    if (idx >= 0) {
      profiles[idx] = {
        ...profiles[idx],
        classroom: 'ยังไม่ระบุห้อง',
        seatNumber: 0,
      };
      StorageService.saveStudentProfiles(profiles);
      showNotification(`นำนักเรียนออกจากห้อง ${selectedClass} แล้ว (สามารถดึงกลับมาได้ตลอดเวลา)`);
      onDataChanged();
    }
  };

  // 9. Chapter Lock Controls
  const handleToggleClassChapterLock = (className: string, chapterNum: number) => {
    const currentLocks = StorageService.getClassLockedChapters(className);
    let newLocks: number[];
    if (currentLocks.includes(chapterNum)) {
      newLocks = currentLocks.filter((c) => c !== chapterNum);
      showNotification(`🔓 ปลดล็อคบทที่ ${chapterNum} สำหรับห้อง ${className} แล้ว`);
    } else {
      newLocks = [...currentLocks, chapterNum].sort((a, b) => a - b);
      showNotification(`🔒 ล็อคบทที่ ${chapterNum} สำหรับห้อง ${className} แล้ว`);
    }

    StorageService.setClassLockedChapters(className, newLocks);
    setClasses(StorageService.getClasses());
    onDataChanged();
  };

  const handleApplyLockPreset = (className: string, lockedChapters: number[], presetLabel: string) => {
    StorageService.setClassLockedChapters(className, lockedChapters);
    setClasses(StorageService.getClasses());
    showNotification(`ตั้งค่าการล็อค "${presetLabel}" สำหรับห้อง ${className} สำเร็จ!`);
    onDataChanged();
  };

  // Global Lock Toggle (for all classes simultaneously)
  const handleApplyPresetToAllClasses = (lockedChapters: number[], presetLabel: string) => {
    const allCls = StorageService.getClasses();
    allCls.forEach((c) => {
      c.lockedChapters = [...lockedChapters];
    });
    StorageService.saveClasses(allCls);
    setClasses(StorageService.getClasses());
    showNotification(`ตั้งค่าการล็อค "${presetLabel}" ให้กับทุกชั้นเรียน (${allCls.length} ห้อง) สำเร็จ!`);
    onDataChanged();
  };

  // 10. Overview progress data calculation
  const classProgressOverview = StorageService.getClassroomProgressOverview();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950/70 to-slate-900 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <School className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white font-['Chakra_Petch']">
                  จัดการชั้นเรียน & ติดตามการเรียนรายห้อง
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  Classroom Hub
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                ย้ายนักเรียน เพิ่มห้อง/นักเรียน ดูว่าห้องไหนเรียนถึงไหนแล้ว และล็อคด่านที่ยังไม่ถึงเพื่อให้ทุกคนเรียนไปพร้อมกัน
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('locks')}
              className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4 text-rose-400" />
              <span>🔒 ระบบล็อคด่าน</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('progress')}
              className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span>📊 ความคืบหน้ารายห้อง</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSubTab('classes');
                setEditingClassId(null);
                setNewClassName('');
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่มห้องเรียน</span>
            </button>
          </div>
        </div>
      </div>

      {/* Classroom Selector Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mr-2">
            <School className="w-3.5 h-3.5 text-emerald-400" />
            <span>เลือกชั้นเรียนที่กำลังจัดการ:</span>
          </span>

          {classes.map((cls) => {
            const count = allProfiles.filter((p) => p.classroom === cls.name).length;
            const isSelected = selectedClass === cls.name;
            const hasLocks = (cls.lockedChapters || []).length > 0;
            return (
              <button
                key={cls.id}
                type="button"
                onClick={() => {
                  setSelectedClass(cls.name);
                  setLockingClassTarget(cls.name);
                  setSingleSeatNumber(count + 1);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black scale-105'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{cls.name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isSelected ? 'bg-slate-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count} คน
                </span>
                {hasLocks && (
                  <span
                    className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                      isSelected ? 'bg-rose-900/80 text-rose-200' : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                    title={`ล็อคไว้ ${cls.lockedChapters?.length} บท`}
                  >
                    🔒 {cls.lockedChapters?.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>รวมทั้งหมด: <strong className="text-white">{classes.length}</strong> ห้อง</span>
          <span>•</span>
          <span>นักเรียนในระบบ: <strong className="text-emerald-400">{allStudentUsers.length}</strong> คน</span>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab('roster')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'roster'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span>รายชื่อนักเรียนห้อง {selectedClass} ({classStudents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('progress')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'progress'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <span>ความคืบหน้ารายห้อง (เรียนถึงไหนแล้ว)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('locks');
            setLockingClassTarget(selectedClass);
          }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'locks'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <Lock className="w-4 h-4 text-rose-400" />
          <span>ระบบล็อคด่านเพื่อเรียนพร้อมกัน</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('pull')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'pull'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <UserCheck className="w-4 h-4 text-amber-400" />
          <span>ดึงนักเรียนเข้าห้อง {selectedClass} ({availableToPull.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('add_single');
            setSingleSeatNumber(classStudents.length + 1);
          }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'add_single'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <UserPlus className="w-4 h-4 text-teal-400" />
          <span>+ เพิ่มนักเรียนรายคน</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('batch_import')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'batch_import'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <Upload className="w-4 h-4 text-sky-400" />
          <span>นำเข้ารายชื่อแบบกลุ่ม</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('classes')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'classes'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <School className="w-4 h-4 text-purple-400" />
          <span>จัดการห้องเรียน ({classes.length})</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fade-in shadow-lg">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/15 border border-rose-500/40 rounded-2xl text-rose-300 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fade-in shadow-lg">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 1: Class Roster Table                                  */}
      {/* ============================================================== */}
      {activeSubTab === 'roster' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="ค้นหาชื่อ, รหัสนักเรียน หรืออีเมล..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  setActiveSubTab('locks');
                  setLockingClassTarget(selectedClass);
                }}
                className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>ล็อคด่านห้องนี้</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('pull')}
                className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>ดึงนักเรียนเข้าห้องนี้</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('add_single')}
                className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มนักเรียนใหม่</span>
              </button>
            </div>
          </div>

          {filteredClassStudents.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">ยังไม่มีนักเรียนในชั้นเรียน {selectedClass}</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  คุณครูสามารถดึงนักเรียนที่มีอยู่ในระบบ ย้ายนักเรียนมาจากห้องอื่น หรือเพิ่มนักเรียนใหม่เข้าห้องนี้ได้ทันที
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('pull')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>ดึงนักเรียนเข้าห้อง</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('add_single')}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>เพิ่มนักเรียนคนใหม่</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase border-b border-slate-800 font-['Chakra_Petch']">
                  <tr>
                    <th className="py-3.5 px-4 font-bold text-center w-16">เลขที่</th>
                    <th className="py-3.5 px-4 font-bold">รหัสนักเรียน</th>
                    <th className="py-3.5 px-4 font-bold">ชื่อ - นามสกุล</th>
                    <th className="py-3.5 px-4 font-bold">อีเมล / บัญชี</th>
                    <th className="py-3.5 px-4 font-bold text-center">ระดับ (Level)</th>
                    <th className="py-3.5 px-4 font-bold text-center">XP รวม</th>
                    <th className="py-3.5 px-4 font-bold text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredClassStudents.map(({ user: student, profile }) => (
                    <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-emerald-400">
                        {profile?.seatNumber || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-200">
                        {profile?.studentId || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={student.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${student.id}`}
                            alt={student.name}
                            className="w-8 h-8 rounded-lg bg-slate-800 object-cover shrink-0"
                          />
                          <span className="font-bold text-white">{student.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs font-mono">
                        {student.email}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                          Lv. {profile?.level || 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-amber-400">
                        ⚡ {profile?.xp || 0}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setMovingStudent({ user: student, profile });
                              setTargetClassroom(selectedClass);
                              setTargetSeatNumber(profile?.seatNumber || 1);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 transition-colors"
                            title="ย้ายห้องเรียน / แก้ไขเลขที่"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>ย้ายห้อง</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveFromClass(student)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
                            title="นำออกจากห้องเรียนนี้"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB: PROGRESS OVERVIEW (ดูว่าห้องไหนเรียนถึงไหนแล้ว)          */}
      {/* ============================================================== */}
      {activeSubTab === 'progress' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-200 flex items-start justify-between gap-4">
            <div className="flex items-start gap-2.5">
              <BarChart3 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block mb-0.5">ภาพรวมความก้าวหน้าการเรียนแต่ละห้อง (Classroom Learning Progress):</span>
                ระบบคำนวณจำนวนนักเรียนที่เรียนสำเร็จในแต่ละบทเรียน (บทที่ 1 - 6) เพื่อให้คุณครูทราบทันทีว่า <strong>ห้องไหนเรียนถึงไหนแล้ว</strong> และห้องใดกำลังติดขัด
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveSubTab('locks')}
              className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shrink-0 shadow"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>ไปที่ระบบล็อคด่าน</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {classProgressOverview.map((item) => {
              const hasLocks = item.lockedChapters.length > 0;
              return (
                <div
                  key={item.classId}
                  className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-black text-lg">
                        {item.className}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-lg text-white font-['Chakra_Petch']">
                            ชั้นเรียน {item.className} ({item.grade})
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                            นักเรียน {item.studentCount} คน
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>📍 บทเรียนปัจจุบัน: <strong className="text-amber-400 font-bold">บทที่ {item.currentMilestoneChapter}</strong> ({CHAPTERS.find((c) => c.number === item.currentMilestoneChapter)?.title})</span>
                          <span>•</span>
                          <span>ปีการศึกษา {item.academicYear}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">ความสำเร็จรวมของห้อง</div>
                        <div className="text-xl font-black text-indigo-400 font-['Chakra_Petch']">
                          {item.overallAvgPercentage}%
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClass(item.className);
                            setActiveSubTab('roster');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
                        >
                          รายชื่อนักเรียน
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLockingClassTarget(item.className);
                            setActiveSubTab('locks');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <Lock className="w-3 h-3 text-rose-400" />
                          <span>จัดการล็อค</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 6 Chapters Progress Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {CHAPTERS.map((ch) => {
                      const prog = item.chapterProgress[ch.number] || { completedCount: 0, totalInClass: item.studentCount, percentage: 0 };
                      const isLocked = item.lockedChapters.includes(ch.number);

                      return (
                        <div
                          key={ch.number}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isLocked
                              ? 'bg-rose-950/20 border-rose-900/50'
                              : prog.percentage >= 80
                              ? 'bg-emerald-950/20 border-emerald-800/50'
                              : 'bg-slate-950/60 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-base">{ch.icon}</span>
                              <span className="font-bold text-white text-xs truncate">
                                บทที่ {ch.number}
                              </span>
                            </div>

                            {isLocked ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                <span>ล็อคอยู่</span>
                              </span>
                            ) : (
                              <span className="font-bold text-xs text-indigo-300">
                                {prog.completedCount} / {item.studentCount} คน ({prog.percentage}%)
                              </span>
                            )}
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${
                                isLocked
                                  ? 'bg-rose-500/60'
                                  : prog.percentage >= 80
                                  ? 'bg-emerald-400'
                                  : prog.percentage >= 40
                                  ? 'bg-indigo-400'
                                  : 'bg-amber-400'
                              }`}
                              style={{ width: `${prog.percentage}%` }}
                            />
                          </div>

                          <div className="text-[11px] text-slate-400 mt-2 truncate">
                            {ch.title}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB: CHAPTER / STAGE LOCKING (ระบบล็อคด่านเพื่อเรียนพร้อมกัน)*/}
      {/* ============================================================== */}
      {activeSubTab === 'locks' && (
        <div className="space-y-6">
          {/* Info Banner */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-950/70 via-slate-900 to-slate-900 border border-rose-500/40 shadow-xl space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-white font-['Chakra_Petch']">
                  ระบบล็อคด่านการเรียน (Stage Lock Control Center)
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  ใช้สำหรับล็อคด่าน/บทเรียนที่ยังสอนไม่ถึง เพื่อให้นักเรียนในห้องเรียนเรียนรู้ไปพร้อมกัน เมื่อตั้งค่าล็อค นักเรียนจะไม่สามารถกดเข้าไปทำกิจกรรมหรือแบบทดสอบของบทนั้นได้ (ครูสามารถเข้าดูและทดสอบได้ตลอดเวลา)
                </p>
              </div>
            </div>

            {/* Global Presets */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-rose-300 mr-2 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5" />
                <span>ปุ่มลัดตั้งค่าทั้งโรงเรียน (ทุกห้อง):</span>
              </span>

              <button
                type="button"
                onClick={() => handleApplyPresetToAllClasses([], 'เปิดทุกบทเรียน')}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all"
              >
                🔓 ปลดล็อคทุกบทเรียน (เปิดทุกด่าน)
              </button>

              <button
                type="button"
                onClick={() => handleApplyPresetToAllClasses([2, 3, 4, 5, 6, 7], 'กำลังสอนบทที่ 1 (ล็อคบท 2-7)')}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all"
              >
                🔒 ล็อคบทที่ 2-7 (กำลังสอนบทที่ 1)
              </button>

              <button
                type="button"
                onClick={() => handleApplyPresetToAllClasses([3, 4, 5, 6, 7], 'กำลังสอนบทที่ 2 (ล็อคบท 3-7)')}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all"
              >
                🔒 ล็อคบทที่ 3-7 (กำลังสอนบทที่ 2)
              </button>

              <button
                type="button"
                onClick={() => handleApplyPresetToAllClasses([7], 'เปิดบทเรียน 1-6 (ล็อคข้อสอบรวมบท 7)')}
                className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all"
              >
                🔒 ล็อคเฉพาะข้อสอบรวม (เปิดบท 1-6)
              </button>
            </div>
          </div>

          {/* Class by Class Locking Grid */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">เลือกห้องเรียนที่ต้องการตั้งค่าล็อค:</span>
                <select
                  value={lockingClassTarget}
                  onChange={(e) => setLockingClassTarget(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-white focus:outline-none focus:border-rose-400 font-bold"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.name}>
                      ชั้นเรียน {c.name} ({c.grade})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Presets for Selected Class */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyLockPreset(lockingClassTarget, [], 'เปิดทุกบท')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold"
                >
                  เปิดหมด
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyLockPreset(lockingClassTarget, [2, 3, 4, 5, 6], 'สอนบทที่ 1')}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold"
                >
                  สอนบทที่ 1 (ล็อค 2-6)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyLockPreset(lockingClassTarget, [3, 4, 5, 6], 'สอนบทที่ 2')}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold"
                >
                  สอนบทที่ 2 (ล็อค 3-6)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyLockPreset(lockingClassTarget, [4, 5, 6], 'สอนบทที่ 3')}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold"
                >
                  สอนบทที่ 3 (ล็อค 4-6)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyLockPreset(lockingClassTarget, [5, 6], 'สอนบทที่ 4')}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold"
                >
                  สอนบทที่ 4 (ล็อค 5-6)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyLockPreset(lockingClassTarget, [6], 'สอนบทที่ 5')}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold"
                >
                  สอนบทที่ 5 (ล็อค 6)
                </button>
              </div>
            </div>

            {/* Individual Chapter Lock Cards for Selected Class */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CHAPTERS.map((ch) => {
                const targetLocks = StorageService.getClassLockedChapters(lockingClassTarget);
                const isLocked = targetLocks.includes(ch.number);

                return (
                  <div
                    key={ch.number}
                    className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 ${
                      isLocked
                        ? 'bg-rose-950/25 border-rose-500/50 shadow-lg shadow-rose-950/30 ring-1 ring-rose-500/20'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{ch.icon}</span>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            isLocked
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          }`}>
                            บทที่ {ch.number}
                          </span>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1 ${
                          isLocked
                            ? 'bg-rose-600 text-white shadow'
                            : 'bg-emerald-500 text-slate-950 shadow'
                        }`}>
                          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          <span>{isLocked ? 'ล็อคอยู่' : 'เปิดเรียน'}</span>
                        </span>
                      </div>

                      <h4 className="font-bold text-white text-sm sm:text-base font-['Chakra_Petch'] leading-snug">
                        {ch.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        {isLocked
                          ? `นักเรียนห้อง ${lockingClassTarget} จะไม่สามารถเปิดด่านนี้ได้จนกว่าครูจะปลดล็อค`
                          : `นักเรียนห้อง ${lockingClassTarget} สามารถเข้าเรียน วิดีโอ เล่นเกม และทำแบบทดสอบได้ตามปกติ`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleClassChapterLock(lockingClassTarget, ch.number)}
                      className={`w-full py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                        isLocked
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950'
                          : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white'
                      }`}
                    >
                      {isLocked ? (
                        <>
                          <Unlock className="w-4 h-4" />
                          <span>คลิกเพื่อปลดล็อคบทที่ {ch.number}</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>คลิกเพื่อล็อคบทที่ {ch.number}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: Pull Existing Students into this Class              */}
      {/* ============================================================== */}
      {activeSubTab === 'pull' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start justify-between gap-4">
            <div className="flex items-start gap-2.5">
              <UserCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block mb-0.5">ดึงนักเรียนเข้าห้อง {selectedClass}:</span>
                เลือกนักเรียนจากรายชื่อในระบบ (ทั้งที่อยู่ห้องอื่นหรือยังไม่มีห้อง) เพื่อดึงเข้าห้องเรียน <strong>{selectedClass}</strong> ได้ทันที
              </div>
            </div>

            {selectedPullUserIds.length > 0 && (
              <button
                type="button"
                onClick={handleBatchPullSelected}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shrink-0 shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                <span>ดึง {selectedPullUserIds.length} คนที่เลือกเข้าห้องนี้</span>
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={pullSearch}
              onChange={(e) => setPullSearch(e.target.value)}
              placeholder="ค้นหาชื่อนักเรียน, รหัส, ห้องเดิม หรืออีเมล เพื่อดึงเข้าห้อง..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {availableToPull.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl text-slate-400 text-xs sm:text-sm">
              ไม่มีนักเรียนคนอื่นที่อยู่นอกห้อง {selectedClass} ในระบบ
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableToPull.map(({ user: student, profile }) => {
                const isSelected = selectedPullUserIds.includes(student.id);
                return (
                  <div
                    key={student.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/50 ring-1 ring-amber-500/30'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPullUserIds([...selectedPullUserIds, student.id]);
                          } else {
                            setSelectedPullUserIds(selectedPullUserIds.filter((id) => id !== student.id));
                          }
                        }}
                        className="rounded border-slate-700 text-amber-500 focus:ring-0 bg-slate-950 w-4 h-4"
                      />

                      <img
                        src={student.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${student.id}`}
                        alt={student.name}
                        className="w-10 h-10 rounded-xl bg-slate-800 object-cover shrink-0"
                      />

                      <div className="min-w-0">
                        <div className="font-bold text-white text-xs sm:text-sm truncate">
                          {student.name}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-emerald-400">{profile?.studentId || '-'}</span>
                          <span>•</span>
                          <span className="text-slate-300">ห้องเดิม: {profile?.classroom || 'ยังไม่ระบุ'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePullSingleStudent(student, profile)}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 shrink-0 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>ดึงเข้าห้องนี้</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 3: Add Individual Student Form                         */}
      {/* ============================================================== */}
      {activeSubTab === 'add_single' && (
        <form onSubmit={handleAddSingleStudent} className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4 max-w-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <UserPlus className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-base text-white font-['Chakra_Petch']">
              เพิ่มนักเรียนรายคนเข้าชั้นเรียน {selectedClass}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">รหัสนักเรียน (Student ID) *</label>
              <input
                type="text"
                required
                value={singleStudentId}
                onChange={(e) => setSingleStudentId(e.target.value)}
                placeholder="เช่น 6701004"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">เลขที่ (Seat Number) *</label>
              <input
                type="number"
                required
                min={1}
                value={singleSeatNumber}
                onChange={(e) => setSingleSeatNumber(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400 font-mono"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-300">ชื่อ - นามสกุล นักเรียน *</label>
              <input
                type="text"
                required
                value={singleName}
                onChange={(e) => setSingleName(e.target.value)}
                placeholder="เช่น เด็กชายกิตติพงษ์ ใจดี"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">อีเมล (เว้นว่างเพื่อใช้เมลอัตโนมัติ)</label>
              <input
                type="email"
                value={singleEmail}
                onChange={(e) => setSingleEmail(e.target.value)}
                placeholder="เช่น 6701004@student.school.ac.th"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">รหัสผ่านเริ่มต้น</label>
              <input
                type="text"
                value={singlePassword}
                onChange={(e) => setSinglePassword(e.target.value)}
                placeholder="password123"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setActiveSubTab('roster')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-lg"
            >
              <UserPlus className="w-4 h-4" />
              <span>บันทึกและเพิ่มเข้าห้อง {selectedClass}</span>
            </button>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 4: Batch Import Text                                   */}
      {/* ============================================================== */}
      {activeSubTab === 'batch_import' && (
        <form onSubmit={handleBatchImportSubmit} className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Upload className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="font-bold text-base text-white font-['Chakra_Petch']">
                นำเข้ารายชื่อนักเรียนแบบกลุ่ม (Batch Quick Import) เข้าห้อง {selectedClass}
              </h3>
              <p className="text-xs text-slate-400">
                วางข้อความรายชื่อนักเรียน รูปแบบ: <code className="text-sky-300">รหัสนักเรียน, ชื่อ-นามสกุล, เลขที่</code> (บรรทัดละ 1 คน)
              </p>
            </div>
          </div>

          <textarea
            rows={7}
            required
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            placeholder="6701001, เด็กชายปภพ สุขใจ, 1&#10;6701002, เด็กหญิงมนัสนันท์ ขยันเรียน, 2"
            className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-xs sm:text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-sky-400 leading-relaxed"
          />

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-400">
              จำนวนที่จะนำเข้า: <strong className="text-white">{batchText.split('\n').filter((l) => l.trim().length > 0).length}</strong> คน
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveSubTab('roster')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-lg"
              >
                <Check className="w-4 h-4" />
                <span>ยืนยันการนำเข้าทั้งชุด</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 5: Manage Classrooms (Create, Edit, Delete)            */}
      {/* ============================================================== */}
      {activeSubTab === 'classes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create / Edit Form */}
          <div className="lg:col-span-1 p-5 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <School className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm sm:text-base text-white font-['Chakra_Petch']">
                {editingClassId ? 'แก้ไขข้อมูลชั้นเรียน' : 'สร้างชั้นเรียนใหม่'}
              </h3>
            </div>

            <form onSubmit={handleSaveClassroom} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">ชื่อชั้นเรียน (Class Name) *</label>
                <input
                  type="text"
                  required
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="เช่น ม.1/3 หรือ ม.1/4 หรือ ม.2/1"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">ระดับชั้น</label>
                <input
                  type="text"
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(e.target.value)}
                  placeholder="ม.1"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">ปีการศึกษา</label>
                <input
                  type="text"
                  value={newClassYear}
                  onChange={(e) => setNewClassYear(e.target.value)}
                  placeholder="2569"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>

              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200">
                    เกณฑ์คะแนนผ่านขั้นต่ำ (จำนวนคะแนน / 18)
                  </label>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {newClassPassScore} คะแนน ({Math.round((newClassPassScore / 18) * 100)}%)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={18}
                    required
                    value={newClassPassScore}
                    onChange={(e) => {
                      const val = Math.min(18, Math.max(1, parseInt(e.target.value, 10) || 1));
                      setNewClassPassScore(val);
                      setNewClassPassRate(Math.round((val / 18) * 100));
                    }}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-400 font-mono font-bold"
                  />
                  <span className="text-xs text-slate-400">จากคะแนนแบบทดสอบเต็ม 18 คะแนน</span>
                </div>

                {/* Quick Score Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {[
                    { score: 9, label: '9 คะแนน (50%)' },
                    { score: 10, label: '10 คะแนน (55%)' },
                    { score: 11, label: '11 คะแนน (60%)' },
                    { score: 12, label: '12 คะแนน (66%)' },
                    { score: 14, label: '14 คะแนน (77%)' },
                  ].map((preset) => (
                    <button
                      key={preset.score}
                      type="button"
                      onClick={() => {
                        setNewClassPassScore(preset.score);
                        setNewClassPassRate(Math.round((preset.score / 18) * 100));
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                        newClassPassScore === preset.score
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-slate-400 leading-tight pt-1">
                  💡 นักเรียนที่ได้คะแนนรวมตั้งแต่ <strong className="text-emerald-300">{newClassPassScore} คะแนนขึ้นไป</strong> จะได้รับผลการประเมินว่า &quot;ผ่านเกณฑ์&quot;
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                {editingClassId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingClassId(null);
                      setNewClassName('');
                    }}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    ยกเลิก
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingClassId ? 'บันทึกการแก้ไข' : 'บันทึกชั้นเรียน'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Classes */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-bold text-sm text-slate-300">
              รายชื่อชั้นเรียนทั้งหมดในระบบ ({classes.length} ห้อง)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {classes.map((cls) => {
                const count = allProfiles.filter((p) => p.classroom === cls.name).length;
                const lockCount = (cls.lockedChapters || []).length;
                const passScore = cls.passThresholdScore || Math.round(((cls.passThresholdPercent || 60) / 100) * 18);
                return (
                  <div
                    key={cls.id}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                          {cls.name.slice(0, 4)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-base font-['Chakra_Petch']">
                            {cls.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            ระดับ: {cls.grade} • ปีการศึกษา {cls.academicYear}
                          </div>
                          <div className="text-[11px] text-emerald-400 mt-0.5 font-medium">
                            เกณฑ์ผ่าน: ได้ตั้งแต่ {passScore} / 18 คะแนน ({cls.passThresholdPercent || 60}%)
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-300 text-xs font-bold border border-slate-700">
                          {count} คน
                        </span>
                        {lockCount > 0 && (
                          <span className="text-[10px] text-rose-400 font-bold flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" />
                            <span>ล็อค {lockCount} บท</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClass(cls.name);
                          setActiveSubTab('roster');
                        }}
                        className="text-emerald-400 hover:text-emerald-300 font-bold underline"
                      >
                        ดูรายชื่อนักเรียน →
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setLockingClassTarget(cls.name);
                            setActiveSubTab('locks');
                          }}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                          title="ตั้งค่าล็อคด่านห้องนี้"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingClassId(cls.id);
                            setNewClassName(cls.name);
                            setNewClassGrade(cls.grade);
                            setNewClassYear(cls.academicYear);
                            const pScore = cls.passThresholdScore || Math.round(((cls.passThresholdPercent || 60) / 100) * 18);
                            setNewClassPassScore(pScore);
                            setNewClassPassRate(cls.passThresholdPercent || 60);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title="แก้ไขชั้นเรียน"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClassroom(cls)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                          title="ลบชั้นเรียน"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Move / Edit Student Modal */}
      {movingStudent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setMovingStudent(null)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">ย้ายห้องเรียน / แก้ไขเลขที่</h3>
              </div>
              <button
                type="button"
                onClick={() => setMovingStudent(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <img
                src={movingStudent.user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${movingStudent.user.id}`}
                alt={movingStudent.user.name}
                className="w-10 h-10 rounded-xl bg-slate-800 object-cover"
              />
              <div>
                <div className="font-bold text-white text-sm">{movingStudent.user.name}</div>
                <div className="text-xs text-slate-400">
                  รหัส: {movingStudent.profile?.studentId || '-'} • ปัจจุบัน: {movingStudent.profile?.classroom || '-'} (เลขที่ {movingStudent.profile?.seatNumber || '-'})
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirmMoveStudent} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">เลือกห้องเรียนปลายทาง *</label>
                <select
                  value={targetClassroom}
                  onChange={(e) => setTargetClassroom(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-400 font-bold"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">กำหนดเลขที่ใหม่ *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={targetSeatNumber}
                  onChange={(e) => setTargetSeatNumber(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMovingStudent(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg"
                >
                  <Check className="w-4 h-4" />
                  <span>ยืนยันการย้าย</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
