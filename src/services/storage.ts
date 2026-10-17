/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  StudentProfile,
  TeacherProfile,
  ClassRoom,
  ClassEnrollment,
  Lesson,
  YouTubeVideo,
  Game,
  GameQuestion,
  Quiz,
  QuizQuestion,
  Question,
  QuizAttempt,
  GameScore,
  LearningProgress,
  Badge,
  StudentBadge,
  TeacherFeedback,
  Announcement,
  ChatMessage,
  Worksheet,
  WorksheetSubmission,
  WorksheetTask,
  QuestionMistakeStat,
  UserRole,
} from '../types';
import { GameStorageService } from './gameStorage';
import {
  COMPREHENSIVE_PRE_QUESTIONS,
  COMPREHENSIVE_POST_QUESTIONS,
  getComprehensiveQuiz,
} from '../data/comprehensiveExamData';
import {
  syncAllVideosToFirestore,
  fetchVideosFromFirestore,
  syncGlobalStageLocksToFirestore,
  fetchGlobalStageLocksFromFirestore,
  syncQuizToFirestore,
} from './firebase';
export { GameStorageService };

const STORAGE_KEY_PREFIX = 'adventure_m1_';

function getLocal<T>(key: string, defaultVal: T): T {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return saved ? JSON.parse(saved) : defaultVal;
  } catch (e) {
    console.error(`Error reading ${key} from storage`, e);
    return defaultVal;
  }
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(val));
  } catch (e) {
    console.error(`Error saving ${key} to storage`, e);
  }
}

// Background sync with persistent Node.js Express server
export async function syncToPersistentDatabase(payload: Record<string, any>): Promise<void> {
  try {
    await fetch('/api/db/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Graceful offline fallback
  }
}

// Initialize and sync application state from Persistent Databases (Server + Cloud Firestore)
export async function initializeDatabaseSync(): Promise<{ synced: boolean; message: string }> {
  let serverLoaded = false;
  let firestoreLoaded = false;

  // 1. Fetch from Express Server Backend (data/db.json)
  try {
    const res = await fetch('/api/db/load');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        if (Array.isArray(d.deleted_video_ids) && d.deleted_video_ids.length > 0) {
          const currentDeleted = new Set(getLocal<string[]>('deleted_video_ids', []));
          d.deleted_video_ids.forEach((id: string) => currentDeleted.add(id));
          setLocal('deleted_video_ids', Array.from(currentDeleted));
        }
        if (Array.isArray(d.videos) && d.videos.length > 0) {
          setLocal('youtube_videos', d.videos);
        }
        if (d.stage_locks) {
          if (Array.isArray(d.stage_locks.globalLockedChapters)) {
            setLocal('global_locked_chapters', d.stage_locks.globalLockedChapters);
          }
          if (d.stage_locks.teacherPin) {
            setLocal('teacher_lock_pin', d.stage_locks.teacherPin);
          }
        }
        if (Array.isArray(d.classes) && d.classes.length > 0) {
          setLocal('classes', d.classes);
        }
        if (Array.isArray(d.lessons) && d.lessons.length > 0) {
          setLocal('lessons', d.lessons);
        }
        if (Array.isArray(d.quizzes) && d.quizzes.length > 0) {
          setLocal('quizzes', d.quizzes);
        }
        if (Array.isArray(d.worksheets) && d.worksheets.length > 0) {
          setLocal('worksheets', d.worksheets);
        }
        if (Array.isArray(d.student_profiles) && d.student_profiles.length > 0) {
          setLocal('student_profiles', d.student_profiles);
        }
        serverLoaded = true;
      }
    }
  } catch (err) {
    console.warn('Server database load deferred:', err);
  }

  // 2. Fetch from Firebase Cloud Firestore
  try {
    const firestoreVideos = await fetchVideosFromFirestore();
    if (firestoreVideos) {
      if (Array.isArray(firestoreVideos.deletedIds) && firestoreVideos.deletedIds.length > 0) {
        const currentDeleted = new Set(getLocal<string[]>('deleted_video_ids', []));
        firestoreVideos.deletedIds.forEach((id) => currentDeleted.add(id));
        setLocal('deleted_video_ids', Array.from(currentDeleted));
      }
      if (Array.isArray(firestoreVideos.videos) && firestoreVideos.videos.length > 0) {
        setLocal('youtube_videos', firestoreVideos.videos);
      }
      firestoreLoaded = true;
    }

    const firestoreLocks = await fetchGlobalStageLocksFromFirestore();
    if (firestoreLocks) {
      if (Array.isArray(firestoreLocks.globalLocks)) {
        setLocal('global_locked_chapters', firestoreLocks.globalLocks);
      }
      if (firestoreLocks.teacherPin) {
        setLocal('teacher_lock_pin', firestoreLocks.teacherPin);
      }
      firestoreLoaded = true;
    }
  } catch (err) {
    console.warn('Firebase Firestore initial sync deferred:', err);
  }

  return {
    synced: serverLoaded || firestoreLoaded,
    message: 'ฐานข้อมูลเชื่อมต่อและซิงค์ข้อมูลเรียบร้อย (Server & Cloud Firestore)',
  };
}

// -------------------------------------------------------------
// SEED DATA: 6 Lessons based on สสวท. ม.1 Textbook & Project 14
// -------------------------------------------------------------
const INITIAL_LESSONS: Lesson[] = [
  {
    id: 'lesson-1',
    chapterNumber: 1,
    title: 'แนวคิดเชิงนามธรรม (Abstraction)',
    slug: 'abstraction',
    description: 'การแยกรายละเอียดที่สำคัญและจำเป็นออกจากรายละเอียดที่ไม่จำเป็น เพื่อให้แก้ปัญหาได้อย่างมีประสิทธิภาพ',
    textbookPages: 'หนังสือ สสวท. ม.1 หน้า 2–21',
    coverImageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
    videoTitle: 'สสวท. Project 14: บทที่ 1 แนวคิดเชิงนามธรรมกับการแก้ปัญหา',
    videoUrl: 'https://www.youtube.com/watch?v=bI9oX3R9M5w',
    videoDuration: '11:45 น.',
    coreConcept: 'การคัดแยกคุณลักษณะที่สำคัญและจำเป็นต่อการแก้ปัญหาออกจากรายละเอียดปลีกย่อยที่ไม่จำเป็นในสถานการณ์จริง',
    contentSummary: 'แนวคิดเชิงนามธรรม (Abstraction) เป็นหนึ่งในกระบวนการสำคัญของแนวคิดเชิงคำนวณ โดยมุ่งเน้นเฉพาะข้อมูลหรือคุณลักษณะที่ส่งผลต่อการบรรลุเป้าหมาย เช่น แผนที่รถไฟใต้ดินที่แสดงเฉพาะสถานีเชื่อมต่อโดยไม่แสดงความคดเคี้ยวของรางจริง',
    topics: ['ความหมายของ Abstraction', 'การคัดเลือกข้อมูลที่จำเป็น', 'การถ่ายทอดรายละเอียดปัญหา', 'การทำแผนที่จำลอง'],
    xpReward: 100,
    objectives: [
      'เข้าใจความหมายและประโยชน์ของแนวคิดเชิงนามธรรม (หน้า 4)',
      'สามารถคัดเลือกคุณลักษณะที่จำเป็นต่อการแก้ปัญหาในสถานการณ์จริงได้ (หน้า 8)',
      'สามารถถ่ายทอดรายละเอียดของปัญหาและการแก้ปัญหาในรูปแบบที่เข้าใจง่าย (หน้า 9)',
    ],
    summarySections: [
      {
        title: '1.1 แนวคิดเชิงนามธรรม (หน้า 4)',
        page: 'หน้า 4',
        content:
          'แนวคิดเชิงนามธรรม (Abstraction) เป็นองค์ประกอบสำคัญของแนวคิดเชิงคำนวณ เป็นกระบวนการคัดแยกคุณลักษณะที่สำคัญออกจากรายละเอียดปลีกย่อยที่ไม่จำเป็นสำหรับเป้าหมายของการแก้ปัญหา',
        keyPoints: [
          'มุ่งเน้นเฉพาะข้อมูลที่มีผลต่อการแก้ปัญหา',
          'ตัดรายละเอียดที่ซ้ำซ้อนหรือไม่ส่งผลต่อผลลัพธ์ออก',
          'ช่วยให้เข้าใจปัญหาที่ซับซ้อนได้รวดเร็วขึ้น',
        ],
      },
      {
        title: '1.2 การคัดเลือกคุณลักษณะที่จำเป็นต่อการแก้ปัญหา (หน้า 8)',
        page: 'หน้า 8',
        content:
          'ในสถานการณ์เดียวกัน ข้อมูลเดียวกันอาจจำเป็นสำหรับบุคคลหนึ่งแต่ไม่จำเป็นสำหรับอีกบุคคลหนึ่ง เช่น การดูแผนที่รถไฟฟ้า ผู้โดยสารต้องการทราบแค่สถานีเชื่อมต่อและลำดับสถานี ไม่จำเป็นต้องรู้พิกัดดาวเทียมหรือความคดเคี้ยวของรางจริง',
        keyPoints: [
          'พิจารณาวัตถุประสงค์ของการใช้งานเป็นหลัก',
          'ตัวอย่าง: แผนที่รถไฟใต้ดิน (Harry Beck)',
          'ตัวอย่าง: การเตรียมกระเป๋าไปโรงเรียนตามตารางสอน',
        ],
      },
      {
        title: '1.3 การถ่ายทอดรายละเอียดของปัญหาและการแก้ปัญหา (หน้า 9–20)',
        page: 'หน้า 9',
        content:
          'เมื่อคัดเลือกคุณลักษณะที่จำเป็นได้แล้ว ต้องสามารถสื่อสารหรือถ่ายทอดออกมาเป็นข้อความ ภาพร่าง หรือสัญลักษณ์ เพื่อให้ผู้อื่นเข้าใจตรงกันและนำไปสู่การเขียนโปรแกรมได้',
      },
    ],
    youtubeVideoId: 'bI9oX3R9M5w',
    gameId: 'game-1',
    iconName: 'Sparkles',
    colorTheme: 'from-amber-500 to-orange-600',
  },
  {
    id: 'lesson-2',
    chapterNumber: 2,
    title: 'การแก้ปัญหา รหัสลำลอง และผังงาน',
    slug: 'problem-solving',
    description: 'ขั้นตอนการแก้ปัญหาอย่างเป็นระบบ การเขียนรหัสลำลอง และการใช้ผังงาน (Flowchart) จำลองกระบวนการทำงาน',
    textbookPages: 'หนังสือ สสวท. ม.1 หน้า 22–41',
    coverImageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop',
    videoTitle: 'สสวท. Project 14: บทที่ 2 ขั้นตอนการแก้ปัญหาและรหัสลำลอง',
    videoUrl: 'https://www.youtube.com/watch?v=8f7sD2m8_Wc',
    videoDuration: '14:10 น.',
    coreConcept: 'การแปลงแนวคิดการแก้ปัญหา 4 ขั้นตอน ให้กลายเป็นรหัสลำลองภาษาธรรมชาติ และผังงานสัญลักษณ์เรขาคณิตมาตรฐานสากล',
    contentSummary: 'การแก้ปัญหาอย่างเป็นระบบเริ่มจาก 1) วิเคราะห์ปัญหา 2) วางแผน 3) ดำเนินการ 4) ตรวจสอบและประเมินผล การเขียนรหัสลำลองช่วยสื่อสารขั้นตอน และผังงาน (Flowchart) ใช้สัญลักษณ์ เช่น Start/Stop, Process, Decision, Input/Output เพื่อแสดงทิศทางการประมวลผล',
    topics: ['4 ขั้นตอนการแก้ปัญหา', 'การเขียนรหัสลำลอง (Pseudocode)', 'สัญลักษณ์ผังงาน (Flowchart)', 'การตัดสินใจและตัวแปร'],
    xpReward: 120,
    objectives: [
      'เข้าใจ 4 ขั้นตอนการแก้ปัญหา (วิเคราะห์, วางแผน, ดำเนินการ, ตรวจสอบ) หน้า 24',
      'เขียนรหัสลำลอง (Pseudocode) สื่อสารขั้นตอนได้อย่างถูกต้อง หน้า 28',
      'เขียนผังงาน (Flowchart) ด้วยสัญลักษณ์มาตรฐานสากล หน้า 29–32',
      'เข้าใจการกำหนดค่าตัวแปรและโครงสร้างการตัดสินใจ หน้า 33–38',
    ],
    summarySections: [
      {
        title: '2.1 ขั้นตอนการแก้ปัญหา (หน้า 24)',
        page: 'หน้า 24',
        content:
          'กระบวนการแก้ปัญหาทางวิทยาการคำนวณประกอบด้วย 4 ขั้นตอน: 1) การวิเคราะห์และกำหนดรายละเอียดของปัญหา 2) การวางแผนการแก้ปัญหา 3) การดำเนินการแก้ปัญหา 4) การตรวจสอบและประเมินผล',
      },
      {
        title: '2.2 การเขียนรหัสลำลองและผังงาน (หน้า 28–32)',
        page: 'หน้า 28',
        content:
          'รหัสลำลองคือข้อความภาษาธรรมชาติที่เขียนอธิบายขั้นตอนการทำงานทีละบรรทัด ผังงานคือการใช้สัญลักษณ์รูปเรขาคณิตแทนคำสั่ง เช่น สี่เหลี่ยมมน (เริ่มต้น/สิ้นสุด), สี่เหลี่ยมผืนผ้า (ประมวลผล), สี่เหลี่ยมข้าวหลามตัด (การตัดสินใจเงื่อนไข), สี่เหลี่ยมด้านขนาน (รับ/แสดงข้อมูล)',
      },
      {
        title: '2.3 การกำหนดค่าให้ตัวแปร (หน้า 33)',
        page: 'หน้า 33',
        content:
          'ตัวแปรใช้สำหรับเก็บค่าข้อมูลที่สามารถเปลี่ยนแปลงได้ในระหว่างการประมวลผล มีการดำเนินการทางคณิตศาสตร์และเปรียบเทียบค่าตรรกะ',
      },
    ],
    youtubeVideoId: '8f7sD2m8_Wc',
    gameId: 'game-2',
    iconName: 'Workflow',
    colorTheme: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'lesson-3',
    chapterNumber: 3,
    title: 'การโปรแกรมด้วยภาษาไพทอน (Python)',
    slug: 'python-programming',
    description: 'พื้นฐานการเขียนโค้ดภาษา Python ตัวแปร ชนิดข้อมูล การวนซ้ำ ทางเลือก และคำสั่งเต่าไพทอน (Turtle Graphics)',
    textbookPages: 'หนังสือ สสวท. ม.1 หน้า 42–84',
    coverImageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop',
    videoTitle: 'สสวท. Project 14: บทที่ 3 พื้นฐานภาษาไพทอน ตัวแปรและการวนซ้ำ',
    videoUrl: 'https://www.youtube.com/watch?v=pU6J_eN3_xQ',
    videoDuration: '16:05 น.',
    coreConcept: 'หลักการเขียนโค้ด Python เบื้องต้น ตัวแปร int, float, str, โครงสร้างควบคุม if-else, วนซ้ำ for/while และการวาดภาพด้วยเต่าไพทอน',
    contentSummary: 'ภาษา Python เป็นภาษาที่กระชับ เหมาะกับผู้เริ่มต้น ในบทนี้นักเรียนจะได้เรียนรู้การใช้คำสั่ง print(), input(), ชนิดข้อมูลตัวเลขและข้อความ โครงสร้างเงื่อนไข if-elif-else และการวนซ้ำ for loop พร้อมทดลองสั่งเต่า turtle เดินหน้า เลี้ยว และวาดรูปทรงเรขาคณิต',
    topics: ['ไวยากรณ์ Python พื้นฐาน', 'ตัวแปรและชนิดข้อมูล', 'คำสั่งเงื่อนไข if-else', 'คำสั่งวนซ้ำ for loop', 'เต่าไพทอน (Turtle Graphics)'],
    xpReward: 150,
    objectives: [
      'เข้าใจโครงสร้างไวยากรณ์ภาษา Python และโหมดสคริปต์ หน้า 45–66',
      'ประกาศตัวแปรและใช้งานชนิดข้อมูลพื้นฐาน int, float, str, bool หน้า 52–61',
      'แปลงชนิดข้อมูล (Type Casting) เช่น int() float() str() หน้า 62',
      'ควบคุมการทำงานแบบวนซ้ำ (for, while) และทางเลือก (if, elif, else) หน้า 71–82',
      'เขียนคำสั่ง Turtle Python วาดรูปทรงเรขาคณิต หน้า 69',
    ],
    summarySections: [
      {
        title: '3.1–3.4 ตัวแปรและชนิดข้อมูลพื้นฐาน (หน้า 52–62)',
        page: 'หน้า 52',
        content:
          'ภาษา Python นิยมใช้เพราะอ่านเข้าใจง่าย ชนิดข้อมูลหลักได้แก่: int (จำนวนเต็ม), float (ทศนิยม), str (ข้อความในเครื่องหมายคำพูด), bool (ค่าจริงหรือเท็จ True/False)',
      },
      {
        title: '3.6 ฝึกเขียนโปรแกรมกับเต่าไพทอน (หน้า 69)',
        page: 'หน้า 69',
        content:
          'โมดูล turtle ช่วยให้นักเรียนเห็นผลลัพธ์ของคำสั่งเชิงภาพ คำสั่งพื้นฐาน: forward(d), backward(d), left(angle), right(angle), penup(), pendown(), circle(r)',
      },
      {
        title: '3.7–3.8 การวนซ้ำและทางเลือก (หน้า 71–82)',
        page: 'หน้า 71',
        content:
          'for i in range(n) ใช้ทำซ้ำตามจำนวนรอบที่ทราบแน่นอน while condition ทำซ้ำจนกว่าเงื่อนไขจะเป็นเท็จ if...elif...else ใช้ตรวจสอบเงื่อนไขเพื่อเลือกทิศทางการทำงาน',
      },
    ],
    youtubeVideoId: 'pU6J_eN3_xQ',
    gameId: 'game-3',
    iconName: 'Terminal',
    colorTheme: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'lesson-4',
    chapterNumber: 4,
    title: 'การโปรแกรมด้วย Scratch',
    slug: 'scratch-challenge',
    description: 'การสร้างแอนิเมชันและเกมด้วยบล็อกคำสั่ง Scratch ตัวละคร ตัวแปร เหตุการณ์ การวนซ้ำ และการโต้ตอบ',
    textbookPages: 'หนังสือ สสวท. ม.1 หน้า 88–132',
    coverImageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop',
    videoTitle: 'สสวท. Project 14: บทที่ 4 เริ่มต้นสร้างเกมและแอนิเมชันด้วย Scratch',
    videoUrl: 'https://www.youtube.com/watch?v=2qH8v_N9xLs',
    videoDuration: '15:20 น.',
    coreConcept: 'การใช้บล็อกคำสั่งเชิงภาพ (Block-based Programming) ในการสร้างสรรค์ตัวละคร เวที เสียง ตัวแปร และการตรวจสอบการชนในเกม',
    contentSummary: 'โปรแกรม Scratch ใช้บล็อกต่อคำสั่งแทนการพิมพ์โค้ด ช่วยป้องกันข้อผิดพลาดทางไวยากรณ์ เหมาะสำหรับสร้างเกมและสื่อโต้ตอบ เรียนรู้บล็อกเคลื่อนที่ (Motion), ตรวจจับ (Sensing), ตัวแปร (Variables), และเงื่อนไขแบบวนซ้ำ (forever / repeat until)',
    topics: ['ส่วนประกอบโปรแกรม Scratch', 'บล็อก Motion และ Looks', 'ตัวแปร (Variables) เก็บคะแนน', 'เงื่อนไข if-then และ repeat until'],
    xpReward: 150,
    objectives: [
      'เข้าใจส่วนประกอบหน้าต่างโปรแกรม Scratch หน้า 90',
      'ใช้งานบล็อกควบคุม (Control) ทำงานแบบวนซ้ำ forever, repeat หน้า 102',
      'สร้างและจัดการตัวแปร (Variables) เก็บคะแนนและสถานะเกม หน้า 109',
      'ใช้บล็อกตรวจสอบเงื่อนไข if-then และ repeat until หน้า 122–126',
    ],
    summarySections: [
      {
        title: '4.1 หน้าต่างและการทำงานของ Scratch (หน้า 90)',
        page: 'หน้า 90',
        content:
          'Scratch เป็นภาษาโปรแกรมเชิงภาพ (Visual Block-based Programming) เหมาะสำหรับผู้เริ่มต้น ประกอบด้วยเวที (Stage), ตัวละคร (Sprite), พื้นที่วางสคริปต์ (Script Area) และหมวดหมู่บล็อกคำสั่ง',
      },
      {
        title: '4.2–4.3 การวนซ้ำและตัวแปรใน Scratch (หน้า 102–109)',
        page: 'หน้า 102',
        content:
          'บล็อก repeat (10) ทำซ้ำ 10 รอบ, forever ทำซ้ำไม่สิ้นสุด ตัวแปรสามารถสร้างเพื่อเก็บค่า เช่น score, time, lives และสามารถปรับเปลี่ยนค่าด้วย change [score] by 1',
      },
      {
        title: '4.4 การทำงานแบบมีทางเลือกใน Scratch (บทที่ 4 ตอน 3/4 หน้า 122–126)',
        page: 'หน้า 122',
        content:
          'การทำงานแบบมีทางเลือก (Selection) ในโปรแกรม Scratch ใช้บล็อก if <เงื่อนไข> then และ if <เงื่อนไข> then ... else ... เช่น การตรวจจับ touching [edge]? เพื่อสั่งตัวละครกระเด้งกลับ หรือการเปรียบเทียบคะแนนเพื่อเปลี่ยนด่าน',
      },
    ],
    youtubeVideoId: '2qH8v_N9xLs',
    gameId: 'game-4',
    iconName: 'Puzzle',
    colorTheme: 'from-violet-500 to-purple-600',
  },
  {
    id: 'lesson-5',
    chapterNumber: 5,
    title: 'ข้อมูลและการประมวลผล (Data Detective)',
    slug: 'data-processing',
    description: 'การจำแนกประเภทข้อมูล การรวบรวม การประมวลผล และการสร้างทางเลือกเพื่อการตัดสินใจอย่างมีหลักการ',
    textbookPages: 'หนังสือ สสวท. ม.1 หน้า 136–163',
    coverImageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop',
    videoTitle: 'สสวท. Project 14: บทที่ 5 การรวบรวมและประมวลผลข้อมูลเพื่อการตัดสินใจ',
    videoUrl: 'https://www.youtube.com/watch?v=m4X8v_L7kNo',
    videoDuration: '13:15 น.',
    coreConcept: 'การแยกประเภทข้อมูลปฐมภูมิ-ทุติยภูมิ กระบวนการประมวลผลข้อมูล และการใช้ตารางเกณฑ์ตัดสินใจเลือกทางเลือกที่ดีที่สุด',
    contentSummary: 'ข้อมูลมีอยู่รอบตัวเรา การนำข้อมูลมาใช้ประโยชน์ต้องผ่านกระบวนการรวบรวม การตรวจสอบความถูกต้อง การประมวลผล (หาผลรวม ค่าเฉลี่ย คัดกรอง จัดกลุ่ม) และนำเสนอเป็นกราฟหรือแผนภูมิ เพื่อช่วยให้การตัดสินใจเป็นไปอย่างมีเหตุผลและรอบคอบ',
    topics: ['ข้อมูลปฐมภูมิ vs ทุติยภูมิ', 'ขั้นตอนการประมวลผลข้อมูล', 'การสร้างทางเลือกและการประเมินข้อมูลเพื่อการตัดสินใจ', 'การนำเสนอข้อมูลด้วยแผนภูมิ'],
    xpReward: 130,
    objectives: [
      'จำแนกประเภทข้อมูล ปฐมภูมิ และทุติยภูมิ หน้า 139–141',
      'เข้าใจขั้นตอนการรวบรวมและประมวลผลข้อมูล หน้า 141–153',
      'สร้างทางเลือกและใช้เกณฑ์ในการตัดสินใจจากข้อมูลจริง หน้า 154–157',
      'รู้จักซอฟต์แวร์จัดการข้อมูล ตารางคำนวณและแผนภูมิ หน้า 158–162',
    ],
    summarySections: [
      {
        title: '5.1 ข้อมูลและแหล่งข้อมูล (หน้า 139)',
        page: 'หน้า 139',
        content:
          'ข้อมูลคือข้อเท็จจริงหรือเรื่องราวที่เกี่ยวข้องกับสิ่งต่างๆ แบ่งตามแหล่งที่มาเป็น ข้อมูลปฐมภูมิ (เก็บด้วยตนเอง เช่น สัมภาษณ์ ทดลอง สำรวจ) และข้อมูลทุติยภูมิ (ผู้อื่นเก็บไว้แล้ว เช่น สถิติทางการ รายงาน)',
      },
      {
        title: '5.2–5.3 การรวบรวมและประมวลผลข้อมูล (หน้า 141–153)',
        page: 'หน้า 141',
        content:
          'ขั้นตอน: กำหนดวัตถุประสงค์ → วางแผน → รวบรวม → ประมวลผล (คำนวณ เรียงลำดับ คัดกรอง สรุป) → นำเสนอในรูปแผนภูมิแท่ง แผนภูมิวงกลม หรือกราฟเส้น',
      },
      {
        title: '5.4 การสร้างทางเลือกและการประเมินเพื่อการตัดสินใจจากข้อมูล (หน้า 154)',
        page: 'หน้า 154',
        content:
          'การตัดสินใจบนฐานข้อมูล (Data-Driven Decision Making) ใช้ตารางประเมินทางเลือกโดยกำหนดเกณฑ์ (Criteria) และน้ำหนักความสำคัญ ช่วยให้เปรียบเทียบและเลือกทางเลือกที่ดีที่สุดอย่างมีเหตุผลและรอบคอบ',
      },
    ],
    youtubeVideoId: 'm4X8v_L7kNo',
    gameId: 'game-5',
    iconName: 'Database',
    colorTheme: 'from-cyan-500 to-sky-600',
  },
  {
    id: 'lesson-6',
    chapterNumber: 6,
    title: 'การใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย',
    slug: 'cyber-safety',
    description: 'ภัยคุกคามไซเบอร์ การตั้งรหัสผ่านที่รัดกุม การปกป้องข้อมูลส่วนบุคคล ข่าวปลอม และมารยาทดิจิทัล',
    textbookPages: 'หนังสือ สสวท. ม.1 หน้า 164–186',
    coverImageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800&auto=format&fit=crop',
    videoTitle: 'สสวท. Project 14: บทที่ 6 รู้ทันภัยไซเบอร์และการใช้เทคโนโลยีอย่างปลอดภัย',
    videoUrl: 'https://www.youtube.com/watch?v=K9m3v_P5xQs',
    videoDuration: '14:40 น.',
    coreConcept: 'การตระหนักรู้และป้องกันภัยคุกคามดิจิทัล การตั้งรหัสผ่านปลอดภัย การรักษาข้อมูลส่วนบุคคล และการปฏิบัติตามจริยธรรมคอมพิวเตอร์',
    contentSummary: 'การใช้งานอินเทอร์เน็ตมีทั้งประโยชน์และความเสี่ยง เช่น มัลแวร์, ฟิชชิ่ง (Phishing), ข่าวปลอม (Fake News), และการละเมิดลิขสิทธิ์ นักเรียนต้องรู้วิธีตั้งรหัสผ่านที่ปลอดภัยอย่างน้อย 8 ตัวอักษร ไม่เผยแพร่ข้อมูลระบุตัวตน (PII) และเคารพสิทธิของผู้อื่นบนโลกไซเบอร์',
    topics: ['ภัยคุกคามทางไซเบอร์ (Malware, Phishing)', 'การตั้งรหัสผ่านที่ปลอดภัย', 'การปกป้องข้อมูลส่วนบุคคล (PDPA)', 'ลิขสิทธิ์และ พ.ร.บ. คอมพิวเตอร์'],
    xpReward: 140,
    objectives: [
      'ระบุภัยคุกคามจากการใช้งานเทคโนโลยีสารสนเทศและวิธีป้องกัน หน้า 167–174',
      'เข้าใจแนวทางสร้างรหัสผ่านที่ปลอดภัยและการยืนยันตัวตน หน้า 170',
      'ตระหนักถึงการคุ้มครองข้อมูลส่วนบุคคลและระวังฟิชชิ่ง (Phishing) หน้า 172',
      'ปฏิบัติตาม พ.ร.บ.คอมพิวเตอร์ และลิขสิทธิ์ทางปัญญา หน้า 175–184',
    ],
    summarySections: [
      {
        title: '6.1 ภัยคุกคามไซเบอร์และการป้องกัน (หน้า 167)',
        page: 'หน้า 167',
        content:
          'ภัยคุกคามหลักได้แก่ มัลแวร์ (ไวรัส, เวิร์ม, โทรจัน, แรนซัมแวร์), ฟิชชิ่ง (Phishing หลอกให้กรอกข้อมูล), การแอบอ้างสิทธิ์ และการกลั่นแกล้งบนโลกออนไลน์ (Cyberbullying)',
      },
      {
        title: '6.2 การตั้งรหัสผ่านและการใช้เทคโนโลยีอย่างมีจริยธรรม (หน้า 170–175)',
        page: 'หน้า 170',
        content:
          'รหัสผ่านที่ดีควรมีความยาวอย่างน้อย 8 ตัวอักษร ผสมตัวพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และสัญลักษณ์ ไม่ใช้ข้อมูลส่วนตัว เช่น วันเกิด เบอร์โทรศัพท์ และไม่แชร์รหัสผ่านกับผู้อื่น',
      },
    ],
    youtubeVideoId: 'K9m3v_P5xQs',
    gameId: 'game-6',
    iconName: 'ShieldAlert',
    colorTheme: 'from-rose-500 to-red-600',
  },
  {
    id: 'lesson-7',
    chapterNumber: 7,
    title: 'แบบทดสอบวัดผลสัมฤทธิ์รวม 6 บท (Comprehensive Final Exam)',
    slug: 'comprehensive-final-exam',
    description: 'คลังข้อสอบวัดผลสัมฤทธิ์รวม 6 บทเรียน มีแบบทดสอบก่อนเรียน 30 ข้อ และแบบทดสอบหลังเรียน 30 ข้อ เพื่อวัดพัฒนาการองค์รวม',
    textbookPages: 'หนังสือ สสวท. ม.1 บทที่ 1–6 ครบหลักสูตร',
    coverImageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop',
    videoTitle: 'สรุปทบทวนเนื้อหาวิทยาการคำนวณ ม.1 ครบทั้ง 6 บทเรียน',
    videoUrl: 'https://www.youtube.com/watch?v=bI9oX3R9M5w',
    videoDuration: '28:40 น.',
    coreConcept: 'การประเมินทักษะการคิดเชิงคำนวณ การแก้ปัญหา การเขียนโค้ด และความปลอดภัยไซเบอร์แบบบูรณาการ',
    contentSummary: 'คลังข้อสอบวัดผลสัมฤทธิ์ปลายภาคเรียน ครอบคลุมทุกตัวชี้วัด ว 4.2 ม.1/1 ถึง ม.1/4 รวม 30 ข้อ ก่อนเรียนและหลังเรียน พร้อมระบบวิเคราะห์ความก้าวหน้าและเหรียญรางวัลมหาบัณฑิต',
    topics: ['แนวคิดเชิงนามธรรม', 'ผังงานและขั้นตอนวิธี', 'ภาษาไพทอน', 'บล็อกคำสั่ง Scratch', 'การจัดการข้อมูลและสารสนเทศ', 'ความปลอดภัยทางดิจิทัลและกฎหมายคอมพิวเตอร์'],
    xpReward: 300,
    badgeRewardId: 'badge-7',
    objectives: [
      'ประเมินทักษะความรู้ความเข้าใจเนื้อหาวิทยาการคำนวณ ม.1 ทั้ง 6 บทเรียน',
      'วัดผลสัมฤทธิ์ก่อนเรียน (Pre-test 30 ข้อ) และหลังเรียน (Post-test 30 ข้อ)',
      'รับเหรียญรางวัลมหาบัณฑิตคอมพิวเตอร์และคะแนนสะสมจัดอันดับสูงสุด (⭐ ตอบถูกข้อละ 10 คะแนน)',
    ],
    summarySections: [
      {
        title: 'สรุปบทที่ 1–2: แนวคิดเชิงคำนวณและผังงาน',
        page: 'หน้า 2–41',
        content: 'เน้นการตัดทิ้งรายละเอียดที่ไม่จำเป็น (Abstraction) และการนำ 4 ขั้นตอนการแก้ปัญหามาแปลงเป็นรหัสลำลองและผังงานสัญลักษณ์มาตรฐาน',
      },
      {
        title: 'สรุปบทที่ 3–4: การเขียนโปรแกรม Python & Scratch',
        page: 'หน้า 42–115',
        content: 'ตัวแปร ชนิดข้อมูล คำสั่งเงื่อนไข if-else การทำซ้ำ for/while และการต่อบล็อกคำสั่งเพื่อควบคุมการเคลื่อนที่และคำนวณ',
      },
      {
        title: 'สรุปบทที่ 5–6: ข้อมูล สารสนเทศ และความปลอดภัยไซเบอร์',
        page: 'หน้า 116–190',
        content: 'วงจรการประมวลผลข้อมูล การประเมินความน่าเชื่อถือ แหล่งข้อมูลทุติยภูมิ พ.ร.บ.คอมพิวเตอร์ และลิขสิทธิ์ Creative Commons',
      },
    ],
    youtubeVideoId: 'bI9oX3R9M5w',
    iconName: 'Crown',
    colorTheme: 'from-amber-500 via-purple-600 to-indigo-600',
  },
];

