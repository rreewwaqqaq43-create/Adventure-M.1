/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { User, StudentProfile } from '../../types';
import { Award, Printer, X, Sparkles, ShieldCheck, Download, CheckCircle2, ArrowLeft } from 'lucide-react';

interface CertificateModalProps {
  user: User;
  studentProfile: StudentProfile | null;
  totalXP: number;
  completedLessonsCount: number;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  user,
  studentProfile,
  totalXP,
  completedLessonsCount,
  onClose,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 150);
  };

  const currentDate = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      {/* Print CSS to isolate certificate */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #certificate-print-area, #certificate-print-area * {
            visibility: visible !important;
          }
          #certificate-print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 36px 48px !important;
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            page-break-inside: avoid !important;
            box-shadow: none !important;
            border: 6px double #b45309 !important;
            border-radius: 0px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          .cert-print-text-dark {
            color: #0f172a !important;
          }
          .cert-print-subtext {
            color: #475569 !important;
          }
          .cert-print-pill {
            background: #f8fafc !important;
            border: 1px solid #cbd5e1 !important;
            color: #0f172a !important;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
        }
      `}</style>

      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl my-auto text-slate-100 flex flex-col max-h-[92vh]">
        {/* Sticky Top Header Bar */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md px-6 py-4 border-b border-slate-800 rounded-t-3xl flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white font-['Chakra_Petch'] leading-tight">
                เกียรติบัตรรับรองการเรียนรู้ (Official Certificate)
              </h2>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                วิทยาการคำนวณ ชั้นมัธยมศึกษาปีที่ 1 • สสวท.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Primary Print to PDF button */}
            <button
              id="btn-print-certificate-pdf"
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์เกียรติบัตร / PDF</span>
            </button>

            {/* Top Close Button */}
            <button
              id="btn-close-certificate-top"
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="ปิดหน้าต่าง (ESC)"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">ปิด (ESC)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {/* Certificate Canvas Frame */}
          <div
            id="certificate-print-area"
            className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-amber-50/5 via-slate-950 to-amber-950/15 border-4 border-amber-400/70 shadow-2xl relative overflow-hidden text-center space-y-6"
          >
            {/* Decorative Corner Ornaments */}
            <div className="absolute top-3 left-3 w-12 h-12 border-t-2 border-l-2 border-amber-400/80 pointer-events-none" />
            <div className="absolute top-3 right-3 w-12 h-12 border-t-2 border-r-2 border-amber-400/80 pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-12 h-12 border-b-2 border-l-2 border-amber-400/80 pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-12 h-12 border-b-2 border-r-2 border-amber-400/80 pointer-events-none" />

            {/* Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <Award className="w-96 h-96 text-amber-400" />
            </div>

            {/* Ministry / System Header */}
            <div className="space-y-1 relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Adventure M.1 • ระบบสื่อการเรียนรู้เกมมิฟิเคชัน สสวท.</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 font-['Chakra_Petch'] pt-2">
                เกียรติบัตรประกาศเกียรติคุณ
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 cert-print-subtext">
                Certificate of Academic Achievement in Computing Science
              </p>
            </div>

            <div className="py-2 relative z-10">
              <p className="text-xs text-slate-400 cert-print-subtext">ขอมอบเกียรติบัตรฉบับนี้ให้ไว้เพื่อแสดงว่า</p>
              <div className="text-2xl sm:text-3xl font-black text-white cert-print-text-dark py-2 border-b-2 border-amber-400/40 max-w-md mx-auto">
                {user.name}
              </div>
              <p className="text-xs text-slate-300 cert-print-subtext mt-2">
                รหัสนักเรียน: <strong className="text-amber-300 cert-print-text-dark">{studentProfile?.studentId || 'STD-M1'}</strong> • ห้องเรียน: <strong className="text-amber-300 cert-print-text-dark">{studentProfile?.classroom || 'ม.1/1'}</strong> • เลขที่: <strong className="text-amber-300 cert-print-text-dark">{studentProfile?.seatNumber || 1}</strong>
              </p>
            </div>

            <div className="max-w-xl mx-auto text-xs sm:text-sm text-slate-300 cert-print-text-dark leading-relaxed relative z-10">
              ได้ผ่านการศึกษาและประเมินผลสัมฤทธิ์ทางการเรียนรู้
              <br />
              <strong>รายวิชาพื้นฐานวิทยาศาสตร์และเทคโนโลยี (วิทยาการคำนวณ) ชั้นมัธยมศึกษาปีที่ 1</strong>
              <br />
              ตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พุทธศักราช 2551 (ฉบับปรับปรุง พ.ศ. 2560)
            </div>

            {/* Achievement Summary Pills */}
            <div className="flex flex-wrap justify-center gap-3 py-2 relative z-10">
              <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs cert-print-pill">
                <span className="text-slate-400 cert-print-subtext">บทเรียนที่พิชิต:</span>{' '}
                <strong className="text-emerald-400">{completedLessonsCount} / 6 บท</strong>
              </div>
              <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs cert-print-pill">
                <span className="text-slate-400 cert-print-subtext">คะแนนสะสมวิทยฐานะ:</span>{' '}
                <strong className="text-amber-300">{totalXP} XP</strong>
              </div>
              <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs cert-print-pill">
                <span className="text-slate-400 cert-print-subtext">ระดับผลการประเมิน:</span>{' '}
                <strong className="text-yellow-300">
                  {totalXP >= 600 ? 'ระดับดีเยี่ยม (Excellent)' : 'ระดับผ่านเกณฑ์มาตรฐาน (Passed)'}
                </strong>
              </div>
            </div>

            {/* Signatures & Seal */}
            <div className="pt-6 grid grid-cols-2 gap-8 items-end max-w-lg mx-auto border-t border-slate-800/80 relative z-10">
              <div>
                <div className="w-24 h-10 mx-auto flex items-center justify-center font-serif text-slate-400 italic text-sm">
                  Adventure M.1
                </div>
                <div className="border-t border-slate-700 pt-1 text-[11px] text-slate-400 cert-print-subtext">
                  ระบบจัดการเรียนรู้แบบเกมมิฟิเคชัน
                  <br />
                  สสวท. มัธยมศึกษาปีที่ 1
                </div>
              </div>

              <div>
                <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-xl flex items-center justify-center mb-1.5">
                  <div className="w-full h-full bg-slate-950 rounded-full flex flex-col items-center justify-center text-amber-300">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-[7px] font-bold uppercase tracking-tighter">VERIFIED</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 cert-print-subtext">
                  ให้ไว้ ณ วันที่ {currentDate}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Action Bar with Large Buttons */}
        <div className="sticky bottom-0 z-20 bg-slate-900/95 backdrop-blur-md px-6 py-4 border-t border-slate-800 rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold">💡 คำแนะนำ:</span>
            <span>ในหน้าต่างพิมพ์ ให้เลือกปลายทางเป็น <strong>&quot;บันทึกเป็น PDF (Save as PDF)&quot;</strong> เพื่อเซฟไฟล์ลงเครื่อง</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              id="btn-close-certificate-bottom"
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ปิดหน้าต่าง / ย้อนกลับ</span>
            </button>

            <button
              id="btn-print-certificate-bottom"
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์เกียรติบัตรเป็น PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

