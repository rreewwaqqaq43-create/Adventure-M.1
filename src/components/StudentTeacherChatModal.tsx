/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, StudentProfile, TeacherProfile } from '../types';
import { StorageService } from '../services/storage';
import { sfx } from '../utils/audioEffects';
import {
  MessageSquare,
  Send,
  X,
  Search,
  User as UserIcon,
  GraduationCap,
  ShieldCheck,
  Crown,
  Sparkles,
  HelpCircle,
  Code2,
  BookOpen,
  Trash2,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface StudentTeacherChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  initialRecipientId?: string;
  initialTopic?: string;
}

const SUBJECT_QUICK_TAGS: Record<string, string[]> = {
  default: [
    '❓ ถามเนื้อหาบทเรียน',
    '🐍 ปัญหาเขียนโค้ด Python',
    '🧩 ตรรกะบล็อก Scratch',
    '📝 ปรึกษาคำตอบใบงาน',
    '💡 ขอคำใบ้ข้อสอบ/เกม',
  ],
  'เทคโนโลยี (วิทยาการคำนวณ) ม.1': [
    '🧩 ปัญหาแนวคิดเชิงคำนวณ (บทที่ 1)',
    '🔄 ปัญหาการเขียนโปรแกรม Scratch (บทที่ 2-3)',
    '🐍 ปัญหาการเขียนโปรแกรม Python (บทที่ 4)',
    '📊 ปัญหาการรวบรวมและวิเคราะห์ข้อมูล (บทที่ 5)',
    '🛡️ ปัญหาความปลอดภัยดิจิทัล (บทที่ 6)',
  ],
  'การออกแบบและเทคโนโลยี ม.1': [
    '⚙️ กระบวนการออกแบบเชิงวิศวกรรม',
    '🛠️ การเลือกใช้วัสดุและเครื่องมือช่าง',
    '⚡ ระบบทางเทคโนโลยีและกลไก',
    '📝 การร่างแบบและเขียนผังความคิด',
  ],
  'การเขียนโปรแกรม Python & โครงงานคอมพิวเตอร์': [
    '🐍 ไวยากรณ์ Python & ตัวแปร',
    '🔂 เงื่อนไข if-else & Loop for/while',
    '📦 ฟังก์ชันและโมดูล turtle/math',
    '💡 ปรึกษาไอเดียโครงงานคอมพิวเตอร์',
  ],
  'แนะแนวทักษะดิจิทัล & ความปลอดภัยไซเบอร์': [
    '🛡️ การตั้งรหัสผ่านและการรักษาความปลอดภัย',
    '📱 ภัยคุกคามทางไซเบอร์และ Phishing',
    '⚖️ กฎหมายลิขสิทธิ์และ พ.ร.บ. คอมพิวเตอร์',
    '🌐 มารยาทการสื่อสารบนโลกออนไลน์',
  ],
};

const TEACHER_QUICK_REPLIES = [
  '👍 ถูกต้องแล้วจ้ะ ทำได้ดีมาก!',
  '💡 ลองตรวจดูเงื่อนไขในคำสั่งอีกรอบนะจ๊ะ',
  '📖 ลองเปิดทบทวนในหนังสือ สสวท. บทที่เกี่ยวข้องดูนะ',
  '🌟 เก่งมากจ้ะ ปฏิบัติตามแนวคิดวิทยาการคำนวณได้ยอดเยี่ยม!',
  '📌 ส่งตัวอย่างโค้ดหรือภาพโจทย์มาให้ครูช่วยดูได้เลยจ้ะ',
];

