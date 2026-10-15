/**
 * Action Feedback Manager
 * Provides multi-sensory feedback (sound effects, haptic vibration, and visual toasts)
 * for CRUD operations: เพิ่ม (Add), บันทึก (Save), แก้ไข (Edit), and ลบ (Delete).
 */

import { sfx } from './audioEffects';

export type ActionFeedbackType = 'add' | 'save' | 'edit' | 'delete' | 'success' | 'error';

export interface ActionFeedbackEventDetail {
  id: string;
  type: ActionFeedbackType;
  title: string;
  description?: string;
  timestamp: number;
}

const DEFAULT_MESSAGES: Record<ActionFeedbackType, { title: string; desc: string }> = {
  add: {
    title: 'เพิ่มรายการเรียบร้อยแล้ว',
    desc: 'ข้อมูลถูกเพิ่มเข้าสู่ระบบสำเร็จ',
  },
  save: {
    title: 'บันทึกการเปลี่ยนแปลงสำเร็จ',
    desc: 'ข้อมูลทั้งหมดได้รับการบันทึกเรียบร้อยแล้ว',
  },
  edit: {
    title: 'อัปเดต / ปรับปรุงข้อมูลแล้ว',
    desc: 'ระบบเปิดโหมดแก้ไขหรืออัปเดตข้อมูลเรียบร้อย',
  },
  delete: {
    title: 'ลบรายการเรียบร้อยแล้ว',
    desc: 'ข้อมูลถูกนำออกจากระบบแล้ว',
  },
  success: {
    title: 'ดำเนินการสำเร็จ',
    desc: 'การทำรายการเสร็จสิ้นเรียบร้อย',
  },
  error: {
    title: 'เกิดข้อผิดพลาด',
    desc: 'ไม่สามารถทำรายการได้ กรุณาลองใหม่อีกครั้ง',
  },
};

let lastTriggerTimestamp = 0;
let lastTriggerType: ActionFeedbackType | null = null;

export function triggerActionFeedback(
  type: ActionFeedbackType,
  customTitle?: string,
  customDescription?: string
) {
  const now = Date.now();
  // Prevent duplicate double-firing within 250ms for the same action type
  if (now - lastTriggerTimestamp < 250 && lastTriggerType === type) {
    return;
  }
  lastTriggerTimestamp = now;
  lastTriggerType = type;

  // 1. Play Procedural Sound Effect
  try {
    switch (type) {
      case 'add':
        sfx.playAdd();
        break;
      case 'save':
        sfx.playSave();
        break;
      case 'edit':
        sfx.playEdit();
        break;
      case 'delete':
        sfx.playDelete();
        break;
      case 'success':
        sfx.playVictory();
        break;
      case 'error':
        sfx.playError();
        break;
    }
  } catch (err) {
    console.warn('Audio feedback error:', err);
  }

  // 2. Haptic Vibration
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'delete') {
        navigator.vibrate([25, 20, 15]);
      } else if (type === 'save') {
        navigator.vibrate([15, 30, 25]);
      } else if (type === 'add') {
        navigator.vibrate(20);
      } else {
        navigator.vibrate(15);
      }
    }
  } catch {}

  // 3. Dispatch Global Custom Event for Visual Toast Component
  if (typeof window !== 'undefined') {
    const defaultInfo = DEFAULT_MESSAGES[type];
    const detail: ActionFeedbackEventDetail = {
      id: `feedback-${now}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      title: customTitle || defaultInfo.title,
      description: customDescription || defaultInfo.desc,
      timestamp: now,
    };

    window.dispatchEvent(
      new CustomEvent<ActionFeedbackEventDetail>('app-action-feedback', {
        detail,
      })
    );
  }
}

export const feedback = {
  add: (title?: string, description?: string) => triggerActionFeedback('add', title, description),
  save: (title?: string, description?: string) => triggerActionFeedback('save', title, description),
  edit: (title?: string, description?: string) => triggerActionFeedback('edit', title, description),
  delete: (title?: string, description?: string) => triggerActionFeedback('delete', title, description),
  success: (title?: string, description?: string) => triggerActionFeedback('success', title, description),
  error: (title?: string, description?: string) => triggerActionFeedback('error', title, description),
};

// Global click delegator for any button with action keywords
if (typeof window !== 'undefined') {
  let isDelegatorAttached = false;
  if (!isDelegatorAttached) {
    isDelegatorAttached = true;
    window.addEventListener(
      'click',
      (e) => {
        const target = e.target as HTMLElement | null;
        if (!target) return;

        const button = target.closest('button, [role="button"], a') as HTMLElement | null;
        if (!button) return;

        // Check explicit data attribute first
        const explicitAction = button.getAttribute('data-feedback') as ActionFeedbackType | null;
        if (explicitAction && ['add', 'save', 'edit', 'delete'].includes(explicitAction)) {
          triggerActionFeedback(explicitAction);
          return;
        }

        // Check text content of button
        const text = button.innerText?.trim() || button.getAttribute('title') || '';
        if (!text) return;

        if (text.includes('เพิ่ม') || text.includes('สร้าง') || text.includes('Add') || text.includes('Create')) {
          triggerActionFeedback('add');
        } else if (text.includes('บันทึก') || text.includes('Save') || text.includes('จัดเก็บ')) {
          triggerActionFeedback('save');
        } else if (text.includes('แก้ไข') || text.includes('ปรับปรุง') || text.includes('Edit') || text.includes('เปลี่ยนรหัส')) {
          triggerActionFeedback('edit');
        } else if (text.includes('ลบ') || text.includes('Delete') || text.includes('ยกเลิกรายการ')) {
          triggerActionFeedback('delete');
        }
      },
      { capture: true }
    );
  }
}