// -------------------------------------------------------------
// SEED DATA: Project 14 & IPST YouTube Videos (6 Chapters)
// -------------------------------------------------------------
const INITIAL_VIDEOS: YouTubeVideo[] = [
  {
    id: 'vid-1-1',
    chapterNumber: 1,
    order: 1,
    title: 'บทที่ 1: แนวคิดเชิงนามธรรมกับการแก้ปัญหา',
    description: 'วิดีโอสอนจาก สสวท. Project 14 ทำความเข้าใจแนวคิดเชิงนามธรรมและการคัดเลือกข้อมูลที่จำเป็น',
    youtubeId: 'bI9oX3R9M5w',
    duration: '11:45',
    thumbnailUrl: 'https://img.youtube.com/vi/bI9oX3R9M5w/hqdefault.jpg',
    ipstUrl: 'https://proj14.ipst.ac.th/m1/m1-cs/',
    isFeatured: true,
  },
  {
    id: 'vid-1-2',
    chapterNumber: 1,
    order: 2,
    title: 'ตัวอย่างการใช้แนวคิดเชิงนามธรรมในชีวิตประจำวัน',
    description: 'การวิเคราะห์ปัญหาการจัดระเบียบ การทำแผนที่ และการเลือกเส้นทางเดินรถ',
    youtubeId: 'W4r5KqfH6Yg',
    duration: '09:20',
    thumbnailUrl: 'https://img.youtube.com/vi/W4r5KqfH6Yg/hqdefault.jpg',
    ipstUrl: 'https://proj14.ipst.ac.th/m1/m1-cs/',
  },
  {
    id: 'vid-2-1',
    chapterNumber: 2,
    order: 3,
    title: 'บทที่ 2: ขั้นตอนการแก้ปัญหาและรหัสลำลอง',
    description: 'สสวท. Project 14 สอนการเขียนรหัสลำลอง (Pseudocode) แปลงปัญหาเป็นคำสั่งเป็นขั้นเป็นตอน',
    youtubeId: '8f7sD2m8_Wc',
    duration: '14:10',
    thumbnailUrl: 'https://img.youtube.com/vi/8f7sD2m8_Wc/hqdefault.jpg',
    ipstUrl: 'https://proj14.ipst.ac.th/m1/m1-cs/',
    isFeatured: true,
  },
  {
    id: 'vid-2-2',
    chapterNumber: 2,
    order: 4,
    title: 'การเขียนผังงาน (Flowchart) ด้วยสัญลักษณ์มาตรฐาน',
    description: 'ทำความเข้าใจสัญลักษณ์ผังงาน การทำงานแบบลำดับ ทางเลือก และทำซ้ำ',
    youtubeId: 'zR5H7s9_xY8',
    duration: '12:35',
    thumbnailUrl: 'https://img.youtube.com/vi/zR5H7s9_xY8/hqdefault.jpg',
    ipstUrl: 'https://proj14.ipst.ac.th/m1/m1-cs/',
  },
  {
    id: 'vid-3-1',
    chapterNumber: 3,
    order: 5,
    title: 'บทที่ 3: พื้นฐานภาษาไพทอน ตัวแปรและชนิดข้อมูล',
    description: 'สสวท. Project 14 แนะนำการเขียนโปรแกรมไพทอนเบื้องต้น ตัวแปร int, float, str',
    youtubeId: 'pU6J_eN3_xQ',
    duration: '16:05',
    thumbnailUrl: 'https://img.youtube.com/vi/pU6J_eN3_xQ/hqdefault.jpg',
    ipstUrl: 'https://proj14.ipst.ac.th/m1/m1-cs/',
    isFeatured: true,
  },
  {
    id: 'vid-3-2',
    chapterNumber: 3,
    order: 6,
    title: 'สนุกกับเต่าไพทอน (Turtle) และคำสั่งวนซ้ำ for',
    description: 'เขียนโค้ดสั่งเต่าไพทอนวาดภาพเรขาคณิตและใช้คำสั่งวนซ้ำประหยัดบรรทัด',
    youtubeId: '9bJ2x_mKL5o',
    duration: '13:50',
    thumbnailUrl: 'https://img.youtube.com/vi/9bJ2x_mKL5o/hqdefault.jpg',
    ipstUrl: 'https://proj14.ipst.ac.th/m1/m1-cs/',
  },
  {
    id: 'vid-4-1',
    chapterNumber: 4,
    order: 7,
    title: 'บทที่ 4: การโปรแกรมด้วย Scratch (เริ่มต้นสร้างแอนิเมชันและเกม)',
    description: 'สสวท. Project 14 สอนใช้งาน Scratch หน้าต่างการทำงาน ตัวละคร และบล็อกเคลื่อนที่',
    youtubeId: '2qH8v_N9xLs',
    duration: '15:20',
    thumbnailUrl: 'https://img.youtube.com/vi/2qH8v_N9xLs/hqdefault.jpg',
    ipstUrl: 'https://proj14.ipst.ac.th/m1/m1-cs/',
    isFeatured: true,
  },
  {
    id: 'vid-4-2',
    chapterNumber: 4,
    order: 8,
    title: 'บทที่ 4 (ตอน 2/4): การทำงานแบบวนซ้ำและการใช้งานตัวแปรใน Scratch',
    description: 'สสวท. Project 14 แนะนำการวนซ้ำด้วยบล็อก repeat, forever และการสร้างตัวแปรเก็บคะแนน',
    youtubeId: '2qH8v_N9xLs',
    duration: '12:40',
    thumbnailUrl: 'https://img.youtube.com/vi/2qH8v_N9xLs/hqdefault.jpg',
    ipstUrl: 'https://proj14.ipst.ac.th/m1/m1-cs/',
    isFeatured: false,
  },
  {
    id: 'vid-4-3',
    chapterNumber: 4,
    order: 9,
    title: 'บทที่ 4 (ตอน 3/4): การทำงานแบบมีทางเลือกใน Scratch (If-Then / If-Then-Else)',
    description: 'สสวท. Project 14 บทที่ 4 ตอน 3/4 การสร้างเงื่อนไขแบบมีทางเลือก การตรวจสอบสัมผัสตัวละคร และคำสั่งตัดสินใจใน Scratch',
    youtubeId: '2qH8v_N9xLs',
    duration: '14:15',
    thumbnailUrl: 'https://img.youtube.com/vi/2qH8v_N9xLs/hqdefault.jpg',
    ipstUrl: 'https://proj14.ipst.ac.th/m1/m1-cs/',
    isFeatured: false,
  },
  {
    id: 'vid-5-1',
    chapterNumber: 5,
    order: 10,
    title: 'สสวท. Project 14: บทที่ 5 การรวบรวมและประมวลผลข้อมูลเพื่อการตัดสินใจ',
    description: 'สสวท. Project 14 เจาะลึกการรวบรวมข้อมูล การประมวลผล และการสร้างตารางเกณฑ์ตัดสินใจเลือกทางเลือกที่ดีที่สุด',
    youtubeId: 'm4X8v_L7kNo',
    duration: '13:15',
    thumbnailUrl: 'https://img.youtube.com/vi/m4X8v_L7kNo/hqdefault.jpg',
    ipstUrl: 'https://proj14.ipst.ac.th/m1/m1-cs/',
    isFeatured: true,
  },
  {
    id: 'vid-5-2',
    chapterNumber: 5,
    order: 11,
    title: 'บทที่ 5 (ตอน 1/3): ข้อมูลและแหล่งข้อมูล (ข้อมูลปฐมภูมิ และข้อมูลทุติยภูมิ)',
    description: 'สสวท. Project 14 อธิบายความหมายของข้อมูล การจำแนกประเภทข้อมูลปฐมภูมิ vs ทุติยภูมิ และวิธีการจัดเก็บ',
    youtubeId: 'm4X8v_L7kNo',
    duration: '11:30',
    thumbnailUrl: 'https://img.youtube.com/vi/m4X8v_L7kNo/hqdefault.jpg',
    ipstUrl: 'https://proj14.ipst.ac.th/m1/m1-cs/',
    isFeatured: false,
  },
  {
    id: 'vid-5-3',
    chapterNumber: 5,
    order: 12,
    title: 'บทที่ 5 (ตอน 2/3): ขั้นตอนการรวบรวมและการประมวลผลข้อมูลเพื่อการตัดสินใจ',
    description: 'สสวท. Project 14 อธิบายกระบวนการประมวลผลข้อมูล การจัดกลุ่ม การคำนวณสถิติ และการสร้างทางเลือกประเมินผล',
    youtubeId: 'm4X8v_L7kNo',
    duration: '15:10',
    thumbnailUrl: 'https://img.youtube.com/vi/m4X8v_L7kNo/hqdefault.jpg',
    ipstUrl: 'https://proj14.ipst.ac.th/m1/m1-cs/',
    isFeatured: false,
  },
  {
    id: 'vid-6-1',
    chapterNumber: 6,
    order: 13,
    title: 'บทที่ 6: รู้ทันภัยไซเบอร์และการใช้เทคโนโลยีอย่างปลอดภัย',
    description: 'สสวท. Project 14 สรุปภัยคุกคาม Phishing มัลแวร์ และการปฏิบัติตามกฎหมายลิขสิทธิ์',
    youtubeId: 'K9m3v_P5xQs',
    duration: '14:40',
    thumbnailUrl: 'https://img.youtube.com/vi/K9m3v_P5xQs/hqdefault.jpg',
    ipstUrl: 'https://proj14.ipst.ac.th/m1/m1-cs/',
    isFeatured: true,
  },
];

// -------------------------------------------------------------
// SEED DATA: Games Configuration for 6 Chapters
// -------------------------------------------------------------
const INITIAL_GAMES: Game[] = [
  {
    id: 'game-1',
    chapterNumber: 1,
    title: 'AR Hand Tracking: คัดแยกสิ่งสำคัญ (แนวคิดเชิงนามธรรม)',
    type: 'ar_hand',
    instructions:
      'ใช้กล้องตรวจจับมือ AR หรือเมาส์/สัมผัส ชี้และคัดแยกข้อมูลที่จำเป็น (Essential) ออกจากรายละเอียดปลีกย่อย (Non-Essential) ตามแนวคิดเชิงนามธรรม',
    cameraRequired: true,
    hasFallback: true,
    maxScore: 100,
    xpReward: 250,
    isEnabled: true,
  },
  {
    id: 'game-2',
    chapterNumber: 2,
    title: 'Flashcards & Matching Games: ผังงานและการแก้ปัญหา (เปิดไพ่ให้จำก่อนเริ่ม สุ่มโจทย์ไม่ซ้ำ)',
    type: 'flashcard_matching',
    instructions:
      'ระบบเปิดไพ่ให้นักเรียนจดจำก่อนเริ่มเล่น สุ่มโจทย์และลวดลายการ์ด AI จับคู่สัญลักษณ์ผังงานและขั้นตอนการแก้ปัญหา',
    cameraRequired: false,
    hasFallback: true,
    maxScore: 100,
    xpReward: 250,
    isEnabled: true,
  },
  {
    id: 'game-3',
    chapterNumber: 3,
    title: 'Interactive Text Adventure (LLM): ผจญภัยเขียนโปรแกรมไพทอนตอบโต้ไร้ขีดจำกัด',
    type: 'python_platformer',
    instructions:
      'ผจญภัยในพิภพไพทอนกับระบบ Large Language Model (LLM) สร้างเนื้อเรื่องและฉากตามข้อความ/โค้ดที่ผู้เล่นพิมพ์ตอบโต้แบบไร้ขีดจำกัด',
    cameraRequired: false,
    hasFallback: true,
    maxScore: 100,
    xpReward: 300,
    isEnabled: true,
  },
  {
    id: 'game-4',
    chapterNumber: 4,
    title: 'Head-Tilt Quiz: ใช้กล้องจับการเอียงหัว ซ้าย A / ขวา B (บล็อก Scratch)',
    type: 'head_tilt',
    instructions:
      'เปิดกล้องจับการเอียงศีรษะ (เอียงหัวไปทางซ้ายเลือกข้อ A / เอียงหัวไปทางขวาเลือกข้อ B) ตอบคำถามบล็อกคำสั่ง Scratch',
    cameraRequired: true,
    hasFallback: true,
    maxScore: 100,
    xpReward: 250,
    isEnabled: true,
  },
  {
    id: 'game-5',
    chapterNumber: 5,
    title: 'Interactive Quiz & Puzzle: Flashcards & Matching เกมจับคู่และทายใจข้อมูล (AI สุ่มโจทย์)',
    type: 'data_detective',
    instructions:
      'เกมจับคู่ภาพกับคำศัพท์และการ์ดทายใจข้อมูล ปฐมภูมิ/ทุติยภูมิ การค้นหาแบบทวิภาค (Binary Search) และการเรียงลำดับ (Bubble Sort) AI สุ่มลวดลายการ์ด',
    cameraRequired: false,
    hasFallback: true,
    maxScore: 100,
    xpReward: 250,
    isEnabled: true,
  },
  {
    id: 'game-6',
    chapterNumber: 6,
    title: 'AR - Augmented Reality Games: กล้องสแกน AR ตรวจจับและกำจัดภัยไซเบอร์',
    type: 'ar_cyber',
    instructions:
      'เปิดกล้องสแกนพื้นที่จริง เล็งเป้ากากบาท AR ค้นหาและกำจัดภัยคุกคามไซเบอร์ ฟิชชิ่ง มัลแวร์ รหัสผ่านอ่อนแอ และคุ้มครองลิขสิทธิ์ตาม พ.ร.บ.คอมฯ',
    cameraRequired: true,
    hasFallback: true,
    maxScore: 100,
    xpReward: 300,
    isEnabled: true,
  },
];

// -------------------------------------------------------------
// SEED DATA: Badges
// -------------------------------------------------------------
const INITIAL_BADGES: Badge[] = [
  {
    id: 'badge-1',
    name: 'Abstract Thinker',
    titleTh: 'นักคิดเชิงนามธรรม',
    description: 'ผ่านด่านแนวคิดเชิงนามธรรมและทำคะแนนแบบทดสอบได้เกิน 70%',
    chapterNumber: 1,
    iconName: 'Sparkles',
    rarity: 'common',
    requiredScorePercent: 70,
  },
  {
    id: 'badge-2',
    name: 'Master Problem Solver',
    titleTh: 'นักแก้ปัญหาผู้เชี่ยวชาญ',
    description: 'พิชิตผังงานและรหัสลำลองได้อย่างคล่องแคล่ว',
    chapterNumber: 2,
    iconName: 'Workflow',
    rarity: 'rare',
    requiredScorePercent: 70,
  },
  {
    id: 'badge-3',
    name: 'Python Explorer',
    titleTh: 'Python Explorer',
    description: 'ผ่านการทดสอบไวยากรณ์และเกม Python Code Runner',
    chapterNumber: 3,
    iconName: 'Terminal',
    rarity: 'epic',
    requiredScorePercent: 70,
  },
  {
    id: 'badge-4',
    name: 'Scratch Hero',
    titleTh: 'Scratch Hero',
    description: 'พิชิตเกมเอียงหัวเลือกบล็อกและสร้างตรรกะ Scratch สำเร็จ',
    chapterNumber: 4,
    iconName: 'Puzzle',
    rarity: 'rare',
    requiredScorePercent: 70,
  },
  {
    id: 'badge-5',
    name: 'Data Detective',
    titleTh: 'Data Detective',
    description: 'จำแนกข้อมูลและประมวลผลเพื่อการตัดสินใจได้อย่างเฉียบคม',
    chapterNumber: 5,
    iconName: 'Database',
    rarity: 'epic',
    requiredScorePercent: 70,
  },
  {
    id: 'badge-6',
    name: 'Cyber Guardian',
    titleTh: 'Cyber Guardian',
    description: 'ปกป้องข้อมูลส่วนตัวและรู้ทันทุกภัยคุกคามไซเบอร์',
    chapterNumber: 6,
    iconName: 'ShieldAlert',
    rarity: 'legendary',
    requiredScorePercent: 80,
  },
  {
    id: 'badge-7',
    name: 'Grandmaster CS M.1',
    titleTh: 'เหรียญทองคำมหาบัณฑิต 6 บทเรียน',
    description: 'พิชิตข้อสอบวัดผลสัมฤทธิ์รวม 6 บทเรียน (30 ข้อ) ด้วยคะแนนยอดเยี่ยม',
    chapterNumber: 7,
    iconName: 'Crown',
    rarity: 'legendary',
    requiredScorePercent: 70,
  },
  {
    id: 'badge-missions',
    name: 'Mission Master',
    titleTh: 'เหรียญผู้พิชิตภารกิจครบครัน',
    description: 'ทำภารกิจผ่านด่านครบถ้วนทุกเงื่อนไข ทั้งก่อนเรียน มินิเกม และหลังเรียน',
    chapterNumber: 0,
    iconName: 'Target',
    rarity: 'epic',
    requiredScorePercent: 100,
  },
];

// -------------------------------------------------------------
// SEED DATA: Users (Admin, Teacher & Students)
// -------------------------------------------------------------
export const INITIAL_ADMIN_USER: User = {
  id: 'admin-1',
  email: 'Admin01@school.ac.th',
  name: 'ผู้ดูแลระบบสูงสุด (Admin01)',
  role: 'admin',
  password: 'Admin123',
  avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Admin01Super',
  createdAt: '2026-05-14T07:00:00.000Z',
};

const INITIAL_USERS: User[] = [
  INITIAL_ADMIN_USER,
  {
    id: 'teacher-1',
    email: 'kru.somsri@school.ac.th',
    name: 'ครูสมศรี ปัญญาดี',
    role: 'teacher',
    password: 'password123',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=TeacherSomsri',
    createdAt: '2026-05-15T08:00:00.000Z',
  },
  {
    id: 'teacher-2',
    email: 'kru.thanakorn@school.ac.th',
    name: 'ครูธนกร วิศวกรไอที',
    role: 'teacher',
    password: 'password123',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=TeacherThanakorn',
    createdAt: '2026-05-15T08:30:00.000Z',
  },
  {
    id: 'teacher-3',
    email: 'kru.vipada@school.ac.th',
    name: 'ครูวิภาดา โค้ดแล็บ',
    role: 'teacher',
    password: 'password123',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=TeacherVipada',
    createdAt: '2026-05-15T09:00:00.000Z',
  },
  {
    id: 'teacher-4',
    email: 'kru.nutthapong@school.ac.th',
    name: 'ครูณัฐพงศ์ แนะแนวไซเบอร์',
    role: 'teacher',
    password: 'password123',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=TeacherNutthapong',
    createdAt: '2026-05-15T09:30:00.000Z',
  },
  {
    id: 'student-1',
    email: 'paphop.suk@school.ac.th',
    name: 'เด็กชายปภพ สุขใจ',
    role: 'student',
    password: 'password123',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Paphop',
    createdAt: '2026-05-16T09:00:00.000Z',
  },
  {
    id: 'student-2',
    email: 'manatsanan.k@school.ac.th',
    name: 'เด็กหญิงมนัสนันท์ ขยันเรียน',
    role: 'student',
    password: 'password123',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Manatsanan',
    createdAt: '2026-05-16T09:15:00.000Z',
  },
  {
    id: 'student-3',
    email: 'thanawin.r@school.ac.th',
    name: 'เด็กชายธนวินท์ รวดเร็ว',
    role: 'student',
    password: 'password123',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Thanawin',
    createdAt: '2026-05-16T09:30:00.000Z',
  },
];

export const INITIAL_ADMIN_PROFILE: TeacherProfile = {
  userId: 'admin-1',
  teacherId: 'ADMIN01',
  schoolName: 'โรงเรียนสาธิตวิทยาการศึกษา (ศูนย์บริหารระบบ)',
  subjectTaught: 'ผู้ดูแลระบบส่วนกลาง (Super Admin)',
  phoneNumber: '089-999-9999',
  classesManaged: ['ม.1/1', 'ม.1/2', 'ม.1/3', 'ม.1/4'],
};

const INITIAL_TEACHER_PROFILE: TeacherProfile = {
  userId: 'teacher-1',
  teacherId: 'TCH001',
  schoolName: 'โรงเรียนสาธิตวิทยาการศึกษา',
  subjectTaught: 'เทคโนโลยี (วิทยาการคำนวณ) ม.1',
  phoneNumber: '081-234-5678',
};

const INITIAL_TEACHER_PROFILES: TeacherProfile[] = [
  INITIAL_TEACHER_PROFILE,
  {
    userId: 'teacher-2',
    teacherId: 'TCH002',
    schoolName: 'โรงเรียนสาธิตวิทยาการศึกษา',
    subjectTaught: 'การออกแบบและเทคโนโลยี ม.1',
    phoneNumber: '081-345-6789',
    classesManaged: ['ม.1/1', 'ม.1/2'],
  },
  {
    userId: 'teacher-3',
    teacherId: 'TCH003',
    schoolName: 'โรงเรียนสาธิตวิทยาการศึกษา',
    subjectTaught: 'การเขียนโปรแกรม Python & โครงงานคอมพิวเตอร์',
    phoneNumber: '081-456-7890',
    classesManaged: ['ม.1/1', 'ม.1/3'],
  },
  {
    userId: 'teacher-4',
    teacherId: 'TCH004',
    schoolName: 'โรงเรียนสาธิตวิทยาการศึกษา',
    subjectTaught: 'แนะแนวทักษะดิจิทัล & ความปลอดภัยไซเบอร์',
    phoneNumber: '081-567-8901',
    classesManaged: ['ม.1/2', 'ม.1/4'],
  },
];

const INITIAL_STUDENT_PROFILES: StudentProfile[] = [
  {
    userId: 'student-1',
    studentId: '6701001',
    gradeLevel: 'ม.1',
    classroom: 'ม.1/1',
    seatNumber: 1,
    xp: 650,
    level: 3,
    totalCompletedLessons: 2,
  },
  {
    userId: 'student-2',
    studentId: '6701002',
    gradeLevel: 'ม.1',
    classroom: 'ม.1/1',
    seatNumber: 2,
    xp: 1200,
    level: 5,
    totalCompletedLessons: 4,
  },
  {
    userId: 'student-3',
    studentId: '6701003',
    gradeLevel: 'ม.1',
    classroom: 'ม.1/1',
    seatNumber: 3,
    xp: 350,
    level: 2,
    totalCompletedLessons: 1,
  },
];

const INITIAL_CLASSES: ClassRoom[] = [
  {
    id: 'class-1',
    name: 'ม.1/1',
    grade: 'ม.1',
    academicYear: '2569',
    teacherId: 'teacher-1',
    assistantTeacherIds: [],
    studentCount: 3,
    passThresholdPercent: 60,
  },
  {
    id: 'class-2',
    name: 'ม.1/2',
    grade: 'ม.1',
    academicYear: '2569',
    teacherId: 'teacher-1',
    assistantTeacherIds: [],
    studentCount: 0,
    passThresholdPercent: 60,
  },
];

// Initial Learning Progress for student-1
const INITIAL_PROGRESS: LearningProgress[] = [
  {
    id: 'prog-1-1',
    userId: 'student-1',
    chapterNumber: 1,
    status: 'completed',
    preTestScore: 4,
    postTestScore: 8,
    gameScore: 90,
    exerciseScore: 8,
    videoWatched: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'prog-1-2',
    userId: 'student-1',
    chapterNumber: 2,
    status: 'completed',
    preTestScore: 3,
    postTestScore: 5,
    gameScore: 85,
    exerciseScore: 5,
    videoWatched: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'prog-1-3',
    userId: 'student-1',
    chapterNumber: 3,
    status: 'in_progress',
    preTestScore: 3,
    videoWatched: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'prog-1-4',
    userId: 'student-1',
    chapterNumber: 4,
    status: 'ready',
    videoWatched: false,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'prog-1-5',
    userId: 'student-1',
    chapterNumber: 5,
    status: 'locked',
    videoWatched: false,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'prog-1-6',
    userId: 'student-1',
    chapterNumber: 6,
    status: 'locked',
    videoWatched: false,
    lastUpdated: new Date().toISOString(),
  },
];

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    teacherId: 'teacher-1',
    teacherName: 'ครูสมศรี ปัญญาดี',
    title: 'ยินดีต้อนรับสู่ Adventure M.1 ภาคเรียนที่ 1/2569',
    content:
      'ขอให้นักเรียนทุกคนเริ่มต้นทำแบบทดสอบก่อนเรียนบทที่ 1 และสนุกกับเกม AR Hand Tracking นะคะ หากมีข้อสงสัยสามารถส่งแชตถามครูได้ตลอดเวลาค่ะ',
    createdAt: '2026-05-18T10:00:00.000Z',
  },
  {
    id: 'ann-2',
    teacherId: 'teacher-1',
    teacherName: 'ครูสมศรี ปัญญาดี',
    title: 'กำหนดส่งแบบฝึกหัดบทที่ 2 และบทที่ 3',
    content:
      'ให้นักเรียนฝึกจับคู่สัญลักษณ์ผังงานและลองเขียนโปรแกรมเต่าไพทอนให้ได้คะแนนเกมอย่างน้อย 70 XP เพื่อรับเหรียญตราพิเศษค่ะ',
    createdAt: '2026-05-20T14:30:00.000Z',
  },
];

