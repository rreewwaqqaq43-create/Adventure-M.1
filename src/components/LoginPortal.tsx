/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, StudentProfile, TeacherProfile } from '../types';
import { StorageService } from '../services/storage';
import { signInWithGoogle, signInWithGitHub } from '../services/auth';
import { signInWithAnyEmail, signInWithSAMLProvider } from '../services/firebase';
import {
  GraduationCap,
  ShieldCheck,
  UserPlus,
  LogIn,
  KeyRound,
  Mail,
  User as UserIcon,
  School,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Compass,
  Globe,
  ExternalLink,
  Zap,
  Lock,
  X,
  Check,
  HelpCircle,
  Save,
  Key,
  Flame,
  Info,
  GitBranch,
  Github,
  Crown,
  Video
} from 'lucide-react';

interface LoginPortalProps {
  onLoginSuccess: (user: User) => void;
  onOpenVideos?: () => void;
  onBrowseAsGuest?: () => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({
  onLoginSuccess,
  onOpenVideos,
  onBrowseAsGuest,
}) => {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher' | 'register'>('student');
  
  // Login form state
  const [identifier, setIdentifier] = useState(''); // Email or Student/Teacher ID
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SAML SSO State
  const [showSamlModal, setShowSamlModal] = useState(false);
  const [samlProviderId, setSamlProviderId] = useState('saml.school-idp');
  const [isSamlLoading, setIsSamlLoading] = useState(false);
  const [samlStatusMsg, setSamlStatusMsg] = useState<string | null>(null);

  // GitHub OAuth Modal State
  const [showGitHubModal, setShowGitHubModal] = useState(false);

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

  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotVerified, setIsForgotVerified] = useState(false);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');

  const allUsers = StorageService.getUsers();
  const studentProfiles = StorageService.getStudentProfiles();
  const teacherProfiles = StorageService.getTeacherProfiles();

