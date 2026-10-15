/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lesson, Quiz, QuizQuestion, Game, YouTubeVideo } from '../../types';
import { StorageService } from '../../services/storage';
import { syncQuizToFirestore } from '../../services/firebase';
import { feedback } from '../../utils/feedback';
import { TeacherGameEditor } from './TeacherGameEditor';
import {
  extractYouTubeId,
  toFullYouTubeUrl,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  autoDetectVideoDuration,
} from '../../utils/youtube';
import {
  BookOpen,
  Video,
  FileCheck,
  Gamepad2,
  Plus,
  Save,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  MoveUp,
  MoveDown,
  Eye,
  EyeOff,
  Play,
  ListOrdered,
  RotateCcw,
  Star,
  ArrowUpDown,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  GripVertical
} from 'lucide-react';

interface TeacherContentManagerProps {
  lessons: Lesson[];
  onLessonsUpdated: () => void;
}

export const TeacherContentManager: React.FC<TeacherContentManagerProps> = ({
  lessons,
  onLessonsUpdated,
}) => {
  const [subTab, setSubTab] = useState<'lessons' | 'videos' | 'quizzes' | 'games'>('lessons');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Lesson Edit State
  const currentLesson =
    lessons.find((l) => l.chapterNumber === selectedChapter) || lessons[0];

  const [lessonForm, setLessonForm] = useState<Lesson>(currentLesson);

  // Videos State
  const [allVideosList, setAllVideosList] = useState<YouTubeVideo[]>(() => StorageService.getVideos());
  const chapterVideos = allVideosList.filter((v) => v.chapterNumber === selectedChapter);
  const activeChapterVideo = chapterVideos[0] || allVideosList[0];
  const [videoForm, setVideoForm] = useState<YouTubeVideo>(activeChapterVideo);

  // When chapter switches, refresh lessonForm & videoForm & quizForm
  const handleSelectChapter = (chNum: number) => {
    setSelectedChapter(chNum);
    const target = lessons.find((l) => l.chapterNumber === chNum) || lessons[0];
    setLessonForm(target);

    // Sync quizForm
    const qData = StorageService.getChapterQuiz(chNum, quizType);
    setQuizForm(qData);

    if (chNum === 7 && (subTab === 'games' || subTab === 'videos')) {
      setSubTab('lessons');
    }

    // Sync active video
    const chVids = allVideosList.filter((v) => v.chapterNumber === chNum);
    if (chVids.length > 0) {
      const feat = chVids.find((v) => v.isFeatured) || chVids[0];
      setVideoForm({
        ...feat,
        youtubeId: toFullYouTubeUrl(feat.youtubeId),
      });
    } else {
      // Create a default for this chapter if missing
      const defaultVid: YouTubeVideo = {
        id: `vid-${chNum}-1`,
        chapterNumber: chNum,
        title: `บทที่ ${chNum}: ${target.title}`,
        description: target.description,
        youtubeId: toFullYouTubeUrl(target.youtubeVideoId || 'bI9oX3R9M5w'),
        duration: target.videoDuration || '12:00 นาที',
        thumbnailUrl: getYouTubeThumbnailUrl(target.youtubeVideoId),
        ipstUrl: 'https://proj14.ipst.ac.th/m1/m1-cs/',
        isFeatured: true,
      };
      setVideoForm(defaultVid);
    }

    setSaveSuccessMsg(null);
  };

  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = extractYouTubeId(lessonForm.youtubeVideoId);
    const updatedLesson: Lesson = {
      ...lessonForm,
      youtubeVideoId: cleanId,
      videoUrl: toFullYouTubeUrl(cleanId),
    };
    StorageService.updateLesson(updatedLesson);
    feedback.save(`บันทึกบทเรียนที่ ${lessonForm.chapterNumber} สำเร็จ`, updatedLesson.title);
    setSaveSuccessMsg(`บันทึกการแก้ไขบทเรียนที่ ${lessonForm.chapterNumber} สำเร็จเรียบร้อย!`);
    onLessonsUpdated();
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Section Handlers (Summary Sections)
  const handleAddSummarySection = () => {
    const nextIdx = (lessonForm.summarySections?.length || 0) + 1;
    const newSec = {
      title: `${lessonForm.chapterNumber}.${nextIdx} หัวข้อย่อยเนื้อหาใหม่`,
      page: lessonForm.textbookPages || 'หน้า 2–20',
      content: 'คำอธิบายเนื้อหาและแนวคิดสำคัญของหัวข้อนี้อย่างละเอียด...',
      keyPoints: ['ประเด็นสำคัญที่ 1', 'ประเด็นสำคัญที่ 2'],
    };
    setLessonForm((prev) => ({
      ...prev,
      summarySections: [...(prev.summarySections || []), newSec],
    }));
    feedback.add('เพิ่มหัวข้อย่อยเนื้อหาใหม่');
  };

  const handleUpdateSummarySection = (
    sIdx: number,
    field: 'title' | 'page' | 'content',
    val: string
  ) => {
    setLessonForm((prev) => {
      const list = [...(prev.summarySections || [])];
      list[sIdx] = { ...list[sIdx], [field]: val };
      return { ...prev, summarySections: list };
    });
  };

  const handleDeleteSummarySection = (sIdx: number) => {
    setLessonForm((prev) => ({
      ...prev,
      summarySections: prev.summarySections?.filter((_, i) => i !== sIdx),
    }));
    feedback.delete('ลบหัวข้อย่อยเนื้อหาเรียบร้อย');
  };

  const handleAddKeyPoint = (sIdx: number) => {
    setLessonForm((prev) => {
      const list = [...(prev.summarySections || [])];
      const curSec = list[sIdx];
      const points = [...(curSec.keyPoints || []), 'ประเด็นสำคัญใหม่'];
      list[sIdx] = { ...curSec, keyPoints: points };
      return { ...prev, summarySections: list };
    });
    feedback.add('เพิ่มประเด็นสำคัญใหม่');
  };

  const handleUpdateKeyPoint = (sIdx: number, kpIdx: number, val: string) => {
    setLessonForm((prev) => {
      const list = [...(prev.summarySections || [])];
      const curSec = list[sIdx];
      const points = [...(curSec.keyPoints || [])];
      points[kpIdx] = val;
      list[sIdx] = { ...curSec, keyPoints: points };
      return { ...prev, summarySections: list };
    });
  };

  const handleDeleteKeyPoint = (sIdx: number, kpIdx: number) => {
    setLessonForm((prev) => {
      const list = [...(prev.summarySections || [])];
      const curSec = list[sIdx];
      const points = (curSec.keyPoints || []).filter((_, i) => i !== kpIdx);
      list[sIdx] = { ...curSec, keyPoints: points };
      return { ...prev, summarySections: list };
    });
    feedback.delete('ลบประเด็นสำคัญแล้ว');
  };

  // Learning Objectives Handlers
  const handleAddObjective = () => {
    setLessonForm((prev) => ({
      ...prev,
      objectives: [...(prev.objectives || []), 'เข้าใจและสามารถอธิบายเนื้อหาบทนี้ได้'],
    }));
    feedback.add('เพิ่มวัตถุประสงค์การเรียนรู้ใหม่');
  };

  const handleUpdateObjective = (oIdx: number, val: string) => {
    setLessonForm((prev) => {
      const objs = [...(prev.objectives || [])];
      objs[oIdx] = val;
      return { ...prev, objectives: objs };
    });
  };

  const handleDeleteObjective = (oIdx: number) => {
    setLessonForm((prev) => ({
      ...prev,
      objectives: prev.objectives?.filter((_, i) => i !== oIdx),
    }));
    feedback.delete('ลบวัตถุประสงค์การเรียนรู้แล้ว');
  };

  // Create New Lesson Modal State
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [newLessonForm, setNewLessonForm] = useState({
    title: '',
    description: '',
    textbookPages: 'หน้า 2–25',
    coreConcept: '',
    contentSummary: '',
    topics: '',
    videoUrl: '',
    videoDuration: '12:00 นาที',
  });

  const handleCreateLessonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextChapter = Math.max(...lessons.map((l) => l.chapterNumber), 0) + 1;
    const finalVidId = extractYouTubeId(newLessonForm.videoUrl) || 'bI9oX3R9M5w';
    const newLesson: Lesson = {
      id: `lesson-${nextChapter}`,
      chapterNumber: nextChapter,
      title: newLessonForm.title,
      slug: `chapter-${nextChapter}`,
      description: newLessonForm.description,
      textbookPages: newLessonForm.textbookPages,
      coverImageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
      videoTitle: `บทเรียนที่ ${nextChapter}: ${newLessonForm.title}`,
      videoUrl: newLessonForm.videoUrl || `https://www.youtube.com/watch?v=${finalVidId}`,
      youtubeVideoId: finalVidId,
      videoDuration: newLessonForm.videoDuration,
      coreConcept: newLessonForm.coreConcept || 'สาระสำคัญประจำบทเรียน',
      contentSummary: newLessonForm.contentSummary || newLessonForm.description,
      topics: newLessonForm.topics.split(',').map((t) => t.trim()).filter(Boolean),
      xpReward: 100,
      objectives: ['เข้าใจหลักการและแนวคิดสำคัญของบทเรียนนี้'],
      summarySections: [
        {
          title: `${nextChapter}.1 บทนำสู่ ${newLessonForm.title}`,
          page: newLessonForm.textbookPages,
          content: newLessonForm.contentSummary,
          keyPoints: ['ความสำคัญและการนำไปใช้จริง'],
        },
      ],
      gameId: 'game-1',
      iconName: 'BookOpen',
      colorTheme: 'from-blue-500 to-indigo-600',
    };

    StorageService.addLesson(newLesson);

    // Also seed default video
    const newVid: YouTubeVideo = {
      id: `vid-${nextChapter}-1`,
      chapterNumber: nextChapter,
      title: `บทที่ ${nextChapter}: ${newLesson.title}`,
      description: newLesson.description,
      youtubeId: finalVidId,
      duration: newLesson.videoDuration || '12:00 นาที',
      thumbnailUrl: `https://img.youtube.com/vi/${finalVidId}/hqdefault.jpg`,
      ipstUrl: 'https://proj14.ipst.ac.th/m1/m1-cs/',
      isFeatured: true,
    };
    StorageService.addVideo(newVid);

    // Also seed default pre-test
    const preQuiz: Quiz = {
      id: `quiz-${nextChapter}-pre`,
      chapterNumber: nextChapter,
      title: `แบบทดสอบก่อนเรียน บทที่ ${nextChapter}: ${newLesson.title}`,
      type: 'pre_test',
      totalQuestions: 1,
      isEnabled: true,
      questions: [
        {
          id: `q-${nextChapter}-pre-1`,
          question: `คำถามก่อนเรียน ข้อที่ 1 ของบทที่ ${nextChapter} (${newLesson.title})`,
          options: ['คำตอบ ก', 'คำตอบ ข', 'คำตอบ ค', 'คำตอบ ง'],
          correctIndex: 0,
          correctAnswer: 0,
          explanation: 'คำอธิบายเฉลยและเหตุผลของข้อนี้',
        },
      ],
    };
    StorageService.updateQuiz(preQuiz);

    // Also seed default post-test
    const postQuiz: Quiz = {
      id: `quiz-${nextChapter}-post`,
      chapterNumber: nextChapter,
      title: `แบบทดสอบหลังเรียน บทที่ ${nextChapter}: ${newLesson.title}`,
      type: 'post_test',
      totalQuestions: 1,
      isEnabled: true,
      questions: [
        {
          id: `q-${nextChapter}-post-1`,
          question: `คำถามหลังเรียน ข้อที่ 1 ของบทที่ ${nextChapter} (${newLesson.title})`,
          options: ['คำตอบ ก', 'คำตอบ ข', 'คำตอบ ค', 'คำตอบ ง'],
          correctIndex: 0,
          correctAnswer: 0,
          explanation: 'คำอธิบายเฉลยและเหตุผลของข้อนี้',
        },
      ],
    };
    StorageService.updateQuiz(postQuiz);

    // Also seed worksheet
    const newWs = {
      id: `ws-${nextChapter}`,
      chapterNumber: nextChapter,
      title: `ใบงานกิจกรรม บทที่ ${nextChapter}: ${newLesson.title}`,
      description: `ใบงานเก็บคะแนนการประยุกต์ใช้ความรู้บทที่ ${nextChapter}`,
      instructions: 'ให้นักเรียนอ่านคำถามและตอบคำถามลงในช่องว่างให้ครบถ้วน',
      maxScore: 10,
      tasks: [
        {
          id: `task-${nextChapter}-1`,
          question: `อธิบายสาระสำคัญและประโยชน์ของการเรียนรู้บทที่ ${nextChapter} ในชีวิตประจำวัน`,
          type: 'essay' as const,
          maxScore: 10,
          hint: 'ยกตัวอย่างการนำไปใช้จริง',
          sampleAnswer: 'สามารถนำไปประยุกต์ใช้ในการแก้ปัญหาอย่างเป็นระบบ',
        },
      ],
    };
    StorageService.updateWorksheet(newWs);

    setShowAddLessonModal(false);
    onLessonsUpdated();
    setSelectedChapter(nextChapter);
    setLessonForm(newLesson);
    feedback.add(`สร้างบทเรียนใหม่สำเร็จ`, `บทที่ ${nextChapter}: ${newLesson.title}`);
    setSaveSuccessMsg(`เพิ่มบทเรียนใหม่ "บทที่ ${nextChapter}: ${newLesson.title}" สำเร็จเรียบร้อย!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleSaveVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const finalId = extractYouTubeId(videoForm.youtubeId);
    const updatedVideo: YouTubeVideo = {
      ...videoForm,
      youtubeId: finalId,
      thumbnailUrl: getYouTubeThumbnailUrl(finalId),
    };
    StorageService.updateVideo(updatedVideo);
    feedback.save('บันทึกข้อมูลวิดีโอสำเร็จ', updatedVideo.title);

    if (updatedVideo.isFeatured) {
      StorageService.setFeaturedVideo(updatedVideo.id);
    } else {
      // Also update corresponding lesson if this is the only video or featured
      const matchingLesson = lessons.find((l) => l.chapterNumber === updatedVideo.chapterNumber);
      if (matchingLesson && updatedVideo.isFeatured) {
        const updatedLesson: Lesson = {
          ...matchingLesson,
          youtubeVideoId: finalId,
          videoTitle: updatedVideo.title,
          videoDuration: updatedVideo.duration,
          videoUrl: toFullYouTubeUrl(finalId),
        };
        StorageService.updateLesson(updatedLesson);
      }
    }

    const refreshed = StorageService.getVideos();
    setAllVideosList(refreshed);
    const cur = refreshed.find((v) => v.id === updatedVideo.id) || updatedVideo;
    setVideoForm({
      ...cur,
      youtubeId: toFullYouTubeUrl(cur.youtubeId),
    });
    setSaveSuccessMsg(`บันทึกวิดีโอ "${updatedVideo.title}" สำเร็จเรียบร้อย!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
    onLessonsUpdated();
  };

  const handleAddSupplementaryVideo = () => {
    const newVid: YouTubeVideo = {
      id: `vid-${selectedChapter}-${Date.now()}`,
      chapterNumber: selectedChapter,
      title: `คลิปเสริมการเรียนรู้ บทที่ ${selectedChapter}`,
      description: 'คำอธิบายวิดีโอเสริมการเรียนรู้ประกอบบทเรียน',
      youtubeId: 'https://www.youtube.com/watch?v=bI9oX3R9M5w',
      duration: '10:00 นาที',
      thumbnailUrl: getYouTubeThumbnailUrl('bI9oX3R9M5w'),
      ipstUrl: 'https://proj14.ipst.ac.th/m1/m1-cs/',
      isFeatured: false,
    };
    StorageService.addVideo({
      ...newVid,
      youtubeId: 'bI9oX3R9M5w',
    });
    const refreshed = StorageService.getVideos();
    setAllVideosList(refreshed);
    setVideoForm(newVid);
    setSaveSuccessMsg('เพิ่มคลิปวิดีโอใหม่สำเร็จ! วางลิงก์ YouTube ที่ต้องการแล้วกดบันทึก');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
    onLessonsUpdated();
  };

  const handleDeleteVideo = (vidId: string) => {
    if (window.confirm('คุณครูต้องการลบคลิปวิดีโอนี้หรือไม่?')) {
      StorageService.deleteVideo(vidId);
      const refreshed = StorageService.getVideos();
      setAllVideosList(refreshed);
      const chVids = refreshed.filter((v) => v.chapterNumber === selectedChapter);
      const nextVid = chVids[0] || refreshed[0];
      if (nextVid) {
        setVideoForm({
          ...nextVid,
          youtubeId: toFullYouTubeUrl(nextVid.youtubeId),
        });
      }
      setSaveSuccessMsg('ลบคลิปวิดีโอเรียบร้อยแล้ว');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      onLessonsUpdated();
    }
  };

  // Drag and Drop state for Videos in TeacherContentManager
  const [draggedVidId, setDraggedVidId] = useState<string | null>(null);
  const [dragOverVidId, setDragOverVidId] = useState<string | null>(null);

  const handleVidDragStart = (e: React.DragEvent, vidId: string) => {
    setDraggedVidId(vidId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', vidId);
  };

  const handleVidDragOver = (e: React.DragEvent, vidId: string) => {
    if (!draggedVidId || draggedVidId === vidId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverVidId !== vidId) {
      setDragOverVidId(vidId);
    }
  };

  const handleVidDragLeave = (e: React.DragEvent, vidId: string) => {
    if (dragOverVidId === vidId) {
      setDragOverVidId(null);
    }
  };

  const handleVidDrop = (e: React.DragEvent, targetVidId: string) => {
    e.preventDefault();
    setDragOverVidId(null);
    const sourceId = draggedVidId || e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetVidId) {
      setDraggedVidId(null);
      return;
    }

    const currentList = [...allVideosList].sort((a, b) => (a.order || 0) - (b.order || 0));
    const sourceIdx = currentList.findIndex((v) => v.id === sourceId);
    const targetIdx = currentList.findIndex((v) => v.id === targetVidId);

    if (sourceIdx < 0 || targetIdx < 0) {
      setDraggedVidId(null);
      return;
    }

    const [moved] = currentList.splice(sourceIdx, 1);
    currentList.splice(targetIdx, 0, moved);

    const reordered = StorageService.reorderVideos(currentList);
    setAllVideosList(reordered);
    setDraggedVidId(null);
    setSaveSuccessMsg(`ลากสลับตำแหน่ง "${moved.title}" สำเร็จ!`);
    setTimeout(() => setSaveSuccessMsg(null), 2500);
    onLessonsUpdated();
  };

  const handleVidDragEnd = () => {
    setDraggedVidId(null);
    setDragOverVidId(null);
  };

  const handleMoveVideoToSlot = (vidId: string, targetSlot: number) => {
    const currentList = [...allVideosList].sort((a, b) => (a.order || 0) - (b.order || 0));
    const currentIdx = currentList.findIndex((v) => v.id === vidId);
    if (currentIdx < 0) return;

    const targetIdx = Math.max(0, Math.min(targetSlot - 1, currentList.length - 1));
    if (currentIdx === targetIdx) return;

    const [moved] = currentList.splice(currentIdx, 1);
    currentList.splice(targetIdx, 0, moved);

    const reordered = StorageService.reorderVideos(currentList);
    setAllVideosList(reordered);
    setSaveSuccessMsg(`ย้าย "${moved.title}" ไปลำดับที่ #${targetSlot} สำเร็จ!`);
    setTimeout(() => setSaveSuccessMsg(null), 2500);
    onLessonsUpdated();
  };

  // Video Reordering handlers for Teacher
  const handleMoveVideoGlobal = (vidId: string, direction: 'up' | 'down') => {
    const updated = StorageService.moveVideo(vidId, direction);
    setAllVideosList(updated);
    setSaveSuccessMsg('ปรับเปลี่ยนลำดับคลิปวิดีโอเรียบร้อย!');
    setTimeout(() => setSaveSuccessMsg(null), 2500);
    onLessonsUpdated();
  };

  const handleMoveVideoInChapter = (vidId: string, direction: 'up' | 'down') => {
    const updated = StorageService.moveVideoChapter(selectedChapter, vidId, direction);
    setAllVideosList(updated);
    setSaveSuccessMsg(`ปรับเปลี่ยนลำดับวิดีโอบทที่ ${selectedChapter} เรียบร้อย!`);
    setTimeout(() => setSaveSuccessMsg(null), 2500);
    onLessonsUpdated();
  };

  const handleToggleFeatured = (vid: YouTubeVideo) => {
    let refreshed: YouTubeVideo[];
    if (!vid.isFeatured) {
      refreshed = StorageService.setFeaturedVideo(vid.id);
      setSaveSuccessMsg(`ตั้งคลิป "${vid.title}" เป็นวิดีโอหลักประจำบทที่ ${vid.chapterNumber} เรียบร้อย!`);
    } else {
      const updatedVid = { ...vid, isFeatured: false };
      StorageService.updateVideo(updatedVid);
      refreshed = StorageService.getVideos();
      setSaveSuccessMsg(`ยกเลิกวิดีโอหลักเรียบร้อย!`);
    }
    setAllVideosList(refreshed);
    const cur = refreshed.find((v) => v.id === vid.id);
    if (cur && videoForm.id === vid.id) {
      setVideoForm({
        ...cur,
        youtubeId: toFullYouTubeUrl(cur.youtubeId),
      });
    }
    setTimeout(() => setSaveSuccessMsg(null), 2500);
    onLessonsUpdated();
  };

  const handleResetVideosOrder = () => {
    if (window.confirm('คุณครูต้องการคืนค่าลำดับวิดีโอทั้งหมดเป็นค่าเริ่มต้นหรือไม่?')) {
      const reset = StorageService.resetVideosOrder();
      setAllVideosList(reset);
      const chVids = reset.filter((v) => v.chapterNumber === selectedChapter);
      setVideoForm(chVids[0] || reset[0]);
      setSaveSuccessMsg('คืนค่าลำดับวิดีโอเริ่มต้นเรียบร้อยแล้ว!');
      setTimeout(() => setSaveSuccessMsg(null), 2500);
      onLessonsUpdated();
    }
  };

  // Quiz Edit State
  const [quizType, setQuizType] = useState<'pre_test' | 'post_test'>('pre_test');
  const [quizForm, setQuizForm] = useState<Quiz>(() =>
    StorageService.getChapterQuiz(selectedChapter, 'pre_test')
  );

  // Sync quizForm when chapter or quizType changes
  const handleSwitchQuiz = (type: 'pre_test' | 'post_test') => {
    setQuizType(type);
    const target = StorageService.getChapterQuiz(selectedChapter, type);
    setQuizForm(target);
    setSaveSuccessMsg(null);
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.updateQuiz(quizForm);
    try {
      await syncQuizToFirestore(quizForm);
    } catch (err) {
      console.warn('Firestore quiz sync:', err);
    }
    feedback.save('บันทึกข้อสอบสำเร็จ', `${quizForm.title} (จำนวน ${quizForm.questions?.length || 0} ข้อ)`);
    setSaveSuccessMsg(`บันทึก${quizForm.title} สำเร็จเรียบร้อย! ซิงค์กับระบบและฐานข้อมูลเรียบร้อยแล้ว`);
    setQuizForm(StorageService.getChapterQuiz(selectedChapter, quizType));
    setTimeout(() => setSaveSuccessMsg(null), 3500);
    onLessonsUpdated();
  };

  const handleMoveQuestion = (qIdx: number, direction: 'up' | 'down') => {
    setQuizForm((prev) => {
      const qs = [...(prev.questions || [])];
      const targetIdx = direction === 'up' ? qIdx - 1 : qIdx + 1;
      if (targetIdx < 0 || targetIdx >= qs.length) return prev;
      const [moved] = qs.splice(qIdx, 1);
      qs.splice(targetIdx, 0, moved);
      return { ...prev, questions: qs };
    });
    feedback.edit('สลับลำดับข้อสอบแล้ว');
  };

  const handleResetQuizDefault = () => {
    if (window.confirm(`คุณครูต้องการคืนค่าแบบทดสอบ${quizType === 'pre_test' ? 'ก่อนเรียน (Pre-test)' : 'หลังเรียน (Post-test)'} บทที่ ${selectedChapter} เป็นค่าเริ่มต้นมาตรฐาน สสวท. หรือไม่?`)) {
      const reset = StorageService.resetQuizToDefault(selectedChapter, quizType);
      setQuizForm(reset);
      feedback.edit('คืนค่าแบบทดสอบมาตรฐาน สสวท. เรียบร้อย');
      setSaveSuccessMsg('คืนค่าแบบทดสอบเริ่มต้น สสวท. เรียบร้อยแล้ว!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      onLessonsUpdated();
    }
  };

  const handleAddQuestion = () => {
    const newQ: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: 'คำถามข้อใหม่ (สสวท. ม.1)',
      options: ['ตัวเลือก ก', 'ตัวเลือก ข', 'ตัวเลือก ค', 'ตัวเลือก ง'],
      correctIndex: 0,
      correctAnswer: 0,
      explanation: 'คำอธิบายเฉลยและอ้างอิงเนื้อหาในหนังสือ',
    };
    setQuizForm((prev) => ({
      ...prev,
      questions: [...(prev.questions || []), newQ],
    }));
    feedback.add('เพิ่มข้อสอบข้อใหม่สำเร็จ');
  };

  const handleUpdateQuestion = (qIdx: number, updated: Partial<QuizQuestion>) => {
    setQuizForm((prev) => {
      const qs = [...(prev.questions || [])];
      qs[qIdx] = { ...qs[qIdx], ...updated };
      return { ...prev, questions: qs };
    });
  };

  const handleDeleteQuestion = (qIdx: number) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions?.filter((_, i) => i !== qIdx),
    }));
    feedback.delete('ลบข้อสอบเรียบร้อยแล้ว');
  };

  // Mini-game settings
  const games = StorageService.getGames();
  const currentGame = games.find((g: Game) => g.chapterNumber === selectedChapter) || games[0];
  const [gameForm, setGameForm] = useState<Game>(currentGame);

  const handleSaveGame = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.updateGame(gameForm);
    feedback.save('บันทึกการตั้งค่ามินิเกมเรียบร้อย', `บทที่ ${gameForm.chapterNumber}`);
    setSaveSuccessMsg(`บันทึกการตั้งค่ามินิเกมบทที่ ${gameForm.chapterNumber} เรียบร้อย!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Chapter Selector Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
          {lessons.map((l) => (
            <button
              key={l.id}
              onClick={() => handleSelectChapter(l.chapterNumber)}
              className={`px-3 py-1.5 rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
                selectedChapter === l.chapterNumber
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : l.chapterNumber === 7
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>บทที่ {l.chapterNumber}</span>
              {l.chapterNumber === 7 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/30 text-amber-200 font-bold">
                  ★ สอบรวม 6 บท (ก่อน-หลัง 30 ข้อ)
                </span>
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowAddLessonModal(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shrink-0 flex items-center gap-1 shadow"
            title="เพิ่มบทเรียน / หน่วยการเรียนรู้ใหม่"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เพิ่มบทเรียนใหม่</span>
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold shrink-0">
          <button
            onClick={() => setSubTab('lessons')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              subTab === 'lessons'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{selectedChapter === 7 ? 'ทบทวนเนื้อหา 6 บท' : 'เนื้อหาบทเรียน'}</span>
          </button>
          {selectedChapter !== 7 && (
            <button
              onClick={() => setSubTab('videos')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                subTab === 'videos'
                  ? 'bg-rose-600 text-white shadow font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>วิดีโอการสอน (Project 14)</span>
            </button>
          )}
          <button
            onClick={() => setSubTab('quizzes')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              subTab === 'quizzes'
                ? 'bg-amber-500 text-slate-950 shadow font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>{selectedChapter === 7 ? 'ข้อสอบรวม 6 บท (60 ข้อ)' : 'ข้อสอบ (ก่อน/หลังเรียน)'}</span>
          </button>
          {selectedChapter !== 7 && (
            <button
              onClick={() => setSubTab('games')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                subTab === 'games'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>มินิเกมประจำบท</span>
            </button>
          )}
        </div>
      </div>

      {/* Save Success Alert Banner */}
      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-emerald-300 text-xs font-semibold shadow-lg animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* SUBTAB 1: LESSON & MEDIA EDITOR */}
      {subTab === 'lessons' && (
        <form onSubmit={handleSaveLesson} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-lg text-white font-['Chakra_Petch'] flex items-center gap-2">
                <span>แก้ไขเนื้อหาบทเรียนที่ {lessonForm.chapterNumber}: {lessonForm.title}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                ปรับปรุงคำอธิบาย ลิงก์คลิปวิดีโอ สสวท. Project 14 และหัวข้อการเรียนรู้
              </p>
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกบทเรียน</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                ชื่อบทเรียน
              </label>
              <input
                type="text"
                value={lessonForm.title}
                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                หน้าในหนังสือเรียน สสวท. (Textbook Pages)
              </label>
              <input
                type="text"
                value={lessonForm.textbookPages || 'หน้า 2–25'}
                onChange={(e) => setLessonForm({ ...lessonForm, textbookPages: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* YouTube Video Settings */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Video className="w-4 h-4" />
                <span>การเชื่อมต่อวิดีโอ สสวท. (YouTube Project 14):</span>
              </span>
              {lessonForm.youtubeVideoId && (
                <a
                  href={toFullYouTubeUrl(lessonForm.youtubeVideoId)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-sky-400 hover:underline flex items-center gap-1"
                >
                  <span>เปิดดูใน YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-400 block mb-1">
                  ลิงก์คลิปวิดีโอ YouTube (วางลิงก์เต็มได้เลย)
                </label>
                <input
                  type="text"
                  value={lessonForm.youtubeVideoId || ''}
                  onChange={(e) => setLessonForm({ ...lessonForm, youtubeVideoId: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=... หรือ https://youtu.be/..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  วางลิงก์ YouTube เต็มจากแถบ URL หรือปุ่มแชร์ได้ทันที
                </span>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  ความยาวคลิป (เช่น 12:45 นาที)
                </label>
                <input
                  type="text"
                  value={lessonForm.videoDuration || '12:00 นาที'}
                  onChange={(e) => setLessonForm({ ...lessonForm, videoDuration: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Video Preview */}
            {lessonForm.youtubeVideoId && (
              <div className="flex items-center gap-3 p-2 bg-slate-900 rounded-xl border border-slate-800">
                <img
                  src={getYouTubeThumbnailUrl(lessonForm.youtubeVideoId)}
                  alt="Thumbnail"
                  className="w-28 aspect-video rounded-lg object-cover border border-slate-700 shrink-0"
                />
                <div className="text-xs">
                  <div className="font-semibold text-white">พรีวิวภาพขนาดย่อของวิดีโอ</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    รหัสวิดีโอ: <span className="font-mono text-amber-300">{extractYouTubeId(lessonForm.youtubeVideoId)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Description & Core Concept */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                คำอธิบายบทเรียนสั้นๆ (Description)
              </label>
              <textarea
                rows={3}
                value={lessonForm.description}
                onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                สาระสำคัญประจำบท (Core Concept)
              </label>
              <textarea
                rows={3}
                value={lessonForm.coreConcept || ''}
                onChange={(e) => setLessonForm({ ...lessonForm, coreConcept: e.target.value })}
                placeholder="เช่น การแก้ปัญหาโดยใช้แนวคิดเชิงคำนวณ..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500 leading-relaxed"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              เนื้อหาสรุปอย่างละเอียด (Content Summary สำหรับนักเรียนอ่าน)
            </label>
            <textarea
              rows={4}
              value={lessonForm.contentSummary || ''}
              onChange={(e) => setLessonForm({ ...lessonForm, contentSummary: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
            />
          </div>

          {/* Learning Objectives Editor */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>จุดประสงค์การเรียนรู้ ({lessonForm.objectives?.length || 0} ข้อ):</span>
              </span>
              <button
                type="button"
                onClick={handleAddObjective}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>เพิ่มจุดประสงค์</span>
              </button>
            </div>

            <div className="space-y-2">
              {(lessonForm.objectives || []).map((obj, oIdx) => (
                <div key={oIdx} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                    {oIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={obj}
                    onChange={(e) => handleUpdateObjective(oIdx, e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteObjective(oIdx)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    title="ลบจุดประสงค์นี้"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {(!lessonForm.objectives || lessonForm.objectives.length === 0) && (
                <p className="text-xs text-slate-500 italic py-1">ยังไม่มีจุดประสงค์การเรียนรู้ กดปุ่มเพิ่มด้านบนเพื่อเพิ่ม</p>
              )}
            </div>
          </div>

          {/* Summary Sections Editor */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>หัวข้อย่อยเนื้อหาและประเด็นสำคัญ ({lessonForm.summarySections?.length || 0} หัวข้อ):</span>
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  คุณครูสามารถเพิ่มหัวข้อเนื้อหาใหม่ (เช่น 1.1, 1.2, 1.3) และระบุประเด็นสำคัญที่ต้องรู้ได้
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddSummarySection}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มหัวข้อย่อยเนื้อหา</span>
              </button>
            </div>

            <div className="space-y-4">
              {(lessonForm.summarySections || []).map((sec, sIdx) => (
                <div key={sIdx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-amber-400">หัวข้อที่ {sIdx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSummarySection(sIdx)}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบหัวข้อนี้</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-slate-400 block mb-1">ชื่อหัวข้อ (เช่น 1.1 แนวคิดเชิงนามธรรม)</label>
                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) => handleUpdateSummarySection(sIdx, 'title', e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">หน้าในหนังสือ สสวท.</label>
                      <input
                        type="text"
                        value={sec.page}
                        onChange={(e) => handleUpdateSummarySection(sIdx, 'page', e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">เนื้อหารายละเอียดของหัวข้อนี้</label>
                    <textarea
                      rows={3}
                      value={sec.content}
                      onChange={(e) => handleUpdateSummarySection(sIdx, 'content', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed"
                    />
                  </div>

                  {/* Key Points */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] text-slate-400 font-semibold">ประเด็นสำคัญประจำหัวข้อ (Key Points):</label>
                      <button
                        type="button"
                        onClick={() => handleAddKeyPoint(sIdx)}
                        className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                      >
                        <Plus className="w-3 h-3" />
                        <span>เพิ่มประเด็นสำคัญ</span>
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {(sec.keyPoints || []).map((kp, kpIdx) => (
                        <div key={kpIdx} className="flex items-center gap-2">
                          <span className="text-amber-400 text-xs">•</span>
                          <input
                            type="text"
                            value={kp}
                            onChange={(e) => handleUpdateKeyPoint(sIdx, kpIdx, e.target.value)}
                            className="flex-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteKeyPoint(sIdx, kpIdx)}
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

          {/* Topics List */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              หัวข้อย่อยและคำสำคัญ (คั่นด้วยเครื่องหมายจุลภาค , )
            </label>
            <input
              type="text"
              value={(lessonForm.topics || []).join(', ')}
              onChange={(e) =>
                setLessonForm({
                  ...lessonForm,
                  topics: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                })
              }
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการแก้ไขบทเรียน</span>
            </button>
          </div>
        </form>
      )}

      {/* SUBTAB 2: VIDEO MANAGER (PROJECT 14 & CUSTOM VIDEOS) */}
      {subTab === 'videos' && (
        <div className="space-y-6">
          {/* Video Selection within this Chapter */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-2 overflow-x-auto p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs w-full sm:w-auto">
              {chapterVideos.map((vid, idx) => (
                <button
                  key={vid.id}
                  type="button"
                  onClick={() =>
                    setVideoForm({
                      ...vid,
                      youtubeId: toFullYouTubeUrl(vid.youtubeId),
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                    videoForm.id === vid.id
                      ? 'bg-rose-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Play className="w-3 h-3" />
                  <span>
                    {vid.isFeatured ? `⭐ วิดีโอหลัก (คลิปที่ ${idx + 1})` : `คลิปเสริมที่ ${idx + 1}`}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleAddSupplementaryVideo}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มคลิปสอนเสริมบทที่ {selectedChapter}</span>
              </button>

              <button
                type="button"
                onClick={() => handleDeleteVideo(videoForm.id)}
                className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800/60 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                title="ลบคลิปวิดีโอนี้ออกจากระบบ"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบคลิปนี้</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveVideo} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-lg text-white font-['Chakra_Petch'] flex items-center gap-2">
                  <Video className="w-5 h-5 text-rose-400" />
                  <span>แก้ไขวิดีโอการสอน: {videoForm.title}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  คุณครูสามารถวางลิงก์ YouTube ตัวเต็ม, แก้ไขชื่อคลิป, ปรับความยาว, และดูตัวอย่างวิดีโอสดได้ทันที
                </p>
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกวิดีโอ</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  ชื่อคลิปวิดีโอการสอน
                </label>
                <input
                  type="text"
                  value={videoForm.title}
                  onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  ความยาวคลิป (เช่น 11:45 น.)
                </label>
                <input
                  type="text"
                  value={videoForm.duration}
                  onChange={(e) => setVideoForm({ ...videoForm, duration: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  ลิงก์คลิปวิดีโอ YouTube (วางลิงก์เต็มได้โดยตรง)
                </label>
                <input
                  type="text"
                  value={videoForm.youtubeId}
                  onChange={(e) => {
                    const val = e.target.value;
                    const autoDur = autoDetectVideoDuration(val, videoForm.duration);
                    setVideoForm({
                      ...videoForm,
                      youtubeId: val,
                      duration: autoDur || videoForm.duration,
                    });
                  }}
                  placeholder="https://www.youtube.com/watch?v=... หรือ https://youtu.be/..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-rose-300 font-mono focus:outline-none focus:border-rose-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  รองรับการวาง URL เต็มจากแถบที่อยู่เบราว์เซอร์ ลิงก์ย่อ หรือปุ่มแชร์
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  ลิงก์เว็บไซต์ สสวท. Project 14 (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={videoForm.ipstUrl || ''}
                  onChange={(e) => setVideoForm({ ...videoForm, ipstUrl: e.target.value })}
                  placeholder="https://proj14.ipst.ac.th/m1/m1-cs/"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Featured Video Setting */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
              <div className="space-y-1">
                <label htmlFor="isFeaturedSwitch" className="text-sm font-bold text-white flex items-center gap-2 cursor-pointer select-none">
                  <Star className={`w-4 h-4 ${videoForm.isFeatured ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
                  <span>ตั้งเป็นวิดีโอหลักประจำบทที่ {selectedChapter} (Featured Main Video)</span>
                </label>
                <p className="text-xs text-slate-400">
                  {videoForm.isFeatured
                    ? `★ กำลังเป็นวิดีโอหลักประจำบทที่ ${selectedChapter} ซึ่งจะแสดงบนหน้าบทเรียนและแผนที่การเรียนรู้`
                    : `คลิปนี้เป็นคลิปเสริม หากต้องการให้เป็นคลิปหลักประจำบทที่ ${selectedChapter} ให้เปิดใช้งานตัวเลือกนี้`}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  id="isFeaturedSwitch"
                  type="checkbox"
                  checked={videoForm.isFeatured ?? false}
                  onChange={(e) => setVideoForm({ ...videoForm, isFeatured: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                คำอธิบายคลิปวิดีโอและเนื้อหาที่ครอบคลุม
              </label>
              <textarea
                rows={3}
                value={videoForm.description}
                onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-rose-500 leading-relaxed"
              />
            </div>

            {/* Live Player Preview */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <Play className="w-4 h-4" />
                  <span>ทดสอบเครื่องเล่นวิดีโอสด (Live Video Preview):</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ID: {extractYouTubeId(videoForm.youtubeId)}
                </span>
              </div>

              <div className="aspect-video max-w-2xl mx-auto rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl">
                <iframe
                  src={getYouTubeEmbedUrl(videoForm.youtubeId)}
                  title="Video Preview"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleDeleteVideo(videoForm.id)}
                className="px-4 py-2.5 bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>ลบคลิปนี้</span>
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกวิดีโอนี้</span>
              </button>
            </div>
          </form>

          {/* Section: Video Order Management (การจัดเรียงลำดับวิดีโอ) */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <ListOrdered className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white font-['Chakra_Petch'] flex items-center gap-2">
                    <span>จัดเรียงลำดับการแสดงผลเมนูวิดีโอ (Video Order Management)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    คุณครูสามารถกดปุ่มเลื่อนขึ้น/ลง เพื่อจัดเรียงลำดับคลิปวิดีโอในระบบ หรือตั้งเป็นวิดีโอหลัก
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetVideosOrder}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>คืนค่าลำดับเริ่มต้น</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {allVideosList
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((v, idx, arr) => {
                  const isDragging = draggedVidId === v.id;
                  const isDragOver = dragOverVidId === v.id;

                  return (
                    <div
                      key={v.id}
                      draggable={true}
                      onDragStart={(e) => handleVidDragStart(e, v.id)}
                      onDragOver={(e) => handleVidDragOver(e, v.id)}
                      onDragLeave={(e) => handleVidDragLeave(e, v.id)}
                      onDrop={(e) => handleVidDrop(e, v.id)}
                      onDragEnd={handleVidDragEnd}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-grab active:cursor-grabbing ${
                        isDragging
                          ? 'opacity-40 scale-95 border-amber-400 border-dashed bg-slate-900 ring-2 ring-amber-400'
                          : isDragOver
                          ? 'border-amber-400 bg-amber-500/20 scale-[1.02] shadow-2xl ring-2 ring-amber-400'
                          : v.chapterNumber === selectedChapter
                          ? 'bg-slate-950 border-amber-500/40 hover:border-amber-500'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Drag Handle & Order Badge */}
                        <div className="flex items-center gap-1 shrink-0">
                          <div className="p-1 rounded text-slate-500 hover:text-amber-400">
                            <GripVertical className="w-5 h-5 text-amber-400" />
                          </div>
                          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow">
                            #{idx + 1}
                          </div>
                        </div>

                        {/* Thumbnail */}
                        <div className="w-16 aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                          <img
                            src={v.thumbnailUrl || `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`}
                            alt={v.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              บทที่ {v.chapterNumber}
                            </span>
                            {v.isFeatured && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white flex items-center gap-1">
                                ★ วิดีโอหลัก
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono">
                              {v.duration}
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
                            {v.title}
                          </h4>
                        </div>
                      </div>

                      {/* Order Controls & Slot Selection */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 shrink-0"
                      >
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold mr-1">
                          <span className="hidden sm:inline">ย้ายไป:</span>
                          <select
                            value={idx + 1}
                            onChange={(e) => handleMoveVideoToSlot(v.id, Number(e.target.value))}
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
                          onClick={() => handleMoveVideoGlobal(v.id, 'up')}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 disabled:opacity-20 transition-colors"
                          title="เลื่อนขึ้นด้านบน"
                        >
                          <MoveUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === arr.length - 1}
                          onClick={() => handleMoveVideoGlobal(v.id, 'down')}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 disabled:opacity-20 transition-colors"
                          title="เลื่อนลงด้านล่าง"
                        >
                          <MoveDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(v)}
                          className={`p-1.5 rounded-lg transition-colors ml-1 ${
                            v.isFeatured
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-800 text-slate-400 hover:text-amber-300'
                          }`}
                          title="ตั้งเป็นคลิปหลักประจำบท"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedChapter(v.chapterNumber);
                            setVideoForm(v);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                        >
                          เลือกแก้ไข
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVideo(v.id)}
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
          </div>
        </div>
      )}

      {/* SUBTAB 3: QUIZ EDITOR (PRE-TEST & POST-TEST) */}
      {subTab === 'quizzes' && (
        <form onSubmit={handleSaveQuiz} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="font-bold text-lg text-white font-['Chakra_Petch']">
                  {selectedChapter === 7
                    ? 'จัดการคลังข้อสอบวัดผลสัมฤทธิ์รวม 6 บท (Comprehensive Final Exam)'
                    : `จัดการแบบทดสอบ บทที่ ${selectedChapter}`}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  {quizType === 'pre_test' ? 'ก่อนเรียน (Pre-test 30 ข้อ)' : 'หลังเรียน (Post-test 30 ข้อ)'}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 flex items-center gap-1 font-bold">
                  <span>⭐ ตอบถูกได้ 10 คะแนน</span>
                  <span>• ทั้งหมด {quizForm.questions?.length || 0} ข้อ</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {selectedChapter === 7
                  ? 'คลังข้อสอบวัดผลสัมฤทธิ์รวม 6 บทเรียน (ก่อนเรียน 30 ข้อ และหลังเรียน 30 ข้อ)'
                  : 'แบบทดสอบประจำบทเรียน'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => handleSwitchQuiz('pre_test')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    quizType === 'pre_test'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ก่อนเรียน
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchQuiz('post_test')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    quizType === 'post_test'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  หลังเรียน
                </button>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกแบบทดสอบ</span>
              </button>
            </div>
          </div>

          {/* Quiz Title & Header */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              หัวข้อแบบทดสอบ
            </label>
            <input
              type="text"
              value={quizForm.title}
              onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-300">
                รายการข้อสอบ ({quizForm.questions?.length || 0} ข้อ):
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetQuizDefault}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700 transition-colors"
                >
                  <RotateCcw className="w-3 h-3 text-amber-400" />
                  <span>คืนค่ามาตรฐาน สสวท.</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มข้อคำถามใหม่</span>
                </button>
              </div>
            </div>

            {(quizForm.questions || []).map((q, qIdx) => {
              const currentCorrect = q.correctIndex ?? q.correctAnswer ?? 0;

              return (
                <div
                  key={q.id || qIdx}
                  className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-left"
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
                          onClick={() => handleMoveQuestion(qIdx, 'up')}
                          className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                          title="เลื่อนขึ้น"
                        >
                          <MoveUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={qIdx === (quizForm.questions?.length || 1) - 1}
                          onClick={() => handleMoveQuestion(qIdx, 'down')}
                          className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                          title="เลื่อนลง"
                        >
                          <MoveDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(qIdx)}
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
                      onChange={(e) => handleUpdateQuestion(qIdx, { question: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Options (A, B, C, D) */}
                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-400 block">
                      ตัวเลือกคำตอบ (คลิกวงกลมด้านหน้าเพื่อกำหนดข้อที่ถูกต้อง):
                    </label>
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuestion(qIdx, { correctIndex: optIdx, correctAnswer: optIdx })}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                            currentCorrect === optIdx
                              ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...q.options];
                            newOpts[optIdx] = e.target.value;
                            handleUpdateQuestion(qIdx, { options: newOpts });
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
                      คำอธิบายเฉลยและเหตุผล (แสดงให้นักเรียนรู้เมื่อตอบเสร็จ)
                    </label>
                    <textarea
                      rows={2}
                      value={q.explanation || ''}
                      onChange={(e) => handleUpdateQuestion(qIdx, { explanation: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกแบบทดสอบทั้งหมด</span>
            </button>
          </div>
        </form>
      )}

      {/* SUBTAB 3: MINI-GAME SETTINGS */}
      {subTab === 'games' && (
        <div className="space-y-6">
        <form onSubmit={handleSaveGame} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-lg text-white font-['Chakra_Petch']">
                การตั้งค่ามินิเกม บทที่ {gameForm.chapterNumber}: {gameForm.title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                ปรับปรุงคำชี้แจง คะแนนเต็ม และรางวัล XP ประจำบทเรียน
              </p>
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกเกม</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                ชื่อมินิเกม
              </label>
              <input
                type="text"
                value={gameForm.title}
                onChange={(e) => setGameForm({ ...gameForm, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                คะแนนเต็ม (Max Score)
              </label>
              <input
                type="number"
                value={gameForm.maxScore}
                onChange={(e) => setGameForm({ ...gameForm, maxScore: Number(e.target.value) || 100 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              คำชี้แจงและกติกาการเล่นสำหรับนักเรียน
            </label>
            <textarea
              rows={3}
              value={gameForm.instructions}
              onChange={(e) => setGameForm({ ...gameForm, instructions: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                รางวัล XP ที่ได้รับเมื่อพิชิตเกม
              </label>
              <input
                type="number"
                value={gameForm.xpReward}
                onChange={(e) => setGameForm({ ...gameForm, xpReward: Number(e.target.value) || 200 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="gameEnabledCheck"
                checked={gameForm.isEnabled}
                onChange={(e) => setGameForm({ ...gameForm, isEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-950 border-slate-800"
              />
              <label htmlFor="gameEnabledCheck" className="text-xs text-slate-200 font-semibold cursor-pointer">
                เปิดให้นักเรียนเข้าเล่นมินิเกมนี้ในระบบ
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการตั้งค่ามินิเกม</span>
            </button>
          </div>
        </form>

        {/* ADVANCED MINI-GAME CONFIGURATION EDITOR (ROUNDS, CARDS, QUESTIONS, BLOCKS, TARGETS) */}
        <div className="pt-4">
          <TeacherGameEditor
            selectedChapter={selectedChapter}
            onGameSaved={onLessonsUpdated}
          />
        </div>
      </div>
      )}

      {/* CREATE NEW LESSON MODAL */}
      {showAddLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 space-y-5 text-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white font-['Chakra_Petch']">
                    เพิ่มบทเรียน / หน่วยการเรียนรู้ใหม่
                  </h3>
                  <p className="text-xs text-slate-400">
                    กำหนดบทเรียนใหม่พร้อมข้อสอบก่อน-หลังเรียน วิดีโอ และใบงานอัตโนมัติ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddLessonModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLessonSubmit} className="space-y-4 text-xs">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>
                  ระบบจะสร้างเป็น <strong>บทที่ {Math.max(...lessons.map((l) => l.chapterNumber), 0) + 1}</strong> ต่อจากบทเรียนเดิมที่มีอยู่
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">ชื่อบทเรียนใหม่ *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น การพัฒนาโครงงานคอมพิวเตอร์และการประยุกต์ AI"
                  value={newLessonForm.title}
                  onChange={(e) => setNewLessonForm({ ...newLessonForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">หน้าหนังสือ สสวท. ม.1</label>
                  <input
                    type="text"
                    placeholder="เช่น หน้า 150–175"
                    value={newLessonForm.textbookPages}
                    onChange={(e) => setNewLessonForm({ ...newLessonForm, textbookPages: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">ลิงก์คลิปวิดีโอ (YouTube URL หรือ ID)</label>
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={newLessonForm.videoUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      const autoDur = autoDetectVideoDuration(val, newLessonForm.videoDuration);
                      setNewLessonForm({
                        ...newLessonForm,
                        videoUrl: val,
                        videoDuration: autoDur || newLessonForm.videoDuration,
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">คำอธิบายย่อของบทเรียน</label>
                <textarea
                  rows={2}
                  placeholder="ระบุจุดเด่นหรือสาระโดยย่อของบทเรียนนี้"
                  value={newLessonForm.description}
                  onChange={(e) => setNewLessonForm({ ...newLessonForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">สาระสำคัญประจำบท (Core Concept)</label>
                <textarea
                  rows={2}
                  placeholder="หลักการสำคัญที่นักเรียนจะได้รับจากการเรียนบทนี้"
                  value={newLessonForm.coreConcept}
                  onChange={(e) => setNewLessonForm({ ...newLessonForm, coreConcept: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">เนื้อหาสรุปอย่างละเอียด (Content Summary)</label>
                <textarea
                  rows={3}
                  placeholder="คำอธิบายสรุปเนื้อหาบทเรียนสำหรับนักเรียนอ่านประกอบ"
                  value={newLessonForm.contentSummary}
                  onChange={(e) => setNewLessonForm({ ...newLessonForm, contentSummary: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">คำสำคัญและหัวข้อย่อย (คั่นด้วยจุลภาค , )</label>
                <input
                  type="text"
                  placeholder="เช่น ปัญญาประดิษฐ์, การเรียนรู้ของเครื่อง, จริยธรรม"
                  value={newLessonForm.topics}
                  onChange={(e) => setNewLessonForm({ ...newLessonForm, topics: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddLessonModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>บันทึกและสร้างบทเรียนใหม่</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
