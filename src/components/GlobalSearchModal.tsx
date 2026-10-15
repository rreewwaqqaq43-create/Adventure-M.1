/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Lesson, YouTubeVideo, Worksheet } from '../types';
import { StorageService } from '../services/storage';
import {
  Search,
  X,
  BookOpen,
  Video,
  Gamepad2,
  FileCheck,
  FileText,
  ExternalLink,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Tag,
  CornerDownLeft,
  Flame
} from 'lucide-react';

export interface SearchResultItem {
  id: string;
  type: 'lesson' | 'video' | 'game' | 'worksheet' | 'quiz' | 'external';
  title: string;
  subtitle: string;
  chapterNumber?: number;
  tags?: string[];
  badgeText?: string;
  matchReason?: string;
  targetLesson?: Lesson;
  targetTab?: 'content' | 'video' | 'game' | 'quiz' | 'worksheet';
  targetVideo?: YouTubeVideo;
  externalUrl?: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: Lesson[];
  onOpenLesson: (lesson: Lesson, tab?: 'content' | 'video' | 'game' | 'quiz' | 'worksheet') => void;
  onOpenVideoView: (video?: YouTubeVideo) => void;
}

const POPULAR_SEARCH_TAGS = [
  'อัลกอริทึม',
  'ผังงาน Flowchart',
  'การเขียนโปรแกรม Scratch',
  'ภาษา Python',
  'ข้อมูลปฐมภูมิและทุติยภูมิ',
  'Binary Search (การค้นหาทวิภาค)',
  'การเรียงลำดับ Bubble Sort',
  'ความปลอดภัยไซเบอร์',
  'พ.ร.บ.คอมพิวเตอร์',
  'Digital Footprint',
];

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  lessons,
  onOpenLesson,
  onOpenVideoView,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'lesson' | 'video' | 'game' | 'worksheet' | 'quiz'
  >('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global Keyboard shortcuts: Escape to close, Arrows to navigate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Build searchable index from storage & lessons
  const allSearchableItems: SearchResultItem[] = useMemo(() => {
    const items: SearchResultItem[] = [];
    const allVideos = StorageService.getVideos();
    const allQuizzes = StorageService.getQuizzes();
    const allWorksheets = StorageService.getWorksheets();

    // 1. Lessons & Chapters
    lessons.forEach((l) => {
      items.push({
        id: `lesson-${l.id}`,
        type: 'lesson',
        title: `บทที่ ${l.chapterNumber}: ${l.title}`,
        subtitle: l.description,
        chapterNumber: l.chapterNumber,
        badgeText: `บทเรียน สสวท. • ${l.videoDuration || '20 นาที'}`,
        tags: [
          `บทที่ ${l.chapterNumber}`,
          `บทที่${l.chapterNumber}`,
          `ด่านที่ ${l.chapterNumber}`,
          'เนื้อหาบทเรียน',
          'สรุปความรู้',
          ...(l.topics || []),
        ],
        targetLesson: l,
        targetTab: 'content',
      });

      // 2. Mini-Games per chapter
      const gameNames: Record<number, { name: string; desc: string }> = {
        1: {
          name: 'มินิเกมฝึกคิดแก้ปัญหา (Problem Solving Flow)',
          desc: 'ฝึกกระบวนการแก้ปัญหา 4 ขั้นตอน วิเคราะห์โจทย์ วางแผน และตรวจสอบผลลัพธ์',
        },
        2: {
          name: 'เกมต่อบล็อกผังงาน (Flowchart Logic Builder)',
          desc: 'ลากวางสัญลักษณ์ผังงานและบล็อกคำสั่ง Scratch เพื่อพาตัวละครไปถึงเป้าหมาย',
        },
        3: {
          name: 'มินิเกมเขียนโค้ดผจญภัย (Python Variable Adventure)',
          desc: 'ฝึกฝนตัวแปร ชนิดข้อมูล เงื่อนไข if-else และการวนซ้ำแบบ Interactive',
        },
        4: {
          name: 'เกมจัดระเบียบข้อมูลกู้โลก (Data Master: Binary Search & Sort)',
          desc: 'เรียนรู้ขั้นตอนวิธีค้นหาแบบแบ่งครึ่ง Binary Search และการจัดเรียง Bubble Sort',
        },
        5: {
          name: 'เกมจับคู่ปริศนาข้อมูลและการประมวลผล (Data Puzzle Matching)',
          desc: 'จับคู่ภาพและแนวคิดข้อมูล ปฐมภูมิ ทุติยภูมิ แหล่งข้อมูล และการวิเคราะห์สารสนเทศ',
        },
        6: {
          name: 'เกมผู้พิทักษ์ความปลอดภัยไซเบอร์ (Cyber Defender Shield)',
          desc: 'จำลองการป้องกันภัยคุกคามออนไลน์ ฟิชชิ่ง มัลแวร์ และกฎหมาย พ.ร.บ.คอมพิวเตอร์',
        },
      };

      const gameInfo = gameNames[l.chapterNumber] || {
        name: `มินิเกมโต้ตอบ บทที่ ${l.chapterNumber}`,
        desc: 'เกมฝึกทักษะและเสริมสร้างกระบวนการคิดเชิงคำนวณ',
      };

      items.push({
        id: `game-${l.id}`,
        type: 'game',
        title: `🎮 ${gameInfo.name}`,
        subtitle: `${gameInfo.desc} (ประจำบทที่ ${l.chapterNumber})`,
        chapterNumber: l.chapterNumber,
        badgeText: 'มินิเกมแบบโต้ตอบ',
        tags: [
          'มินิเกม',
          'เกม',
          'เกมฝึกทักษะ',
          'โค้ดดิ้ง',
          'scratch',
          'python',
          'flowchart',
          'binary search',
          'cyber defender',
          `เกมบทที่ ${l.chapterNumber}`,
        ],
        targetLesson: l,
        targetTab: 'game',
      });
    });

    // 3. Videos
    allVideos.forEach((v) => {
      const matchLesson = lessons.find((l) => l.chapterNumber === v.chapterNumber);
      items.push({
        id: `vid-${v.id}`,
        type: 'video',
        title: `🎥 ${v.title}`,
        subtitle: v.description || `วิดีโอคลิปการสอน สสวท. Project 14 (บทที่ ${v.chapterNumber || 'ทั่วไป'})`,
        chapterNumber: v.chapterNumber,
        badgeText: `วิดีโอ สสวท. • บทที่ ${v.chapterNumber || 'ทั่วไป'}`,
        tags: [
          'วิดีโอ',
          'คลิป',
          'youtube',
          'project 14',
          'สสวท',
          `วิดีโอบทที่ ${v.chapterNumber}`,
          v.category || '',
        ],
        targetLesson: matchLesson,
        targetVideo: v,
        targetTab: 'video',
      });
    });

    // 4. Worksheets
    allWorksheets.forEach((ws) => {
      const matchLesson = lessons.find((l) => l.chapterNumber === ws.chapterNumber);
      const taskSummary = ws.tasks?.map((t) => t.question).join(' ') || '';
      items.push({
        id: `ws-${ws.id}`,
        type: 'worksheet',
        title: `📝 ${ws.title}`,
        subtitle: `${ws.description || ''} • คะแนนเต็ม ${ws.maxScore} คะแนน`,
        chapterNumber: ws.chapterNumber,
        badgeText: `ใบงานเก็บคะแนน • บทที่ ${ws.chapterNumber}`,
        tags: [
          'ใบงาน',
          'การบ้าน',
          'แบบฝึกหัด',
          'ส่งงาน',
          `ใบงานบทที่ ${ws.chapterNumber}`,
          taskSummary,
        ],
        targetLesson: matchLesson,
        targetTab: 'worksheet',
      });
    });

    // 5. Quizzes & Tests
    allQuizzes.forEach((q) => {
      const matchLesson = lessons.find((l) => l.chapterNumber === q.chapterNumber);
      const questionCount = q.questions?.length || 5;
      items.push({
        id: `quiz-${q.id}`,
        type: 'quiz',
        title: `❓ ${q.title}`,
        subtitle: `${q.type === 'pre_test' ? 'แบบทดสอบก่อนเรียน' : 'แบบทดสอบวัดผลสัมฤทธิ์ทางการเรียน'} (${questionCount} ข้อ)`,
        chapterNumber: matchLesson?.chapterNumber,
        badgeText: q.type === 'pre_test' ? 'แบบทดสอบก่อนเรียน' : 'แบบทดสอบหลังเรียน',
        tags: [
          'ข้อสอบ',
          'แบบทดสอบ',
          'quiz',
          'pre-test',
          'post-test',
          'วัดผล',
          ...(q.questions?.map((qu) => qu.question) || []),
        ],
        targetLesson: matchLesson,
        targetTab: 'quiz',
      });
    });

    // 6. E-Book & External Learning Portal
    items.push({
      id: 'ext-ebook',
      type: 'external',
      title: '📖 หนังสือเรียนรายวิชาพื้นฐานวิทยาศาสตร์และเทคโนโลยี (วิทยาการคำนวณ) ม.1 ฉบับ E-Book',
      subtitle: 'เปิดอ่านหนังสือเรียนหลักสูตร สสวท. ม.1 เล่มเต็มออนไลน์ (PubHTML5)',
      badgeText: 'หนังสือเรียน E-Book',
      tags: ['หนังสือ', 'ตำรา', 'e-book', 'ebook', 'สสวท', 'ดาวน์โหลด', 'อ่านหนังสือ'],
      externalUrl: 'https://pubhtml5.com/ztml/rbqf/',
    });

    items.push({
      id: 'ext-proj14',
      type: 'external',
      title: '🌐 เว็บไซต์โครงการสอนออนไลน์ สสวท. Project 14 (ม.1 วิทยาการคำนวณ)',
      subtitle: 'คลังบทเรียนและสื่อวีดิทัศน์ทางการศึกษา สถาบันส่งเสริมการสอนวิทยาศาสตร์และเทคโนโลยี',
      badgeText: 'สสวท. Project 14',
      tags: ['project 14', 'สสวท', 'เว็บสสวท', 'ipst', 'proj14'],
      externalUrl: 'https://proj14.ipst.ac.th/m1/m1-cs/',
    });

    return items;
  }, [lessons]);

  // Filtered Search Results
  const filteredResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    return allSearchableItems.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.type !== selectedCategory) {
        return false;
      }

      if (!trimmed) {
        return true;
      }

      // Check title, subtitle, badgeText, tags
      const matchTitle = item.title.toLowerCase().includes(trimmed);
      const matchSubtitle = item.subtitle.toLowerCase().includes(trimmed);
      const matchBadge = item.badgeText?.toLowerCase().includes(trimmed);
      const matchTags = item.tags?.some((t) => t.toLowerCase().includes(trimmed));
      const matchChapter =
        item.chapterNumber !== undefined &&
        (`บทที่ ${item.chapterNumber}`.toLowerCase().includes(trimmed) ||
          `บท ${item.chapterNumber}`.toLowerCase().includes(trimmed) ||
          `ด่านที่ ${item.chapterNumber}`.toLowerCase().includes(trimmed));

      return matchTitle || matchSubtitle || matchBadge || matchTags || matchChapter;
    });
  }, [allSearchableItems, query, selectedCategory]);

  // Keep selected index within range
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  const handleSelectResult = (item: SearchResultItem) => {
    onClose();

    if (item.type === 'external' && item.externalUrl) {
      window.open(item.externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    if (item.targetLesson) {
      onOpenLesson(item.targetLesson, item.targetTab || 'content');
      return;
    }

    if (item.type === 'video') {
      onOpenVideoView(item.targetVideo);
      return;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
      scrollSelectedIntoView();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
      scrollSelectedIntoView();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filteredResults[selectedIndex];
      if (current) {
        handleSelectResult(current);
      }
    }
  };

  const scrollSelectedIntoView = () => {
    setTimeout(() => {
      const el = document.getElementById(`search-result-item-${selectedIndex}`);
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 10);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 sm:pt-16 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Search className="w-5 h-5" />
          </div>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              id="global-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ค้นหาบทเรียน, วิดีโอ, ผังงาน, Scratch, Python, มินิเกม, ใบงาน..."
              className="w-full bg-transparent text-white placeholder-slate-500 text-sm sm:text-base font-medium focus:outline-none pr-8"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-lg"
                title="ล้างคำค้นหา"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            title="ปิดหน้าต่างค้นหา (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Chips Bar */}
        <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition-all flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <span>ทั้งหมด</span>
            <span className="text-[10px] opacity-75">
              ({allSearchableItems.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('lesson')}
            className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
              selectedCategory === 'lesson'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>บทเรียน (6 บท)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('video')}
            className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
              selectedCategory === 'video'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-rose-400" />
            <span>วิดีโอ สสวท.</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('game')}
            className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
              selectedCategory === 'game'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>มินิเกมโต้ตอบ</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('worksheet')}
            className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
              selectedCategory === 'worksheet'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>ใบงานเก็บคะแนน</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('quiz')}
            className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
              selectedCategory === 'quiz'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>แบบทดสอบ</span>
          </button>
        </div>

        {/* Popular Quick Suggestions (Shown if query is empty) */}
        {!query && (
          <div className="px-5 py-3 bg-slate-950/20 border-b border-slate-800/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-2">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>หัวข้อยอดนิยมที่ค้นหาบ่อย:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_SEARCH_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setQuery(tag)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-amber-500/20 hover:border-amber-500/40 hover:text-amber-300 border border-slate-700/80 text-[11px] text-slate-300 transition-all"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results List */}
        <div
          ref={resultsContainerRef}
          className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 max-h-[460px]"
        >
          {filteredResults.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
                <Search className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-white">
                ไม่พบผลลัพธ์ที่ตรงกับ "{query}"
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                ลองค้นหาด้วยคำสำคัญ เช่น "บทที่ 1", "ผังงาน", "Scratch", "Python", "ข้อมูล", "มินิเกม" หรือ "ใบงาน"
              </p>
              <button
                type="button"
                onClick={() => setQuery('')}
                className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors"
              >
                ดูเนื้อหาทั้งหมด
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="px-2 py-1 text-[11px] font-bold text-slate-400 flex items-center justify-between">
                <span>
                  พบผลการค้นหา {filteredResults.length} รายการ
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:inline">
                  ใช้ลูกศร ↑ ↓ และกด Enter เพื่อเปิด
                </span>
              </div>

              {filteredResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;

                // Color accent based on type
                const typeStyles = {
                  lesson: {
                    icon: <BookOpen className="w-4 h-4 text-amber-400" />,
                    bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
                  },
                  video: {
                    icon: <Video className="w-4 h-4 text-rose-400" />,
                    bg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
                  },
                  game: {
                    icon: <Gamepad2 className="w-4 h-4 text-indigo-400" />,
                    bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
                  },
                  worksheet: {
                    icon: <FileText className="w-4 h-4 text-amber-400" />,
                    bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
                  },
                  quiz: {
                    icon: <FileCheck className="w-4 h-4 text-emerald-400" />,
                    bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
                  },
                  external: {
                    icon: <ExternalLink className="w-4 h-4 text-sky-400" />,
                    bg: 'bg-sky-500/10 border-sky-500/30 text-sky-300',
                  },
                }[item.type];

                return (
                  <div
                    key={item.id}
                    id={`search-result-item-${idx}`}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => handleSelectResult(item)}
                    className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 group ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/50 shadow-md ring-1 ring-amber-500/30 translate-x-1'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${typeStyles.bg}`}
                      >
                        {typeStyles.icon}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                          {item.badgeText && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${typeStyles.bg}`}
                            >
                              {item.badgeText}
                            </span>
                          )}
                          {item.chapterNumber && (
                            <span className="text-[10px] font-semibold text-slate-400">
                              ม.1 สสวท.
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-xs sm:text-sm text-white group-hover:text-amber-300 transition-colors line-clamp-1 font-['Chakra_Petch']">
                          {item.title}
                        </h4>

                        <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-amber-400 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all self-center">
                      <span className="hidden sm:inline text-[11px]">เปิดดู</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-3 sm:px-5 sm:py-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
                ↓
              </kbd>
              <span>เลือก</span>
            </span>

            <span className="hidden sm:inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
                Enter
              </kbd>
              <span>เปิดรายการ</span>
            </span>

            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
                Esc
              </kbd>
              <span>ปิด</span>
            </span>
          </div>

          <div className="flex items-center gap-1 text-amber-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Adventure M.1 Search Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};