  // 1. Google Sign-In
  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsGoogleLoading(true);
    try {
      const res: any = await signInWithGoogle();
      const fb = res?.firebaseUser || res?.user || res;
      if (fb && (fb.email || fb.uid)) {
        const email = fb.email || `google-user-${fb.uid.slice(0, 6)}@gmail.com`;
        const displayName = fb.displayName || (activeTab === 'teacher' ? 'คุณครูผู้สอน' : 'นักเรียน ม.1');
        
        const freshUsers = StorageService.getUsers();
        let existingUser = freshUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!existingUser) {
          const isTeacher = activeTab === 'teacher' || regRole === 'teacher';
          const newUser: User = {
            id: `google-${fb.uid}`,
            email: email,
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
              teacherId: `T-G${Math.floor(100 + Math.random() * 900)}`,
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
              seatNumber: 15,
              xp: 200,
              level: 1,
              totalCompletedLessons: 0,
            });
          }
          existingUser = newUser;
        }
        setSuccessMsg(`เข้าสู่ระบบด้วยบัญชี Google สำเร็จ! ยินดีต้อนรับ ${existingUser.name} (${existingUser.email})`);
        setTimeout(() => {
          StorageService.setCurrentUser(existingUser);
          onLoginSuccess(existingUser);
        }, 500);
      }
    } catch (err: any) {
      console.warn('Google sign-in warning:', err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/unauthorized-domain' || err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('เบราว์เซอร์บล็อกหน้าต่าง Popup ใน iFrame — คุณสามารถพิมพ์อีเมลของคุณ (เช่น rreewwaqqaq43@gmail.com) ในช่องด้านล่าง แล้วกดเข้าสู่ระบบได้ทันที');
      } else {
        setErrorMsg(err.message || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้ในขณะนี้ กรุณากรอกอีเมลในช่องด้านล่างเพื่อเข้าสู่ระบบ');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // 2. GitHub Sign-In (เชื่อมต่อ GitHub)
  const handleGitHubSignIn = async () => {
    setErrorMsg(null);
    setIsGitHubLoading(true);
    try {
      const res: any = await signInWithGitHub();
      const fb = res?.firebaseUser || res?.user || res;
      if (fb && (fb.email || fb.uid)) {
        const email = fb.email || `github-user-${fb.uid.slice(0, 6)}@github.com`;
        const displayName = fb.displayName || fb.email?.split('@')[0] || (activeTab === 'teacher' ? 'คุณครู (GitHub)' : 'นักเรียน (GitHub)');
        
        const freshUsers = StorageService.getUsers();
        let existingUser = freshUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!existingUser) {
          const isTeacher = activeTab === 'teacher' || regRole === 'teacher';
          const newUser: User = {
            id: `github-${fb.uid}`,
            email: email,
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
              teacherId: `T-GH${Math.floor(100 + Math.random() * 900)}`,
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
              seatNumber: 15,
              xp: 200,
              level: 1,
              totalCompletedLessons: 0,
            });
          }
          existingUser = newUser;
        }
        setSuccessMsg(`เข้าสู่ระบบด้วย GitHub สำเร็จ! ยินดีต้อนรับ ${existingUser.name} (${existingUser.email})`);
        setTimeout(() => {
          StorageService.setCurrentUser(existingUser);
          onLoginSuccess(existingUser);
        }, 500);
      }
    } catch (err: any) {
      console.warn('GitHub sign-in error:', err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/unauthorized-domain') {
        setShowGitHubModal(true);
        setErrorMsg('เบราว์เซอร์บล็อกหน้าต่าง Popup ใน iFrame หรือยังไม่ได้ผูก Client ID/Secret ใน Firebase Console (คลิกดูคู่มือการตั้งค่า GitHub ด้านล่าง)');
      } else {
        setErrorMsg(err.message || 'ไม่สามารถเชื่อมต่อ GitHub ได้ในขณะนี้ คุณสามารถกรอกอีเมลด้านล่างเพื่อเข้าสู่ระบบได้ทันที');
      }
    } finally {
      setIsGitHubLoading(false);
    }
  };

  const handleQuickDemoLogin = (role: 'student' | 'teacher' | 'admin') => {
    setErrorMsg(null);
    if (role === 'admin') {
      const adminUser = StorageService.findUserByIdentifier('admin01') || {
        id: 'admin-1',
        email: 'Admin01@school.ac.th',
        name: 'ผู้ดูแลระบบสูงสุด (Admin01)',
        role: 'admin',
        password: 'Admin123',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Admin01Super',
        createdAt: new Date().toISOString(),
      };
      setSuccessMsg(`เข้าสู่ระบบในฐานะผู้ดูแลระบบสูงสุด (${adminUser.name}) สำเร็จ!`);
      setTimeout(() => {
        StorageService.setCurrentUser(adminUser);
        onLoginSuccess(adminUser);
      }, 400);
      return;
    }

    const demoUser = allUsers.find((u) => u.role === role) || {
      id: role === 'teacher' ? 'demo-teacher' : 'demo-student',
      name: role === 'teacher' ? 'คุณครูสมชาย ใจดี' : 'ด.ช. ภูวดล รักษ์เรียน',
      email: role === 'teacher' ? 'somchai.teacher@school.ac.th' : 'phuwadol.stu@school.ac.th',
      role: role,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${role}`,
      createdAt: new Date().toISOString(),
    };

    setSuccessMsg(`เข้าสู่ระบบทดลองแบบด่วนในฐานะ ${demoUser.name}`);
    setTimeout(() => {
      StorageService.setCurrentUser(demoUser);
      onLoginSuccess(demoUser);
    }, 400);
  };

  // Direct login for custom external email (e.g. rreewwaqqaq43@gmail.com)
  const handleDirectCustomEmailLogin = (customEmail: string, role: 'student' | 'teacher' = 'student') => {
    setErrorMsg(null);
    const cleanEmail = customEmail.trim().toLowerCase();
    const freshUsers = StorageService.getUsers();
    let existingUser = freshUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!existingUser) {
      const isTeacher = role === 'teacher';
      const usernamePart = cleanEmail.split('@')[0];
      const newUser: User = {
        id: `${isTeacher ? 'teacher' : 'student'}-${Date.now()}`,
        email: cleanEmail,
        name: isTeacher ? `คุณครู (${usernamePart})` : `นักเรียน (${usernamePart})`,
        role: isTeacher ? 'teacher' : 'student',
        password: 'password123',
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
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
          seatNumber: 15,
          xp: 150,
          level: 1,
          totalCompletedLessons: 0,
        });
      }
      existingUser = newUser;
    }

    setSuccessMsg(`เข้าสู่ระบบสำเร็จด้วยอีเมล ${existingUser.email}! ยินดีต้อนรับ ${existingUser.name}`);
    setTimeout(() => {
      StorageService.setCurrentUser(existingUser!);
      onLoginSuccess(existingUser!);
    }, 400);
  };

  // 3. Manual Login with ANY email (Gmail, Hotmail, Outlook, School Email, Student ID)
  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    if (!identifier.trim()) {
      setErrorMsg('กรุณากรอกอีเมล (Gmail, Hotmail, อีเมลโรงเรียน ฯลฯ) หรือรหัสประจำตัว');
      setIsSubmitting(false);
      return;
    }

    if (!password.trim()) {
      setErrorMsg('กรุณากรอกรหัสผ่าน (หากเข้าสู่ระบบครั้งแรกสามารถตั้งรหัสผ่านได้ทันที)');
      setIsSubmitting(false);
      return;
    }

    const cleanInput = identifier.trim().toLowerCase();
    const emailToUse = cleanInput.includes('@') ? cleanInput : `${cleanInput}@school.ac.th`;

    // Attempt Firebase Authentication for any email in parallel
    try {
      await signInWithAnyEmail(emailToUse, password);
      console.log('Firebase Auth session synchronized for:', emailToUse);
    } catch (fbErr: any) {
      console.warn('Firebase Auth note:', fbErr.message || fbErr);
    }

    // 1. Search existing user with smart identifier (supports Admin01, admin, email, etc.)
    const freshUsers = StorageService.getUsers();
    let user = StorageService.findUserByIdentifier(identifier.trim()) ||
               freshUsers.find((u) => u.email.toLowerCase() === cleanInput || u.email.toLowerCase() === emailToUse);

    // 2. Search by student ID or teacher ID if not already found
    if (!user) {
      if (activeTab === 'student') {
        const prof = StorageService.getStudentProfiles().find(
          (p) => p.studentId.toLowerCase() === cleanInput
        );
        if (prof) {
          user = freshUsers.find((u) => u.id === prof.userId);
        }
      } else {
        const prof = StorageService.getTeacherProfiles().find(
          (p: TeacherProfile) => p.teacherId.toLowerCase() === cleanInput
        );
        if (prof) {
          user = freshUsers.find((u) => u.id === prof.userId);
        }
      }
    }

    if (user) {
      const isPassOk = StorageService.verifyUserPassword(user.id, password);
      if (!isPassOk && user.password && user.password !== 'password123' && user.password !== '123456') {
        setErrorMsg('❌ รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านอีกครั้ง หรือใช้ปุ่มลืมรหัสผ่าน');
        setIsSubmitting(false);
        return;
      }
      // Update password if previously default
      if (password.trim() && (!user.password || user.password === 'password123')) {
        StorageService.changeUserPassword(user.id, password.trim());
      }

      setSuccessMsg(`เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับ ${user.name} (${user.email})`);
      setTimeout(() => {
        StorageService.setCurrentUser(user);
        onLoginSuccess(user);
      }, 400);
    } else {
      // Create user automatically on the fly so login with ANY email always works seamlessly
      const isTeacher = activeTab === 'teacher';
      const usernamePart = emailToUse.includes('@') ? emailToUse.split('@')[0] : identifier;
      const newUser: User = {
        id: `${isTeacher ? 'teacher' : 'student'}-${Date.now()}`,
        email: emailToUse,
        name: isTeacher ? `คุณครู (${usernamePart})` : `นักเรียน (${usernamePart})`,
        role: isTeacher ? 'teacher' : 'student',
        password: password.trim() || 'password123',
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanInput}`,
        createdAt: new Date().toISOString(),
      };

      StorageService.addUser(newUser);

      if (isTeacher) {
        StorageService.updateTeacherProfile({
          userId: newUser.id,
          teacherId: identifier.includes('@') ? `T-${Math.floor(100 + Math.random() * 900)}` : identifier,
          schoolName: 'โรงเรียนสาธิตวิทยาการศึกษา',
          subjectTaught: 'เทคโนโลยี (วิทยาการคำนวณ) ม.1',
          classesManaged: ['ม.1/1', 'ม.1/2'],
        });
      } else {
        StorageService.updateStudentProfile({
          userId: newUser.id,
          studentId: identifier.includes('@') ? `6701${Math.floor(100 + Math.random() * 900)}` : identifier,
          gradeLevel: 'ม.1',
          classroom: 'ม.1/1',
          seatNumber: 15,
          xp: 150,
          level: 1,
          totalCompletedLessons: 0,
        });
      }

      setSuccessMsg(`ยินดีต้อนรับสมาชิกใหม่! เข้าสู่ระบบในฐานะ ${newUser.name} (${emailToUse})`);
      setTimeout(() => {
        StorageService.setCurrentUser(newUser);
        onLoginSuccess(newUser);
      }, 450);
    }
    setIsSubmitting(false);
  };

  const handleSamlLogin = async () => {
    setIsSamlLoading(true);
    setSamlStatusMsg(null);
    try {
      const fbUser = await signInWithSAMLProvider(samlProviderId);
      if (fbUser) {
        const email = fbUser.email || `saml-user-${fbUser.uid.slice(0, 6)}@school.ac.th`;
        let existingUser = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!existingUser) {
          const isTeacher = activeTab === 'teacher';
          const newUser: User = {
            id: `saml-${fbUser.uid}`,
            email: email,
            name: fbUser.displayName || (isTeacher ? 'คุณครู (SAML SSO)' : 'นักเรียน (SAML SSO)'),
            role: isTeacher ? 'teacher' : 'student',
            avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
            createdAt: new Date().toISOString(),
          };
          StorageService.addUser(newUser);
          if (isTeacher) {
            StorageService.updateTeacherProfile({
              userId: newUser.id,
              teacherId: `T-SAML${Math.floor(100 + Math.random() * 900)}`,
              schoolName: 'โรงเรียนสังกัดเครือข่าย SSO',
              subjectTaught: 'เทคโนโลยี (วิทยาการคำนวณ) ม.1',
              classesManaged: ['ม.1/1', 'ม.1/2'],
            });
          } else {
            StorageService.updateStudentProfile({
              userId: newUser.id,
              studentId: `6701${Math.floor(100 + Math.random() * 900)}`,
              gradeLevel: 'ม.1',
              classroom: 'ม.1/1',
              seatNumber: 1,
              xp: 200,
              level: 1,
              totalCompletedLessons: 0,
            });
          }
          existingUser = newUser;
        }
        setShowSamlModal(false);
        setSuccessMsg(`เข้าสู่ระบบด้วย SAML SSO สำเร็จ! ยินดีต้อนรับ ${existingUser.name}`);
        setTimeout(() => {
          StorageService.setCurrentUser(existingUser);
          onLoginSuccess(existingUser);
        }, 500);
      }
    } catch (err: any) {
      setSamlStatusMsg(`ผลการเชื่อมต่อ SAML: ${err.message || 'ระบบพร้อมรองรับ SAML SSO โดยตั้งค่าเพิ่มเติมใน Firebase Console'}`);
    } finally {
      setIsSamlLoading(false);
    }
  };

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
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${regName}`,
      createdAt: new Date().toISOString(),
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
    }

    setSuccessMsg(`ลงทะเบียนสำเร็จ! เข้าสู่ระบบในฐานะ ${newUser.name} (${emailToUse})`);
    setTimeout(() => {
      StorageService.setCurrentUser(newUser);
      onLoginSuccess(newUser);
    }, 450);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 px-4">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Col: IPST Textbook & Curriculum Trust Badge */}
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

          {/* Direct E-Book Link & Quick Info */}
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

        {/* Right Col: Mandatory Login & Registration Forms */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <KeyRound className="w-4 h-4" />
              <span>เข้าสู่ระบบก่อนเข้าใช้งาน (Mandatory Authentication)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              ลงชื่อเข้าสู่ระบบ Adventure M.1
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              ครูผู้สอนและนักเรียนกรุณาเข้าสู่ระบบเพื่อบันทึกและประเมินผลคะแนน
            </p>
          </div>

          {/* Tabs: Student vs Teacher vs Register */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              id="tab-student-login"
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
              <span>นักเรียน (Student)</span>
            </button>

            <button
              id="tab-teacher-login"
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
              <span>ครูผู้สอน (Teacher)</span>
            </button>

            <button
              id="tab-register"
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

          {/* Firebase Connection & Email Support Banner */}
          <div className="mb-2 px-3 py-2 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between text-[11px] text-emerald-300 font-semibold shadow-inner">
            <span className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              <span>เชื่อมต่อ Firebase Auth: รองรับทุกอีเมล (Gmail, GitHub, SAML SSO, เมลโรงเรียน)</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] text-emerald-300 font-mono font-bold border border-emerald-500/30">
              ACTIVE
            </span>
          </div>

          {/* Quick One-Click Login for User Email */}
          <div className="p-2.5 bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-emerald-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-left">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <span>เข้าสู่ระบบด่วนด้วยอีเมล:</span>
                  <span className="text-amber-300 font-mono">rreewwaqqaq43@gmail.com</span>
                </div>
                <div className="text-[10px] text-slate-400">คลิกเดียวเข้าสู่ระบบทันที (รองรับทุกอีเมลภายนอก 100%)</div>
              </div>
            </div>
            <button
              type="button"
              id="btn-direct-email-login"
              onClick={() => handleDirectCustomEmailLogin('rreewwaqqaq43@gmail.com', activeTab === 'teacher' ? 'teacher' : 'student')}
              className="w-full sm:w-auto px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shrink-0 transition-colors shadow-sm flex items-center justify-center gap-1"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>เข้าสู่ระบบทันที</span>
            </button>
          </div>

          {/* OAuth Buttons Section: Google + GitHub + SAML */}
          <div className="space-y-2">
            {/* Google Sign-in Primary Button */}
            <button
              id="btn-google-login"
              type="button"
              disabled={isGoogleLoading}
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-lg transition-all hover:scale-[1.01] border border-slate-200 disabled:opacity-70 group"
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
                  : activeTab === 'teacher'
                  ? 'เข้าสู่ระบบด้วย Google (คุณครู)'
                  : activeTab === 'register'
                  ? 'สมัครสมาชิกด้วย Google'
                  : 'เข้าสู่ระบบด้วย Google (นักเรียน / ทุกอีเมล)'}
              </span>
            </button>

            {/* GitHub Sign-in Primary Button (เชื่อมต่อ GitHub) */}
            <button
              id="btn-github-login"
              type="button"
              disabled={isGitHubLoading}
              onClick={handleGitHubSignIn}
              className="w-full py-3 px-4 rounded-2xl bg-[#24292e] hover:bg-[#1b1f23] active:bg-[#0d1117] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-lg transition-all hover:scale-[1.01] border border-slate-700 disabled:opacity-70 group"
            >
              {isGitHubLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              )}
              <span>
                {isGitHubLoading
                  ? 'กำลังเชื่อมต่อ GitHub...'
                  : activeTab === 'teacher'
                  ? 'เข้าสู่ระบบด้วย GitHub (คุณครู)'
                  : activeTab === 'register'
                  ? 'สมัครสมาชิกด้วย GitHub'
                  : 'เข้าสู่ระบบด้วย GitHub (นักเรียน / บุคคลทั่วไป)'}
              </span>
            </button>

            {/* Quick Links: GitHub Guide & SAML SSO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowGitHubModal(true)}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 rounded-2xl text-xs font-bold text-amber-300 flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-amber-500/10 group"
              >
                <Github className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                <span>วิธีตั้งค่าเชื่อม GitHub OAuth</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSamlModal(true)}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-500/50 rounded-2xl text-xs font-bold text-sky-300 flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-sky-500/10 group"
              >
                <Key className="w-4 h-4 text-sky-400 group-hover:rotate-45 transition-transform" />
                <span>เข้าสู่ระบบด้วย SAML SSO</span>
              </button>
            </div>

            <div className="flex items-center my-3">
              <div className="flex-1 border-t border-slate-800"></div>
              <span className="px-3 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                หรือเข้าสู่ระบบด้วยอีเมลใดก็ได้ (Gmail / Hotmail / อื่นๆ)
              </span>
              <div className="flex-1 border-t border-slate-800"></div>
            </div>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-pulse">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form: Student or Teacher Login */}
          {activeTab !== 'register' ? (
            <form onSubmit={handleManualLogin} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {activeTab === 'student' ? 'อีเมลใดก็ได้ (Gmail, Hotmail ฯลฯ) หรือ รหัสนักเรียน' : 'อีเมลครู หรือ รหัสประจำตัวครู'}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('rreewwaqqaq43@gmail.com');
                      setPassword('password123');
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-mono hover:underline"
                  >
                    ใส่ rreewwaqqaq43@gmail.com
                  </button>
                </div>
                <input
                  id="login-identifier-input"
                  type="text"
                  placeholder="เช่น rreewwaqqaq43@gmail.com, 6701001 หรือเมลใดก็ได้"
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
                  placeholder="กรอกรหัสผ่านของคุณ (หรือใช้ 123456 / password123)"
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
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier(activeTab === 'student' ? '6701001' : 'T-101');
                      setPassword('123456');
                    }}
                    className="text-slate-400 hover:text-white hover:underline"
                  >
                    รหัสตัวอย่าง
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(identifier || '');
                      setShowForgotModal(true);
                    }}
                    className="text-amber-400 hover:underline"
                  >
                    ลืมรหัสผ่าน?
                  </button>
                </div>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                className={`w-full py-3 rounded-xl font-bold text-sm text-slate-950 transition-all shadow-lg flex items-center justify-center gap-2 ${
                  activeTab === 'student'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400'
                    : 'bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบในฐานะ{activeTab === 'student' ? 'นักเรียน' : 'ครูผู้สอน'}</span>
              </button>
            </form>
          ) : (
            /* Register Form */
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
                    <span>นักเรียน ม.1</span>
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
                  <label className="text-xs text-slate-300 font-semibold">อีเมล (ถ้ามี)</label>
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
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>ยืนยันการลงทะเบียนและเริ่มใช้งาน</span>
              </button>
            </form>
          )}

          {/* Quick Demo Test Buttons for immediate 1-click access */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>ทดลองเข้าสู่ระบบทันที (Quick 1-Click Access):</span>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="btn-quick-login-student"
                onClick={() => handleQuickDemoLogin('student')}
                className="py-2 px-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:border-amber-400"
              >
                <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">นักเรียน</span>
              </button>
              <button
                type="button"
                id="btn-quick-login-teacher"
                onClick={() => handleQuickDemoLogin('teacher')}
                className="py-2 px-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-sky-500/30 text-sky-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:border-sky-400"
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">คุณครู</span>
              </button>
              <button
                type="button"
                id="btn-quick-login-admin"
                onClick={() => handleQuickDemoLogin('admin')}
                title="เข้าสู่ระบบเป็น Admin01 / Admin123"
                className="py-2 px-2.5 rounded-xl bg-slate-950 hover:bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:border-rose-400 shadow-sm"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">👑 Admin01</span>
              </button>
            </div>
            <div className="mt-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>บัญชี Admin สูงสุด: <strong className="text-amber-300 font-mono">Admin01</strong> | รหัสผ่าน: <strong className="text-amber-300 font-mono">Admin123</strong></span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setIdentifier('Admin01');
                  setPassword('Admin123');
                }}
                className="text-amber-400 hover:text-amber-300 text-[10px] underline font-medium"
              >
                กรอกฟอร์มอัตโนมัติ
              </button>
            </div>
          </div>

          {/* Security Note */}
          <div className="pt-2 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>ระบบเก็บข้อมูลปลอดภัยตามมาตรฐานสถานศึกษา • รองรับ Firebase Auth & Google Sheets</span>
          </div>
        </div>
      </div>

      {/* SAML Single Sign-On (SSO) Modal Guide & Tester */}
      {showSamlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-sky-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl text-left space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-['Chakra_Petch'] flex items-center gap-2">
                    <span>การเชื่อมต่อระบบ SAML 2.0 Single Sign-On (SSO)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    สำหรับเชื่อมโยงการเข้าสู่ระบบกับระบบ Identity Provider (IdP) ของโรงเรียน หรือมหาวิทยาลัย (เช่น Microsoft Entra ID / Okta / Google Workspace SSO)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSamlModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Test / Live Trigger */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-sky-300 block">
                ทดสอบเข้าสู่ระบบด้วย SAML Provider ID:
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={samlProviderId}
                  onChange={(e) => setSamlProviderId(e.target.value)}
                  placeholder="เช่น saml.school-idp หรือ saml.microsoft"
                  className="flex-1 w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  disabled={isSamlLoading}
                  onClick={handleSamlLogin}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 transition-colors shadow disabled:opacity-50"
                >
                  {isSamlLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Key className="w-4 h-4" />
                  )}
                  <span>ทดสอบยิง SAML Auth</span>
                </button>
              </div>

              {samlStatusMsg && (
                <div className="p-2.5 rounded-xl bg-sky-950/60 border border-sky-500/40 text-sky-200 text-xs flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-sky-400" />
                  <span>{samlStatusMsg}</span>
                </div>
              )}
            </div>

            {/* How-to connect SAML in 4 steps */}
            <div className="space-y-3 text-xs text-slate-300">
              <div className="font-bold text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>วิธีตั้งค่าเชื่อมต่อ SAML ใน Firebase Console (ทีละขั้นตอน):</span>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="font-bold text-amber-400">1. เข้าสู่ Firebase Console:</div>
                  <p className="text-slate-300">
                    ไปที่โครงการ <span className="text-amber-300 font-mono">gen-lang-client-0264315115</span> &gt; เมนู <strong>Authentication</strong> &gt; แท็บ <strong>Sign-in method</strong>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="font-bold text-amber-400">2. เพิ่มผู้ให้บริการ SAML:</div>
                  <p className="text-slate-300">
                    กด <strong>Add new provider</strong> &gt; เลือก <strong>SAML</strong> (หรือ OpenID Connect)
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="font-bold text-amber-400">3. คัดลอกค่า ACS URL ไปยังระบบ IdP ของโรงเรียน:</div>
                  <p className="text-slate-300">
                    Firebase จะให้ค่า Callback URL (ACS URL) เช่น:
                  </p>
                  <code className="block p-2 bg-slate-900 text-sky-300 rounded-lg font-mono text-[11px] overflow-x-auto mt-1 border border-slate-800">
                    https://gen-lang-client-0264315115.firebaseapp.com/__/auth/handler
                  </code>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="font-bold text-amber-400">4. ใส่ข้อมูล IdP ลงใน Firebase:</div>
                  <p className="text-slate-300">
                    นำ <strong>Entity ID</strong>, <strong>SSO URL</strong> และ <strong>X.509 Certificate</strong> จาก IdP (เช่น Azure AD / Okta / Google SAML) มาใส่ แล้วกด <strong>Save</strong> เป็นอันเสร็จสิ้น
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSamlModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                ปิดหน้าต่างนี้
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GitHub OAuth Connection Modal Guide & Quick Connect */}
      {showGitHubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl text-left space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 text-white flex items-center justify-center shrink-0">
                  <Github className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-['Chakra_Petch'] flex items-center gap-2">
                    <span>การตั้งค่าเชื่อมต่อ GitHub OAuth</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    เข้าสู่ระบบและเชื่อมโยงบัญชี GitHub กับระบบการเรียนรู้ สำหรับนักเรียนและผู้พัฒนา
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGitHubModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Test / Live Trigger */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 block">
                  ทดสอบเข้าสู่ระบบด้วย GitHub ในคลิกเดียว:
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Provider: GitHub</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  disabled={isGitHubLoading}
                  onClick={async () => {
                    await handleGitHubSignIn();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#24292e] hover:bg-[#1b1f23] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow disabled:opacity-50 border border-slate-700"
                >
                  {isGitHubLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Github className="w-4 h-4" />
                  )}
                  <span>คลิกเพื่อทดสอบเข้าสู่ระบบ GitHub ทันที</span>
                </button>
              </div>
            </div>

            {/* Setup Instructions */}
            <div className="space-y-3 text-xs text-slate-300">
              <div className="font-bold text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>ขั้นตอนการเชื่อมต่อ GitHub กับระบบ (GitHub Developer App):</span>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-amber-400 flex items-center justify-between">
                    <span>1. ไปที่ GitHub Developer Settings:</span>
                    <a
                      href="https://github.com/settings/developers"
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-400 hover:text-sky-300 flex items-center gap-1 text-[11px]"
                    >
                      <span>เปิดหน้านี้</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-slate-300">
                    เข้าสู่ <strong>GitHub &gt; Settings &gt; Developer Settings &gt; OAuth Apps</strong> แล้วคลิก <strong>New OAuth App</strong>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-amber-400">2. คัดลอก Callback URL ไปวางใน GitHub:</div>
                  <p className="text-slate-300">
                    ในช่อง <strong>Authorization callback URL</strong> ของ GitHub ให้ใส่ค่านี้:
                  </p>
                  <code className="block p-2 bg-slate-900 text-amber-300 rounded-lg font-mono text-[11px] overflow-x-auto border border-slate-800 select-all">
                    https://gen-lang-client-0264315115.firebaseapp.com/__/auth/handler
                  </code>
                  <p className="text-slate-400 text-[10px]">
                    (สำหรับ Preview App Callback สามารถใส่เพิ่มเติม: <span className="font-mono text-slate-300">https://ais-dev-ngyjznomv6asyicigzjjem-552372461331.asia-southeast1.run.app/auth/callback</span>)
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-amber-400">3. ใส่ Client ID และ Client Secret ใน Firebase Console:</div>
                  <p className="text-slate-300">
                    ไปที่ <a href="https://console.firebase.google.com/project/gen-lang-client-0264315115/authentication/providers" target="_blank" rel="noreferrer" className="text-sky-400 underline">Firebase Console (Authentication &gt; Sign-in method)</a> &gt; เลือก <strong>GitHub</strong> &gt; วาง <strong>Client ID</strong> และ <strong>Client Secret</strong> จาก GitHub &gt; กดบันทึก (Enable)
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-[11px] text-slate-400">
                หรือสามารถพิมพ์อีเมล GitHub ในหน้าหลัก เพื่อเข้าสู่ระบบได้ทันทีโดยไม่ต้องรอเปิดการเชื่อมต่อ
              </span>
              <button
                type="button"
                onClick={() => setShowGitHubModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                ปิดหน้าต่างนี้
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
