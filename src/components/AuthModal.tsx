/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, UserRole, StudentProfile, TeacherProfile } from '../types';
import { StorageService, INITIAL_ADMIN_USER, INITIAL_SUPERADMIN_TEACHER2, INITIAL_TEACHER_T01, INITIAL_STUDENT_S01 } from '../services/storage';
import { signInWithGoogle } from '../services/auth';
import {
  X,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  IdCard,
  School,
  BookOpen,
  Phone,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  HelpCircle,
  Check,
  KeyRound,
  Save
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onAuthSuccess,
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loginMethod, setLoginMethod] = useState<'email' | 'id'>('email');
  const [roleToRegister, setRoleToRegister] = useState<'student' | 'teacher'>('student');
  const [rememberMe, setRememberMe] = useState(true);

  // Login inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [identifierId, setIdentifierId] = useState(''); // Student ID or Teacher ID
  const [loginRole, setLoginRole] = useState<'student' | 'teacher'>('student');

  // Register inputs
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [profilePic, setProfilePic] = useState('');

  // Student specific register inputs
  const [gradeLevel, setGradeLevel] = useState('ม.1');
  const [classroom, setClassroom] = useState('ม.1/1');
  const [seatNumber, setSeatNumber] = useState<number>(1);
  const [studentId, setStudentId] = useState('');

  // Teacher specific register inputs
  const [teacherId, setTeacherId] = useState('');
  const [schoolName, setSchoolName] = useState('โรงเรียนสาธิตวิทยาการศึกษา');
  const [subjectTaught, setSubjectTaught] = useState('เทคโนโลยี (วิทยาการคำนวณ) ม.1');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Status & Error
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotEmailVerified, setIsForgotEmailVerified] = useState(false);
  const [forgotMatchedUser, setForgotMatchedUser] = useState<User | null>(null);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Quick-Fill Demo Account (บันทึกจำไว้สำหรับทดสอบระบบ)
  const fillDemoAccount = (role: 'admin' | 'natthicha' | 'teacher' | 'student') => {
    setErrorMsg(null);
    setMode('login');
    if (role === 'admin') {
      setLoginMethod('email');
      setEmail('Admin01');
      setPassword('Admin123');
      setSuccessMsg('⚡ โหลดรหัสผู้ดูแลระบบ Admin: Admin01 / รหัสผ่าน Admin123 เรียบร้อย');
    } else if (role === 'natthicha') {
      setLoginMethod('email');
      setEmail('6711508546@chandra.ac.th');
      setPassword('000863677');
      setSuccessMsg('⚡ โหลดรหัสผู้สอนคนที่ 2: อาจารย์ณัฐทิชา บัวสาย (6711508546 / 000863677) สิทธิ์ Super Admin เรียบร้อย');
    } else if (role === 'teacher') {
      setLoginMethod('id');
      setLoginRole('teacher');
      setIdentifierId('T01');
      setPassword('T12345');
      setSuccessMsg('⚡ โหลดรหัสจำลองผู้สอนคนที่ 1: T01 / รหัสผ่าน T12345 เรียบร้อย');
    } else {
      setLoginMethod('id');
      setLoginRole('student');
      setIdentifierId('S01');
      setPassword('S12345');
      setSuccessMsg('⚡ โหลดรหัสจำลองนักเรียน: S01 / รหัสผ่าน S12345 เรียบร้อย');
    }
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const allUsers = StorageService.getUsers();

    if (loginMethod === 'email') {
      const cleanEmail = email.trim().toLowerCase();

      // 1. Support Admin01 directly: Admin01 / Admin123
      if (
        cleanEmail === 'admin01' ||
        cleanEmail === 'admin' ||
        cleanEmail === 'admin01@school.ac.th'
      ) {
        const adminUser = allUsers.find(
          (u) =>
            u.id === 'admin-1' ||
            u.email.toLowerCase() === 'admin01@school.ac.th'
        ) || INITIAL_ADMIN_USER;

        const isPassOk =
          password.trim() === 'Admin123' ||
          StorageService.verifyUserPassword(adminUser.id, password.trim());

        if (!isPassOk) {
          setErrorMsg('❌ รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง (รหัสคือ Admin123)');
          return;
        }

        setSuccessMsg(`ยินดีต้อนรับกลับคุณ ${adminUser.name}!`);
        setTimeout(() => {
          onAuthSuccess(adminUser);
          onClose();
        }, 500);
        return;
      }

      // 2. Support อาจารย์ณัฐทิชา บัวสาย (ผู้สอนคนที่ 2 / Super Admin): 6711508546@chandra.ac.th / 000863677
      if (
        cleanEmail === '6711508546@chandra.ac.th' ||
        cleanEmail === '6711508546' ||
        cleanEmail === 'ผู้ดูแลระบบ' ||
        cleanEmail === 'อาจารย์ณัฐทิชา' ||
        cleanEmail === 'ณัฐทิชา' ||
        cleanEmail === 't02'
      ) {
        const natthichaUser = allUsers.find(
          (u) =>
            u.id === 'teacher-2-natthicha' ||
            u.email.toLowerCase() === '6711508546@chandra.ac.th'
        ) || INITIAL_SUPERADMIN_TEACHER2;

        const isPassOk =
          password.trim() === '000863677' ||
          StorageService.verifyUserPassword(natthichaUser.id, password.trim());

        if (!isPassOk) {
          setErrorMsg('❌ รหัสผ่านไม่ถูกต้อง (รหัสเริ่มต้นของอาจารย์ณัฐทิชาคือ 000863677)');
          return;
        }

        setSuccessMsg(`ยินดีต้อนรับกลับคุณ ${natthichaUser.name} (ผู้สอนคนที่ 2 - Super Admin)!`);
        setTimeout(() => {
          onAuthSuccess(natthichaUser);
          onClose();
        }, 500);
        return;
      }

      // 3. Support Teacher T01 via email
      if (cleanEmail === 't01' || cleanEmail === 't01@school.ac.th' || cleanEmail === 'teacher01') {
        const teacherUser = allUsers.find(
          (u) => u.id === 'teacher-t01' || u.email.toLowerCase() === 't01@school.ac.th'
        ) || INITIAL_TEACHER_T01;
        const isPassOk = password.trim() === 'T12345' || StorageService.verifyUserPassword(teacherUser.id, password.trim());
        if (!isPassOk) {
          setErrorMsg('❌ รหัสผ่านผู้สอนไม่ถูกต้อง (รหัสผ่านคือ T12345)');
          return;
        }
        setSuccessMsg(`ยินดีต้อนรับกลับคุณ ${teacherUser.name}!`);
        setTimeout(() => {
          onAuthSuccess(teacherUser);
          onClose();
        }, 500);
        return;
      }

      // 4. Support Student S01 via email
      if (cleanEmail === 's01' || cleanEmail === 's01@school.ac.th' || cleanEmail === 'student01') {
        const studentUser = allUsers.find(
          (u) => u.id === 'student-s01' || u.email.toLowerCase() === 's01@school.ac.th'
        ) || INITIAL_STUDENT_S01;
        const isPassOk = password.trim() === 'S12345' || StorageService.verifyUserPassword(studentUser.id, password.trim());
        if (!isPassOk) {
          setErrorMsg('❌ รหัสผ่านนักเรียนไม่ถูกต้อง (รหัสผ่านคือ S12345)');
          return;
        }
        setSuccessMsg(`ยินดีต้อนรับกลับคุณ ${studentUser.name}!`);
        setTimeout(() => {
          onAuthSuccess(studentUser);
          onClose();
        }, 500);
        return;
      }

      const found = allUsers.find(
        (u) => u.email.toLowerCase() === cleanEmail
      );
      if (!found) {
        setErrorMsg('❌ ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาตรวจสอบอีเมล หรือกดสมัครสมาชิกใหม่');
        return;
      }

      // Verify password
      const isPassOk = StorageService.verifyUserPassword(found.id, password.trim());
      if (!isPassOk) {
        setErrorMsg('❌ รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านอีกครั้ง (หรือกด "ลืมรหัสผ่าน?" ด้านบน)');
        return;
      }

      // Check approval status
      if (found.role !== 'admin') {
        if (found.approvalStatus === 'pending') {
          if (found.role === 'teacher') {
            setErrorMsg('⏳ บัญชีครูผู้สอนนี้กำลังรอการอนุมัติจากผู้ดูแลระบบ (Admin) จึงยังไม่สามารถเข้าสู่ระบบได้ในขณะนี้');
          } else {
            setErrorMsg('⏳ บัญชีนักเรียนนี้กำลังรอคุณครูกดตอบรับเข้าห้องเรียน จึงยังไม่สามารถเข้าสู่ระบบได้ในขณะนี้');
          }
          return;
        }
        if (found.approvalStatus === 'rejected') {
          setErrorMsg('❌ บัญชีนี้ไม่ผ่านการอนุมัติ กรุณาติดต่อสถานศึกษาหรือผู้ดูแลระบบ');
          return;
        }
      }

      setSuccessMsg(`ยินดีต้อนรับกลับคุณ ${found.name}!`);
      setTimeout(() => {
        onAuthSuccess(found);
        onClose();
      }, 500);
    } else {
      // Login by ID
      if (!identifierId.trim() || !password.trim()) {
        setErrorMsg('กรุณากรอกรหัสประจำตัวและรหัสผ่าน');
        return;
      }

      if (loginRole === 'student') {
        const studentProfiles = StorageService.getStudentProfiles();
        const foundProfile = studentProfiles.find(
          (p) => p.studentId.trim().toLowerCase() === identifierId.trim().toLowerCase()
        );
        if (!foundProfile) {
          setErrorMsg('❌ ไม่พบรหัสประจำตัวนักเรียนนี้ในระบบ กรุณาตรวจสอบรหัส หรือกดสมัครสมาชิกใหม่');
          return;
        }

        const user = allUsers.find((u) => u.id === foundProfile.userId);
        if (!user) {
          setErrorMsg('❌ ไม่พบบัญชีผู้ใช้นักเรียนที่ผูกกับรหัสนี้ในระบบ');
          return;
        }

        const isPassOk = StorageService.verifyUserPassword(user.id, password.trim());
        if (!isPassOk) {
          setErrorMsg('❌ รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านอีกครั้ง');
          return;
        }

        // Check student approval status
        if (user.approvalStatus === 'pending') {
          setErrorMsg('⏳ บัญชีนักเรียนนี้กำลังรอคุณครูกดตอบรับเข้าห้องเรียน จึงยังไม่สามารถเข้าสู่ระบบได้ในขณะนี้');
          return;
        }
        if (user.approvalStatus === 'rejected') {
          setErrorMsg('❌ บัญชีนี้ไม่ผ่านการอนุมัติ กรุณาติดต่อสถานศึกษาหรือผู้ดูแลระบบ');
          return;
        }

        setSuccessMsg(`เข้าสู่ระบบสำเร็จ: ${user.name} (${foundProfile.classroom} เลขที่ ${foundProfile.seatNumber})`);
        setTimeout(() => {
          onAuthSuccess(user);
          onClose();
        }, 500);
      } else {
        // Teacher by ID (or Admin01)
        const cleanId = identifierId.trim().toLowerCase();

        // 1. Support Admin01 directly
        if (
          cleanId === 'admin01' ||
          cleanId === 'admin' ||
          cleanId === 'admin01@school.ac.th'
        ) {
          const adminUser = allUsers.find(
            (u) =>
              u.id === 'admin-1' ||
              u.email.toLowerCase() === 'admin01@school.ac.th'
          ) || INITIAL_ADMIN_USER;

          const isPassOk =
            password.trim() === 'Admin123' ||
            StorageService.verifyUserPassword(adminUser.id, password.trim());
          if (!isPassOk) {
            setErrorMsg('❌ รหัสผ่านไม่ถูกต้อง (รหัสผ่าน Admin คือ Admin123)');
            return;
          }

          setSuccessMsg(`เข้าสู่ระบบในฐานะผู้ดูแลระบบ: ${adminUser.name}`);
          setTimeout(() => {
            onAuthSuccess(adminUser);
            onClose();
          }, 500);
          return;
        }

        // 2. Support Teacher 2 Natthicha (Super Admin)
        if (
          cleanId === '6711508546@chandra.ac.th' ||
          cleanId === '6711508546' ||
          cleanId === 'ผู้ดูแลระบบ' ||
          cleanId === 'อาจารย์ณัฐทิชา' ||
          cleanId === 'ณัฐทิชา' ||
          cleanId === 't02'
        ) {
          const natthichaUser = allUsers.find(
            (u) =>
              u.id === 'teacher-2-natthicha' ||
              u.email.toLowerCase() === '6711508546@chandra.ac.th'
          ) || INITIAL_SUPERADMIN_TEACHER2;

          const isPassOk =
            password.trim() === '000863677' ||
            StorageService.verifyUserPassword(natthichaUser.id, password.trim());
          if (!isPassOk) {
            setErrorMsg('❌ รหัสผ่านไม่ถูกต้อง (รหัสผ่านของอาจารย์ณัฐทิชาคือ 000863677)');
            return;
          }

          setSuccessMsg(`เข้าสู่ระบบสำเร็จ: ${natthichaUser.name} (ผู้สอนคนที่ 2 - Super Admin)`);
          setTimeout(() => {
            onAuthSuccess(natthichaUser);
            onClose();
          }, 500);
          return;
        }

        const teacherProfiles = StorageService.getTeacherProfiles();
        const foundProfile = teacherProfiles.find(
          (p) => p.teacherId.trim().toLowerCase() === cleanId
        );
        if (!foundProfile) {
          setErrorMsg('❌ ไม่พบรหัสประจำตัวครูผู้สอนนี้ในระบบ กรุณาตรวจสอบรหัส หรือกดสมัครสมาชิกใหม่');
          return;
        }

        const teacherUser = allUsers.find((u) => u.id === foundProfile.userId);
        if (!teacherUser) {
          setErrorMsg('❌ ไม่พบบัญชีครูผู้สอนที่ผูกกับรหัสนี้ในระบบ');
          return;
        }

        const isPassOk = StorageService.verifyUserPassword(teacherUser.id, password.trim());
        if (!isPassOk) {
          setErrorMsg('❌ รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านอีกครั้ง');
          return;
        }

        // Check teacher approval status
        if (teacherUser.approvalStatus === 'pending') {
          setErrorMsg('⏳ บัญชีครูผู้สอนนี้กำลังรอการอนุมัติจากผู้ดูแลระบบ (Admin) จึงยังไม่สามารถเข้าสู่ระบบได้ในขณะนี้');
          return;
        }
        if (teacherUser.approvalStatus === 'rejected') {
          setErrorMsg('❌ บัญชีนี้ไม่ผ่านการอนุมัติ กรุณาติดต่อสถานศึกษาหรือผู้ดูแลระบบ');
          return;
        }

        setSuccessMsg(`เข้าสู่ระบบในฐานะครูผู้สอน: ${teacherUser.name}`);
        setTimeout(() => {
          onAuthSuccess(teacherUser);
          onClose();
        }, 500);
      }
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMsg('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    const newUserId = `user-${Date.now()}`;
    const newUser: User = {
      id: newUserId,
      email: regEmail.trim(),
      name: fullName.trim(),
      role: roleToRegister,
      avatarUrl: profilePic.trim() || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName.trim())}`,
      createdAt: new Date().toISOString(),
      approvalStatus: 'pending',
    };

    StorageService.addUser(newUser);

    if (roleToRegister === 'student') {
      const newStudentProfile: StudentProfile = {
        userId: newUserId,
        studentId: studentId.trim() || '6701' + Math.floor(100 + Math.random() * 900),
        gradeLevel: gradeLevel || 'ม.1',
        classroom: classroom || 'ม.1/1',
        seatNumber: Number(seatNumber) || 1,
        xp: 100,
        level: 1,
        totalCompletedLessons: 0,
      };
      StorageService.updateStudentProfile(newStudentProfile);
      setSuccessMsg('ลงทะเบียนนักเรียนเรียบร้อยแล้ว บัญชีของคุณอยู่ระหว่างรอคุณครูประจำชั้นกดตอบรับเข้าห้องเรียน กรุณารอคุณครูอนุมัติก่อนเข้าสู่ระบบ');
      setTimeout(() => {
        setMode('login');
      }, 2000);
    } else {
      StorageService.updateTeacherProfile({
        userId: newUserId,
        teacherId: `T-${Math.floor(100 + Math.random() * 900)}`,
        schoolName: 'โรงเรียนสาธิตวิทยาการศึกษา',
        subjectTaught: 'เทคโนโลยี (วิทยาการคำนวณ) ม.1',
        classesManaged: ['ม.1/1', 'ม.1/2'],
      });
      setSuccessMsg('ลงทะเบียนครูผู้สอนเรียบร้อยแล้ว บัญชีของคุณอยู่ระหว่างรอการอนุมัติจากผู้ดูแลระบบ (Admin) กรุณารอการตรวจสอบก่อนเข้าใช้งาน');
      setTimeout(() => {
        setMode('login');
      }, 2000);
    }
  };

  const handleGoogleAuthSuccess = (emailToLogin: string, customName?: string, role: UserRole = 'student') => {
    const cleanEmail = emailToLogin.trim().toLowerCase();
    const displayName = customName?.trim() || cleanEmail.split('@')[0] || (role === 'teacher' ? 'คุณครู Google' : 'นักเรียน Google');

    const allUsers = StorageService.getUsers();
    let matchedUser = allUsers.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );

    if (!matchedUser) {
      matchedUser = {
        id: `google-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        email: cleanEmail,
        name: displayName,
        role: role,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
        createdAt: new Date().toISOString(),
        approvalStatus: 'pending',
      };
      StorageService.addUser(matchedUser);

      if (role === 'teacher') {
        StorageService.updateTeacherProfile({
          userId: matchedUser.id,
          teacherId: `T-${Math.floor(100 + Math.random() * 900)}`,
          schoolName: 'โรงเรียนสาธิตวิทยาการศึกษา',
          subjectTaught: 'เทคโนโลยี (วิทยาการคำนวณ) ม.1',
          classesManaged: ['ม.1/1', 'ม.1/2'],
        });
      } else {
        StorageService.updateStudentProfile({
          userId: matchedUser.id,
          studentId: '6701' + Math.floor(100 + Math.random() * 900),
          gradeLevel: 'ม.1',
          classroom: 'ม.1/1',
          seatNumber: 10,
          xp: 150,
          level: 1,
          totalCompletedLessons: 0,
        });
      }
    }

    // Check approval status
    if (matchedUser.role !== 'admin') {
      if (matchedUser.approvalStatus === 'pending') {
        if (matchedUser.role === 'teacher') {
          setErrorMsg('⏳ บัญชีครูผู้สอนนี้กำลังรอการอนุมัติจากผู้ดูแลระบบ (Admin) จึงยังไม่สามารถเข้าสู่ระบบได้ในขณะนี้');
        } else {
          setErrorMsg('⏳ บัญชีนักเรียนนี้กำลังรอคุณครูกดตอบรับเข้าห้องเรียน จึงยังไม่สามารถเข้าสู่ระบบได้ในขณะนี้');
        }
        return;
      }
      if (matchedUser.approvalStatus === 'rejected') {
        setErrorMsg('❌ บัญชีนี้ไม่ผ่านการอนุมัติ กรุณาติดต่อสถานศึกษาหรือผู้ดูแลระบบ');
        return;
      }
    }

    setSuccessMsg(`เข้าสู่ระบบด้วย Google สำเร็จ: ${matchedUser.name}`);
    setTimeout(() => {
      onAuthSuccess(matchedUser!);
      onClose();
    }, 450);
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsGoogleLoading(true);
    try {
      const res: any = await signInWithGoogle();
      if (res && res.success && res.firebaseUser) {
        const fbUser = res.firebaseUser;
        const email = fbUser.email || `google-user-${fbUser.uid.slice(0, 6)}@gmail.com`;
        const displayName = fbUser.displayName || 'ผู้ใช้งาน Google';
        handleGoogleAuthSuccess(email, displayName, mode === 'register' ? roleToRegister : loginRole);
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
          setErrorMsg('❌ การเข้าสู่ระบบด้วย Google ไม่สำเร็จ: แอปอยู่ในระหว่างทดสอบของ Google (Error 403: access_denied) กรุณาเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน');
        } else if (res.popupBlocked) {
          setErrorMsg('❌ เบราว์เซอร์บล็อกหน้าต่างป็อปอัปของ Google กรุณาอนุญาตป็อปอัป หรือเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน');
        } else if (res.cancelled) {
          setErrorMsg('หน้าต่างเข้าสู่ระบบ Google ถูกปิด กรุณาลองใหม่อีกครั้ง หรือเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน');
        } else {
          setErrorMsg(res.errorMessage || 'การเข้าสู่ระบบด้วย Google ไม่สำเร็จ');
        }
      }
    } catch (err: any) {
      console.warn('Google Sign In Warning:', err);
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sign-In กรุณาใช้อีเมลและรหัสผ่าน');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
    >
      <div
        id="auth-modal-card"
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white font-['Chakra_Petch']">
                {mode === 'login' ? 'เข้าสู่ระบบ Adventure M.1' : 'สมัครสมาชิกใหม่'}
              </h2>
              <p className="text-xs text-slate-400">ผจญภัย สนุกคิด พิชิตวิทยาการคำนวณ</p>
            </div>
          </div>
          <button
            id="auth-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-950/40 border-b border-slate-800 text-sm font-medium">
          <button
            id="tab-login-btn"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              mode === 'login'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>เข้าสู่ระบบ</span>
          </button>
          <button
            id="tab-register-btn"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              mode === 'register'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>สมัครสมาชิก</span>
          </button>
        </div>



        {/* Alerts */}
        {errorMsg && (
          <div
            id="auth-error-alert"
            className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div
            id="auth-success-alert"
            className="mx-6 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="p-6">
          {mode === 'login' ? (
            <div>
              {/* Method Selection */}
              <div className="flex items-center gap-2 mb-4 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <button
                  id="method-email-btn"
                  onClick={() => setLoginMethod('email')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 font-medium transition-colors ${
                    loginMethod === 'email'
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>วิธีที่ 1: เข้าด้วยอีเมล</span>
                </button>
                <button
                  id="method-id-btn"
                  onClick={() => setLoginMethod('id')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 font-medium transition-colors ${
                    loginMethod === 'id'
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <IdCard className="w-3.5 h-3.5 text-amber-400" />
                  <span>วิธีที่ 2: รหัสประจำตัว</span>
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {loginMethod === 'email' ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      อีเมล (Email)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                      <input
                        id="login-email-input"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="เช่น student@school.ac.th หรือครูผู้สอน"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-slate-300">
                        บทบาทและรหัสประจำตัว
                      </label>
                      <div className="flex items-center gap-2 text-xs">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="loginRole"
                            checked={loginRole === 'student'}
                            onChange={() => setLoginRole('student')}
                            className="text-amber-500 focus:ring-0"
                          />
                          <span className="text-slate-300">นักเรียน</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="loginRole"
                            checked={loginRole === 'teacher'}
                            onChange={() => setLoginRole('teacher')}
                            className="text-amber-500 focus:ring-0"
                          />
                          <span className="text-slate-300">ครูผู้สอน</span>
                        </label>
                      </div>
                    </div>
                    <div className="relative">
                      <IdCard className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                      <input
                        id="login-id-input"
                        type="text"
                        required
                        value={identifierId}
                        onChange={(e) => setIdentifierId(e.target.value)}
                        placeholder={
                          loginRole === 'student'
                            ? 'กรอกรหัสนักเรียน เช่น 6701001'
                            : 'กรอกรหัสครู เช่น TCH001'
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">รหัสผ่าน</label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-amber-400 hover:text-amber-300 hover:underline"
                    >
                      ลืมรหัสผ่าน?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                    <input
                      id="login-password-input"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านของคุณ"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 text-amber-500 focus:ring-0 bg-slate-950"
                    />
                    <span>จำการเข้าสู่ระบบ</span>
                  </label>
                </div>

                <button
                  id="submit-login-btn"
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md hover:scale-[1.01]"
                >
                  เข้าสู่ระบบ
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-2 text-slate-500 font-medium">หรือเข้าสู่ระบบด้วย</span>
                </div>
              </div>

              {/* Official Google Sign-In button */}
              <button
                id="google-signin-btn"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 font-medium rounded-xl border border-slate-300 shadow-sm transition-all hover:scale-[1.01] text-xs sm:text-sm disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  ></path>
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  ></path>
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  ></path>
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  ></path>
                </svg>
                <span>{isGoogleLoading ? 'กำลังเชื่อมต่อ Google...' : 'เข้าสู่ระบบด้วย Google'}</span>
              </button>
            </div>
          ) : (
            /* Register Mode */
            <div>
              {/* Role Selection for Registration */}
              <div className="flex items-center gap-2 mb-4 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <button
                  id="reg-role-student-btn"
                  onClick={() => setRoleToRegister('student')}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 font-semibold transition-colors ${
                    roleToRegister === 'student'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>สมัครสมาชิกนักเรียน</span>
                </button>
                <button
                  id="reg-role-teacher-btn"
                  onClick={() => setRoleToRegister('teacher')}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 font-semibold transition-colors ${
                    roleToRegister === 'teacher'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <School className="w-3.5 h-3.5" />
                  <span>สมัครสมาชิกครู</span>
                </button>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    ชื่อ-นามสกุล <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="reg-name-input"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="เช่น เด็กชายปภพ สุขใจ หรือ ครูสมศรี ปัญญาดี"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    อีเมล <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="reg-email-input"
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="yourname@school.ac.th"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      รหัสผ่าน <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="reg-pass-input"
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="อย่างน้อย 6 ตัวอักษร"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      ยืนยันรหัสผ่าน <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="reg-confirm-pass-input"
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="พิมพ์ซ้ำอีกครั้ง"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {roleToRegister === 'student' ? (
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          ระดับชั้น
                        </label>
                        <select
                          id="reg-grade-select"
                          value={gradeLevel}
                          onChange={(e) => setGradeLevel(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        >
                          <option value="ม.1">ม.1</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          ห้องเรียน
                        </label>
                        <input
                          id="reg-classroom-input"
                          type="text"
                          value={classroom}
                          onChange={(e) => setClassroom(e.target.value)}
                          placeholder="เช่น ม.1/1"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          เลขที่
                        </label>
                        <input
                          id="reg-seat-input"
                          type="number"
                          min="1"
                          max="60"
                          value={seatNumber}
                          onChange={(e) => setSeatNumber(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        รหัสนักเรียน <span className="text-rose-400">*</span>
                      </label>
                      <input
                        id="reg-studentid-input"
                        type="text"
                        required
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="เช่น 6701001"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                ) : (
                  /* Teacher inputs */
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          รหัสครู <span className="text-rose-400">*</span>
                        </label>
                        <input
                          id="reg-teacherid-input"
                          type="text"
                          required
                          value={teacherId}
                          onChange={(e) => setTeacherId(e.target.value)}
                          placeholder="เช่น TCH001"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          โรงเรียน
                        </label>
                        <input
                          id="reg-school-input"
                          type="text"
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          placeholder="ชื่อโรงเรียน"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        รายวิชาที่สอน
                      </label>
                      <input
                        id="reg-subject-input"
                        type="text"
                        value={subjectTaught}
                        onChange={(e) => setSubjectTaught(e.target.value)}
                        placeholder="เทคโนโลยี (วิทยาการคำนวณ) ม.1"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        เบอร์โทรศัพท์หรือช่องทางติดต่อ (ไม่บังคับ)
                      </label>
                      <input
                        id="reg-phone-input"
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="เช่น 081-234-5678"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}

                <button
                  id="submit-register-btn"
                  type="submit"
                  className="w-full mt-2 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md hover:scale-[1.01]"
                >
                  ลงทะเบียนและเริ่มเรียนรู้
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Forgot Password Modal Overlay */}
        {showForgotPassword && (
          <div className="absolute inset-0 bg-slate-950/95 p-6 flex flex-col justify-center items-center z-20 overflow-y-auto">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl text-left space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">ลืมรหัสผ่าน (กู้คืนบัญชี)</h3>
                    <p className="text-[11px] text-slate-400">ยืนยันอีเมลเพื่อตั้งรหัสผ่านใหม่</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setIsForgotEmailVerified(false);
                    setForgotMatchedUser(null);
                    setErrorMsg(null);
                  }}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!isForgotEmailVerified ? (
                /* Step 1: Input Email */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setErrorMsg(null);
                    if (!forgotEmail.trim()) {
                      setErrorMsg('กรุณากรอกอีเมลที่ลงทะเบียน');
                      return;
                    }
                    const found = StorageService.findUserByEmail(forgotEmail.trim());
                    if (!found) {
                      setErrorMsg('❌ ไม่พบที่อยู่อีเมลนี้ในระบบ กรุณาตรวจสอบอีเมลหรือสมัครสมาชิกใหม่');
                      return;
                    }
                    setForgotMatchedUser(found);
                    setIsForgotEmailVerified(true);
                    setSuccessMsg(`พบบัญชีผู้ใช้: ${found.name} (${found.role === 'teacher' ? 'คุณครู' : 'นักเรียน'})`);
                  }}
                  className="space-y-3"
                >
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200">
                    กรอกอีเมลที่ใช้สมัครหรือผูกไว้กับบัญชีของคุณ เพื่อยืนยันตัวตนในระบบ
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      อีเมลที่ลงทะเบียน *
                    </label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="เช่น kru.somsri@school.ac.th หรือ paphop.suk@school.ac.th"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setIsForgotEmailVerified(false);
                        setForgotMatchedUser(null);
                        setErrorMsg(null);
                      }}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs text-slate-300"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>ตรวจสอบอีเมล</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: Set New Password */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setErrorMsg(null);
                    if (!forgotNewPassword.trim()) {
                      setErrorMsg('กรุณากรอกรหัสผ่านใหม่');
                      return;
                    }
                    if (forgotNewPassword.length < 4) {
                      setErrorMsg('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
                      return;
                    }
                    if (forgotNewPassword !== forgotConfirmPassword) {
                      setErrorMsg('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
                      return;
                    }

                    const res = StorageService.resetPasswordByEmail(forgotEmail.trim(), forgotNewPassword);
                    if (res.success) {
                      setSuccessMsg(`🎉 ${res.message}`);
                      setPassword(forgotNewPassword);
                      setEmail(forgotEmail);
                      setTimeout(() => {
                        setShowForgotPassword(false);
                        setIsForgotEmailVerified(false);
                        setForgotMatchedUser(null);
                      }, 1200);
                    } else {
                      setErrorMsg(res.message);
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-200">
                    <span className="font-bold text-white block">ยืนยันอีเมลสำเร็จ!</span>
                    บัญชี: <strong>{forgotMatchedUser?.name}</strong> ({forgotMatchedUser?.role === 'teacher' ? 'คุณครู' : 'นักเรียน'})
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      รหัสผ่านใหม่ *
                    </label>
                    <input
                      type="password"
                      required
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="อย่างน้อย 4 ตัวอักษร"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      ยืนยันรหัสผ่านใหม่อีกครั้ง *
                    </label>
                    <input
                      type="password"
                      required
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsForgotEmailVerified(false)}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs text-slate-300"
                    >
                      ← เปลี่ยนอีเมล
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>บันทึกรหัสผ่านใหม่</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