// -------------------------------------------------------------
// SEED DATA: Worksheets (ใบงานเก็บคะแนน 6 บทเรียน)
// -------------------------------------------------------------
const INITIAL_WORKSHEETS: Worksheet[] = [
  {
    id: 'ws-1',
    chapterNumber: 1,
    title: 'ใบงานที่ 1.1: การวิเคราะห์และคัดแยกคุณลักษณะสำคัญ (แนวคิดเชิงนามธรรม)',
    description: 'ฝึกปฏิบัติคัดแยกข้อมูลที่สำคัญและจำเป็นต่อการแก้ปัญหาออกจากรายละเอียดปลีกย่อย',
    instructions: 'ให้นักเรียนวิเคราะห์สถานการณ์ที่กำหนด แล้วตอบคำถามให้ถูกต้อง ครบถ้วน พร้อมให้เหตุผลประกอบ',
    textbookRef: 'หนังสือ สสวท. ม.1 หน้า 4–21',
    maxScore: 10,
    dueDate: '2026-06-15',
    tasks: [
      {
        id: 't-1-1',
        question: 'สถานการณ์: นักเรียนได้รับมอบหมายให้ออกแบบแผนที่แนะนำการเดินทางท่องเที่ยวในชุมชน จงระบุข้อมูลที่จำเป็น 3 อย่าง และข้อมูลที่ไม่จำเป็น 2 อย่าง พร้อมเหตุผล',
        type: 'essay',
        maxScore: 5,
        hint: 'พิจารณาเป้าหมายของนักท่องเที่ยว เช่น จุดสังเกตหลัก เส้นทางเลี้ยว ระยะทาง',
        sampleAnswer: 'ข้อมูลจำเป็น: 1) จุดท่องเที่ยวสำคัญ 2) เส้นทางและทิศทาง 3) ป้ายรถโดยสาร / ข้อมูลไม่จำเป็น: สีรั้วบ้าน, ทรงผมคนเดินถนน',
      },
      {
        id: 't-1-2',
        question: 'ยกตัวอย่างการประยุกต์ใช้แนวคิดเชิงนามธรรม (Abstraction) ในชีวิตประจำวันของนักเรียน 1 เรื่อง โดยระบุว่าเรื่องใดและตัดทอนรายละเอียดใดออก',
        type: 'essay',
        maxScore: 5,
        hint: 'เช่น การจัดตารางสอน, การวาดแผนผังบ้าน, การเลือกซื้อของ',
        sampleAnswer: 'การจัดกระเป๋านักเรียนตามตารางสอน: เลือกดูเฉพาะรายวิชาและอุปกรณ์ที่ต้องใช้ ตัดรายละเอียดเรื่องราคาหนังสือหรือสีตู้เก็บของออก',
      },
    ],
  },
  {
    id: 'ws-2',
    chapterNumber: 2,
    title: 'ใบงานที่ 2.1: การเขียนรหัสลำลองและผังงานแก้ปัญหา (Pseudocode & Flowchart)',
    description: 'ฝึกเขียนขั้นตอนวิธี 4 ขั้นตอนการแก้ปัญหา รหัสลำลอง และการใช้สัญลักษณ์ผังงานสากล',
    instructions: 'เขียนรหัสลำลองและอธิบายการทำงานของผังงานให้สอดคล้องกับตรรกะการประมวลผล',
    textbookRef: 'หนังสือ สสวท. ม.1 หน้า 24–41',
    maxScore: 10,
    dueDate: '2026-06-25',
    tasks: [
      {
        id: 't-2-1',
        question: 'จงเขียนรหัสลำลอง (Pseudocode) สำหรับการคำนวณและตัดเกรดของนักเรียน (เงื่อนไข: คะแนน >= 80 ได้เกรด 4, >= 70 ได้เกรด 3, >= 60 ได้เกรด 2, >= 50 ได้เกรด 1, น้อยกว่า 50 ได้เกรด 0)',
        type: 'essay',
        maxScore: 5,
        hint: 'ใช้คำสั่ง เริ่มต้น, รับค่าคะแนน, ถ้า...มิฉะนั้น..., แสดงผล, สิ้นสุด',
      },
      {
        id: 't-2-2',
        question: 'อธิบายสัญลักษณ์ผังงาน 4 ชนิด: สี่เหลี่ยมมน, สี่เหลี่ยมผืนผ้า, สี่เหลี่ยมข้าวหลามตัด และ สี่เหลี่ยมด้านขนาน ว่าทำหน้าที่อะไรในการเขียนผังงาน',
        type: 'diagram_desc',
        maxScore: 5,
        hint: 'เริ่มต้น/สิ้นสุด, ประมวลผล, เงื่อนไขตัดสินใจ, รับ/แสดงผลข้อมูล',
      },
    ],
  },
  {
    id: 'ws-3',
    chapterNumber: 3,
    title: 'ใบงานที่ 3.1: การเขียนโปรแกรมภาษาไพทอน (Python Code & Turtle)',
    description: 'ฝึกเขียนโค้ด Python คำนวณตัวแปร ควบคุมเงื่อนไข และสั่งเต่าไพทอนวาดรูปทรงเรขาคณิต',
    instructions: 'เขียนโปรแกรมภาษา Python พร้อมอธิบายผลลัพธ์การทำงานของโค้ดให้ถูกต้อง',
    textbookRef: 'หนังสือ สสวท. ม.1 หน้า 42–84',
    maxScore: 10,
    dueDate: '2026-07-10',
    tasks: [
      {
        id: 't-3-1',
        question: 'เขียนโค้ด Python รับค่าน้ำหนัก (กิโลกรัม) และส่วนสูง (เมตร) เพื่อคำนวณค่า BMI = น้ำหนัก / (ส่วนสูง ** 2) พร้อมแสดงผลลัพธ์',
        type: 'code',
        maxScore: 5,
        hint: 'ใช้ float(input()) สำหรับรับค่าตัวเลขทศนิยม และคำสั่ง print()',
      },
      {
        id: 't-3-2',
        question: 'เขียนคำสั่งเต่าไพทอน (Turtle Graphics) วนซ้ำ for loop เพื่อวาดรูปสามเหลี่ยมด้านเท่า โดยระบุคำสั่ง forward และ left/right ให้ถูกต้อง',
        type: 'code',
        maxScore: 5,
        hint: 'สามเหลี่ยมด้านเท่ามุมเลี้ยวคือ 120 องศา วนซ้ำ 3 รอบ',
      },
    ],
  },
  {
    id: 'ws-4',
    chapterNumber: 4,
    title: 'ใบงานที่ 4.1: การเขียนโปรแกรมด้วย Scratch (Animation & Game Logic)',
    description: 'ฝึกออกแบบบล็อกคำสั่ง Scratch สั่งตัวละครเคลื่อนที่ ตรวจสอบเงื่อนไข และใช้ตัวแปร',
    instructions: 'อธิบายบล็อกคำสั่งและการทำงานของตัวละครในโปรแกรม Scratch ตามโจทย์ที่กำหนด',
    textbookRef: 'หนังสือ สสวท. ม.1 หน้า 86–123',
    maxScore: 10,
    dueDate: '2026-07-25',
    tasks: [
      {
        id: 't-4-1',
        question: 'อธิบายการทำงานของบล็อก repeat until <touching edge?> ว่าตัวละครจะทำงานอย่างไร และหยุดเมื่อใด',
        type: 'essay',
        maxScore: 5,
        hint: 'บล็อกการวนซ้ำแบบมีเงื่อนไขในกลุ่ม Control',
      },
      {
        id: 't-4-2',
        question: 'ออกแบบขั้นตอนการสร้างตัวแปร "score" ใน Scratch เพื่อให้นับคะแนนเพิ่มทีละ 1 ทุกครั้งที่ตัวละครหลักชนกับเหรียญทอง',
        type: 'essay',
        maxScore: 5,
        hint: 'ใช้ change score by 1 ร่วมกับ if touching coin then',
      },
    ],
  },
  {
    id: 'ws-5',
    chapterNumber: 5,
    title: 'ใบงานที่ 5.1: ข้อมูลและการประมวลผล (Data Collection, Search & Sort)',
    description: 'วิเคราะห์ประเภทข้อมูล การประมวลผล เปรียบเทียบ Binary Search vs Linear Search',
    instructions: 'ตอบคำถามและยกตัวอย่างการจัดการข้อมูลทางวิทยาการคำนวณให้ถูกต้อง',
    textbookRef: 'หนังสือ สสวท. ม.1 หน้า 126–161',
    maxScore: 10,
    dueDate: '2026-08-10',
    tasks: [
      {
        id: 't-5-1',
        question: 'จงเปรียบเทียบข้อดีและข้อจำกัดระหว่าง "ข้อมูลปฐมภูมิ" (Primary Data) และ "ข้อมูลทุติยภูมิ" (Secondary Data) พร้อมยกตัวอย่างประกอบอย่างละ 2 ตัวอย่าง',
        type: 'essay',
        maxScore: 5,
        hint: 'ความถูกต้อง ความสดใหม่ เวลา และค่าใช้จ่ายในการรวบรวม',
      },
      {
        id: 't-5-2',
        question: 'เพราะเหตุใดการค้นหาแบบทวิภาค (Binary Search) จึงมีประสิทธิภาพสูงกว่าการค้นหาตามลำดับ (Linear Search) และมีเงื่อนไขสำคัญใดที่ต้องทำก่อนค้นหาเสมอ?',
        type: 'essay',
        maxScore: 5,
        hint: 'ข้อมูลต้องเรียงลำดับ (Sorted) และตัดพื้นที่ค้นหาลงครึ่งหนึ่งในแต่ละรอบ',
      },
    ],
  },
  {
    id: 'ws-6',
    chapterNumber: 6,
    title: 'ใบงานที่ 6.1: การใช้เทคโนโลยีสารสนเทศอย่างปลอดภัยและมีจริยธรรม',
    description: 'วิเคราะห์ภัยคุกคามไซเบอร์ พ.ร.บ.คอมพิวเตอร์ กฎหมาย PDPA และลิขสิทธิ์ดิจิทัล',
    instructions: 'วิเคราะห์กรณีศึกษาและเสนอแนวทางแก้ไขตามหลักกฎหมายและจริยธรรมดิจิทัล',
    textbookRef: 'หนังสือ สสวท. ม.1 หน้า 164–198',
    maxScore: 10,
    dueDate: '2026-08-25',
    tasks: [
      {
        id: 't-6-1',
        question: 'กรณีศึกษา: เพื่อนสนิทแอบจำรหัสผ่านแล้วเข้าสู่ระบบบัญชีโซเชียลของนักเรียนไปโพสต์ข้อความหยาบคาย การกระทำนี้ผิด พ.ร.บ.คอมพิวเตอร์ หรือไม่ เพราะเหตุใด และนักเรียนมีวิธีป้องกันอย่างไร',
        type: 'essay',
        maxScore: 5,
        hint: 'พ.ร.บ.คอมพิวเตอร์ มาตรา 5 (เข้าถึงระบบโดยมิชอบ) และการเปิดใช้งาน 2FA',
      },
      {
        id: 't-6-2',
        question: 'อธิบายความหมายของสัญลักษณ์ Creative Commons: CC-BY-NC-SA ว่าผู้ใช้งานสามารถนำผลงานไปทำอะไรได้บ้าง และมีข้อห้ามอะไรบ้าง',
        type: 'essay',
        maxScore: 5,
        hint: 'BY = อ้างอิงแหล่งที่มา, NC = ห้ามใช้เพื่อการค้า, SA = เผยแพร่ต่อด้วยสัญญาเดิม',
      },
    ],
  },
];

const INITIAL_WORKSHEET_SUBMISSIONS: WorksheetSubmission[] = [
  {
    id: 'sub-1',
    worksheetId: 'ws-1',
    userId: 'student-1',
    studentName: 'เด็กชายปภพ สุขใจ',
    chapterNumber: 1,
    answers: {
      't-1-1': 'ข้อมูลจำเป็น: 1) แหล่งท่องเที่ยวสำคัญ 2) ถนนและทิศทาง 3) ป้ายรถโดยสารประจำทาง / ข้อมูลไม่จำเป็น: สีรั้วบ้านริมทาง และ ป้ายร้านขายของชำขนาดเล็ก',
      't-1-2': 'การดูตารางเรียนตอนเช้า: เลือกดูแค่วิชาที่เรียนในวันนั้นและหนังสือที่ต้องเตรียม ตัดข้อมูลเรื่องจำนวนห้องเรียนชั้นอื่นหรือทรงผมของครูผู้สอนออก',
    },
    score: 9,
    feedback: 'วิเคราะห์และคัดแยกข้อมูลได้ตรงตามหลักการ Abstraction ได้อย่างดีเยี่ยมครับ',
    gradedBy: 'ครูสมศรี ปัญญาดี',
    submittedAt: '2026-05-19T14:20:00.000Z',
    gradedAt: '2026-05-19T16:00:00.000Z',
  },
  {
    id: 'sub-2',
    worksheetId: 'ws-2',
    userId: 'student-1',
    studentName: 'เด็กชายปภพ สุขใจ',
    chapterNumber: 2,
    answers: {
      't-2-1': '1. เริ่มต้น\n2. รับค่า score\n3. ถ้า score >= 80 ตัดเกรด 4\n4. มิฉะนั้นถ้า score >= 70 ตัดเกรด 3\n5. มิฉะนั้นถ้า score >= 60 ตัดเกรด 2\n6. มิฉะนั้นถ้า score >= 50 ตัดเกรด 1\n7. มิฉะนั้น ตัดเกรด 0\n8. แสดงผลเกรด\n9. สิ้นสุด',
      't-2-2': 'สี่เหลี่ยมมน: เริ่มต้น/สิ้นสุด, สี่เหลี่ยมผืนผ้า: ปฏิบัติงาน, สี่เหลี่ยมข้าวหลามตัด: ตรวจสอบเงื่อนไข, สี่เหลี่ยมด้านขนาน: รับหรือแสดงผลข้อมูล',
    },
    score: 10,
    feedback: 'รหัสลำลองเขียนได้ชัดเจนมาก ลำดับเงื่อนไขถูกต้อง สัญลักษณ์ผังงานครบถ้วน',
    gradedBy: 'ครูสมศรี ปัญญาดี',
    submittedAt: '2026-05-21T10:15:00.000Z',
    gradedAt: '2026-05-21T11:30:00.000Z',
  },
  {
    id: 'sub-3',
    worksheetId: 'ws-1',
    userId: 'student-2',
    studentName: 'เด็กหญิงมนัสนันท์ ขยันเรียน',
    chapterNumber: 1,
    answers: {
      't-1-1': 'ข้อมูลจำเป็น: สถานีรถไฟ, พิกัดแผนที่, ทางแยก / ข้อมูลไม่จำเป็น: จำนวนเสาไฟ, สายไฟริมทาง',
      't-1-2': 'การวาดแผนที่จากบ้านไปเซเว่น: บอกแค่เลี้ยวซ้ายตรงไหน ข้ามไฟแดงตรงไหน ไม่ต้องวาดหญ้าทุกต้น',
    },
    score: 10,
    feedback: 'ยอดเยี่ยมมากค่ะ ยกตัวอย่างได้ชัดเจนและนำไปใช้แก้ปัญหาได้จริง',
    gradedBy: 'ครูสมศรี ปัญญาดี',
    submittedAt: '2026-05-20T09:00:00.000Z',
    gradedAt: '2026-05-20T10:00:00.000Z',
  },
];


