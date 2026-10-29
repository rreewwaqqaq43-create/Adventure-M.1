/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export type DataGraphicType =
  | 'primary_data'      // ข้อมูลปฐมภูมิ (การสัมภาษณ์/แบบสอบถาม)
  | 'secondary_data'    // ข้อมูลทุติยภูมิ (รายงานวิจัย/สถิติทางการ)
  | 'bar_chart'         // แผนภูมิแท่ง (เปรียบเทียบปริมาณ)
  | 'pie_chart'         // แผนภูมิวงกลม (สัดส่วน 100%)
  | 'line_chart'        // กราฟเส้น (แนวโน้มตามเวลา)
  | 'decision_table'    // ตารางประเมินทางเลือก (Decision Matrix)
  | 'sorting_data'      // การเรียงลำดับข้อมูล (Sorting)
  | 'processing_cycle'; // วงจรการประมวลผลข้อมูล (Data Processing)

interface DataGraphicCardProps {
  type: DataGraphicType | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
}

export const DataGraphicCard: React.FC<DataGraphicCardProps> = ({
  type,
  size = 'md',
  className = '',
  title,
}) => {
  const dims = {
    sm: { w: 90, h: 60, viewBox: '0 0 100 66' },
    md: { w: 120, h: 72, viewBox: '0 0 100 66' },
    lg: { w: 160, h: 96, viewBox: '0 0 100 66' },
  }[size];

  const renderGraphic = () => {
    switch (type) {
      case 'primary_data':
      case 'source_primary':
        // ข้อมูลปฐมภูมิ: คลิปบอร์ด แบบสอบถาม ปากกา และแว่นขยายสำรวจ
        return (
          <g>
            {/* Clipboard board */}
            <rect x="20" y="8" width="60" height="50" rx="6" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
            <rect x="36" y="4" width="28" height="8" rx="3" fill="#93c5fd" stroke="#1d4ed8" strokeWidth="1.5" />
            {/* Paper sheet */}
            <rect x="26" y="14" width="48" height="40" rx="3" fill="#ffffff" />
            {/* Checklist items */}
            <rect x="31" y="20" width="6" height="6" rx="1.5" fill="#22c55e" />
            <path d="M 32 23 L 34 25 L 36 21" stroke="#ffffff" strokeWidth="1.2" fill="none" />
            <line x1="41" y1="23" x2="68" y2="23" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />

            <rect x="31" y="30" width="6" height="6" rx="1.5" fill="#22c55e" />
            <path d="M 32 33 L 34 35 L 36 31" stroke="#ffffff" strokeWidth="1.2" fill="none" />
            <line x1="41" y1="33" x2="68" y2="33" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />

            <rect x="31" y="40" width="6" height="6" rx="1.5" fill="#cbd5e1" />
            <line x1="41" y1="43" x2="64" y2="43" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />

            {/* Magnifying glass survey icon */}
            <circle cx="70" cy="42" r="11" fill="#fef08a" stroke="#ca8a04" strokeWidth="2" />
            <line x1="78" y1="50" x2="88" y2="60" stroke="#ca8a04" strokeWidth="3" strokeLinecap="round" />
            <circle cx="70" cy="42" r="7" fill="#fde047" opacity="0.6" />
          </g>
        );

      case 'secondary_data':
      case 'source_secondary':
        // ข้อมูลทุติยภูมิ: หนังสือรายงานวิจัย + เซิร์ฟเวอร์ฐานข้อมูลทางการ
        return (
          <g>
            {/* Database cylinder stack */}
            <ellipse cx="32" cy="18" rx="18" ry="6" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" />
            <path d="M 14 18 L 14 30 A 18 6 0 0 0 50 30 L 50 18 Z" fill="#0284c7" stroke="#0284c7" strokeWidth="1.5" />
            <ellipse cx="32" cy="30" rx="18" ry="6" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
            <path d="M 14 30 L 14 42 A 18 6 0 0 0 50 42 L 50 30 Z" fill="#0369a1" stroke="#0284c7" strokeWidth="1.5" />
            <ellipse cx="32" cy="42" rx="18" ry="6" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />

            {/* LED Status indicators */}
            <circle cx="22" cy="24" r="1.5" fill="#4ade80" />
            <circle cx="22" cy="36" r="1.5" fill="#4ade80" />

            {/* Official Report Book */}
            <rect x="52" y="16" width="38" height="42" rx="4" fill="#a855f7" stroke="#7e22ce" strokeWidth="2" />
            <rect x="56" y="20" width="30" height="34" rx="2" fill="#faf5ff" />
            {/* Report chart in book */}
            <line x1="60" y1="44" x2="82" y2="44" stroke="#9333ea" strokeWidth="1.5" />
            <rect x="62" y="34" width="4" height="10" fill="#a855f7" />
            <rect x="68" y="28" width="4" height="16" fill="#c084fc" />
            <rect x="74" y="24" width="4" height="20" fill="#9333ea" />
            <line x1="60" y1="48" x2="80" y2="48" stroke="#cbd5e1" strokeWidth="1.5" />
          </g>
        );

      case 'bar_chart':
        // แผนภูมิแท่ง (Bar Chart): แกนพิกัด + แท่งเปรียบเทียบสีสดใส 4 แท่ง
        return (
          <g>
            {/* Axis */}
            <line x1="15" y1="10" x2="15" y2="54" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
            <line x1="15" y1="54" x2="90" y2="54" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />

            {/* Grid lines */}
            <line x1="15" y1="20" x2="88" y2="20" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="15" y1="36" x2="88" y2="36" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />

            {/* 4 Colored Bars */}
            <rect x="22" y="32" width="11" height="22" rx="2" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
            <rect x="38" y="18" width="11" height="36" rx="2" fill="#a855f7" stroke="#7e22ce" strokeWidth="1.5" />
            <rect x="54" y="24" width="11" height="30" rx="2" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
            <rect x="70" y="12" width="11" height="42" rx="2" fill="#10b981" stroke="#047857" strokeWidth="1.5" />

            {/* Category marks */}
            <circle cx="27" cy="58" r="1.5" fill="#94a3b8" />
            <circle cx="43" cy="58" r="1.5" fill="#94a3b8" />
            <circle cx="59" cy="58" r="1.5" fill="#94a3b8" />
            <circle cx="75" cy="58" r="1.5" fill="#94a3b8" />
          </g>
        );

      case 'pie_chart':
        // แผนภูมิรูปวงกลม (Pie Chart): สัดส่วน 100% สวยงามพร้อมชิ้นส่วนแยก
        return (
          <g transform="translate(10, 0)">
            {/* Slice 1: Blue 40% */}
            <path d="M 40 33 L 40 8 A 25 25 0 0 1 65 33 Z" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
            {/* Slice 2: Violet 30% */}
            <path d="M 40 33 L 65 33 A 25 25 0 0 1 25 53 Z" fill="#a855f7" stroke="#7e22ce" strokeWidth="1.5" />
            {/* Slice 3: Emerald 20% */}
            <path d="M 40 33 L 25 53 A 25 25 0 0 1 15 33 Z" fill="#10b981" stroke="#047857" strokeWidth="1.5" />
            {/* Slice 4: Amber 10% (slight pop out) */}
            <path d="M 38 31 L 13 31 A 25 25 0 0 1 38 6 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />

            {/* Center Donut Hole */}
            <circle cx="40" cy="33" r="7" fill="#0f172a" />

            {/* Legend Labels */}
            <rect x="68" y="16" width="6" height="6" rx="1" fill="#38bdf8" />
            <line x1="77" y1="19" x2="88" y2="19" stroke="#94a3b8" strokeWidth="1.5" />

            <rect x="68" y="27" width="6" height="6" rx="1" fill="#a855f7" />
            <line x1="77" y1="30" x2="88" y2="30" stroke="#94a3b8" strokeWidth="1.5" />

            <rect x="68" y="38" width="6" height="6" rx="1" fill="#f59e0b" />
            <line x1="77" y1="41" x2="88" y2="41" stroke="#94a3b8" strokeWidth="1.5" />
          </g>
        );

      case 'line_chart':
        // กราฟเส้น (Line Graph): แกนเวลา จุดข้อมูล และเส้นแนวโน้มพุ่งขึ้น
        return (
          <g>
            {/* Axis */}
            <line x1="15" y1="10" x2="15" y2="54" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
            <line x1="15" y1="54" x2="90" y2="54" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />

            {/* Gradient Area under line */}
            <polygon
              points="15,54 24,42 40,46 56,26 72,32 88,14 88,54"
              fill="#0284c7"
              opacity="0.25"
            />

            {/* Plotted Line */}
            <polyline
              points="24,42 40,46 56,26 72,32 88,14"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data Nodes */}
            <circle cx="24" cy="42" r="3.5" fill="#f8fafc" stroke="#0284c7" strokeWidth="2" />
            <circle cx="40" cy="46" r="3.5" fill="#f8fafc" stroke="#0284c7" strokeWidth="2" />
            <circle cx="56" cy="26" r="3.5" fill="#f8fafc" stroke="#0284c7" strokeWidth="2" />
            <circle cx="72" cy="32" r="3.5" fill="#f8fafc" stroke="#0284c7" strokeWidth="2" />
            <circle cx="88" cy="14" r="4.5" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
          </g>
        );

      case 'decision_table':
        // ตารางประเมินทางเลือก (Decision Matrix): ตารางเกณฑ์และเครื่องหมายถูก/คะแนน
        return (
          <g>
            {/* Table outer container */}
            <rect x="10" y="8" width="80" height="50" rx="4" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
            {/* Header row */}
            <rect x="10" y="8" width="80" height="13" rx="3" fill="#1e3a8a" />
            <line x1="38" y1="8" x2="38" y2="58" stroke="#3b82f6" strokeWidth="1.5" />
            <line x1="64" y1="8" x2="64" y2="58" stroke="#3b82f6" strokeWidth="1.5" />

            {/* Row dividers */}
            <line x1="10" y1="21" x2="90" y2="21" stroke="#3b82f6" strokeWidth="1.5" />
            <line x1="10" y1="34" x2="90" y2="34" stroke="#1e293b" strokeWidth="1.5" />
            <line x1="10" y1="46" x2="90" y2="46" stroke="#1e293b" strokeWidth="1.5" />

            {/* Row 1 cells */}
            <text x="24" y="30" fontSize="7" fill="#93c5fd" textAnchor="middle" fontWeight="bold">ทางเลือก A</text>
            <text x="51" y="30" fontSize="8" fill="#4ade80" textAnchor="middle" fontWeight="bold">✓ 9/10</text>
            <rect x="70" y="24" width="14" height="6" rx="2" fill="#22c55e" />

            {/* Row 2 cells */}
            <text x="24" y="42" fontSize="7" fill="#93c5fd" textAnchor="middle" fontWeight="bold">ทางเลือก B</text>
            <text x="51" y="42" fontSize="8" fill="#f87171" textAnchor="middle" fontWeight="bold">✗ 6/10</text>
            <rect x="70" y="36" width="10" height="6" rx="2" fill="#f59e0b" />

            {/* Row 3 cells */}
            <text x="24" y="54" fontSize="7" fill="#93c5fd" textAnchor="middle" fontWeight="bold">ทางเลือก C</text>
            <text x="51" y="54" fontSize="8" fill="#cbd5e1" textAnchor="middle" fontWeight="bold">7/10</text>
            <rect x="70" y="48" width="12" height="6" rx="2" fill="#0ea5e9" />
          </g>
        );

      case 'sorting_data':
        // การเรียงลำดับข้อมูล (Sorting): บล็อกตัวเลขขั้นบันไดเรียงจากน้อยไปมาก
        return (
          <g>
            {/* Step blocks: 2, 5, 8, 12 */}
            <rect x="15" y="40" width="15" height="16" rx="3" fill="#60a5fa" stroke="#2563eb" strokeWidth="1.5" />
            <text x="22.5" y="51" fontSize="9" fontWeight="bold" fill="#ffffff" textAnchor="middle">2</text>

            <rect x="33" y="31" width="15" height="25" rx="3" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5" />
            <text x="40.5" y="46" fontSize="9" fontWeight="bold" fill="#ffffff" textAnchor="middle">5</text>

            <rect x="51" y="22" width="15" height="34" rx="3" fill="#2563eb" stroke="#1e40af" strokeWidth="1.5" />
            <text x="58.5" y="41" fontSize="9" fontWeight="bold" fill="#ffffff" textAnchor="middle">8</text>

            <rect x="69" y="12" width="16" height="44" rx="3" fill="#1d4ed8" stroke="#172554" strokeWidth="1.5" />
            <text x="77" y="36" fontSize="9" fontWeight="bold" fill="#facc15" textAnchor="middle">12</text>

            {/* Ascending sort arrow over the blocks */}
            <path d="M 22 28 Q 50 14 75 6" fill="none" stroke="#facc15" strokeWidth="2.5" strokeDasharray="3 2" />
            <polygon points="73,3 80,6 74,10" fill="#facc15" />
          </g>
        );

      case 'processing_cycle':
      default:
        // วงจรการประมวลผลข้อมูล (Input -> Process -> Output)
        return (
          <g>
            {/* Input Box */}
            <rect x="6" y="20" width="24" height="24" rx="4" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
            <text x="18" y="35" fontSize="7" fontWeight="bold" fill="#082f49" textAnchor="middle">INPUT</text>

            {/* Arrow 1 */}
            <path d="M 32 32 L 39 32" stroke="#facc15" strokeWidth="2.5" />
            <polygon points="38,29 43,32 38,35" fill="#facc15" />

            {/* Process Cog / Gear Box */}
            <circle cx="53" cy="32" r="14" fill="#a855f7" stroke="#7e22ce" strokeWidth="2" />
            <circle cx="53" cy="32" r="6" fill="#1e1b4b" />
            <text x="53" y="34" fontSize="6" fontWeight="bold" fill="#ffffff" textAnchor="middle">CPU</text>

            {/* Arrow 2 */}
            <path d="M 68 32 L 75 32" stroke="#facc15" strokeWidth="2.5" />
            <polygon points="74,29 79,32 74,35" fill="#facc15" />

            {/* Output Box */}
            <rect x="78" y="20" width="20" height="24" rx="4" fill="#4ade80" stroke="#16a34a" strokeWidth="1.5" />
            <text x="88" y="35" fontSize="6.5" fontWeight="bold" fill="#052e16" textAnchor="middle">DATA</text>
          </g>
        );
    }
  };

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <svg
        width={dims.w}
        height={dims.h}
        viewBox={dims.viewBox}
        className="filter drop-shadow-md select-none transition-transform hover:scale-105"
      >
        {renderGraphic()}
      </svg>
      {title && (
        <span className="text-[10px] font-bold text-slate-200 mt-1 truncate max-w-[110px]">
          {title}
        </span>
      )}
    </div>
  );
};
