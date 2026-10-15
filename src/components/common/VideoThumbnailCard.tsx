/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Play,
  Video,
  ExternalLink,
  Clock,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Edit3,
  MoveVertical,
  GripVertical,
  Trash2
} from 'lucide-react';
import { YouTubeVideo, Lesson } from '../../types';

interface VideoThumbnailCardProps {
  video: YouTubeVideo | (Lesson & { youtubeId?: string; duration?: string });
  isSelected?: boolean;
  onSelect: () => void;
  showChapterBadge?: boolean;
  orderNumber?: number;
  totalVideosCount?: number;
  isTeacher?: boolean;
  isReorderMode?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveToSlot?: (newSlot: number) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

const CHAPTER_FALLBACK_IMAGES: Record<number, string> = {
  1: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop',
  2: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop',
  3: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop',
  4: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600&auto=format&fit=crop',
  5: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop',
  6: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=600&auto=format&fit=crop',
};

export const VideoThumbnailCard: React.FC<VideoThumbnailCardProps> = ({
  video,
  isSelected = false,
  onSelect,
  showChapterBadge = true,
  orderNumber,
  totalVideosCount = 10,
  isTeacher = false,
  isReorderMode = false,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  onMoveToSlot,
  onEdit,
  onDelete,
  draggable = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragging = false,
  isDragOver = false,
}) => {
  const [imageError, setImageError] = useState(false);

  const youtubeId =
    ('youtubeId' in video && video.youtubeId) ||
    ('youtubeVideoId' in video && video.youtubeVideoId) ||
    'bI9oX3R9M5w';

  const duration =
    ('duration' in video && video.duration) ||
    ('videoDuration' in video && video.videoDuration) ||
    '12:00 น.';

  const primaryThumbnail =
    ('thumbnailUrl' in video && video.thumbnailUrl) ||
    `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;

  const fallbackImage =
    ('coverImageUrl' in video && video.coverImageUrl) ||
    CHAPTER_FALLBACK_IMAGES[video.chapterNumber] ||
    CHAPTER_FALLBACK_IMAGES[1];

  const currentImage = imageError ? fallbackImage : primaryThumbnail;
  const isHidden = 'isHidden' in video ? video.isHidden : false;
  const isFeatured = 'isFeatured' in video ? video.isFeatured : false;

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      className={`group relative rounded-2xl overflow-hidden border transition-all flex flex-col bg-slate-900 ${
        isDragging
          ? 'opacity-40 scale-95 border-amber-400 border-dashed ring-4 ring-amber-400/40'
          : isDragOver
          ? 'ring-4 ring-amber-400 border-amber-400 scale-105 shadow-2xl shadow-amber-500/30 bg-slate-800 z-10'
          : isSelected
          ? 'ring-2 ring-amber-400 border-amber-400/80 shadow-lg shadow-amber-500/20 bg-slate-850'
          : 'border-slate-800 hover:border-amber-500/50 hover:shadow-xl'
      } ${isReorderMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${isHidden ? 'opacity-60 grayscale-[40%]' : ''}`}
    >
      {/* Thumbnail Aspect Box */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
        <img
          src={currentImage}
          alt={video.title}
          referrerPolicy="no-referrer"
          onError={() => {
            if (!imageError) {
              setImageError(true);
            }
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />

        {/* Play Icon Center Button */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
              isSelected
                ? 'bg-amber-400 text-slate-950 scale-110'
                : 'bg-red-600/90 text-white group-hover:bg-red-500 group-hover:scale-110'
            }`}
          >
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
          <div className="flex items-center gap-1">
            {orderNumber !== undefined && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow flex items-center gap-1">
                {isReorderMode && <GripVertical className="w-3 h-3 text-slate-950" />}
                <span>#{orderNumber}</span>
              </span>
            )}
            {showChapterBadge && (
              <span className="px-2 py-0.5 rounded-md bg-slate-950/85 backdrop-blur-md border border-slate-700 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                บทที่ {video.chapterNumber}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isFeatured && (
              <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-bold shadow-sm flex items-center gap-1">
                ★ วิดีโอหลัก
              </span>
            )}
            <span className="px-2 py-0.5 rounded-md bg-rose-600/90 text-white text-[10px] font-bold shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Project 14
            </span>
          </div>
        </div>

        {/* Bottom Bar: Duration */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-800 text-[10px] font-mono text-slate-200 flex items-center gap-1 pointer-events-none">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>{duration}</span>
        </div>
      </div>

      {/* Teacher Reorder & Action Bar (แสดงตลอดเมื่อเป็นครู เพื่อให้เพิ่ม/ลบ/แก้ไข/จัดเรียงได้ทันที) */}
      {isTeacher && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`border-y px-3 py-2 flex items-center justify-between text-xs transition-colors ${
            isReorderMode
              ? 'bg-amber-950/90 border-amber-500/60 text-amber-300 ring-1 ring-amber-500/40'
              : 'bg-slate-950/90 border-slate-800 text-slate-300 hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[11px] text-amber-300">ลำดับ</span>
            {onMoveToSlot ? (
              <select
                value={orderNumber || 1}
                onChange={(e) => onMoveToSlot(Number(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-amber-500/50 rounded-lg px-2 py-0.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-300 cursor-pointer"
                title="เลือกสลับไปลำดับที่ต้องการ"
              >
                {Array.from({ length: totalVideosCount }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    #{num}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-amber-400 font-black">#{orderNumber || '-'}</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={!canMoveUp}
              onClick={onMoveUp}
              className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-slate-950 disabled:opacity-20 disabled:pointer-events-none transition-colors"
              title="เลื่อนขึ้นด้านบน (ย้ายลำดับขึ้น)"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={!canMoveDown}
              onClick={onMoveDown}
              className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-slate-950 disabled:opacity-20 disabled:pointer-events-none transition-colors"
              title="เลื่อนลงด้านล่าง (ย้ายลำดับลง)"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="p-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 text-white transition-colors ml-1 flex items-center gap-1 font-semibold text-[11px]"
                title="แก้ไขชื่อ/ลิงก์วิดีโอนี้"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">แก้ไข</span>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white transition-colors flex items-center gap-1 font-semibold text-[11px]"
                title="ลบคลิปวิดีโอนี้ออกจากระบบ"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ลบ</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Card Info */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-1.5">
        <div>
          <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-2 group-hover:text-amber-300 transition-colors font-['Chakra_Petch'] leading-snug">
            {video.title}
          </h4>
          {'description' in video && video.description && (
            <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
              {video.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
          <span className="text-amber-400/90 font-medium">วิทยาการคำนวณ ม.1</span>
          <span className="group-hover:text-amber-300 flex items-center gap-1">
            <span>ดูวิดีโอ</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