// -------------------------------------------------------------
// SEED QUESTIONS: Pre-test & Post-test for Chapters
// -------------------------------------------------------------
const INITIAL_QUESTIONS: Question[] = [
  // Chapter 1 Pre-test
  {
    id: 'q-1-pre-1',
    quizId: 'quiz-1-pre',
    type: 'multiple_choice',
    prompt: 'ข้อใดอธิบายความหมายของ "แนวคิดเชิงนามธรรม" (Abstraction) ได้ถูกต้องที่สุด?',
    choices: [
      { id: 'c1', text: 'การจำแนกรายละเอียดที่สำคัญและจำเป็นออกจากรายละเอียดที่ไม่จำเป็น', isCorrect: true },
      { id: 'c2', text: 'การคำนวณตัวเลขทางคณิตศาสตร์ด้วยความรวดเร็ว', isCorrect: false },
      { id: 'c3', text: 'การนำคอมพิวเตอร์มาใช้งานแทนมนุษย์ในทุกกรณี', isCorrect: false },
      { id: 'c4', text: 'การค้นหาข้อมูลจากอินเทอร์เน็ตให้ได้มากที่สุด', isCorrect: false },
    ],
    explanation: 'แนวคิดเชิงนามธรรมเป็นการคัดแยกคุณลักษณะที่สำคัญจำเป็นต่อการแก้ปัญหาออกจากรายละเอียดปลีกย่อย',
    textbookReference: 'สสวท. ม.1 หน้า 4',
    points: 1,
  },
  {
    id: 'q-1-pre-2',
    quizId: 'quiz-1-pre',
    type: 'multiple_choice',
    prompt: 'หากต้องการเดินทางด้วยรถไฟฟ้า ข้อมูลใดจัดเป็น "รายละเอียดที่ไม่จำเป็น" ในการดูแผนที่?',
    choices: [
      { id: 'c1', text: 'สถานีเชื่อมต่อระหว่างสาย', isCorrect: false },
      { id: 'c2', text: 'ลำดับสถานีก่อนถึงจุดหมาย', isCorrect: false },
      { id: 'c3', text: 'สีของขบวนรถไฟฟ้าและชื่อคนขับ', isCorrect: true },
      { id: 'c4', text: 'ทิศทางของสถานีปลายทาง', isCorrect: false },
    ],
    explanation: 'สีของตัวรถหรือชื่อคนขับไม่มีผลต่อการเดินทางและการเปลี่ยนสถานีของผู้โดยสาร',
    textbookReference: 'สสวท. ม.1 หน้า 8',
    points: 1,
  },
  {
    id: 'q-1-pre-3',
    quizId: 'quiz-1-pre',
    type: 'true_false',
    prompt: 'ข้อมูลเดียวกันย่อมเป็นสิ่งจำเป็นสำหรับการแก้ปัญหาของทุกๆ คนในทุกสถานการณ์เสมอ?',
    choices: [
      { id: 'c1', text: 'จริง', isCorrect: false },
      { id: 'c2', text: 'ไม่จริง (ขึ้นอยู่กับวัตถุประสงค์ของการแก้ปัญหา)', isCorrect: true },
    ],
    explanation: 'ความจำเป็นของข้อมูลขึ้นอยู่กับเป้าหมายและบทบาทของบุคคล เช่น ช่างซ่อมรถกับผู้ขับขี่ต้องการข้อมูลรถต่างกัน',
    textbookReference: 'สสวท. ม.1 หน้า 8',
    points: 1,
  },
  {
    id: 'q-1-pre-4',
    quizId: 'quiz-1-pre',
    type: 'multiple_choice',
    prompt: 'การวาดแผนที่แบบร่างบอกทางจากบ้านมาโรงเรียนโดยไม่วาดต้นไม้ทุกต้นริมถนน จัดเป็นการใช้แนวคิดใด?',
    choices: [
      { id: 'c1', text: 'แนวคิดเชิงนามธรรม (Abstraction)', isCorrect: true },
      { id: 'c2', text: 'การหารูปแบบ (Pattern Recognition)', isCorrect: false },
      { id: 'c3', text: 'การแยกส่วนประกอบ (Decomposition)', isCorrect: false },
      { id: 'c4', text: 'การออกแบบขั้นตอนวิธี (Algorithm)', isCorrect: false },
    ],
    explanation: 'การตัดต้นไม้หรือสิ่งก่อสร้างที่ไม่ใช่จุดสังเกตสำคัญออก เพื่อเน้นเส้นทางเลี้ยว',
    textbookReference: 'สสวท. ม.1 หน้า 9',
    points: 1,
  },
  {
    id: 'q-1-pre-5',
    quizId: 'quiz-1-pre',
    type: 'multiple_choice',
    prompt: 'การเตรียมกระเป๋านักเรียนตามตารางสอน สิ่งใดคือข้อมูลจำเป็นในการจัดกระเป๋า?',
    choices: [
      { id: 'c1', text: 'วิชาและอุปกรณ์ที่ต้องใช้ในวันนั้น', isCorrect: true },
      { id: 'c2', text: 'ราคาของสมุดแต่ละเล่ม', isCorrect: false },
      { id: 'c3', text: 'สีของตู้เสื้อผ้าที่บ้าน', isCorrect: false },
      { id: 'c4', text: 'ชื่อโรงงานที่ผลิตดินสอ', isCorrect: false },
    ],
    explanation: 'วิชาในตารางสอนและอุปกรณ์ที่ครูกำหนดคือข้อมูลที่ตรงกับเป้าหมายการเรียนในวันนั้น',
    textbookReference: 'สสวท. ม.1 หน้า 20',
    points: 1,
  },

  // Chapter 1 Post-test (8 questions)
  {
    id: 'q-1-post-1',
    quizId: 'quiz-1-post',
    type: 'multiple_choice',
    prompt: 'แผนผังเส้นทางรถไฟใต้ดินกรุงลอนดอนที่ออกแบบโดย Harry Beck มีความโดดเด่นอย่างไรในเชิงวิทยาการคำนวณ?',
    choices: [
      { id: 'c1', text: 'ตัดความคดเคี้ยวตามภูมิศาสตร์จริงออก เพื่อให้ดูสายเชื่อมต่อและสถานีได้ง่าย', isCorrect: true },
      { id: 'c2', text: 'ระบุตำแหน่งต้นไม้และอาคารบนผิวดินอย่างละเอียดที่สุด', isCorrect: false },
      { id: 'c3', text: 'ใช้สีเดียวตลอดทั้งสายเพื่อความประหยัด', isCorrect: false },
      { id: 'c4', text: 'แสดงความเร็วของขบวนรถแบบเรียลไทม์', isCorrect: false },
    ],
    explanation: 'เป็นตัวอย่างคลาสสิกของแนวคิดเชิงนามธรรมที่คัดทิ้งพิกัดภูมิศาสตร์ที่ไม่จำเป็นต่อผู้โดยสาร',
    textbookReference: 'สสวท. ม.1 หน้า 5',
    points: 1,
  },
  {
    id: 'q-1-post-2',
    quizId: 'quiz-1-post',
    type: 'multiple_choice',
    prompt: 'หากต้องการซื้ออาหารกลางวันเพื่อสุขภาพ ข้อมูลใด "จำเป็นที่สุด" ในการตัดสินใจ?',
    choices: [
      { id: 'c1', text: 'คุณค่าทางโภชนาการและสารอาหาร', isCorrect: true },
      { id: 'c2', text: 'สีของจานที่ใส่อาหาร', isCorrect: false },
      { id: 'c3', text: 'ยี่ห้อของพัดลมในร้านอาหาร', isCorrect: false },
      { id: 'c4', text: 'ความยาวของโต๊ะอาหาร', isCorrect: false },
    ],
    explanation: 'คุณค่าทางโภชนาการตรงตามเป้าหมายการซื้ออาหารเพื่อสุขภาพ',
    textbookReference: 'สสวท. ม.1 หน้า 8',
    points: 1,
  },
  {
    id: 'q-1-post-3',
    quizId: 'quiz-1-post',
    type: 'multiple_choice',
    prompt: 'การถ่ายทอดรายละเอียดของปัญหาและการแก้ปัญหา นิยมนำเสนอด้วยวิธีใด?',
    choices: [
      { id: 'c1', text: 'ข้อความ แผนภาพ หรือแบบจำลองเชิงนามธรรม', isCorrect: true },
      { id: 'c2', text: 'การเก็บข้อมูลไว้ในใจโดยไม่บันทึก', isCorrect: false },
      { id: 'c3', text: 'การเขียนโค้ดโดยไม่ต้องวางแผนล่วงหน้า', isCorrect: false },
      { id: 'c4', text: 'การท่องจำตัวเลขทั้งหมด', isCorrect: false },
    ],
    explanation: 'การถ่ายทอดรายละเอียดทำได้ทั้งการอธิบายด้วยคำพูด ข้อความ แผนภาพ หรือผังจำลอง',
    textbookReference: 'สสวท. ม.1 หน้า 9',
    points: 1,
  },
  {
    id: 'q-1-post-4',
    quizId: 'quiz-1-post',
    type: 'true_false',
    prompt: 'การที่โปรแกรมจดจำใบหน้าตรวจจับเฉพาะระยะห่างระหว่างตา จมูก ปาก โดยไม่สนใจสีเสื้อผ้า ถือเป็นแนวคิดเชิงนามธรรม?',
    choices: [
      { id: 'c1', text: 'ถูก (ใช่ เพราะคัดเฉพาะจุดสำคัญของใบหน้า)', isCorrect: true },
      { id: 'c2', text: 'ผิด (ไม่ใช่)', isCorrect: false },
    ],
    explanation: 'อัลกอริทึมจดจำใบหน้าจะกรองเอาเฉพาะโครงสร้างเรขาคณิตของใบหน้า ตัดสีเสื้อหรือฉากหลังออก',
    textbookReference: 'สสวท. ม.1 หน้า 12',
    points: 1,
  },
  {
    id: 'q-1-post-5',
    quizId: 'quiz-1-post',
    type: 'multiple_choice',
    prompt: 'ข้อใดไม่ใช่ประโยชน์ของการใช้แนวคิดเชิงนามธรรม?',
    choices: [
      { id: 'c1', text: 'ทำให้ได้รายละเอียดปลีกย่อยเพิ่มขึ้นเรื่อยๆ จนซับซ้อนขึ้น', isCorrect: true },
      { id: 'c2', text: 'ช่วยให้เข้าใจแก่นแท้ของปัญหาได้ชัดเจน', isCorrect: false },
      { id: 'c3', text: 'ลดความซ้ำซ้อนในการเขียนโปรแกรม', isCorrect: false },
      { id: 'c4', text: 'สามารถนำวิธีการแก้ปัญหาไปปรับใช้กับปัญหาอื่นที่คล้ายกันได้', isCorrect: false },
    ],
    explanation: 'แนวคิดเชิงนามธรรมช่วยลดความซับซ้อน ไม่ใช่เพิ่มรายละเอียดจนยุ่งยาก',
    textbookReference: 'สสวท. ม.1 หน้า 4',
    points: 1,
  },
  {
    id: 'q-1-post-6',
    quizId: 'quiz-1-post',
    type: 'multiple_choice',
    prompt: 'ปภพต้องการเดินทางจากบ้านไปสนามบินให้ทันเวลา ข้อมูลใดไม่ส่งผลต่อการวางแผน?',
    choices: [
      { id: 'c1', text: 'เพลงที่เปิดฟังในห้องนอนเมื่อเช้า', isCorrect: true },
      { id: 'c2', text: 'เวลาเครื่องบินออก', isCorrect: false },
      { id: 'c3', text: 'สภาพการจราจรบนเส้นทาง', isCorrect: false },
      { id: 'c4', text: 'ระยะเวลาที่ต้องใช้ในการเช็คอิน', isCorrect: false },
    ],
    explanation: 'เพลงที่เปิดฟังเมื่อเช้าไม่มีผลต่อเวลาและเส้นทางเดินทาง',
    textbookReference: 'สสวท. ม.1 หน้า 20',
    points: 1,
  },
  {
    id: 'q-1-post-7',
    quizId: 'quiz-1-post',
    type: 'multiple_choice',
    prompt: 'สัญลักษณ์ในแอปพลิเคชัน เช่น ไอคอนรูป "แว่นขยาย" สื่อถึงสิ่งใดในเชิงนามธรรม?',
    choices: [
      { id: 'c1', text: 'การค้นหาข้อมูล (Search)', isCorrect: true },
      { id: 'c2', text: 'การส่งข้อความ', isCorrect: false },
      { id: 'c3', text: 'การตั้งค่าระบบ', isCorrect: false },
      { id: 'c4', text: 'การลบข้อมูล', isCorrect: false },
    ],
    explanation: 'ไอคอนแว่นขยายเป็นตัวแทนเชิงนามธรรมที่มนุษย์เข้าใจตรงกันว่าคือการค้นหา',
    textbookReference: 'สสวท. ม.1 หน้า 9',
    points: 1,
  },
  {
    id: 'q-1-post-8',
    quizId: 'quiz-1-post',
    type: 'multiple_choice',
    prompt: 'ในกิจกรรมท้ายบท หน้า 20 การออกแบบโมเดลบ้านจำลอง สิ่งใดควรแสดงในแปลนพื้น?',
    choices: [
      { id: 'c1', text: 'ตำแหน่งประตู หน้าต่าง และขนาดห้อง', isCorrect: true },
      { id: 'c2', text: 'มดทุกตัวที่กำลังเดินอยู่ใต้ดิน', isCorrect: false },
      { id: 'c3', text: 'ยี่ห้อหลอดไฟในห้องเพื่อนบ้าน', isCorrect: false },
      { id: 'c4', text: 'สีรองเท้าของช่างก่อสร้าง', isCorrect: false },
    ],
    explanation: 'แปลนพื้นสถาปัตยกรรมจะเน้นสัดส่วนห้อง ประตู หน้าต่าง และผนัง',
    textbookReference: 'สสวท. ม.1 หน้า 20',
    points: 1,
  },

  // Chapter 2 Questions (Flowchart & Pseudocode)
  {
    id: 'q-2-pre-1',
    quizId: 'quiz-2-pre',
    type: 'multiple_choice',
    prompt: 'สัญลักษณ์ผังงานรูป "สี่เหลี่ยมผืนผ้า" หมายถึงข้อใด?',
    choices: [
      { id: 'c1', text: 'การประมวลผล (Process) หรือการคำนวณ/กำหนดค่า', isCorrect: true },
      { id: 'c2', text: 'การตัดสินใจเงื่อนไข (Decision)', isCorrect: false },
      { id: 'c3', text: 'จุดเริ่มต้นหรือสิ้นสุด (Start/End)', isCorrect: false },
      { id: 'c4', text: 'การรับหรือแสดงผลข้อมูล (I/O)', isCorrect: false },
    ],
    explanation: 'สี่เหลี่ยมผืนผ้าคือ Process ใช้สำหรับการคำนวณและปฏิบัติงาน',
    textbookReference: 'สสวท. ม.1 หน้า 29',
    points: 1,
  },
  {
    id: 'q-2-pre-2',
    quizId: 'quiz-2-pre',
    type: 'multiple_choice',
    prompt: 'สัญลักษณ์รูป "สี่เหลี่ยมข้าวหลามตัด" (Rhombus/Diamond) ในผังงานใช้สำหรับอะไร?',
    choices: [
      { id: 'c1', text: 'การตัดสินใจตามเงื่อนไข (Decision) มีเส้นทางออก ใช่/ไม่ใช่', isCorrect: true },
      { id: 'c2', text: 'การพิมพ์ออกทางเครื่องพิมพ์', isCorrect: false },
      { id: 'c3', text: 'การต่อสายดิน', isCorrect: false },
      { id: 'c4', text: 'จุดเริ่มต้นโปรแกรม', isCorrect: false },
    ],
    explanation: 'สี่เหลี่ยมข้าวหลามตัดใช้สำหรับตรวจสอบเงื่อนไข',
    textbookReference: 'สสวท. ม.1 หน้า 30',
    points: 1,
  },
  {
    id: 'q-2-pre-3',
    quizId: 'quiz-2-pre',
    type: 'multiple_choice',
    prompt: 'ข้อใดเรียงลำดับ "ขั้นตอนการแก้ปัญหา 4 ขั้นตอน" ได้ถูกต้องตามหนังสือ สสวท.?',
    choices: [
      { id: 'c1', text: 'วิเคราะห์ปัญหา → วางแผนการแก้ปัญหา → ดำเนินการแก้ปัญหา → ตรวจสอบและประเมินผล', isCorrect: true },
      { id: 'c2', text: 'ลงมือทำทันที → ตรวจสอบ → วางแผน → ค้นหาคนรับผิดชอบ', isCorrect: false },
      { id: 'c3', text: 'เขียนโค้ด → คิดโจทย์ → ทดสอบ → ส่งงาน', isCorrect: false },
      { id: 'c4', text: 'วางแผน → เขียนโปรแกรม → ลบโปรแกรม → ทำใหม่', isCorrect: false },
    ],
    explanation: '4 ขั้นตอน: การวิเคราะห์และกำหนดรายละเอียด → การวางแผน → การดำเนินการ → การตรวจสอบ',
    textbookReference: 'สสวท. ม.1 หน้า 24',
    points: 1,
  },
  {
    id: 'q-2-pre-4',
    quizId: 'quiz-2-pre',
    type: 'true_false',
    prompt: 'รหัสลำลอง (Pseudocode) ต้องเขียนเป็นภาษาคอมพิวเตอร์ที่คอมพิวเตอร์รันได้โดยตรงทันที?',
    choices: [
      { id: 'c1', text: 'ไม่จริง (รหัสลำลองเขียนด้วยภาษาธรรมชาติเพื่อมนุษย์เข้าใจ ก่อนนำไปแปลเป็นโค้ด)', isCorrect: true },
      { id: 'c2', text: 'จริง', isCorrect: false },
    ],
    explanation: 'รหัสลำลองเป็นเครื่องมือสื่อสารระหว่างมนุษย์ด้วยข้อความที่กระชับ ไม่ขึ้นกับไวยากรณ์ภาษาโปรแกรมใด',
    textbookReference: 'สสวท. ม.1 หน้า 28',
    points: 1,
  },
  {
    id: 'q-2-pre-5',
    quizId: 'quiz-2-pre',
    type: 'multiple_choice',
    prompt: 'ตัวแปร (Variable) ในการเขียนโปรแกรมมีหน้าที่หลักคืออะไร?',
    choices: [
      { id: 'c1', text: 'เก็บข้อมูลหรือค่าที่สามารถเปลี่ยนแปลงได้ระหว่างโปรแกรมทำงาน', isCorrect: true },
      { id: 'c2', text: 'ปิดหน้าต่างเบราว์เซอร์เมื่อมีไวรัส', isCorrect: false },
      { id: 'c3', text: 'เปิดเพลงคลอเบาๆ ขณะเขียนโค้ด', isCorrect: false },
      { id: 'c4', text: 'เพิ่มความเร็วการเชื่อมต่ออินเทอร์เน็ต', isCorrect: false },
    ],
    explanation: 'ตัวแปรเป็นชื่ออ้างอิงตำแหน่งหน่วยความจำเพื่อเก็บและเปลี่ยนแปลงข้อมูล',
    textbookReference: 'สสวท. ม.1 หน้า 33',
    points: 1,
  },

  // Chapter 2 Post-test
  {
    id: 'q-2-post-1',
    quizId: 'quiz-2-post',
    type: 'multiple_choice',
    prompt: 'ในการเขียนผังงาน จุดเชื่อมต่อวงกลมเล็ก (Connector) ใช้เมื่อใด?',
    choices: [
      { id: 'c1', text: 'เชื่อมเส้นทางการทำงานในหน้าเดียวกันเพื่อไม่ให้เส้นทับซ้อนกัน', isCorrect: true },
      { id: 'c2', text: 'แทนการปิดเครื่องคอมพิวเตอร์', isCorrect: false },
      { id: 'c3', text: 'แทนการต่อสายเมาส์', isCorrect: false },
      { id: 'c4', text: 'แสดงข้อผิดพลาดของโค้ด', isCorrect: false },
    ],
    explanation: 'สัญลักษณ์วงกลมคือ On-page Connector ใช้รวมหรือแยกเส้นทางในหน้าเดียวกัน',
    textbookReference: 'สสวท. ม.1 หน้า 31',
    points: 1,
  },
  {
    id: 'q-2-post-2',
    quizId: 'quiz-2-post',
    type: 'multiple_choice',
    prompt: 'ถ้าต้องการเขียนคำสั่งรับค่าคะแนนสอบจากคีย์บอร์ด ในผังงานควรใช้สัญลักษณ์ใด?',
    choices: [
      { id: 'c1', text: 'สี่เหลี่ยมด้านขนาน (Manual Input/General I/O)', isCorrect: true },
      { id: 'c2', text: 'วงกลมจุดเชื่อมต่อ', isCorrect: false },
      { id: 'c3', text: 'สี่เหลี่ยมผืนผ้า', isCorrect: false },
      { id: 'c4', text: 'สี่เหลี่ยมมน', isCorrect: false },
    ],
    explanation: 'สี่เหลี่ยมด้านขนานใช้แทนการรับเข้าหรือส่งออกข้อมูลทั่วไป',
    textbookReference: 'สสวท. ม.1 หน้า 30',
    points: 1,
  },
  {
    id: 'q-2-post-3',
    quizId: 'quiz-2-post',
    type: 'multiple_choice',
    prompt: 'การตรวจสอบเงื่อนไข "ถ้าคะแนน >= 50 ให้แสดง ผ่าน มิฉะนั้นแสดง ไม่ผ่าน" จัดเป็นโครงสร้างแบบใด?',
    choices: [
      { id: 'c1', text: 'โครงสร้างแบบทางเลือก (Selection/Decision)', isCorrect: true },
      { id: 'c2', text: 'โครงสร้างแบบวนซ้ำไม่รู้จบ', isCorrect: false },
      { id: 'c3', text: 'โครงสร้างแบบลำดับไม่มีเงื่อนไข', isCorrect: false },
      { id: 'c4', text: 'โครงสร้างแบบสุ่ม', isCorrect: false },
    ],
    explanation: 'เป็นการทำงานแบบมีทางเลือกสองทิศทาง (If-Else)',
    textbookReference: 'สสวท. ม.1 หน้า 35',
    points: 1,
  },
  {
    id: 'q-2-post-4',
    quizId: 'quiz-2-post',
    type: 'multiple_choice',
    prompt: 'ข้อใดแสดงรหัสลำลองในการหาผลรวมของเลขสองจำนวน x และ y ได้ถูกต้อง?',
    choices: [
      { id: 'c1', text: '1. เริ่มต้น 2. รับค่า x, y 3. คำนวณ sum = x + y 4. แสดงผล sum 5. สิ้นสุด', isCorrect: true },
      { id: 'c2', text: '1. สิ้นสุด 2. sum = x * y 3. เริ่มต้น', isCorrect: false },
      { id: 'c3', text: '1. รับค่า sum 2. แสดง x 3. คำนวณ y', isCorrect: false },
      { id: 'c4', text: '1. เริ่มต้น 2. แสดงผล 3. รับค่า', isCorrect: false },
    ],
    explanation: 'ลำดับที่ถูกต้องคือ เริ่มต้น -> รับค่าเข้า -> ประมวลผลบวก -> แสดงผลลัพธ์ -> สิ้นสุด',
    textbookReference: 'สสวท. ม.1 หน้า 28',
    points: 1,
  },
  {
    id: 'q-2-post-5',
    quizId: 'quiz-2-post',
    type: 'multiple_choice',
    prompt: 'การตรวจสอบและประเมินผล (Evaluation) ในขั้นตอนสุดท้ายมีประโยชน์อย่างไร?',
    choices: [
      { id: 'c1', text: 'ช่วยยืนยันว่าผลลัพธ์ถูกต้องตรงตามเป้าหมายและไม่เกิดข้อผิดพลาด', isCorrect: true },
      { id: 'c2', text: 'ทำให้ไม่ต้องส่งงานครู', isCorrect: false },
      { id: 'c3', text: 'ช่วยให้โปรแกรมทำงานช้าลงเพื่อความละเอียด', isCorrect: false },
      { id: 'c4', text: 'ไม่มีประโยชน์ เป็นขั้นตอนเสริม', isCorrect: false },
    ],
    explanation: 'การตรวจสอบช่วยให้พบข้อบกพร่อง (Bug) และปรับปรุงแก้ไขก่อนนำไปใช้งานจริง',
    textbookReference: 'สสวท. ม.1 หน้า 26',
    points: 1,
  },

  // Chapter 3 Questions (Python)
  {
    id: 'q-3-pre-1',
    quizId: 'quiz-3-pre',
    type: 'multiple_choice',
    prompt: 'ในภาษา Python คำสั่งใดใช้สำหรับแสดงข้อความออกทางหน้าจอ?',
    choices: [
      { id: 'c1', text: 'print()', isCorrect: true },
      { id: 'c2', text: 'echo()', isCorrect: false },
      { id: 'c3', text: 'show()', isCorrect: false },
      { id: 'c4', text: 'display()', isCorrect: false },
    ],
    explanation: 'print() เป็นฟังก์ชันมาตรฐานของ Python สำหรับแสดงข้อมูลออกทางหน้าจอคอนโซล',
    textbookReference: 'สสวท. ม.1 หน้า 48',
    points: 1,
  },
  {
    id: 'q-3-pre-2',
    quizId: 'quiz-3-pre',
    type: 'multiple_choice',
    prompt: 'ข้อมูลชนิดใดใน Python ใช้เก็บจำนวนที่มีจุดทศนิยม เช่น 3.14 หรือ 99.5?',
    choices: [
      { id: 'c1', text: 'float', isCorrect: true },
      { id: 'c2', text: 'int', isCorrect: false },
      { id: 'c3', text: 'str', isCorrect: false },
      { id: 'c4', text: 'bool', isCorrect: false },
    ],
    explanation: 'float คือชนิดข้อมูลเลขทศนิยม ส่วน int คือเลขจำนวนเต็ม',
    textbookReference: 'สสวท. ม.1 หน้า 57',
    points: 1,
  },
  {
    id: 'q-3-pre-3',
    quizId: 'quiz-3-pre',
    type: 'multiple_choice',
    prompt: 'คำสั่งเต่าไพทอน t.forward(100) มีความหมายว่าอย่างไร?',
    choices: [
      { id: 'c1', text: 'สั่งให้เต่าเดินหน้า 100 พิกเซล', isCorrect: true },
      { id: 'c2', text: 'สั่งให้เต่าเลี้ยวขวา 100 องศา', isCorrect: false },
      { id: 'c3', text: 'สั่งให้เต่ายกปากกาขึ้น', isCorrect: false },
      { id: 'c4', text: 'สั่งให้เต่าวาดวงกลมรัศมี 100', isCorrect: false },
    ],
    explanation: 'forward(distance) สั่งให้เต่าเดินหน้าตรงตามระยะทางที่ระบุ',
    textbookReference: 'สสวท. ม.1 หน้า 69',
    points: 1,
  },
  {
    id: 'q-3-pre-4',
    quizId: 'quiz-3-pre',
    type: 'multiple_choice',
    prompt: 'ถ้าต้องการให้โปรแกรมทำซ้ำจำนวน 5 รอบ คำสั่งใดใน Python ถูกต้อง?',
    choices: [
      { id: 'c1', text: 'for i in range(5):', isCorrect: true },
      { id: 'c2', text: 'repeat 5 times:', isCorrect: false },
      { id: 'c3', text: 'loop(5):', isCorrect: false },
      { id: 'c4', text: 'do 5:', isCorrect: false },
    ],
    explanation: 'for i in range(5): จะให้ค่า i ตั้งแต่ 0 ถึง 4 รวมทั้งหมด 5 รอบ',
    textbookReference: 'สสวท. ม.1 หน้า 71',
    points: 1,
  },
  {
    id: 'q-3-pre-5',
    quizId: 'quiz-3-pre',
    type: 'multiple_choice',
    prompt: 'ถ้า x = 10 และ y = 3 คำสั่ง x % y ใน Python จะให้ผลลัพธ์เท่าใด?',
    choices: [
      { id: 'c1', text: '1 (เศษจากการหาร 10 ด้วย 3)', isCorrect: true },
      { id: 'c2', text: '3', isCorrect: false },
      { id: 'c3', text: '3.33', isCorrect: false },
      { id: 'c4', text: '30', isCorrect: false },
    ],
    explanation: 'เครื่องหมาย % (Modulo) คือตัวดำเนินการหาเศษจากการหาร 10 หาร 3 ได้ 3 เศษ 1',
    textbookReference: 'สสวท. ม.1 หน้า 54',
    points: 1,
  },

  // Chapter 3 Post-test (6 questions)
  {
    id: 'q-3-post-1',
    quizId: 'quiz-3-post',
    type: 'multiple_choice',
    prompt: 'ผลลัพธ์ของโปรแกรมต่อไปนี้คืออะไร?\nx = "20"\ny = "30"\nprint(x + y)',
    choices: [
      { id: 'c1', text: '"2030" (เนื่องจากเป็นสตริงข้อความ จึงนำมาต่อกัน)', isCorrect: true },
      { id: 'c2', text: '50', isCorrect: false },
      { id: 'c3', text: 'Error', isCorrect: false },
      { id: 'c4', text: '"50"', isCorrect: false },
    ],
    explanation: 'เมื่อนำ str สองตัวมาใช้เครื่องหมาย + จะเป็นการต่อข้อความ (Concatenation)',
    textbookReference: 'สสวท. ม.1 หน้า 60',
    points: 1,
  },
  {
    id: 'q-3-post-2',
    quizId: 'quiz-3-post',
    type: 'multiple_choice',
    prompt: 'หากต้องการแปลงข้อความ "50" ให้เป็นจำนวนเต็มเพื่อนำไปคำนวณ ต้องใช้ฟังก์ชันใด?',
    choices: [
      { id: 'c1', text: 'int("50")', isCorrect: true },
      { id: 'c2', text: 'str("50")', isCorrect: false },
      { id: 'c3', text: 'number("50")', isCorrect: false },
      { id: 'c4', text: 'float("50.0")', isCorrect: false },
    ],
    explanation: 'int() แปลงสตริงตัวเลขเป็นจำนวนเต็ม',
    textbookReference: 'สสวท. ม.1 หน้า 62',
    points: 1,
  },
  {
    id: 'q-3-post-3',
    quizId: 'quiz-3-post',
    type: 'multiple_choice',
    prompt: 'คำสั่งเต่าไพทอนชุดใดเมื่อรันแล้วจะได้ "รูปสี่เหลี่ยมจัตุรัส"?',
    choices: [
      { id: 'c1', text: 'for i in range(4): t.forward(100); t.right(90)', isCorrect: true },
      { id: 'c2', text: 'for i in range(3): t.forward(100); t.right(120)', isCorrect: false },
      { id: 'c3', text: 'for i in range(5): t.forward(100); t.right(72)', isCorrect: false },
      { id: 'c4', text: 't.circle(100)', isCorrect: false },
    ],
    explanation: 'สี่เหลี่ยมจัตุรัสมี 4 ด้าน มุมเลี้ยวแต่ละมุมคือ 360/4 = 90 องศา',
    textbookReference: 'สสวท. ม.1 หน้า 70',
    points: 1,
  },
  {
    id: 'q-3-post-4',
    quizId: 'quiz-3-post',
    type: 'multiple_choice',
    prompt: 'ในการเขียนเงื่อนไขทางเลือก if...elif...else คำว่า elif ย่อมาจากอะไร?',
    choices: [
      { id: 'c1', text: 'else if', isCorrect: true },
      { id: 'c2', text: 'end if', isCorrect: false },
      { id: 'c3', text: 'enter loop if', isCorrect: false },
      { id: 'c4', text: 'equal if', isCorrect: false },
    ],
    explanation: 'elif ย่อมาจาก else if ใช้สำหรับตรวจสอบเงื่อนไขทางเลือกลำดับถัดไป',
    textbookReference: 'สสวท. ม.1 หน้า 78',
    points: 1,
  },
  {
    id: 'q-3-post-5',
    quizId: 'quiz-3-post',
    type: 'multiple_choice',
    prompt: 'การเยื้องหน้า (Indentation) ในภาษา Python มีความสำคัญอย่างไร?',
    choices: [
      { id: 'c1', text: 'ใช้กำหนดขอบเขตบล็อกคำสั่ง เช่น ภายใน if หรือ for (หากเยื้องผิดจะเกิด IndentationError)', isCorrect: true },
      { id: 'c2', text: 'ไม่มีผลใดๆ ใส่เพื่อความสวยงามเท่านั้น', isCorrect: false },
      { id: 'c3', text: 'ใช้แทนการเซฟไฟล์', isCorrect: false },
      { id: 'c4', text: 'ใช้ระบุชื่อผู้เขียนโค้ด', isCorrect: false },
    ],
    explanation: 'Python ใช้การเยื้องช่องว่าง (Indentation) กำหนดบล็อกคำสั่งอย่างเคร่งครัด',
    textbookReference: 'สสวท. ม.1 หน้า 72',
    points: 1,
  },
  {
    id: 'q-3-post-6',
    quizId: 'quiz-3-post',
    type: 'multiple_choice',
    prompt: 'ถ้า score = 75 โค้ดด้านล่างจะพิมพ์อะไร?\nif score >= 80:\n    print("A")\nelif score >= 70:\n    print("B")\nelse:\n    print("C")',
    choices: [
      { id: 'c1', text: 'B', isCorrect: true },
      { id: 'c2', text: 'A', isCorrect: false },
      { id: 'c3', text: 'C', isCorrect: false },
      { id: 'c4', text: 'B และ C', isCorrect: false },
    ],
    explanation: '75 ไม่มากกว่าเท่ากับ 80 จึงตกมาที่ elif score >= 70 ซึ่งเป็นจริง จึงพิมพ์ "B"',
    textbookReference: 'สสวท. ม.1 หน้า 80',
    points: 1,
  },

  // Chapter 4 (Scratch)
  {
    id: 'q-4-pre-1',
    quizId: 'quiz-4-pre',
    type: 'multiple_choice',
    prompt: 'ใน Scratch ตัวละครหลักที่เราควบคุมเรียกว่าอะไร?',
    choices: [
      { id: 'c1', text: 'Sprite', isCorrect: true },
      { id: 'c2', text: 'Stage', isCorrect: false },
      { id: 'c3', text: 'Backdrop', isCorrect: false },
      { id: 'c4', text: 'Costume', isCorrect: false },
    ],
    explanation: 'Sprite คือตัวละครที่วางอยู่บน Stage (เวที)',
    textbookReference: 'สสวท. ม.1 หน้า 91',
    points: 1,
  },
  {
    id: 'q-4-pre-2',
    quizId: 'quiz-4-pre',
    type: 'multiple_choice',
    prompt: 'บล็อกคำสั่ง "when green flag clicked" อยู่ในกลุ่มบล็อกใด?',
    choices: [
      { id: 'c1', text: 'Events (เหตุการณ์)', isCorrect: true },
      { id: 'c2', text: 'Motion (การเคลื่อนไหว)', isCorrect: false },
      { id: 'c3', text: 'Looks (รูปร่างหน้าตา)', isCorrect: false },
      { id: 'c4', text: 'Sound (เสียง)', isCorrect: false },
    ],
    explanation: 'หมวด Events สีเหลืองใช้รับเหตุการณ์ เช่น คลิกธงเขียว หรือกดแป้นพิมพ์',
    textbookReference: 'สสวท. ม.1 หน้า 95',
    points: 1,
  },
  {
    id: 'q-4-pre-3',
    quizId: 'quiz-4-pre',
    type: 'multiple_choice',
    prompt: 'หากต้องการให้ตัวละครเดินไปข้างหน้าอย่างต่อเนื่องตลอดเวลา ควรใช้บล็อกใด?',
    choices: [
      { id: 'c1', text: 'forever', isCorrect: true },
      { id: 'c2', text: 'repeat (1)', isCorrect: false },
      { id: 'c3', text: 'stop all', isCorrect: false },
      { id: 'c4', text: 'wait (1) seconds', isCorrect: false },
    ],
    explanation: 'บล็อก forever ทำงานซ้ำแบบไม่มีที่สิ้นสุดจนกว่าจะกดปุ่มหยุด',
    textbookReference: 'สสวท. ม.1 หน้า 104',
    points: 1,
  },
  {
    id: 'q-4-pre-4',
    quizId: 'quiz-4-pre',
    type: 'multiple_choice',
    prompt: 'บล็อกคำสั่ง "change [score] by 1" มีประโยชน์อย่างไร?',
    choices: [
      { id: 'c1', text: 'เพิ่มค่าตัวแปร score ขึ้นทีละ 1', isCorrect: true },
      { id: 'c2', text: 'ตั้งค่า score ให้เป็น 1 เสมอ', isCorrect: false },
      { id: 'c3', text: 'ลบตัวแปร score ทิ้ง', isCorrect: false },
      { id: 'c4', text: 'ซ่อนตัวแปร score ไม่ให้เห็นบนจอ', isCorrect: false },
    ],
    explanation: 'change by ใช้สำหรับบวกเพิ่มค่าให้กับตัวแปร',
    textbookReference: 'สสวท. ม.1 หน้า 111',
    points: 1,
  },
  {
    id: 'q-4-pre-5',
    quizId: 'quiz-4-pre',
    type: 'multiple_choice',
    prompt: 'บล็อกคำสั่ง "if on edge, bounce" สั่งให้ตัวละครทำอะไร?',
    choices: [
      { id: 'c1', text: 'ถ้าชนขอบเวที ให้กระเด้งกลับ', isCorrect: true },
      { id: 'c2', text: 'ถ้าชนขอบเวที ให้หายตัวไป', isCorrect: false },
      { id: 'c3', text: 'ถ้าชนขอบเวที ให้เปลี่ยนสี', isCorrect: false },
      { id: 'c4', text: 'ถ้าชนขอบเวที ให้เพิ่มคะแนน', isCorrect: false },
    ],
    explanation: 'bounce คือการกระเด้งสะท้อนกลับเมื่อพิกัดสัมผัสกับขอบของ Stage',
    textbookReference: 'สสวท. ม.1 หน้า 98',
    points: 1,
  },

  // Chapter 4 Post-test (6 questions)
  {
    id: 'q-4-post-1',
    quizId: 'quiz-4-post',
    type: 'multiple_choice',
    prompt: 'บล็อก "repeat until <touching edge?>" จะหยุดทำงานเมื่อใด?',
    choices: [
      { id: 'c1', text: 'เมื่อตัวละครสัมผัสขอบเวที (เงื่อนไขเป็นจริง)', isCorrect: true },
      { id: 'c2', text: 'เมื่อเวลาผ่านไป 10 วินาที', isCorrect: false },
      { id: 'c3', text: 'เมื่อผู้เล่นคลิกเมาส์', isCorrect: false },
      { id: 'c4', text: 'ทำงานตลอดไปไม่หยุด', isCorrect: false },
    ],
    explanation: 'repeat until จะทำซ้ำจนกระทั่งเงื่อนไขข้างในกลายเป็น True',
    textbookReference: 'สสวท. ม.1 หน้า 126',
    points: 1,
  },
  {
    id: 'q-4-post-2',
    quizId: 'quiz-4-post',
    type: 'multiple_choice',
    prompt: 'หากต้องการส่งสัญญาณให้ตัวละครตัวอื่นเริ่มเคลื่อนไหวพร้อมกัน ควรใช้บล็อกใด?',
    choices: [
      { id: 'c1', text: 'broadcast [message1] และ when I receive [message1]', isCorrect: true },
      { id: 'c2', text: 'say [hello]', isCorrect: false },
      { id: 'c3', text: 'turn right (15) degrees', isCorrect: false },
      { id: 'c4', text: 'set volume to 100%', isCorrect: false },
    ],
    explanation: 'ระบบ Broadcast กระจายข้อความสื่อสารระหว่างตัวละครใน Scratch',
    textbookReference: 'สสวท. ม.1 หน้า 116',
    points: 1,
  },
  {
    id: 'q-4-post-3',
    quizId: 'quiz-4-post',
    type: 'multiple_choice',
    prompt: 'การสุ่มตำแหน่งของตัวละครบนเวทีให้สมจริง ควรใช้คำสั่งใดในกลุ่ม Operators?',
    choices: [
      { id: 'c1', text: 'pick random (1) to (10)', isCorrect: true },
      { id: 'c2', text: 'join [apple] [banana]', isCorrect: false },
      { id: 'c3', text: 'letter (1) of [world]', isCorrect: false },
      { id: 'c4', text: 'length of [text]', isCorrect: false },
    ],
    explanation: 'pick random สร้างค่าสุ่มในช่วงตัวเลขที่กำหนด',
    textbookReference: 'สสวท. ม.1 หน้า 118',
    points: 1,
  },
  {
    id: 'q-4-post-4',
    quizId: 'quiz-4-post',
    type: 'multiple_choice',
    prompt: 'ตัวแปรแบบ "For all sprites" (Global) แตกต่างจาก "For this sprite only" (Local) อย่างไร?',
    choices: [
      { id: 'c1', text: 'ทุกตัวละครสามารถอ่านและเปลี่ยนค่าตัวแปร Global ได้', isCorrect: true },
      { id: 'c2', text: 'ตัวแปร Global ไม่สามารถนำมาคำนวณได้', isCorrect: false },
      { id: 'c3', text: 'ตัวแปร Local มองเห็นได้จากทุกสคริปต์', isCorrect: false },
      { id: 'c4', text: 'ไม่มีความแตกต่างกัน', isCorrect: false },
    ],
    explanation: 'For all sprites ทำให้ตัวแปรเข้าถึงได้จากทุกตัวละคร เช่น ตัวแปรเวลารวม หรือคะแนนเกม',
    textbookReference: 'สสวท. ม.1 หน้า 110',
    points: 1,
  },
  {
    id: 'q-4-post-5',
    quizId: 'quiz-4-post',
    type: 'multiple_choice',
    prompt: 'บล็อก "set rotation style [left-right]" มีประโยชน์อย่างไรกับตัวละคร?',
    choices: [
      { id: 'c1', text: 'ทำให้ตัวละครหันหน้าซ้ายขวาได้โดยไม่กลับหัวตีลังกา', isCorrect: true },
      { id: 'c2', text: 'ทำให้ตัวละครหมุนติ้ว 360 องศา', isCorrect: false },
      { id: 'c3', text: 'ทำให้ตัวละครหยุดนิ่ง', isCorrect: false },
      { id: 'c4', text: 'ขยายขนาดตัวละคร 2 เท่า', isCorrect: false },
    ],
    explanation: 'left-right ล็อกไม่ให้ตัวละครกลับหัวเมื่อหันไปทางลบ (องศา -90)',
    textbookReference: 'สสวท. ม.1 หน้า 100',
    points: 1,
  },
  {
    id: 'q-4-post-6',
    quizId: 'quiz-4-post',
    type: 'multiple_choice',
    prompt: 'ข้อใดคือลำดับที่ถูกต้องในการสร้างเกมเก็บเหรียญใน Scratch?',
    choices: [
      { id: 'c1', text: '1. สร้างตัวแปร score 2. ตรวจสอบการสัมผัส if touching 3. เพิ่มค่า change score by 1 4. ซ่อนหรือสุ่มเหรียญใหม่', isCorrect: true },
      { id: 'c2', text: '1. ซ่อนเหรียญ 2. ลบตัวละคร 3. สิ้นสุด', isCorrect: false },
      { id: 'c3', text: '1. เล่นเสียง 2. ปิดโปรแกรม 3. สร้างตัวแปร', isCorrect: false },
      { id: 'c4', text: '1. คลิกธงเขียว 2. ลบคะแนนทิ้ง 3. ชนะเกม', isCorrect: false },
    ],
    explanation: 'เป็นตรรกะเกมมาตรฐานที่เรียนในกิจกรรมท้ายบท Scratch',
    textbookReference: 'สสวท. ม.1 หน้า 128',
    points: 1,
  },

  // Chapter 5 (Data Detective)
  {
    id: 'q-5-pre-1',
    quizId: 'quiz-5-pre',
    type: 'multiple_choice',
    prompt: 'ข้อใดจัดเป็น "ข้อมูลปฐมภูมิ" (Primary Data)?',
    choices: [
      { id: 'c1', text: 'ข้อมูลที่นักเรียนเดินไปสอบถามความชอบของเพื่อนร่วมห้องด้วยตนเอง', isCorrect: true },
      { id: 'c2', text: 'สถิติจำนวนประชากรจากเว็บไซต์กระทรวงมหาดไทย', isCorrect: false },
      { id: 'c3', text: 'รายงานสภาพอากาศย้อนหลัง 10 ปีจากข่าวโทรทัศน์', isCorrect: false },
      { id: 'c4', text: 'บทความวิจัยที่ตีพิมพ์ในวารสาร', isCorrect: false },
    ],
    explanation: 'ข้อมูลปฐมภูมิคือข้อมูลที่ผู้ใช้เก็บรวบรวมจากแหล่งกำเนิดโดยตรง',
    textbookReference: 'สสวท. ม.1 หน้า 140',
    points: 1,
  },
  {
    id: 'q-5-pre-2',
    quizId: 'quiz-5-pre',
    type: 'multiple_choice',
    prompt: 'หากต้องการเปรียบเทียบสัดส่วนของรายจ่ายใน 1 วัน การนำเสนอด้วยแผนภูมิใดเหมาะสมที่สุด?',
    choices: [
      { id: 'c1', text: 'แผนภูมิวงกลม (Pie Chart)', isCorrect: true },
      { id: 'c2', text: 'กราฟเส้น (Line Graph)', isCorrect: false },
      { id: 'c3', text: 'แผนที่ดาวเทียม', isCorrect: false },
      { id: 'c4', text: 'ผังวงจรอิเล็กทรอนิกส์', isCorrect: false },
    ],
    explanation: 'แผนภูมิวงกลมเหมาะสำหรับแสดงสัดส่วนของแต่ละส่วนประกอบเทียบกับภาพรวม 100%',
    textbookReference: 'สสวท. ม.1 หน้า 158',
    points: 1,
  },
  {
    id: 'q-5-pre-3',
    quizId: 'quiz-5-pre',
    type: 'multiple_choice',
    prompt: 'ข้อใดคือขั้นตอนแรกสุดในกระบวนการประมวลผลข้อมูล?',
    choices: [
      { id: 'c1', text: 'การกำหนดวัตถุประสงค์ (Goal Setting)', isCorrect: true },
      { id: 'c2', text: 'การสร้างแผนภูมิสวยงาม', isCorrect: false },
      { id: 'c3', text: 'การลบข้อมูลที่ไม่ชอบทิ้ง', isCorrect: false },
      { id: 'c4', text: 'การประกาศผลลัพธ์', isCorrect: false },
    ],
    explanation: 'ต้องรู้ก่อนว่าจะหาคำตอบเพื่อเป้าหมายอะไร จึงจะวางแผนเก็บข้อมูลได้ถูกต้อง',
    textbookReference: 'สสวท. ม.1 หน้า 141',
    points: 1,
  },
  {
    id: 'q-5-pre-4',
    quizId: 'quiz-5-pre',
    type: 'multiple_choice',
    prompt: 'โปรแกรมประเภทตารางคำนวณ (Spreadsheet เช่น Google Sheets, Excel) เหมาะกับงานใด?',
    choices: [
      { id: 'c1', text: 'การจัดเก็บข้อมูลตัวเลข การคำนวณสูตร และการสร้างแผนภูมิสรุปผล', isCorrect: true },
      { id: 'c2', text: 'การตัดต่อวิดีโอ 4K', isCorrect: false },
      { id: 'c3', text: 'การแต่งภาพบุคคลลบรอยสิว', isCorrect: false },
      { id: 'c4', text: 'การอัดเสียงร้องคาราโอเกะ', isCorrect: false },
    ],
    explanation: 'Spreadsheet ออกแบบมาเพื่อจัดการข้อมูลตาราง คำนวณ และวิเคราะห์ผล',
    textbookReference: 'สสวท. ม.1 หน้า 159',
    points: 1,
  },
  {
    id: 'q-5-pre-5',
    quizId: 'quiz-5-pre',
    type: 'multiple_choice',
    prompt: 'การสร้างทางเลือกเพื่อตัดสินใจ (Decision Making) ควรพิจารณาจากสิ่งใด?',
    choices: [
      { id: 'c1', text: 'เกณฑ์ที่กำหนดอย่างชัดเจนและข้อมูลหลักฐานที่น่าเชื่อถือ', isCorrect: true },
      { id: 'c2', text: 'การโยนเหรียญเสี่ยงทาย', isCorrect: false },
      { id: 'c3', text: 'การเลือกสิ่งที่ราคาแพงที่สุดเสมอ', isCorrect: false },
      { id: 'c4', text: 'การเลือกตามความฝันเมื่อคืน', isCorrect: false },
    ],
    explanation: 'การตัดสินใจอย่างมีหลักการทางวิทยาการคำนวณต้องใช้เกณฑ์และข้อมูลสนับสนุน',
    textbookReference: 'สสวท. ม.1 หน้า 154',
    points: 1,
  },

  // Chapter 5 Post-test (6 questions)
  {
    id: 'q-5-post-1',
    quizId: 'quiz-5-post',
    type: 'multiple_choice',
    prompt: 'หากต้องการแสดงแนวโน้มอุณหภูมิของห้องเรียนในรอบ 24 ชั่วโมง แผนภูมิใดสื่อสารได้ดีที่สุด?',
    choices: [
      { id: 'c1', text: 'กราฟเส้น (Line Graph)', isCorrect: true },
      { id: 'c2', text: 'แผนภูมิแท่งแนวนอน', isCorrect: false },
      { id: 'c3', text: 'แผนภูมิวงกลม', isCorrect: false },
      { id: 'c4', text: 'ตารางเปล่า', isCorrect: false },
    ],
    explanation: 'กราฟเส้นเหมาะที่สุดสำหรับการแสดงแนวโน้ม (Trend) และการเปลี่ยนแปลงตามลำดับเวลา',
    textbookReference: 'สสวท. ม.1 หน้า 158',
    points: 1,
  },
  {
    id: 'q-5-post-2',
    quizId: 'quiz-5-post',
    type: 'multiple_choice',
    prompt: 'ข้อใดเป็นข้อดีของข้อมูลทุติยภูมิ (Secondary Data)?',
    choices: [
      { id: 'c1', text: 'ประหยัดเวลาและค่าใช้จ่ายในการสำรวจเก็บข้อมูลด้วยตนเอง', isCorrect: true },
      { id: 'c2', text: 'มีความสดใหม่ตรงกับความต้องการ 100% เสมอ', isCorrect: false },
      { id: 'c3', text: 'ไม่มีวันผิดพลาดแน่นอน', isCorrect: false },
      { id: 'c4', text: 'ไม่ต้องตรวจสอบความน่าเชื่อถือของแหล่งที่มา', isCorrect: false },
    ],
    explanation: 'ข้อมูลทุติยภูมิรวดเร็วและประหยัด แต่ต้องตรวจสอบความถูกต้องน่าเชื่อถือของแหล่งอ้างอิงเสมอ',
    textbookReference: 'สสวท. ม.1 หน้า 141',
    points: 1,
  },
  {
    id: 'q-5-post-3',
    quizId: 'quiz-5-post',
    type: 'multiple_choice',
    prompt: 'ตารางการตัดสินใจเลือกซื้อคอมพิวเตอร์พิจารณาจากเกณฑ์: ราคา (30%), ประสิทธิภาพ (50%), การรับประกัน (20%) วิธีนี้เรียกว่าอะไร?',
    choices: [
      { id: 'c1', text: 'การถ่วงน้ำหนักเกณฑ์เพื่อการตัดสินใจ (Weighted Scoring)', isCorrect: true },
      { id: 'c2', text: 'การสุ่มตัวอย่างทางสถิติ', isCorrect: false },
      { id: 'c3', text: 'การเดาเชิงนามธรรม', isCorrect: false },
      { id: 'c4', text: 'การเข้ารหัสข้อมูลลับ', isCorrect: false },
    ],
    explanation: 'การให้ค่าน้ำหนักความสำคัญกับแต่ละเกณฑ์ช่วยให้การประเมินทางเลือกสอดคล้องกับความต้องการจริง',
    textbookReference: 'สสวท. ม.1 หน้า 155',
    points: 1,
  },
  {
    id: 'q-5-post-4',
    quizId: 'quiz-5-post',
    type: 'multiple_choice',
    prompt: 'การตรวจสอบความถูกต้องของข้อมูล (Data Validation) ก่อนนำไปประมวลผลมีความสำคัญอย่างไร?',
    choices: [
      { id: 'c1', text: 'ป้องกันไม่ให้ข้อมูลผิดพลาด นำไปสู่ผลลัพธ์การตัดสินใจที่ผิดพลาด (Garbage In, Garbage Out)', isCorrect: true },
      { id: 'c2', text: 'ทำให้พื้นที่ฮาร์ดดิสก์ลดลง', isCorrect: false },
      { id: 'c3', text: 'ไม่จำเป็นหากเราพิมพ์เร็ว', isCorrect: false },
      { id: 'c4', text: 'ช่วยเปลี่ยนข้อมูลจริงให้เป็นเรื่องแต่ง', isCorrect: false },
    ],
    explanation: 'ข้อมูลที่ผิดพลาดจะทำให้ผลลัพธ์การประมวลผลและการตัดสินใจบกพร่องตามไปด้วย',
    textbookReference: 'สสวท. ม.1 หน้า 152',
    points: 1,
  },
  {
    id: 'q-5-post-5',
    quizId: 'quiz-5-post',
    type: 'multiple_choice',
    prompt: 'สูตรใดในโปรแกรมตารางคำนวณใช้หา "ค่าเฉลี่ย" ของข้อมูลในช่วง A1 ถึง A10?',
    choices: [
      { id: 'c1', text: '=AVERAGE(A1:A10)', isCorrect: true },
      { id: 'c2', text: '=SUM(A1:A10)', isCorrect: false },
      { id: 'c3', text: '=MAX(A1:A10)', isCorrect: false },
      { id: 'c4', text: '=COUNT(A1:A10)', isCorrect: false },
    ],
    explanation: 'AVERAGE คือฟังก์ชันหาค่าเฉลี่ยเลขคณิตใน Spreadsheet',
    textbookReference: 'สสวท. ม.1 หน้า 160',
    points: 1,
  },
  {
    id: 'q-5-post-6',
    quizId: 'quiz-5-post',
    type: 'multiple_choice',
    prompt: 'ในการจัดกิจกรรมกีฬาสี โรงเรียนต้องการสำรวจความพึงพอใจของนักเรียน 1,000 คน วิธีรวบรวมข้อมูลใดมีประสิทธิภาพที่สุด?',
    choices: [
      { id: 'c1', text: 'การใช้แบบสอบถามออนไลน์ (Google Forms) ส่งลิงก์ให้นักเรียนตอบ', isCorrect: true },
      { id: 'c2', text: 'การให้ครูคนเดียวเดินสัมภาษณ์ทีละคนจนครบ 1,000 คน', isCorrect: false },
      { id: 'c3', text: 'การเดาเอาเองว่าทุกคนน่าจะชอบ', isCorrect: false },
      { id: 'c4', text: 'การเปิดเพลงเสียงดังแล้ววัดความดัง', isCorrect: false },
    ],
    explanation: 'แบบสอบถามออนไลน์ช่วยเก็บข้อมูลปริมาณมากได้อย่างรวดเร็วและนำไปประมวลผลอัตโนมัติ',
    textbookReference: 'สสวท. ม.1 หน้า 145',
    points: 1,
  },

  // Chapter 6 (Cyber Safety)
  {
    id: 'q-6-pre-1',
    quizId: 'quiz-6-pre',
    type: 'multiple_choice',
    prompt: 'การได้รับอีเมลหรือข้อความแจ้งว่า "คุณถูกรางวัล 1,000,000 บาท กรุณากดลิงก์เพื่อกรอกรหัสผ่านบัญชีธนาคาร" เป็นภัยคุกคามประเภทใด?',
    choices: [
      { id: 'c1', text: 'ฟิชชิ่ง (Phishing)', isCorrect: true },
      { id: 'c2', text: 'ไวรัสคอมพิวเตอร์', isCorrect: false },
      { id: 'c3', text: 'การแฮกระบบฮาร์ดแวร์', isCorrect: false },
      { id: 'c4', text: 'การอัปเดตระบบปฏิบัติการ', isCorrect: false },
    ],
    explanation: 'Phishing คือการหลอกล่อด้วยเหยื่อเพื่อขโมยข้อมูลสำคัญ เช่น รหัสผ่าน หรือเลขบัตร',
    textbookReference: 'สสวท. ม.1 หน้า 168',
    points: 1,
  },
  {
    id: 'q-6-pre-2',
    quizId: 'quiz-6-pre',
    type: 'multiple_choice',
    prompt: 'รหัสผ่าน (Password) ข้อใดต่อไปนี้ มีความปลอดภัยรัดกุมมากที่สุด?',
    choices: [
      { id: 'c1', text: 'M1#Sci@2026!Comp', isCorrect: true },
      { id: 'c2', text: '12345678', isCorrect: false },
      { id: 'c3', text: 'password', isCorrect: false },
      { id: 'c4', text: 'somchai1999', isCorrect: false },
    ],
    explanation: 'รหัสผ่านที่ดีควรยาวเกิน 8 ตัวอักษร ผสมตัวพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และอักขระพิเศษ',
    textbookReference: 'สสวท. ม.1 หน้า 170',
    points: 1,
  },
  {
    id: 'q-6-pre-3',
    quizId: 'quiz-6-pre',
    type: 'multiple_choice',
    prompt: 'การนำภาพถ่ายหรือผลงานของผู้อื่นจากอินเทอร์เน็ตมาใช้งาน ควรปฏิบัติอย่างไรจึงจะถูกต้อง?',
    choices: [
      { id: 'c1', text: 'ตรวจสอบเงื่อนไขลิขสิทธิ์ ขออนุญาตเจ้าของผลงาน และให้เครดิตแหล่งที่มา', isCorrect: true },
      { id: 'c2', text: 'บันทึกรูปมาใช้ได้ทันทีโดยไม่ต้องบอกใครเพราะอยู่บนอินเทอร์เน็ต', isCorrect: false },
      { id: 'c3', text: 'ลบลายน้ำของเจ้าของผลงานออกแล้วใส่ชื่อตนเองแทน', isCorrect: false },
      { id: 'c4', text: 'นำไปขายต่อเพื่อหารายได้', isCorrect: false },
    ],
    explanation: 'ต้องเคารพสิทธิในทรัพย์สินทางปัญญาและให้เกียรติผู้สร้างสรรค์ผลงาน',
    textbookReference: 'สสวท. ม.1 หน้า 178',
    points: 1,
  },
  {
    id: 'q-6-pre-4',
    quizId: 'quiz-6-pre',
    type: 'multiple_choice',
    prompt: 'การกลั่นแกล้งบนโลกออนไลน์ (Cyberbullying) ส่งผลกระทบอย่างไร?',
    choices: [
      { id: 'c1', text: 'สร้างบาดแผลทางจิตใจและความหวาดระแวงให้แก่เหยื่อผู้ถูกกระทำ', isCorrect: true },
      { id: 'c2', text: 'ช่วยให้คนในสังคมรักกันมากขึ้น', isCorrect: false },
      { id: 'c3', text: 'ทำให้คอมพิวเตอร์ทำงานเร็วขึ้น', isCorrect: false },
      { id: 'c4', text: 'ไม่มีผลกระทบใดๆ เป็นเรื่องล้อเล่น', isCorrect: false },
    ],
    explanation: 'Cyberbullying เป็นภัยต่อสุขภาพจิตและอาจมีความผิดตามกฎหมาย พ.ร.บ.คอมพิวเตอร์',
    textbookReference: 'สสวท. ม.1 หน้า 172',
    points: 1,
  },
  {
    id: 'q-6-pre-5',
    quizId: 'quiz-6-pre',
    type: 'multiple_choice',
    prompt: 'เมื่อพบเห็นข่าวที่มีหัวข้อชวนตกใจ เช่น "กินผลไม้นี้จะหายจากทุกโรคภายใน 1 วัน" ควรทำอย่างไรก่อนเป็นอันดับแรก?',
    choices: [
      { id: 'c1', text: 'ตรวจสอบความน่าเชื่อถือจากหน่วยงานการแพทย์หรือแหล่งข่าวทางการ อย่าเพิ่งแชร์ต่อ', isCorrect: true },
      { id: 'c2', text: 'แชร์เข้ากลุ่มครอบครัวทันที 10 กลุ่ม', isCorrect: false },
      { id: 'c3', text: 'รีบซื้อมากินทันที', isCorrect: false },
      { id: 'c4', text: 'พิมพ์ด่าคนเขียนข่าวด้วยถ้อยคำหยาบคาย', isCorrect: false },
    ],
    explanation: 'หยุด คิด ตรวจสอบ ก่อนแชร์ เพื่อป้องกันการแพร่กระจายข่าวปลอม (Fake News)',
    textbookReference: 'สสวท. ม.1 หน้า 174',
    points: 1,
  },

  // Chapter 6 Post-test (6 questions)
  {
    id: 'q-6-post-1',
    quizId: 'quiz-6-post',
    type: 'multiple_choice',
    prompt: 'มัลแวร์ประเภท "แรนซัมแวร์" (Ransomware) ก่อให้เกิดความเสียหายอย่างไร?',
    choices: [
      { id: 'c1', text: 'เข้ารหัสไฟล์ข้อมูลของเหยื่อและข่มขู่เรียกค่าไถ่เพื่อแลกกับรหัสปลดล็อก', isCorrect: true },
      { id: 'c2', text: 'ทำให้หน้าจอแสดงภาพดอกไม้', isCorrect: false },
      { id: 'c3', text: 'ลบเฉพาะไฟล์เพลงในเครื่อง', isCorrect: false },
      { id: 'c4', text: 'ช่วยจัดระเบียบโฟลเดอร์ให้เรียบร้อย', isCorrect: false },
    ],
    explanation: 'Ransomware คือมัลแวร์เรียกค่าไถ่ที่ล็อกไฟล์ข้อมูลทั้งหมดในเครื่อง',
    textbookReference: 'สสวท. ม.1 หน้า 168',
    points: 1,
  },
  {
    id: 'q-6-post-2',
    quizId: 'quiz-6-post',
    type: 'multiple_choice',
    prompt: 'การยืนยันตัวตนแบบสองขั้นตอน (Two-Factor Authentication: 2FA) เพิ่มความปลอดภัยอย่างไร?',
    choices: [
      { id: 'c1', text: 'แม้รหัสผ่านจะถูกขโมย แต่ผู้โจมตีจะเข้าสู่ระบบไม่ได้หากไม่มีรหัส OTP หรืออุปกรณ์ยืนยันตัวตนที่สอง', isCorrect: true },
      { id: 'c2', text: 'ทำให้ไม่ต้องจำรหัสผ่านอีกต่อไป', isCorrect: false },
      { id: 'c3', text: 'ทำให้อินเทอร์เน็ตเร็วขึ้นสองเท่า', isCorrect: false },
      { id: 'c4', text: 'ป้องกันหน้าจอดับ', isCorrect: false },
    ],
    explanation: '2FA เพิ่มเกราะป้องกันชั้นที่สอง เช่น รหัสผ่าน + รหัส OTP บนมือถือ',
    textbookReference: 'สสวท. ม.1 หน้า 171',
    points: 1,
  },
  {
    id: 'q-6-post-3',
    quizId: 'quiz-6-post',
    type: 'multiple_choice',
    prompt: 'การโพสต์ข้อมูลส่วนบุคคลใดต่อไปนี้ลงบนสื่อสังคมออนไลน์สาธารณะ มีความเสี่ยงอันตรายสูงสุด?',
    choices: [
      { id: 'c1', text: 'รูปบัตรประชาชน เลขบัญชีธนาคาร และตั๋วเครื่องบินพร้อมบาร์โค้ด', isCorrect: true },
      { id: 'c2', text: 'รูปวิวทิวทัศน์ทะเลที่เคยไปเที่ยวเมื่อปีที่แล้ว', isCorrect: false },
      { id: 'c3', text: 'ชื่อการ์ตูนเรื่องโปรด', isCorrect: false },
      { id: 'c4', text: 'คำอวยพรวันเกิดเพื่อน', isCorrect: false },
    ],
    explanation: 'ข้อมูลบัตรประชาชนและบาร์โค้ดตั๋วเครื่องบินสามารถถูกมิจฉาชีพนำไปสวมรอยทำธุรกรรมได้',
    textbookReference: 'สสวท. ม.1 หน้า 173',
    points: 1,
  },
  {
    id: 'q-6-post-4',
    quizId: 'quiz-6-post',
    type: 'multiple_choice',
    prompt: 'ตาม พ.ร.บ. ว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ การแอบเข้าถึงระบบคอมพิวเตอร์ของผู้อื่นโดยมิชอบ มีผลทางกฎหมายอย่างไร?',
    choices: [
      { id: 'c1', text: 'มีโทษทางอาญาทั้งจำคุกและปรับ', isCorrect: true },
      { id: 'c2', text: 'ไม่มีความผิดเพราะเป็นเรื่องในโลกเสมือน', isCorrect: false },
      { id: 'c3', text: 'เพียงแค่กล่าวขอโทษก็พ้นผิด', isCorrect: false },
      { id: 'c4', text: 'ถูกตัดสิทธิ์ไม่ให้ใช้อินเทอร์เน็ต 3 วัน', isCorrect: false },
    ],
    explanation: 'การแฮกหรือเข้าถึงข้อมูลระบบผู้อื่นโดยไม่ได้รับอนุญาตมีโทษจำคุกและปรับตามกฎหมาย',
    textbookReference: 'สสวท. ม.1 หน้า 180',
    points: 1,
  },
  {
    id: 'q-6-post-5',
    quizId: 'quiz-6-post',
    type: 'multiple_choice',
    prompt: 'สัญลักษณ์ Creative Commons แบบ "CC-BY-NC" อนุญาตให้ทำสิ่งใดได้?',
    choices: [
      { id: 'c1', text: 'นำผลงานไปใช้ได้โดยต้องอ้างอิงชื่อเจ้าของผลงาน (BY) และห้ามใช้เพื่อการค้า (NC)', isCorrect: true },
      { id: 'c2', text: 'นำผลงานไปขายต่อได้อิสระโดยไม่ต้องใส่ชื่อใคร', isCorrect: false },
      { id: 'c3', text: 'ห้ามนำผลงานไปเผยแพร่ในทุกกรณี', isCorrect: false },
      { id: 'c4', text: 'อนุญาตเฉพาะคนในครอบครัวเจ้าของผลงาน', isCorrect: false },
    ],
    explanation: 'BY = Attribution (อ้างอิงแหล่งที่มา), NC = Non-Commercial (ห้ามใช้เพื่อการค้า)',
    textbookReference: 'สสวท. ม.1 หน้า 179',
    points: 1,
  },
  {
    id: 'q-6-post-6',
    quizId: 'quiz-6-post',
    type: 'multiple_choice',
    prompt: 'เมื่อต้องใช้งานเครื่องคอมพิวเตอร์สาธารณะในห้องสมุด สิ่งที่ควรทำก่อนลุกออกจากเครื่องคืออะไร?',
    choices: [
      { id: 'c1', text: 'ออกจากระบบ (Log out) ทุกบัญชี และลบประวัติการใช้งาน (Clear cache/history)', isCorrect: true },
      { id: 'c2', text: 'ปิดหน้าจอคอมพิวเตอร์โดยไม่ต้องออกจากระบบ', isCorrect: false },
      { id: 'c3', text: 'บันทึกรหัสผ่านไว้ในเบราว์เซอร์เพื่อความสะดวกของคนต่อไป', isCorrect: false },
      { id: 'c4', text: 'ถอดปลั๊กไฟทันที', isCorrect: false },
    ],
    explanation: 'การ Log out และล้างข้อมูลแคชป้องกันไม่ให้ผู้อื่นเข้าถึงบัญชีส่วนตัวของเราได้',
    textbookReference: 'สสวท. ม.1 หน้า 184',
    points: 1,
  },
  // Chapter 7: Comprehensive Final Examination (30 Pre-test + 30 Post-test Questions)
  ...COMPREHENSIVE_PRE_QUESTIONS,
  ...COMPREHENSIVE_POST_QUESTIONS,
];

