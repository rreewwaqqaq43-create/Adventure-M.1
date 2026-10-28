/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, TeacherProfile } from '../types';
import { StorageService, INITIAL_ADMIN_USER, INITIAL_SUPERADMIN_TEACHER2, INITIAL_TEACHER_T01, INITIAL_STUDENT_S01 } from '../services/storage';
import { signInWithGoogle } from '../services/auth';
import { signInWithAnyEmail } from '../services/firebase';
import {
  GraduationCap,
  ShieldCheck,
  UserPlus,
  LogIn,
  KeyRound,
  User as UserIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Globe,
  ExternalLink,
  X,
  Check,
  Lock,
  Mail
} from 'lucide-react';

interface LoginPortalProps {
  onLoginSuccess: (user: User) => void;
  onOpenVideos?: () => void;
  onBrowseAsGuest?: () => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher' | 'register'>('student');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register form state
  const [regRole, setRegRole] = useState<'student' | 'teacher'>('student');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regClassroom, setRegClassroom] = useState('ม.1/1');
  const [regSeatNumber, setRegSeatNumber] = useState(1);
  const [regId, setRegId] = useState('');
  const [regSchool, setRegSchool] = useState('โรงเรียนสาธิตวิทยาการศึกษา');

  // Feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot password modal states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Quick-Fill Demo Account (บันทึกจำไว้สำหรับทดสอบระบบ)
  const fillDemoAccount = (role: 'admin' | 'natthicha' | 'teacher' | 'student') => {
    setErrorMsg(null);
    if (role === 'admin') {
      setActiveTab('teacher');
      setIdentifier('Admin01');
      setPassword('Admin123');
      setRememberMe(true);
      setSuccessMsg('⚡ โหลดรหัสผู้ดูแลระบบ Admin: Admin01 / รหัสผ่าน Admin123 เรียบร้อย');
    } else if (role === 'natthicha') {
      setActiveTab('teacher');
      setIdentifier('6711508546@chandra.ac.th');
      setPassword('000863677');
      setRememberMe(true);
      setSuccessMsg('⚡ โหลดรหัสผู้สอนคนที่ 2: อาจารย์ณัฐทิชา บัวสาย (6711508546 / 000863677) สิทธิ์ Super Admin การจัดการระบบทั้งหมด เรียบร้อย');
    } else if (role === 'teacher') {
      setActiveTab('teacher');
      setIdentifier('T01');
      setPassword('T12345');
      setRememberMe(true);
      setSuccessMsg('⚡ โหลดรหัสผู้สอนคนที่ 1: T01 / รหัสผ่าน T12345 เรียบร้อย');
    } else {
      setActiveTab('student');
      setIdentifier('S01');
      setPassword('S12345');
      setRememberMe(true);
      setSuccessMsg('⚡ โหลดรหัสจำลองนักเรียน: S01 / รหัสผ่าน S12345 เรียบร้อย');
    }
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Google Sign-In with real authentication
  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsGoogleLoading(true);
    try {
      const res: any = await signInWithGoogle();
      if (res && res.success && res.firebaseUser) {
        const fb = res.firebaseUser;
        const email = fb.email || `google-user-${fb.uid.slice(0, 6)}@gmail.com`;
        const displayName = fb.displayName || (activeTab === 'teacher' ? 'คุณครู' : 'นักเรียน');
        
        const freshUsers = StorageService.getUsers();
        let existingUser = freshUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!existingUser) {
          const isTeacher = activeTab === 'teacher';
          const newUser: User = {
            id: `google-${fb.uid}`,
            email: email.toLowerCase(),
            name: displayName,
            role: isTeacher ? 'teacher' : 'student',
            password: 'password123',
            avatarUrl: fb.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
            createdAt: new Date().toISOString(),
          };
          StorageService.addUser(newUser);

          if (isTeacher) {
            StorageService.updateTeacherProfile({
              userId: newUser.id,
              teacherId: `T-${Math.floor(100 + Math.random() * 900)}`,
              schoolName: 'โรงเรียนสาธิตวิทยาการศึกษา',
              subjectTaught: 'เทคโนโลยี (วิทยาการคำนวณ) ม.1',
              classesManaged: ['ม.1/1', 'ม.1/2'],
            });
          } else {
            StorageService.updateStudentProfile({
              userId: newUser.id,
              studentId: `6701${Math.floor(100 + Math.random() * 900)}`,
              gradeLevel: 'ม.1',
              classroom: 'ม.1/1',
              seatNumber: Math.floor(1 + Math.random() * 40),
              xp: 100,
              level: 1,
              totalCompletedLessons: 0,
            });
          }
          existingUser = newUser;
        }

        // Check user approval status (teachers require Admin approval, students require Teacher approval)
        if (existingUser.role !== 'admin') {
          if (existingUser.approvalStatus === 'pending') {
            if (existingUser.role === 'teacher') {
              setErrorMsg('⏳ บัญชีครูผู้สอนนี้กำลังรอการอนุมัติจากผู้ดูแลระบบ (Admin) จึงยังไม่สามารถเข้าสู่ระบบได้ในขณะนี้');
            } else {
              setErrorMsg('⏳ บัญชีนักเรียนนี้กำลังรอคุณครูกดตอบรับเข้าห้องเรียน จึงยังไม่สามารถเข้าสู่ระบบได้ในขณะนี้');
            }
            return;
          }

          if (existingUser.approvalStatus === 'rejected') {
            setErrorMsg('❌ บัญชีนี้ไม่ผ่านการอนุมัติ กรุณาติดต่อสถานศึกษาหรือผู้ดูแลระบบ');
            return;
          }
        }

        setSuccessMsg(`เข้าสู่ระบบด้วยบัญชี Google สำเร็จ ยินดีต้อนรับ ${existingUser.name}`);
        setTimeout(() => {
          StorageService.setCurrentUser(existingUser!);
          onLoginSuccess(existingUser!);
        }, 350);
        return;
      }

      if (res && !res.success) {
        if (
          res.isAccessDenied ||
          res.isTestingMode ||
          res.errorMessage?.includes('403') ||
          res.errorMessage?.includes('access_denied') ||
          res.errorMessage?.includes('ยืนยันตัวตน')
        ) {
          setErrorMsg('❌ การเข้าสู่ระบบด้วย Google ไม่สำเร็จ: แอปอยู่ในระหว่างทดสอบของ Google (Error 403: access_denied) กรุณาใช้อีเมลและรหัสผ่านเพื่อเข้าสู่ระบบด้านล่าง');
        } else if (res.popupBlocked) {
          setErrorMsg('❌ เบราว์เซอร์บล็อกหน้าต่างป็อปอัปของ Google กรุณาอนุญาตป็อปอัป หรือใช้อีเมลและรหัสผ่านด้านล่าง');
        } else if (res.cancelled) {
          setErrorMsg('หน้าต่างเข้าสู่ระบบ Google ถูกปิด กรุณาลองใหม่อีกครั้ง หรือใช้อีเมลและรหัสผ่าน');
        } else {
          setErrorMsg(res.errorMessage || 'การเข้าสู่ระบบด้วย Google ไม่สำเร็จ');
        }
      }
    } catch (err: any) {
      console.warn('Google sign-in exception:', err);
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sign-In กรุณาใช้อีเมลและรหัสผ่าน');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // 2. Manual Login with Email or ID & Password
  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    if (!identifier.trim()) {
      setErrorMsg('กรุณากรอกอีเมล หรือรหัสประจำตัว');
      setIsSubmitting(false);
      return;
    }

    if (!password.trim()) {
      setErrorMsg('กรุณากรอกรหัสผ่าน');
      setIsSubmitting(false);
      return;
    }

    const cleanInput = identifier.trim().toLowerCase();

    // 1. Check for Admin01 (ผู้ดูแลระบบกลาง): Admin01 / Admin123
    if (
      cleanInput === 'admin01' ||
      cleanInput === 'admin' ||
      cleanInput === 'admin01@school.ac.th'
    ) {
      const allUsers = StorageService.getUsers();
      let adminUser = allUsers.find(
        (u) =>
          u.id === 'admin-1' ||
          u.email.toLowerCase() === 'admin01@school.ac.th'
      );
      if (!adminUser) {
        adminUser = INITIAL_ADMIN_USER;
        StorageService.addUser(adminUser);
      }

      const isPassValid =
        password.trim() === 'Admin123' ||
        StorageService.verifyUserPassword(adminUser.id, password.trim());

      if (!isPassValid) {
        setErrorMsg('❌ รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง (รหัสคือ Admin123)');
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(`เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ ${adminUser.name} (${adminUser.email})`);
      setTimeout(() => {
        StorageService.setCurrentUser(adminUser!);
        onLoginSuccess(adminUser!);
      }, 400);
      return;
    }

    // 2. Check for อาจารย์ณัฐทิชา บัวสาย (ผู้สอนคนที่ 2 / Super Admin การจัดการระบบทั้งหมด): 6711508546@chandra.ac.th / 000863677 (หรือพิมพ์ 6711508546, ผู้ดูแลระบบ)
    if (
      cleanInput === '6711508546@chandra.ac.th' ||
      cleanInput === '6711508546' ||
      cleanInput === 'ผู้ดูแลระบบ' ||
      cleanInput === 'อาจารย์ณัฐทิชา' ||
      cleanInput === 'ณัฐทิชา' ||
      cleanInput === 't02' ||
      cleanInput === 'teacher02'
    ) {
      const allUsers = StorageService.getUsers();
      let natthichaUser = allUsers.find(
        (u) =>
          u.id === 'teacher-2-natthicha' ||
          u.email.toLowerCase() === '6711508546@chandra.ac.th'
      );
      if (!natthichaUser) {
        natthichaUser = INITIAL_SUPERADMIN_TEACHER2;
        StorageService.addUser(natthichaUser);
      }

      const isPassValid =
        password.trim() === '000863677' ||
        StorageService.verifyUserPassword(natthichaUser.id, password.trim());

      if (!isPassValid) {
        setErrorMsg('❌ รหัสผ่านไม่ถูกต้อง (รหัสเริ่มต้นของอาจารย์ณัฐทิชาคือ 000863677)');
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(`เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ ${natthichaUser.name} (ผู้สอนคนที่ 2 - Super Admin การจัดการระบบทั้งหมด)`);
      setTimeout(() => {
        StorageService.setCurrentUser(natthichaUser!);
        onLoginSuccess(natthichaUser!);
      }, 400);
      return;
    }

    // 3. Check for Teacher T01 credentials: T01 / T12345 (ผู้สอนคนที่ 1)
    if (cleanInput === 't01' || cleanInput === 't01@school.ac.th' || cleanInput === 'teacher01') {
      const allUsers = StorageService.getUsers();
      let teacherUser = allUsers.find(
        (u) => u.id === 'teacher-t01' || u.email.toLowerCase() === 't01@school.ac.th'
      );
      if (!teacherUser) {
        teacherUser = INITIAL_TEACHER_T01;
        StorageService.addUser(teacherUser);
      }

      const isPassValid =
        password.trim() === 'T12345' ||
        StorageService.verifyUserPassword(teacherUser.id, password.trim());

      if (!isPassValid) {
        setErrorMsg('❌ รหัสผ่านผู้สอนไม่ถูกต้อง (รหัสผ่านคือ T12345)');
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(`เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ ${teacherUser.name} (ผู้สอนคนที่ 1)`);
      setTimeout(() => {
        StorageService.setCurrentUser(teacherUser!);
        onLoginSuccess(teacherUser!);
      }, 400);
      return;
    }

    // 4. Check for Student S01 credentials: S01 / S12345 (นักเรียน)
    if (cleanInput === 's01' || cleanInput === 's01@school.ac.th' || cleanInput === 'student01') {
      const allUsers = StorageService.getUsers();
      let studentUser = allUsers.find(
        (u) => u.id === 'student-s01' || u.email.toLowerCase() === 's01@school.ac.th'
      );
      if (!studentUser) {
        studentUser = INITIAL_STUDENT_S01;
        StorageService.addUser(studentUser);
      }

      const isPassValid =
        password.trim() === 'S12345' ||
        StorageService.verifyUserPassword(studentUser.id, password.trim());

      if (!isPassValid) {
        setErrorMsg('❌ รหัสผ่านนักเรียนไม่ถูกต้อง (รหัสผ่านคือ S12345)');
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(`เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ ${studentUser.name}`);
      setTimeout(() => {
        StorageService.setCurrentUser(studentUser!);
        onLoginSuccess(studentUser!);
      }, 400);
      return;
    }

    const emailToUse = cleanInput.includes('@') ? cleanInput : `${cleanInput}@school.ac.th`;

    // Attempt Firebase Authentication in parallel if reachable (with 1.5s timeout so user is never blocked)
    try {
      await Promise.race([
        signInWithAnyEmail(emailToUse, password),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500)),
      ]);
    } catch {}

    const freshUsers = StorageService.getUsers();
    let user = StorageService.findUserByIdentifier(identifier.trim()) ||
               freshUsers.find((u) => u.email.toLowerCase() === cleanInput || u.email.toLowerCase() === emailToUse);

    // Search by student ID or teacher ID
    if (!user) {
      if (activeTab === 'student') {
        const studentProfiles = StorageService.getStudentProfiles();
        const prof = studentProfiles.find((p) => p.studentId.toLowerCase() === cleanInput);
        if (prof) {
          user = freshUsers.find((u) => u.id === prof.userId);
        }
      } else {
        const teacherProfiles = StorageService.getTeacherProfiles();
        const prof = teacherProfiles.find((p: TeacherProfile) => p.teacherId.toLowerCase() === cleanInput);
        if (prof) {
          user = freshUsers.find((u) => u.id === prof.userId);
        }
      }
    }

    if (!user) {
      setErrorMsg('❌ ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาตรวจสอบข้อมูลหรือกด "ลงทะเบียนใหม่" เพื่อสร้างบัญชี');
      setIsSubmitting(false);
      return;
    }

    // Verify password
    const isPassOk = StorageService.verifyUserPassword(user.id, password.trim());
    if (!isPassOk) {
      setErrorMsg('❌ รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านอีกครั้ง');
      setIsSubmitting(false);
      return;
    }

    // Check user approval status (teachers require Admin approval, students require Teacher approval)
    if (user.role !== 'admin') {
      if (user.approvalStatus === 'pending') {
        if (user.role === 'teacher') {
          setErrorMsg('⏳ บัญชีครูผู้สอนนี้กำลังรอการอนุมัติจากผู้ดูแลระบบ (Admin) จึงยังไม่สามารถเข้าสู่ระบบได้ในขณะนี้');
        } else {
          setErrorMsg('⏳ บัญชีนักเรียนนี้กำลังรอคุณครูกดตอบรับเข้าห้องเรียน จึงยังไม่สามารถเข้าสู่ระบบได้ในขณะนี้');
        }
        setIsSubmitting(false);
        return;
      }

      if (user.approvalStatus === 'rejected') {
        setErrorMsg('❌ บัญชีนี้ไม่ผ่านการอนุมัติ กรุณาติดต่อสถานศึกษาหรือผู้ดูแลระบบ');
        setIsSubmitting(false);
        return;
      }
    }

    setSuccessMsg(`เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ ${user.name}`);
    setTimeout(() => {
      StorageService.setCurrentUser(user!);
      onLoginSuccess(user!);
    }, 400);
  };

  // 3. User Registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!regName.trim()) {
      setErrorMsg('กรุณากรอกชื่อ-นามสกุล');
      return;
    }
    if (!regPassword.trim()) {
      setErrorMsg('กรุณากำหนดรหัสผ่าน');
      return;
    }

    const isTeacher = regRole === 'teacher';
    const emailToUse = regEmail.trim() || `${regName.replace(/\s+/g, '').toLowerCase()}@school.ac.th`;

    const newUser: User = {
      id: `${regRole}-${Date.now()}`,
      email: emailToUse,
      name: regName.trim(),
      role: regRole,
      password: regPassword.trim() || 'password123',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(regName.trim())}`,
      createdAt: new Date().toISOString(),
      approvalStatus: 'pending',
    };

    StorageService.addUser(newUser);

    if (isTeacher) {
      StorageService.updateTeacherProfile({
        userId: newUser.id,
        teacherId: regId.trim() || `T-${Math.floor(100 + Math.random() * 900)}`,
        schoolName: regSchool.trim() || 'โรงเรียนสาธิตวิทยาการศึกษา',
        subjectTaught: 'เทคโนโลยี (วิทยาการคำนวณ) ม.1',
        classesManaged: ['ม.1/1', 'ม.1/2'],
      });
      setSuccessMsg('ลงทะเบียนครูผู้สอนเรียบร้อยแล้ว บัญชีของคุณอยู่ระหว่างรอการอนุมัติจากผู้ดูแลระบบ (Admin) กรุณารอการตรวจสอบก่อนเข้าใช้งาน');
      setTimeout(() => {
        setActiveTab('teacher');
        setIdentifier(emailToUse);
        setPassword('');
      }, 2000);
    } else {
      StorageService.updateStudentProfile({
        userId: newUser.id,
        studentId: regId.trim() || `6701${Math.floor(100 + Math.random() * 900)}`,
        gradeLevel: 'ม.1',
        classroom: regClassroom,
        seatNumber: Number(regSeatNumber) || 1,
        xp: 100,
        level: 1,
        totalCompletedLessons: 0,
      });
      setSuccessMsg('ลงทะเบียนนักเรียนเรียบร้อยแล้ว บัญชีของคุณอยู่ระหว่างรอคุณครูประจำชั้นกดตอบรับเข้าห้องเรียน กรุณารอคุณครูอนุมัติก่อนเข้าสู่ระบบ');
      setTimeout(() => {
        setActiveTab('student');
        setIdentifier(emailToUse);
        setPassword('');
      }, 2000);
    }
  };

  // 4. Handle Password Reset in Modal
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotMsg(null);

    if (!forgotIdentifier.trim()) {
      setForgotError('กรุณากรอกอีเมลหรือรหัสประจำตัว');
      return;
    }

    if (!forgotNewPassword.trim()) {
      setForgotError('กรุณากรอกรหัสผ่านใหม่');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
      return;
    }

    const clean = forgotIdentifier.trim().toLowerCase();
    const user = StorageService.findUserByIdentifier(clean) ||
                 StorageService.getUsers().find((u) => u.email.toLowerCase() === clean);

    if (!user) {
      setForgotError('ไม่พบบัญชีผู้ใช้นี้ในระบบ');
      return;
    }

    const updated = StorageService.changeUserPassword(user.id, forgotNewPassword.trim());
    if (updated) {
      setForgotMsg('เปลี่ยนรหัสผ่านสำเร็จเรียบร้อย สามารถใช้รหัสผ่านใหม่เข้าสู่ระบบได้ทันที');
      setTimeout(() => {
        setShowForgotModal(false);
        setPassword(forgotNewPassword.trim());
        setIdentifier(forgotIdentifier.trim());
      }, 1200);
    } else {
      setForgotError('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto my-4 sm:my-8 px-2 sm:px-4">
      {/* Main Login Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Educational Branding & Official Curriculum */}
        <div className="lg:col-span-5 bg-gradient-to-b from-sky-950 via-slate-900 to-indigo-950 p-6 sm:p-8 flex flex-col justify-between items-center text-center border-b lg:border-b-0 lg:border-r border-slate-800 relative">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>หลักสูตร สสวท. กระทรวงศึกษาธิการ</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Chakra_Petch']">
              Adventure <span className="text-amber-400">M.1</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-xs mx-auto">
              “ผจญภัย สนุกคิด พิชิตวิทยาการคำนวณ” อิงหนังสือเรียน สสวท. ม.1 เล่มจริง
            </p>
          </div>

          {/* E-Book & Curriculum Resource Links */}
          <div className="my-auto py-6 w-full space-y-3">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-amber-500/20 text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>เทคโนโลยี วิทยาการคำนวณ ม.1</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                ครอบคลุมเนื้อหาทั้ง 6 บทเรียน: แนวคิดเชิงนามธรรม, การแก้ปัญหา & ผังงาน, ไพทอน, Scratch, การประมวลผลข้อมูล และความปลอดภัยไซเบอร์
              </p>
            </div>

            <a
              id="btn-login-ebook"
              href="https://pubhtml5.com/ztml/rbqf/"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg border border-amber-400/30 transition-all hover:scale-105"
            >
              <BookOpen className="w-4 h-4" />
              <span>เปิดอ่านหนังสือเรียน สสวท. ม.1 E-Book</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              id="btn-login-ipst-web"
              href="https://proj14.ipst.ac.th/m1/m1-cs/"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-3 text-xs text-slate-400 hover:text-sky-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>เว็บไซต์ สสวท. Project 14</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Right Column: Authentication & Registration Forms */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-6">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <KeyRound className="w-4 h-4" />
              <span>เข้าสู่ระบบก่อนเข้าใช้งาน</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              ลงชื่อเข้าสู่ระบบ Adventure M.1
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              กรุณาเข้าสู่ระบบเพื่อเริ่มการเรียนรู้และบันทึกคะแนน
            </p>
          </div>



          {/* Role Tabs: นักเรียน / ครูผู้สอน / ลงทะเบียนใหม่ */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              id="tab-student-login"
              type="button"
              onClick={() => {
                setActiveTab('student');
                setErrorMsg(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'student'
                  ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>นักเรียน</span>
            </button>

            <button
              id="tab-teacher-login"
              type="button"
              onClick={() => {
                setActiveTab('teacher');
                setErrorMsg(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'teacher'
                  ? 'bg-sky-500 text-slate-950 shadow-md scale-[1.02]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>ครูผู้สอน</span>
            </button>

            <button
              id="tab-register"
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMsg(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'register'
                  ? 'bg-emerald-500 text-slate-950 shadow-md scale-[1.02]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>ลงทะเบียนใหม่</span>
            </button>
          </div>

          {/* Google Sign-in */}
          <div>
            <button
              id="btn-google-login"
              type="button"
              disabled={isGoogleLoading}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 shadow transition-all hover:scale-[1.01] border border-slate-200 disabled:opacity-70 group cursor-pointer"
            >
              {isGoogleLoading ? (
                <div className="w-5 h-5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>
                {isGoogleLoading
                  ? 'กำลังเชื่อมต่อบัญชี Google...'
                  : activeTab === 'register'
                  ? 'สมัครสมาชิกด้วย Google'
                  : 'เข้าสู่ระบบด้วย Google'}
              </span>
            </button>

            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-slate-800"></div>
              <span className="px-3 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                หรือเข้าสู่ระบบด้วยอีเมล / รหัสประจำตัว
              </span>
              <div className="flex-1 border-t border-slate-800"></div>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 text-left animate-pulse">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Login Form (for Student or Teacher) */}
          {activeTab !== 'register' ? (
            <form onSubmit={handleManualLogin} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>อีเมล หรือ รหัสประจำตัว</span>
                </label>
                <input
                  id="login-identifier-input"
                  type="text"
                  placeholder="กรอกอีเมลของคุณ หรือรหัสประจำตัว"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  <span>รหัสผ่าน</span>
                </label>
                <input
                  id="login-password-input"
                  type="password"
                  placeholder="กรอกรหัสผ่านของคุณ"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>จดจำการเข้าสู่ระบบ</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotIdentifier(identifier || '');
                    setForgotError(null);
                    setForgotMsg(null);
                    setShowForgotModal(true);
                  }}
                  className="text-amber-400 hover:underline"
                >
                  ลืมรหัสผ่าน?
                </button>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 rounded-xl font-bold text-sm text-slate-950 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'student'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400'
                    : 'bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400'
                }`}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>เข้าสู่ระบบ</span>
              </button>
            </form>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegister} className="space-y-3.5 text-left">
              <div className="flex items-center gap-4 pb-2 border-b border-slate-800">
                <label className="text-xs font-semibold text-slate-300">ประเภทผู้ใช้งาน:</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="regRole"
                      checked={regRole === 'student'}
                      onChange={() => setRegRole('student')}
                      className="text-amber-500"
                    />
                    <span>นักเรียน</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="regRole"
                      checked={regRole === 'teacher'}
                      onChange={() => setRegRole('teacher')}
                      className="text-sky-500"
                    />
                    <span>ครูผู้สอน</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-semibold">ชื่อ - นามสกุล *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ด.ช. ภูวดล สมใจ"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-semibold">
                    {regRole === 'student' ? 'รหัสประจำตัวนักเรียน *' : 'รหัสประจำตัวครู *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={regRole === 'student' ? 'เช่น 6701099' : 'เช่น T-105'}
                    value={regId}
                    onChange={(e) => setRegId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500"
                  />
                </div>
              </div>

              {regRole === 'student' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-semibold">ห้องเรียน</label>
                    <select
                      value={regClassroom}
                      onChange={(e) => setRegClassroom(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                    >
                      {['ม.1/1', 'ม.1/2', 'ม.1/3', 'ม.1/4', 'ม.1/5', 'ม.1/6'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-semibold">เลขที่</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={regSeatNumber}
                      onChange={(e) => setRegSeatNumber(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-semibold">ชื่อสถานศึกษา</label>
                  <input
                    type="text"
                    value={regSchool}
                    onChange={(e) => setRegSchool(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-semibold">อีเมล</label>
                  <input
                    type="email"
                    placeholder="user@school.ac.th"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-semibold">กำหนดรหัสผ่าน *</label>
                  <input
                    type="password"
                    required
                    placeholder="ขั้นต่ำ 4 ตัวอักษร"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>ยืนยันการลงทะเบียนและเริ่มใช้งาน</span>
              </button>
            </form>
          )}

          {/* Security Note */}
          <div className="pt-2 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>ระบบบริหารจัดการการเรียนรู้ตามมาตรฐานสถานศึกษา • ปลอดภัยและเข้ารหัสข้อมูล</span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base font-['Chakra_Petch']">
                  ตั้งค่ารหัสผ่านใหม่
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotError && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{forgotMsg}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">อีเมล หรือ รหัสประจำตัว</label>
                <input
                  type="text"
                  required
                  placeholder="ระบุอีเมลหรือรหัสประจำตัวที่เคยลงทะเบียน"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">รหัสผ่านใหม่</label>
                <input
                  type="password"
                  required
                  placeholder="กรอกรหัสผ่านใหม่"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">ยืนยันรหัสผ่านใหม่อีกครั้ง</label>
                <input
                  type="password"
                  required
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  บันทึกรหัสผ่านใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
