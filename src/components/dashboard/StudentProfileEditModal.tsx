/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { User, StudentProfile } from '../../types';
import { StorageService } from '../../services/storage';
import {
  X,
  User as UserIcon,
  Lock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  School,
  IdCard,
  Hash,
  Image as ImageIcon,
  Save,
  ShieldAlert,
  Upload,
  Camera,
  Trash2,
  Check,
  KeyRound,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';

interface StudentProfileEditModalProps {
  isOpen: boolean;
  user: User;
  studentProfile: StudentProfile | null;
  onClose: () => void;
  onProfileUpdated: () => void;
}

const AVATAR_PRESETS = [
  { id: 'bot-1', name: 'หุ่นยนต์นักประดิษฐ์', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=AdventureM1' },
  { id: 'bot-2', name: 'จอมเวทโค้ด', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ScratchMage' },
  { id: 'bot-3', name: 'นักบินอวกาศไซเบอร์', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberAstro' },
  { id: 'bot-4', name: 'นักสืบข้อมูล', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=DataDetective' },
  { id: 'bot-5', name: 'แมวเหมียวแฮกเกอร์', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberCat' },
  { id: 'bot-6', name: 'จิ้งจอกผจญภัย', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=FoxExplorer' },
  { id: 'bot-7', name: 'สิงโตอัลกอริทึม', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=AlgoLion' },
  { id: 'bot-8', name: 'หมีนักเขียนโปรแกรม', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CoderBear' },
  { id: 'av-1', name: 'นักเรียนแว่นสายวิทย์', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix' },
  { id: 'av-2', name: 'นักเรียนสายลุย', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Bella' },
  { id: 'av-3', name: 'นักคิดสายตรรกะ', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Charlie' },
  { id: 'av-4', name: 'ผู้พิทักษ์เน็ตเวิร์ก', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe' },
];

const CLASSROOM_OPTIONS = [
  'ม.1/1',
  'ม.1/2',
  'ม.1/3',
  'ม.1/4',
  'ม.1/5',
  'ม.1/6',
  'ม.1/7',
  'ม.1/8',
  'ม.1/9',
  'ม.1/10',
];

export const StudentProfileEditModal: React.FC<StudentProfileEditModalProps> = ({
  isOpen,
  user,
  studentProfile,
  onClose,
  onProfileUpdated,
}) => {
  if (!isOpen) return null;

  // Active Tab: 'profile' or 'password'
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // The permanent student ID from database (IMMUTABLE)
  const lockedStudentId = studentProfile?.studentId || 'STD-M1-UNKNOWN';

  // Profile fields (always preserved)
  const [name, setName] = useState<string>(user.name || '');
  const [classroom, setClassroom] = useState<string>(studentProfile?.classroom || 'ม.1/1');
  const [seatNumber, setSeatNumber] = useState<number>(studentProfile?.seatNumber || 1);
  const [gradeLevel, setGradeLevel] = useState<string>(studentProfile?.gradeLevel || 'ม.1');
  const [avatarUrl, setAvatarUrl] = useState<string>(
    user.avatarUrl || AVATAR_PRESETS[0].url
  );
  const [customAvatarInput, setCustomAvatarInput] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password Management States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Forgot password sub-flow inside modal
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmailInput, setForgotEmailInput] = useState(user.email || '');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Client-side image upload and square-crop compression for fast storage
  const processAndResizeImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (PNG, JPG, WebP, GIF)');
      return;
    }

    setIsProcessingImage(true);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const size = 256;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setIsProcessingImage(false);
            return;
          }

          // Center crop to a perfect square avatar
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

          setAvatarUrl(dataUrl);
          setCustomAvatarInput('');
          setIsProcessingImage(false);
          setSuccessMsg('อัปโหลดรูปภาพสำเร็จแล้ว! ระบบจะคงข้อมูลโปรไฟล์เดิมไว้ทั้งหมด');
          setTimeout(() => setSuccessMsg(null), 3500);
        } catch (e: any) {
          setErrorMsg('ไม่สามารถปรับขนาดรูปภาพได้');
          setIsProcessingImage(false);
        }
      };
      img.onerror = () => {
        setErrorMsg('ไม่สามารถอ่านไฟล์รูปภาพได้');
        setIsProcessingImage(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setErrorMsg('เกิดข้อผิดพลาดในการโหลดไฟล์รูปภาพ');
      setIsProcessingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndResizeImage(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAndResizeImage(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // 1. Profile Save Handler (Strictly preserves all stats and IDs)
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('กรุณากรอกชื่อ-นามสกุลของนักเรียน');
      return;
    }

    if (!seatNumber || seatNumber < 1 || seatNumber > 99) {
      setErrorMsg('กรุณากรอกเลขที่ให้ถูกต้อง (ระหว่าง 1 ถึง 99)');
      return;
    }

    setIsSaving(true);

    try {
      const finalAvatar = customAvatarInput.trim() || avatarUrl;

      // Update User record (preserving password, role, id, email)
      const updatedUser: User = {
        ...user,
        name: name.trim(),
        avatarUrl: finalAvatar,
      };
      StorageService.updateUser(updatedUser);
      StorageService.setCurrentUser(updatedUser);

      // Update StudentProfile record (preserving XP, level, totalCompletedLessons, etc.)
      const existingProfile = StorageService.getStudentProfile(user.id) || studentProfile;
      const updatedStudentProfile: StudentProfile = {
        userId: user.id,
        studentId: lockedStudentId,
        gradeLevel: gradeLevel.trim() || 'ม.1',
        classroom: classroom.trim() || 'ม.1/1',
        seatNumber: Number(seatNumber) || 1,
        xp: existingProfile?.xp ?? 0,
        level: existingProfile?.level ?? 1,
        totalCompletedLessons: existingProfile?.totalCompletedLessons ?? 0,
      };
      StorageService.updateStudentProfile(updatedStudentProfile);

      setSuccessMsg('บันทึกข้อมูลโปรไฟล์นักเรียนและรูปภาพสำเร็จเรียบร้อย!');
      onProfileUpdated();

      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
      setIsSaving(false);
    }
  };

  // 2. Change Password with Current Password Verification
  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentPassword.trim()) {
      setErrorMsg('กรุณากรอกรหัสผ่านเดิมก่อน เพื่อความปลอดภัยของบัญชี');
      return;
    }

    if (!newPassword.trim()) {
      setErrorMsg('กรุณากรอกรหัสผ่านใหม่ที่ต้องการตั้ง');
      return;
    }

    if (newPassword.length < 4) {
      setErrorMsg('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    // Verify current password against StorageService
    const isOldPassCorrect = StorageService.verifyUserPassword(user.id, currentPassword);
    if (!isOldPassCorrect) {
      setErrorMsg('❌ รหัสผ่านเดิมไม่ถูกต้อง! หากจำรหัสผ่านไม่ได้ กรุณากด "ลืมรหัสผ่านเดิม" ด้านล่างเพื่อยืนยันผ่านอีเมล');
      return;
    }

    // Change password
    const success = StorageService.changeUserPassword(user.id, newPassword);
    if (success) {
      setSuccessMsg('✅ เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว! ข้อมูลรหัสผ่านใหม่ถูกบันทึกแล้ว');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onProfileUpdated();
        onClose();
      }, 1200);
    } else {
      setErrorMsg('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
    }
  };

  // 3. Forgot Password / Verify Email in Modal
  const handleVerifyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!forgotEmailInput.trim()) {
      setErrorMsg('กรุณากรอกอีเมลที่ใช้ลงทะเบียนในระบบ');
      return;
    }

    // Check against system users
    const foundUser = StorageService.findUserByEmail(forgotEmailInput.trim());
    if (!foundUser) {
      setErrorMsg('❌ ไม่พบที่อยู่อีเมลนี้ในระบบ กรุณาตรวจสอบอีเมลให้ถูกต้อง');
      return;
    }

    if (foundUser.id !== user.id && foundUser.email.toLowerCase() !== user.email.toLowerCase()) {
      setErrorMsg('❌ อีเมลนี้ไม่ตรงกับบัญชีปัจจุบันของคุณ กรุณาใช้อีเมลที่ตรงกับบัญชีนี้');
      return;
    }

    setIsEmailVerified(true);
    setSuccessMsg(`ยืนยันอีเมลสำเร็จ! บัญชี: ${foundUser.name} (${foundUser.email}) กรุณาตั้งรหัสผ่านใหม่ด้านล่าง`);
  };

  const handleResetPasswordViaEmail = (e: React.FormEvent) => {
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

    const res = StorageService.resetPasswordByEmail(forgotEmailInput.trim(), forgotNewPassword);
    if (res.success) {
      setSuccessMsg(`🎉 ${res.message}`);
      setTimeout(() => {
        onProfileUpdated();
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.message);
    }
  };

  const currentDisplayedAvatar = customAvatarInput.trim() || avatarUrl;

  return (
    <div
      id="profile-edit-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="profile-edit-modal-card"
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl text-slate-100 overflow-hidden my-6 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-lg sm:text-xl text-white font-['Chakra_Petch'] leading-tight">
                โปรไฟล์นักเรียน & ความปลอดภัย
              </h2>
              <p className="text-xs text-slate-400">
                รหัสนักเรียน: <span className="font-mono text-amber-400 font-bold">{lockedStudentId}</span> • อีเมล: {user.email}
              </p>
            </div>
          </div>

          <button
            id="profile-edit-close-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-900 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              setErrorMsg(null);
            }}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'profile'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>ข้อมูลทั่วไป & รูปภาพโปรไฟล์</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('password');
              setErrorMsg(null);
            }}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'password'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>เปลี่ยนรหัสผ่าน (ความปลอดภัย)</span>
          </button>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Alerts */}
          {successMsg && (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fade-in">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-2xl text-rose-300 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 1: Profile & Avatar                                       */}
          {/* ============================================================== */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              {/* SECTION: Image Upload & Presets */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-indigo-400" />
                    รูปภาพประจำตัว (Avatar & Photo)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    อัปโหลดรูปจริง หรือเลือกตัวละคร
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Current Avatar Preview */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-xl">
                      <img
                        src={currentDisplayedAvatar}
                        alt="Preview"
                        className="w-full h-full rounded-xl object-cover bg-slate-800"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-slate-950/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-xs"
                      title="คลิกเพื่ออัปโหลดรูปถ่าย"
                    >
                      <Upload className="w-5 h-5 text-indigo-400 mb-1" />
                      <span className="text-[10px] font-bold">อัปโหลด</span>
                    </button>
                  </div>

                  {/* Upload Drop Zone */}
                  <div className="flex-1 w-full space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 rounded-xl border border-dashed border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors cursor-pointer text-center space-y-1"
                    >
                      <div className="flex items-center justify-center gap-2 text-xs font-bold text-indigo-300">
                        <Upload className="w-4 h-4" />
                        <span>{isProcessingImage ? 'กำลังประมวลผลรูปภาพ...' : 'คลิกเพื่อเลือกไฟล์ หรือ ลากรูปภาพมาวางที่นี่'}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        ระบบจะคงข้อมูลสถิติ XP, เลเวล และคะแนนสะสมไว้ครบถ้วน
                      </p>
                    </div>

                    {/* URL Link Input */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <ImageIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="url"
                          value={customAvatarInput}
                          onChange={(e) => setCustomAvatarInput(e.target.value)}
                          placeholder="หรือวาง URL ลิงก์รูปภาพ..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                      {customAvatarInput && (
                        <button
                          type="button"
                          onClick={() => setCustomAvatarInput('')}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Avatar Presets Grid */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    หรือเลือกตัวละครฮีโร่สำเร็จรูป:
                  </span>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {AVATAR_PRESETS.map((preset) => {
                      const isSelected = avatarUrl === preset.url && !customAvatarInput.trim();
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setAvatarUrl(preset.url);
                            setCustomAvatarInput('');
                          }}
                          className={`p-1.5 rounded-xl border transition-all flex flex-col items-center gap-1 group relative ${
                            isSelected
                              ? 'bg-indigo-500/20 border-indigo-400 ring-2 ring-indigo-400/50 scale-105'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                          }`}
                          title={preset.name}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-9 h-9 rounded-lg object-cover"
                          />
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Student Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Locked Student ID */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <IdCard className="w-3.5 h-3.5 text-amber-400" />
                    <span>รหัสนักเรียน (Student ID - ไม่สามารถแก้ไขได้)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled
                      value={lockedStudentId}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-400 font-mono font-bold cursor-not-allowed pr-9 select-all"
                    />
                    <Lock className="w-3.5 h-3.5 text-amber-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Student Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>ชื่อ - นามสกุล นักเรียน *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="เช่น เด็กชายปภพ สุขใจ"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                  />
                </div>

                {/* Classroom */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-indigo-400" />
                    <span>ห้องเรียน (Classroom)</span>
                  </label>
                  <select
                    value={classroom}
                    onChange={(e) => setClassroom(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-400"
                  >
                    {CLASSROOM_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Seat Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-indigo-400" />
                    <span>เลขที่ (Seat Number)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={seatNumber}
                    onChange={(e) => setSeatNumber(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-transform hover:scale-105 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลโปรไฟล์'}</span>
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* TAB 2: Password & Security                                    */}
          {/* ============================================================== */}
          {activeTab === 'password' && (
            <div className="space-y-5">
              {!isForgotMode ? (
                /* Mode A: Normal Password Change with Old Password */
                <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-slate-300 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block mb-0.5">การรักษาความปลอดภัยของบัญชี:</span>
                      ตามระเบียบความปลอดภัย คุณจำเป็นต้องกรอก <strong>รหัสผ่านเดิม</strong> ก่อนทำการตั้งรหัสผ่านใหม่
                    </div>
                  </div>

                  {/* Current Password Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>รหัสผ่านเดิม (Current Password) *</span>
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="กรอกรหัสผ่านเดิมของคุณ (เช่น password123)"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 pr-10 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                      <span>รหัสผ่านใหม่ (New Password) *</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="อย่างน้อย 4 ตัวอักษร"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 pr-10 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ยืนยันรหัสผ่านใหม่ (Confirm Password) *</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 pr-10 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Forgot Password Trigger Button */}
                  <div className="pt-1 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotMode(true);
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs text-amber-400 hover:text-amber-300 underline font-semibold flex items-center gap-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>ลืมรหัสผ่านเดิม? ยืนยันผ่านอีเมลเพื่อตั้งรหัสใหม่</span>
                    </button>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>ยืนยันการเปลี่ยนรหัสผ่าน</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Mode B: Forgot Password / Email Verification Flow */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-0.5">กู้คืนรหัสผ่านด้วยการยืนยันอีเมล:</span>
                      ระบบจะตรวจสอบที่อยู่อีเมลของคุณในฐานข้อมูล หากตรงกับบัญชีที่มีอยู่ จะอนุญาตให้ตั้งรหัสผ่านใหม่ได้ทันที
                    </div>
                  </div>

                  {!isEmailVerified ? (
                    <form onSubmit={handleVerifyEmail} className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-amber-400" />
                          <span>ระบุอีเมลที่ผูกกับบัญชีนี้ (Registered Email) *</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={forgotEmailInput}
                          onChange={(e) => setForgotEmailInput(e.target.value)}
                          placeholder="เช่น paphop.suk@school.ac.th"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsForgotMode(false);
                            setIsEmailVerified(false);
                            setErrorMsg(null);
                          }}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          ← กลับไปหน้ารหัสผ่านปกติ
                        </button>

                        <button
                          type="submit"
                          className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg"
                        >
                          <Check className="w-4 h-4" />
                          <span>ตรวจสอบและยืนยันอีเมล</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPasswordViaEmail} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                          <span>ตั้งรหัสผ่านใหม่ (New Password) *</span>
                        </label>
                        <input
                          type="password"
                          required
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          placeholder="อย่างน้อย 4 ตัวอักษร"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>ยืนยันรหัสผ่านใหม่อีกครั้ง *</span>
                        </label>
                        <input
                          type="password"
                          required
                          value={forgotConfirmPassword}
                          onChange={(e) => setForgotConfirmPassword(e.target.value)}
                          placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsForgotMode(false);
                            setIsEmailVerified(false);
                            setErrorMsg(null);
                          }}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          ← ยกเลิก
                        </button>

                        <button
                          type="submit"
                          className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg"
                        >
                          <Save className="w-4 h-4" />
                          <span>บันทึกรหัสผ่านใหม่</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