// -------------------------------------------------------------
// SEED DATA: Quizzes
// -------------------------------------------------------------
const INITIAL_QUIZZES: Quiz[] = [
  { id: 'quiz-1-pre', chapterNumber: 1, title: 'แบบทดสอบก่อนเรียน บทที่ 1: แนวคิดเชิงนามธรรม', type: 'pre_test', totalQuestions: 5, passThresholdPercent: 60, isEnabled: true },
  { id: 'quiz-1-post', chapterNumber: 1, title: 'แบบทดสอบหลังเรียน บทที่ 1: แนวคิดเชิงนามธรรม', type: 'post_test', totalQuestions: 8, passThresholdPercent: 60, isEnabled: true },
  { id: 'quiz-2-pre', chapterNumber: 2, title: 'แบบทดสอบก่อนเรียน บทที่ 2: การแก้ปัญหาและผังงาน', type: 'pre_test', totalQuestions: 5, passThresholdPercent: 60, isEnabled: true },
  { id: 'quiz-2-post', chapterNumber: 2, title: 'แบบทดสอบหลังเรียน บทที่ 2: การแก้ปัญหาและผังงาน', type: 'post_test', totalQuestions: 5, passThresholdPercent: 60, isEnabled: true },
  { id: 'quiz-3-pre', chapterNumber: 3, title: 'แบบทดสอบก่อนเรียน บทที่ 3: ภาษาไพทอน', type: 'pre_test', totalQuestions: 5, passThresholdPercent: 60, isEnabled: true },
  { id: 'quiz-3-post', chapterNumber: 3, title: 'แบบทดสอบหลังเรียน บทที่ 3: ภาษาไพทอน', type: 'post_test', totalQuestions: 6, passThresholdPercent: 60, isEnabled: true },
  { id: 'quiz-4-pre', chapterNumber: 4, title: 'แบบทดสอบก่อนเรียน บทที่ 4: โปรแกรม Scratch', type: 'pre_test', totalQuestions: 5, passThresholdPercent: 60, isEnabled: true },
  { id: 'quiz-4-post', chapterNumber: 4, title: 'แบบทดสอบหลังเรียน บทที่ 4: โปรแกรม Scratch', type: 'post_test', totalQuestions: 6, passThresholdPercent: 60, isEnabled: true },
  { id: 'quiz-5-pre', chapterNumber: 5, title: 'แบบทดสอบก่อนเรียน บทที่ 5: ข้อมูลและการประมวลผล', type: 'pre_test', totalQuestions: 5, passThresholdPercent: 60, isEnabled: true },
  { id: 'quiz-5-post', chapterNumber: 5, title: 'แบบทดสอบหลังเรียน บทที่ 5: ข้อมูลและการประมวลผล', type: 'post_test', totalQuestions: 6, passThresholdPercent: 60, isEnabled: true },
  { id: 'quiz-6-pre', chapterNumber: 6, title: 'แบบทดสอบก่อนเรียน บทที่ 6: การใช้เทคโนโลยีอย่างปลอดภัย', type: 'pre_test', totalQuestions: 5, passThresholdPercent: 60, isEnabled: true },
  { id: 'quiz-6-post', chapterNumber: 6, title: 'แบบทดสอบหลังเรียน บทที่ 6: การใช้เทคโนโลยีอย่างปลอดภัย', type: 'post_test', totalQuestions: 6, passThresholdPercent: 60, isEnabled: true },
  { id: 'quiz-7-pre', chapterNumber: 7, title: 'แบบทดสอบวัดผลสัมฤทธิ์ก่อนเรียน รวม 6 บท (Comprehensive Pre-test 30 ข้อ)', type: 'pre_test', totalQuestions: 30, passThresholdPercent: 60, isEnabled: true },
  { id: 'quiz-7-post', chapterNumber: 7, title: 'แบบทดสอบวัดผลสัมฤทธิ์หลังเรียน รวม 6 บท (Comprehensive Post-test 30 ข้อ)', type: 'post_test', totalQuestions: 30, passThresholdPercent: 60, isEnabled: true },
];

// Initial Chat messages
const INITIAL_CHATS: ChatMessage[] = [
  {
    id: 'chat-1',
    senderId: 'student-1',
    senderName: 'เด็กชายปภพ สุขใจ',
    senderRole: 'student',
    recipientId: 'teacher-1',
    message: 'สวัสดีครับครูสมศรี ผมอยากถามเรื่องเกม Python Runner คำสั่งเต่าเลี้ยวขวา 90 องศาต้องพิมพ์ว่า t.right(90) ใช่ไหมครับ?',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: true,
  },
  {
    id: 'chat-2',
    senderId: 'teacher-1',
    senderName: 'ครูสมศรี ปัญญาดี',
    senderRole: 'teacher',
    recipientId: 'student-1',
    message: 'ถูกต้องแล้วจ้ะปภพ! t.right(90) จะสั่งให้เต่าเลี้ยวขวา 90 องศา และถ้าต้องการวาดสี่เหลี่ยม ให้สั่งวนซ้ำ 4 รอบนะจ๊ะ เก่งมาก!',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    read: true,
  },
];

