/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export type FlowchartShapeType =
  | 'terminal'      // เริ่มต้นและสิ้นสุด (Capsule)
  | 'process'       // การดำเนินงาน/ปฏิบัติงาน (Rectangle)
  | 'decision'      // การตัดสินใจ (Diamond)
  | 'input_output'  // รับข้อมูล/นำเข้า-ออกทั่วไป (Parallelogram)
  | 'display'       // แสดงผลทางจอภาพ (Display pencil/bullet)
  | 'manual_input'  // ป้อนค่าทางแป้นพิมพ์ (Sloped Trapezoid)
  | 'connector'     // จุดเชื่อมต่อ (Circle)
  | 'flow_line';    // ลูกศรแสดงทิศทาง (Arrows)

interface FlowchartSymbolGraphicProps {
  shape: FlowchartShapeType | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const FlowchartSymbolGraphic: React.FC<FlowchartSymbolGraphicProps> = ({
  shape,
  size = 'md',
  className = '',
  label,
}) => {
  const dims = {
    sm: { w: 90, h: 48, viewBox: '0 0 100 56' },
    md: { w: 120, h: 62, viewBox: '0 0 100 56' },
    lg: { w: 160, h: 84, viewBox: '0 0 100 56' },
  }[size];

  const renderShape = () => {
    switch (shape) {
      case 'terminal':
      case 'start_end':
      case 'begin_end':
        // Rounded capsule (เริ่มต้นและสิ้นสุด) - สีเหลือง/ทอง ตามรูปที่แนบ
        return (
          <g>
            <rect
              x="8"
              y="10"
              width="84"
              height="36"
              rx="18"
              ry="18"
              fill="#fbbf24"
              stroke="#d97706"
              strokeWidth="3.5"
            />
            {label && (
              <text
                x="50"
                y="33"
                textAnchor="middle"
                fontSize="11"
                fontWeight="bold"
                fill="#78350f"
                fontFamily="sans-serif"
              >
                {label}
              </text>
            )}
          </g>
        );

      case 'flow_line':
      case 'arrow':
        // Arrow lines (ลูกศรแสดงทิศทาง) - ตามรูปที่แนบ มีทั้งลูกศรลง ขึ้น ซ้าย ขวา
        return (
          <g stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Arrow Down */}
            <line x1="26" y1="12" x2="26" y2="44" />
            <polygon points="21,38 26,45 31,38" fill="#38bdf8" />

            {/* Arrow Up */}
            <line x1="42" y1="44" x2="42" y2="12" />
            <polygon points="37,18 42,11 47,18" fill="#38bdf8" />

            {/* Arrow Right */}
            <line x1="60" y1="20" x2="88" y2="20" />
            <polygon points="82,15 89,20 82,25" fill="#38bdf8" />

            {/* Arrow Left */}
            <line x1="88" y1="36" x2="60" y2="36" />
            <polygon points="66,31 59,36 66,41" fill="#38bdf8" />
          </g>
        );

      case 'process':
        // Rectangle (การดำเนินงาน / ปฏิบัติงาน) - สีเขียวตามรูปที่แนบ
        return (
          <g>
            <rect
              x="8"
              y="11"
              width="84"
              height="34"
              rx="2"
              ry="2"
              fill="#22c55e"
              stroke="#15803d"
              strokeWidth="3.5"
            />
            {label && (
              <text
                x="50"
                y="33"
                textAnchor="middle"
                fontSize="11"
                fontWeight="bold"
                fill="#052e16"
                fontFamily="sans-serif"
              >
                {label}
              </text>
            )}
          </g>
        );

      case 'input_output':
      case 'general_io':
        // Parallelogram (รับข้อมูล / นำเข้าหรือนำออกทั่วไป) - สีชมพู/ม่วงอ่อน ตามรูปที่แนบ
        return (
          <g>
            <polygon
              points="24,11 92,11 76,45 8,45"
              fill="#f472b6"
              stroke="#db2777"
              strokeWidth="3.5"
            />
            {label && (
              <text
                x="50"
                y="33"
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#701a75"
                fontFamily="sans-serif"
              >
                {label}
              </text>
            )}
          </g>
        );

      case 'display':
        // Display shape (แสดงผลทางจอภาพ) - หัวลูกศรแหลมซ้าย ท้ายมนขวา สีฟ้า ตามรูปที่แนบ
        return (
          <g>
            <path
              d="M 28 11 L 74 11 A 17 17 0 0 1 74 45 L 28 45 L 8 28 Z"
              fill="#38bdf8"
              stroke="#0284c7"
              strokeWidth="3.5"
            />
            {label && (
              <text
                x="52"
                y="33"
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#082f49"
                fontFamily="sans-serif"
              >
                {label}
              </text>
            )}
          </g>
        );

      case 'manual_input':
        // Manual Input (นำเข้าด้วยการป้อนค่าทางแป้นพิมพ์) - สี่เหลี่ยมคางหมูด้านบนเอียง สีส้ม/ชมพูพีช
        return (
          <g>
            <polygon
              points="8,23 92,11 92,45 8,45"
              fill="#fb7185"
              stroke="#e11d48"
              strokeWidth="3.5"
            />
            {label && (
              <text
                x="50"
                y="35"
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#4c0519"
                fontFamily="sans-serif"
              >
                {label}
              </text>
            )}
          </g>
        );

      case 'decision':
        // Rhombus / Diamond (การตัดสินใจ) - สี่เหลี่ยมข้าวหลามตัด สีม่วง/คราม ตามรูปที่แนบ
        return (
          <g>
            <polygon
              points="50,7 93,28 50,49 7,28"
              fill="#c084fc"
              stroke="#7e22ce"
              strokeWidth="3.5"
            />
            {label && (
              <text
                x="50"
                y="32"
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#3b0764"
                fontFamily="sans-serif"
              >
                {label}
              </text>
            )}
          </g>
        );

      case 'connector':
      case 'connection':
        // Circle (จุดเชื่อมต่อของผังงาน) - วงกลม สีแดง/ม่วง ตามรูปที่แนบ
        return (
          <g>
            <circle
              cx="50"
              cy="28"
              r="19"
              fill="#f43f5e"
              stroke="#be123c"
              strokeWidth="3.5"
            />
            {label && (
              <text
                x="50"
                y="32"
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#ffffff"
                fontFamily="sans-serif"
              >
                {label}
              </text>
            )}
          </g>
        );

      default:
        return (
          <rect
            x="10"
            y="12"
            width="80"
            height="32"
            rx="6"
            fill="#64748b"
            stroke="#94a3b8"
            strokeWidth="3"
          />
        );
    }
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg
        width={dims.w}
        height={dims.h}
        viewBox={dims.viewBox}
        className="filter drop-shadow-md select-none transition-transform hover:scale-105"
      >
        {renderShape()}
      </svg>
    </div>
  );
};
