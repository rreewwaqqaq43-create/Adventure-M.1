/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Bookmark,
  Layers,
  FileText,
  X
} from 'lucide-react';

interface IPSTTextbookCoverProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showDetailsButton?: boolean;
  className?: string;
  onOpenDetails?: () => void;
}

export const IPSTTextbookCover: React.FC<IPSTTextbookCoverProps> = ({
  size = 'md',
  showDetailsButton = true,
  className = '',
  onOpenDetails,
}) => {
  const [showModal, setShowModal] = useState(false);

  // Dimension scaling
  const sizeClasses = {
    sm: 'w-36 h-48',
    md: 'w-48 h-64',
    lg: 'w-64 h-84',
    xl: 'w-72 sm:w-80 h-96 sm:h-[420px]',
  }[size];

  const handleOpen = () => {
    if (onOpenDetails) {
      onOpenDetails();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <div className={`relative group select-none ${className}`}>
        {/* Book Container with Realistic 3D Tilt & Shadow */}
        <div
          id="ipst-textbook-book-card"
          onClick={handleOpen}
          className={`relative ${sizeClasses} cursor-pointer transition-transform duration-300 transform group-hover:-translate-y-2 group-hover:rotate-1`}
          style={{ perspective: '1000px' }}
        >
          {/* Multi-page depth shadow & edges */}
          <div className="absolute inset-0 bg-slate-900 rounded-r-xl rounded-l-sm shadow-2xl translate-x-3 translate-y-3 blur-md opacity-70 group-hover:opacity-90 transition-opacity" />
          
          {/* White Paper Pages edge on the right */}
          <div className="absolute top-1 bottom-1 right-[-6px] w-3 bg-gradient-to-r from-amber-50 via-slate-100 to-amber-100 rounded-r border-r border-slate-300 shadow-inner flex flex-col justify-between py-2">
            <div className="w-full h-px bg-slate-200" />
            <div className="w-full h-px bg-slate-200" />
            <div className="w-full h-px bg-slate-200" />
            <div className="w-full h-px bg-slate-200" />
            <div className="w-full h-px bg-slate-200" />
          </div>

          {/* Book Spine (Left edge) */}
          <div className="absolute top-0 bottom-0 left-0 w-3.5 bg-gradient-to-r from-sky-950 via-sky-800 to-sky-900 rounded-l shadow-md z-20 flex flex-col items-center justify-between py-3 border-r border-sky-700/50">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <div className="writing-vertical text-[8px] font-bold text-sky-200 tracking-widest uppercase opacity-75">
              สสวท. ม.1
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          </div>

          {/* Front Cover Face */}
          <div className="relative w-full h-full ml-1 rounded-r-xl rounded-l-xs bg-gradient-to-br from-sky-700 via-sky-800 to-indigo-950 border border-sky-400/40 overflow-hidden shadow-xl flex flex-col justify-between p-3.5 sm:p-4 text-white z-10">
            
            {/* Top Gloss Highlights */}
            <div className="absolute -top-12 -left-12 w-40 h-40 bg-white/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />

            {/* Header: IPST Logo / Ministry */}
            <div className="relative z-10 flex items-start justify-between border-b border-sky-400/30 pb-2">
              <div className="flex items-center gap-2">
                {/* Stylized IPST Emblem */}
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/95 p-1 shadow flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 40 40" className="w-full h-full text-sky-700" fill="currentColor">
                    <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3" />
                    <ellipse cx="20" cy="20" rx="16" ry="6" fill="none" stroke="#f59e0b" strokeWidth="2" transform="rotate(30 20 20)" />
                    <ellipse cx="20" cy="20" rx="16" ry="6" fill="none" stroke="#0ea5e9" strokeWidth="2" transform="rotate(-30 20 20)" />
                    <circle cx="20" cy="20" r="3" fill="#ef4444" />
                  </svg>
                </div>
                <div>
                  <div className="text-[9px] sm:text-[10px] font-extrabold text-amber-300 tracking-wider">
                    สสวท. IPST
                  </div>
                  <div className="text-[7px] sm:text-[8px] text-sky-200 leading-tight">
                    กระทรวงศึกษาธิการ
                  </div>
                </div>
              </div>

              {/* Class Level Badge */}
              <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-[10px] sm:text-xs shadow-md">
                ม.1
              </div>
            </div>

            {/* Middle: Title & Subject */}
            <div className="relative z-10 my-auto text-left space-y-1">
              <div className="text-[8px] sm:text-[9px] uppercase tracking-wide text-sky-200 font-medium leading-tight">
                หนังสือเรียนรายวิชาพื้นฐานวิทยาศาสตร์และเทคโนโลยี
              </div>

              <h2 className="text-sm sm:text-base font-black text-white font-['Chakra_Petch'] leading-tight drop-shadow-md">
                เทคโนโลยี
                <span className="block text-amber-300 text-base sm:text-lg">
                  (วิทยาการคำนวณ)
                </span>
              </h2>

              <div className="text-[8px] sm:text-[9px] text-sky-100/90 font-light leading-snug pt-1">
                ชั้นมัธยมศึกษาปีที่ 1
              </div>

              {/* Illustrated Visual Centerpiece: Computing & Coding motifs */}
              <div className="relative my-2 py-2 px-2.5 rounded-lg bg-slate-950/60 border border-sky-400/30 overflow-hidden">
                <div className="flex items-center justify-between gap-1 text-[8px] sm:text-[9px]">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 font-mono font-bold">
                    Scratch
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-sky-500/30 text-sky-200 font-mono font-bold">
                    Python
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-mono font-bold">
                    Flowchart
                  </span>
                </div>

                <div className="mt-1.5 flex items-center justify-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 animate-pulse">
                    🤖
                  </div>
                  <div className="text-left">
                    <div className="text-[8px] font-bold text-slate-200">
                      แนวคิดเชิงคำนวณ
                    </div>
                    <div className="text-[7px] text-slate-400">
                      ตามมาตรฐาน ว 4.2
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom: Curriculum Info & Barcode */}
            <div className="relative z-10 border-t border-sky-400/30 pt-2 flex items-end justify-between">
              <div className="text-left space-y-0.5">
                <div className="text-[7px] text-sky-200 leading-tight">
                  หลักสูตรแกนกลาง พ.ศ. 2551 (ปรับปรุง 2560)
                </div>
                <div className="text-[6.5px] text-slate-300">
                  ISBN 978-616-345-265-8
                </div>
              </div>

              {/* Mini Barcode Graphic */}
              <div className="p-1 bg-white rounded shadow-sm flex items-center gap-[1px]">
                <div className="w-[1.5px] h-3.5 bg-black" />
                <div className="w-[1px] h-3.5 bg-black" />
                <div className="w-[2px] h-3.5 bg-black" />
                <div className="w-[1px] h-3.5 bg-black" />
                <div className="w-[1.5px] h-3.5 bg-black" />
                <div className="w-[2.5px] h-3.5 bg-black" />
                <div className="w-[1px] h-3.5 bg-black" />
                <div className="w-[2px] h-3.5 bg-black" />
              </div>
            </div>

            {/* Ribbon Bookmark */}
            <div className="absolute top-0 right-7 w-3.5 h-6 bg-amber-500 shadow-md transform -skew-y-6 flex items-end justify-center pb-0.5">
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
            </div>
          </div>
        </div>

        {/* Action Button Below Cover */}
        {showDetailsButton && (
          <button
            onClick={handleOpen}
            className="mt-3 w-full py-1.5 px-3 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-sky-300 hover:text-white border border-sky-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>ดูสารบัญ สสวท. (6 บท)</span>
          </button>
        )}
      </div>

      {/* Official Curriculum / Textbook Details Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-sky-500/30 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-4 pb-4 border-b border-slate-800">
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  หนังสือเรียนฉบับจริง สสวท. มัธยมศึกษาปีที่ 1
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  เทคโนโลยี (วิทยาการคำนวณ) ม.1
                </h3>
                <p className="text-xs text-slate-400">
                  สถาบันส่งเสริมการสอนวิทยาศาสตร์และเทคโนโลยี (สสวท.) กระทรวงศึกษาธิการ
                </p>
              </div>
            </div>

            {/* Book Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-center">
                <div className="text-[11px] text-slate-400">กลุ่มสาระ</div>
                <div className="text-xs font-bold text-sky-300 mt-0.5">วิทยาศาสตร์ฯ</div>
              </div>
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-center">
                <div className="text-[11px] text-slate-400">ระดับชั้น</div>
                <div className="text-xs font-bold text-amber-300 mt-0.5">มัธยมศึกษาปีที่ 1</div>
              </div>
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-center">
                <div className="text-[11px] text-slate-400">จำนวนหน้า</div>
                <div className="text-xs font-bold text-emerald-300 mt-0.5">188 หน้า</div>
              </div>
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-center">
                <div className="text-[11px] text-slate-400">รหัส ISBN</div>
                <div className="text-xs font-mono font-bold text-slate-200 mt-0.5">978-616-345-265-8</div>
              </div>
            </div>

            {/* 6 Official Chapters Breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>สารบัญ 6 บทเรียนที่ตรงกับระบบ Adventure M.1</span>
              </h4>

              <div className="space-y-2">
                {[
                  {
                    num: 1,
                    title: 'แนวคิดเชิงนามธรรม (Computational Thinking)',
                    pages: 'หน้า 2 – 20',
                    desc: 'การแยกแยะสาระสำคัญ การถ่ายทอดรายละเอียดปัญหา แผนที่รถไฟ Harry Beck',
                  },
                  {
                    num: 2,
                    title: 'การแก้ปัญหา รหัสลำลอง และผังงาน (Flowchart)',
                    pages: 'หน้า 22 – 41',
                    desc: '4 ขั้นตอนแก้ปัญหา สัญลักษณ์ผังงานสากล การตัดสินใจแบบทางเลือก',
                  },
                  {
                    num: 3,
                    title: 'การโปรแกรมด้วยภาษาไพทอน (Python)',
                    pages: 'หน้า 44 – 88',
                    desc: 'ตัวแปร ชนิดข้อมูล input/print เงื่อนไข if-else วนซ้ำ for/while เต่าไพทอน Turtle',
                  },
                  {
                    num: 4,
                    title: 'การโปรแกรมด้วยภาษา Scratch',
                    pages: 'หน้า 90 – 136',
                    desc: 'บล็อกคำสั่ง เหตุการณ์ การวนซ้ำ พิกัด x-y การสร้างแอนิเมชันและเกมคำนวณ',
                  },
                  {
                    num: 5,
                    title: 'ข้อมูลและการประมวลผล (Data & Processing)',
                    pages: 'หน้า 138 – 164',
                    desc: 'ความหมายของข้อมูล การรวบรวม การประมวลผล ซอฟต์แวร์ตารางทำงาน แผนภูมิ',
                  },
                  {
                    num: 6,
                    title: 'การใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย',
                    pages: 'หน้า 166 – 188',
                    desc: 'ภัยคุกคามไซเบอร์ พ.ร.บ. คอมพิวเตอร์ มารยาทดิจิทัล ลิขสิทธิ์ Creative Commons',
                  },
                ].map((chap) => (
                  <div
                    key={chap.num}
                    className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {chap.num}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          บทที่ {chap.num}: {chap.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {chap.desc}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 whitespace-nowrap">
                      {chap.pages}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer / SciMath link */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <a
                href="https://proj14.ipst.ac.th/m1/m1-cs/"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>เข้าสู่คลังบทเรียนออนไลน์ สสวท. Project 14</span>
              </a>

              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
