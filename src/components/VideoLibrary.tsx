/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { Lesson, YouTubeVideo, User } from '../types';
import { StorageService } from '../services/storage';
import { VideoThumbnailCard } from './common/VideoThumbnailCard';
import {
  extractYouTubeId,
  toFullYouTubeUrl,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
} from '../utils/youtube';
import {
  Video,
  Play,
  Search,
  ExternalLink,
  BookOpen,
  Sparkles,
  Clock,
  Filter,
  CheckCircle2,
  Edit3,
  Save,
  Plus,
  X,
  AlertCircle,
  ArrowUpDown,
  MoveUp,
  MoveDown,
  RotateCcw,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Star,
  ListOrdered,
  GripVertical,
  Trash2,
  Lock,
  Unlock,
  ShieldCheck
} from 'lucide-react';

interface VideoLibraryProps {
  lessons: Lesson[];
  currentUser?: User | null;
  onSelectLesson: (lesson: Lesson) => void;
  onVideosUpdated?: () => void;
}

type SortOption = 'custom' | 'chapter-asc' | 'chapter-desc' | 'title-asc' | 'featured-first';

export const VideoLibrary: React.FC<VideoLibraryProps> = ({
  lessons,
  currentUser,
  onSelectLesson,
  onVideosUpdated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('custom');
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const theatreRef = useRef<HTMLDivElement>(null);

  // Drag and Drop State
  const [draggedVideoId, setDraggedVideoId] = useState<string | null>(null);
  const [dragOverVideoId, setDragOverVideoId] = useState<string | null>(null);

  // Dynamic stored videos state
  const [storedVideos, setStoredVideos] = useState<YouTubeVideo[]>(() => StorageService.getVideos());
  const [editingVideo, setEditingVideo] = useState<YouTubeVideo | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const isTeacher = currentUser?.role === 'teacher' || currentUser?.role === 'admin';

  // Format all videos into a unified array for listing
  const allVideoItems = useMemo(() => {
    // Start with stored videos as primary source
    const items = storedVideos.map((v, idx) => {
      const correspondingLesson = lessons.find((l) => l.chapterNumber === v.chapterNumber);
      return {
        id: v.id,
        chapterNumber: v.chapterNumber,
        title: v.title,
        description: v.description,
        youtubeId: v.youtubeId,
        duration: v.duration,
        thumbnailUrl: v.thumbnailUrl || getYouTubeThumbnailUrl(v.youtubeId),
        coverImageUrl: correspondingLesson?.coverImageUrl,
        ipstUrl: v.ipstUrl || 'https://proj14.ipst.ac.th/m1/m1-cs/',
        lessonRef: correspondingLesson,
        isFeatured: v.isFeatured ?? false,
        order: v.order !== undefined ? v.order : (idx + 1),
        isHidden: v.isHidden ?? false,
      };
    });

    // If there are chapters whose videos are completely missing from storedVideos, add them
    lessons.forEach((l) => {
      const hasChapterVid = items.some((it) => it.chapterNumber === l.chapterNumber);
      if (!hasChapterVid) {
        items.push({
          id: `lesson-vid-${l.id}`,
          chapterNumber: l.chapterNumber,
          title: l.videoTitle || `${l.title} (สสวท. Project 14)`,
          description: l.contentSummary || l.description,
          youtubeId: l.youtubeVideoId || 'bI9oX3R9M5w',
          duration: l.videoDuration || '12:00 น.',
          thumbnailUrl: getYouTubeThumbnailUrl(l.youtubeVideoId),
          coverImageUrl: l.coverImageUrl,
          ipstUrl: 'https://proj14.ipst.ac.th/m1/m1-cs/',
          lessonRef: l,
          isFeatured: true,
          order: items.length + 1,
          isHidden: false,
        });
      }
    });

    // Apply sorting
    return [...items].sort((a, b) => {
      if (sortBy === 'chapter-asc') {
        if (a.chapterNumber !== b.chapterNumber) return a.chapterNumber - b.chapterNumber;
        return (a.order || 0) - (b.order || 0);
      }
      if (sortBy === 'chapter-desc') {
        if (a.chapterNumber !== b.chapterNumber) return b.chapterNumber - a.chapterNumber;
        return (a.order || 0) - (b.order || 0);
      }
      if (sortBy === 'title-asc') {
        return a.title.localeCompare(b.title, 'th');
      }
      if (sortBy === 'featured-first') {
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        return (a.order || 0) - (b.order || 0);
      }
      // default: custom order
      return (a.order || 0) - (b.order || 0);
    });
  }, [lessons, storedVideos, sortBy]);

  const [activeVideo, setActiveVideo] = useState(allVideoItems[0] || null);

  // Sync active video if it becomes null or when allVideoItems loads
  React.useEffect(() => {
    if (!activeVideo && allVideoItems.length > 0) {
      setActiveVideo(allVideoItems[0]);
    } else if (activeVideo) {
      const found = allVideoItems.find((v) => v.id === activeVideo.id);
      if (found) {
        setActiveVideo(found);
      }
    }
  }, [allVideoItems]);

  const filteredVideos = useMemo(() => {
    return allVideoItems.filter((item) => {
      // If student and video is hidden, skip
      if (!isTeacher && item.isHidden) return false;
      const matchChapter =
        selectedChapter === 'all' || item.chapterNumber === selectedChapter;
      const matchQuery =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchChapter && matchQuery;
    });
  }, [allVideoItems, selectedChapter, searchQuery, isTeacher]);

  const getEmbedUrl = (youtubeId: string) => {
    return `https://www.youtube.com/embed/${extractYouTubeId(youtubeId)}?autoplay=0&rel=0`;
  };

  const handleSelectVideo = (video: typeof allVideoItems[0]) => {
    setActiveVideo(video);
    theatreRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Reorder by Drag and Drop
  const handleDragStart = (e: React.DragEvent, videoId: string) => {
    if (!isTeacher) return;
    setDraggedVideoId(videoId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', videoId);
  };

  const handleDragOver = (e: React.DragEvent, videoId: string) => {
    if (!isTeacher || !draggedVideoId || draggedVideoId === videoId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverVideoId !== videoId) {
      setDragOverVideoId(videoId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, videoId: string) => {
    if (dragOverVideoId === videoId) {
      setDragOverVideoId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetVideoId: string) => {
    e.preventDefault();
    setDragOverVideoId(null);
    const sourceId = draggedVideoId || e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetVideoId) {
      setDraggedVideoId(null);
      return;
    }

    const currentList = [...storedVideos].sort((a, b) => (a.order || 0) - (b.order || 0));
    const sourceIdx = currentList.findIndex((v) => v.id === sourceId);
    const targetIdx = currentList.findIndex((v) => v.id === targetVideoId);

    if (sourceIdx < 0 || targetIdx < 0) {
      setDraggedVideoId(null);
      return;
    }

    // Move source item to target index
    const [movedItem] = currentList.splice(sourceIdx, 1);
    currentList.splice(targetIdx, 0, movedItem);

    const reordered = StorageService.reorderVideos(currentList);
    setStoredVideos(reordered);
    setSortBy('custom');
    setDraggedVideoId(null);
    setFeedbackMsg(`ลากสลับตำแหน่ง "${movedItem.title}" เรียบร้อยแล้ว!`);
    setTimeout(() => setFeedbackMsg(null), 2500);
    onVideosUpdated?.();
  };

  const handleDragEnd = () => {
    setDraggedVideoId(null);
    setDragOverVideoId(null);
  };

  // Move video to exact slot number (1-based)
  const handleMoveToSlot = (videoId: string, targetSlot: number) => {
    const currentList = [...storedVideos].sort((a, b) => (a.order || 0) - (b.order || 0));
    const currentIdx = currentList.findIndex((v) => v.id === videoId);
    if (currentIdx < 0) return;

    const targetIdx = Math.max(0, Math.min(targetSlot - 1, currentList.length - 1));
    if (currentIdx === targetIdx) return;

    const [movedItem] = currentList.splice(currentIdx, 1);
    currentList.splice(targetIdx, 0, movedItem);

    const reordered = StorageService.reorderVideos(currentList);
    setStoredVideos(reordered);
    setSortBy('custom');
    setFeedbackMsg(`ย้าย "${movedItem.title}" ไปลำดับที่ #${targetSlot} สำเร็จ!`);
    setTimeout(() => setFeedbackMsg(null), 2500);
    onVideosUpdated?.();
  };

  // Move a video up or down
  const handleMoveVideo = (videoId: string, direction: 'up' | 'down') => {
    const currentList = [...storedVideos].sort((a, b) => (a.order || 0) - (b.order || 0));
    const idx = currentList.findIndex((v) => v.id === videoId);
    if (idx < 0) return;

    if (direction === 'up' && idx > 0) {
      const temp = currentList[idx];
      currentList[idx] = currentList[idx - 1];
      currentList[idx - 1] = temp;
    } else if (direction === 'down' && idx < currentList.length - 1) {
      const temp = currentList[idx];
      currentList[idx] = currentList[idx + 1];
      currentList[idx + 1] = temp;
    } else {
      return;
    }

    const reordered = StorageService.reorderVideos(currentList);
    setStoredVideos(reordered);
    setSortBy('custom');
    setFeedbackMsg(`ปรับลำดับวิดีโอสำเร็จแล้ว!`);
    setTimeout(() => setFeedbackMsg(null), 2500);
    onVideosUpdated?.();
  };

  // Move video to top or bottom
  const handleMoveToExtreme = (videoId: string, position: 'top' | 'bottom') => {
    const currentList = [...storedVideos].sort((a, b) => (a.order || 0) - (b.order || 0));
    const idx = currentList.findIndex((v) => v.id === videoId);
    if (idx < 0) return;

    const item = currentList.splice(idx, 1)[0];
    if (position === 'top') {
      currentList.unshift(item);
    } else {
      currentList.push(item);
    }

    const reordered = StorageService.reorderVideos(currentList);
    setStoredVideos(reordered);
    setSortBy('custom');
    setFeedbackMsg(`ย้ายวิดีโอไป${position === 'top' ? 'บนสุด' : 'ล่างสุด'}เรียบร้อย!`);
    setTimeout(() => setFeedbackMsg(null), 2500);
    onVideosUpdated?.();
  };

  // Reset ordering to default
  const handleResetOrder = () => {
    if (window.confirm('คุณครูต้องการคืนค่าลำดับวิดีโอทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่?')) {
      const reset = StorageService.resetVideosOrder();
      setStoredVideos(reset);
      setSortBy('custom');
      setFeedbackMsg('คืนค่าลำดับวิดีโอเริ่มต้นเรียบร้อยแล้ว!');
      setTimeout(() => setFeedbackMsg(null), 2500);
      onVideosUpdated?.();
    }
  };

  // Toggle Featured status
  const handleToggleFeatured = (vid: YouTubeVideo) => {
    let refreshed: YouTubeVideo[];
    if (!vid.isFeatured) {
      refreshed = StorageService.setFeaturedVideo(vid.id);
      setFeedbackMsg(`ตั้งคลิป "${vid.title}" เป็นวิดีโอหลักประจำบทที่ ${vid.chapterNumber} เรียบร้อย!`);
    } else {
      const updated: YouTubeVideo = {
        ...vid,
        isFeatured: false,
      };
      StorageService.updateVideo(updated);
      refreshed = StorageService.getVideos();
      setFeedbackMsg(`ยกเลิกวิดีโอหลักเรียบร้อย!`);
    }
    setStoredVideos(refreshed);
    setTimeout(() => setFeedbackMsg(null), 2500);
    onVideosUpdated?.();
  };

  // Open edit modal for the currently active video
  const handleStartEdit = (targetVideo?: typeof allVideoItems[0]) => {
    const vToEdit = targetVideo || activeVideo;
    if (!vToEdit) return;
    const existing = storedVideos.find((v) => v.id === vToEdit.id || v.youtubeId === vToEdit.youtubeId) || {
      id: vToEdit.id,
      chapterNumber: vToEdit.chapterNumber,
      title: vToEdit.title,
      description: vToEdit.description,
      youtubeId: vToEdit.youtubeId,
      duration: vToEdit.duration,
      thumbnailUrl: vToEdit.thumbnailUrl,
      ipstUrl: vToEdit.ipstUrl,
      isFeatured: vToEdit.isFeatured,
      order: vToEdit.order,
      isHidden: vToEdit.isHidden,
    };
    setEditingVideo({
      ...existing,
      youtubeId: toFullYouTubeUrl(existing.youtubeId),
    });
    setIsAddMode(false);
  };

  // Open modal to add a brand new video
  const handleStartAdd = () => {
    const ch = selectedChapter === 'all' ? 1 : selectedChapter;
    const nextOrder = Math.max(...storedVideos.map((v) => v.order || 0), 0) + 1;
    const newVid: YouTubeVideo = {
      id: `vid-${ch}-${Date.now()}`,
      chapterNumber: ch,
      title: `คลิปวิดีโอเสริม บทที่ ${ch}`,
      description: 'คำอธิบายคลิปวิดีโอการเรียนรู้',
      youtubeId: 'https://www.youtube.com/watch?v=bI9oX3R9M5w',
      duration: '10:00 นาที',
      thumbnailUrl: getYouTubeThumbnailUrl('bI9oX3R9M5w'),
      ipstUrl: 'https://proj14.ipst.ac.th/m1/m1-cs/',
      isFeatured: false,
      order: nextOrder,
    };
    setEditingVideo(newVid);
    setIsAddMode(true);
  };

  const handleSaveVideoModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;

    const cleanId = extractYouTubeId(editingVideo.youtubeId);
    const finalizedVideo: YouTubeVideo = {
      ...editingVideo,
      youtubeId: cleanId,
      thumbnailUrl: getYouTubeThumbnailUrl(cleanId),
    };

    if (isAddMode) {
      StorageService.addVideo(finalizedVideo);
    } else {
      StorageService.updateVideo(finalizedVideo);
    }

    if (finalizedVideo.isFeatured) {
      StorageService.setFeaturedVideo(finalizedVideo.id);
    }

    const refreshed = StorageService.getVideos();
    setStoredVideos(refreshed);
    setFeedbackMsg(`บันทึกวิดีโอ "${finalizedVideo.title}" สำเร็จเรียบร้อย!`);
    setTimeout(() => setFeedbackMsg(null), 3000);

    onVideosUpdated?.();
    setEditingVideo(null);
  };

  const handleDeleteVideo = (videoId: string, videoTitle?: string) => {
    if (!isTeacher) return;
    const confirmed = window.confirm(
      `คุณครูต้องการลบคลิปวิดีโอ "${videoTitle || 'นี้'}" ออกจากระบบใช่หรือไม่?\n(การกระทำนี้จะลบคลิปออกจากเพลย์ลิสต์และคลังวิดีโอ)`
    );
    if (!confirmed) return;

    StorageService.deleteVideo(videoId);
    const refreshed = StorageService.getVideos();
    setStoredVideos(refreshed);

    if (activeVideo?.id === videoId) {
      const remaining = refreshed[0];
      if (remaining) {
        setActiveVideo({
          ...remaining,
          thumbnailUrl: remaining.thumbnailUrl || getYouTubeThumbnailUrl(remaining.youtubeId),
          order: remaining.order || 1,
          isFeatured: remaining.isFeatured ?? false,
          isHidden: remaining.isHidden ?? false,
        } as any);
      }
    }

    if (editingVideo?.id === videoId) {
      setEditingVideo(null);
    }

    setFeedbackMsg(`ลบคลิปวิดีโอ "${videoTitle || ''}" สำเร็จเรียบร้อย!`);
    setTimeout(() => setFeedbackMsg(null), 3000);
    onVideosUpdated?.();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
            <Video className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold">
                OFFICIAL IPST PROJECT 14
              </span>
              <span className="text-xs text-slate-400">• วิดีโอสอน ม.1 ครบ 6 บท ({allVideoItems.length} คลิป)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Chakra_Petch'] mt-1">
              คลังวิดีโอการเรียนรู้ สสวท. Project 14
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              รวมคลิปการสอน ภาพ และตัวอย่างประกอบหนังสือเรียน สสวท. ชั้นมัธยมศึกษาปีที่ 1 (ลาก-สลับลำดับคลิปได้อิสระ)
            </p>
          </div>
        </div>

        {/* Action Controls & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto flex-wrap">
          {isTeacher && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsReorderMode(!isReorderMode)}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
                  isReorderMode
                    ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 scale-105'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                }`}
                title="เปิด/ปิดโหมดจัดลำดับวิดีโอ (ลากสลับตำแหน่งได้ทันที)"
              >
                <ArrowUpDown className="w-4 h-4" />
                <span>{isReorderMode ? 'ออกจากโหมดลากจัดเรียง' : 'โหมดลาก/จัดลำดับวิดีโอ'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowReorderModal(true)}
                className="px-3.5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md hover:scale-105 shrink-0"
                title="เปิดหน้าต่างจัดการลำดับวิดีโอทั้งหมด"
              >
                <ListOrdered className="w-4 h-4" />
                <span>จัดการลำดับรวม</span>
              </button>

              <button
                onClick={handleStartAdd}
                className="px-3.5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-lg hover:scale-105 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มวิดีโอ</span>
              </button>
            </div>
          )}

          <a
            id="video-read-textbook-btn"
            href="https://pubhtml5.com/ztml/rbqf/"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 shrink-0"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>หนังสือเรียน ม.1</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          </a>

          {/* Search Bar */}
          <div className="relative w-full md:w-56">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อคลิป, บทเรียน..."
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Teacher Mode Status & Action Bar (เฉพาะคุณครูและแอดมินเท่านั้น) */}
      {isTeacher && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-emerald-950/60 to-slate-900 border border-emerald-500/50 rounded-3xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  โหมดคุณครูจัดการวิดีโอเปิดใช้งานอยู่ (Teacher Video Management)
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  • มีปุ่ม [แก้ไข] [ลบ] [เลื่อนลำดับ] [ลากสลับ] บนทุกคลิป
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                คุณครูสามารถกด <strong>"+ เพิ่มวิดีโอใหม่"</strong>, กดแก้ไข/ลบที่การ์ดแต่ละคลิป หรือเปิดโหมดลากสลับลำดับคลิปได้อิสระ
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              type="button"
              onClick={handleStartAdd}
              className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่มวิดีโอใหม่</span>
            </button>

            <button
              type="button"
              onClick={() => setIsReorderMode(!isReorderMode)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                isReorderMode
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 scale-105'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
              }`}
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>{isReorderMode ? 'ออกจากโหมดลากจัดเรียง' : 'โหมดลากสลับลำดับ'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowReorderModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition-transform hover:scale-105 shrink-0 cursor-pointer"
            >
              <ListOrdered className="w-4 h-4" />
              <span>ตารางจัดการลำดับรวม ({allVideoItems.length})</span>
            </button>

            <button
              type="button"
              onClick={handleResetOrder}
              className="px-3 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="คืนค่าการเรียงลำดับกลับสู่ค่าเริ่มต้นของหลักสูตร"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>คืนค่าเริ่มต้น</span>
            </button>
          </div>
        </div>
      )}

      {/* Teacher Reorder Mode Active Notification Bar */}
      {isTeacher && isReorderMode && (
        <div className="p-4 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center shrink-0 shadow animate-bounce">
              <GripVertical className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-300 font-['Chakra_Petch'] flex items-center gap-2">
                <span>คุณครูสามารถคลิกลากคลิปวิดีโอ (Drag & Drop) ไปมาเพื่อสลับตำแหน่งได้ทันที!</span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                • ลากการ์ดวิดีโอหรือคลิปในเพลย์ลิสต์ไปวางทับตำแหน่งที่ต้องการ • หรือใช้ปุ่มเลื่อนขึ้น/ลง / เลือกหมายเลขลำดับจากเมนู Dropdown
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setShowReorderModal(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>เปิดตารางสลับลำดับ</span>
            </button>
            <button
              type="button"
              onClick={handleResetOrder}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>คืนค่าเริ่มต้น</span>
            </button>
          </div>
        </div>
      )}

      {/* Save Success Alert Banner */}
      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center gap-2.5 text-emerald-300 text-xs font-semibold shadow-lg animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Main Video Theatre Player View */}
      {activeVideo && (
        <div
          ref={theatreRef}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl"
        >
          {/* Main Player Screen (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
              <iframe
                src={getEmbedUrl(activeVideo.youtubeId)}
                title={activeVideo.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    บทที่ {activeVideo.chapterNumber}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500 text-slate-950">
                    ลำดับที่ #{activeVideo.order || 1}
                  </span>
                  {activeVideo.isFeatured && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-600 text-white flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      วิดีโอหลัก
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-mono">
                    ความยาว: {activeVideo.duration}
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    เนื้อหาตามหลักสูตร
                  </span>
                </div>
                <h3 className="font-bold text-lg sm:text-xl text-white font-['Chakra_Petch']">
                  {activeVideo.title}
                </h3>
                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                  {activeVideo.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {isTeacher && (
                  <>
                    <button
                      onClick={() => handleStartEdit(activeVideo)}
                      className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md hover:scale-105"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>ครูผู้สอน: แก้ไขคลิปนี้</span>
                    </button>
                    <button
                      onClick={() => handleDeleteVideo(activeVideo.id, activeVideo.title)}
                      className="px-3.5 py-2.5 bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                      title="ลบคลิปวิดีโอนี้ออกจากระบบ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบคลิป</span>
                    </button>
                    <button
                      onClick={() => handleMoveVideo(activeVideo.id, 'up')}
                      className="px-3 py-2.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-700"
                      title="เลื่อนคลิปนี้ขึ้น 1 ลำดับ"
                    >
                      <ChevronUp className="w-4 h-4" />
                      <span>เลื่อนขึ้น</span>
                    </button>
                    <button
                      onClick={() => handleMoveVideo(activeVideo.id, 'down')}
                      className="px-3 py-2.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-700"
                      title="เลื่อนคลิปนี้ลง 1 ลำดับ"
                    >
                      <ChevronDown className="w-4 h-4" />
                      <span>เลื่อนลง</span>
                    </button>
                    <button
                      onClick={() => handleToggleFeatured(activeVideo as any)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors border ${
                        activeVideo.isFeatured
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                      title="ตั้ง/ยกเลิกเป็นวิดีโอหลักประจำบท"
                    >
                      <Star className={`w-3.5 h-3.5 ${activeVideo.isFeatured ? 'fill-amber-400 text-amber-400' : ''}`} />
                      <span>{activeVideo.isFeatured ? 'วิดีโอหลัก' : 'ตั้งเป็นคลิปหลัก'}</span>
                    </button>
                  </>
                )}
                <a
                  href={`https://www.youtube.com/watch?v=${activeVideo.youtubeId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors border border-slate-700"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>เปิดดูใน YouTube</span>
                </a>
                {activeVideo.lessonRef && (
                  <button
                    onClick={() => {
                      if (StorageService.isChapterLockedForUser(activeVideo.chapterNumber, currentUser || null)) {
                        alert(`บทเรียนที่ ${activeVideo.chapterNumber} ถูกล็อคโดยคุณครูผู้สอนสำหรับการจัดการเรียนรู้ในห้องเรียน\n(ยังไม่ถึงเนื้อหาที่ครูกำหนด)`);
                        return;
                      }
                      onSelectLesson(activeVideo.lessonRef!);
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-md hover:scale-105"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>ไปลุยด่านบทนี้</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Playlist Sidebar (4 Cols) with Drag & Drop */}
          <div className="lg:col-span-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                เพลย์ลิสต์บทเรียน ({allVideoItems.length} คลิป)
              </span>
              {isTeacher && (
                <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                  <GripVertical className="w-3 h-3" />
                  <span>ลากสลับได้</span>
                </span>
              )}
            </div>

            <div className="space-y-2.5 flex-1 max-h-[520px] overflow-y-auto pr-1">
              {allVideoItems.map((item, idx) => {
                const isSelected = activeVideo.id === item.id;
                const isDragging = draggedVideoId === item.id;
                const isDragOver = dragOverVideoId === item.id;

                return (
                  <div
                    key={item.id}
                    draggable={isTeacher}
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onDragOver={(e) => handleDragOver(e, item.id)}
                    onDragLeave={(e) => handleDragLeave(e, item.id)}
                    onDrop={(e) => handleDrop(e, item.id)}
                    onDragEnd={handleDragEnd}
                    className={`w-full rounded-2xl border transition-all flex items-center gap-2 p-2 ${
                      isDragging
                        ? 'opacity-40 scale-95 border-amber-400 border-dashed bg-slate-900 ring-2 ring-amber-400'
                        : isDragOver
                        ? 'ring-2 ring-amber-400 border-amber-400 scale-[1.02] shadow-xl bg-slate-800'
                        : isSelected
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-slate-950/80 border-slate-800/90 hover:border-slate-700 hover:bg-slate-850 text-slate-300'
                    } ${isTeacher ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  >
                    {/* Drag Handle & Order Controls for Teacher */}
                    {isTeacher && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex flex-col items-center gap-0.5 shrink-0 px-1 border-r border-slate-800"
                      >
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveVideo(item.id, 'up')}
                          className="p-1 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 disabled:opacity-20 transition-colors"
                          title="เลื่อนขึ้น"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] font-bold text-amber-400 font-mono flex items-center">
                          <GripVertical className="w-3 h-3 text-amber-400/80" />
                          #{item.order || idx + 1}
                        </span>
                        <button
                          type="button"
                          disabled={idx === allVideoItems.length - 1}
                          onClick={() => handleMoveVideo(item.id, 'down')}
                          className="p-1 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 disabled:opacity-20 transition-colors"
                          title="เลื่อนลง"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => handleSelectVideo(item)}
                      className="flex-1 text-left flex items-start gap-2.5 min-w-0"
                    >
                      {/* Tiny Thumbnail */}
                      <div className="w-20 aspect-video rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 relative overflow-hidden group">
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            if (item.coverImageUrl) {
                              (e.target as HTMLImageElement).src = item.coverImageUrl;
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                          <Play className={`w-4 h-4 ${isSelected ? 'text-amber-400 fill-amber-400' : 'text-white fill-white'}`} />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-amber-400 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <span>บทที่ {item.chapterNumber}</span>
                            {item.isFeatured && <span className="text-rose-400 font-bold">★ หลัก</span>}
                          </span>
                          <span className="font-mono text-slate-400">{item.duration}</span>
                        </div>
                        <div className="text-xs font-semibold text-white truncate mt-0.5 hover:text-amber-300 transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {item.description}
                        </div>
                      </div>
                    </button>

                    {isTeacher && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex flex-col items-center gap-1 shrink-0 pl-1"
                      >
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item as any)}
                          className="p-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors"
                          title="แก้ไขชื่อหรือลิงก์วิดีโอนี้"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVideo(item.id, item.title)}
                          className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white transition-colors"
                          title="ลบคลิปวิดีโอนี้"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Chapter Filter & Sort Controls Bar */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-900/80 p-4 border border-slate-800 rounded-2xl">
          {/* Chapter Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs sm:text-sm font-bold text-white font-['Chakra_Petch'] mr-1">
              เลือกดูตามบทเรียน:
            </span>

            <button
              onClick={() => setSelectedChapter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedChapter === 'all'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              ทั้งหมด ({allVideoItems.length})
            </button>
            {[1, 2, 3, 4, 5, 6].map((ch) => (
              <button
                key={ch}
                onClick={() => setSelectedChapter(ch)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedChapter === ch
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                บทที่ {ch}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-semibold">เรียงลำดับ:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-400"
            >
              <option value="custom">ตามลำดับที่คุณครูกำหนด (Custom Order)</option>
              <option value="chapter-asc">ตามบทเรียน (บทที่ 1 → 6)</option>
              <option value="chapter-desc">ตามบทเรียนย้อนกลับ (บทที่ 6 → 1)</option>
              <option value="title-asc">ตามชื่อวิดีโอ (ก-ฮ / A-Z)</option>
              <option value="featured-first">วิดีโอหลักขึ้นก่อน (Featured First)</option>
            </select>
          </div>
        </div>

        {/* Video Thumbnail Grid with Drag and Drop Support */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVideos.map((vid, vIdx) => (
            <VideoThumbnailCard
              key={vid.id}
              video={vid as any}
              isSelected={activeVideo?.id === vid.id}
              onSelect={() => handleSelectVideo(vid)}
              orderNumber={vid.order || vIdx + 1}
              totalVideosCount={storedVideos.length}
              isTeacher={isTeacher}
              isReorderMode={isReorderMode || isTeacher}
              canMoveUp={vIdx > 0}
              canMoveDown={vIdx < filteredVideos.length - 1}
              onMoveUp={() => handleMoveVideo(vid.id, 'up')}
              onMoveDown={() => handleMoveVideo(vid.id, 'down')}
              onMoveToSlot={(slot) => handleMoveToSlot(vid.id, slot)}
              onEdit={() => handleStartEdit(vid)}
              onDelete={() => handleDeleteVideo(vid.id, vid.title)}
              draggable={isTeacher}
              onDragStart={(e) => handleDragStart(e, vid.id)}
              onDragOver={(e) => handleDragOver(e, vid.id)}
              onDragLeave={(e) => handleDragLeave(e, vid.id)}
              onDrop={(e) => handleDrop(e, vid.id)}
              onDragEnd={handleDragEnd}
              isDragging={draggedVideoId === vid.id}
              isDragOver={dragOverVideoId === vid.id}
            />
          ))}
        </div>

        {filteredVideos.length === 0 && (
          <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
            <Video className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              ไม่พบวิดีโอที่ตรงกับคำค้นหา "{searchQuery}"
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedChapter('all');
              }}
              className="mt-3 text-xs text-amber-400 hover:underline"
            >
              ล้างตัวกรองและแสดงทั้งหมด
            </button>
          </div>
        )}
      </div>

      {/* FULL REORDER MANAGER MODAL (สำหรับครูจัดลำดับและลากสลับทั้งหมด) */}
      {showReorderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 max-w-3xl w-full shadow-2xl text-left space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <ListOrdered className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white font-['Chakra_Petch'] flex items-center gap-2">
                    <span>จัดการจัดเรียงลำดับเมนูวิดีโอ (Video Order Manager)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    คลิกลากแถบ <span className="text-amber-400 font-bold">⠿</span> เพื่อสลับตำแหน่งได้ทันที หรือเลือกตำแหน่งเป้าหมาย
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReorderModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs shrink-0 flex-wrap gap-2">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>จำนวนคลิปทั้งหมด: <b className="text-amber-300">{storedVideos.length}</b> คลิป (ลากสลับตำแหน่งได้)</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetOrder}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>คืนค่าลำดับเริ่มต้น</span>
                </button>
              </div>
            </div>

            {/* Video List Table with Drag & Drop */}
            <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
              {storedVideos
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((item, idx, arr) => {
                  const isDragging = draggedVideoId === item.id;
                  const isDragOver = dragOverVideoId === item.id;

                  return (
                    <div
                      key={item.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onDragOver={(e) => handleDragOver(e, item.id)}
                      onDragLeave={(e) => handleDragLeave(e, item.id)}
                      onDrop={(e) => handleDrop(e, item.id)}
                      onDragEnd={handleDragEnd}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all cursor-grab active:cursor-grabbing ${
                        isDragging
                          ? 'opacity-40 scale-95 border-amber-400 border-dashed bg-slate-950'
                          : isDragOver
                          ? 'border-amber-400 bg-amber-500/20 scale-[1.02] shadow-xl ring-2 ring-amber-400'
                          : 'bg-slate-950 border-slate-800 hover:border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Drag Handle & Order Badge */}
                        <div className="flex items-center gap-1 shrink-0">
                          <div className="p-1 rounded text-slate-500 hover:text-amber-400">
                            <GripVertical className="w-5 h-5 text-amber-400/80" />
                          </div>
                          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow">
                            #{idx + 1}
                          </div>
                        </div>

                        {/* Thumbnail Preview */}
                        <div className="w-16 aspect-video rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-800">
                          <img
                            src={item.thumbnailUrl || `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              บทที่ {item.chapterNumber}
                            </span>
                            {item.isFeatured && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-600/90 text-white flex items-center gap-1">
                                ★ วิดีโอหลัก
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.duration}
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
                            {item.title}
                          </h4>
                        </div>
                      </div>

                      {/* Action Buttons & Quick Slot Selector */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 shrink-0"
                      >
                        {/* Slot Selector */}
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold mr-1">
                          <span className="hidden sm:inline">ย้ายไป:</span>
                          <select
                            value={idx + 1}
                            onChange={(e) => handleMoveToSlot(item.id, Number(e.target.value))}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                          >
                            {arr.map((_, i) => (
                              <option key={i + 1} value={i + 1}>
                                #{i + 1}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveToExtreme(item.id, 'top')}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 disabled:opacity-20 text-[10px] font-bold transition-colors hidden sm:block"
                          title="ย้ายไปบนสุด"
                        >
                          บนสุด
                        </button>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveVideo(item.id, 'up')}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 disabled:opacity-20 transition-colors"
                          title="เลื่อนขึ้น 1 ตำแหน่ง"
                        >
                          <MoveUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === arr.length - 1}
                          onClick={() => handleMoveVideo(item.id, 'down')}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 disabled:opacity-20 transition-colors"
                          title="เลื่อนลง 1 ตำแหน่ง"
                        >
                          <MoveDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === arr.length - 1}
                          onClick={() => handleMoveToExtreme(item.id, 'bottom')}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 disabled:opacity-20 text-[10px] font-bold transition-colors hidden sm:block"
                          title="ย้ายไปล่างสุด"
                        >
                          ล่างสุด
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(item)}
                          className={`p-1.5 rounded-lg transition-colors ml-1 ${
                            item.isFeatured
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-800 text-slate-400 hover:text-amber-300'
                          }`}
                          title="ตั้ง/ยกเลิกเป็นวิดีโอหลัก"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowReorderModal(false);
                            handleStartEdit(item as any);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="แก้ไขข้อมูล"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVideo(item.id, item.title)}
                          className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition-colors ml-1"
                          title="ลบคลิปวิดีโอนี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400">
                ✓ ลำดับถูกบันทึกอัตโนมัติลงในฐานข้อมูล
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowReorderModal(false);
                  setFeedbackMsg('บันทึกการจัดเรียงลำดับวิดีโอเรียบร้อย!');
                  setTimeout(() => setFeedbackMsg(null), 2500);
                }}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg transition-transform hover:scale-105 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>เสร็จสิ้นการจัดลำดับ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Video Edit/Add Modal */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl text-left space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white font-['Chakra_Petch']">
                    {isAddMode ? 'ครูผู้สอน: เพิ่มคลิปวิดีโอใหม่' : 'ครูผู้สอน: แก้ไขวิดีโอคลิปนี้'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    ปรับปรุงลิงก์ YouTube, ลำดับการแสดงผล, ชื่อคลิป และรายละเอียดเนื้อหา
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingVideo(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVideoModal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    ชื่อคลิปวิดีโอ
                  </label>
                  <input
                    type="text"
                    required
                    value={editingVideo.title}
                    onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    บทเรียนที่
                  </label>
                  <select
                    value={editingVideo.chapterNumber}
                    onChange={(e) => setEditingVideo({ ...editingVideo, chapterNumber: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map((ch) => (
                      <option key={ch} value={ch}>
                        บทที่ {ch}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    ลำดับการแสดง
                  </label>
                  <input
                    type="number"
                    value={editingVideo.order || 1}
                    onChange={(e) => setEditingVideo({ ...editingVideo, order: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-amber-300 font-bold focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    ลิงก์คลิปวิดีโอ YouTube (วางลิงก์เต็มได้โดยตรง)
                  </label>
                  <input
                    type="text"
                    required
                    value={editingVideo.youtubeId}
                    onChange={(e) => setEditingVideo({ ...editingVideo, youtubeId: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=... หรือ https://youtu.be/..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-rose-300 focus:outline-none focus:border-rose-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    วางลิงก์ YouTube ที่คัดลอกจากแถบ URL เบราว์เซอร์ หรือปุ่มแชร์ได้ทันที
                  </span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    ความยาวคลิป
                  </label>
                  <input
                    type="text"
                    value={editingVideo.duration}
                    onChange={(e) => setEditingVideo({ ...editingVideo, duration: e.target.value })}
                    placeholder="เช่น 12:45 นาที"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                <label className="flex items-center gap-2 text-xs font-semibold text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editingVideo.isFeatured ?? false}
                    onChange={(e) => setEditingVideo({ ...editingVideo, isFeatured: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span>⭐ ตั้งเป็นวิดีโอหลักประจำบทที่ {editingVideo.chapterNumber} (Featured Main Video)</span>
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  คำอธิบายเนื้อหาวิดีโอ
                </label>
                <textarea
                  rows={3}
                  value={editingVideo.description}
                  onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500 leading-relaxed"
                />
              </div>

              {/* Live Preview in Modal */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-[11px] text-rose-400 font-bold">
                  <span>ตัวอย่างวิดีโอสด:</span>
                  <span className="font-mono text-slate-400">ID: {extractYouTubeId(editingVideo.youtubeId)}</span>
                </div>
                <div className="aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                  <iframe
                    src={getYouTubeEmbedUrl(editingVideo.youtubeId)}
                    title="Preview"
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
                {!isAddMode ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteVideo(editingVideo.id, editingVideo.title)}
                    className="px-4 py-2 bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบคลิปวิดีโอนี้</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingVideo(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>บันทึกวิดีโอ</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
