/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  ShieldAlert,
  Search,
  Trash2,
  Edit,
  KeyRound,
  CheckCircle2,
  XCircle,
  GraduationCap,
  ShieldCheck,
  Crown,
  Filter,
  Download,
  LogIn,
  AlertTriangle,
  X,
  Save,
  Building2,
  BookOpen,
  Sparkles,
  RefreshCw,
  Phone,
  Mail,
  UserCheck,
  FileSpreadsheet,
  ExternalLink
} from 'lucide-react';
import { User, StudentProfile, TeacherProfile, UserRole } from '../../types';
import { StorageService } from '../../services/storage';
import { feedback } from '../../utils/feedback';
import { createGradebookSpreadsheet, getOAuthAccessToken } from '../../services/sheets';
import { signInWithGoogle } from '../../services/auth';

interface AdminUserManagerProps {
  currentAdmin: User;
  onUserSwitched?: (user: User) => void;
  onRefreshParent?: () => void;
}

export const AdminUserManager: React.FC<AdminUserManagerProps> = ({
  currentAdmin,
  onUserSwitched,
  onRefreshParent,
}) => {
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>(() =>
    StorageService.getStudentProfiles()
  );
  const [teacherProfiles, setTeacherProfiles] = useState<TeacherProfile[]>(() =>
    StorageService.getTeacherProfiles()
  );
  const [allClasses, setAllClasses] = useState(() => StorageService.getClasses());

  // Filter states
  const [adminSubTab, setAdminSubTab] = useState<'users' | 'teacher_requests'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher' | 'admin'>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');

  // List of teachers for assignment & filtering
  const allTeachers = useMemo(() => {
    return users.filter((u) => u.role === 'teacher' && (u.approvalStatus || 'approved') === 'approved');
  }, [users]);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPassUser, setResetPassUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Form states for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student' as UserRole,
    password: 'password123',
    // Student fields
    studentId: '',
    classroom: 'ม.1/1',
    seatNumber: 1,
    gradeLevel: 'ม.1',
    xp: 100,
    assignedTeacherId: '',
    assignedTeacherName: '',
    // Teacher / Admin fields
    teacherId: '',
    schoolName: 'โรงเรียนสาธิตวิทยาการศึกษา',
    subjectTaught: 'เทคโนโลยี (วิทยาการคำนวณ) ม.1',
    phoneNumber: '',
  });

  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isExportingSheets, setIsExportingSheets] = useState(false);
  const [exportedSheetUrl, setExportedSheetUrl] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedbackNotice({ type, message });
    if (type === 'success') {
      if (message.includes('เพิ่ม') || message.includes('อนุมัติ')) {
        feedback.add(message);
      } else if (message.includes('ลบ') || message.includes('ปฏิเสธ')) {
        feedback.delete(message);
      } else if (message.includes('อัปเดต') || message.includes('แก้ไข') || message.includes('รหัสผ่าน')) {
        feedback.edit(message);
      } else {
        feedback.success(message);
      }
    } else {
      feedback.error(message);
    }
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const refreshData = () => {
    setUsers(StorageService.getUsers());
    setStudentProfiles(StorageService.getStudentProfiles());
    setTeacherProfiles(StorageService.getTeacherProfiles());
    setAllClasses(StorageService.getClasses());
    if (onRefreshParent) onRefreshParent();
  };

  // Pending teachers for Admin approval
  const pendingTeachers = useMemo(() => {
    return users
      .filter((u) => u.role === 'teacher' && u.approvalStatus === 'pending')
      .map((u) => ({
        user: u,
        profile: teacherProfiles.find((p) => p.userId === u.id),
      }));
  }, [users, teacherProfiles]);

  // Handle Admin Approving Teacher
  const handleApproveTeacher = (teacherUserId: string, teacherName: string) => {
    const ok = StorageService.approveTeacher(teacherUserId, currentAdmin.id);
    if (ok) {
      refreshData();
      showToast('success', `อนุมัติครูผู้สอน "${teacherName}" เข้าใช้งานระบบเรียบร้อยแล้ว ครูสามารถล็อกอินได้ทันที`);
    } else {
      showToast('error', 'เกิดข้อผิดพลาดในการอนุมัติครูผู้สอน');
    }
  };

  // Handle Admin Rejecting Teacher
  const handleRejectTeacher = (teacherUserId: string, teacherName: string) => {
    const ok = StorageService.rejectTeacher(teacherUserId);
    if (ok) {
      refreshData();
      showToast('error', `ปฏิเสธคำขอสมัครของครูผู้สอน "${teacherName}" เรียบร้อยแล้ว`);
    } else {
      showToast('error', 'เกิดข้อผิดพลาดในการปฏิเสธคำขอ');
    }
  };

  // Quick Assign Teacher to Student
  const handleQuickAssignTeacher = (studentUserId: string, teacherUserId: string) => {
    const teacher = users.find((u) => u.id === teacherUserId);
    if (!teacher) {
      // Unassign
      const profiles = StorageService.getStudentProfiles();
      const idx = profiles.findIndex((p) => p.userId === studentUserId);
      if (idx >= 0) {
        profiles[idx] = {
          ...profiles[idx],
          assignedTeacherId: undefined,
          assignedTeacherName: undefined,
        };
        StorageService.saveStudentProfiles(profiles);
        refreshData();
        showToast('success', 'ยกเลิกการผูกครูผู้ดูแลเรียบร้อย');
      }
      return;
    }

    StorageService.assignStudentTeacher(studentUserId, teacher.id, teacher.name);
    refreshData();
    showToast('success', `มอบหมายให้นักเรียนอยู่ในความดูแลของ "ครู${teacher.name}" เรียบร้อย`);
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;

      // Approval filter
      const userStatus = u.approvalStatus || 'approved';
      if (approvalFilter !== 'all' && userStatus !== approvalFilter) return false;

      // Student / Teacher Profile lookup
      const sProf = studentProfiles.find((p) => p.userId === u.id);
      const tProf = teacherProfiles.find((p) => p.userId === u.id);

      // Class filter (applies to students, and teachers managing that class)
      if (classFilter !== 'all') {
        if (u.role === 'student') {
          if (sProf?.classroom !== classFilter) return false;
        } else if (u.role === 'teacher') {
          const managesClass = allClasses.find((c) => c.name === classFilter)?.teacherId === u.id ||
            tProf?.classesManaged?.includes(classFilter);
          if (!managesClass) return false;
        } else {
          return false;
        }
      }

      // Teacher filter (filter by supervisor / in-charge teacher)
      if (teacherFilter !== 'all') {
        if (teacherFilter === 'unassigned') {
          if (u.role === 'student' && sProf?.assignedTeacherId) return false;
          if (u.role !== 'student') return false;
        } else {
          if (u.role === 'student') {
            const isAssigned = sProf?.assignedTeacherId === teacherFilter;
            const isClassTeacher = allClasses.find((c) => c.name === sProf?.classroom)?.teacherId === teacherFilter;
            if (!isAssigned && !isClassTeacher) return false;
          } else if (u.role === 'teacher') {
            if (u.id !== teacherFilter) return false;
          } else {
            return false;
          }
        }
      }

      // Search query (name, email, IDs)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = u.name.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchStudentId = sProf?.studentId.toLowerCase().includes(q) || false;
        const matchTeacherId = tProf?.teacherId.toLowerCase().includes(q) || false;
        const matchClass = sProf?.classroom.toLowerCase().includes(q) || false;
        const matchTeacherName = sProf?.assignedTeacherName?.toLowerCase().includes(q) || false;
        if (!matchName && !matchEmail && !matchStudentId && !matchTeacherId && !matchClass && !matchTeacherName) {
          return false;
        }
      }

      return true;
    });
  }, [users, studentProfiles, teacherProfiles, allClasses, roleFilter, classFilter, teacherFilter, approvalFilter, searchQuery]);

  // Statistics
  const totalUsersCount = users.length;
  const totalStudentsCount = users.filter((u) => u.role === 'student').length;
  const totalTeachersCount = users.filter((u) => u.role === 'teacher').length;
  const totalAdminsCount = users.filter((u) => u.role === 'admin').length;

  // Open Add Modal
  const handleOpenAddModal = () => {
    const nextStudentNum = studentProfiles.length + 1;
    // Default teacher for class-1 if available
    const defaultClassTeacher = users.find((u) => u.id === allClasses[0]?.teacherId);
    setFormData({
      name: '',
      email: '',
      role: 'student',
      password: 'password123',
      studentId: `6701${String(nextStudentNum).padStart(3, '0')}`,
      classroom: allClasses[0]?.name || 'ม.1/1',
      seatNumber: nextStudentNum,
      gradeLevel: 'ม.1',
      xp: 150,
      assignedTeacherId: defaultClassTeacher?.id || '',
      assignedTeacherName: defaultClassTeacher?.name || '',
      teacherId: `TCH${String(Date.now()).slice(-3)}`,
      schoolName: 'โรงเรียนสาธิตวิทยาการศึกษา',
      subjectTaught: 'เทคโนโลยี (วิทยาการคำนวณ) ม.1',
      phoneNumber: '',
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (user: User) => {
    const sProf = studentProfiles.find((p) => p.userId === user.id);
    const tProf = teacherProfiles.find((p) => p.userId === user.id);

    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: user.password || 'password123',
      studentId: sProf?.studentId || '',
      classroom: sProf?.classroom || 'ม.1/1',
      seatNumber: sProf?.seatNumber || 1,
      gradeLevel: sProf?.gradeLevel || 'ม.1',
      xp: sProf?.xp || 0,
      assignedTeacherId: sProf?.assignedTeacherId || '',
      assignedTeacherName: sProf?.assignedTeacherName || '',
      teacherId: tProf?.teacherId || '',
      schoolName: tProf?.schoolName || 'โรงเรียนสาธิตวิทยาการศึกษา',
      subjectTaught: tProf?.subjectTaught || 'เทคโนโลยี (วิทยาการคำนวณ) ม.1',
      phoneNumber: tProf?.phoneNumber || '',
    });
  };

  // Submit Add User
  const handleSaveNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast('error', 'กรุณากรอกชื่อ-นามสกุล และอีเมลให้ครบถ้วน');
      return;
    }

    // Check duplicate email
    const existing = StorageService.findUserByEmail(formData.email.trim());
    if (existing) {
      showToast('error', 'อีเมลนี้มีอยู่ในระบบแล้ว กรุณาใช้อีเมลอื่น');
      return;
    }

    StorageService.createFullUser(
      {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        password: formData.password.trim() || 'password123',
      },
      formData.role === 'student'
        ? {
            studentId: formData.studentId.trim() || `6701${String(Date.now()).slice(-3)}`,
            classroom: formData.classroom,
            seatNumber: Number(formData.seatNumber) || 1,
            gradeLevel: formData.gradeLevel,
            xp: Number(formData.xp) || 100,
            assignedTeacherId: formData.assignedTeacherId || undefined,
            assignedTeacherName: formData.assignedTeacherName || undefined,
            approvalDate: new Date().toISOString(),
          }
        : undefined,
      formData.role === 'teacher' || formData.role === 'admin'
        ? {
            teacherId: formData.teacherId.trim() || `TCH${String(Date.now()).slice(-3)}`,
            schoolName: formData.schoolName.trim(),
            subjectTaught: formData.subjectTaught.trim(),
            phoneNumber: formData.phoneNumber.trim(),
          }
        : undefined
    );

    setIsAddModalOpen(false);
    refreshData();
    showToast('success', `เพิ่มผู้ใช้งาน "${formData.name}" เข้าสู่ระบบเรียบร้อยแล้ว`);
  };

  // Submit Edit User
  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!formData.name.trim() || !formData.email.trim()) {
      showToast('error', 'กรุณากรอกชื่อ-นามสกุล และอีเมลให้ครบถ้วน');
      return;
    }

    StorageService.updateFullUser(
      {
        id: editingUser.id,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        password: formData.password.trim(),
      },
      formData.role === 'student'
        ? {
            studentId: formData.studentId.trim(),
            classroom: formData.classroom,
            seatNumber: Number(formData.seatNumber) || 1,
            gradeLevel: formData.gradeLevel,
            xp: Number(formData.xp) || 0,
            assignedTeacherId: formData.assignedTeacherId || undefined,
            assignedTeacherName: formData.assignedTeacherName || undefined,
          }
        : undefined,
      formData.role === 'teacher' || formData.role === 'admin'
        ? {
            teacherId: formData.teacherId.trim(),
            schoolName: formData.schoolName.trim(),
            subjectTaught: formData.subjectTaught.trim(),
            phoneNumber: formData.phoneNumber.trim(),
          }
        : undefined
    );

    setEditingUser(null);
    refreshData();
    showToast('success', `อัปเดตข้อมูลผู้ใช้ "${formData.name}" เรียบร้อย`);
  };

  // Submit Reset Password
  const handleSaveResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassUser) return;

    if (!newPasswordInput.trim()) {
      showToast('error', 'กรุณาระบุรหัสผ่านใหม่');
      return;
    }

    StorageService.changeUserPassword(resetPassUser.id, newPasswordInput.trim());
    setResetPassUser(null);
    setNewPasswordInput('');
    refreshData();
    showToast('success', `เปลี่ยนรหัสผ่านสำหรับ ${resetPassUser.name} เป็น "${newPasswordInput.trim()}" สำเร็จ`);
  };

  // Submit Delete User
  const handleConfirmDelete = () => {
    if (!deletingUser) return;

    const res = StorageService.deleteUser(deletingUser.id);
    if (res.success) {
      setDeletingUser(null);
      refreshData();
      showToast('success', res.message);
    } else {
      showToast('error', res.message);
    }
  };

  // Switch to User (Impersonate / Test)
  const handleSwitchUser = (user: User) => {
    StorageService.setCurrentUser(user);
    showToast('success', `สลับเข้าสู่ระบบในฐานะ: ${user.name} (${user.role}) เรียบร้อย`);
    if (onUserSwitched) {
      onUserSwitched(user);
    }
  };

  // Export CSV of All Users
  const handleExportCSV = () => {
    const headers = ['User ID', 'ชื่อ-นามสกุล', 'อีเมล', 'บทบาท (Role)', 'รหัสประจำตัว', 'ห้องเรียน/โรงเรียน', 'ครูผู้ดูแล', 'วันที่สร้าง'];
    const rows = filteredUsers.map((u) => {
      const sProf = studentProfiles.find((p) => p.userId === u.id);
      const tProf = teacherProfiles.find((p) => p.userId === u.id);
      const idCode = u.role === 'student' ? sProf?.studentId || '' : tProf?.teacherId || '';
      const org = u.role === 'student' ? sProf?.classroom || '' : tProf?.schoolName || '';
      const teacherName = u.role === 'student' ? sProf?.assignedTeacherName || '-' : '-';
      return [
        u.id,
        `"${u.name}"`,
        u.email,
        u.role,
        `"${idCode}"`,
        `"${org}"`,
        `"${teacherName}"`,
        new Date(u.createdAt).toLocaleDateString('th-TH'),
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adventure_m1_users_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'ส่งออกข้อมูลผู้ใช้งานเป็นไฟล์ CSV สำเร็จ');
  };

  // Export to Google Sheets
  const handleExportGoogleSheets = async () => {
    setIsExportingSheets(true);
    setExportedSheetUrl(null);
    try {
      let token = getOAuthAccessToken();
      if (!token) {
        const googleAuth = await signInWithGoogle();
        if (googleAuth?.accessToken) {
          token = googleAuth.accessToken;
        } else {
          throw new Error('กรุณาลงชื่อเข้าใช้ด้วย Google เพื่ออนุญาตการสร้าง Google Sheets');
        }
      }

      const headers = ['User ID', 'ชื่อ-นามสกุล', 'อีเมล', 'บทบาท (Role)', 'รหัสประจำตัว', 'ห้องเรียน/โรงเรียน', 'ครูผู้ดูแล', 'วันที่สร้าง'];
      const rows = filteredUsers.map((u) => {
        const sProf = studentProfiles.find((p) => p.userId === u.id);
        const tProf = teacherProfiles.find((p) => p.userId === u.id);
        const idCode = u.role === 'student' ? sProf?.studentId || '-' : tProf?.teacherId || '-';
        const org = u.role === 'student' ? sProf?.classroom || '-' : tProf?.schoolName || '-';
        const teacherName = u.role === 'student' ? sProf?.assignedTeacherName || '-' : '-';
        return [
          u.id,
          u.name,
          u.email,
          u.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : u.role === 'teacher' ? 'ครูผู้สอน (Teacher)' : 'นักเรียน (Student)',
          idCode,
          org,
          teacherName,
          new Date(u.createdAt).toLocaleDateString('th-TH'),
        ];
      });

      const title = `Adventure M.1 - รายชื่อผู้ใช้งานทั้งหมด (${new Date().toLocaleDateString('th-TH')})`;
      const sheetUrl = await createGradebookSpreadsheet('รายชื่อผู้ใช้งาน', title, headers, rows, token);
      setExportedSheetUrl(sheetUrl);
      showToast('success', 'สร้าง Google Sheets รายชื่อผู้ใช้งานสำเร็จเรียบร้อย!');
    } catch (err: any) {
      console.error('Export error:', err);
      showToast('error', err?.message || 'ไม่สามารถส่งออก Google Sheets ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsExportingSheets(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedbackNotice && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 shadow-2xl transition-all border ${
            feedbackNotice.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedbackNotice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="text-sm font-semibold">{feedbackNotice.message}</span>
          </div>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="p-1 hover:bg-slate-800/60 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner & Super Admin Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-xl ring-4 ring-purple-500/20">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white font-['Chakra_Petch']">
                  ระบบบริหารจัดการผู้ใช้งานส่วนกลาง (Admin Control Hub)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40 text-xs font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Admin01 Super Power</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                จัดการบัญชีผู้ใช้งานทุกคนในระบบ: เพิ่ม ลบ ค้นหา แก้ไขข้อมูล รีเซ็ตรหัสผ่าน ทั้งนักเรียน ครูผู้สอน และผู้ดูแลระบบ
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              id="admin-export-sheets-btn"
              disabled={isExportingSheets}
              onClick={handleExportGoogleSheets}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-500/40 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-md hover:scale-105 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>{isExportingSheets ? 'กำลังสร้าง Sheets...' : 'ส่งออก Google Sheets'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow"
            >
              <Download className="w-4 h-4 text-purple-400" />
              <span>ส่งออก CSV</span>
            </button>

            <button
              id="admin-add-user-btn"
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg hover:scale-105 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ เพิ่มผู้ใช้งานใหม่</span>
            </button>
          </div>
        </div>

        {/* Google Sheets Export Success Banner */}
        {exportedSheetUrl && (
          <div className="mt-4 p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center justify-between gap-4 text-emerald-200 text-xs sm:text-sm shadow-xl">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-emerald-300">
                  ส่งออกรายชื่อผู้ใช้งานสู่ Google Sheets สำเร็จ!
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  สเปรดชีตถูกสร้างใน Google Drive ของคุณเรียบร้อยแล้ว
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

        {/* Analytics KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-purple-500/20">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">ผู้ใช้ทั้งหมดในระบบ</div>
              <div className="text-xl sm:text-2xl font-black text-white font-['Chakra_Petch']">
                {totalUsersCount} คน
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">นักเรียน ม.1 ทั้งหมด</div>
              <div className="text-xl sm:text-2xl font-black text-indigo-300 font-['Chakra_Petch']">
                {totalStudentsCount} คน
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">ครูผู้สอนประจำการ</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-300 font-['Chakra_Petch']">
                {totalTeachersCount} คน
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">ผู้ดูแลระบบ (Admin)</div>
              <div className="text-xl sm:text-2xl font-black text-amber-300 font-['Chakra_Petch']">
                {totalAdminsCount} คน
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Navigation Subtabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-x-auto text-xs sm:text-sm font-semibold">
        <button
          id="admin-subtab-users"
          onClick={() => setAdminSubTab('users')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            adminSubTab === 'users'
              ? 'bg-purple-600 text-white font-bold shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>รายชื่อผู้ใช้งานทั้งหมด ({users.length} คน)</span>
        </button>

        <button
          id="admin-subtab-teacher-requests"
          onClick={() => setAdminSubTab('teacher_requests')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            adminSubTab === 'teacher_requests'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <UserCheck className="w-4 h-4 text-amber-300" />
          <span>คำขออนุมัติครูใหม่ (Teacher Approvals)</span>
          {pendingTeachers.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950 animate-pulse">
              {pendingTeachers.length}
            </span>
          )}
        </button>
      </div>

      {adminSubTab === 'teacher_requests' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 font-['Chakra_Petch']">
                <UserCheck className="w-5 h-5 text-amber-400" />
                <span>รายการคำขอสมัครเป็นครูผู้สอนที่รอการอนุมัติ</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                ตามนโยบายความปลอดภัย ครูผู้สอนที่สมัครเข้ามาใหม่จะต้องได้รับการตรวจสอบและกดอนุมัติจากผู้ดูแลระบบ (Admin) ก่อน จึงจะมีสิทธิ์เข้าสู่ระบบ
              </p>
            </div>
            <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3.5 py-2 rounded-xl font-medium shrink-0">
              รอการอนุมัติทั้งหมด: <strong className="font-bold text-sm text-white">{pendingTeachers.length}</strong> ท่าน
            </div>
          </div>

          {pendingTeachers.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white">ไม่มีคำขอสมัครครูใหม่ที่รอดำเนินการ</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                ครูผู้สอนทุกคนในระบบได้รับการอนุมัติเรียบร้อยแล้ว หรือยังไม่มีคำขอสมัครสมาชิกใหม่เข้ามาในขณะนี้
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingTeachers.map((t) => (
                <div
                  key={t.user.id}
                  className="p-5 rounded-3xl bg-slate-900 border border-amber-500/30 shadow-xl space-y-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-start justify-between gap-3 relative">
                    <div className="flex items-center gap-3">
                      <img
                        src={t.user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${t.user.id}`}
                        alt={t.user.name}
                        className="w-12 h-12 rounded-2xl bg-slate-800 border border-amber-500/40 p-0.5 object-cover shrink-0"
                      />
                      <div>
                        <div className="font-bold text-white text-base flex items-center gap-2">
                          <span>{t.user.name}</span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                            รออนุมัติ
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span>{t.user.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Teacher details */}
                  <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs space-y-2 text-slate-300">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">รหัสครูผู้สอน:</span>
                      <span className="font-mono font-bold text-amber-300">{t.profile?.teacherId || 'TCH-NEW'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">สังกัดสถานศึกษา:</span>
                      <span className="font-semibold text-slate-200">{t.profile?.schoolName || 'โรงเรียนสาธิตวิทยาการศึกษา'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">กลุ่มสาระ / วิชาที่สอน:</span>
                      <span className="font-semibold text-indigo-300">{t.profile?.subjectTaught || 'วิทยาการคำนวณ ม.1'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">วันที่ส่งคำขอสมัคร:</span>
                      <span className="text-slate-400">{new Date(t.user.createdAt).toLocaleString('th-TH')}</span>
                    </div>
                  </div>

                  {/* Approval Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleApproveTeacher(t.user.id, t.user.name)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg hover:scale-[1.02] active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>อนุมัติเข้าใช้งาน (Approve)</span>
                    </button>
                    <button
                      onClick={() => handleRejectTeacher(t.user.id, t.user.name)}
                      className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 border border-slate-700 hover:border-rose-500 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
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

      {adminSubTab === 'users' && (
        <>
          {/* Filter & Search Toolbar */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-3.5">
            {/* Search Bar */}
            <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="admin-search-user-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อ, อีเมล, รหัสประจำตัว, ห้องเรียน..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Role & Classroom Filters */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                roleFilter === 'all'
                  ? 'bg-purple-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ทั้งหมด ({totalUsersCount})
            </button>
            <button
              onClick={() => setRoleFilter('student')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                roleFilter === 'student'
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              นักเรียน ({totalStudentsCount})
            </button>
            <button
              onClick={() => setRoleFilter('teacher')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                roleFilter === 'teacher'
                  ? 'bg-emerald-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ครู ({totalTeachersCount})
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                roleFilter === 'admin'
                  ? 'bg-amber-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin ({totalAdminsCount})
            </button>
          </div>

          {/* Approval Filter Selector */}
          <select
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="all">ทุกสถานะการอนุมัติ</option>
            <option value="approved">✓ อนุมัติแล้ว</option>
            <option value="pending">⏳ รออนุมัติ</option>
            <option value="rejected">✕ ปฏิเสธ</option>
          </select>

          {/* Classroom Selector */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="all">🏫 ทุกห้องเรียน</option>
            {allClasses.map((cls) => {
              const classTeacher = users.find((u) => u.id === cls.teacherId);
              return (
                <option key={cls.id} value={cls.name}>
                  ห้อง {cls.name} {classTeacher ? `(ครูผู้ดูแล: ${classTeacher.name})` : ''}
                </option>
              );
            })}
          </select>

          {/* Teacher Selector */}
          <select
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="all">👨‍🏫 คุณครูทุกคน (ทุกครูผู้ดูแล)</option>
            <option value="unassigned">⚠️ ยังไม่ระบุครูผู้ดูแล</option>
            {allTeachers.map((t) => (
              <option key={t.id} value={t.id}>
                ครู {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] sm:text-xs uppercase text-slate-400 font-semibold border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">ผู้ใช้งาน</th>
                <th className="py-3.5 px-4">อีเมล / ช่องทางล็อกอิน</th>
                <th className="py-3.5 px-4">บทบาท (Role)</th>
                <th className="py-3.5 px-4">ข้อมูลประจำตัว / ห้องเรียน</th>
                <th className="py-3.5 px-4">สถานะการอนุมัติ</th>
                <th className="py-3.5 px-4">XP / สถิติ</th>
                <th className="py-3.5 px-4 text-center">จัดการผู้ใช้</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm font-semibold">ไม่พบรายชื่อผู้ใช้งานที่ตรงกับเงื่อนไขการค้นหา</p>
                    <p className="text-xs text-slate-600 mt-1">
                      ลองเปลี่ยนคำค้นหา หรือกดปุ่ม "+ เพิ่มผู้ใช้งานใหม่"
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const sProf = studentProfiles.find((p) => p.userId === u.id);
                  const tProf = teacherProfiles.find((p) => p.userId === u.id);
                  const isCurrentAdmin = u.id === currentAdmin.id;
                  const isRootAdmin = u.id === 'admin-1' || u.email.toLowerCase() === 'admin01@school.ac.th';

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isCurrentAdmin ? 'bg-purple-950/20' : ''
                      }`}
                    >
                      {/* User Identity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`}
                            alt={u.name}
                            className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 object-cover shrink-0"
                          />
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrentAdmin && (
                                <span className="px-1.5 py-0.2 text-[10px] rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  คุณ (กำลังใช้งาน)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              ID: {u.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs text-slate-200 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{u.email}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          สมัครเมื่อ: {new Date(u.createdAt).toLocaleDateString('th-TH')}
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                            <span>ผู้ดูแลระบบ (Admin)</span>
                          </span>
                        ) : u.role === 'teacher' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>ครูผู้สอน (Teacher)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                            <span>นักเรียน (Student)</span>
                          </span>
                        )}
                      </td>

                      {/* Profile details */}
                      <td className="py-3.5 px-4">
                        {u.role === 'student' ? (
                          <div>
                            <div className="font-semibold text-slate-200">
                              รหัสนักเรียน: <span className="font-mono text-indigo-300 font-bold">{sProf?.studentId || '-'}</span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              ห้อง {sProf?.classroom || 'ม.1/1'} • เลขที่ {sProf?.seatNumber || '-'}
                            </div>
                            {/* Assigned Teacher Display & Quick Change */}
                            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                              {sProf?.assignedTeacherName ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
                                  <span>👨‍🏫 ครูผู้ดูแล: {sProf.assignedTeacherName}</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-rose-300 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 italic">
                                  ⚠️ ยังไม่มีครูดูแล
                                </span>
                              )}
                              <select
                                value={sProf?.assignedTeacherId || ''}
                                onChange={(e) => handleQuickAssignTeacher(u.id, e.target.value)}
                                className="text-[10px] bg-slate-950 border border-slate-700 hover:border-purple-500 rounded px-1.5 py-0.5 text-slate-300 focus:outline-none"
                                title="มอบหมายหรือเปลี่ยนครูผู้ดูแลนักเรียนคนนี้"
                              >
                                <option value="">-- กำหนดครูผู้ดูแล --</option>
                                {allTeachers.map((tch) => (
                                  <option key={tch.id} value={tch.id}>
                                    ครู{tch.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ) : u.role === 'teacher' ? (
                          <div>
                            <div className="font-semibold text-slate-200">
                              รหัสประจำตัว: <span className="font-mono text-emerald-300 font-bold">{tProf?.teacherId || '-'}</span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {tProf?.schoolName || 'โรงเรียนสาธิตวิทยาการศึกษา'}
                            </div>
                            <div className="text-[11px] text-indigo-300 mt-1 flex items-center gap-1">
                              <span className="text-slate-400">ห้องที่ดูแล:</span>
                              <span className="font-semibold">
                                {allClasses.filter((c) => c.teacherId === u.id).map((c) => `ห้อง ${c.name}`).join(', ') ||
                                  (tProf?.classesManaged && tProf.classesManaged.length > 0
                                    ? tProf.classesManaged.join(', ')
                                    : 'ครูผู้สอนส่วนกลาง')}
                              </span>
                            </div>
                          </div>
                        ) : u.role === 'admin' ? (
                          <div>
                            <div className="font-semibold text-slate-200">
                              รหัสประจำตัว: <span className="font-mono text-amber-300 font-bold">{tProf?.teacherId || 'ADMIN01'}</span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {tProf?.schoolName || 'ศูนย์ควบคุมระบบส่วนกลาง'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      {/* Approval Status Badge */}
                      <td className="py-3.5 px-4">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>อนุมัติถาวร</span>
                          </span>
                        ) : (u.approvalStatus || 'approved') === 'approved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>อนุมัติแล้ว</span>
                          </span>
                        ) : u.approvalStatus === 'pending' ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              <span>รออนุมัติ</span>
                            </span>
                            {u.role === 'teacher' && (
                              <button
                                onClick={() => handleApproveTeacher(u.id, u.name)}
                                className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow transition-all"
                              >
                                อนุมัติ
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                              <span>ปฏิเสธ</span>
                            </span>
                            {u.role === 'teacher' && (
                              <button
                                onClick={() => handleApproveTeacher(u.id, u.name)}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white text-[10px] font-bold border border-slate-700 transition-all"
                              >
                                คืนสิทธิ์
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Stats / XP */}
                      <td className="py-3.5 px-4">
                        {u.role === 'student' ? (
                          <div>
                            <span className="font-bold text-amber-400 font-['Chakra_Petch']">
                              ⚡ {sProf?.xp || 0} XP
                            </span>
                            <div className="text-[11px] text-slate-500">
                              ระดับ Level {sProf?.level || 1}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-emerald-400 font-semibold">
                            ✓ สิทธิ์จัดการระบบเต็ม
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Test Login As User */}
                          <button
                            onClick={() => handleSwitchUser(u)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-900/60 text-purple-300 hover:text-white border border-slate-700 hover:border-purple-500 transition-all"
                            title={`ล็อกอินทดสอบในฐานะ ${u.name}`}
                          >
                            <LogIn className="w-4 h-4" />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              setResetPassUser(u);
                              setNewPasswordInput('');
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-900/60 text-amber-300 hover:text-white border border-slate-700 hover:border-amber-500 transition-all"
                            title="รีเซ็ตรหัสผ่าน"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Edit User */}
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-900/60 text-indigo-300 hover:text-white border border-slate-700 hover:border-indigo-500 transition-all"
                            title="แก้ไขข้อมูลผู้ใช้"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete User (Disabled for Root Admin) */}
                          <button
                            disabled={isRootAdmin}
                            onClick={() => setDeletingUser(u)}
                            className={`p-1.5 rounded-lg transition-all border ${
                              isRootAdmin
                                ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                                : 'bg-slate-800 hover:bg-rose-900/60 text-rose-400 hover:text-white border-slate-700 hover:border-rose-500'
                            }`}
                            title={isRootAdmin ? 'ไม่สามารถลบบัญชีหลัก Admin01 ได้' : 'ลบผู้ใช้นี้ออกจากระบบ'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}

      {/* ========================================================= */}
      {/* MODAL: ADD USER */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white font-['Chakra_Petch']">
                    เพิ่มผู้ใช้งานใหม่เข้าสู่ระบบ
                  </h3>
                  <p className="text-xs text-slate-400">
                    สร้างบัญชีนักเรียน ครูผู้สอน หรือแอดมินคนใหม่
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewUser} className="space-y-4">
              {/* Role selector */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  บทบาทผู้ใช้งาน (Role)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'student' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      formData.role === 'student'
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>นักเรียน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'teacher' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      formData.role === 'teacher'
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>ครูผู้สอน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      formData.role === 'admin'
                        ? 'bg-amber-600 border-amber-500 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Crown className="w-4 h-4" />
                    <span>Admin</span>
                  </button>
                </div>
              </div>

              {/* Name and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    ชื่อ-นามสกุล <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="เช่น เด็กชายสมชาย ยิ้มสู้"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    อีเมล (รองรับทุกเมล) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="เช่น somchai@gmail.com, school.ac.th"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  รหัสผ่านเริ่มต้น
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="เช่น password123"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Student specific fields */}
              {formData.role === 'student' && (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                  <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" />
                    <span>ข้อมูลจำเพาะของนักเรียน</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">รหัสนักเรียน</label>
                      <input
                        type="text"
                        value={formData.studentId}
                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                        placeholder="6701004"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">ห้องเรียน</label>
                      <select
                        value={formData.classroom}
                        onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      >
                        {allClasses.map((c) => (
                          <option key={c.id} value={c.name}>
                            ห้อง {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">เลขที่</label>
                      <input
                        type="number"
                        value={formData.seatNumber}
                        onChange={(e) => setFormData({ ...formData, seatNumber: Number(e.target.value) || 1 })}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-3">
                      <label className="text-[11px] text-slate-400 block mb-1">
                        ครูผู้ดูแล / ครูประจำชั้น (Assigned Teacher)
                      </label>
                      <select
                        value={formData.assignedTeacherId}
                        onChange={(e) => {
                          const t = allTeachers.find((tch) => tch.id === e.target.value);
                          setFormData({
                            ...formData,
                            assignedTeacherId: e.target.value,
                            assignedTeacherName: t?.name || '',
                          });
                        }}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">-- ไม่ระบุ / รอครูกดรับเข้าห้อง --</option>
                        {allTeachers.map((tch) => (
                          <option key={tch.id} value={tch.id}>
                            ครู {tch.name} ({tch.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Teacher / Admin specific fields */}
              {(formData.role === 'teacher' || formData.role === 'admin') && (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>ข้อมูลประจำตำแหน่ง</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">รหัสครู / รหัสบุคลากร</label>
                      <input
                        type="text"
                        value={formData.teacherId}
                        onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                        placeholder="TCH002"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">ชื่อโรงเรียน</label>
                      <input
                        type="text"
                        value={formData.schoolName}
                        onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                        placeholder="โรงเรียนสาธิตวิทยาการศึกษา"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg"
                >
                  บันทึกผู้ใช้ใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT USER */}
      {/* ========================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white font-['Chakra_Petch']">
                    แก้ไขข้อมูลผู้ใช้งาน
                  </h3>
                  <p className="text-xs text-slate-400">
                    แก้ไขข้อมูลของ {editingUser.name} (ID: {editingUser.id})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              {/* Role Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  เปลี่ยนบทบาท (Role)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'student' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      formData.role === 'student'
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>นักเรียน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'teacher' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      formData.role === 'teacher'
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>ครูผู้สอน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      formData.role === 'admin'
                        ? 'bg-amber-600 border-amber-500 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Crown className="w-4 h-4" />
                    <span>Admin</span>
                  </button>
                </div>
              </div>

              {/* Name and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    ชื่อ-นามสกุล
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    อีเมล
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  รหัสผ่าน
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Student specific fields */}
              {formData.role === 'student' && (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                  <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" />
                    <span>ข้อมูลจำเพาะของนักเรียน</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">รหัสนักเรียน</label>
                      <input
                        type="text"
                        value={formData.studentId}
                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">ห้องเรียน</label>
                      <select
                        value={formData.classroom}
                        onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      >
                        {allClasses.map((c) => (
                          <option key={c.id} value={c.name}>
                            ห้อง {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">เลขที่</label>
                      <input
                        type="number"
                        value={formData.seatNumber}
                        onChange={(e) => setFormData({ ...formData, seatNumber: Number(e.target.value) || 1 })}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="text-[11px] text-slate-400 block mb-1">
                        ครูผู้ดูแล / ครูประจำชั้น (Assigned Teacher)
                      </label>
                      <select
                        value={formData.assignedTeacherId}
                        onChange={(e) => {
                          const t = allTeachers.find((tch) => tch.id === e.target.value);
                          setFormData({
                            ...formData,
                            assignedTeacherId: e.target.value,
                            assignedTeacherName: t?.name || '',
                          });
                        }}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">-- ไม่ระบุ / รอครูกดรับเข้าห้อง --</option>
                        {allTeachers.map((tch) => (
                          <option key={tch.id} value={tch.id}>
                            ครู {tch.name} ({tch.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Teacher / Admin specific fields */}
              {(formData.role === 'teacher' || formData.role === 'admin') && (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>ข้อมูลประจำตำแหน่ง</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">รหัสครู / รหัสบุคลากร</label>
                      <input
                        type="text"
                        value={formData.teacherId}
                        onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">ชื่อโรงเรียน</label>
                      <input
                        type="text"
                        value={formData.schoolName}
                        onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: RESET PASSWORD */}
      {/* ========================================================= */}
      {resetPassUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base font-['Chakra_Petch']">
                    รีเซ็ตรหัสผ่าน
                  </h3>
                  <p className="text-xs text-slate-400">สำหรับ {resetPassUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setResetPassUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResetPassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  กำหนดรหัสผ่านใหม่
                </label>
                <input
                  type="text"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="พิมพ์รหัสผ่านใหม่ที่ต้องการ เช่น 123456"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPassUser(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg"
                >
                  ยืนยันเปลี่ยนรหัส
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CONFIRM DELETE */}
      {/* ========================================================= */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white font-['Chakra_Petch']">
                  ยืนยันการลบผู้ใช้งาน?
                </h3>
                <p className="text-xs text-slate-400">การกระทำนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              คุณต้องการลบผู้ใช้ <strong className="text-white font-bold">{deletingUser.name}</strong> ({deletingUser.email}) บทบาท: <span className="font-bold text-amber-300">{deletingUser.role}</span> ออกจากระบบอย่างถาวรหรือไม่?
              (ระบบจะลบประวัติคะแนนและการส่งงานทั้งหมดของผู้ใช้นี้ด้วย)
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>ยืนยันลบผู้ใช้</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
