/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string;
  avatarUrl?: string;
  createdAt: string;
  approvalStatus?: 'approved' | 'pending' | 'rejected';
}

export interface StudentProfile {
  userId: string;
  studentId: string; // รหัสนักเรียน e.g. "6701001"
  gradeLevel: string; // e.g. "ม.1"
  classroom: string; // e.g. "ม.1/1"
  seatNumber: number; // เลขที่ e.g. 1
  xp: number;
  level: number;
  totalCompletedLessons: number;
  coins?: number; // เหรียญทองสะสมสำหรับกลไกเกมมิฟิเคชั่น
  starPoints?: number; // คะแนนสะสมสำหรับจัดอันดับ Leaderboard
  assignedTeacherId?: string; // ครูผู้รับผิดชอบที่กดตอบรับ
  assignedTeacherName?: string; // ชื่อครูผู้รับผิดชอบ
  approvalDate?: string; // วันที่ครูกดตอบรับ
}

export interface TeacherProfile {
  userId: string;
  teacherId: string; // รหัสครู e.g. "TCH001"
  schoolName: string; // โรงเรียน
  subjectTaught: string; // รายวิชาที่สอน
  phoneNumber?: string; // เบอร์โทรศัพท์
  classesManaged?: string[]; // ห้องเรียนที่ดูแล
  approvedByAdminId?: string; // Admin ผู้อนุมัติ
  approvalDate?: string; // วันที่ Admin อนุมัติ
}

export interface ClassRoom {
  id: string;
  name: string; // e.g. "ม.1/1"
  grade: string; // e.g. "ม.1"
  academicYear: string; // e.g. "2569"
  teacherId: string;
  assistantTeacherIds?: string[];
  studentCount: number;
  passThresholdPercent: number; // default 60%
  passThresholdScore?: number; // เกณฑ์คะแนนผ่านขั้นต่ำ เช่น 10 หรือ 12 คะแนน (จากคะแนนเต็ม 18 คะแนน)
  lockedChapters?: number[]; // list of chapter numbers locked by teacher e.g. [3, 4, 5, 6]
}

export interface ClassEnrollment {
  id: string;
  classId: string;
  studentId: string;
  joinedAt: string;
}

export type LessonStatus = 'locked' | 'ready' | 'in_progress' | 'completed' | 'needs_review';

export interface StudentProgress {
  id?: string;
  userId: string;
  lessonId: string;
  status: LessonStatus | 'locked' | 'ready' | 'in_progress' | 'completed';
  gameScore?: number;
  completedGame?: boolean;
  quizScore?: number;
  preTestScore?: number;
  postTestScore?: number;
  xpEarned?: number;
  completedAt?: string;
  lastAccessedAt?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex?: number;
  correctAnswer?: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  chapterNumber: number;
  title: string;
  slug?: string;
  description: string;
  textbookPages?: string; // e.g. "หน้า 2–21"
  objectives?: string[];
  summarySections?: {
    title: string;
    page: string;
    content: string;
    keyPoints?: string[];
  }[];
  youtubeVideoId?: string;
  gameId?: string;
  iconName?: string;
  colorTheme?: string;
  // Extended fields for gamified UX & Project 14
  coverImageUrl?: string;
  coreConcept?: string;
  contentSummary?: string;
  topics?: string[];
  videoTitle?: string;
  videoUrl?: string;
  videoDuration?: string;
  badgeRewardId?: string;
  xpReward?: number;
  quiz?: Quiz;
  order?: number;
  isHidden?: boolean;
  learningPathNote?: string;
}

export interface YouTubeVideo {
  id: string;
  chapterNumber: number;
  title: string;
  description: string;
  youtubeId: string;
  duration: string;
  ipstUrl?: string;
  isFeatured?: boolean;
  thumbnailUrl?: string;
  order?: number;
  isHidden?: boolean;
  category?: string;
}

export type GameType = 'ar_hand' | 'flashcard_matching' | 'python_platformer' | 'head_tilt' | 'data_detective' | 'ar_cyber';

export interface Game {
  id: string;
  chapterNumber: number;
  title: string;
  type: GameType;
  instructions: string;
  cameraRequired: boolean;
  hasFallback: boolean;
  maxScore: number;
  xpReward: number;
  isEnabled: boolean;
}