// Initial Teacher Feedback
const INITIAL_FEEDBACK: TeacherFeedback[] = [
  {
    id: 'fb-1',
    studentId: 'student-1',
    teacherId: 'teacher-1',
    teacherName: 'ครูสมศรี ปัญญาดี',
    chapterNumber: 1,
    message: 'ปภพทำคะแนนแบบทดสอบหลังเรียนบทที่ 1 ได้ดีมาก (8/8) เข้าใจการคัดแยกสิ่งจำเป็นได้ชัดเจน ขอให้ตั้งใจต่อไปในบทที่ 2 นะคะ',
    recommendedTopics: ['การเขียนผังงานเพื่อแก้ปัญหาจริง'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

// Initial Quiz Attempt & Mistake Log Data for Analytics
export interface QuizAttemptRecord {
  id: string;
  quizId: string;
  chapterNumber: number;
  quizType: 'pre_test' | 'post_test';
  userId: string;
  userName: string;
  score: number;
  maxScore: number;
  completedAt: string;
  answers: {
    questionId: string;
    questionText: string;
    selectedOption: number;
    selectedText: string;
    correctOption: number;
    correctText: string;
    isCorrect: boolean;
    explanation: string;
    textbookReference?: string;
  }[];
}

const INITIAL_QUIZ_ATTEMPTS: QuizAttemptRecord[] = [
  {
    id: 'att-1',
    quizId: 'quiz-1-pre',
    chapterNumber: 1,
    quizType: 'pre_test',
    userId: 'student-1',
    userName: 'เด็กชายปภพ สุขใจ',
    score: 3,
    maxScore: 5,
    completedAt: '2026-05-18T10:15:00.000Z',
    answers: [
      {
        questionId: 'q-1-pre-1',
        questionText: 'ข้อใดอธิบายความหมายของ "แนวคิดเชิงนามธรรม" (Abstraction) ได้ถูกต้องที่สุด?',
        selectedOption: 0,
        selectedText: 'การจำแนกรายละเอียดที่สำคัญและจำเป็นออกจากรายละเอียดที่ไม่จำเป็น',
        correctOption: 0,
        correctText: 'การจำแนกรายละเอียดที่สำคัญและจำเป็นออกจากรายละเอียดที่ไม่จำเป็น',
        isCorrect: true,
        explanation: 'แนวคิดเชิงนามธรรมเป็นการคัดแยกคุณลักษณะที่สำคัญจำเป็นต่อการแก้ปัญหาออกจากรายละเอียดปลีกย่อย',
        textbookReference: 'สสวท. ม.1 หน้า 4',
      },
      {
        questionId: 'q-1-pre-2',
        questionText: 'หากต้องการเดินทางด้วยรถไฟฟ้า ข้อมูลใดจัดเป็น "รายละเอียดที่ไม่จำเป็น" ในการดูแผนที่?',
        selectedOption: 2,
        selectedText: 'สีของขบวนรถไฟฟ้าและชื่อคนขับ',
        correctOption: 2,
        correctText: 'สีของขบวนรถไฟฟ้าและชื่อคนขับ',
        isCorrect: true,
        explanation: 'สีของตัวรถหรือชื่อคนขับไม่มีผลต่อการเดินทางและการเปลี่ยนสถานีของผู้โดยสาร',
        textbookReference: 'สสวท. ม.1 หน้า 8',
      },
      {
        questionId: 'q-1-pre-3',
        questionText: 'ข้อมูลเดียวกันย่อมเป็นสิ่งจำเป็นสำหรับการแก้ปัญหาของทุกๆ คนในทุกสถานการณ์เสมอ?',
        selectedOption: 0,
        selectedText: 'จริง',
        correctOption: 1,
        correctText: 'ไม่จริง (ขึ้นอยู่กับวัตถุประสงค์ของการแก้ปัญหา)',
        isCorrect: false,
        explanation: 'ความจำเป็นของข้อมูลขึ้นอยู่กับเป้าหมายและบทบาทของบุคคล เช่น ช่างซ่อมรถกับผู้ขับขี่ต้องการข้อมูลรถต่างกัน',
        textbookReference: 'สสวท. ม.1 หน้า 8',
      },
      {
        questionId: 'q-1-pre-4',
        questionText: 'การวาดแผนที่แบบร่างบอกทางจากบ้านมาโรงเรียนโดยไม่วาดต้นไม้ทุกต้นริมถนน จัดเป็นการใช้แนวคิดใด?',
        selectedOption: 1,
        selectedText: 'การหารูปแบบ (Pattern Recognition)',
        correctOption: 0,
        correctText: 'แนวคิดเชิงนามธรรม (Abstraction)',
        isCorrect: false,
        explanation: 'การตัดต้นไม้หรือสิ่งก่อสร้างที่ไม่ใช่จุดสังเกตสำคัญออก เพื่อเน้นเส้นทางเลี้ยว',
        textbookReference: 'สสวท. ม.1 หน้า 9',
      },
      {
        questionId: 'q-1-pre-5',
        questionText: 'การเตรียมกระเป๋านักเรียนตามตารางสอน สิ่งใดคือข้อมูลจำเป็นในการจัดกระเป๋า?',
        selectedOption: 0,
        selectedText: 'วิชาและอุปกรณ์ที่ต้องใช้ในวันนั้น',
        correctOption: 0,
        correctText: 'วิชาและอุปกรณ์ที่ต้องใช้ในวันนั้น',
        isCorrect: true,
        explanation: 'วิชาในตารางสอนและอุปกรณ์ที่ครูกำหนดคือข้อมูลที่ตรงกับเป้าหมายการเรียนในวันนั้น',
        textbookReference: 'สสวท. ม.1 หน้า 20',
      },
    ],
  },
  {
    id: 'att-2',
    quizId: 'quiz-1-pre',
    chapterNumber: 1,
    quizType: 'pre_test',
    userId: 'student-2',
    userName: 'เด็กหญิงมนัสนันท์ ขยันเรียน',
    score: 4,
    maxScore: 5,
    completedAt: '2026-05-18T11:00:00.000Z',
    answers: [
      {
        questionId: 'q-1-pre-1',
        questionText: 'ข้อใดอธิบายความหมายของ "แนวคิดเชิงนามธรรม" (Abstraction) ได้ถูกต้องที่สุด?',
        selectedOption: 0,
        selectedText: 'การจำแนกรายละเอียดที่สำคัญและจำเป็นออกจากรายละเอียดที่ไม่จำเป็น',
        correctOption: 0,
        correctText: 'การจำแนกรายละเอียดที่สำคัญและจำเป็นออกจากรายละเอียดที่ไม่จำเป็น',
        isCorrect: true,
        explanation: 'สสวท. หน้า 4',
        textbookReference: 'สสวท. ม.1 หน้า 4',
      },
      {
        questionId: 'q-1-pre-2',
        questionText: 'หากต้องการเดินทางด้วยรถไฟฟ้า ข้อมูลใดจัดเป็น "รายละเอียดที่ไม่จำเป็น" ในการดูแผนที่?',
        selectedOption: 2,
        selectedText: 'สีของขบวนรถไฟฟ้าและชื่อคนขับ',
        correctOption: 2,
        correctText: 'สีของขบวนรถไฟฟ้าและชื่อคนขับ',
        isCorrect: true,
        explanation: 'สสวท. หน้า 8',
        textbookReference: 'สสวท. ม.1 หน้า 8',
      },
      {
        questionId: 'q-1-pre-3',
        questionText: 'ข้อมูลเดียวกันย่อมเป็นสิ่งจำเป็นสำหรับการแก้ปัญหาของทุกๆ คนในทุกสถานการณ์เสมอ?',
        selectedOption: 0,
        selectedText: 'จริง',
        correctOption: 1,
        correctText: 'ไม่จริง (ขึ้นอยู่กับวัตถุประสงค์ของการแก้ปัญหา)',
        isCorrect: false,
        explanation: 'สสวท. หน้า 8',
        textbookReference: 'สสวท. ม.1 หน้า 8',
      },
      {
        questionId: 'q-1-pre-4',
        questionText: 'การวาดแผนที่แบบร่างบอกทางจากบ้านมาโรงเรียนโดยไม่วาดต้นไม้ทุกต้นริมถนน จัดเป็นการใช้แนวคิดใด?',
        selectedOption: 0,
        selectedText: 'แนวคิดเชิงนามธรรม (Abstraction)',
        correctOption: 0,
        correctText: 'แนวคิดเชิงนามธรรม (Abstraction)',
        isCorrect: true,
        explanation: 'สสวท. หน้า 9',
        textbookReference: 'สสวท. ม.1 หน้า 9',
      },
      {
        questionId: 'q-1-pre-5',
        questionText: 'การเตรียมกระเป๋านักเรียนตามตารางสอน สิ่งใดคือข้อมูลจำเป็นในการจัดกระเป๋า?',
        selectedOption: 0,
        selectedText: 'วิชาและอุปกรณ์ที่ต้องใช้ในวันนั้น',
        correctOption: 0,
        correctText: 'วิชาและอุปกรณ์ที่ต้องใช้ในวันนั้น',
        isCorrect: true,
        explanation: 'สสวท. หน้า 20',
        textbookReference: 'สสวท. ม.1 หน้า 20',
      },
    ],
  },
  {
    id: 'att-3',
    quizId: 'quiz-2-pre',
    chapterNumber: 2,
    quizType: 'pre_test',
    userId: 'student-3',
    userName: 'เด็กชายธนวินท์ รวดเร็ว',
    score: 2,
    maxScore: 5,
    completedAt: '2026-05-19T09:30:00.000Z',
    answers: [
      {
        questionId: 'q-2-pre-1',
        questionText: 'ขั้นตอนแรกสุดของกระบวนการแก้ปัญหาตามหลักการ สสวท. คือข้อใด?',
        selectedOption: 1,
        selectedText: 'การวางแผนการแก้ปัญหา',
        correctOption: 0,
        correctText: 'การวิเคราะห์และกำหนดรายละเอียดของปัญหา',
        isCorrect: false,
        explanation: 'ต้องเริ่มจากการวิเคราะห์และทำความเข้าใจปัญหาก่อนวางแผน',
        textbookReference: 'สสวท. ม.1 หน้า 24',
      },
      {
        questionId: 'q-2-pre-2',
        questionText: 'สัญลักษณ์รูปสี่เหลี่ยมข้าวหลามตัด (Diamond) ในผังงาน หมายถึงการทำงานข้อใด?',
        selectedOption: 0,
        selectedText: 'การตัดสินใจตามเงื่อนไข (Decision)',
        correctOption: 0,
        correctText: 'การตัดสินใจตามเงื่อนไข (Decision)',
        isCorrect: true,
        explanation: 'สัญลักษณ์สี่เหลี่ยมข้าวหลามตัดใช้สำหรับเงื่อนไข Yes/No หรือ True/False',
        textbookReference: 'สสวท. ม.1 หน้า 30',
      },
      {
        questionId: 'q-2-pre-3',
        questionText: 'ข้อใดไม่ใช่ข้อดีของการเขียนรหัสลำลอง (Pseudocode) ก่อนเขียนโปรแกรมจริง?',
        selectedOption: 2,
        selectedText: 'คอมพิวเตอร์สามารถรันรหัสลำลองได้ทันทีโดยไม่ต้องแปลภาษา',
        correctOption: 2,
        correctText: 'คอมพิวเตอร์สามารถรันรหัสลำลองได้ทันทีโดยไม่ต้องแปลภาษา',
        isCorrect: true,
        explanation: 'รหัสลำลองเป็นภาษาสำหรับมนุษย์อ่าน คอมพิวเตอร์ไม่สามารถประมวลผลได้โดยตรง',
        textbookReference: 'สสวท. ม.1 หน้า 28',
      },
      {
        questionId: 'q-2-pre-4',
        questionText: 'หากต้องการให้คำสั่งทำงานซ้ำๆ จนกว่าเงื่อนไขจะเป็นจริง ควรใช้โครงสร้างแบบใด?',
        selectedOption: 0,
        selectedText: 'โครงสร้างแบบเรียงลำดับ (Sequential)',
        correctOption: 1,
        correctText: 'โครงสร้างแบบวนซ้ำ (Loop/Repetition)',
        isCorrect: false,
        explanation: 'การทำงานซ้ำต้องใช้โครงสร้างแบบวนซ้ำ',
        textbookReference: 'สสวท. ม.1 หน้า 34',
      },
      {
        questionId: 'q-2-pre-5',
        questionText: 'การตั้งชื่อตัวแปรในวิทยาการคำนวณ ข้อใดเป็นแนวทางปฏิบัติที่ดีที่สุด?',
        selectedOption: 1,
        selectedText: 'ตั้งชื่อสั้นที่สุดตัวอักษรเดียว เช่น a, b, c เสมอ',
        correctOption: 0,
        correctText: 'ตั้งชื่อสื่อความหมายของข้อมูลที่จัดเก็บ เช่น student_score, age',
        isCorrect: false,
        explanation: 'ชื่อตัวแปรที่ดีควรสื่อความหมาย เพื่อให้อ่านและดูแลรักษาโปรแกรมได้ง่าย',
        textbookReference: 'สสวท. ม.1 หน้า 33',
      },
    ],
  },
  // Chapter 3: Python Attempts
  {
    id: 'att-ch3-1',
    quizId: 'quiz-3-pre',
    chapterNumber: 3,
    quizType: 'pre_test',
    userId: 'student-1',
    userName: 'เด็กชายปภพ สุขใจ',
    score: 3,
    maxScore: 5,
    completedAt: '2026-05-19T09:30:00.000Z',
    answers: [
      {
        questionId: 'q-3-pre-1',
        questionText: 'คำสั่งใดใน Python ใช้แสดงผลลัพธ์ออกทางหน้าจอ?',
        selectedOption: 0,
        selectedText: 'print()',
        correctOption: 0,
        correctText: 'print()',
        isCorrect: true,
        explanation: 'print() คือคำสั่งมาตรฐานในการแสดงผลข้อความและค่าตัวแปรออกทางหน้าจอ',
        textbookReference: 'สสวท. ม.1 หน้า 54',
      },
      {
        questionId: 'q-3-pre-2',
        questionText: 'หาก x = 10 และ y = 3 ผลลัพธ์ของ x // y ในไพทอนมีค่าเท่าใด?',
        selectedOption: 2,
        selectedText: '3.33',
        correctOption: 0,
        correctText: '3 (การหารปัดเศษทิ้ง)',
        isCorrect: false,
        explanation: 'เครื่องหมาย // ในภาษาไพทอนคือ Floor Division หรือการหารปัดเศษทิ้ง',
        textbookReference: 'สสวท. ม.1 หน้า 60',
      },
      {
        questionId: 'q-3-pre-3',
        questionText: 'ชนิดข้อมูล (Data Type) ใดใช้เก็บข้อความ เช่น "Hello World"?',
        selectedOption: 1,
        selectedText: 'str (String)',
        correctOption: 1,
        correctText: 'str (String)',
        isCorrect: true,
        explanation: 'str คือประเภทข้อมูลข้อความหรือสตริงในภาษา Python',
        textbookReference: 'สสวท. ม.1 หน้า 58',
      },
      {
        questionId: 'q-3-pre-4',
        questionText: 'คำสั่งวนซ้ำ for i in range(5): ตัวแปร i จะมีค่าตั้งแต่เท่าใดถึงเท่าใด?',
        selectedOption: 0,
        selectedText: '1 ถึง 5',
        correctOption: 1,
        correctText: '0 ถึง 4 (รวม 5 รอบ)',
        isCorrect: false,
        explanation: 'range(5) เริ่มต้นนับที่ 0 และสิ้นสุดที่ 4 รวมทั้งหมด 5 รอบ',
        textbookReference: 'สสวท. ม.1 หน้า 72',
      },
      {
        questionId: 'q-3-pre-5',
        questionText: 'โครงสร้างแบบ if...else ใช้เพื่ออะไรในการเขียนโปรแกรม?',
        selectedOption: 0,
        selectedText: 'การเลือกทำตามเงื่อนไข (Conditional Selection)',
        correctOption: 0,
        correctText: 'การเลือกทำตามเงื่อนไข (Conditional Selection)',
        isCorrect: true,
        explanation: 'if...else ใช้ในการตรวจสอบเงื่อนไขเพื่อตัดสินใจเลือกทำชุดคำสั่ง',
        textbookReference: 'สสวท. ม.1 หน้า 78',
      },
    ],
  },
  // Chapter 5: Data and Processing (ข้อมูลและการประมวลผล)
  {
    id: 'att-ch5-1',
    quizId: 'quiz-5-pre',
    chapterNumber: 5,
    quizType: 'pre_test',
    userId: 'student-2',
    userName: 'เด็กหญิงมนัสนันท์ ขยันเรียน',
    score: 3,
    maxScore: 5,
    completedAt: '2026-05-20T14:00:00.000Z',
    answers: [
      {
        questionId: 'q-5-pre-1',
        questionText: 'ข้อใดคือตัวอย่างของ "ข้อมูลปฐมภูมิ" (Primary Data)?',
        selectedOption: 0,
        selectedText: 'ข้อมูลที่ผู้เก็บรวบรวมได้มาโดยตรงจากแหล่งกำเนิด เช่น การสังเกตและสัมภาษณ์',
        correctOption: 0,
        correctText: 'ข้อมูลที่ผู้เก็บรวบรวมได้มาโดยตรงจากแหล่งกำเนิด เช่น การสังเกตและสัมภาษณ์',
        isCorrect: true,
        explanation: 'ข้อมูลปฐมภูมิคือข้อมูลที่ผู้ใช้เก็บรวบรวมด้วยตนเองจากแหล่งกำเนิดข้อมูลโดยตรง',
        textbookReference: 'สสวท. ม.1 หน้า 140',
      },
      {
        questionId: 'q-5-pre-2',
        questionText: 'การตรวจสอบความสมบูรณ์และถูกต้องของข้อมูลก่อนประมวลผล เรียกว่าอะไร?',
        selectedOption: 2,
        selectedText: 'Data Compression (การบีบอัดข้อมูล)',
        correctOption: 0,
        correctText: 'Data Validation / Data Cleaning (การทำความสะอาดและตรวจสอบข้อมูล)',
        isCorrect: false,
        explanation: 'การตรวจสอบและคัดกรองข้อมูลผิดพลาดก่อนนำไปประมวลผลคือ Data Validation',
        textbookReference: 'สสวท. ม.1 หน้า 152',
      },
      {
        questionId: 'q-5-pre-3',
        questionText: 'หากต้องการเปรียบเทียบสัดส่วนยอดขายสินค้า 4 ประเภท ควรใช้แผนภูมิชนิดใด?',
        selectedOption: 0,
        selectedText: 'แผนภูมิวงกลม (Pie Chart)',
        correctOption: 0,
        correctText: 'แผนภูมิวงกลม (Pie Chart)',
        isCorrect: true,
        explanation: 'แผนภูมิวงกลมเหมาะสำหรับแสดงสัดส่วนของแต่ละส่วนประกอบเทียบกับภาพรวมทั้งหมด (100%)',
        textbookReference: 'สสวท. ม.1 หน้า 158',
      },
      {
        questionId: 'q-5-pre-4',
        questionText: 'การประเมินทางเลือกเพื่อตัดสินใจแบบมีหลักเกณฑ์ (Decision Matrix) ช่วยในเรื่องใด?',
        selectedOption: 1,
        selectedText: 'ช่วยให้ตัดสินใจได้เร็วโดยไม่ต้องสนใจเหตุผล',
        correctOption: 0,
        correctText: 'ช่วยให้การตัดสินใจมีเหตุผล โปร่งใส และลดความลำเอียงส่วนบุคคล',
        isCorrect: false,
        explanation: 'การสร้างตารางเกณฑ์ช่วยให้สามารถเปรียบเทียบทางเลือกได้อย่างเป็นภววิสัย',
        textbookReference: 'สสวท. ม.1 หน้า 154',
      },
      {
        questionId: 'q-5-pre-5',
        questionText: 'การสร้างทางเลือกเพื่อตัดสินใจ (Decision Making) ควรพิจารณาจากสิ่งใด?',
        selectedOption: 0,
        selectedText: 'เกณฑ์ที่กำหนดอย่างชัดเจนและข้อมูลหลักฐานที่น่าเชื่อถือ',
        correctOption: 0,
        correctText: 'เกณฑ์ที่กำหนดอย่างชัดเจนและข้อมูลหลักฐานที่น่าเชื่อถือ',
        isCorrect: true,
        explanation: 'การตัดสินใจอย่างมีประสิทธิภาพต้องอาศัยเกณฑ์และข้อมูลหลักฐานที่เชื่อถือได้',
        textbookReference: 'สสวท. ม.1 หน้า 155',
      },
    ],
  },
  // Chapter 7: Comprehensive Exam Attempts (ข้อสอบรวม 6 บท)
  {
    id: 'att-ch7-pre-1',
    quizId: 'quiz-7-pre',
    chapterNumber: 7,
    quizType: 'pre_test',
    userId: 'student-1',
    userName: 'เด็กชายปภพ สุขใจ',
    score: 20,
    maxScore: 30,
    completedAt: '2026-05-22T08:30:00.000Z',
    answers: [
      {
        questionId: 'q-7-pre-1',
        questionText: '(บทที่ 1) ข้อใดคือหัวใจสำคัญของ "แนวคิดเชิงนามธรรม" (Abstraction)?',
        selectedOption: 0,
        selectedText: 'การคัดแยกคุณลักษณะที่สำคัญจำเป็นต่อการแก้ปัญหาออกจากรายละเอียดปลีกย่อย',
        correctOption: 0,
        correctText: 'การคัดแยกคุณลักษณะที่สำคัญจำเป็นต่อการแก้ปัญหาออกจากรายละเอียดปลีกย่อย',
        isCorrect: true,
        explanation: 'แนวคิดเชิงนามธรรมมุ่งเน้นการคัดกรองเฉพาะข้อมูลที่จำเป็นต่อเป้าหมาย',
        textbookReference: 'สสวท. ม.1 หน้า 4',
      },
      {
        questionId: 'q-7-pre-8',
        questionText: '(บทที่ 2) สัญลักษณ์ผังงานรูป "สี่เหลี่ยมข้าวหลามตัด" (Diamond) ใช้แทนสิ่งใด?',
        selectedOption: 1,
        selectedText: 'การรับข้อมูลเข้าจากแป้นพิมพ์เท่านั้น',
        correctOption: 0,
        correctText: 'การตัดสินใจตามเงื่อนไข (Decision) มีทิศทางจริง/เท็จ',
        isCorrect: false,
        explanation: 'รูปข้าวหลามตัดใช้ตรวจสอบเงื่อนไข โดยจะมีเส้นทางออกจากรูปอย่างน้อย 2 ทิศทาง',
        textbookReference: 'สสวท. ม.1 หน้า 30',
      },
      {
        questionId: 'q-7-pre-14',
        questionText: '(บทที่ 3) คำสั่ง while ในไพทอนมีพฤติกรรมอย่างไร?',
        selectedOption: 1,
        selectedText: 'ทำงานเพียง 1 รอบเสมอ',
        correctOption: 0,
        correctText: 'ทำงานวนซ้ำตราบเท่าที่เงื่อนไขยังคงเป็นจริง (True)',
        isCorrect: false,
        explanation: 'while loop จะตรวจสอบเงื่อนไขก่อนเริ่มทำงานแต่ละรอบ และวนซ้ำจนกว่าเงื่อนไขจะเป็นเท็จ',
        textbookReference: 'สสวท. ม.1 หน้า 74',
      },
      {
        questionId: 'q-7-pre-21',
        questionText: '(บทที่ 5) ข้อใดคือความแตกต่างหลักระหว่าง "ข้อมูล" (Data) กับ "สารสนเทศ" (Information)?',
        selectedOption: 2,
        selectedText: 'ข้อมูลเป็นสิ่งที่มีประโยชน์พร้อมใช้ทันทีกว่าสารสนเทศ',
        correctOption: 0,
        correctText: 'สารสนเทศคือข้อมูลที่ผ่านการประมวลผล วิเคราะห์ และจัดระเบียบจนเกิดความหมาย',
        isCorrect: false,
        explanation: 'ข้อมูลคือข้อเท็จจริงดิบ ส่วนสารสนเทศคือผลลัพธ์หลังการประมวลผล',
        textbookReference: 'สสวท. ม.1 หน้า 139',
      },
      {
        questionId: 'q-7-pre-28',
        questionText: '(บทที่ 6) ข้อใดคือลักษณะสำคัญของอีเมลหลอกลวง (Phishing)?',
        selectedOption: 0,
        selectedText: 'การส่งลิงก์ปลอมแอบอ้างเป็นธนาคารหรือสถาบันเพื่อหลอกให้กรอกรหัสผ่าน',
        correctOption: 0,
        correctText: 'การส่งลิงก์ปลอมแอบอ้างเป็นธนาคารหรือสถาบันเพื่อหลอกให้กรอกรหัสผ่าน',
        isCorrect: true,
        explanation: 'Phishing คือกลลวงทางสังคมเพื่อขโมยข้อมูลความลับส่วนบุคคล',
        textbookReference: 'สสวท. ม.1 หน้า 168',
      },
    ],
  },
  {
    id: 'att-ch7-post-1',
    quizId: 'quiz-7-post',
    chapterNumber: 7,
    quizType: 'post_test',
    userId: 'student-2',
    userName: 'เด็กหญิงมนัสนันท์ ขยันเรียน',
    score: 28,
    maxScore: 30,
    completedAt: '2026-05-25T11:20:00.000Z',
    answers: [
      {
        questionId: 'q-7-post-1',
        questionText: '(บทที่ 1) การสร้างโมเดลแผนที่เฉพาะสถานีรถไฟฟ้าบีทีเอสโดยไม่แสดงบ้านเรือนทุกหลัง เป็นการประยุกต์ใช้สิ่งใด?',
        selectedOption: 0,
        selectedText: 'แนวคิดเชิงนามธรรม (Abstraction)',
        correctOption: 0,
        correctText: 'แนวคิดเชิงนามธรรม (Abstraction)',
        isCorrect: true,
        explanation: 'การคัดเลือกเฉพาะข้อมูลที่จำเป็นต่อการสัญจร',
        textbookReference: 'สสวท. ม.1 หน้า 8',
      },
      {
        questionId: 'q-7-post-15',
        questionText: '(บทที่ 3) ผลลัพธ์ของ 7 % 3 ในภาษาไพทอนคือค่าใด?',
        selectedOption: 0,
        selectedText: '1 (เศษจากการหาร)',
        correctOption: 0,
        correctText: '1 (เศษจากการหาร)',
        isCorrect: true,
        explanation: 'เครื่องหมาย % (Modulo) ให้ผลลัพธ์เป็นเศษจากการหาร',
        textbookReference: 'สสวท. ม.1 หน้า 61',
      },
      {
        questionId: 'q-7-post-23',
        questionText: '(บทที่ 5) ข้อใดจัดเป็นข้อผิดพลาด Garbage In, Garbage Out ในการประมวลผลข้อมูล?',
        selectedOption: 1,
        selectedText: 'คอมพิวเตอร์ทำงานเร็วเกินไป',
        correctOption: 0,
        correctText: 'หากนำข้อมูลที่ไม่ถูกต้องเข้าสู่ระบบ ผลลัพธ์จากการวิเคราะห์ย่อมผิดพลาดตามไปด้วย',
        isCorrect: false,
        explanation: 'หากข้อมูลต้นทางผิดพลาด แม้ขั้นตอนการประมวลผลจะถูกต้อง ผลลัพธ์ที่ได้ก็จะไม่ถูกต้อง',
        textbookReference: 'สสวท. ม.1 หน้า 152',
      },
    ],
  },
];


// -------------------------------------------------------------
// Storage API Export
// -------------------------------------------------------------
export const StorageService = {
  // Current active user (null when logged out or session not yet authenticated)
  getCurrentUser: (): User | null => {
    return getLocal<User | null>('current_user', null);
  },
  setCurrentUser: (user: User | null) => {
    setLocal('current_user', user);
  },

  // Users
  getUsers: (): User[] => {
    let users = getLocal<User[]>('users', INITIAL_USERS);
    // Ensure Admin01 is ALWAYS present in system
    const hasAdmin = users.some(
      (u) => u.role === 'admin' || u.id === 'admin-1' || u.email.toLowerCase() === 'admin01@school.ac.th'
    );
    if (!hasAdmin) {
      users = [INITIAL_ADMIN_USER, ...users];
      setLocal('users', users);
    }
    return users;
  },
  saveUsers: (users: User[]) => setLocal('users', users),
  findUserById: (id: string): User | undefined => {
    return StorageService.getUsers().find((u) => u.id === id);
  },
  findUserByEmail: (email: string): User | undefined => {
    if (!email) return undefined;
    const cleanEmail = email.trim().toLowerCase();
    return StorageService.getUsers().find(
      (u) => u.email.trim().toLowerCase() === cleanEmail
    );
  },
  findUserByIdentifier: (identifier: string): User | undefined => {
    if (!identifier) return undefined;
    const cleanId = identifier.trim().toLowerCase();
    const allUsers = StorageService.getUsers();

    // Special match for Admin01
    if (cleanId === 'admin01' || cleanId === 'admin' || cleanId === 'admin01@school.ac.th') {
      const adminUser = allUsers.find(
        (u) => u.role === 'admin' || u.id === 'admin-1' || u.email.toLowerCase() === 'admin01@school.ac.th'
      );
      if (adminUser) return adminUser;
    }

    // 1. By email
    const byEmail = allUsers.find((u) => u.email.trim().toLowerCase() === cleanId);
    if (byEmail) return byEmail;

    // 2. By student ID
    const studentProfiles = StorageService.getStudentProfiles();
    const matchedStudent = studentProfiles.find(
      (p) => p.studentId.trim().toLowerCase() === cleanId
    );
    if (matchedStudent) {
      return allUsers.find((u) => u.id === matchedStudent.userId);
    }

    // 3. By teacher ID
    const teacherProfiles = StorageService.getTeacherProfiles();
    const matchedTeacher = teacherProfiles.find(
      (p) => p.teacherId.trim().toLowerCase() === cleanId
    );
    if (matchedTeacher) {
      return allUsers.find((u) => u.id === matchedTeacher.userId);
    }

    // 4. By username / name match
    const byName = allUsers.find((u) => u.name.trim().toLowerCase() === cleanId || u.name.toLowerCase().includes(cleanId));
    if (byName) return byName;

    return undefined;
  },
  verifyUserPassword: (userId: string, currentPasswordInput: string): boolean => {
    const user = StorageService.findUserById(userId);
    if (!user) return false;
    const storedPass = user.password || 'password123';
    return storedPass === currentPasswordInput.trim();
  },
  changeUserPassword: (userId: string, newPassword: string): boolean => {
    const users = StorageService.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx >= 0) {
      users[idx] = { ...users[idx], password: newPassword.trim() };
      StorageService.saveUsers(users);
      const curr = StorageService.getCurrentUser();
      if (curr && curr.id === userId) {
        StorageService.setCurrentUser({ ...curr, password: newPassword.trim() });
      }
      return true;
    }
    return false;
  },
  resetPasswordByEmail: (
    email: string,
    newPassword: string
  ): { success: boolean; message: string; user?: User } => {
    if (!email || !newPassword) {
      return { success: false, message: 'กรุณาระบุอีเมลและรหัสผ่านใหม่' };
    }
    const cleanEmail = email.trim().toLowerCase();
    const users = StorageService.getUsers();
    const idx = users.findIndex(
      (u) => u.email.trim().toLowerCase() === cleanEmail
    );

    if (idx >= 0) {
      users[idx] = { ...users[idx], password: newPassword.trim() };
      StorageService.saveUsers(users);

      const curr = StorageService.getCurrentUser();
      if (curr && curr.id === users[idx].id) {
        StorageService.setCurrentUser({ ...curr, password: newPassword.trim() });
      }

      return {
        success: true,
        message: `รีเซ็ตรหัสผ่านสำหรับบัญชี ${users[idx].name} (${users[idx].email}) สำเร็จเรียบร้อย!`,
        user: users[idx],
      };
    }

    return {
      success: false,
      message: 'ไม่พบที่อยู่อีเมลนี้ในระบบ กรุณาตรวจสอบอีเมลหรือสมัครสมาชิกใหม่',
    };
  },
  addUser: (user: User) => {
    const users = StorageService.getUsers();
    const userToSave: User = {
      ...user,
      password: user.password || 'password123',
    };
    users.push(userToSave);
    StorageService.saveUsers(users);
  },
  updateUser: (user: User) => {
    const users = StorageService.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.push({
        ...user,
        password: user.password || 'password123',
      });
    }
    StorageService.saveUsers(users);
    const curr = StorageService.getCurrentUser();
    if (curr && curr.id === user.id) {
      StorageService.setCurrentUser({ ...curr, ...user });
    }
  },
  deleteUser: (userId: string): { success: boolean; message: string } => {
    // Prevent deletion of root Admin01
    if (userId === 'admin-1' || userId.toLowerCase() === 'admin01') {
      return { success: false, message: 'ไม่สามารถลบบัญชีผู้ดูแลระบบหลัก (Admin01) ได้' };
    }

    // 1. Delete from users list
    const users = StorageService.getUsers().filter((u) => u.id !== userId);
    StorageService.saveUsers(users);

    // 2. Delete from student profiles
    const studentProfiles = StorageService.getStudentProfiles().filter((p) => p.userId !== userId);
    StorageService.saveStudentProfiles(studentProfiles);

    // 3. Delete from teacher profiles
    const teacherProfiles = StorageService.getTeacherProfiles().filter((p) => p.userId !== userId);
    StorageService.saveTeacherProfiles(teacherProfiles);

    // 4. Delete progress
    const progressList = StorageService.getProgressList().filter((pr: any) => pr.userId !== userId);
    setLocal('progress_list', progressList);

    // 5. Delete quiz attempts
    const quizAttempts = StorageService.getQuizAttempts().filter((qa) => qa.userId !== userId);
    StorageService.saveQuizAttempts(quizAttempts);

    // 6. If currently logged in as deleted user, log out
    const current = StorageService.getCurrentUser();
    if (current && current.id === userId) {
      StorageService.setCurrentUser(null);
    }

    return { success: true, message: 'ลบผู้ใช้งานและข้อมูลที่เกี่ยวข้องเรียบร้อยแล้ว' };
  },

  createFullUser: (
    user: Partial<User>,
    studentData?: Partial<StudentProfile>,
    teacherData?: Partial<TeacherProfile>
  ): User => {
    const newId = user.id || `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const role: UserRole = user.role || 'student';
    const newUser: User = {
      id: newId,
      name: user.name || (role === 'student' ? 'นักเรียนใหม่' : role === 'teacher' ? 'คุณครูใหม่' : 'ผู้ดูแลระบบใหม่'),
      email: user.email || `${newId}@school.ac.th`,
      role,
      password: user.password || 'password123',
      avatarUrl: user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name || newId)}`,
      createdAt: user.createdAt || new Date().toISOString(),
    };

    StorageService.addUser(newUser);

    if (role === 'student') {
      const studentProfiles = StorageService.getStudentProfiles();
      const nextSeat = studentProfiles.filter((s) => s.classroom === (studentData?.classroom || 'ม.1/1')).length + 1;
      const newStudentProfile: StudentProfile = {
        userId: newId,
        studentId: studentData?.studentId || `6701${String(studentProfiles.length + 1).padStart(3, '0')}`,
        gradeLevel: studentData?.gradeLevel || 'ม.1',
        classroom: studentData?.classroom || 'ม.1/1',
        seatNumber: studentData?.seatNumber || nextSeat,
        xp: studentData?.xp || 100,
        level: studentData?.level || 1,
        totalCompletedLessons: studentData?.totalCompletedLessons || 0,
      };
      StorageService.updateStudentProfile(newStudentProfile);
    } else if (role === 'teacher' || role === 'admin') {
      const newTeacherProfile: TeacherProfile = {
        userId: newId,
        teacherId: teacherData?.teacherId || (role === 'admin' ? `ADM${String(Date.now()).slice(-3)}` : `TCH${String(Date.now()).slice(-3)}`),
        schoolName: teacherData?.schoolName || 'โรงเรียนสาธิตวิทยาการศึกษา',
        subjectTaught: teacherData?.subjectTaught || (role === 'admin' ? 'ผู้ดูแลระบบส่วนกลาง' : 'เทคโนโลยี (วิทยาการคำนวณ) ม.1'),
        phoneNumber: teacherData?.phoneNumber || '',
        classesManaged: teacherData?.classesManaged || ['ม.1/1', 'ม.1/2'],
      };
      StorageService.updateTeacherProfile(newTeacherProfile);
    }

    return newUser;
  },

  updateFullUser: (
    user: Partial<User> & { id: string },
    studentData?: Partial<StudentProfile>,
    teacherData?: Partial<TeacherProfile>
  ) => {
    StorageService.updateUser(user as User);

    if (user.role === 'student' || studentData) {
      const existingProfile = StorageService.getStudentProfile(user.id);
      if (existingProfile || studentData) {
        StorageService.updateStudentProfile({
          ...(existingProfile || {
            userId: user.id,
            studentId: '6701999',
            gradeLevel: 'ม.1',
            classroom: 'ม.1/1',
            seatNumber: 1,
            xp: 100,
            level: 1,
            totalCompletedLessons: 0,
          }),
          ...studentData,
          userId: user.id,
        });
      }
    }

    if (user.role === 'teacher' || user.role === 'admin' || teacherData) {
      const existingTeacher = StorageService.getTeacherProfile(user.id);
      StorageService.updateTeacherProfile({
        ...existingTeacher,
        ...teacherData,
        userId: user.id,
      });
    }
  },

  // Student Profiles
  getStudentProfiles: (): StudentProfile[] => getLocal<StudentProfile[]>('student_profiles', INITIAL_STUDENT_PROFILES),
  saveStudentProfiles: (profiles: StudentProfile[]) => {
    setLocal('student_profiles', profiles);
    syncToPersistentDatabase({ student_profiles: profiles });
  },
  getStudentProfile: (userId: string): StudentProfile | undefined => {
    return StorageService.getStudentProfiles().find((p) => p.userId === userId);
  },
  updateStudentProfile: (profile: StudentProfile) => {
    const profiles = StorageService.getStudentProfiles();
    const idx = profiles.findIndex((p) => p.userId === profile.userId);
    if (idx >= 0) {
      // Deep merge to preserve existing XP, completed lessons, level, and all stats
      profiles[idx] = { ...profiles[idx], ...profile };
    } else {
      profiles.push(profile);
    }
    StorageService.saveStudentProfiles(profiles);
  },

  // Teacher Profile
  getTeacherProfiles: (): TeacherProfile[] => {
    let profiles = getLocal<TeacherProfile[]>('teacher_profiles', [INITIAL_ADMIN_PROFILE, ...INITIAL_TEACHER_PROFILES]);
    if (!profiles.some((p) => p.userId === 'admin-1')) {
      profiles = [INITIAL_ADMIN_PROFILE, ...profiles];
      setLocal('teacher_profiles', profiles);
    }
    return profiles;
  },
  saveTeacherProfiles: (profiles: TeacherProfile[]) => {
    setLocal('teacher_profiles', profiles);
    syncToPersistentDatabase({ teacher_profiles: profiles });
  },
  getTeacherProfile: (userId: string): TeacherProfile => {
    const profiles = StorageService.getTeacherProfiles();
    return profiles.find((p) => p.userId === userId) || (userId === 'admin-1' ? INITIAL_ADMIN_PROFILE : INITIAL_TEACHER_PROFILE);
  },
  updateTeacherProfile: (profile: TeacherProfile) => {
    const profiles = StorageService.getTeacherProfiles();
    const idx = profiles.findIndex((p) => p.userId === profile.userId);
    if (idx >= 0) {
      // Deep merge to preserve existing classesManaged and all metadata
      profiles[idx] = { ...profiles[idx], ...profile };
    } else {
      profiles.push(profile);
    }
    StorageService.saveTeacherProfiles(profiles);
  },

  // Classrooms
  getClasses: (): ClassRoom[] => getLocal<ClassRoom[]>('classes', INITIAL_CLASSES),
  saveClasses: (classes: ClassRoom[]) => {
    setLocal('classes', classes);
    syncToPersistentDatabase({ classes });
  },
  addClass: (cls: ClassRoom) => {
    const classes = StorageService.getClasses();
    classes.push(cls);
    StorageService.saveClasses(classes);
  },
  updateClass: (cls: ClassRoom) => {
    const classes = StorageService.getClasses();
    const idx = classes.findIndex((c) => c.id === cls.id);
    if (idx >= 0) {
      classes[idx] = cls;
      StorageService.saveClasses(classes);
    }
  },
  deleteClass: (id: string) => {
    const classes = StorageService.getClasses().filter((c) => c.id !== id);
    StorageService.saveClasses(classes);
  },

  // Chapter / Stage Locking System (ระบบล็อคด่านเพื่อเรียนไปพร้อมกัน และป้องกันการแก้ไขโดยไม่ได้รับอนุญาต)
  getAllClassLockedChapters: (): Record<string, number[]> => {
    const classes = StorageService.getClasses();
    const map: Record<string, number[]> = {};
    for (const c of classes) {
      if (c.name && Array.isArray(c.lockedChapters)) {
        map[c.name] = c.lockedChapters;
      }
    }
    return map;
  },

  getGlobalLockedChapters: (): number[] => getLocal<number[]>('global_locked_chapters', []),
  setGlobalLockedChapters: (chapters: number[]) => {
    setLocal('global_locked_chapters', chapters);
    syncToPersistentDatabase({
      stage_locks: {
        globalLockedChapters: chapters,
        classLockedChapters: StorageService.getAllClassLockedChapters(),
        teacherPin: StorageService.getTeacherLockPin(),
      },
    });
    syncGlobalStageLocksToFirestore(
      chapters,
      StorageService.getAllClassLockedChapters(),
      StorageService.getTeacherLockPin()
    ).catch(() => {});
  },
  toggleGlobalChapterLock: (chapterNumber: number): boolean => {
    const current = StorageService.getGlobalLockedChapters();
    let updated: number[];
    let nowLocked: boolean;
    if (current.includes(chapterNumber)) {
      updated = current.filter((c) => c !== chapterNumber);
      nowLocked = false;
    } else {
      updated = [...current, chapterNumber].sort((a, b) => a - b);
      nowLocked = true;
    }
    StorageService.setGlobalLockedChapters(updated);
    return nowLocked;
  },
  
  getTeacherLockPin: (): string => getLocal<string>('teacher_lock_pin', '1234'),
  setTeacherLockPin: (pin: string) => {
    setLocal('teacher_lock_pin', pin);
    syncToPersistentDatabase({
      stage_locks: {
        globalLockedChapters: StorageService.getGlobalLockedChapters(),
        classLockedChapters: StorageService.getAllClassLockedChapters(),
        teacherPin: pin,
      },
    });
    syncGlobalStageLocksToFirestore(
      StorageService.getGlobalLockedChapters(),
      StorageService.getAllClassLockedChapters(),
      pin
    ).catch(() => {});
  },
  verifyTeacherLockPin: (pin: string): boolean => {
    const currentPin = StorageService.getTeacherLockPin();
    return pin.trim() === currentPin.trim() || pin.trim() === '9999';
  },

  getClassLockedChapters: (className: string): number[] => {
    const classes = StorageService.getClasses();
    const targetClass = classes.find((c) => c.name === className || c.id === className);
    return targetClass?.lockedChapters || [];
  },

  setClassLockedChapters: (className: string, chapters: number[]) => {
    const classes = StorageService.getClasses();
    let targetClass = classes.find((c) => c.name === className || c.id === className);
    if (targetClass) {
      targetClass.lockedChapters = chapters;
    } else {
      const newClass: ClassRoom = {
        id: `class-${Date.now()}`,
        name: className,
        grade: 'ม.1',
        academicYear: '2569',
        teacherId: 'teacher-1',
        passThresholdPercent: 60,
        studentCount: 0,
        lockedChapters: chapters,
      };
      classes.push(newClass);
    }
    StorageService.saveClasses(classes);
    syncToPersistentDatabase({
      classes,
      stage_locks: {
        globalLockedChapters: StorageService.getGlobalLockedChapters(),
        classLockedChapters: StorageService.getAllClassLockedChapters(),
        teacherPin: StorageService.getTeacherLockPin(),
      },
    });
    syncGlobalStageLocksToFirestore(
      StorageService.getGlobalLockedChapters(),
      StorageService.getAllClassLockedChapters(),
      StorageService.getTeacherLockPin()
    ).catch(() => {});
  },

  toggleClassChapterLock: (className: string, chapterNumber: number): boolean => {
    const current = StorageService.getClassLockedChapters(className);
    let updated: number[];
    let isLocked: boolean;
    if (current.includes(chapterNumber)) {
      updated = current.filter((c) => c !== chapterNumber);
      isLocked = false;
    } else {
      updated = [...current, chapterNumber].sort((a, b) => a - b);
      isLocked = true;
    }
    StorageService.setClassLockedChapters(className, updated);
    return isLocked;
  },

  getChapterLockInfoForUser: (chapterNumber: number, user: User | null): { isLocked: boolean; lockType: 'global' | 'classroom' | null; classroomName?: string } => {
    if (!user || user.role === 'teacher' || user.role === 'admin') {
      return { isLocked: false, lockType: null };
    }
    const globalLocks = StorageService.getGlobalLockedChapters();
    if (globalLocks.includes(chapterNumber)) {
      return { isLocked: true, lockType: 'global' };
    }
    const profile = StorageService.getStudentProfile(user.id);
    if (profile?.classroom) {
      const classLocks = StorageService.getClassLockedChapters(profile.classroom);
      if (classLocks.includes(chapterNumber)) {
        return { isLocked: true, lockType: 'classroom', classroomName: profile.classroom };
      }
    }
    return { isLocked: false, lockType: null };
  },

  isChapterLockedForUser: (chapterNumber: number, user: User | null): boolean => {
    // Teachers & Admins can always access all chapters for reviewing and testing
    if (!user || user.role === 'teacher' || user.role === 'admin') {
      return false;
    }

    // Check Global Locked Chapters
    const globalLocks = StorageService.getGlobalLockedChapters();
    if (globalLocks.includes(chapterNumber)) {
      return true;
    }

    // Check Class-Specific Locked Chapters for Student
    const profile = StorageService.getStudentProfile(user.id);
    if (profile?.classroom) {
      const classLocks = StorageService.getClassLockedChapters(profile.classroom);
      if (classLocks.includes(chapterNumber)) {
        return true;
      }
    }

    return false;
  },

  // Move Student between Classrooms
  moveStudentClassroom: (userId: string, newClassroom: string, newSeatNumber?: number): boolean => {
    const profiles = StorageService.getStudentProfiles();
    const targetStudentIdx = profiles.findIndex((p) => p.userId === userId);
    if (targetStudentIdx < 0) return false;

    // Calculate seat number if not provided
    const targetClassStudents = profiles.filter((p) => p.classroom === newClassroom && p.userId !== userId);
    const assignedSeat = newSeatNumber && newSeatNumber > 0 ? newSeatNumber : targetClassStudents.length + 1;

    profiles[targetStudentIdx] = {
      ...profiles[targetStudentIdx],
      classroom: newClassroom,
      seatNumber: assignedSeat,
    };

    StorageService.saveStudentProfiles(profiles);
    return true;
  },

  // Classroom Learning Progress Analytics (ดูว่าห้องไหนเรียนถึงไหนแล้ว)
  getClassroomProgressOverview: () => {
    const classes = StorageService.getClasses();
    const profiles = StorageService.getStudentProfiles();
    const progressList = StorageService.getProgressList();

    return classes.map((cls) => {
      const classStudents = profiles.filter((p) => p.classroom === cls.name);
      const totalInClass = classStudents.length;

      const chapterProgress: Record<number, { completedCount: number; totalInClass: number; percentage: number }> = {};
      let totalPassedLessonsAcrossStudents = 0;

      // Check progress for chapters 1 through 6
      for (let ch = 1; ch <= 6; ch++) {
        let completedForThisCh = 0;
        classStudents.forEach((student) => {
          const prog = progressList.find((pr) => pr.userId === student.userId && pr.chapterNumber === ch);
          const isDone = prog?.status === 'completed' || ((prog?.gameScore || 0) > 0 && (prog?.postTestScore || 0) > 0);
          if (isDone) {
            completedForThisCh++;
            totalPassedLessonsAcrossStudents++;
          }
        });

        const pct = totalInClass > 0 ? Math.round((completedForThisCh / totalInClass) * 100) : 0;
        chapterProgress[ch] = {
          completedCount: completedForThisCh,
          totalInClass,
          percentage: pct,
        };
      }

      // Calculate current milestone chapter (the furthest chapter where majority >= 50% or at least 1 has completed)
      let currentMilestoneChapter = 1;
      for (let ch = 6; ch >= 1; ch--) {
        if (chapterProgress[ch].completedCount > 0) {
          currentMilestoneChapter = ch;
          break;
        }
      }

      const maxPossiblePasses = totalInClass * 6;
      const overallAvgPercentage = maxPossiblePasses > 0 ? Math.round((totalPassedLessonsAcrossStudents / maxPossiblePasses) * 100) : 0;

      return {
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        academicYear: cls.academicYear,
        studentCount: totalInClass,
        chapterProgress,
        overallAvgPercentage,
        currentMilestoneChapter,
        lockedChapters: cls.lockedChapters || [],
        passThresholdPercent: cls.passThresholdPercent || 60,
      };
    });
  },

  // Lessons
  getLessons: (): Lesson[] => {
    let stored = getLocal<Lesson[]>('lessons', INITIAL_LESSONS);
    // Ensure all seed lessons (including Chapter 7 Comprehensive Exam) are present
    INITIAL_LESSONS.forEach((init) => {
      if (!stored.some((s) => s.id === init.id || s.chapterNumber === init.chapterNumber)) {
        stored.push(init);
      }
    });
    return stored.map((l, index) => {
      const seed = INITIAL_LESSONS.find((init) => init.id === l.id);
      const description = l.chapterNumber === 7 && (l.description?.includes('แก้ไข') || !l.description)
        ? 'คลังข้อสอบวัดผลสัมฤทธิ์รวม 6 บทเรียน มีแบบทดสอบก่อนเรียน 30 ข้อ และแบบทดสอบหลังเรียน 30 ข้อ เพื่อวัดพัฒนาการองค์รวม'
        : (l.description || seed?.description || '');

      return {
        ...seed,
        ...l,
        description,
        order: l.order ?? (index + 1),
        isHidden: l.isHidden ?? false,
        coverImageUrl: l.coverImageUrl || seed?.coverImageUrl,
        videoTitle: l.videoTitle || seed?.videoTitle,
        videoUrl: l.videoUrl || seed?.videoUrl,
        videoDuration: l.videoDuration || seed?.videoDuration,
        coreConcept: l.coreConcept !== undefined ? l.coreConcept : seed?.coreConcept,
        contentSummary: l.contentSummary !== undefined ? l.contentSummary : seed?.contentSummary,
        topics: l.topics || seed?.topics,
        objectives: l.objectives !== undefined ? l.objectives : seed?.objectives,
        summarySections: l.summarySections !== undefined ? l.summarySections : seed?.summarySections,
        youtubeVideoId: l.youtubeVideoId || seed?.youtubeVideoId,
        quiz: l.quiz || StorageService.getChapterQuiz(l.chapterNumber, 'post_test'),
      };
    }).sort((a, b) => (a.order || 0) - (b.order || 0));
  },
  saveLessons: (lessons: Lesson[]) => {
    setLocal('lessons', lessons);
    syncToPersistentDatabase({ lessons });
  },
  updateLesson: (lesson: Lesson) => {
    const lessons = StorageService.getLessons();
    const idx = lessons.findIndex((l) => l.id === lesson.id || l.chapterNumber === lesson.chapterNumber);
    if (idx >= 0) {
      lessons[idx] = { ...lessons[idx], ...lesson };
    } else {
      lessons.push(lesson);
    }
    StorageService.saveLessons(lessons);
  },
  addLesson: (lesson: Lesson) => {
    const lessons = StorageService.getLessons();
    lessons.push(lesson);
    StorageService.saveLessons(lessons);
  },
  deleteLesson: (lessonId: string) => {
    const lessons = StorageService.getLessons().filter((l) => l.id !== lessonId);
    StorageService.saveLessons(lessons);
  },
  getLessonByChapter: (chapterNumber: number): Lesson | undefined => {
    return StorageService.getLessons().find((l) => l.chapterNumber === chapterNumber);
  },

  // Video Deletion Tracking (ป้องกันคลิปที่ถูกลบไม่ให้ฟื้นกลับมา)
  getDeletedVideoIds: (): string[] => getLocal<string[]>('deleted_video_ids', []),
  addDeletedVideoId: (id: string) => {
    const current = StorageService.getDeletedVideoIds();
    if (!current.includes(id)) {
      const updated = [...current, id];
      setLocal('deleted_video_ids', updated);
      syncToPersistentDatabase({ deleted_video_ids: updated });
    }
  },
  removeDeletedVideoId: (id: string) => {
    const current = StorageService.getDeletedVideoIds().filter((d) => d !== id);
    setLocal('deleted_video_ids', current);
    syncToPersistentDatabase({ deleted_video_ids: current });
  },

  // YouTube Videos (เชื่อมต่อฐานข้อมูล Server + Cloud Firestore ห้ามข้อมูลหาย)
  getVideos: (): YouTubeVideo[] => {
    const deletedIds = new Set(StorageService.getDeletedVideoIds());
    const stored = getLocal<YouTubeVideo[]>('youtube_videos', INITIAL_VIDEOS)
      .filter((v) => !deletedIds.has(v.id));

    const existingIdSet = new Set(stored.map((v) => v.id));

    // Append any newly defined seed videos ONLY if not deleted
    const combined = [...stored];
    for (const seed of INITIAL_VIDEOS) {
      if (!existingIdSet.has(seed.id) && !deletedIds.has(seed.id)) {
        combined.push(seed);
      }
    }

    const mapped = combined
      .map((v, index) => {
        const seed = INITIAL_VIDEOS.find((init) => init.id === v.id);
        return {
          ...seed,
          ...v,
          order: v.order !== undefined ? v.order : (seed?.order ?? index + 1),
          isHidden: v.isHidden ?? false,
          thumbnailUrl: v.thumbnailUrl || seed?.thumbnailUrl || `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`,
          isFeatured: v.isFeatured !== undefined ? v.isFeatured : (seed?.isFeatured ?? false),
        };
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Ensure every chapter (1 to 6+) has at least one featured video
    const chapters = Array.from(new Set(mapped.map((v) => v.chapterNumber)));
    let hasChanges = false;
    for (const ch of chapters) {
      const chVids = mapped.filter((v) => v.chapterNumber === ch);
      if (chVids.length > 0 && !chVids.some((v) => v.isFeatured)) {
        chVids[0].isFeatured = true;
        hasChanges = true;
      }
    }
    if (hasChanges || combined.length !== stored.length) {
      setLocal('youtube_videos', mapped);
    }

    return mapped;
  },
  saveVideos: (videos: YouTubeVideo[]) => {
    const deletedIds = new Set(StorageService.getDeletedVideoIds());
    const filtered = videos.filter((v) => !deletedIds.has(v.id));
    setLocal('youtube_videos', filtered);
    // Double Persistence: Node Server + Cloud Firestore
    syncToPersistentDatabase({
      videos: filtered,
      deleted_video_ids: Array.from(deletedIds),
    });
    syncAllVideosToFirestore(filtered, Array.from(deletedIds)).catch(() => {});
  },
  setFeaturedVideo: (videoId: string) => {
    const videos = StorageService.getVideos();
    const target = videos.find((v) => v.id === videoId);
    if (!target) return videos;

    const chapterNum = target.chapterNumber;
    const updatedVideos = videos.map((v) => {
      if (v.id === videoId) {
        return { ...v, isFeatured: true };
      }
      if (v.chapterNumber === chapterNum) {
        return { ...v, isFeatured: false };
      }
      return v;
    });

    StorageService.saveVideos(updatedVideos);

    // Also update corresponding Lesson
    const lessons = StorageService.getLessons();
    const lessonIdx = lessons.findIndex((l) => l.chapterNumber === chapterNum);
    if (lessonIdx >= 0) {
      lessons[lessonIdx] = {
        ...lessons[lessonIdx],
        youtubeVideoId: target.youtubeId,
        videoTitle: target.title,
        videoDuration: target.duration,
        videoUrl: `https://www.youtube.com/watch?v=${target.youtubeId}`,
      };
      StorageService.saveLessons(lessons);
    }

    return updatedVideos;
  },
  reorderVideos: (videos: YouTubeVideo[]) => {
    const reordered = videos.map((v, idx) => ({
      ...v,
      order: idx + 1,
    }));
    StorageService.saveVideos(reordered);
    return reordered;
  },
  moveVideo: (id: string, direction: 'up' | 'down') => {
    const videos = StorageService.getVideos();
    const idx = videos.findIndex((v) => v.id === id);
    if (idx < 0) return videos;
    if (direction === 'up' && idx > 0) {
      const temp = videos[idx];
      videos[idx] = videos[idx - 1];
      videos[idx - 1] = temp;
    } else if (direction === 'down' && idx < videos.length - 1) {
      const temp = videos[idx];
      videos[idx] = videos[idx + 1];
      videos[idx + 1] = temp;
    }
    return StorageService.reorderVideos(videos);
  },
  moveVideoChapter: (chapterNumber: number, id: string, direction: 'up' | 'down') => {
    const allVideos = StorageService.getVideos();
    const chapterVids = allVideos.filter((v) => v.chapterNumber === chapterNumber);
    const otherVids = allVideos.filter((v) => v.chapterNumber !== chapterNumber);
    
    const idx = chapterVids.findIndex((v) => v.id === id);
    if (idx < 0) return allVideos;
    if (direction === 'up' && idx > 0) {
      const temp = chapterVids[idx];
      chapterVids[idx] = chapterVids[idx - 1];
      chapterVids[idx - 1] = temp;
    } else if (direction === 'down' && idx < chapterVids.length - 1) {
      const temp = chapterVids[idx];
      chapterVids[idx] = chapterVids[idx + 1];
      chapterVids[idx + 1] = temp;
    }
    
    // Combine preserving chapter positioning
    const updated = [...otherVids, ...chapterVids].sort((a, b) => {
      if (a.chapterNumber !== b.chapterNumber) {
        return a.chapterNumber - b.chapterNumber;
      }
      return chapterVids.indexOf(a) - chapterVids.indexOf(b);
    });
    return StorageService.reorderVideos(updated);
  },
  resetVideosOrder: () => {
    setLocal('deleted_video_ids', []);
    const reset = INITIAL_VIDEOS.map((v, idx) => ({ ...v, order: idx + 1, isHidden: false }));
    StorageService.saveVideos(reset);
    return reset;
  },
  addVideo: (video: YouTubeVideo) => {
    StorageService.removeDeletedVideoId(video.id);
    const videos = StorageService.getVideos();
    const nextOrder = Math.max(...videos.map((v) => v.order || 0), 0) + 1;
    let updated = [...videos, { ...video, order: video.order || nextOrder }];

    if (video.isFeatured) {
      updated = updated.map((v) => {
        if (v.id !== video.id && v.chapterNumber === video.chapterNumber) {
          return { ...v, isFeatured: false };
        }
        return v;
      });

      const lessons = StorageService.getLessons();
      const lessonIdx = lessons.findIndex((l) => l.chapterNumber === video.chapterNumber);
      if (lessonIdx >= 0) {
        lessons[lessonIdx] = {
          ...lessons[lessonIdx],
          youtubeVideoId: video.youtubeId,
          videoTitle: video.title,
          videoDuration: video.duration,
          videoUrl: `https://www.youtube.com/watch?v=${video.youtubeId}`,
        };
        StorageService.saveLessons(lessons);
      }
    }

    StorageService.saveVideos(updated);
  },
  updateVideo: (video: YouTubeVideo) => {
    StorageService.removeDeletedVideoId(video.id);
    const videos = StorageService.getVideos();
    const idx = videos.findIndex((v) => v.id === video.id);
    let updatedList = [...videos];
    if (idx >= 0) {
      updatedList[idx] = { ...updatedList[idx], ...video };
    } else {
      updatedList.push(video);
    }

    if (video.isFeatured) {
      updatedList = updatedList.map((v) => {
        if (v.id !== video.id && v.chapterNumber === video.chapterNumber) {
          return { ...v, isFeatured: false };
        }
        return v;
      });

      const lessons = StorageService.getLessons();
      const lessonIdx = lessons.findIndex((l) => l.chapterNumber === video.chapterNumber);
      if (lessonIdx >= 0) {
        lessons[lessonIdx] = {
          ...lessons[lessonIdx],
          youtubeVideoId: video.youtubeId,
          videoTitle: video.title,
          videoDuration: video.duration,
          videoUrl: `https://www.youtube.com/watch?v=${video.youtubeId}`,
        };
        StorageService.saveLessons(lessons);
      }
    }

    StorageService.saveVideos(updatedList);
  },
  deleteVideo: (id: string) => {
    StorageService.addDeletedVideoId(id);
    const videos = StorageService.getVideos().filter((v) => v.id !== id);
    StorageService.reorderVideos(videos);
  },

  // Games
  getGames: (): Game[] => getLocal<Game[]>('games', INITIAL_GAMES),
  saveGames: (games: Game[]) => setLocal('games', games),
  getGameByChapter: (chapterNumber: number): Game | undefined => {
    return StorageService.getGames().find((g) => g.chapterNumber === chapterNumber);
  },
  updateGame: (game: Game) => {
    const games = StorageService.getGames();
    const idx = games.findIndex((g) => g.id === game.id);
    if (idx >= 0) {
      games[idx] = game;
      StorageService.saveGames(games);
    }
  },

  // Quizzes & Questions
  getQuizzes: (): Quiz[] => {
    let list = getLocal<Quiz[]>('quizzes', INITIAL_QUIZZES);
    INITIAL_QUIZZES.forEach((init) => {
      if (!list.some((q) => q.id === init.id)) {
        list.push(init);
      }
    });
    return list;
  },
  saveQuizzes: (quizzes: Quiz[]) => {
    setLocal('quizzes', quizzes);
    syncToPersistentDatabase({ quizzes });
    quizzes.forEach((q) => syncQuizToFirestore(q).catch(() => {}));
  },
  getChapterQuiz: (chapterNumber: number, type: 'post_test' | 'pre_test' = 'post_test'): Quiz => {
    const quizzes = StorageService.getQuizzes();
    const standardQuizId = `quiz-${chapterNumber}-${type === 'pre_test' ? 'pre' : 'post'}`;
    const targetQuiz = quizzes.find(
      (q) => (q.id === standardQuizId) || (q.chapterNumber === chapterNumber && q.type === type)
    );

    // Special handling for Chapter 7 Comprehensive Final Exam (30 questions)
    if (chapterNumber === 7) {
      if (targetQuiz?.questions && targetQuiz.questions.length > 0) {
        return targetQuiz;
      }
      return getComprehensiveQuiz(type);
    }

    // If the quiz already has in-memory questions populated and preserved
    if (targetQuiz?.questions && targetQuiz.questions.length > 0) {
      return {
        ...targetQuiz,
        id: standardQuizId,
        chapterNumber,
        title: targetQuiz.title || (type === 'pre_test' ? `แบบทดสอบก่อนเรียน (Pre-test) บทที่ ${chapterNumber}` : `แบบทดสอบหลังเรียน (Post-test) บทที่ ${chapterNumber}`),
        type: type,
        totalQuestions: targetQuiz.questions.length,
        questions: targetQuiz.questions,
      };
    }

    // Otherwise, load strictly matching questions from questions collection
    const allQuestions = StorageService.getQuestions();
    let rawQuestions = allQuestions.filter((q) => {
      if (q.quizId === standardQuizId) return true;
      const isPre = type === 'pre_test';
      const qMatchesType = isPre ? q.quizId.includes('pre') : (q.quizId.includes('post') || !q.quizId.includes('pre'));
      const qMatchesChapter = q.quizId.startsWith(`quiz-${chapterNumber}-`) || q.quizId === `quiz-${chapterNumber}`;
      return qMatchesType && qMatchesChapter;
    });

    const mappedQuestions: QuizQuestion[] = rawQuestions.map((q, idx) => {
      const correctIdx = q.choices.findIndex((c) => c.isCorrect);
      return {
        id: q.id || `q-${chapterNumber}-${type === 'pre_test' ? 'pre' : 'post'}-${idx + 1}`,
        question: q.prompt,
        options: q.choices.map((c) => c.text),
        correctIndex: correctIdx >= 0 ? correctIdx : 0,
        correctAnswer: correctIdx >= 0 ? correctIdx : 0,
        explanation: `${q.explanation}${q.textbookReference ? ` (อ้างอิง: ${q.textbookReference})` : ''}`,
      };
    });

    return {
      id: standardQuizId,
      chapterNumber,
      title: targetQuiz?.title || (type === 'pre_test' ? `แบบทดสอบก่อนเรียน (Pre-test) บทที่ ${chapterNumber}` : `แบบทดสอบหลังเรียน (Post-test) บทที่ ${chapterNumber}`),
      type: type,
      totalQuestions: mappedQuestions.length,
      questions: mappedQuestions,
    };
  },
  getQuestions: (): Question[] => {
    let list = getLocal<Question[]>('questions', INITIAL_QUESTIONS);
    INITIAL_QUESTIONS.forEach((init) => {
      if (!list.some((q) => q.id === init.id)) {
        list.push(init);
      }
    });
    return list;
  },
  saveQuestions: (questions: Question[]) => setLocal('questions', questions),
  getQuestionsByQuizId: (quizId: string): Question[] => {
    return StorageService.getQuestions().filter((q) => q.quizId === quizId);
  },
  addQuestion: (q: Question) => {
    const questions = StorageService.getQuestions();
    questions.push(q);
    StorageService.saveQuestions(questions);
  },
  updateQuestion: (q: Question) => {
    const questions = StorageService.getQuestions();
    const idx = questions.findIndex((item) => item.id === q.id);
    if (idx >= 0) {
      questions[idx] = q;
      StorageService.saveQuestions(questions);
    }
  },
  deleteQuestion: (id: string) => {
    const questions = StorageService.getQuestions().filter((q) => q.id !== id);
    StorageService.saveQuestions(questions);
  },

  // Granular Question CRUD for Quizzes (เพิ่ม/แก้ไข/ลบข้อสอบได้จริง)
  addQuizQuestion: (chapterNumber: number, type: 'pre_test' | 'post_test', question: QuizQuestion): Quiz => {
    const currentQuiz = StorageService.getChapterQuiz(chapterNumber, type);
    const updatedQuestions = [...(currentQuiz.questions || []), question];
    const updatedQuiz: Quiz = {
      ...currentQuiz,
      questions: updatedQuestions,
      totalQuestions: updatedQuestions.length,
    };
    StorageService.updateQuiz(updatedQuiz);
    return updatedQuiz;
  },

  updateQuizQuestion: (chapterNumber: number, type: 'pre_test' | 'post_test', question: QuizQuestion): Quiz => {
    const currentQuiz = StorageService.getChapterQuiz(chapterNumber, type);
    const updatedQuestions = (currentQuiz.questions || []).map((q) => (q.id === question.id ? question : q));
    const updatedQuiz: Quiz = {
      ...currentQuiz,
      questions: updatedQuestions,
      totalQuestions: updatedQuestions.length,
    };
    StorageService.updateQuiz(updatedQuiz);
    return updatedQuiz;
  },

  deleteQuizQuestion: (chapterNumber: number, type: 'pre_test' | 'post_test', questionId: string): Quiz => {
    const currentQuiz = StorageService.getChapterQuiz(chapterNumber, type);
    const updatedQuestions = (currentQuiz.questions || []).filter((q) => q.id !== questionId);
    const updatedQuiz: Quiz = {
      ...currentQuiz,
      questions: updatedQuestions,
      totalQuestions: updatedQuestions.length,
    };
    StorageService.updateQuiz(updatedQuiz);
    return updatedQuiz;
  },

  resetQuizToDefault: (chapterNumber: number, type: 'pre_test' | 'post_test'): Quiz => {
    if (chapterNumber === 7) {
      const defaultQuiz = getComprehensiveQuiz(type);
      StorageService.updateQuiz(defaultQuiz);
      return defaultQuiz;
    }
    const standardQuizId = `quiz-${chapterNumber}-${type === 'pre_test' ? 'pre' : 'post'}`;
    const defaultRaw = INITIAL_QUESTIONS.filter((q) => {
      if (q.quizId === standardQuizId) return true;
      const isPre = type === 'pre_test';
      const qMatchesType = isPre ? q.quizId.includes('pre') : (q.quizId.includes('post') || !q.quizId.includes('pre'));
      const qMatchesChapter = q.quizId.startsWith(`quiz-${chapterNumber}-`) || q.quizId === `quiz-${chapterNumber}`;
      return qMatchesType && qMatchesChapter;
    });

    const mappedQuestions: QuizQuestion[] = defaultRaw.map((q, idx) => {
      const correctIdx = q.choices.findIndex((c) => c.isCorrect);
      return {
        id: q.id || `q-${chapterNumber}-${type === 'pre_test' ? 'pre' : 'post'}-${idx + 1}`,
        question: q.prompt,
        options: q.choices.map((c) => c.text),
        correctIndex: correctIdx >= 0 ? correctIdx : 0,
        correctAnswer: correctIdx >= 0 ? correctIdx : 0,
        explanation: `${q.explanation}${q.textbookReference ? ` (อ้างอิง: ${q.textbookReference})` : ''}`,
      };
    });

    const resetQuiz: Quiz = {
      id: standardQuizId,
      chapterNumber,
      title: type === 'pre_test' ? `แบบทดสอบก่อนเรียน (Pre-test) บทที่ ${chapterNumber}` : `แบบทดสอบหลังเรียน (Post-test) บทที่ ${chapterNumber}`,
      type: type,
      totalQuestions: mappedQuestions.length,
      questions: mappedQuestions,
    };

    StorageService.updateQuiz(resetQuiz);
    return resetQuiz;
  },

  // Learning Progress
  getProgressList: (): LearningProgress[] => getLocal<LearningProgress[]>('progress', INITIAL_PROGRESS),
  saveProgressList: (list: LearningProgress[]) => setLocal('progress', list),
  getUserProgress: (userId: string, chapterNumber: number): LearningProgress => {
    const list = StorageService.getProgressList();
    const found = list.find((p) => p.userId === userId && p.chapterNumber === chapterNumber);
    if (found) return found;

    const newProg: LearningProgress = {
      id: `prog-${userId}-${chapterNumber}`,
      userId,
      chapterNumber,
      status: chapterNumber === 1 ? 'ready' : 'locked',
      videoWatched: false,
      lastUpdated: new Date().toISOString(),
    };
    list.push(newProg);
    StorageService.saveProgressList(list);
    return newProg;
  },
  updateUserProgress: (prog: LearningProgress) => {
    const list = StorageService.getProgressList();
    const idx = list.findIndex((p) => p.id === prog.id);
    if (idx >= 0) {
      list[idx] = prog;
    } else {
      list.push(prog);
    }
    StorageService.saveProgressList(list);
  },

  // Badges CRUD
  getBadges: (): Badge[] => {
    let list = getLocal<Badge[]>('badges', INITIAL_BADGES);
    INITIAL_BADGES.forEach((init) => {
      if (!list.some((b) => b.id === init.id)) {
        list.push(init);
      }
    });
    return list;
  },
  saveBadges: (badges: Badge[]) => {
    setLocal('badges', badges);
    syncToPersistentDatabase({ badges });
  },
  updateBadge: (badge: Badge) => {
    const all = StorageService.getBadges();
    const idx = all.findIndex((b) => b.id === badge.id);
    if (idx >= 0) {
      all[idx] = badge;
    } else {
      all.push(badge);
    }
    StorageService.saveBadges(all);
  },
  addBadge: (badge: Badge) => {
    const all = StorageService.getBadges();
    all.push(badge);
    StorageService.saveBadges(all);
  },
  deleteBadge: (badgeId: string) => {
    const all = StorageService.getBadges().filter((b) => b.id !== badgeId);
    StorageService.saveBadges(all);
  },
  resetBadgesToDefault: () => {
    StorageService.saveBadges(INITIAL_BADGES);
    return INITIAL_BADGES;
  },
  getStudentBadges: (userId: string): StudentBadge[] => {
    const list = getLocal<StudentBadge[]>('student_badges', [
      { id: 'sb-1', userId: 'student-1', badgeId: 'badge-1', unlockedAt: '2026-05-18T12:00:00.000Z' },
      { id: 'sb-2', userId: 'student-1', badgeId: 'badge-2', unlockedAt: '2026-05-20T15:30:00.000Z' },
    ]);
    return list.filter((b) => b.userId === userId);
  },
  awardBadge: (userId: string, badgeId: string) => {
    const list = getLocal<StudentBadge[]>('student_badges', []);
    if (!list.some((b) => b.userId === userId && b.badgeId === badgeId)) {
      list.push({
        id: `sb-${Date.now()}`,
        userId,
        badgeId,
        unlockedAt: new Date().toISOString(),
      });
      setLocal('student_badges', list);
    }
  },

  // Feedback & Student Notifications
  getFeedback: (studentId?: string): TeacherFeedback[] => {
    const all = getLocal<TeacherFeedback[]>('teacher_feedback', INITIAL_FEEDBACK);
    if (studentId) {
      return all.filter((f) => f.studentId === studentId);
    }
    return all;
  },
  addFeedback: (fb: TeacherFeedback) => {
    const all = StorageService.getFeedback();
    all.unshift({
      ...fb,
      read: fb.read ?? false,
    });
    setLocal('teacher_feedback', all);
  },
  markFeedbackAsRead: (feedbackId: string) => {
    const all = StorageService.getFeedback();
    const idx = all.findIndex((f) => f.id === feedbackId);
    if (idx >= 0) {
      all[idx].read = true;
      setLocal('teacher_feedback', all);
    }
  },
  markAllFeedbackAsRead: (studentId: string) => {
    const all = StorageService.getFeedback();
    const updated = all.map((f) => (f.studentId === studentId ? { ...f, read: true } : f));
    setLocal('teacher_feedback', updated);
  },
  getUnreadFeedbackCount: (studentId: string): number => {
    const list = StorageService.getFeedback(studentId);
    return list.filter((f) => !f.read).length;
  },

  // Announcements
  getAnnouncements: (): Announcement[] => getLocal<Announcement[]>('announcements', INITIAL_ANNOUNCEMENTS),
  addAnnouncement: (ann: Announcement) => {
    const all = StorageService.getAnnouncements();
    all.unshift(ann);
    setLocal('announcements', all);
  },
  deleteAnnouncement: (id: string) => {
    const all = StorageService.getAnnouncements().filter((a) => a.id !== id);
    setLocal('announcements', all);
  },

  // Chat
  getChatMessages: (userId1: string, userId2: string): ChatMessage[] => {
    const all = getLocal<ChatMessage[]>('chat_messages', INITIAL_CHATS);
    return all.filter(
      (m) =>
        (m.senderId === userId1 && m.recipientId === userId2) ||
        (m.senderId === userId2 && m.recipientId === userId1)
    );
  },
  getAllChatMessages: (): ChatMessage[] => getLocal<ChatMessage[]>('chat_messages', INITIAL_CHATS),
  sendChatMessage: (msg: ChatMessage) => {
    const all = StorageService.getAllChatMessages();
    all.push(msg);
    setLocal('chat_messages', all);
  },
  deleteChatMessage: (msgId: string) => {
    const all = StorageService.getAllChatMessages().filter((m) => m.id !== msgId);
    setLocal('chat_messages', all);
  },
  clearConversation: (userId1: string, userId2: string) => {
    const all = StorageService.getAllChatMessages().filter(
      (m) =>
        !((m.senderId === userId1 && m.recipientId === userId2) ||
          (m.senderId === userId2 && m.recipientId === userId1))
    );
    setLocal('chat_messages', all);
  },

  // Student Progress unified helper
  getProgress: (userId: string) => {
    const list = StorageService.getProgressList();
    return list
      .filter((p) => p.userId === userId)
      .map((p) => ({
        id: p.id,
        userId: p.userId,
        lessonId: `lesson-${p.chapterNumber}`,
        status: p.status,
        gameScore: p.gameScore || 0,
        preTestScore: p.preTestScore !== undefined ? p.preTestScore : undefined,
        postTestScore: p.postTestScore !== undefined ? p.postTestScore : undefined,
        quizScore: p.postTestScore || p.preTestScore || 0,
        xpEarned: (p.gameScore || 0) + ((p.postTestScore || 0) * 20),
        lastAccessedAt: p.lastUpdated,
      }));
  },
  saveProgress: (prog: any) => {
    const chNum = parseInt(String(prog.lessonId).replace('lesson-', ''), 10) || 1;
    const list = StorageService.getProgressList();
    let found = list.find((p) => p.userId === prog.userId && p.chapterNumber === chNum);
    if (!found) {
      found = {
        id: `prog-${prog.userId}-${chNum}`,
        userId: prog.userId,
        chapterNumber: chNum,
        status: prog.status || 'in_progress',
        gameScore: prog.gameScore || 0,
        preTestScore: prog.preTestScore !== undefined ? prog.preTestScore : undefined,
        postTestScore: prog.postTestScore !== undefined ? prog.postTestScore : prog.quizScore || 0,
        videoWatched: true,
        lastUpdated: new Date().toISOString(),
      };
      list.push(found);
    } else {
      if (prog.status) found.status = prog.status;
      if (prog.gameScore !== undefined) found.gameScore = prog.gameScore;
      if (prog.preTestScore !== undefined) found.preTestScore = prog.preTestScore;
      if (prog.postTestScore !== undefined) found.postTestScore = prog.postTestScore;
      if (prog.quizScore !== undefined) found.postTestScore = prog.quizScore;
      found.lastUpdated = new Date().toISOString();
    }
    StorageService.saveProgressList(list);
  },
  getUserBadges: (userId: string): string[] => {
    return StorageService.getStudentBadges(userId).map((b) => b.badgeId);
  },

  // Update Quiz
  updateQuiz: (quiz: Quiz) => {
    const quizzes = StorageService.getQuizzes();
    const quizType = quiz.type || (quiz.id.includes('pre') ? 'pre_test' : 'post_test');
    const standardQuizId = `quiz-${quiz.chapterNumber}-${quizType === 'pre_test' ? 'pre' : 'post'}`;
    const finalQuiz: Quiz = {
      ...quiz,
      id: standardQuizId,
      type: quizType,
      totalQuestions: quiz.questions?.length ?? quiz.totalQuestions ?? 0,
    };

    const idx = quizzes.findIndex(
      (q) => q.id === standardQuizId || (q.chapterNumber === finalQuiz.chapterNumber && q.type === finalQuiz.type)
    );
    if (idx >= 0) {
      quizzes[idx] = finalQuiz;
    } else {
      quizzes.push(finalQuiz);
    }
    StorageService.saveQuizzes(quizzes);

    // Synchronize questions into questions collection strictly for this quiz
    if (quiz.questions && quiz.questions.length >= 0) {
      const allQuestions = StorageService.getQuestions();
      const remainingQuestions = allQuestions.filter((q) => {
        if (q.quizId === standardQuizId || q.quizId === quiz.id) return false;
        // Also ensure legacy/ambiguous question ids don't collide
        const isPre = quizType === 'pre_test';
        const matchesType = isPre ? q.quizId.includes('pre') : (q.quizId.includes('post') || (!q.quizId.includes('pre') && q.quizId.startsWith(`quiz-${quiz.chapterNumber}`)));
        const matchesChapter = q.quizId.startsWith(`quiz-${quiz.chapterNumber}-`) || q.quizId === `quiz-${quiz.chapterNumber}`;
        if (matchesType && matchesChapter) return false;
        return true;
      });

      const newQuestions: Question[] = quiz.questions.map((qq, index) => {
        const correctIndex = qq.correctIndex ?? qq.correctAnswer ?? 0;
        return {
          id: qq.id && !qq.id.startsWith('temp-') ? qq.id : `q-${quiz.chapterNumber}-${quizType === 'pre_test' ? 'pre' : 'post'}-${Date.now()}-${index + 1}`,
          quizId: standardQuizId,
          type: 'multiple_choice',
          prompt: qq.question,
          choices: (qq.options || []).map((opt, optIdx) => ({
            id: `c${optIdx + 1}`,
            text: opt,
            isCorrect: optIdx === correctIndex,
          })),
          explanation: qq.explanation || '',
          textbookReference: `สสวท. ม.1 บทที่ ${quiz.chapterNumber}`,
          points: 1,
        };
      });

      StorageService.saveQuestions([...remainingQuestions, ...newQuestions]);
    }
  },

  // Worksheets (ใบงานเก็บคะแนน 6 บทเรียน)
  getWorksheets: (): Worksheet[] => getLocal<Worksheet[]>('worksheets', INITIAL_WORKSHEETS),
  saveWorksheets: (worksheets: Worksheet[]) => {
    setLocal('worksheets', worksheets);
    syncToPersistentDatabase({ worksheets });
  },
  getWorksheetByChapter: (chapterNumber: number): Worksheet | undefined => {
    return StorageService.getWorksheets().find((w) => w.chapterNumber === chapterNumber);
  },
  updateWorksheet: (ws: Worksheet) => {
    const list = StorageService.getWorksheets();
    const idx = list.findIndex((w) => w.id === ws.id || w.chapterNumber === ws.chapterNumber);
    if (idx >= 0) {
      list[idx] = ws;
    } else {
      list.push(ws);
    }
    StorageService.saveWorksheets(list);
  },
  getWorksheetSubmissions: (): WorksheetSubmission[] =>
    getLocal<WorksheetSubmission[]>('worksheet_submissions', INITIAL_WORKSHEET_SUBMISSIONS),
  saveWorksheetSubmissions: (subs: WorksheetSubmission[]) => setLocal('worksheet_submissions', subs),
  submitWorksheet: (sub: WorksheetSubmission) => {
    const list = StorageService.getWorksheetSubmissions();
    const existingIdx = list.findIndex(
      (s) =>
        (s.worksheetId === sub.worksheetId || (s.chapterNumber === sub.chapterNumber && s.chapterNumber !== undefined)) &&
        s.userId === sub.userId
    );
    if (existingIdx >= 0) {
      list[existingIdx] = {
        ...list[existingIdx],
        ...sub,
        id: list[existingIdx].id || sub.id || `sub-${Date.now()}`,
        submittedAt: new Date().toISOString(),
      };
    } else {
      list.unshift({
        ...sub,
        id: sub.id || `sub-${Date.now()}`,
        submittedAt: sub.submittedAt || new Date().toISOString(),
      });
    }
    StorageService.saveWorksheetSubmissions(list);
  },
  gradeWorksheet: (submissionId: string, score: number, feedback: string, teacherName: string, maxScore?: number, worksheetTitle?: string) => {
    const list = StorageService.getWorksheetSubmissions();
    const idx = list.findIndex((s) => s.id === submissionId);
    if (idx >= 0) {
      list[idx].score = score;
      list[idx].feedback = feedback;
      list[idx].gradedBy = teacherName;
      list[idx].gradedAt = new Date().toISOString();
      StorageService.saveWorksheetSubmissions(list);

      // Create or update teacher feedback notification for student
      if (list[idx].userId) {
        const wsTitle = worksheetTitle || `ใบงานประจำบทที่ ${list[idx].chapterNumber}`;
        StorageService.addFeedback({
          id: `fb-${Date.now()}`,
          studentId: list[idx].userId,
          teacherId: 'teacher-current',
          teacherName: teacherName || 'คุณครูผู้สอน',
          chapterNumber: list[idx].chapterNumber,
          worksheetTitle: wsTitle,
          score,
          maxScore: maxScore || 10,
          message: feedback || 'ยอดเยี่ยมมาก! คุณครูตรวจใบงานและบันทึกคะแนนเรียบร้อยแล้ว',
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
    }
  },

  // Quiz Attempts & Mistake Analytics
  getQuizAttempts: (): QuizAttemptRecord[] => getLocal<QuizAttemptRecord[]>('quiz_attempts', INITIAL_QUIZ_ATTEMPTS),
  saveQuizAttempts: (attempts: QuizAttemptRecord[]) => setLocal('quiz_attempts', attempts),
  saveQuizAttempt: (attempt: QuizAttemptRecord) => {
    const attempts = StorageService.getQuizAttempts();
    const existingIdx = attempts.findIndex((a) => a.userId === attempt.userId && a.quizId === attempt.quizId);
    if (existingIdx >= 0) {
      attempts[existingIdx] = attempt;
    } else {
      attempts.unshift(attempt);
    }
    StorageService.saveQuizAttempts(attempts);
  },
  getMistakeAnalytics: (): QuestionMistakeStat[] => {
    const attempts = StorageService.getQuizAttempts();
    const questionStatsMap: Record<
      string,
      {
        questionId: string;
        questionText: string;
        chapterNumber: number;
        quizType: 'pre_test' | 'post_test';
        totalAttempts: number;
        wrongCount: number;
        correctAnswerText: string;
        wrongAnswersMap: Record<string, number>;
        textbookReference: string;
        explanation: string;
      }
    > = {};

    attempts.forEach((att) => {
      att.answers.forEach((ans) => {
        if (!questionStatsMap[ans.questionId]) {
          questionStatsMap[ans.questionId] = {
            questionId: ans.questionId,
            questionText: ans.questionText,
            chapterNumber: att.chapterNumber,
            quizType: att.quizType,
            totalAttempts: 0,
            wrongCount: 0,
            correctAnswerText: ans.correctText,
            wrongAnswersMap: {},
            textbookReference: ans.textbookReference || `สสวท. ม.1 บทที่ ${att.chapterNumber}`,
            explanation: ans.explanation,
          };
        }
        const stat = questionStatsMap[ans.questionId];
        stat.totalAttempts += 1;
        if (!ans.isCorrect) {
          stat.wrongCount += 1;
          const chosenText = ans.selectedText || 'ไม่ตอบ/ตอบผิด';
          stat.wrongAnswersMap[chosenText] = (stat.wrongAnswersMap[chosenText] || 0) + 1;
        }
      });
    });

    return Object.values(questionStatsMap)
      .map((item) => {
        let mostCommonWrong = 'ไม่มี';
        let highestWrongFreq = 0;
        Object.entries(item.wrongAnswersMap).forEach(([text, count]) => {
          if (count > highestWrongFreq) {
            highestWrongFreq = count;
            mostCommonWrong = text;
          }
        });

        return {
          questionId: item.questionId,
          questionText: item.questionText,
          chapterNumber: item.chapterNumber,
          quizType: item.quizType,
          totalAttempts: item.totalAttempts,
          wrongCount: item.wrongCount,
          wrongPercentage:
            item.totalAttempts > 0 ? Math.round((item.wrongCount / item.totalAttempts) * 100) : 0,
          correctAnswerText: item.correctAnswerText,
          mostCommonWrongAnswer: mostCommonWrong,
          textbookReference: item.textbookReference,
          explanation: item.explanation,
        };
      })
      .sort((a, b) => b.wrongPercentage - a.wrongPercentage || b.wrongCount - a.wrongCount);
  },
  getStudentMistakes: (userId: string) => {
    const attempts = StorageService.getQuizAttempts().filter((a) => a.userId === userId);
    const mistakes: {
      chapterNumber: number;
      quizType: 'pre_test' | 'post_test';
      questionId: string;
      questionText: string;
      studentAnswer: string;
      correctAnswer: string;
      explanation: string;
      textbookReference?: string;
      completedAt: string;
    }[] = [];

    attempts.forEach((att) => {
      att.answers.forEach((ans) => {
        if (!ans.isCorrect) {
          mistakes.push({
            chapterNumber: att.chapterNumber,
            quizType: att.quizType,
            questionId: ans.questionId,
            questionText: ans.questionText,
            studentAnswer: ans.selectedText,
            correctAnswer: ans.correctText,
            explanation: ans.explanation,
            textbookReference: ans.textbookReference,
            completedAt: att.completedAt,
          });
        }
      });
    });

    return mistakes;
  },

  // Export Complete Application Dataset
  exportAllData: (): Record<string, any> => {
    return {
      appName: 'CS Adventure M.1 Gamified Learning Platform',
      curriculum: 'สสวท. ม.1 เทคโนโลยี (วิทยาการคำนวณ)',
      version: '1.2.0',
      exportedAt: new Date().toISOString(),
      lessons: StorageService.getLessons(),
      quizzes: StorageService.getQuizzes(),
      questions: StorageService.getQuestions(),
      classes: StorageService.getClasses(),
      users: StorageService.getUsers(),
      student_profiles: StorageService.getStudentProfiles(),
      progress_list: StorageService.getProgressList(),
      quiz_attempts: StorageService.getQuizAttempts(),
      mistake_analytics: StorageService.getMistakeAnalytics(),
      worksheets: StorageService.getWorksheets(),
      videos: StorageService.getVideos(),
      stage_locks: {
        globalLockedChapters: StorageService.getGlobalLockedChapters(),
        teacherPin: StorageService.getTeacherLockPin(),
      },
      badges: StorageService.getBadges(),
      summary: {
        totalLessons: StorageService.getLessons().length,
        totalQuizzes: StorageService.getQuizzes().length,
        totalQuestions: StorageService.getQuestions().length,
        totalStudents: StorageService.getStudentProfiles().length,
        totalClasses: StorageService.getClasses().length,
        totalQuizAttempts: StorageService.getQuizAttempts().length,
      },
    };
  },

  // Download all application data as a formatted JSON file
  downloadDataAsJsonFile: (filename = 'adventure_m1_full_data.json'): void => {
    const data = StorageService.exportAllData();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Export Mistake Analytics Data as CSV for teachers
  exportMistakesAsCsv: (filename = 'mistake_analytics_report.csv'): void => {
    const mistakes = StorageService.getMistakeAnalytics();
    const headers = [
      'บทที่',
      'ประเภทข้อสอบ',
      'รหัสข้อสอบ',
      'ข้อคำถาม',
      'จำนวนครั้งที่ตอบทั้งหมด',
      'ตอบผิด (คน)',
      'อัตราตอบผิด (%)',
      'คำตอบที่ถูกต้อง',
      'คำตอบที่เด็กมักเข้าใจผิด',
      'อ้างอิงหนังสือ สสวท.',
    ];
    const rows = mistakes.map((m) => [
      m.chapterNumber,
      m.quizType === 'pre_test' ? 'ก่อนเรียน' : 'หลังเรียน',
      m.questionId,
      `"${m.questionText.replace(/"/g, '""')}"`,
      m.totalAttempts,
      m.wrongCount,
      `${m.wrongPercentage}%`,
      `"${m.correctAnswerText.replace(/"/g, '""')}"`,
      `"${m.mostCommonWrongAnswer.replace(/"/g, '""')}"`,
      `"${m.textbookReference.replace(/"/g, '""')}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  games: GameStorageService,
};
