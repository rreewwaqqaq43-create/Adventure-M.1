/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Lesson, StudentProgress, Badge, User, YouTubeVideo, Worksheet, WorksheetTask, Quiz, QuizQuestion } from '../types';
import { StorageService } from '../services/storage';
import { syncQuizToFirestore } from '../services/firebase';
import { GameContainer } from './games/GameContainer';
import { QuizComponent } from './QuizComponent';
import { GamificationRewardModal } from './common/GamificationRewardModal';
import { LeaderboardModal } from './LeaderboardModal';
import { sfx } from '../utils/audioEffects';
import {
  extractYouTubeId,
  toFullYouTubeUrl,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  autoDetectVideoDuration,
} from '../utils/youtube';
import {
  X,
  BookOpen,
  Video,
  Gamepad2,
  FileCheck,
  Award,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Play,
  Globe,
  FileText,
  Send,
  HelpCircle,
  Edit3,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  UserCheck,
  RotateCcw,
  MoveUp,
  MoveDown,
  Eye,
  Check,
  Calendar,
  Clock,
  Lock,
  Unlock,
  ShieldAlert,
  KeyRound,
  GraduationCap
} from 'lucide-react';

interface LessonDetailModalProps {
  lesson: Lesson;
  progress: StudentProgress | undefined;
  badge: Badge | undefined;
  currentUser: User | null;
  initialTab?: 'content' | 'video' | 'game' | 'quiz' | 'worksheet' | 'badge';
  onClose: () => void;
  onProgressUpdated: () => void;
  onLessonUpdated?: (updatedLesson: Lesson) => void;
}

const getDefaultWorksheet = (chapterNumber: number, title?: string): Worksheet => ({
  id: `ws-${chapterNumber}`,
  chapterNumber,
  title: `ใบงานประจำบทเรียนที่ ${chapterNumber}: ${title || 'การประยุกต์ใช้วิทยาการคำนวณ'}`,
  description: `แบบฝึกหัดและการประยุกต์ใช้ความรู้ประจำบทที่ ${chapterNumber} ตามมาตรฐานหลักสูตร สสวท. ม.1`,
  instructions: 'ให้นักเรียนศึกษาโจทย์และสถานการณ์ที่กำหนด แล้วตอบคำถามให้ถูกต้อง ครบถ้วน พร้อมให้เหตุผลประกอบอย่างเป็นระบบ',
  textbookRef: `หนังสือ สสวท. ม.1 บทที่ ${chapterNumber}`,
  maxScore: 10,
  dueDate: '2026-06-30',
  tasks: [
    {
      id: `task-${chapterNumber}-1`,
      question: `ข้อที่ 1: อธิบายหลักการสำคัญและยกตัวอย่างการนำความรู้ในบทที่ ${chapterNumber} ไปประยุกต์ใช้ในชีวิตประจำวันอย่างน้อย 2 ตัวอย่าง`,
      type: 'essay',
      maxScore: 5,
      hint: 'พิจารณาสถานการณ์จริงใกล้ตัว เช่น การเดินทาง การจัดการข้อมูล หรือการวางแผนขั้นตอนการทำงาน',
      sampleAnswer: 'คำตอบที่ถูกต้องควรระบุสถานการณ์ เหตุผล และขั้นตอนการประยุกต์ใช้จริงอย่างเป็นรูปธรรม',
    },
    {
      id: `task-${chapterNumber}-2`,
      question: `ข้อที่ 2: วิเคราะห์สถานการณ์และอธิบายขั้นตอนการแก้ปัญหาตามกระบวนการวิทยาการคำนวณ`,
      type: 'essay',
      maxScore: 5,
      hint: 'อ้างอิงเนื้อหา สาระสำคัญ และแบบฝึกหัดในหนังสือ สสวท. ม.1',
      sampleAnswer: 'คำตอบควรแสดงถึงลำดับขั้นตอนการคิดที่เป็นระบบและการตัดสินใจจากข้อมูลที่น่าเชื่อถือ',
    },
  ],
});