export interface GameQuestion {
  id: string;
  gameId: string;
  scenario: string;
  items?: { id: string; text: string; isNecessary: boolean; icon?: string; category?: string }[];
  pairs?: { id: string; left: string; right: string; category?: string }[];
  codeSnippets?: { id: string; prompt: string; code: string; options: string[]; answer: string; explanation: string }[];
  headTiltItems?: { id: string; question: string; blockImage?: string; optionA: string; optionB: string; correct: 'A' | 'B'; explanation: string }[];
  cyberThreats?: { id: string; title: string; threatType: string; description: string; options: string[]; answerIndex: number; advice: string }[];
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'matching' | 'ordering' | 'fill_in' | 'scenario';

export interface QuestionChoice {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  quizId: string;
  type: QuestionType;
  prompt: string;
  choices: QuestionChoice[];
  correctAnswerText?: string; // For fill_in or ordering
  matchingPairs?: { left: string; right: string }[];
  orderSequence?: string[];
  explanation: string;
  textbookReference: string; // e.g. "สสวท. ม.1 หน้า 8"
  points: number;
}

export interface Quiz {
  id: string;
  chapterNumber: number;
  title: string;
  type?: 'pre_test' | 'post_test' | 'exercise';
  totalQuestions?: number;
  passThresholdPercent?: number; // e.g. 60
  isEnabled?: boolean;
  questions?: QuizQuestion[];
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  answers: Record<string, any>;
  completedAt: string;
}

export interface GameScore {
  id: string;
  gameId: string;
  userId: string;
  score: number;
  maxScore: number;
  stars: number;
  timeSpentSeconds: number;
  completedAt: string;
}

export interface LearningProgress {
  id: string;
  userId: string;
  chapterNumber: number;
  status: LessonStatus;
  preTestScore?: number;
  postTestScore?: number;
  gameScore?: number;
  exerciseScore?: number;
  videoWatched: boolean;
  lastUpdated: string;
}

export interface Badge {
  id: string;
  name: string;
  titleTh?: string;
  description: string;
  chapterNumber: number;
  iconName?: string;
  icon?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  requiredScorePercent?: number;
}

export interface StudentBadge {
  id: string;
  userId: string;
  badgeId: string;
  unlockedAt: string;
}

export interface TeacherFeedback {
  id: string;
  studentId: string;
  teacherId: string;
  teacherName: string;
  chapterNumber?: number;
  message: string;
  score?: number;
  maxScore?: number;
  worksheetTitle?: string;
  recommendedTopics?: string[];
  createdAt: string;
  read?: boolean;
}

export interface Announcement {
  id: string;
  teacherId: string;
  teacherName: string;
  targetClassId?: string; // empty means all classes
  title: string;
  content: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string; // teacherId or studentId
  message: string;
  timestamp: string;
  read: boolean;
}

export interface WorksheetTask {
  id: string;
  question: string;
  type: 'essay' | 'code' | 'diagram_desc';
  maxScore: number;
  hint?: string;
  sampleAnswer?: string;
}

export interface Worksheet {
  id: string;
  chapterNumber: number;
  title: string;
  description: string;
  instructions: string;
  tasks: WorksheetTask[];
  maxScore: number;
  dueDate?: string;
  textbookRef?: string;
}

export interface WorksheetSubmission {
  id: string;
  worksheetId: string;
  userId: string;
  studentName?: string;
  chapterNumber: number;
  answers: Record<string, string>; // taskId -> student answer
  score?: number;
  feedback?: string;
  gradedBy?: string;
  submittedAt: string;
  gradedAt?: string;
}

export interface QuestionMistakeStat {
  questionId: string;
  questionText: string;
  chapterNumber: number;
  quizType: 'pre_test' | 'post_test';
  totalAttempts: number;
  wrongCount: number;
  wrongPercentage: number;
  correctAnswerText: string;
  mostCommonWrongAnswer: string;
  textbookReference: string;
  explanation: string;
}

// -------------------------------------------------------------
// Detailed Minigame Data Interfaces (Editable by Teacher & Admin)
// -------------------------------------------------------------
export interface Game1AbstractionItem {
  id: string;
  name: string;
  isEssential: boolean;
  category: string;
  icon: string;
  reason: string;
}

export type Game1Item = Game1AbstractionItem;

export interface Game1RoundData {
  id: number;
  missionTitle: string;
  situation: string;
  targetGoal: string;
  items: Game1AbstractionItem[];
}

export interface Game2CardPair {
  pairId: string;
  symbolOrImage: string;
  name: string;
  desc: string;
  category: 'FLOWCHART' | 'STEP' | 'PSEUDOCODE' | string;
}

export interface Game3Question {
  id: string;
  category?: string;
  tier?: 'easy_mod' | 'medium' | 'medium_plus';
  prompt: string;
  codeSnippet?: string;
  starterCode?: string;
  options?: string[];
  choices?: string[];
  correctIndex?: number;
  correctAnswer?: number;
  explanation: string;
  hint?: string;
  damageValue?: number;
  damageBonus?: number;
}

export interface Game3Monster {
  id: number;
  name: string;
  title: string;
  avatar: string;
  bgGradient: string;
  maxHp: number;
  attackPower: number;
  conceptFocus: string;
  description: string;
}

export interface Game4StageBlockCategory {
  category: string;
  color: string;
  blocks: string[];
}

export interface Game4ScratchStage {
  stageNumber: number;
  title: string;
  subtitle?: string;
  objective?: string;
  story?: string;
  conceptName?: string;
  textbookPage?: string;
  mascotHint?: string;
  requiredBlockKeywords?: string[];
  initialBlocks?: string[];
  targetScore: number;
  availableBlocks: any;
  solutionSequence?: string[];
}

export interface Game5DataCardPair {
  pairId?: string;
  cardId?: string;
  symbol?: string;
  name?: string;
  term?: string;
  detail?: string;
  description?: string;
  example?: string;
  category: 'SOURCE' | 'ALGO' | 'CHART' | 'PRIMARY' | 'SECONDARY' | string;
}

export interface Game6ARTarget {
  id?: string;
  targetId?: string;
  name?: string;
  threatName?: string;
  type?: 'THREAT' | 'SAFE';
  riskLevel?: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  scenario?: string;
  options?: string[];
  correctOptionIndex?: number;
  mitigationGuide?: string;
  icon?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  lawRef?: string;
  advice?: string;
  scanned?: boolean;
}

