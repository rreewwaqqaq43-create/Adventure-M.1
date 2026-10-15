/**
 * Action Feedback Toast Notification Component
 * Renders sleek, animated feedback toasts in response to 'app-action-feedback' events.
 */

import React, { useState, useEffect } from 'react';
import { ActionFeedbackEventDetail, ActionFeedbackType } from '../../utils/feedback';
import {
  CheckCircle2,
  PlusCircle,
  Save,
  Edit3,
  Trash2,
  AlertTriangle,
  X,
  Sparkles
} from 'lucide-react';

interface ToastItem extends ActionFeedbackEventDetail {
  timerId?: any;
}

export const ActionFeedbackToast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleFeedback = (e: Event) => {
      const customEvent = e as CustomEvent<ActionFeedbackEventDetail>;
      const detail = customEvent.detail;
      if (!detail) return;

      const newToast: ToastItem = {
        ...detail,
      };

      setToasts((prev) => {
        // Keep at most 3 toasts on screen simultaneously
        const updated = [...prev, newToast];
        if (updated.length > 3) {
          return updated.slice(updated.length - 3);
        }
        return updated;
      });

      // Auto dismiss after 2.8 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 2800);
    };

    window.addEventListener('app-action-feedback', handleFeedback as EventListener);
    return () => {
      window.removeEventListener('app-action-feedback', handleFeedback as EventListener);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-3">
      {toasts.map((toast) => {
        const config = getToastConfig(toast.type);

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-300 transform animate-in slide-in-from-top-4 fade-in ${config.bg} ${config.border} ${config.glow}`}
          >
            <div className={`p-2 rounded-xl shrink-0 ${config.iconBg} ${config.iconColor}`}>
              {config.icon}
            </div>

            <div className="flex-1 min-w-0 text-left pt-0.5">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-black uppercase tracking-wider font-['Chakra_Petch'] ${config.badgeColor}`}>
                  {config.badgeText}
                </span>
                <Sparkles className={`w-3 h-3 ${config.sparkleColor} animate-pulse`} />
              </div>

              <h4 className="text-xs sm:text-sm font-bold text-white leading-snug mt-0.5 truncate">
                {toast.title}
              </h4>

              {toast.description && (
                <p className="text-[11px] text-slate-300 leading-tight mt-0.5 line-clamp-2">
                  {toast.description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
              title="ปิดการแจ้งเตือน"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

function getToastConfig(type: ActionFeedbackType) {
  switch (type) {
    case 'add':
      return {
        badgeText: '✨ เพิ่มข้อมูล (ADD)',
        badgeColor: 'text-emerald-400',
        sparkleColor: 'text-emerald-400',
        bg: 'bg-gradient-to-r from-emerald-950/95 via-slate-900/95 to-slate-950/95',
        border: 'border-emerald-500/50',
        glow: 'shadow-emerald-500/20',
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-400',
        icon: <PlusCircle className="w-5 h-5" />,
      };
    case 'save':
      return {
        badgeText: '💾 บันทึกสำเร็จ (SAVE)',
        badgeColor: 'text-cyan-400',
        sparkleColor: 'text-cyan-400',
        bg: 'bg-gradient-to-r from-cyan-950/95 via-slate-900/95 to-slate-950/95',
        border: 'border-cyan-500/50',
        glow: 'shadow-cyan-500/20',
        iconBg: 'bg-cyan-500/20',
        iconColor: 'text-cyan-400',
        icon: <Save className="w-5 h-5" />,
      };
    case 'edit':
      return {
        badgeText: '✏️ แก้ไขข้อมูล (EDIT)',
        badgeColor: 'text-amber-400',
        sparkleColor: 'text-amber-400',
        bg: 'bg-gradient-to-r from-amber-950/95 via-slate-900/95 to-slate-950/95',
        border: 'border-amber-500/50',
        glow: 'shadow-amber-500/20',
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-400',
        icon: <Edit3 className="w-5 h-5" />,
      };
    case 'delete':
      return {
        badgeText: '🗑️ ลบรายการ (DELETE)',
        badgeColor: 'text-rose-400',
        sparkleColor: 'text-rose-400',
        bg: 'bg-gradient-to-r from-rose-950/95 via-slate-900/95 to-slate-950/95',
        border: 'border-rose-500/50',
        glow: 'shadow-rose-500/20',
        iconBg: 'bg-rose-500/20',
        iconColor: 'text-rose-400',
        icon: <Trash2 className="w-5 h-5" />,
      };
    case 'success':
      return {
        badgeText: '🎉 สำเร็จ (SUCCESS)',
        badgeColor: 'text-yellow-400',
        sparkleColor: 'text-yellow-400',
        bg: 'bg-gradient-to-r from-emerald-950/95 via-slate-900/95 to-slate-950/95',
        border: 'border-yellow-500/50',
        glow: 'shadow-yellow-500/20',
        iconBg: 'bg-yellow-500/20',
        iconColor: 'text-yellow-400',
        icon: <CheckCircle2 className="w-5 h-5" />,
      };
    case 'error':
      return {
        badgeText: '⚠️ แจ้งเตือน (ALERT)',
        badgeColor: 'text-rose-400',
        sparkleColor: 'text-rose-400',
        bg: 'bg-gradient-to-r from-rose-950/95 via-slate-900/95 to-slate-950/95',
        border: 'border-rose-500/50',
        glow: 'shadow-rose-500/20',
        iconBg: 'bg-rose-500/20',
        iconColor: 'text-rose-400',
        icon: <AlertTriangle className="w-5 h-5" />,
      };
  }
}
