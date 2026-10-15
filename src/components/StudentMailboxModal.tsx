/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TeacherFeedback, User } from '../types';
import { StorageService } from '../services/storage';
import {
  Mail,
  Inbox,
  CheckCircle2,
  X,
  BookOpen,
  Calendar,
  MessageSquare,
  Award,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Clock,
  Trash2,
  BellRing
} from 'lucide-react';
import { sfx } from '../utils/audioEffects';

interface StudentMailboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onOpenWorksheet: (chapterNumber: number) => void;
}

export const StudentMailboxModal: React.FC<StudentMailboxModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenWorksheet,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [updateKey, setUpdateKey] = useState(0);

  if (!isOpen || !currentUser) return null;

  const feedbacks = StorageService.getFeedback(currentUser.id);
  const unreadCount = feedbacks.filter((f) => !f.read).length;

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (filter === 'unread') return !f.read;
    return true;
  });

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    sfx.playClick();
    StorageService.markFeedbackAsRead(id);
    setUpdateKey((k) => k + 1);
  };

  const handleMarkAllRead = () => {
    sfx.playClick();
    StorageService.markAllFeedbackAsRead(currentUser.id);
    setUpdateKey((k) => k + 1);
  };

  const handleGoToLessonWorksheet = (chNum?: number) => {
    if (!chNum) return;
    sfx.playClick();
    onClose();
    onOpenWorksheet(chNum);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-amber-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Mail className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-slate-900 animate-bounce">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white font-['Chakra_Petch']">
                  กล่องจดหมาย & ฟีดแบ็กจากคุณครู
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                    ยังไม่ได้อ่าน {unreadCount} ฉบับ
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ข้อความแจ้งเตือนผลการตรวจใบงาน คะแนน และคำแนะนำเพื่อพัฒนาการเรียนรู้
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter / Actions Bar */}
        <div className="px-5 py-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ทั้งหมด ({feedbacks.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                filter === 'unread'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ยังไม่ได้อ่าน ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>อ่านทั้งหมดแล้ว</span>
            </button>
          )}
        </div>

        {/* Mail Items List */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {filteredFeedbacks.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto text-slate-500">
                <Inbox className="w-8 h-8" />
              </div>
              <div className="text-slate-300 font-bold text-sm">
                {filter === 'unread' ? 'ไม่มีจดหมายที่ยังไม่ได้อ่าน' : 'ยังไม่มีจดหมายแจ้งเตือนจากคุณครู'}
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                เมื่อนักเรียนส่งใบงานและคุณครูตรวจพร้อมให้คะแนนและคอมเมนต์ จดหมายแจ้งเตือนจะส่งตรงมายังกล่องข้อความนี้ทันที
              </p>
            </div>
          ) : (
            filteredFeedbacks.map((fb) => {
              const isUnread = !fb.read;
              return (
                <div
                  key={fb.id}
                  onClick={() => handleMarkAsRead(fb.id)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative group ${
                    isUnread
                      ? 'bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border-indigo-500/50 shadow-lg ring-1 ring-indigo-500/20'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  {/* Unread Glow Dot */}
                  {isUnread && (
                    <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse ring-4 ring-indigo-400/20" />
                  )}

                  {/* Mail Header */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-lg shrink-0">
                      👨‍🏫
                    </div>

                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {fb.teacherName || 'คุณครูผู้สอน'}
                        </span>
                        {fb.chapterNumber && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                            บทที่ {fb.chapterNumber}
                          </span>
                        )}
                        {fb.score !== undefined && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                            ⭐ ได้รับ {fb.score} / {fb.maxScore || 10} คะแนน
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>
                          {new Date(fb.createdAt).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })} น.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Message & Feedback Content */}
                  <div className="mt-3.5 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px] mb-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>ข้อคิดเห็นและฟีดแบ็กจากคุณครู:</span>
                    </div>
                    <p className="italic text-slate-100 bg-amber-500/5 p-2 rounded-lg border-l-2 border-amber-400">
                      "{fb.message}"
                    </p>
                  </div>

                  {/* Action Bar */}
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-500">
                      {isUnread ? '💡 คลิกเพื่อทำเครื่องหมายว่าอ่านแล้ว' : 'อ่านแล้ว'}
                    </span>

                    {fb.chapterNumber && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(fb.id);
                          handleGoToLessonWorksheet(fb.chapterNumber);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-indigo-500/30"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>เปิดดูใบงานบทที่ {fb.chapterNumber} →</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>คำแนะนำจากคุณครูช่วยให้คุณเข้าใจบทเรียนลึกซึ้งยิ่งขึ้น</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
