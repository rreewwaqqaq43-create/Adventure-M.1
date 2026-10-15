/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { User, TeacherProfile } from '../../types';
import { StorageService } from '../../services/storage';
import {
  X,
  User as UserIcon,
  ShieldCheck,
  School,
  IdCard,
  Phone,
  BookOpen,
  Image as ImageIcon,
  Save,
  Upload,
  Camera,
  Trash2,
  Check,
  Sparkles,
  AlertCircle,
  KeyRound,
  Lock,
  Mail,
  Eye,
  EyeOff,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';

interface TeacherProfileEditModalProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onProfileUpdated: () => void;
}

const TEACHER_AVATAR_PRESETS = [
  { id: 'tch-1', name: 'คุณครูสายเทค & AI', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=TeacherTech' },
  { id: 'tch-2', name: 'อาจารย์ผู้เชี่ยวชาญโค้ดดิ้ง', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=MasterCoder' },
  { id: 'tch-3', name: 'คุณครูใจดี (สไตล์การ์ตูน)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=TeacherSomsri' },
  { id: 'tch-4', name: 'อาจารย์วิทยาการคำนวณ', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ProfComputer' },
  { id: 'tch-5', name: 'คุณครูนักทดลอง', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=TeacherScience' },
  { id: 'tch-6', name: 'อาจารย์สายวิจัยข้อมูล', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=DataSpecialist' },
  { id: 'tch-7', name: 'คุณครูหุ่นยนต์อัจฉริยะ', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=RoboMentor' },
  { id: 'tch-8', name: 'ผู้พิทักษ์ความปลอดภัยไซเบอร์', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberGuardian' },
];

export const TeacherProfileEditModal: React.FC<TeacherProfileEditModalProps> = ({
  isOpen,
  user,
  onClose,
  onProfileUpdated,
}) => {
  if (!isOpen) return null;

  // Active Tab: 'profile' or 'password'
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  const currentTeacherProfile: TeacherProfile = StorageService.getTeacherProfile(user.id) || {
    userId: user.id,
    teacherId: 'TCH-001',
    schoolName: 'โรงเรียนวิทยาการคำนวณ สสวท.',
    subjectTaught: 'เทคโนโลยี (วิทยาการคำนวณ) ม.1',
    phoneNumber: '',
  };

  const [name, setName] = useState<string>(user.name || '');
  const [teacherId, setTeacherId] = useState<string>(currentTeacherProfile.teacherId || 'TCH-001');
  const [schoolName, setSchoolName] = useState<string>(
    currentTeacherProfile.schoolName || 'โรงเรียนวิทยาการคำนวณ สสวท.'
  );
  const [subjectTaught, setSubjectTaught] = useState<string>(
    currentTeacherProfile.subjectTaught || 'เทคโนโลยี (วิทยาการคำนวณ) ม.1'
  );
  const [phoneNumber, setPhoneNumber] = useState<string>(
    currentTeacherProfile.phoneNumber || ''
  );
  const [avatarUrl, setAvatarUrl] = useState<string>(
    user.avatarUrl || TEACHER_AVATAR_PRESETS[0].url
  );
  const [customAvatarInput, setCustomAvatarInput] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Password Management States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Client-side image upload with square-crop compression (JPEG base64)
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
          const size = 320;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setIsProcessingImage(false);
            return;
          }

          // Center crop to square
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

          setAvatarUrl(dataUrl);
          setCustomAvatarInput('');
          setIsProcessingImage(false);
          setSuccessMsg('อัปโหลดและปรับรูปภาพโปรไฟล์ครูสำเร็จ! ระบบจะคงข้อมูลโปรไฟล์เดิมไว้ทั้งหมด');
          setTimeout(() => setSuccessMsg(null), 3500);
        } catch (e: any) {
          setErrorMsg('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ');
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
      setErrorMsg('เกิดข้อผิดพลาดในการอ่านไฟล์');
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

  // 1. Profile Save Handler (Strictly preserves all teacher data & classesManaged)
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('กรุณาระบุชื่อ-นามสกุลของคุณครู');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const finalAvatar = customAvatarInput.trim() || avatarUrl;

      // 1. Update User Object
      const updatedUser: User = {
        ...user,
        name: name.trim(),
        avatarUrl: finalAvatar,
      };
      StorageService.updateUser(updatedUser);
      StorageService.setCurrentUser(updatedUser);

      // 2. Update Teacher Profile (Preserves existing classesManaged)
      const existingProfile = StorageService.getTeacherProfile(user.id);
      const updatedProfile: TeacherProfile = {
        ...existingProfile,
        userId: user.id,
        teacherId: teacherId.trim() || 'TCH-001',
        schoolName: schoolName.trim() || 'โรงเรียนวิทยาการคำนวณ สสวท.',
        subjectTaught: subjectTaught.trim() || 'เทคโนโลยี (วิทยาการคำนวณ) ม.1',
        phoneNumber: phoneNumber.trim(),
      };
      StorageService.updateTeacherProfile(updatedProfile);

      setSuccessMsg('บันทึกข้อมูลโปรไฟล์ครูและรูปภาพเรียบร้อยแล้ว!');
      setTimeout(() => {
        setIsSaving(false);
        onProfileUpdated();
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMsg(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      setIsSaving(false);
    }
  };

  // 2. Direct Update Password for Authenticated Teacher
  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

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

    // Change password directly for logged in teacher
    const success = StorageService.changeUserPassword(user.id, newPassword);
    if (success) {
      setSuccessMsg('✅ อัปเดตรหัสผ่านใหม่สำเร็จเรียบร้อยแล้ว!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onProfileUpdated();
        onClose();
      }, 1000);
    } else {
      setErrorMsg('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
    }
  };

  const currentDisplayedAvatar = customAvatarInput.trim() || avatarUrl;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden my-6 animate-scale-up max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/90 border-b border-emerald-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white font-['Chakra_Petch'] flex items-center gap-2">
                <span>โปรไฟล์ครูผู้สอน & ความปลอดภัย</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  Teacher Profile
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                รหัสครู: <span className="font-mono text-emerald-300 font-bold">{teacherId}</span> • อีเมล: {user.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
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
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>ข้อมูลทั่วไป & รูปภาพโปรไฟล์ครู</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('password');
              setErrorMsg(null);
            }}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'password'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>เปลี่ยนรหัสผ่าน (ความปลอดภัย)</span>
          </button>
        </div>

        {/* Form Body / Scrollable */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
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
            <form onSubmit={handleProfileSave} className="space-y-6">
              {/* SECTION 1: Avatar Upload & Photo Picker */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    รูปภาพโปรไฟล์ครูผู้สอน (Teacher Avatar & Photo)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    รองรับไฟล์ PNG, JPG หรือเลือกรูปสำเร็จรูป
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* Avatar Preview */}
                  <div className="relative group shrink-0">
                    <div className="w-24 h-24 rounded-2xl p-1 bg-gradient-to-tr from-emerald-500 via-teal-400 to-amber-400 shadow-xl">
                      <img
                        src={currentDisplayedAvatar}
                        alt="Teacher Profile"
                        className="w-full h-full rounded-xl object-cover bg-slate-800"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-slate-950/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer"
                      title="คลิกเพื่ออัปโหลดรูปภาพใหม่"
                    >
                      <Upload className="w-5 h-5 text-emerald-400 mb-1" />
                      <span className="text-[10px] font-bold">เปลี่ยนรูป</span>
                    </button>
                  </div>

                  {/* Upload Drop Zone & Actions */}
                  <div className="flex-1 w-full space-y-2.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3.5 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors cursor-pointer text-center space-y-1"
                    >
                      <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-300">
                        <Upload className="w-4 h-4" />
                        <span>{isProcessingImage ? 'กำลังประมวลผลรูปภาพ...' : 'คลิกเพื่อเลือกไฟล์ หรือ ลากรูปภาพมาวางที่นี่'}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        อัปโหลดรูปถ่ายจริงของคุณครู (ระบบจะคงข้อมูลโรงเรียนและวิชาที่สอนไว้ทั้งหมด)
                      </p>
                    </div>

                    {/* Direct Image URL input */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <ImageIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="url"
                          value={customAvatarInput}
                          onChange={(e) => setCustomAvatarInput(e.target.value)}
                          placeholder="หรือวาง URL ลิงก์รูปภาพ (https://...)"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                      {customAvatarInput && (
                        <button
                          type="button"
                          onClick={() => setCustomAvatarInput('')}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                          title="ล้างลิงก์"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Presets Grid */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    หรือเลือกภาพอวาตาร์ครูสำเร็จรูป:
                  </span>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {TEACHER_AVATAR_PRESETS.map((preset) => {
                      const isSelected =
                        avatarUrl === preset.url && !customAvatarInput.trim();
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
                              ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-400/50 scale-105'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                          }`}
                          title={preset.name}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 2: Teacher Personal & Academic Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ชื่อ - นามสกุล คุณครูผู้สอน *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="เช่น คุณครูสมศรี ใจดี หรือ ดร. ธนวินทร์"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>

                  {/* Teacher ID */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <IdCard className="w-3.5 h-3.5 text-emerald-400" />
                      <span>รหัสประจำตัวครู (Teacher ID)</span>
                    </label>
                    <input
                      type="text"
                      value={teacherId}
                      onChange={(e) => setTeacherId(e.target.value)}
                      placeholder="เช่น TCH-001 หรือ รหัสข้าราชการครู"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>

                  {/* School Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <School className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ชื่อโรงเรียน / สถานศึกษา</span>
                    </label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="เช่น โรงเรียนวิทยาการคำนวณ สสวท."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>

                  {/* Subject Taught */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                      <span>กลุ่มสาระการเรียนรู้ / รายวิชา</span>
                    </label>
                    <input
                      type="text"
                      value={subjectTaught}
                      onChange={(e) => setSubjectTaught(e.target.value)}
                      placeholder="เช่น เทคโนโลยี (วิทยาการคำนวณ) ม.1"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>

                  {/* Phone / Line Contact */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>เบอร์โทรศัพท์ติดต่อ / Line ID สำหรับนักเรียนและผู้ปกครอง (ไม่บังคับ)</span>
                    </label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="เช่น 081-xxx-xxxx หรือ @krusomsri"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
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
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-transform hover:scale-105 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกโปรไฟล์ครู'}</span>
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* TAB 2: Password & Security                                    */}
          {/* ============================================================== */}
          {activeTab === 'password' && (
            <div className="space-y-5">
              <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-300 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block mb-0.5">เปลี่ยนรหัสผ่านบัญชีครู:</span>
                    คุณครูสามารถกำหนดรหัสผ่านใหม่สำหรับเข้าสู่ระบบได้ทันที
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                    <span>รหัสผ่านใหม่ (New Password) *</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="อย่างน้อย 4 ตัวอักษร"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 pr-10 font-mono"
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
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>ยืนยันรหัสผ่านใหม่ (Confirm Password) *</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 pr-10 font-mono"
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
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>บันทึกรหัสผ่านใหม่</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