export const StudentTeacherChatModal: React.FC<StudentTeacherChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialRecipientId,
  initialTopic,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => StorageService.getAllChatMessages());
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(() => {
    if (initialRecipientId) return initialRecipientId;
    if (currentUser?.role === 'student') {
      const teachers = StorageService.getUsers().filter((u) => u.role === 'teacher');
      return teachers[0]?.id || 'teacher-1';
    }
    const students = StorageService.getUsers().filter((u) => u.role === 'student');
    return students[0]?.id || 'student-1';
  });

  const [selectedTag, setSelectedTag] = useState<string | null>(initialTopic || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const allUsers = StorageService.getUsers();
  const allTeacherProfiles = StorageService.getTeacherProfiles();
  const allStudentProfiles = StorageService.getStudentProfiles();

  const teachers = allUsers.filter((u) => u.role === 'teacher' || u.role === 'admin');
  const students = allUsers.filter((u) => u.role === 'student');

  useEffect(() => {
    if (isOpen) {
      setMessages(StorageService.getAllChatMessages());
      setShowClearConfirm(false);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedRecipientId]);

  if (!isOpen || !currentUser) return null;

  // Find recipient details
  const selectedRecipientUser = allUsers.find((u) => u.id === selectedRecipientId) || {
    id: selectedRecipientId,
    name: currentUser.role === 'student' ? 'คุณครูผู้สอน' : 'นักเรียน',
    role: currentUser.role === 'student' ? 'teacher' : 'student',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Teacher',
    email: '',
  };

  const selectedTeacherProfile = allTeacherProfiles.find((t) => t.userId === selectedRecipientId);
  const selectedStudentProfile = allStudentProfiles.find((s) => s.userId === selectedRecipientId);

  // Filter messages between currentUser and selectedRecipientId
  const currentThread = messages.filter(
    (m) =>
      (m.senderId === currentUser.id && m.recipientId === selectedRecipientId) ||
      (m.senderId === selectedRecipientId && m.recipientId === currentUser.id)
  );

  // Filtered Students list for Teacher/Admin
  const filteredStudents = students.filter((stu) => {
    const profile = allStudentProfiles.find((p) => p.userId === stu.id);
    const q = searchQuery.toLowerCase().trim();

    // Text search query match (Name, studentId, email, gradeLevel)
    const matchesSearch =
      !q ||
      stu.name.toLowerCase().includes(q) ||
      (profile?.studentId && profile.studentId.toLowerCase().includes(q)) ||
      (profile?.gradeLevel && profile.gradeLevel.toLowerCase().includes(q)) ||
      (stu.email && stu.email.toLowerCase().includes(q));

    // Class / status filter
    if (!matchesSearch) return false;

    if (selectedClassFilter === 'all') return true;
    if (selectedClassFilter === 'unread') {
      return messages.some(
        (m) => m.senderId === stu.id && m.recipientId === currentUser.id && !m.read
      );
    }
    return profile?.gradeLevel === selectedClassFilter;
  });

  // Filtered Teachers list for Students
  const filteredTeachers = teachers.filter((tch) => {
    const profile = allTeacherProfiles.find((p) => p.userId === tch.id);
    const q = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !q ||
      tch.name.toLowerCase().includes(q) ||
      (profile?.subjectTaught && profile.subjectTaught.toLowerCase().includes(q)) ||
      (profile?.schoolName && profile.schoolName.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (selectedSubjectFilter === 'all') return true;
    if (selectedSubjectFilter === 'cs') {
      return profile?.subjectTaught?.includes('วิทยาการคำนวณ');
    }
    if (selectedSubjectFilter === 'dt') {
      return profile?.subjectTaught?.includes('การออกแบบ');
    }
    if (selectedSubjectFilter === 'python') {
      return profile?.subjectTaught?.includes('Python') || profile?.subjectTaught?.includes('โปรแกรม');
    }
    if (selectedSubjectFilter === 'guidance') {
      return profile?.subjectTaught?.includes('แนะแนว') || profile?.subjectTaught?.includes('ไซเบอร์');
    }
    if (selectedSubjectFilter === 'admin') {
      return tch.role === 'admin';
    }
    return true;
  });

  // Unique class list for teacher filtering
  const availableClassrooms = Array.from(
    new Set(allStudentProfiles.map((p) => p.gradeLevel).filter(Boolean))
  );

  const handleSendMessage = (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = (customText || inputText).trim();
    if (!textToSend) return;

    const fullMessage = selectedTag && !customText ? `[${selectedTag}]\n${textToSend}` : textToSend;

    const newMsg: ChatMessage = {
      id: `chat-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      recipientId: selectedRecipientId,
      message: fullMessage,
      timestamp: new Date().toISOString(),
      read: false,
    };

    StorageService.sendChatMessage(newMsg);
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setSelectedTag(null);
    sfx.playPowerUp();

    // Auto teacher assistant reply if student is reaching out
    if (currentUser.role === 'student') {
      setTimeout(() => {
        const subjectName = selectedTeacherProfile?.subjectTaught || 'วิทยาการคำนวณ ม.1';
        const autoReply: ChatMessage = {
          id: `chat-reply-${Date.now()}`,
          senderId: selectedRecipientId,
          senderName: selectedRecipientUser.name,
          senderRole: 'teacher',
          recipientId: currentUser.id,
          message: `สวัสดีจ้ะ ${currentUser.name}! ครู (${subjectName}) ได้รับข้อความเรื่อง "${fullMessage.slice(0, 35)}..." เรียบร้อยแล้วนะ กำลังตรวจสอบให้อย่างละเอียดจ้ะ หากต้องการคำใบ้ด่วน สามารถทบทวนในแท็บเนื้อหาและสไลด์สรุปได้เลยนะ!`,
          timestamp: new Date().toISOString(),
          read: false,
        };
        StorageService.sendChatMessage(autoReply);
        setMessages((prev) => [...prev, autoReply]);
      }, 1500);
    }
  };

  const handleDeleteMessage = (msgId: string) => {
    StorageService.deleteChatMessage(msgId);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    sfx.playClick();
  };

  const handleClearConversation = () => {
    StorageService.clearConversation(currentUser.id, selectedRecipientId);
    setMessages((prev) =>
      prev.filter(
        (m) =>
          !(
            (m.senderId === currentUser.id && m.recipientId === selectedRecipientId) ||
            (m.senderId === selectedRecipientId && m.recipientId === currentUser.id)
          )
      )
    );
    setShowClearConfirm(false);
    sfx.playClick();
  };

  // Determine current active quick tags for student
  const activeSubjectTags =
    (selectedTeacherProfile?.subjectTaught && SUBJECT_QUICK_TAGS[selectedTeacherProfile.subjectTaught]) ||
    SUBJECT_QUICK_TAGS['default'];

  return (
    <div
      id="chat-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in"
    >
      <div
        id="chat-modal-card"
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/90 rounded-3xl shadow-2xl flex flex-col h-[90vh] max-h-[820px] overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-sky-950/90 via-slate-900 to-indigo-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base md:text-lg text-white font-['Chakra_Petch']">
                  {currentUser.role === 'student'
                    ? 'ระบบแชทปรึกษาคุณครูรายวิชาต่างๆ'
                    : 'ห้องสนทนา & ตอบคำถามนักเรียน'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ออนไลน์
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate max-w-md">
                {currentUser.role === 'student'
                  ? 'เลือกคุณครูในแต่ละสาขาวิชาเพื่อสอบถามข้อสงสัย บทเรียน การเขียนโค้ด และใบงาน'
                  : 'ค้นหานักเรียน เลือกพูดคุย ตอบคำถามรายบุคคล และจัดการประวัติการสนทนา'}
              </p>
            </div>
          </div>

          <button
            id="chat-modal-close-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Body Grid */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Sidebar: Contact list with search & filters */}
          <div className="w-full md:w-80 bg-slate-950/80 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0">
            {/* Search Input Box */}
            <div className="p-3 border-b border-slate-800/80 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    currentUser.role === 'student'
                      ? 'ค้นหาชื่อครู หรือรายวิชา...'
                      : 'ค้นหานักเรียน (ชื่อ, รหัส, ห้อง)...'
                  }
                  className="w-full pl-8 pr-8 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Filter Pills for Student (Subjects) */}
              {currentUser.role === 'student' ? (
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setSelectedSubjectFilter('all')}
                    className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors font-medium ${
                      selectedSubjectFilter === 'all'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    ทุกวิชา
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSubjectFilter('cs')}
                    className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors ${
                      selectedSubjectFilter === 'cs'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    วิทยาการคำนวณ
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSubjectFilter('dt')}
                    className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors ${
                      selectedSubjectFilter === 'dt'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    ออกแบบฯ
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSubjectFilter('python')}
                    className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors ${
                      selectedSubjectFilter === 'python'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Python/โค้ด
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSubjectFilter('guidance')}
                    className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors ${
                      selectedSubjectFilter === 'guidance'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    แนะแนวไอที
                  </button>
                </div>
              ) : (
                /* Filter Pills for Teacher (Classrooms & Unread) */
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setSelectedClassFilter('all')}
                    className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors font-medium ${
                      selectedClassFilter === 'all'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    ทั้งหมด ({students.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedClassFilter('unread')}
                    className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
                      selectedClassFilter === 'unread'
                        ? 'bg-rose-500 text-white font-bold'
                        : 'bg-slate-900 text-rose-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>ข้อความใหม่</span>
                  </button>
                  {availableClassrooms.map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setSelectedClassFilter(cls)}
                      className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors ${
                        selectedClassFilter === cls
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-52 md:max-h-none">
              {(currentUser.role === 'student' ? filteredTeachers : filteredStudents).length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  <Search className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  <span>ไม่พบรายชื่อที่ค้นหา</span>
                </div>
              ) : (
                (currentUser.role === 'student' ? filteredTeachers : filteredStudents).map((contact) => {
                  const unreadForContact = messages.filter(
                    (m) => m.senderId === contact.id && m.recipientId === currentUser.id && !m.read
                  ).length;
                  const isSelected = contact.id === selectedRecipientId;

                  const teacherProf =
                    contact.role === 'teacher' || contact.role === 'admin'
                      ? allTeacherProfiles.find((p) => p.userId === contact.id)
                      : null;
                  const studentProf =
                    contact.role === 'student' ? allStudentProfiles.find((p) => p.userId === contact.id) : null;

                  return (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => {
                        setSelectedRecipientId(contact.id);
                        setShowClearConfirm(false);
                        sfx.playClick();
                      }}
                      className={`w-full p-2.5 rounded-2xl flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 border border-amber-500/40 text-white shadow-md'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={contact.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=Avatar'}
                          alt={contact.name}
                          className="w-10 h-10 rounded-xl bg-slate-800 object-cover border border-slate-700 shadow"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate flex items-center justify-between gap-1">
                          <span className="truncate">{contact.name}</span>
                          {unreadForContact > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black shrink-0 animate-pulse">
                              {unreadForContact} ใหม่
                            </span>
                          )}
                        </div>

                        {/* Subtitle / Subject / Room */}
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {contact.role === 'student' ? (
                            <span>
                              {studentProf?.gradeLevel ? `${studentProf.gradeLevel} • ` : ''}
                              {studentProf?.studentId ? `รหัส ${studentProf.studentId}` : 'นักเรียน'}
                            </span>
                          ) : (
                            <span className="text-amber-300/90 font-medium">
                              {teacherProf?.subjectTaught || (contact.role === 'admin' ? 'Super Admin' : 'ครูผู้สอน')}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Main Chat Thread */}
          <div className="flex-1 flex flex-col bg-slate-900/50 min-w-0">
            {/* Thread Header with Recipient Details & Delete Conversation Button */}
            <div className="p-3 sm:p-4 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={selectedRecipientUser.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=Avatar'}
                  alt={selectedRecipientUser.name}
                  className="w-9 h-9 rounded-xl bg-slate-800 object-cover border border-slate-700 shadow"
                />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 truncate">
                    <span className="truncate">{selectedRecipientUser.name}</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-amber-300 border border-slate-700 shrink-0">
                      {selectedRecipientUser.role === 'teacher' || selectedRecipientUser.role === 'admin'
                        ? selectedTeacherProfile?.subjectTaught || 'ครูผู้สอน'
                        : selectedStudentProfile?.gradeLevel
                        ? `ห้อง ${selectedStudentProfile.gradeLevel}`
                        : 'นักเรียน'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {selectedRecipientUser.role === 'student'
                      ? `รหัสนักเรียน: ${selectedStudentProfile?.studentId || '-'} • XP: ${selectedStudentProfile?.xp || 0}`
                      : `${selectedTeacherProfile?.schoolName || 'โรงเรียนสาธิตวิทยาการศึกษา'}`}
                  </div>
                </div>
              </div>

              {/* Clear Chat / Delete Conversation Button */}
              <div className="flex items-center gap-2 shrink-0">
                {showClearConfirm ? (
                  <div className="flex items-center gap-1.5 p-1 bg-rose-950/80 border border-rose-500/40 rounded-xl animate-fade-in text-xs">
                    <span className="text-[11px] text-rose-200 px-1 hidden sm:inline">
                      ล้างประวัติแชท?
                    </span>
                    <button
                      type="button"
                      onClick={handleClearConversation}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      ยืนยัน
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 border border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="ลบบทสนทนานี้ทั้งหมด"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ลบบทสนทนา</span>
                  </button>
                )}
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {currentThread.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">เริ่มต้นการสนทนา</h4>
                    <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                      {currentUser.role === 'student'
                        ? `เริ่มสอบถามคุณครู (${selectedTeacherProfile?.subjectTaught || 'ผู้สอน'}) เกี่ยวกับเนื้อหาบทเรียน หรือคลิกแท็กด่วนด้านล่างได้เลย`
                        : `ส่งข้อความทักทาย ให้คำแนะนำ และติดตามการเรียนรู้ของ ${selectedRecipientUser.name}`}
                    </p>
                  </div>
                </div>
              ) : (
                currentThread.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-[10px] font-bold text-slate-400">
                          {isMe ? 'คุณ' : msg.senderName}
                        </span>
                        <span className="text-[9px] text-slate-500">
                          {new Date(msg.timestamp).toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {/* Delete individual message button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-0.5 transition-opacity cursor-pointer"
                          title="ลบข้อความนี้"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div
                        className={`max-w-[88%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
                          isMe
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-medium rounded-tr-none'
                            : 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Helper Chips for Student / Quick Replies for Teacher */}
            <div className="px-3 sm:px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
              <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{currentUser.role === 'student' ? 'แท็กด่วน:' : 'ตอบด่วน:'}</span>
              </span>

              {currentUser.role === 'student' ? (
                activeSubjectTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSelectedTag(selectedTag === tag ? null : tag);
                      sfx.playClick();
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                      selectedTag === tag
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {tag}
                  </button>
                ))
              ) : (
                TEACHER_QUICK_REPLIES.map((reply, rIdx) => (
                  <button
                    key={rIdx}
                    type="button"
                    onClick={() => handleSendMessage(undefined, reply)}
                    className="px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                  >
                    {reply}
                  </button>
                ))
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 shrink-0">
              {selectedTag && (
                <div className="mb-2 flex items-center justify-between px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs text-amber-300 animate-fade-in">
                  <span>📌 หัวข้อสอบถาม: <strong>{selectedTag}</strong></span>
                  <button
                    type="button"
                    onClick={() => setSelectedTag(null)}
                    className="text-amber-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    currentUser.role === 'student'
                      ? `พิมพ์คำถามถึง ${selectedRecipientUser.name} (${selectedTeacherProfile?.subjectTaught || 'ครูผู้สอน'})...`
                      : `พิมพ์ข้อความตอบกลับหรือคำแนะนำแก่ ${selectedRecipientUser.name}...`
                  }
                  className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">ส่งข้อความ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