export const LessonDetailModal: React.FC<LessonDetailModalProps> = ({
  lesson,
  progress,
  badge,
  currentUser,
  initialTab = 'content',
  onClose,
  onProgressUpdated,
  onLessonUpdated,
}) => {
  const isTeacherOrAdmin = currentUser?.role === 'teacher' || currentUser?.role === 'admin';

  // Sequential student locks: Check if pre-test was completed via progress object OR storage attempts
  const isPreTestDoneFromProgress = progress?.preTestScore !== undefined && progress?.preTestScore !== null;
  const isPreTestDoneFromAttempts = StorageService.getQuizAttempts().some(
    (a) => a.chapterNumber === lesson.chapterNumber && a.quizType === 'pre_test' && (!currentUser || a.userId === currentUser.id || a.userId === 'anonymous-student')
  );
  const hasCompletedPreTest = isTeacherOrAdmin || isPreTestDoneFromProgress || isPreTestDoneFromAttempts;
  const hasCompletedGame = isTeacherOrAdmin || Boolean(progress?.completedGame || (progress?.gameScore !== undefined && progress.gameScore > 0));

  const [activeTab, setActiveTab] = useState<'content' | 'video' | 'game' | 'quiz' | 'pre_test' | 'post_test' | 'worksheet' | 'badge'>(() => {
    if (lesson.chapterNumber === 7) {
      if (initialTab && initialTab !== 'content' && initialTab !== 'game' && initialTab !== 'worksheet') {
        return initialTab;
      }
      return hasCompletedPreTest ? 'post_test' : 'pre_test';
    }
    return initialTab;
  });
  const [currentVideoId, setCurrentVideoId] = useState<string>(lesson.youtubeVideoId || 'bI9oX3R9M5w');
  const [quizMode, setQuizMode] = useState<'post_test' | 'pre_test'>(() => {
    if (lesson.chapterNumber === 7) {
      return hasCompletedPreTest ? 'post_test' : 'pre_test';
    }
    return 'post_test';
  });

  // Badge edit state
  const [isEditingBadge, setIsEditingBadge] = useState(false);
  const [badgeEditForm, setBadgeEditForm] = useState<Badge>(() => {
    return badge || {
      id: lesson.badgeRewardId || `badge-${lesson.chapterNumber}`,
      name: `Champion of Chapter ${lesson.chapterNumber}`,
      titleTh: `ผู้พิชิตบทที่ ${lesson.chapterNumber}`,
      description: `พิชิตบทเรียนที่ ${lesson.chapterNumber} และทำคะแนนแบบทดสอบได้ยอดเยี่ยม`,
      chapterNumber: lesson.chapterNumber,
      iconName: 'Award',
      icon: '🏆',
      rarity: 'rare',
      requiredScorePercent: 70,
    };
  });
  const [badgeSaveMsg, setBadgeSaveMsg] = useState<string | null>(null);

  // Gamification Reward Modal & Leaderboard Modal states
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardModalData, setRewardModalData] = useState<{
    rewardType: 'minigame' | 'chapter_completed' | 'quiz_passed';
    title: string;
    subtitle: string;
    earnedCoins: number;
    earnedXp: number;
    newTotalCoins: number;
    newTotalXp: number;
    newLevel: number;
    isLevelUp?: boolean;
    badgeName?: string;
    badgeIcon?: string;
    classroom?: string;
    rankInClass?: number;
    totalInClass?: number;
  } | null>(null);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

  // Stage Lock state: Check if this chapter is locked (globally or specifically for student's classroom)
  const [lockUpdateKey, setLockUpdateKey] = useState(0);
  const allClasses = useMemo(() => StorageService.getClasses(), [lockUpdateKey]);
  const [selectedClassLockScope, setSelectedClassLockScope] = useState<string>('global');

  const studentLockInfo = useMemo(() => {
    return StorageService.getChapterLockInfoForUser(lesson.chapterNumber, currentUser);
  }, [lesson.chapterNumber, currentUser, lockUpdateKey]);

  const isChapterLockedForStudent = studentLockInfo.isLocked && (!currentUser || currentUser.role === 'student');

  const isCurrentScopeLocked = useMemo(() => {
    if (selectedClassLockScope === 'global') {
      return StorageService.getGlobalLockedChapters().includes(lesson.chapterNumber);
    }
    return StorageService.getClassLockedChapters(selectedClassLockScope).includes(lesson.chapterNumber);
  }, [selectedClassLockScope, lesson.chapterNumber, lockUpdateKey]);

  const handleToggleLockScope = (scope: string) => {
    if (scope === 'global') {
      StorageService.toggleGlobalChapterLock(lesson.chapterNumber);
    } else {
      StorageService.toggleClassChapterLock(scope, lesson.chapterNumber);
    }
    setLockUpdateKey((k) => k + 1);
    onProgressUpdated();
  };

  // Worksheet state with teacher editing support
  const [worksheet, setWorksheet] = useState<Worksheet>(() => {
    const list = StorageService.getWorksheets();
    return list.find((w) => w.chapterNumber === lesson.chapterNumber) ||
      getDefaultWorksheet(lesson.chapterNumber, lesson.title);
  });
  const [isEditingWorksheet, setIsEditingWorksheet] = useState<boolean>(isTeacherOrAdmin);
  const [teacherWorksheetTab, setTeacherWorksheetTab] = useState<'edit' | 'submissions' | 'preview'>('edit');
  const [worksheetEditForm, setWorksheetEditForm] = useState<Worksheet>(worksheet);
  const [worksheetSaveMsg, setWorksheetSaveMsg] = useState<string | null>(null);

  // Teacher grading in worksheet tab
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [gradingScoreInput, setGradingScoreInput] = useState<number>(0);
  const [gradingFeedbackInput, setGradingFeedbackInput] = useState<string>('');

  React.useEffect(() => {
    const list = StorageService.getWorksheets();
    let ws = list.find((w) => w.chapterNumber === lesson.chapterNumber);
    if (!ws) {
      ws = getDefaultWorksheet(lesson.chapterNumber, lesson.title);
      StorageService.updateWorksheet(ws);
    }
    setWorksheet(ws);
    setWorksheetEditForm(ws);
    if (isTeacherOrAdmin) {
      setIsEditingWorksheet(true);
      setTeacherWorksheetTab('edit');
    }
  }, [lesson.chapterNumber, lesson.title, isTeacherOrAdmin]);

  // Video edit state with teacher editing support
  const [isEditingVideo, setIsEditingVideo] = useState(false);
  const [videoEditTitle, setVideoEditTitle] = useState(lesson.videoTitle || '');
  const [videoEditDuration, setVideoEditDuration] = useState(lesson.videoDuration || '12:00 น.');
  const [videoEditId, setVideoEditId] = useState(lesson.youtubeVideoId || 'bI9oX3R9M5w');
  const [videoSaveMsg, setVideoSaveMsg] = useState<string | null>(null);

  // Content edit state with teacher editing support
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [contentEditForm, setContentEditForm] = useState<Lesson>(lesson);
  const [contentSaveMsg, setContentSaveMsg] = useState<string | null>(null);

  React.useEffect(() => {
    setContentEditForm(lesson);
    if (lesson.youtubeVideoId) {
      setCurrentVideoId(lesson.youtubeVideoId);
    }
  }, [lesson]);

  // Quiz edit state with teacher editing support
  const [isEditingQuiz, setIsEditingQuiz] = useState(false);
  const [quizVersion, setQuizVersion] = useState(0);
  const [quizEditForm, setQuizEditForm] = useState<Quiz>(() =>
    StorageService.getChapterQuiz(lesson.chapterNumber, quizMode)
  );
  const [quizSaveMsg, setQuizSaveMsg] = useState<string | null>(null);

  React.useEffect(() => {
    setQuizEditForm(StorageService.getChapterQuiz(lesson.chapterNumber, quizMode));
  }, [lesson.chapterNumber, quizMode, quizVersion]);

  const handleSaveVideoInline = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = extractYouTubeId(videoEditId);
    const existingVids = StorageService.getVideos();
    const targetVid = existingVids.find((v) => v.chapterNumber === lesson.chapterNumber && (v.youtubeId === currentVideoId || v.isFeatured)) || {
      id: `vid-${lesson.chapterNumber}-1`,
      chapterNumber: lesson.chapterNumber,
      title: videoEditTitle,
      description: lesson.description,
      youtubeId: cleanId,
      duration: videoEditDuration,
      thumbnailUrl: getYouTubeThumbnailUrl(cleanId),
      ipstUrl: 'https://proj14.ipst.ac.th/m1/m1-cs/',
      isFeatured: true,
    };

    const updatedVid: YouTubeVideo = {
      ...targetVid,
      title: videoEditTitle,
      duration: videoEditDuration,
      youtubeId: cleanId,
      thumbnailUrl: getYouTubeThumbnailUrl(cleanId),
    };
    StorageService.updateVideo(updatedVid);

    if (updatedVid.isFeatured) {
      StorageService.setFeaturedVideo(updatedVid.id);
    }

    const updatedLesson: Lesson = {
      ...lesson,
      videoTitle: videoEditTitle,
      videoDuration: videoEditDuration,
      youtubeVideoId: cleanId,
      videoUrl: toFullYouTubeUrl(cleanId),
    };
    StorageService.updateLesson(updatedLesson);
    onLessonUpdated?.(updatedLesson);

    setCurrentVideoId(cleanId);
    setVideoSaveMsg('บันทึกการแก้ไขวิดีโอประจำบทเรียบร้อยแล้ว!');
    setTimeout(() => setVideoSaveMsg(null), 3000);
    setIsEditingVideo(false);
  };

  const handleDeleteVideoInline = () => {
    if (!isTeacherOrAdmin) return;
    const existingVids = StorageService.getVideos();
    const targetVid = existingVids.find(
      (v) => v.chapterNumber === lesson.chapterNumber && v.youtubeId === currentVideoId
    );
    if (!targetVid) {
      alert('ไม่พบคลิปวิดีโอที่ต้องการลบ');
      return;
    }
    const confirmed = window.confirm(
      `คุณครูต้องการลบคลิปวิดีโอ "${targetVid.title}" ออกจากบทเรียนใช่หรือไม่?`
    );
    if (!confirmed) return;

    StorageService.deleteVideo(targetVid.id);
    const refreshed = StorageService.getVideos();
    const remainingChVids = refreshed.filter((v) => v.chapterNumber === lesson.chapterNumber);
    if (remainingChVids.length > 0) {
      setCurrentVideoId(remainingChVids[0].youtubeId);
    }

    setVideoSaveMsg('ลบคลิปวิดีโอเรียบร้อยแล้ว');
    setTimeout(() => setVideoSaveMsg(null), 3000);
    setIsEditingVideo(false);
  };

  const handleSaveBadgeInline = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.updateBadge(badgeEditForm);
    setBadgeSaveMsg('บันทึกการแก้ไขเหรียญรางวัลประจำบทเรียบร้อยแล้ว!');
    setTimeout(() => setBadgeSaveMsg(null), 3000);
    setIsEditingBadge(false);
    onProgressUpdated();
  };

  const handleResetBadgeDefault = () => {
    if (window.confirm('คุณครูต้องการคืนค่าเหรียญรางวัลประจำบทเป็นค่ามาตรฐาน สสวท. หรือไม่?')) {
      const defBadge: Badge = {
        id: lesson.badgeRewardId || `badge-${lesson.chapterNumber}`,
        name: `Champion of Chapter ${lesson.chapterNumber}`,
        titleTh: `ผู้พิชิตบทที่ ${lesson.chapterNumber}`,
        description: `พิชิตบทเรียนที่ ${lesson.chapterNumber} และทำคะแนนแบบทดสอบได้ยอดเยี่ยม`,
        chapterNumber: lesson.chapterNumber,
        iconName: 'Award',
        icon: '🏆',
        rarity: 'rare',
        requiredScorePercent: 70,
      };
      StorageService.updateBadge(defBadge);
      setBadgeEditForm(defBadge);
      setBadgeSaveMsg('คืนค่าเหรียญรางวัลมาตรฐานเรียบร้อยแล้ว!');
      setTimeout(() => setBadgeSaveMsg(null), 3000);
      onProgressUpdated();
    }
  };

  const handleSaveWorksheetInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!worksheetEditForm) return;
    StorageService.updateWorksheet(worksheetEditForm);
    setWorksheet(worksheetEditForm);
    setWorksheetSaveMsg('บันทึกการแก้ไขใบงานประจำบทเรียบร้อยแล้ว!');
    setTimeout(() => setWorksheetSaveMsg(null), 3000);
  };

  const handleAddTaskInline = () => {
    if (!worksheetEditForm) return;
    const newTask: WorksheetTask = {
      id: `task-${Date.now()}`,
      question: 'โจทย์ภารกิจข้อใหม่',
      type: 'essay',
      maxScore: 5,
      hint: 'คำใบ้ประกอบการทำใบงานสำหรับนักเรียน',
      sampleAnswer: 'แนวทางการตอบที่ถูกต้องตามหลักสูตร สสวท.',
    };
    setWorksheetEditForm({
      ...worksheetEditForm,
      tasks: [...worksheetEditForm.tasks, newTask],
    });
  };

  const handleUpdateTaskInline = (idx: number, updated: Partial<WorksheetTask>) => {
    if (!worksheetEditForm) return;
    const tasks = [...worksheetEditForm.tasks];
    tasks[idx] = { ...tasks[idx], ...updated };
    setWorksheetEditForm({ ...worksheetEditForm, tasks });
  };

  const handleDeleteTaskInline = (idx: number) => {
    if (!worksheetEditForm) return;
    if (worksheetEditForm.tasks.length <= 1) {
      alert('ใบงานต้องมีคำถามอย่างน้อย 1 ข้อ');
      return;
    }
    setWorksheetEditForm({
      ...worksheetEditForm,
      tasks: worksheetEditForm.tasks.filter((_, i) => i !== idx),
    });
  };

  const handleMoveTaskUpInline = (idx: number) => {
    if (!worksheetEditForm || idx === 0) return;
    const tasks = [...worksheetEditForm.tasks];
    const temp = tasks[idx - 1];
    tasks[idx - 1] = tasks[idx];
    tasks[idx] = temp;
    setWorksheetEditForm({ ...worksheetEditForm, tasks });
  };

  const handleMoveTaskDownInline = (idx: number) => {
    if (!worksheetEditForm || idx >= worksheetEditForm.tasks.length - 1) return;
    const tasks = [...worksheetEditForm.tasks];
    const temp = tasks[idx + 1];
    tasks[idx + 1] = tasks[idx];
    tasks[idx] = temp;
    setWorksheetEditForm({ ...worksheetEditForm, tasks });
  };

  const handleResetWorksheetDefault = () => {
    if (window.confirm('คุณครูต้องการคืนค่าใบงานบทนี้กลับเป็นเนื้อหามาตรฐาน สสวท. หรือไม่?')) {
      const def = getDefaultWorksheet(lesson.chapterNumber, lesson.title);
      setWorksheetEditForm(def);
      setWorksheet(def);
      StorageService.updateWorksheet(def);
      setWorksheetSaveMsg('คืนค่าใบงานมาตรฐาน สสวท. เรียบร้อยแล้ว!');
      setTimeout(() => setWorksheetSaveMsg(null), 3000);
    }
  };

  // Chapter submissions for teacher review
  const [worksheetUpdateCount, setWorksheetUpdateCount] = useState<number>(0);

  const chapterSubmissions = React.useMemo(() => {
    const allSubs = StorageService.getWorksheetSubmissions();
    return allSubs.filter(
      (s) => s.worksheetId === worksheet.id || s.chapterNumber === lesson.chapterNumber
    );
  }, [worksheet.id, lesson.chapterNumber, worksheetSaveMsg, worksheetUpdateCount]);

  const activeSubForTeacher = React.useMemo(() => {
    if (!selectedSubId) return chapterSubmissions[0] || null;
    return chapterSubmissions.find((s) => s.id === selectedSubId) || chapterSubmissions[0] || null;
  }, [chapterSubmissions, selectedSubId]);

  React.useEffect(() => {
    if (activeSubForTeacher) {
      setGradingScoreInput(activeSubForTeacher.score || 0);
      setGradingFeedbackInput(activeSubForTeacher.feedback || '');
    }
  }, [activeSubForTeacher?.id]);

  const [worksheetValidationErr, setWorksheetValidationErr] = useState<string | null>(null);

  const handleSaveGradingInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubForTeacher) return;
    StorageService.gradeWorksheet(
      activeSubForTeacher.id,
      Number(gradingScoreInput),
      gradingFeedbackInput,
      currentUser?.name || 'คุณครูผู้สอน',
      worksheet.maxScore,
      worksheet.title
    );
    setWorksheetUpdateCount((c) => c + 1);
    setWorksheetSaveMsg(`บันทึกผลการตรวจและส่งจดหมายฟีดแบ็กถึง ${activeSubForTeacher.studentName} เรียบร้อยแล้ว!`);
    sfx.playPowerUp();
    setTimeout(() => setWorksheetSaveMsg(null), 3500);
  };

  const existingSubmission = React.useMemo(() => {
    if (!currentUser || !worksheet) return null;
    return StorageService.getWorksheetSubmissions().find(
      (s) =>
        (s.worksheetId === worksheet.id || s.chapterNumber === lesson.chapterNumber) &&
        s.userId === currentUser.id
    );
  }, [worksheet.id, lesson.chapterNumber, currentUser, worksheetUpdateCount, worksheetSaveMsg]);

  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [worksheetSubmittedMsg, setWorksheetSubmittedMsg] = useState(false);

  React.useEffect(() => {
    if (existingSubmission?.answers) {
      setStudentAnswers(existingSubmission.answers);
    }
  }, [existingSubmission]);

  const handleAnswerChange = (taskId: string, val: string) => {
    setStudentAnswers((prev) => ({ ...prev, [taskId]: val }));
    if (worksheetValidationErr) {
      setWorksheetValidationErr(null);
    }
  };

  const handleSubmitWorksheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !worksheet) return;

    // Check that every question in worksheet.tasks has at least 3 characters entered
    const emptyOrTooShortTasks = worksheet.tasks.filter((t) => {
      const answer = (studentAnswers[t.id] || '').trim();
      return answer.length < 3;
    });

    if (emptyOrTooShortTasks.length > 0) {
      sfx.playIncorrect();
      setWorksheetValidationErr(
        `กรุณาพิมพ์คำตอบในใบงานให้ครบถ้วนอย่างน้อย 3 ตัวอักษร (ยังขาดอีก ${emptyOrTooShortTasks.length} ข้อ)`
      );
      return;
    }

    setWorksheetValidationErr(null);

    StorageService.submitWorksheet({
      id: existingSubmission?.id || `sub-${Date.now()}`,
      worksheetId: worksheet.id,
      userId: currentUser.id,
      studentName: currentUser.name,
      chapterNumber: lesson.chapterNumber,
      answers: studentAnswers,
      submittedAt: new Date().toISOString(),
    });

    sfx.playSuccess();
    setWorksheetUpdateCount((c) => c + 1);
    setWorksheetSubmittedMsg(true);
    setTimeout(() => setWorksheetSubmittedMsg(false), 4500);
  };

  // Content Handlers (for Teacher Editing within Modal)
  const handleSaveContentInline = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.updateLesson(contentEditForm);
    if (onLessonUpdated) {
      onLessonUpdated(contentEditForm);
    }
    setContentSaveMsg('บันทึกการแก้ไขและเพิ่มเติมเนื้อหาสำเร็จเรียบร้อย!');
    setIsEditingContent(false);
    setTimeout(() => setContentSaveMsg(null), 3500);
  };

  const handleAddInlineSummarySection = () => {
    const nextIdx = (contentEditForm.summarySections?.length || 0) + 1;
    const newSec = {
      title: `${contentEditForm.chapterNumber}.${nextIdx} หัวข้อย่อยเนื้อหาใหม่`,
      page: contentEditForm.textbookPages || 'หน้า 2–20',
      content: 'คำอธิบายเนื้อหาและแนวคิดสำคัญของหัวข้อนี้อย่างละเอียด...',
      keyPoints: ['ประเด็นสำคัญที่ 1', 'ประเด็นสำคัญที่ 2'],
    };
    setContentEditForm((prev) => ({
      ...prev,
      summarySections: [...(prev.summarySections || []), newSec],
    }));
  };

  const handleUpdateInlineSummarySection = (
    sIdx: number,
    field: 'title' | 'page' | 'content',
    val: string
  ) => {
    setContentEditForm((prev) => {
      const list = [...(prev.summarySections || [])];
      list[sIdx] = { ...list[sIdx], [field]: val };
      return { ...prev, summarySections: list };
    });
  };

  const handleDeleteInlineSummarySection = (sIdx: number) => {
    setContentEditForm((prev) => ({
      ...prev,
      summarySections: prev.summarySections?.filter((_, i) => i !== sIdx),
    }));
  };

  const handleAddInlineKeyPoint = (sIdx: number) => {
    setContentEditForm((prev) => {
      const list = [...(prev.summarySections || [])];
      const curSec = list[sIdx];
      const points = [...(curSec.keyPoints || []), 'ประเด็นสำคัญใหม่'];
      list[sIdx] = { ...curSec, keyPoints: points };
      return { ...prev, summarySections: list };
    });
  };

  const handleUpdateInlineKeyPoint = (sIdx: number, kpIdx: number, val: string) => {
    setContentEditForm((prev) => {
      const list = [...(prev.summarySections || [])];
      const curSec = list[sIdx];
      const points = [...(curSec.keyPoints || [])];
      points[kpIdx] = val;
      list[sIdx] = { ...curSec, keyPoints: points };
      return { ...prev, summarySections: list };
    });
  };

  const handleDeleteInlineKeyPoint = (sIdx: number, kpIdx: number) => {
    setContentEditForm((prev) => {
      const list = [...(prev.summarySections || [])];
      const curSec = list[sIdx];
      const points = (curSec.keyPoints || []).filter((_, i) => i !== kpIdx);
      list[sIdx] = { ...curSec, keyPoints: points };
      return { ...prev, summarySections: list };
    });
  };

  const handleAddInlineObjective = () => {
    setContentEditForm((prev) => ({
      ...prev,
      objectives: [...(prev.objectives || []), 'เข้าใจและอธิบายหลักการของบทนี้ได้'],
    }));
  };

  const handleUpdateInlineObjective = (idx: number, val: string) => {
    setContentEditForm((prev) => {
      const objs = [...(prev.objectives || [])];
      objs[idx] = val;
      return { ...prev, objectives: objs };
    });
  };

  const handleDeleteInlineObjective = (idx: number) => {
    setContentEditForm((prev) => ({
      ...prev,
      objectives: prev.objectives?.filter((_, i) => i !== idx),
    }));
  };

  // Quiz Handlers (for Teacher Editing within Modal)
  const handleSaveQuizInline = async (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.updateQuiz(quizEditForm);
    try {
      await syncQuizToFirestore(quizEditForm);
    } catch (err) {
      console.warn('Firestore quiz sync:', err);
    }
    setQuizVersion((v) => v + 1);
    setQuizSaveMsg(`บันทึกแบบทดสอบ${quizMode === 'pre_test' ? 'ก่อนเรียน (Pre-test)' : 'หลังเรียน (Post-test)'} เรียบร้อยแล้ว!`);
    setIsEditingQuiz(false);
    setTimeout(() => setQuizSaveMsg(null), 3500);
  };

  const handleMoveInlineQuestion = (qIdx: number, direction: 'up' | 'down') => {
    setQuizEditForm((prev) => {
      const qs = [...(prev.questions || [])];
      const targetIdx = direction === 'up' ? qIdx - 1 : qIdx + 1;
      if (targetIdx < 0 || targetIdx >= qs.length) return prev;
      const [moved] = qs.splice(qIdx, 1);
      qs.splice(targetIdx, 0, moved);
      return { ...prev, questions: qs };
    });
  };

  const handleResetInlineQuizToDefault = () => {
    if (window.confirm(`ต้องการคืนค่าแบบทดสอบ${quizMode === 'pre_test' ? 'ก่อนเรียน' : 'หลังเรียน'} สสวท. เริ่มต้นหรือไม่?`)) {
      const def = StorageService.resetQuizToDefault(lesson.chapterNumber, quizMode);
      setQuizEditForm(def);
      setQuizVersion((v) => v + 1);
      setQuizSaveMsg(`คืนค่าแบบทดสอบ${quizMode === 'pre_test' ? 'ก่อนเรียน' : 'หลังเรียน'} เริ่มต้นเรียบร้อย!`);
      setTimeout(() => setQuizSaveMsg(null), 3000);
    }
  };

  const handleAddInlineQuestion = () => {
    const newQ: QuizQuestion = {
      id: `q-${lesson.chapterNumber}-${quizMode}-${Date.now()}`,
      question: `คำถามข้อใหม่ประจำบทที่ ${lesson.chapterNumber} (สสวท. ม.1)`,
      options: ['ตัวเลือก ก', 'ตัวเลือก ข', 'ตัวเลือก ค', 'ตัวเลือก ง'],
      correctIndex: 0,
      correctAnswer: 0,
      explanation: 'คำอธิบายเฉลยและเหตุผลของข้อนี้',
    };
    setQuizEditForm((prev) => ({
      ...prev,
      questions: [...(prev.questions || []), newQ],
    }));
  };

  const handleUpdateInlineQuestion = (qIdx: number, updated: Partial<QuizQuestion>) => {
    setQuizEditForm((prev) => {
      const qs = [...(prev.questions || [])];
      qs[qIdx] = { ...qs[qIdx], ...updated };
      return { ...prev, questions: qs };
    });
  };

  const handleDeleteInlineQuestion = (qIdx: number) => {
    setQuizEditForm((prev) => ({
      ...prev,
      questions: prev.questions?.filter((_, i) => i !== qIdx),
    }));
  };

  const currentQuiz = React.useMemo(() => {
    return StorageService.getChapterQuiz(lesson.chapterNumber, quizMode);
  }, [lesson.chapterNumber, quizMode, quizVersion]);

  const chapterVideos = React.useMemo(() => {
    const list = StorageService.getVideos().filter((v) => v.chapterNumber === lesson.chapterNumber);
    if (list.length === 0) {
      return [
        {
          id: `vid-${lesson.chapterNumber}`,
          chapterNumber: lesson.chapterNumber,
          title: lesson.videoTitle || lesson.title,
          description: lesson.contentSummary || lesson.description,
          youtubeId: lesson.youtubeVideoId || 'bI9oX3R9M5w',
          duration: lesson.videoDuration || '12:00 น.',
          thumbnailUrl: getYouTubeThumbnailUrl(lesson.youtubeVideoId || 'bI9oX3R9M5w'),
        },
      ];
    }
    return list;
  }, [lesson]);

  const handleGameComplete = (score: number, maxScore: number, xpEarned: number) => {
    if (!currentUser) return;
    const currentProg = progress || {
      userId: currentUser.id,
      lessonId: lesson.id,
      status: 'in_progress',
      gameScore: 0,
      quizScore: 0,
      xpEarned: 0,
    };

    const newProg: StudentProgress = {
      ...currentProg,
      gameScore: Math.max(currentProg.gameScore || 0, score),
      completedGame: true,
      xpEarned: (currentProg.xpEarned || 0) + xpEarned,
      lastAccessedAt: new Date().toISOString(),
    };

    // If both game and quiz done or passed
    if (newProg.quizScore !== undefined && newProg.quizScore > 0) {
      newProg.status = 'completed';
      newProg.completedAt = new Date().toISOString();
    }

    StorageService.saveProgress(newProg);

    // Calculate earned coins based on performance
    const ratio = maxScore > 0 ? score / maxScore : 1;
    const earnedCoins = ratio >= 0.95 ? 100 : ratio >= 0.75 ? 75 : 50;

    // Gamification Mechanics: Award coins, XP, badge, and compute classroom rank
    const gamificationRes = StorageService.awardGamificationRewards(currentUser.id, {
      coins: earnedCoins,
      xp: xpEarned,
      badgeId: lesson.badgeRewardId || `badge-${lesson.chapterNumber}`,
      lessonChapter: lesson.chapterNumber,
    });

    setRewardModalData({
      rewardType: 'minigame',
      title: `🎉 พิชิตมินิเกมบทที่ ${lesson.chapterNumber} สำเร็จ!`,
      subtitle: `${lesson.title} • ได้รับเหรียญและคะแนนสะสมจัดอันดับห้องเรียน`,
      earnedCoins,
      earnedXp: xpEarned,
      newTotalCoins: gamificationRes.newTotalCoins,
      newTotalXp: gamificationRes.newTotalXp,
      newLevel: gamificationRes.newLevel,
      isLevelUp: gamificationRes.isLevelUp,
      badgeName: badge?.name || `เหรียญตราประจำบทที่ ${lesson.chapterNumber}`,
      badgeIcon: badge?.icon || '🎮',
      classroom: gamificationRes.updatedProfile.classroom || 'ม.1/1',
      rankInClass: gamificationRes.rankInClass,
      totalInClass: gamificationRes.totalInClass,
    });
    setShowRewardModal(true);

    onProgressUpdated();
  };

  const handleQuizComplete = (score: number, maxScore: number, xpEarned: number) => {
    if (!currentUser) return;
    const currentProg = progress || {
      userId: currentUser.id,
      lessonId: lesson.id,
      status: 'in_progress',
      gameScore: 0,
      quizScore: 0,
      xpEarned: 0,
    };

    const isPre = quizMode === 'pre_test' || activeTab === 'pre_test';

    const newProg: StudentProgress = {
      ...currentProg,
      preTestScore: isPre ? score : currentProg.preTestScore,
      postTestScore: !isPre ? score : currentProg.postTestScore,
      quizScore: !isPre ? score : currentProg.quizScore,
      xpEarned: (currentProg.xpEarned || 0) + xpEarned,
      lastAccessedAt: new Date().toISOString(),
    };

    if (!isPre) {
      newProg.status = 'completed';
      newProg.completedAt = new Date().toISOString();
    }

    StorageService.saveProgress(newProg);

    if (!isPre) {
      // Award chapter completion coins (100 base coins + score bonus)
      const earnedCoins = 100 + score * 10;
      const gamificationRes = StorageService.awardGamificationRewards(currentUser.id, {
        coins: earnedCoins,
        xp: xpEarned,
        badgeId: lesson.badgeRewardId || `badge-${lesson.chapterNumber}`,
        lessonChapter: lesson.chapterNumber,
        isLessonCompleted: true,
      });

      setRewardModalData({
        rewardType: 'chapter_completed',
        title: `🏆 ยินดีด้วย! จบบทเรียนที่ ${lesson.chapterNumber} เรียบร้อย!`,
        subtitle: `${lesson.title} • สอบผ่านและปลดล็อคเหรียญเกียรติยศประจำบท`,
        earnedCoins,
        earnedXp: xpEarned,
        newTotalCoins: gamificationRes.newTotalCoins,
        newTotalXp: gamificationRes.newTotalXp,
        newLevel: gamificationRes.newLevel,
        isLevelUp: gamificationRes.isLevelUp,
        badgeName: badge?.name || `เหรียญตราประจำบทที่ ${lesson.chapterNumber}`,
        badgeIcon: badge?.icon || '🏆',
        classroom: gamificationRes.updatedProfile.classroom || 'ม.1/1',
        rankInClass: gamificationRes.rankInClass,
        totalInClass: gamificationRes.totalInClass,
      });
      setShowRewardModal(true);
    } else {
      // Pre-test completion coins
      const earnedCoins = 30 + score * 5;
      const gamificationRes = StorageService.awardGamificationRewards(currentUser.id, {
        coins: earnedCoins,
        xp: xpEarned,
        lessonChapter: lesson.chapterNumber,
      });

      setRewardModalData({
        rewardType: 'quiz_passed',
        title: `📝 ทำแบบทดสอบก่อนเรียนบทที่ ${lesson.chapterNumber} สำเร็จ!`,
        subtitle: `วัดระดับความรู้เบื้องต้น พร้อมลุยเรียนรู้บทเรียนถัดไป`,
        earnedCoins,
        earnedXp: xpEarned,
        newTotalCoins: gamificationRes.newTotalCoins,
        newTotalXp: gamificationRes.newTotalXp,
        newLevel: gamificationRes.newLevel,
        isLevelUp: gamificationRes.isLevelUp,
        classroom: gamificationRes.updatedProfile.classroom || 'ม.1/1',
        rankInClass: gamificationRes.rankInClass,
        totalInClass: gamificationRes.totalInClass,
      });
      setShowRewardModal(true);
    }

    onProgressUpdated();
  };

  return (
    <div
      id="lesson-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
    >
      <div
        id="lesson-modal-card"
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl text-slate-100 overflow-hidden my-6 max-h-[92vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  บทที่ {lesson.chapterNumber}
                </span>
                <span className="text-xs text-slate-400">สสวท. ม.1</span>
              </div>
              <h2 className="font-black text-lg sm:text-xl text-white font-['Chakra_Petch'] leading-tight">
                {lesson.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="lesson-modal-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Teacher / Admin Stage Access Control Banner (แยกตามห้องเรียนได้) */}
        {isTeacherOrAdmin && (
          <div className="px-6 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                <span>ล็อคด่านนี้แยกตามห้อง:</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedClassLockScope('global')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                  selectedClassLockScope === 'global'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                🌐 ทุกห้อง {StorageService.getGlobalLockedChapters().includes(lesson.chapterNumber) ? '🔒' : '🔓'}
              </button>
              {allClasses.map((cls) => {
                const isClsLocked = StorageService.getClassLockedChapters(cls.name).includes(lesson.chapterNumber);
                const isSelected = selectedClassLockScope === cls.name;
                return (
                  <button
                    key={cls.id || cls.name}
                    type="button"
                    onClick={() => setSelectedClassLockScope(cls.name)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow ring-2 ring-indigo-400'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    ห้อง {cls.name} {isClsLocked ? '🔒' : '🔓'}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => handleToggleLockScope(selectedClassLockScope)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow cursor-pointer text-xs ${
                isCurrentScopeLocked
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
            >
              {isCurrentScopeLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>
                {isCurrentScopeLocked ? 'ปลดล็อคบทนี้' : 'ล็อคบทนี้'} ({selectedClassLockScope === 'global' ? 'ทุกห้อง' : `ห้อง ${selectedClassLockScope}`})
              </span>
            </button>
          </div>
        )}

        {/* If Stage is Locked for Student */}
        {isChapterLockedForStudent ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 my-auto">
            <div className="w-20 h-20 rounded-3xl bg-rose-500/20 border-2 border-rose-500/40 flex items-center justify-center text-rose-400 shadow-2xl shadow-rose-950/50 animate-pulse">
              <Lock className="w-10 h-10" />
            </div>

            <div className="space-y-2 max-w-md">
              <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold uppercase tracking-wider">
                {studentLockInfo.lockType === 'classroom'
                  ? `ด่านนี้ถูกล็อคสำหรับห้อง ${studentLockInfo.classroomName}`
                  : 'ด่านนี้ถูกล็อคโดยคุณครูผู้สอน'}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white font-['Chakra_Petch'] pt-1">
                บทเรียนที่ {lesson.chapterNumber}: {lesson.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {studentLockInfo.lockType === 'classroom'
                  ? `คุณครูผู้สอนได้ตั้งล็อคด่านนี้ไว้สำหรับห้องเรียน ${studentLockInfo.classroomName} ของคุณ เมื่อถึงชั่วโมงเรียนที่คุณครูกำหนด คุณครูจะทำการปลดล็อคบทเรียนนี้ให้นักเรียนเข้าศึกษา`
                  : 'คุณครูผู้สอนได้ตั้งล็อคด่านนี้ไว้สำหรับการจัดการเรียนรู้ในห้องเรียน เมื่อถึงชั่วโมงเรียนที่คุณครูกำหนด คุณครูจะทำการปลดล็อคบทเรียนนี้ให้นักเรียนเข้าศึกษา'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 max-w-md space-y-1.5 text-left">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>คำแนะนำ:</span>
              </div>
              <p>• ให้นักเรียนรอคุณครูปลดล็อคด่านนี้ หรือกลับไปทบทวนบทเรียนและทำใบงานในบทก่อนหน้า</p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-transform hover:scale-105 shadow-lg cursor-pointer"
              >
                กลับไปหน้าแผนที่การเรียนรู้
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 py-2 bg-slate-950 border-b border-slate-800 text-xs sm:text-sm font-semibold overflow-x-auto shrink-0">
          {lesson.chapterNumber === 7 ? (
            <>
              <button
                id="tab-lesson-pretest"
                onClick={() => {
                  setQuizMode('pre_test');
                  const target = StorageService.getChapterQuiz(7, 'pre_test');
                  setQuizEditForm(target);
                  setActiveTab('pre_test');
                }}
                className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
                  activeTab === 'pre_test'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>แบบทดสอบก่อนเรียน (30 ข้อ)</span>
                {progress?.preTestScore !== undefined && progress.preTestScore > 0 ? (
                  <span className="text-[10px] bg-slate-950 text-amber-300 font-bold px-1.5 py-0.5 rounded-full">
                    {progress.preTestScore}/30 ข้อ
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-400/50" />
                )}
              </button>

              <button
                id="tab-lesson-posttest"
                onClick={() => {
                  setQuizMode('post_test');
                  const target = StorageService.getChapterQuiz(7, 'post_test');
                  setQuizEditForm(target);
                  setActiveTab('post_test');
                }}
                className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
                  activeTab === 'post_test' || activeTab === 'quiz'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                <span>แบบทดสอบหลังเรียน (30 ข้อ)</span>
                {progress?.quizScore !== undefined && progress.quizScore > 0 ? (
                  <span className="text-[10px] bg-slate-950 text-emerald-300 font-bold px-1.5 py-0.5 rounded-full">
                    {progress.quizScore}/30 ข้อ
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-400/50" />
                )}
              </button>

              <button
                id="tab-lesson-content"
                onClick={() => setActiveTab('content')}
                className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
                  activeTab === 'content'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>ทบทวนเนื้อหา 6 บท</span>
              </button>

              <button
                id="tab-lesson-badge"
                onClick={() => setActiveTab('badge')}
                className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
                  activeTab === 'badge'
                    ? 'bg-purple-500 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>เหรียญมหาบัณฑิต</span>
              </button>
            </>
          ) : (
            <>
              <button
                id="tab-lesson-content"
                onClick={() => setActiveTab('content')}
                className={`px-3 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
                  activeTab === 'content'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>สรุปเนื้อหาบทเรียน</span>
              </button>

              <button
                id="tab-lesson-video"
                onClick={() => setActiveTab('video')}
                className={`px-3 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
                  activeTab === 'video'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>วิดีโอ สสวท.</span>
              </button>

              <button
                id="tab-lesson-game"
                onClick={() => setActiveTab('game')}
                className={`px-3 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
                  activeTab === 'game'
                    ? 'bg-indigo-500 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Gamepad2 className="w-4 h-4" />
                <span>มินิเกมประจำบท</span>
                {progress?.gameScore !== undefined && progress.gameScore > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </button>

              <button
                id="tab-lesson-pretest"
                onClick={() => {
                  setQuizMode('pre_test');
                  const target = StorageService.getChapterQuiz(lesson.chapterNumber, 'pre_test');
                  setQuizEditForm(target);
                  setActiveTab('pre_test');
                }}
                className={`px-3 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
                  activeTab === 'pre_test'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>แบบทดสอบก่อนเรียน (Pre-test)</span>
                {progress?.preTestScore !== undefined && progress.preTestScore > 0 ? (
                  <span className="text-[10px] bg-slate-950 text-amber-300 font-bold px-1.5 py-0.5 rounded-full">
                    {progress.preTestScore} คะแนน
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-400/50" />
                )}
              </button>

              <button
                id="tab-lesson-posttest"
                onClick={() => {
                  setQuizMode('post_test');
                  const target = StorageService.getChapterQuiz(lesson.chapterNumber, 'post_test');
                  setQuizEditForm(target);
                  setActiveTab('post_test');
                }}
                className={`px-3 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
                  activeTab === 'post_test' || activeTab === 'quiz'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                <span>แบบทดสอบหลังเรียน (Post-test)</span>
                {progress?.quizScore !== undefined && progress.quizScore > 0 ? (
                  <span className="text-[10px] bg-slate-950 text-emerald-300 font-bold px-1.5 py-0.5 rounded-full">
                    {progress.quizScore} คะแนน
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-400/50" />
                )}
              </button>

              <button
                id="tab-lesson-worksheet"
                onClick={() => setActiveTab('worksheet')}
                className={`px-3 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
                  activeTab === 'worksheet'
                    ? 'bg-indigo-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>ใบงานเก็บคะแนน</span>
                {existingSubmission?.score !== undefined && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1 rounded">
                    {existingSubmission.score} คะแนน
                  </span>
                )}
              </button>

              <button
                id="tab-lesson-badge"
                onClick={() => setActiveTab('badge')}
                className={`px-3 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
                  activeTab === 'badge'
                    ? 'bg-purple-500 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>เหรียญรางวัล</span>
              </button>
            </>
          )}
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: Content Summary */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              {/* Edit Button */}
              {isTeacherOrAdmin && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditingContent(!isEditingContent)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow transition-all hover:scale-105"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditingContent ? 'ปิดการแก้ไข' : 'แก้ไข'}</span>
                  </button>
                </div>
              )}

              {/* Save Success Alert Banner */}
              {contentSaveMsg && (
                <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-emerald-300 text-xs font-semibold shadow-lg animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{contentSaveMsg}</span>
                </div>
              )}

              {/* INLINE TEACHER/ADMIN CONTENT EDITOR */}
              {isTeacherOrAdmin && isEditingContent ? (
                <form onSubmit={handleSaveContentInline} className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 space-y-5 text-left shadow-2xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-sm text-white">แก้ไขและเพิ่มเติมเนื้อหา บทที่ {contentEditForm.chapterNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingContent(false)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 font-semibold"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>บันทึกเนื้อหาบทเรียน</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">ชื่อบทเรียน</label>
                      <input
                        type="text"
                        value={contentEditForm.title}
                        onChange={(e) => setContentEditForm({ ...contentEditForm, title: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">หน้าในหนังสือเรียน สสวท. ม.1</label>
                      <input
                        type="text"
                        value={contentEditForm.textbookPages}
                        onChange={(e) => setContentEditForm({ ...contentEditForm, textbookPages: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">คำอธิบายย่อของบทเรียน</label>
                      <textarea
                        rows={3}
                        value={contentEditForm.description}
                        onChange={(e) => setContentEditForm({ ...contentEditForm, description: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500 leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">สาระสำคัญประจำบท (Core Concept)</label>
                      <textarea
                        rows={3}
                        value={contentEditForm.coreConcept}
                        onChange={(e) => setContentEditForm({ ...contentEditForm, coreConcept: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500 leading-relaxed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">เนื้อหาการเรียนรู้สรุป (Content Summary)</label>
                    <textarea
                      rows={5}
                      value={contentEditForm.contentSummary}
                      onChange={(e) => setContentEditForm({ ...contentEditForm, contentSummary: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500 leading-relaxed"
                    />
                  </div>

                  {/* Learning Objectives Editor */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>จุดประสงค์การเรียนรู้ ({contentEditForm.objectives?.length || 0} ข้อ)</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleAddInlineObjective}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>เพิ่มจุดประสงค์</span>
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(contentEditForm.objectives || []).map((obj, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                            {oIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={obj}
                            onChange={(e) => handleUpdateInlineObjective(oIdx, e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteInlineObjective(oIdx)}
                            className="p-1.5 text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Sections Editor */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>หัวข้อย่อยเนื้อหาและประเด็นสำคัญ ({contentEditForm.summarySections?.length || 0} หัวข้อ)</span>
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          ครูสามารถเพิ่มหัวข้อย่อยเนื้อหาใหม่ และระบุประเด็นสำคัญให้นักเรียนอ่านได้
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddInlineSummarySection}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>เพิ่มหัวข้อย่อยเนื้อหา</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {(contentEditForm.summarySections || []).map((sec, sIdx) => (
                        <div key={sIdx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="text-xs font-bold text-amber-400">หัวข้อที่ {sIdx + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteInlineSummarySection(sIdx)}
                              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ลบหัวข้อนี้</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className="text-[11px] text-slate-400 block mb-1">ชื่อหัวข้อย่อย</label>
                              <input
                                type="text"
                                value={sec.title}
                                onChange={(e) => handleUpdateInlineSummarySection(sIdx, 'title', e.target.value)}
                                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-slate-400 block mb-1">หน้าในหนังสือเรียน</label>
                              <input
                                type="text"
                                value={sec.page}
                                onChange={(e) => handleUpdateInlineSummarySection(sIdx, 'page', e.target.value)}
                                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">เนื้อหาคำอธิบายอย่างละเอียด</label>
                            <textarea
                              rows={3}
                              value={sec.content}
                              onChange={(e) => handleUpdateInlineSummarySection(sIdx, 'content', e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-[11px] text-slate-400 font-semibold">ประเด็นสำคัญ (Key Points):</label>
                              <button
                                type="button"
                                onClick={() => handleAddInlineKeyPoint(sIdx)}
                                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>เพิ่มประเด็น</span>
                              </button>
                            </div>
                            <div className="space-y-1.5">
                              {(sec.keyPoints || []).map((kp, kpIdx) => (
                                <div key={kpIdx} className="flex items-center gap-2">
                                  <span className="text-amber-400 text-xs">•</span>
                                  <input
                                    type="text"
                                    value={kp}
                                    onChange={(e) => handleUpdateInlineKeyPoint(sIdx, kpIdx, e.target.value)}
                                    className="flex-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteInlineKeyPoint(sIdx, kpIdx)}
                                    className="text-slate-500 hover:text-rose-400 p-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">คำสำคัญและหัวข้อย่อย (คั่นด้วยเครื่องหมายจุลภาค , )</label>
                    <input
                      type="text"
                      value={(contentEditForm.topics || []).join(', ')}
                      onChange={(e) =>
                        setContentEditForm({
                          ...contentEditForm,
                          topics: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingContent(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 font-semibold"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow"
                    >
                      <Save className="w-4 h-4" />
                      <span>บันทึกเนื้อหาบทเรียน</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* VIEWING MODE FOR STUDENTS & TEACHERS */
                <>
                  {/* Cover Banner */}
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 h-44 sm:h-52 bg-slate-950">
                    <img
                      src={lesson.coverImageUrl}
                      alt={lesson.title}
                      className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-6 flex flex-col justify-end">
                      <span className="text-xs font-bold text-amber-400">
                        หลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน (ฉบับปรับปรุง พ.ศ. 2560)
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-white font-['Chakra_Petch']">
                        {lesson.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 mt-1">
                        {lesson.description}
                      </p>
                    </div>
                  </div>

                  {/* Textbook Reference & Key Concept Callout */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm flex items-start gap-3">
                      <Sparkles className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                      <div>
                        <div className="font-bold text-amber-300">สาระสำคัญประจำบท (Core Concept):</div>
                        <p className="text-slate-300 mt-1 leading-relaxed">{lesson.coreConcept}</p>
                        <div className="mt-2.5 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-semibold">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>อ้างอิง: {lesson.textbookPages} (สสวท. ม.1)</span>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 text-center space-y-2.5">
                      <div className="text-xs text-amber-300 font-bold flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-amber-400" />
                        <span>เทคโนโลยี วิทยาการคำนวณ ม.1</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        อ่านฉบับเต็มออนไลน์: {lesson.textbookPages}
                      </p>
                      <a
                        id="btn-lesson-ipst-ebook"
                        href="https://pubhtml5.com/ztml/rbqf/"
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2.5 px-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md hover:scale-105"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>เปิดอ่าน E-Book ตอนนี้</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <a
                        id="btn-lesson-ipst-web"
                        href="https://proj14.ipst.ac.th/m1/m1-cs/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center justify-center gap-1 transition-colors"
                      >
                        <span>หรือดูวิดีโอบนเว็บ สสวท. Project 14</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Learning Objectives Callout */}
                  {(lesson.objectives || []).length > 0 && (
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <h4 className="font-bold text-sm text-amber-400 font-['Chakra_Petch'] flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        <span>จุดประสงค์การเรียนรู้ประจำบทเรียน:</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {lesson.objectives?.map((obj, oIdx) => (
                          <div key={oIdx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs text-slate-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{obj}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary Text Content */}
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 space-y-4">
                    <h4 className="font-bold text-base text-white font-['Chakra_Petch'] flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span>เนื้อหาการเรียนรู้สรุป (อ้างอิง สสวท. ม.1)</span>
                    </h4>
                    <div className="text-sm leading-relaxed text-slate-300 whitespace-pre-line">
                      {lesson.contentSummary}
                    </div>
                  </div>

                  {/* Summary Sections: Rich Sub-Topic Cards */}
                  {(lesson.summarySections || []).length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-base text-white font-['Chakra_Petch'] flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-amber-400" />
                          <span>หัวข้อย่อยเนื้อหาอย่างละเอียด ({lesson.summarySections?.length} หัวข้อ)</span>
                        </h4>
                        <span className="text-xs text-slate-400">เนื้อหาครบถ้วนตามหลักสูตร สสวท.</span>
                      </div>

                      <div className="space-y-3.5">
                        {lesson.summarySections?.map((sec, sIdx) => (
                          <div key={sIdx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 space-y-3 hover:border-slate-700 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                              <h5 className="font-bold text-sm text-amber-300 font-['Chakra_Petch'] flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-bold">
                                  {sIdx + 1}
                                </span>
                                <span>{sec.title}</span>
                              </h5>
                              <span className="text-xs text-sky-400 px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 w-fit">
                                {sec.page}
                              </span>
                            </div>

                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                              {sec.content}
                            </p>

                            {sec.keyPoints && sec.keyPoints.length > 0 && (
                              <div className="pt-2">
                                <div className="text-[11px] font-bold text-slate-400 mb-1.5">ประเด็นสำคัญที่ต้องจำ:</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {sec.keyPoints.map((kp, kpIdx) => (
                                    <span key={kpIdx} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-amber-200 flex items-center gap-1.5">
                                      <span className="text-amber-400 font-bold">•</span>
                                      <span>{kp}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Terms / Topics */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-slate-300">คำสำคัญและหัวข้อย่อยที่ต้องรู้:</h4>
                    <div className="flex flex-wrap gap-2">
                      {(lesson.topics || []).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 font-medium"
                        >
                          ✓ {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className={`flex flex-wrap items-center ${lesson.chapterNumber !== 7 ? 'justify-between' : 'justify-end'} gap-3 pt-4 border-t border-slate-800`}>
                    {lesson.chapterNumber !== 7 && (
                      <button
                        onClick={() => setActiveTab('video')}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors"
                      >
                        <Video className="w-4 h-4 text-amber-400" />
                        <span>ดูวิดีโอ สสวท. →</span>
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      {lesson.chapterNumber !== 7 && (
                        <button
                          onClick={() => setActiveTab('game')}
                          className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow hover:scale-105 flex items-center gap-2"
                        >
                          <Gamepad2 className="w-4 h-4" />
                          <span>เล่นมินิเกมประจำบท</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          const targetMode = hasCompletedPreTest ? 'post_test' : 'pre_test';
                          setQuizMode(targetMode);
                          setActiveTab(targetMode);
                        }}
                        className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow hover:scale-105 flex items-center gap-2"
                      >
                        <FileCheck className="w-4 h-4" />
                        <span>{lesson.chapterNumber === 7 ? 'ทำแบบทดสอบรวม 6 บท →' : 'ทำแบบทดสอบ →'}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: Official IPST Video */}
          {activeTab === 'video' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-lg text-white font-['Chakra_Petch']">
                    {chapterVideos.find((v) => v.youtubeId === currentVideoId)?.title || lesson.videoTitle}
                  </h3>
                  <p className="text-xs text-slate-400">
                    ความยาวประมาณ {chapterVideos.find((v) => v.youtubeId === currentVideoId)?.duration || lesson.videoDuration} • แหล่งที่มา: สสวท. Project 14
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isTeacherOrAdmin && (
                    <button
                      onClick={() => {
                        if (!isEditingVideo) {
                          setVideoEditId(toFullYouTubeUrl(currentVideoId));
                        }
                        setIsEditingVideo(!isEditingVideo);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs text-white font-bold flex items-center gap-1.5 transition-all shadow hover:scale-105"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditingVideo ? 'ปิดการแก้ไข' : 'แก้ไข'}</span>
                    </button>
                  )}
                  <a
                    href={toFullYouTubeUrl(currentVideoId)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition-colors self-start sm:self-auto border border-slate-700"
                  >
                    <span>เปิดดูใน YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Video Save Success Banner */}
              {videoSaveMsg && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-lg">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{videoSaveMsg}</span>
                </div>
              )}

              {/* Teacher/Admin Inline Video Editor */}
              {isEditingVideo && isTeacherOrAdmin && (
                <form onSubmit={handleSaveVideoInline} className="p-4 bg-slate-950 border border-rose-500/30 rounded-2xl space-y-4 shadow-xl text-left">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>แก้ไขรายละเอียดวิดีโอประจำบทที่ {lesson.chapterNumber}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDeleteVideoInline}
                        className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                        title="ลบคลิปวิดีโอนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบคลิปนี้</span>
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>บันทึกวิดีโอ</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        ชื่อคลิปวิดีโอ
                      </label>
                      <input
                        type="text"
                        value={videoEditTitle}
                        onChange={(e) => setVideoEditTitle(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        ความยาวคลิป
                      </label>
                      <input
                        type="text"
                        value={videoEditDuration}
                        onChange={(e) => setVideoEditDuration(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      ลิงก์ YouTube (วางลิงก์เต็มได้เลย เช่น https://www.youtube.com/watch?v=...)
                    </label>
                    <input
                      type="text"
                      value={videoEditId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setVideoEditId(val);
                        const autoDur = autoDetectVideoDuration(val, videoEditDuration);
                        setVideoEditDuration(autoDur || videoEditDuration);
                      }}
                      placeholder="https://www.youtube.com/watch?v=... หรือ https://youtu.be/..."
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-rose-300 font-mono focus:outline-none focus:border-rose-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      รองรับการวาง URL เต็มจากแถบที่อยู่เว็บ ลิงก์ย่อ หรือปุ่มแชร์
                    </span>
                  </div>
                </form>
              )}

              {/* YouTube Embed Player */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
                <iframe
                  src={getYouTubeEmbedUrl(currentVideoId)}
                  title={lesson.videoTitle || lesson.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* Chapter Videos Switcher if more than 1 video */}
              {chapterVideos.length > 1 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    คลิปวิดีโอของบทเรียนนี้ ({chapterVideos.length} คลิป)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {chapterVideos.map((vid) => {
                      const isSelected = vid.youtubeId === currentVideoId;
                      return (
                        <button
                          key={vid.id}
                          onClick={() => setCurrentVideoId(vid.youtubeId)}
                          className={`text-left p-2.5 rounded-xl border transition-all flex items-center gap-3 ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500/30'
                              : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="w-20 aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-700 relative shrink-0">
                            <img
                              src={vid.thumbnailUrl || `https://img.youtube.com/vi/${vid.youtubeId}/hqdefault.jpg`}
                              alt={vid.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                              <Play className="w-3.5 h-3.5 text-white fill-current" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold truncate text-white">
                              {vid.title}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {vid.duration}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                💡 <strong>คำแนะนำในการเรียนรู้:</strong> แนะนำให้นักเรียนรับชมวิดีโอนี้เพื่อทำความเข้าใจตัวอย่างและสถานการณ์จำลอง ก่อนจะไปลุยในมินิเกมและทำแบบทดสอบท้ายบท
              </div>

              <div className="flex justify-end gap-3 pt-2">
                {lesson.chapterNumber === 7 ? (
                  <button
                    onClick={() => {
                      const targetMode = hasCompletedPreTest ? 'post_test' : 'pre_test';
                      setQuizMode(targetMode);
                      setActiveTab(targetMode);
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>{hasCompletedPreTest ? 'ไปทำแบบทดสอบหลังเรียน (30 ข้อ) →' : 'ไปทำแบบทดสอบก่อนเรียน (30 ข้อ) →'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('game')}
                    className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow"
                  >
                    <Gamepad2 className="w-4 h-4" />
                    <span>ไปเล่นมินิเกมประจำบท →</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Interactive Mini-Game */}
          {activeTab === 'game' && lesson.chapterNumber !== 7 && (
            <div className="space-y-4">
              {currentUser?.role === 'student' && !hasCompletedPreTest ? (
                <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-5 bg-slate-950/80 border-2 border-amber-500/40 rounded-3xl shadow-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 animate-bounce">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div className="space-y-2 max-w-md">
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider">
                      ขั้นตอนที่ 1: แบบทดสอบก่อนเรียน
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white font-['Chakra_Petch']">
                      มินิเกมประจำบทที่ {lesson.chapterNumber} ยังไม่ปลดล็อค
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      เพื่อประเมินความรู้พื้นฐานและสร้างความท้าทายในการเรียนรู้ ให้นักเรียนทำ <strong>แบบทดสอบก่อนเรียน (Pre-test)</strong> ให้เรียบร้อยก่อน จึงจะสามารถปลดล็อคเข้าเล่นมินิเกมและตัวจำลองโค้ดได้
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setQuizMode('pre_test');
                        setActiveTab('pre_test');
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-sm shadow-xl flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>ทำแบบทดสอบก่อนเรียน (Pre-test) ทันที →</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('content')}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5 inline mr-1" />
                      <span>อ่านสรุปเนื้อหาก่อน</span>
                    </button>
                  </div>
                </div>
              ) : (
                <GameContainer
                  chapterId={lesson.chapterNumber}
                  onGameComplete={handleGameComplete}
                />
              )}
            </div>
          )}

          {/* TAB 4: Chapter Quiz (Pre-test or Post-test) */}
          {(activeTab === 'quiz' || activeTab === 'pre_test' || activeTab === 'post_test') && (
            <div className="space-y-4">
              {/* Quiz Mode Switcher (Pre-test / Post-test) & Teacher Edit Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800 gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs text-slate-300 font-semibold">
                    เลือกโหมดแบบทดสอบประจำบทที่ {lesson.chapterNumber}:
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
                    <button
                      type="button"
                      onClick={() => setQuizMode('pre_test')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        quizMode === 'pre_test'
                          ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ก่อนเรียน (Pre-test)
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuizMode('post_test')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        quizMode === 'post_test'
                          ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      หลังเรียน (Post-test)
                    </button>
                  </div>

                  {isTeacherOrAdmin && (
                    <button
                      type="button"
                      onClick={() => setIsEditingQuiz(!isEditingQuiz)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow shrink-0 ${
                        isEditingQuiz
                          ? 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditingQuiz ? 'ปิดการแก้ไข' : 'แก้ไข'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Save Success Alert Banner */}
              {quizSaveMsg && (
                <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-emerald-300 text-xs font-semibold shadow-lg animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{quizSaveMsg}</span>
                </div>
              )}

              {/* INLINE TEACHER QUIZ EDITOR */}
              {isTeacherOrAdmin && isEditingQuiz ? (
                <form onSubmit={handleSaveQuizInline} className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 space-y-5 text-left shadow-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-white font-['Chakra_Petch'] flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-amber-400" />
                        <span>จัดการข้อสอบ {quizMode === 'pre_test' ? 'ก่อนเรียน (Pre-test)' : 'หลังเรียน (Post-test)'} บทที่ {lesson.chapterNumber}</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        แก้ไขคำถาม ตัวเลือก คำตอบที่ถูกต้อง หรือเพิ่มข้อคำถามใหม่ได้ทันที
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingQuiz(false)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 font-semibold"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>บันทึกแบบทดสอบ</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">หัวข้อแบบทดสอบ</label>
                    <input
                      type="text"
                      value={quizEditForm.title}
                      onChange={(e) => setQuizEditForm({ ...quizEditForm, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Question Cards List */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-300">
                        รายการข้อสอบ ({quizEditForm.questions?.length || 0} ข้อ):
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleResetInlineQuizToDefault}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3 text-amber-400" />
                          <span>คืนค่ามาตรฐาน สสวท.</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleAddInlineQuestion}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>เพิ่มข้อคำถามใหม่</span>
                        </button>
                      </div>
                    </div>

                    {(quizEditForm.questions || []).map((q, qIdx) => {
                      const currentCorrect = q.correctIndex ?? q.correctAnswer ?? 0;

                      return (
                        <div
                          key={q.id || qIdx}
                          className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3.5 text-left"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-amber-400">
                                ข้อที่ {qIdx + 1}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={qIdx === 0}
                                  onClick={() => handleMoveInlineQuestion(qIdx, 'up')}
                                  className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                                  title="เลื่อนข้อคำถามขึ้น"
                                >
                                  <MoveUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={qIdx === (quizEditForm.questions?.length || 1) - 1}
                                  onClick={() => handleMoveInlineQuestion(qIdx, 'down')}
                                  className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                                  title="เลื่อนข้อคำถามลง"
                                >
                                  <MoveDown className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteInlineQuestion(qIdx)}
                              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ลบข้อนี้</span>
                            </button>
                          </div>

                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">
                              โจทย์คำถาม
                            </label>
                            <textarea
                              rows={2}
                              value={q.question}
                              onChange={(e) => handleUpdateInlineQuestion(qIdx, { question: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          {/* Options */}
                          <div className="space-y-2">
                            <label className="text-[11px] text-slate-400 block">
                              ตัวเลือกคำตอบ (คลิกตัวอักษรด้านหน้าเพื่อกำหนดข้อที่ถูกต้อง):
                            </label>
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateInlineQuestion(qIdx, { correctIndex: optIdx, correctAnswer: optIdx })}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                                    currentCorrect === optIdx
                                      ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400'
                                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                  }`}
                                  title="คลิกเพื่อเลือกข้อนี้เป็นคำตอบที่ถูกต้อง"
                                >
                                  {String.fromCharCode(65 + optIdx)}
                                </button>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const newOpts = [...q.options];
                                    newOpts[optIdx] = e.target.value;
                                    handleUpdateInlineQuestion(qIdx, { options: newOpts });
                                  }}
                                  className={`flex-1 px-3 py-1.5 rounded-xl text-xs bg-slate-900 border ${
                                    currentCorrect === optIdx
                                      ? 'border-emerald-500/50 text-emerald-200'
                                      : 'border-slate-800 text-slate-200'
                                  }`}
                                />
                              </div>
                            ))}
                          </div>

                          {/* Explanation */}
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">
                              คำอธิบายเฉลยและเหตุผล (แสดงหลังจากนักเรียนตรวจคำตอบ)
                            </label>
                            <textarea
                              rows={2}
                              value={q.explanation || ''}
                              onChange={(e) => handleUpdateInlineQuestion(qIdx, { explanation: e.target.value })}
                              placeholder="เช่น ข้อนี้ตอบ ก เพราะว่า..."
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingQuiz(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 font-semibold"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow"
                    >
                      <Save className="w-4 h-4" />
                      <span>บันทึกแบบทดสอบ ({quizMode === 'pre_test' ? 'ก่อนเรียน' : 'หลังเรียน'})</span>
                    </button>
                  </div>
                </form>
              ) : !isTeacherOrAdmin && quizMode === 'post_test' && !hasCompletedPreTest ? (
                <div className="p-8 text-center flex flex-col items-center justify-center space-y-4 bg-slate-950/80 border-2 border-emerald-500/30 rounded-3xl">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5 max-w-md">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                      ขั้นตอนที่ 1: แบบทดสอบก่อนเรียน (Pre-test)
                    </span>
                    <h3 className="text-lg font-bold text-white font-['Chakra_Petch']">
                      ยังไม่สามารถทำแบบทดสอบหลังเรียนได้
                    </h3>
                    <p className="text-xs text-slate-300">
                      นักเรียนต้องทำ <strong>แบบทดสอบก่อนเรียน (Pre-test)</strong> ก่อน จึงจะสามารถตอบหรือส่งคำตอบแบบทดสอบหลังเรียน (Post-test) ประจำบทที่ {lesson.chapterNumber} ได้
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setQuizMode('pre_test');
                      setActiveTab('pre_test');
                    }}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow cursor-pointer transition-transform hover:scale-105"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>ไปทำแบบทดสอบก่อนเรียน (Pre-test) ทันที →</span>
                  </button>
                </div>
              ) : !isTeacherOrAdmin && lesson.chapterNumber !== 7 && quizMode === 'post_test' && !hasCompletedGame ? (
                <div className="p-8 text-center flex flex-col items-center justify-center space-y-4 bg-slate-950/80 border-2 border-indigo-500/30 rounded-3xl">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                    <Gamepad2 className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5 max-w-md">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
                      ขั้นตอนที่ 2: มินิเกมและเนื้อหาประจำบท
                    </span>
                    <h3 className="text-lg font-bold text-white font-['Chakra_Petch']">
                      กรุณาเล่นมินิเกมประจำบทก่อนทำแบบทดสอบหลังเรียน
                    </h3>
                    <p className="text-xs text-slate-300">
                      นักเรียนทำแบบทดสอบก่อนเรียนเรียบร้อยแล้ว ขั้นต่อไปให้ฝึกทักษะผ่าน <strong>มินิเกมจำลองบทเรียนที่ {lesson.chapterNumber}</strong> ให้จบ จึงจะมาทดสอบความเข้าใจในแบบทดสอบหลังเรียน
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('game')}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow cursor-pointer transition-transform hover:scale-105"
                  >
                    <Gamepad2 className="w-4 h-4" />
                    <span>ไปเล่นมินิเกมประจำบทที่ {lesson.chapterNumber} ทันที →</span>
                  </button>
                </div>
              ) : (
                <QuizComponent
                  key={`${lesson.chapterNumber}-${quizMode}-${quizVersion}`}
                  quiz={currentQuiz}
                  chapterNumber={lesson.chapterNumber}
                  currentUser={currentUser}
                  onQuizComplete={handleQuizComplete}
                />
              )}
            </div>
          )}

          {/* TAB 5: Badge and Statistics (with Teacher & Admin Editing) */}
          {activeTab === 'badge' && (
            <div className="space-y-6 max-w-2xl mx-auto py-4 text-center">
              {/* Edit Button */}
              {isTeacherOrAdmin && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditingBadge(!isEditingBadge)}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow hover:scale-105"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditingBadge ? 'ปิดการแก้ไข' : 'แก้ไข'}</span>
                  </button>
                </div>
              )}

              {badgeSaveMsg && (
                <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in shadow">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{badgeSaveMsg}</span>
                </div>
              )}

              {isTeacherOrAdmin && isEditingBadge ? (
                <form onSubmit={handleSaveBadgeInline} className="p-5 rounded-2xl bg-slate-900 border border-purple-500/30 space-y-4 text-left shadow-2xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h4 className="font-bold text-sm text-white font-['Chakra_Petch']">
                      แก้ไขข้อมูลเหรียญรางวัลประจำบทที่ {lesson.chapterNumber}
                    </h4>
                    <button
                      type="button"
                      onClick={handleResetBadgeDefault}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>คืนค่าเริ่มต้น</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        ชื่อเหรียญรางวัล (ภาษาไทย)
                      </label>
                      <input
                        type="text"
                        value={badgeEditForm.titleTh || badgeEditForm.name}
                        onChange={(e) => setBadgeEditForm({ ...badgeEditForm, titleTh: e.target.value, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        ไอคอนสัญลักษณ์ (Emoji เช่น 🏆, 🎖️, 🌟)
                      </label>
                      <input
                        type="text"
                        value={badgeEditForm.icon || '🏆'}
                        onChange={(e) => setBadgeEditForm({ ...badgeEditForm, icon: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-center text-lg text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      คำอธิบายเงื่อนไขการได้รับเหรียญ
                    </label>
                    <textarea
                      rows={2}
                      value={badgeEditForm.description}
                      onChange={(e) => setBadgeEditForm({ ...badgeEditForm, description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        ระดับความหายาก (Rarity)
                      </label>
                      <select
                        value={badgeEditForm.rarity || 'rare'}
                        onChange={(e) => setBadgeEditForm({ ...badgeEditForm, rarity: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="common">Common (ทั่วไป)</option>
                        <option value="rare">Rare (หายาก)</option>
                        <option value="epic">Epic (ระดับมหากาพย์)</option>
                        <option value="legendary">Legendary (ระดับตำนาน)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        เกณฑ์คะแนนขั้นต่ำ (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={badgeEditForm.requiredScorePercent || 70}
                        onChange={(e) => setBadgeEditForm({ ...badgeEditForm, requiredScorePercent: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingBadge(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>บันทึกเหรียญรางวัล</span>
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-1 shadow-2xl">
                    <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-4xl">
                      {badgeEditForm.icon || badge?.icon || '🎖️'}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                      เหรียญตราเกียรติยศประจำบท
                    </span>
                    <h3 className="text-2xl font-black text-white font-['Chakra_Petch'] mt-2">
                      {badgeEditForm.titleTh || badgeEditForm.name || badge?.name || 'เหรียญตราประจำบท'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1">
                      {badgeEditForm.description || badge?.description || 'พิชิตบทเรียนเพื่อปลดล็อกเหรียญนี้'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-3 text-xs max-w-lg mx-auto">
                    <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">สถานะบทเรียน:</span>
                      <span className="font-bold text-emerald-400">
                        {progress?.status === 'completed' ? 'ผ่านบทเรียนแล้ว' : 'กำลังเรียนรู้'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">คะแนนแบบทดสอบก่อนเรียน (Pre-test):</span>
                      <span className="font-bold text-amber-300">
                        {progress?.preTestScore !== undefined ? `${progress.preTestScore} คะแนน` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">คะแนนมินิเกม:</span>
                      <span className="font-bold text-amber-400">
                        {progress?.gameScore !== undefined ? `${progress.gameScore} คะแนน` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">คะแนนแบบทดสอบหลังเรียน (Post-test):</span>
                      <span className="font-bold text-emerald-400">
                        {progress?.postTestScore !== undefined ? `${progress.postTestScore} / ${currentQuiz?.questions?.length || 5} คะแนน` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400">XP ที่ได้รับรวม:</span>
                      <span className="font-bold text-amber-300">
                        +{progress?.xpEarned || 0} XP
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 6: Interactive Worksheet for Students & Teacher Editing */}
          {activeTab === 'worksheet' && (
            <div className="space-y-6 max-w-4xl mx-auto py-2 text-left">
              {/* Edit / Review Toggle Bar */}
              {isTeacherOrAdmin && (
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900 border border-slate-800 rounded-2xl">
                  <div className="text-xs font-bold text-slate-300">
                    ใบงานประจำบทที่ {lesson.chapterNumber}
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setTeacherWorksheetTab('edit');
                        setIsEditingWorksheet(true);
                      }}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                        teacherWorksheetTab === 'edit'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>แก้ไข</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTeacherWorksheetTab('submissions');
                        setIsEditingWorksheet(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                        teacherWorksheetTab === 'submissions'
                          ? 'bg-emerald-600 text-white font-bold shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>ตรวจงาน ({chapterSubmissions.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTeacherWorksheetTab('preview');
                        setIsEditingWorksheet(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                        teacherWorksheetTab === 'preview'
                          ? 'bg-indigo-600 text-white font-bold shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>มุมมองนักเรียน</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Feedback Alert Banner */}
              {worksheetSaveMsg && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-lg">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{worksheetSaveMsg}</span>
                </div>
              )}

              {/* 1. TEACHER/ADMIN EDIT MODE */}
              {isTeacherOrAdmin && teacherWorksheetTab === 'edit' && (
                <form onSubmit={handleSaveWorksheetInline} className="space-y-5">
                  <div className="p-5 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                          ใบงานประจำบทที่ {worksheetEditForm.chapterNumber}
                        </span>
                        <span className="text-xs text-slate-400">
                          ({worksheetEditForm.tasks.length} ข้อคำถาม)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleResetWorksheetDefault}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-800 transition-colors"
                          title="คืนค่ามาตรฐาน สสวท."
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>คืนค่ามาตรฐาน</span>
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition-all hover:scale-105"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>บันทึกใบงาน</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                          ชื่อใบงาน
                        </label>
                        <input
                          type="text"
                          required
                          value={worksheetEditForm.title}
                          onChange={(e) => setWorksheetEditForm({ ...worksheetEditForm, title: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                          คะแนนเต็มรวม (Max Score)
                        </label>
                        <input
                          type="number"
                          required
                          value={worksheetEditForm.maxScore}
                          onChange={(e) => setWorksheetEditForm({ ...worksheetEditForm, maxScore: Number(e.target.value) || 10 })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                          แหล่งอ้างอิงบทเรียน (Textbook Ref)
                        </label>
                        <input
                          type="text"
                          value={worksheetEditForm.textbookRef || ''}
                          onChange={(e) => setWorksheetEditForm({ ...worksheetEditForm, textbookRef: e.target.value })}
                          placeholder="เช่น หนังสือ สสวท. ม.1 บทที่ 1 หน้า 4-21"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                          กำหนดส่ง (Due Date)
                        </label>
                        <input
                          type="date"
                          value={worksheetEditForm.dueDate || ''}
                          onChange={(e) => setWorksheetEditForm({ ...worksheetEditForm, dueDate: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        คำชี้แจงสำหรับนักเรียน (Instructions)
                      </label>
                      <textarea
                        rows={2}
                        value={worksheetEditForm.instructions}
                        onChange={(e) => setWorksheetEditForm({ ...worksheetEditForm, instructions: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Tasks List Editor */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        รายการคำถามในใบงาน ({worksheetEditForm.tasks.length} ข้อ)
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddTaskInline}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>เพิ่มข้อคำถาม</span>
                      </button>
                    </div>

                    {worksheetEditForm.tasks.map((task, tIdx) => (
                      <div
                        key={task.id || tIdx}
                        className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 relative group hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                          <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                            <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                              {tIdx + 1}
                            </span>
                            <span>คำถามข้อที่ {tIdx + 1}</span>
                          </span>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400">คะแนนเต็มข้อนี้:</span>
                            <input
                              type="number"
                              value={task.maxScore}
                              onChange={(e) => handleUpdateTaskInline(tIdx, { maxScore: Number(e.target.value) || 5 })}
                              className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-center text-amber-400 font-bold focus:outline-none focus:border-amber-400"
                            />

                            {/* Reorder Buttons */}
                            <div className="flex items-center gap-0.5 ml-1 border-l border-slate-800 pl-2">
                              <button
                                type="button"
                                disabled={tIdx === 0}
                                onClick={() => handleMoveTaskUpInline(tIdx)}
                                className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                                title="เลื่อนขึ้น"
                              >
                                <MoveUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={tIdx === worksheetEditForm.tasks.length - 1}
                                onClick={() => handleMoveTaskDownInline(tIdx)}
                                className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                                title="เลื่อนลง"
                              >
                                <MoveDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {worksheetEditForm.tasks.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTaskInline(tIdx)}
                                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors ml-1"
                                title="ลบข้อนี้"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                            โจทย์คำถามหรือสถานการณ์
                          </label>
                          <textarea
                            rows={2}
                            value={task.question}
                            onChange={(e) => handleUpdateTaskInline(tIdx, { question: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                              คำใบ้สำหรับนักเรียน (Hint)
                            </label>
                            <input
                              type="text"
                              value={task.hint || ''}
                              onChange={(e) => handleUpdateTaskInline(tIdx, { hint: e.target.value })}
                              placeholder="เช่น ให้พิจารณารายละเอียดที่จำเป็น..."
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-400"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-emerald-400 block mb-1">
                              แนวคำตอบ (สำหรับคุณครูใช้ตรวจ)
                            </label>
                            <input
                              type="text"
                              value={task.sampleAnswer || ''}
                              onChange={(e) => handleUpdateTaskInline(tIdx, { sampleAnswer: e.target.value })}
                              placeholder="แนวทางคำตอบที่ถูกต้อง..."
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-emerald-300 focus:outline-none focus:border-emerald-400"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105"
                    >
                      <Save className="w-4 h-4" />
                      <span>บันทึกการแก้ไขใบงานบทที่ {worksheetEditForm.chapterNumber}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* 2. TEACHER/ADMIN SUBMISSIONS GRADING MODE */}
              {isTeacherOrAdmin && teacherWorksheetTab === 'submissions' && (
                <div className="space-y-5">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white font-['Chakra_Petch']">
                        ผลการส่งใบงานบทที่ {lesson.chapterNumber} ({chapterSubmissions.length} ฉบับ)
                      </h4>
                      <p className="text-xs text-slate-400">
                        ตรวจสอบคำตอบของนักเรียน กรอกคะแนน และระบุคำติชมเพื่อพัฒนาผู้เรียน
                      </p>
                    </div>
                  </div>

                  {chapterSubmissions.length === 0 ? (
                    <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-2xl text-slate-400 text-xs sm:text-sm space-y-2">
                      <UserCheck className="w-10 h-10 text-slate-600 mx-auto" />
                      <div className="font-bold text-slate-300">ยังไม่มีนักเรียนส่งใบงานสำหรับบทนี้</div>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        เมื่อนักเรียนเข้ามาทำใบงานและกดส่ง ข้อมูลคำตอบจะปรากฏในหน้านี้ให้คุณครูตรวจและให้คะแนนทันที
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Submissions List */}
                      <div className="md:col-span-1 space-y-2">
                        <span className="text-xs font-semibold text-slate-400 block px-1">
                          รายชื่อผู้ส่งใบงาน:
                        </span>
                        <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                          {chapterSubmissions.map((sub) => {
                            const isSelected = activeSubForTeacher?.id === sub.id;
                            const isGraded = sub.gradedAt !== undefined;
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => setSelectedSubId(sub.id)}
                                className={`w-full p-3 rounded-xl text-left border transition-all ${
                                  isSelected
                                    ? 'bg-amber-500/10 border-amber-500/50 text-white shadow'
                                    : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold truncate">
                                    {sub.studentName}
                                  </span>
                                  {isGraded ? (
                                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30 shrink-0">
                                      {sub.score}/{worksheet.maxScore} คะแนน
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30 shrink-0">
                                      รอตรวจ
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-1">
                                  ส่งเมื่อ {new Date(sub.submittedAt).toLocaleDateString('th-TH')}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Grading Inspection & Form */}
                      {activeSubForTeacher && (
                        <div className="md:col-span-2 p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-5">
                          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <div>
                              <h5 className="font-bold text-sm text-white">
                                ตรวจใบงานของ: {activeSubForTeacher.studentName}
                              </h5>
                              <p className="text-[11px] text-slate-400">
                                ส่งเมื่อ {new Date(activeSubForTeacher.submittedAt).toLocaleString('th-TH')}
                              </p>
                            </div>
                            {activeSubForTeacher.gradedAt && (
                              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                                ให้คะแนนแล้ว
                              </span>
                            )}
                          </div>

                          {/* Student Answers */}
                          <div className="space-y-4">
                            {worksheet.tasks.map((task, tIdx) => {
                              const ans = activeSubForTeacher.answers[task.id];
                              return (
                                <div
                                  key={task.id}
                                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs"
                                >
                                  <div className="flex items-center justify-between text-amber-300 font-bold">
                                    <span>ข้อที่ {tIdx + 1}: {task.question}</span>
                                    <span className="text-slate-400 text-[11px] shrink-0 ml-2">
                                      (เต็ม {task.maxScore} คะแนน)
                                    </span>
                                  </div>

                                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200">
                                    <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                                      คำตอบของนักเรียน:
                                    </span>
                                    <div className="whitespace-pre-wrap font-sans text-xs">
                                      {ans ? ans : <span className="text-slate-500 italic">ไม่ได้ระบุคำตอบ</span>}
                                    </div>
                                  </div>

                                  {task.sampleAnswer && (
                                    <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 text-[11px]">
                                      <span className="font-bold">แนวคำตอบเกณฑ์ สสวท.:</span> {task.sampleAnswer}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Grading Score & Feedback Form */}
                          <form onSubmit={handleSaveGradingInline} className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-3">
                            <div className="flex items-center gap-3">
                              <label className="text-xs font-bold text-white shrink-0">
                                คะแนนที่ได้ (เต็ม {worksheet.maxScore}):
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={worksheet.maxScore}
                                required
                                value={gradingScoreInput}
                                onChange={(e) => setGradingScoreInput(Number(e.target.value))}
                                className="w-24 px-3 py-1.5 bg-slate-950 border border-indigo-500/50 rounded-xl text-sm font-bold text-center text-amber-400 focus:outline-none focus:border-amber-400"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                                คำติชมและข้อเสนอแนะของคุณครู:
                              </label>
                              <textarea
                                rows={2}
                                value={gradingFeedbackInput}
                                onChange={(e) => setGradingFeedbackInput(e.target.value)}
                                placeholder="เขียนข้อเสนอแนะเพื่อเสริมสร้างความเข้าใจให้นักเรียน..."
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                              />
                            </div>

                            <div className="flex justify-end">
                              <button
                                type="submit"
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition-transform hover:scale-105"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>บันทึกผลการตรวจ</span>
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 3. STUDENT PREVIEW (OR ACTUAL STUDENT SUBMISSION VIEW) */}
              {(currentUser?.role !== 'teacher' || teacherWorksheetTab === 'preview') && (
                <form onSubmit={handleSubmitWorksheet} className="space-y-6">
                  {/* Worksheet Header Card */}
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
                        ใบงานประจำบทที่ {worksheet.chapterNumber}
                      </span>
                      <span className="text-xs font-bold text-amber-400">
                        คะแนนเต็ม: {worksheet.maxScore} คะแนน
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white font-['Chakra_Petch']">
                      {worksheet.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {worksheet.instructions}
                    </p>

                    {worksheet.textbookRef && (
                      <div className="text-[11px] text-slate-400 pt-1">
                        📖 <strong>อ้างอิง:</strong> {worksheet.textbookRef}
                      </div>
                    )}

                    {/* Teacher grading status banner & detailed feedback */}
                    {existingSubmission && (
                      <div className={`mt-3 p-4 rounded-2xl border text-xs shadow-lg transition-all ${
                        existingSubmission.gradedAt
                          ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-emerald-500/40 text-emerald-200'
                          : 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-yellow-950/80 border-amber-500/40 text-amber-200'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shadow ${
                              existingSubmission.gradedAt ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                            }`}>
                              {existingSubmission.gradedAt ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-white flex items-center gap-2">
                                <span>{existingSubmission.gradedAt ? 'อาจารย์ตรวจและประเมินผลแล้ว' : 'ส่งใบงานเรียบร้อยแล้ว'}</span>
                                {existingSubmission.gradedAt && (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                                    ตรวจแล้ว (Graded)
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400">
                                ส่งเมื่อ: {new Date(existingSubmission.submittedAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} น.
                              </span>
                            </div>
                          </div>

                          {existingSubmission.gradedAt && (
                            <div className="flex items-center gap-2 bg-slate-950/90 px-4 py-2 rounded-xl border border-emerald-500/30">
                              <span className="text-xs text-slate-300 font-semibold">คะแนนที่ได้:</span>
                              <span className="text-base font-black text-amber-400 font-['Chakra_Petch']">
                                {existingSubmission.score} <span className="text-xs text-slate-400 font-normal">/ {worksheet.maxScore} คะแนน</span>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Detailed Teacher Feedback Quote Box */}
                        {existingSubmission.gradedAt && existingSubmission.feedback && (
                          <div className="mt-3 p-3.5 rounded-xl bg-slate-950/90 border border-emerald-500/30 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300">
                              <span className="flex items-center gap-1.5">
                                <span>💬 ข้อคิดเห็นและคำแนะนำจากคุณครู ({existingSubmission.gradedBy || 'คุณครูผู้สอน'}):</span>
                              </span>
                              {existingSubmission.gradedAt && (
                                <span className="text-[10px] text-slate-400 font-normal">
                                  ตรวจเมื่อ {new Date(existingSubmission.gradedAt).toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                                </span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed italic bg-emerald-500/5 p-2.5 rounded-lg border-l-4 border-emerald-400">
                              "{existingSubmission.feedback}"
                            </p>
                          </div>
                        )}

                        {!existingSubmission.gradedAt && (
                          <div className="mt-2 text-xs text-amber-300/90 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>ใบงานของคุณถูกส่งเข้าสู่ระบบของครูผู้สอนแล้ว คุณครูจะทำการตรวจและให้คะแนนพร้อมคำแนะนำเร็วๆ นี้</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {worksheetValidationErr && (
                    <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2.5 animate-shake shadow-lg">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{worksheetValidationErr}</span>
                    </div>
                  )}

                  {worksheetSubmittedMsg && (
                    <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-lg">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>ส่งใบงานเรียบร้อยแล้ว! อาจารย์สามารถเปิดดูและให้คะแนนในระบบได้ทันที</span>
                    </div>
                  )}

                  {/* Tasks Progress & Summary Banner for Students */}
                  {currentUser?.role !== 'teacher' && (
                    <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="text-slate-300 font-semibold">
                          ความคืบหน้าการตอบ:
                        </span>
                        <span className="font-bold text-amber-300 font-mono">
                          {worksheet.tasks.filter((t) => (studentAnswers[t.id] || '').trim().length >= 3).length} / {worksheet.tasks.length} ข้อ
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {worksheet.tasks.filter((t) => (studentAnswers[t.id] || '').trim().length >= 3).length === worksheet.tasks.length
                          ? '🎉 ตอบครบทุกข้อแล้ว พร้อมกดส่ง!'
                          : '⚠️ ต้องพิมพ์คำตอบครบทุกข้อจึงจะส่งได้'}
                      </span>
                    </div>
                  )}

                  {/* Tasks List */}
                  <div className="space-y-4">
                    {worksheet.tasks.map((task, tIdx) => {
                      const ans = studentAnswers[task.id] || '';
                      const isAnswered = ans.trim().length >= 3;

                      return (
                        <div
                          key={task.id}
                          className={`p-5 rounded-2xl bg-slate-950 border transition-all space-y-3 ${
                            !isAnswered && worksheetValidationErr
                              ? 'border-rose-500/60 ring-2 ring-rose-500/20'
                              : isAnswered
                              ? 'border-emerald-500/30'
                              : 'border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px]">
                                {tIdx + 1}
                              </span>
                              <span>คำถามข้อที่ {tIdx + 1}</span>
                            </span>

                            <div className="flex items-center gap-2">
                              {currentUser?.role !== 'teacher' && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isAnswered
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                }`}>
                                  {isAnswered ? '✅ พิมพ์แล้ว' : '⚠️ ยังไม่ได้พิมพ์'}
                                </span>
                              )}
                              <span className="text-xs text-slate-400">
                                ({task.maxScore} คะแนน)
                              </span>
                            </div>
                          </div>

                          <p className="text-sm font-semibold text-white leading-relaxed">
                            {task.question}
                          </p>

                          {task.hint && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 bg-slate-900/60 p-2 rounded-lg">
                              <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>คำแนะนำ: {task.hint}</span>
                            </div>
                          )}

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] text-slate-400 block">
                                พิมพ์คำตอบของนักเรียนที่นี่ (จำเป็นต้องกรอก):
                              </label>
                              <span className="text-[10px] font-mono text-slate-500">
                                {ans.trim().length} ตัวอักษร
                              </span>
                            </div>
                            <textarea
                              rows={3}
                              disabled={isTeacherOrAdmin}
                              value={ans}
                              onChange={(e) => handleAnswerChange(task.id, e.target.value)}
                              placeholder={isTeacherOrAdmin ? 'ตัวอย่างช่องพิมพ์คำตอบของนักเรียน...' : 'พิมพ์คำตอบของคุณตามความเข้าใจ (ต้องพิมพ์คำตอบก่อนส่ง)...'}
                              className={`w-full px-3 py-2 bg-slate-900 border rounded-xl text-xs text-slate-100 focus:outline-none leading-relaxed font-sans disabled:opacity-70 transition-all ${
                                !isAnswered && worksheetValidationErr
                                  ? 'border-rose-500/80 focus:border-rose-400'
                                  : 'border-slate-700 focus:border-indigo-500'
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {currentUser?.role !== 'teacher' && (
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
                      >
                        <Send className="w-4 h-4" />
                        <span>{existingSubmission ? 'ส่งปรับปรุงคำตอบ' : 'ส่งใบงานให้คุณครูตรวจ'}</span>
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          )}
        </div>
          </>
        )}
      </div>

      {/* Gamification Celebration Reward Modal */}
      {showRewardModal && rewardModalData && (
        <GamificationRewardModal
          isOpen={showRewardModal}
          onClose={() => setShowRewardModal(false)}
          onOpenLeaderboard={() => setShowLeaderboardModal(true)}
          rewardType={rewardModalData.rewardType}
          title={rewardModalData.title}
          subtitle={rewardModalData.subtitle}
          earnedCoins={rewardModalData.earnedCoins}
          earnedXp={rewardModalData.earnedXp}
          newTotalCoins={rewardModalData.newTotalCoins}
          newTotalXp={rewardModalData.newTotalXp}
          newLevel={rewardModalData.newLevel}
          isLevelUp={rewardModalData.isLevelUp}
          badgeName={rewardModalData.badgeName}
          badgeIcon={rewardModalData.badgeIcon}
          classroom={rewardModalData.classroom}
          rankInClass={rewardModalData.rankInClass}
          totalInClass={rewardModalData.totalInClass}
        />
      )}

      {/* Embedded Leaderboard Modal for viewing rankings immediately */}
      {showLeaderboardModal && (
        <LeaderboardModal
          isOpen={showLeaderboardModal}
          onClose={() => setShowLeaderboardModal(false)}
          currentUser={currentUser}
          currentStudent={currentUser ? StorageService.getStudentProfile(currentUser.id) || null : null}
        />
      )}
    </div>
  );
};
