/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Bot,
  ShieldCheck,
  ShieldAlert,
  Search,
  Share2,
  Copy,
  Check,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Award,
  ChevronRight,
  HelpCircle,
  FolderOpen,
  Terminal,
  Zap,
  Flame,
  UserCheck,
  Radio,
  FileSearch,
  ExternalLink,
  Code
} from 'lucide-react';
import { sfx } from '../../utils/audioEffects';

export interface SummerGameWorld {
  id: string;
  prompt: string;
  author: string;
  createdAt?: string;
  title: string;
  genre: string;
  synopsis: string;
  themeColor: string;
  protagonist: {
    name: string;
    role: string;
    avatarEmoji: string;
    badgeTitle: string;
  };
  hackerAntagonist: {
    name: string;
    alias: string;
    avatarEmoji: string;
    threatLevel: string;
    motive: string;
  };
  characters: Array<{
    id: string;
    name: string;
    role: string;
    avatarEmoji: string;
    description: string;
    hintDialogue: string;
  }>;
  stages: Array<{
    stageNumber: number;
    title: string;
    missionBriefing: string;
    environmentSetting: string;
    evidenceItems: Array<{
      id: string;
      name: string;
      icon: string;
      description: string;
      isSuspicious: boolean;
      analysisResult: string;
    }>;
    investigationPuzzle: {
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
      cyberLawInsight: string;
    };
    choices: Array<{
      label: string;
      text: string;
      outcomeText: string;
      isCorrect: boolean;
      riskLevel: string;
      safetyHpDelta: number;
    }>;
  }>;
  finalConclusion: string;
  badgeReward: string;
  learningOutcomes: string[];
}

interface Game6SummerEngineProps {
  onComplete: (score: number, maxScore: number, xpEarned: number) => void;
  initialGameId?: string;
}

const PRESET_CREATION_PROMPTS = [
  {
    id: 'phishing-detective',
    icon: '🕵️‍♂️',
    title: 'ตามจับแฮกเกอร์ Phishing Email',
    prompt: 'สร้างเกมสืบสวนที่ผู้เล่นต้องตามจับแฮกเกอร์ที่ส่ง Phishing อีเมล',
  },
  {
    id: 'callcenter-scam',
    icon: '🚨',
    title: 'แก๊งคอลเซ็นเตอร์ & หลอกขอ OTP',
    prompt: 'สร้างเกมสืบสวนแกะรอยมิจฉาชีพคอลเซ็นเตอร์ที่โทรมาแอบอ้างเป็นตำรวจแล้วหลอกขอรหัส OTP และโอนเงิน',
  },
  {
    id: 'ransomware-crisis',
    icon: '👾',
    title: 'ปราบ Ransomware ล็อกไฟล์โรงเรียน',
    prompt: 'สร้างเกมผจญภัยไซเบอร์ สืบหาที่มาของมัลแวร์เรียกค่าไถ่ Ransomware ที่แฝงมากับไฟล์การบ้านและล็อกเซิร์ฟเวอร์โรงเรียน',
  },
  {
    id: 'cyberbully-investigation',
    icon: '👥',
    title: 'สืบคดี Cyberbullying & แอคหลุม',
    prompt: 'สร้างเกมสืบสวนหาตัวการสร้างบัญชีอวตารนิรนาม (แอคหลุม) เพื่อโพสต์ประจานและกลั่นแกล้งเพื่อนในโรงเรียนตาม พ.ร.บ.คอมพิวเตอร์',
  },
];

// Fallback Default Game World
const DEFAULT_GAME_WORLD: SummerGameWorld = {
  id: 'GAME-PHISHING-01',
  prompt: 'สร้างเกมสืบสวนที่ผู้เล่นต้องตามจับแฮกเกอร์ที่ส่ง Phishing อีเมล',
  author: 'Summer Engine AI',
  title: 'Cyber Detective: ปฏิบัติการล่าแฮกเกอร์เงา Phishing Email',
  genre: 'สืบสวนสอบสวนไซเบอร์ (Cyber Detective RPG)',
  synopsis: 'เกิดเหตุการณ์นักเรียนและครูในโรงเรียนได้รับอีเมลแจ้งเตือนด่วนว่า "บัญชีถูกระงับ ให้รีบยืนยันตัวตนผ่านลิงก์" ส่งผลให้หลายคนถูกขโมยรหัสผ่าน ผู้เล่นในฐานะสายสืบไซเบอร์ประจำโรงเรียน ต้องลงพื้นที่เก็บหลักฐาน แกะรอยอีเมล และจับกุมแฮกเกอร์ให้ได้!',
  themeColor: 'indigo',
  protagonist: {
    name: 'สารวัตรไซเบอร์ ม.1',
    role: 'หัวหน้าหน่วยสืบสวนเทคโนโลยีสารสนเทศโรงเรียน',
    avatarEmoji: '🕵️‍♂️',
    badgeTitle: 'ผู้พิทักษ์ความปลอดภัยดิจิทัลระดับสูง',
  },
  hackerAntagonist: {
    name: 'ShadowPhisher-X',
    alias: 'เงาทมิฬแห่งดาร์กเว็บ',
    avatarEmoji: '🦹‍♂️',
    threatLevel: 'Critical (วิกฤต)',
    motive: 'หลอกขโมยรหัสผ่านบัญชีโรงเรียนเพื่อนำข้อมูลส่วนบุคคลไปขายในตลาดมืด',
  },
  characters: [
    {
      id: 'c1',
      name: 'ครูสมศักดิ์ ฝ่ายไอที',
      role: 'ผู้ดูแลระบบเครือข่ายโรงเรียน',
      avatarEmoji: '👨‍🏫',
      description: 'ตรวจพบทราฟฟิกผิดปกติในเซิร์ฟเวอร์โรงเรียนช่วงเวลา 02:00 น.',
      hintDialogue: 'อีเมลที่ส่งมาดูเหมือนส่งจากฝ่ายวิชาการ แต่โดเมนด้านหลังสะกดผิดเป็น @schoo1-portal.xyz ครับ!',
    },
    {
      id: 'c2',
      name: 'น้องน้ำหวาน',
      role: 'นักเรียนชั้น ม.1/2 (เหยื่อรายแรก)',
      avatarEmoji: '👩‍🎓',
      description: 'เกือบกดกรอกรหัสผ่านเพราะอีเมลแจ้งว่าจะตัดสิทธิ์สอบ',
      hintDialogue: 'ในอีเมลบอกว่าถ้าไม่กดลิงก์ภายใน 10 นาทีจะถูกระงับบัญชีถาวร หนูตกใจมากเลยค่ะ!',
    },
  ],
  stages: [
    {
      stageNumber: 1,
      title: 'ด่านที่ 1: ตรวจพิสูจน์หลักฐานอีเมลลวงโลก (Phishing Analysis)',
      missionBriefing: 'ผู้เล่นได้รับไฟล์ตัวอย่างอีเมลต้องสงสัย จงตรวจสอบหัวข้อ ที่อยู่อีเมลผู้ส่ง และเนื้อหาเพื่อระบุจุดผิดปกติของฟิชชิ่ง',
      environmentSetting: 'ห้องปฏิบัติการคอมพิวเตอร์และดิจิทัลนิติวิทยาศาสตร์',
      evidenceItems: [
        {
          id: 'ev1',
          name: 'หัวข้อและชื่อผู้ส่ง (Sender Address)',
          icon: '📧',
          description: 'ชื่อผู้ส่งระบุว่า "School Admin Support" แต่อีเมลจริงคือ support@schoo1-portal.xyz (ใช้เลข 1 แทนตัว L)',
          isSuspicious: true,
          analysisResult: 'ตรวจพบเทคนิค Typosquatting (การจดโดเมนสะกดเลียนแบบ) เพื่อหลอกให้เหยื่อตายใจ',
        },
        {
          id: 'ev2',
          name: 'ลิงก์ปุ่มยืนยันตัวตน (Embedded Link)',
          icon: '🔗',
          description: 'เมื่อนำเมาส์ไปชี้ ลิงก์ปลายทางเชื่อมต่อไปยังเว็บ http://free-login-check.com ไม่ใช่เว็บ HTTPS ของโรงเรียน',
          isSuspicious: true,
          analysisResult: 'เป็นเว็บฟิชชิ่งที่ไม่ได้เข้ารหัส SSL (ไม่มีกุญแจเขียว HTTPS) ถูกสร้างขึ้นเพื่อดักจับรหัสผ่าน',
        },
        {
          id: 'ev3',
          name: 'ข้อความสร้างความตื่นตระหนก (Sense of Urgency)',
          icon: '⚠️',
          description: 'ข้อความเขียนว่า "ด่วนที่สุด! หากไม่กรอกข้อมูลภายใน 10 นาที จะถูกลบประวัติการเรียนทั้งหมด"',
          isSuspicious: true,
          analysisResult: 'มิจฉาชีพใช้จิตวิทยาเร่งรัดให้เหยื่อกลัวและรีบทำตามโดยไม่ทันตรวจสอบ',
        },
      ],
      investigationPuzzle: {
        question: 'จากหลักฐานที่ตรวจพบ ข้อใดคือ "สัญญาณเตือนภัยฟิชชิ่ง (Phishing Indicators)" ที่ชัดเจนที่สุด?',
        options: [
          'ชื่อโดเมนผู้ส่งสะกดผิดเพี้ยน และใช้คำข่มขู่ให้รีบกรอกข้อมูลทันที',
          'อีเมลส่งมาในช่วงเวลากลางวันและมีโลโก้โรงเรียน',
          'ข้อความมีการใช้ภาษาไทยที่ถูกต้องทุกตัวอักษร',
          'อีเมลมีขนาดไฟล์เล็กและไม่มีรูปภาพประกอบ',
        ],
        correctIndex: 0,
        explanation: 'ฟิชชิ่งมักใช้การปลอมแปลงชื่อผู้ส่ง (Spoofing/Typosquatting) และสร้างความตื่นตระหนกเร่งด่วนเพื่อบีบให้เหยื่อกรอกข้อมูล',
        cyberLawInsight: 'การสร้างเว็บไซต์หรือส่งข้อความหลอกลวงเพื่อเอาข้อมูลส่วนตัว มีความผิดตาม พ.ร.บ.คอมพิวเตอร์ ม.14 และกฎหมาย PDPA',
      },
      choices: [
        {
          label: 'A',
          text: 'แจ้งเตือนเพื่อนทุกคนในกลุ่มไลน์ และส่งรายงานให้ครูฝ่ายไอทีบล็อกโดเมนนี้ทันที',
          outcomeText: 'ถูกต้องและยอดเยี่ยม! การแจ้งเตือนทันเวลาช่วยป้องกันไม่ให้เพื่อนนักเรียนตกเป็นเหยื่อเพิ่ม',
          isCorrect: true,
          riskLevel: 'LOW',
          safetyHpDelta: 20,
        },
        {
          label: 'B',
          text: 'ลองกดลิงก์เข้าไปดูเฉยๆ แต่ไม่กรอกรหัสผ่าน',
          outcomeText: 'มีความเสี่ยง! เว็บไซต์ฟิชชิ่งบางเว็บอาจมีสคริปต์ Malvertising หรือขโมยคุกกี้เซสชันได้',
          isCorrect: false,
          riskLevel: 'MEDIUM',
          safetyHpDelta: -10,
        },
        {
          label: 'C',
          text: 'ส่งต่ออีเมลนี้ไปให้เพื่อนคนอื่นลองเปิดดูว่าเปิดได้ไหม',
          outcomeText: 'อันตรายมาก! การส่งต่อลิงก์หลอกลวงอาจทำให้ผู้อื่นตกเป็นเหยื่อและเข้าข่ายเผยแพร่ข้อมูลที่เป็นภัย',
          isCorrect: false,
          riskLevel: 'HIGH',
          safetyHpDelta: -25,
        },
      ],
    },
    {
      stageNumber: 2,
      title: 'ด่านที่ 2: แกะรอยดิจิทัลฟุตพริ้นท์ & IP Address (Digital Tracing)',
      missionBriefing: 'ติดตามเส้นทางการเชื่อมต่อของเซิร์ฟเวอร์แฮกเกอร์ผ่านบันทึกจราจรคอมพิวเตอร์ (Log Files) เพื่อหาพิกัดและตัวตน',
      environmentSetting: 'ศูนย์วิเคราะห์ความมั่นคงปลอดภัยไซเบอร์ (SOC)',
      evidenceItems: [
        {
          id: 'ev4',
          name: 'บันทึกเซิร์ฟเวอร์ Log (Access Log)',
          icon: '📜',
          description: 'พบการยิงคำสั่งส่งอีเมลอัตโนมัติจาก IP Address: 198.51.100.42 ผ่าน VPN ต่างประเทศ',
          isSuspicious: true,
          analysisResult: 'แฮกเกอร์ใช้ Proxy/VPN พรางตัว แต่ทิ้งรอยเท้าดิจิทัล (Digital Footprint) ช่วงลืมเปิด VPN ไว้ 1 นาที',
        },
        {
          id: 'ev5',
          name: 'ฐานข้อมูลบัญชีรับโอน (Mule Account)',
          icon: '💳',
          description: 'พบการประกาศขายไฟล์รหัสผ่านในบอร์ดใต้ดิน โดยใช้ชื่อบัญชี "ZeroCool99"',
          isSuspicious: true,
          analysisResult: 'เป็นชื่อเดียวกับที่เคยสมัครใช้ในเว็บบอร์ดเกมเมื่อ 3 ปีก่อน ทำให้สาวไปถึงตัวจริงได้',
        },
      ],
      investigationPuzzle: {
        question: 'ตามกฎหมาย พ.ร.บ. คอมพิวเตอร์ ผู้ให้บริการและผู้ดูแลระบบต้องเก็บรักษาข้อมูลการจราจรทางคอมพิวเตอร์ (Log File) ไว้อย่างน้อยกี่วัน?',
        options: [
          'ไม่น้อยกว่า 90 วัน (หรือตามที่เจ้าหน้าที่สั่งไม่เกิน 2 ปี)',
          'ไม่น้อยกว่า 7 วัน',
          'ไม่จำเป็นต้องเก็บรักษาข้อมูล Log',
          'เก็บไว้เพียง 24 ชั่วโมงหลังจากปิดเครื่อง',
        ],
        correctIndex: 0,
        explanation: 'พ.ร.บ.คอมพิวเตอร์ มาตรา 26 กำหนดให้ผู้ให้บริการต้องเก็บรักษาข้อมูลจราจรทางคอมพิวเตอร์ไว้ไม่น้อยกว่า 90 วัน เพื่อใช้สืบหาตัวผู้กระทำความผิด',
        cyberLawInsight: 'Log File เป็นหลักฐานสำคัญทางดิจิทัลนิติวิทยาศาสตร์ที่ใช้ดำเนินคดีในชั้นศาล',
      },
      choices: [
        {
          label: 'A',
          text: 'นำบันทึก Log File ส่งมอบให้เจ้าหน้าที่ตำรวจไซเบอร์ (บช.สอท.) และสายด่วน 1441',
          outcomeText: 'ตัดสินใจได้ถูกต้องตามขั้นตอนกฎหมาย! เจ้าหน้าที่สามารถออกหมายเรียกผู้ให้บริการเพื่อขอข้อมูลตัวจริง',
          isCorrect: true,
          riskLevel: 'LOW',
          safetyHpDelta: 20,
        },
        {
          label: 'B',
          text: 'แฮกกลับเข้าไปทำลายเซิร์ฟเวอร์ของแฮกเกอร์ด้วยตนเอง',
          outcomeText: 'ผิดกฎหมาย! การแฮกระบบผู้อื่นถือเป็นความผิดตาม พ.ร.บ.คอมพิวเตอร์ แม้จะทำกับแฮกเกอร์ก็ตาม',
          isCorrect: false,
          riskLevel: 'HIGH',
          safetyHpDelta: -20,
        },
        {
          label: 'C',
          text: 'โพสต์ประจานหมายเลข IP และชื่อบัญชีลงในเฟซบุ๊กส่วนตัว',
          outcomeText: 'ไม่ถูกต้อง! อาจเข้าข่ายหมิ่นประมาทหรือเปิดเผยข้อมูลส่วนบุคคลโดยมิชอบ และทำให้คนร้ายไหวตัวทัน',
          isCorrect: false,
          riskLevel: 'MEDIUM',
          safetyHpDelta: -15,
        },
      ],
    },
    {
      stageNumber: 3,
      title: 'ด่านที่ 3: เผชิญหน้าและสกัดกั้นภัยไซเบอร์ (Showdown & Mitigation)',
      missionBriefing: 'แฮกเกอร์กำลังพยายามรีโมตล็อกระบบและขโมยข้อมูลคลังข้อสอบ จงเปิดระบบรักษาความปลอดภัย 2 ชั้น (2FA) และฟื้นฟูระบบ',
      environmentSetting: 'ห้องแม่ข่ายคอมพิวเตอร์หลักประจำโรงเรียน',
      evidenceItems: [
        {
          id: 'ev6',
          name: 'ระบบยืนยันตัวตนสองชั้น (Two-Factor Authentication: 2FA)',
          icon: '🔐',
          description: 'แม้แฮกเกอร์จะมีรหัสผ่าน แต่ระบบขอรหัส OTP เพิ่มเติมผ่านแอปพลิเคชัน Authenticator',
          isSuspicious: false,
          analysisResult: 'ระบบ 2FA สามารถสกัดกั้นการล็อกอินของคนร้ายได้ 100% ทำให้ไม่สามารถเข้าสู่ระบบได้',
        },
        {
          id: 'ev7',
          name: 'ไฟล์สำรองข้อมูลออฟไลน์ (Offline 3-2-1 Backup)',
          icon: '💾',
          description: 'ข้อมูลข้อสอบและประวัตินักเรียนถูกสำรองไว้ในฮาร์ดดิสก์แยกต่างหากที่ไม่เชื่อมต่อเน็ต',
          isSuspicious: false,
          analysisResult: 'ทำให้โรงเรียนสามารถกู้คืนข้อมูลได้ทันทีโดยไม่ต้องจ่ายค่าไถ่หรือกังวลข้อมูลสูญหาย',
        },
      ],
      investigationPuzzle: {
        question: 'ข้อใดคือหลักการสร้างรหัสผ่านและรักษาความปลอดภัยบัญชีที่ดีที่สุดตามหลักความปลอดภัยไซเบอร์ ม.1?',
        options: [
          'รหัสผ่านยาวอย่างน้อย 8-12 ตัวอักษร ผสมตัวพิมพ์ใหญ่ เล็ก ตัวเลข สัญลักษณ์ และเปิดใช้งาน 2FA',
          'ใช้เบอร์โทรศัพท์หรือวันเดือนปีเกิดเพื่อจะได้จำง่ายไม่ลืม',
          'ใช้รหัสผ่านเดียวกันในทุกโซเชียลมีเดียและเกมออนไลน์',
          'แชร์รหัสผ่านให้เพื่อนสนิทช่วยจำไว้เผื่อลืม',
        ],
        correctIndex: 0,
        explanation: 'รหัสผ่านที่ปลอดภัยต้องมีความซับซ้อน ไม่ใช้ข้อมูลส่วนตัว และต้องเปิดระบบยืนยันตัวตนแบบสองปัจจัย (2FA)',
        cyberLawInsight: 'การปกป้องรหัสผ่านเป็นการคุ้มครองสิทธิข้อมูลส่วนบุคคลตามหลัก PDPA และป้องกันการแอบอ้างสิทธิ์',
      },
      choices: [
        {
          label: 'A',
          text: 'บังคับให้ทุกบัญชีรีเซ็ตรหัสผ่านใหม่ เปิด 2FA และติดตั้งโปรแกรมแอนติไวรัสที่ถูกลิขสิทธิ์',
          outcomeText: 'ยอดเยี่ยมที่สุด! ระบบโรงเรียนปลอดภัย 100% แฮกเกอร์ถูกปิดกั้นและตำรวจเข้าควบคุมตัวได้สำเร็จ',
          isCorrect: true,
          riskLevel: 'LOW',
          safetyHpDelta: 25,
        },
        {
          label: 'B',
          text: 'ยอมจ่ายเงินให้แฮกเกอร์เพื่อแลกกับการไม่ปล่อยข้อมูล',
          outcomeText: 'ผิดพลาดร้ายแรง! การจ่ายเงินไม่การันตีว่าจะได้ข้อมูลคืน และยิ่งสนับสนุนให้มิจฉาชีพก่อเหตุซ้ำ',
          isCorrect: false,
          riskLevel: 'HIGH',
          safetyHpDelta: -30,
        },
        {
          label: 'C',
          text: 'ปิดเครื่องเซิร์ฟเวอร์ทิ้งไว้แล้วรอให้เรื่องเงียบไปเอง',
          outcomeText: 'ไม่ถูกต้อง! การไม่แก้ไขช่องโหว่จะทำให้ถูกโจมตีซ้ำได้อีกตลอดเวลา',
          isCorrect: false,
          riskLevel: 'HIGH',
          safetyHpDelta: -20,
        },
      ],
    },
  ],
  finalConclusion: 'ภารกิจสืบสวนไซเบอร์สำเร็จสมบูรณ์! ด้วยไหวพริบและการวิเคราะห์หลักฐานอย่างเป็นระบบตามแนวคิดวิทยาการคำนวณ ทำให้คุณสามารถจับกุมแฮกเกอร์ ShadowPhisher-X และปกป้องข้อมูลของโรงเรียนไว้ได้อย่างปลอดภัย!',
  badgeReward: '🎖️ ยอดนักสืบไซเบอร์เหรียญทอง (Master Cyber Detective Badge)',
  learningOutcomes: [
    'การสังเกตและวิเคราะห์สัญญาณเตือนภัยฟิชชิ่ง (Phishing Indicators & Typosquatting)',
    'การเก็บรักษาและการใช้ประโยชน์จากข้อมูลจราจรทางคอมพิวเตอร์ (Log File) ตาม พ.ร.บ. คอมพิวเตอร์ ม.26',
    'การป้องกันบัญชีด้วยการตั้งรหัสผ่านที่รัดกุมและการเปิดระบบยืนยันตัวตน 2 ชั้น (2FA)',
    'ขั้นตอนการรับมือและรายงานเหตุภัยคุกคามไซเบอร์อย่างถูกต้องตามกฎหมาย',
  ],
};

export const Game6SummerEngine: React.FC<Game6SummerEngineProps> = ({ onComplete, initialGameId }) => {
  // Studio & Generation State
  const [promptInput, setPromptInput] = useState<string>('สร้างเกมสืบสวนที่ผู้เล่นต้องตามจับแฮกเกอร์ที่ส่ง Phishing อีเมล');
  const [authorName, setAuthorName] = useState<string>('คุณครูวิทยาการคำนวณ');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');

  // Active Game State
  const [gameWorld, setGameWorld] = useState<SummerGameWorld>(DEFAULT_GAME_WORLD);
  const [activeTab, setActiveTab] = useState<'play' | 'create' | 'dossier' | 'share'>('play');
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(0);
  const [inspectedEvidence, setInspectedEvidence] = useState<string[]>([]);
  const [selectedEvidenceItem, setSelectedEvidenceItem] = useState<any | null>(null);

  // Puzzle & Choices State
  const [selectedPuzzleOption, setSelectedPuzzleOption] = useState<number | null>(null);
  const [isPuzzleAnswered, setIsPuzzleAnswered] = useState<boolean>(false);
  const [selectedChoiceLabel, setSelectedChoiceLabel] = useState<string | null>(null);
  const [choiceOutcome, setChoiceOutcome] = useState<any | null>(null);

  // Stats & Progress
  const [safetyHp, setSafetyHp] = useState<number>(100);
  const [totalXp, setTotalXp] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isGameFinished, setIsGameFinished] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sfx.isMuted);

  // Load custom game if room ID provided in URL or props
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('gameRoom') || initialGameId;
    if (roomParam) {
      loadGameById(roomParam);
    }
  }, [initialGameId]);

  const loadGameById = async (gameId: string) => {
    try {
      const res = await fetch(`/api/summer-game-engine/get/${gameId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setGameWorld(json.data);
        resetGamePlayState();
        setActiveTab('play');
      }
    } catch (e) {
      console.warn('Could not load game by ID:', e);
    }
  };

  const resetGamePlayState = () => {
    setCurrentStageIdx(0);
    setInspectedEvidence([]);
    setSelectedEvidenceItem(null);
    setSelectedPuzzleOption(null);
    setIsPuzzleAnswered(false);
    setSelectedChoiceLabel(null);
    setChoiceOutcome(null);
    setSafetyHp(100);
    setTotalXp(0);
    setScore(0);
    setIsGameFinished(false);
  };

  // Generate a brand new game world with Gemini
  const handleGenerateGame = async (promptToUse?: string) => {
    const targetPrompt = promptToUse || promptInput;
    if (!targetPrompt.trim()) return;

    setIsGenerating(true);
    setGenerationStep('🧠 AI กำลังร่างพล็อตเรื่องสืบสวนและบทนำคดี...');

    try {
      setTimeout(() => {
        setGenerationStep('🕵️‍♂️ สร้างตัวละคร สายสืบไซเบอร์ และแฮกเกอร์ตัวร้าย...');
      }, 1500);

      setTimeout(() => {
        setGenerationStep('🧩 ออกแบบด่าน 3 ภารกิจ วางหลักฐานและข้อกฎหมายไซเบอร์...');
      }, 3000);

      const res = await fetch('/api/summer-game-engine/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: targetPrompt,
          author: authorName || 'ผู้สร้างเกมไซเบอร์',
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setGameWorld(json.data);
        resetGamePlayState();
        setActiveTab('play');
        sfx.playVictory();
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      } else {
        throw new Error(json.error || 'Generation failed');
      }
    } catch (err: any) {
      console.error('Generation Error:', err);
      // Fallback: Use customized prompt in default world
      const customizedWorld: SummerGameWorld = {
        ...DEFAULT_GAME_WORLD,
        prompt: targetPrompt,
        title: `Cyber Detective: ปฏิบัติการ ${targetPrompt.replace('สร้างเกม', '').slice(0, 30)}`,
      };
      setGameWorld(customizedWorld);
      resetGamePlayState();
      setActiveTab('play');
      sfx.playVictory();
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Stage Interactions
  const currentStage = gameWorld.stages[currentStageIdx] || gameWorld.stages[0];

  const handleInspectEvidence = (evidence: any) => {
    sfx.playClick();
    setSelectedEvidenceItem(evidence);
    if (!inspectedEvidence.includes(evidence.id)) {
      setInspectedEvidence([...inspectedEvidence, evidence.id]);
      setTotalXp((prev) => prev + 15);
    }
  };

  const handleSelectPuzzle = (idx: number) => {
    if (isPuzzleAnswered) return;
    setSelectedPuzzleOption(idx);
    setIsPuzzleAnswered(true);

    const isCorrect = idx === currentStage.investigationPuzzle.correctIndex;
    if (isCorrect) {
      sfx.playCorrect();
      setTotalXp((prev) => prev + 35);
      setScore((prev) => prev + 25);
    } else {
      sfx.playError();
      setSafetyHp((prev) => Math.max(10, prev - 10));
    }
  };

  const handleSelectChoice = (choice: any) => {
    if (selectedChoiceLabel) return;
    setSelectedChoiceLabel(choice.label);
    setChoiceOutcome(choice);

    if (choice.isCorrect) {
      sfx.playCorrect();
      setTotalXp((prev) => prev + 40);
      setScore((prev) => prev + 25);
    } else {
      sfx.playError();
    }

    setSafetyHp((prev) => Math.max(0, Math.min(100, prev + choice.safetyHpDelta)));
  };

  const handleNextStage = () => {
    sfx.playCorrect();
    if (currentStageIdx < gameWorld.stages.length - 1) {
      setCurrentStageIdx((prev) => prev + 1);
      setSelectedEvidenceItem(null);
      setSelectedPuzzleOption(null);
      setIsPuzzleAnswered(false);
      setSelectedChoiceLabel(null);
      setChoiceOutcome(null);
    } else {
      // Finished all stages
      setIsGameFinished(true);
      sfx.playVictory();
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
      const finalScore = Math.max(50, Math.min(100, Math.round(score + safetyHp / 2)));
      onComplete(finalScore, 100, 300);
    }
  };

  const getShareableLink = () => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?chapter=6&gameRoom=${gameWorld.id}`;
  };

  const handleCopyLink = () => {
    const link = getShareableLink();
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    sfx.playLock();
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 text-slate-100 max-w-5xl mx-auto shadow-2xl space-y-6">
      {/* Engine Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-rose-500 p-0.5 shadow-lg flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-indigo-400">
              <Sparkles className="w-6 h-6 animate-pulse text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-white font-['Chakra_Petch']">
                Gameer.io & Summer Engine
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border border-amber-500/30 font-bold">
                AI Game Creator
              </span>
            </div>
            <p className="text-xs text-slate-400">
              ป้อนคำสั่งให้ AI สร้างเกมสืบสวน ด่าน ตัวละคร และแชร์ลิงก์ให้นักเรียนเข้าเล่นได้ทันที
            </p>
          </div>
        </div>

        {/* Tab Switcher & Sound */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('play')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'play'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>เล่นเกม ({gameWorld.stages.length} ด่าน)</span>
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'create'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>สตูดิโอสร้างเกม</span>
            </button>
            <button
              onClick={() => setActiveTab('share')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'share'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>แชร์ลิงก์</span>
            </button>
          </div>

          <button
            onClick={() => {
              const muted = sfx.toggleMute();
              setIsMuted(muted);
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: STUDIO / CREATE GAME ENGINE                        */}
      {/* ========================================================= */}
      {activeTab === 'create' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-500/30 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 text-indigo-300 text-sm font-bold">
              <Bot className="w-5 h-5 text-amber-400" />
              <span>Summer Engine Studio: ป้อนไอเดียเกมที่คุณต้องการสร้าง</span>
            </div>

            {/* Creation Form */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  คำสั่งสร้างเกม (Prompt Example):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder='เช่น "สร้างเกมสืบสวนที่ผู้เล่นต้องตามจับแฮกเกอร์ที่ส่ง Phishing อีเมล"'
                    className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                  <button
                    onClick={() => handleGenerateGame()}
                    disabled={isGenerating || !promptInput.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-rose-500 via-indigo-600 to-emerald-500 hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/20 shrink-0 transition-transform active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                    <span>{isGenerating ? 'AI กำลังสร้างเกม...' : 'สร้างเกม AI ทันที'}</span>
                  </button>
                </div>
              </div>

              {/* Creator Name */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">ชื่อผู้สร้าง / ครูผู้สอน:</span>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>
            </div>

            {/* Quick Preset Prompts */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <label className="text-xs font-semibold text-slate-400 block">
                หรือเลือกเทมเพลตเกมยอดนิยม (One-Click Generate):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRESET_CREATION_PROMPTS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPromptInput(p.prompt);
                      handleGenerateGame(p.prompt);
                    }}
                    disabled={isGenerating}
                    className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 text-left transition-all flex items-start gap-3 group"
                  >
                    <span className="text-2xl p-1.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                      {p.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-200 group-hover:text-amber-300 truncate">
                        {p.title}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                        &ldquo;{p.prompt}&rdquo;
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Loading Indicator */}
            {isGenerating && (
              <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-center space-y-2 animate-pulse">
                <div className="flex items-center justify-center gap-2 text-indigo-300 font-bold text-sm">
                  <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span>Summer Engine กำลังรันโมเดล Gemini 3.8 Flash...</span>
                </div>
                <p className="text-xs text-indigo-200">{generationStep}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: SHARE & EMBED ROOM CODE                            */}
      {/* ========================================================= */}
      {activeTab === 'share' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h4 className="font-bold text-white text-base font-['Chakra_Petch']">
                  แชร์เกมนี้ให้นักเรียนเข้าเล่น (Shareable Game Link)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  นักเรียนสามารถเปิดลิงก์นี้ในเว็บเบราว์เซอร์บนคอมพิวเตอร์ แท็บเล็ต หรือมือถือ เพื่อเล่นเกมสืบสวนคดีได้ทันที
                </p>
              </div>
              <div className="px-3 py-1 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono font-bold text-xs">
                รหัสห้อง: {gameWorld.id}
              </div>
            </div>

            {/* Share Link Box */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                ลิงก์สำหรับส่งในห้องเรียน (Google Classroom / Line):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={getShareableLink()}
                  className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-200 font-mono select-all focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2 shrink-0 transition-transform active:scale-95 shadow-md"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'คัดลอกเรียบร้อย!' : 'คัดลอกลิงก์'}</span>
                </button>
              </div>
            </div>

            {/* Game Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-amber-400">{gameWorld.genre}</div>
                <div className="text-sm font-bold text-white">{gameWorld.title}</div>
                <div className="text-xs text-slate-400">สร้างโดย: {gameWorld.author} • {gameWorld.stages.length} ด่านภารกิจ</div>
              </div>
              <button
                onClick={() => setActiveTab('play')}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md"
              >
                <Play className="w-4 h-4" />
                <span>เปิดเล่นด่านที่ 1</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: PLAYABLE DETECTIVE GAMEPLAY                         */}
      {/* ========================================================= */}
      {activeTab === 'play' && (
        <div className="space-y-6">
          {/* Game World Header Dossier */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                  {gameWorld.genre}
                </span>
                <span className="text-xs text-slate-400">รหัสคดี: {gameWorld.id}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white font-['Chakra_Petch']">
                {gameWorld.title}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                {gameWorld.synopsis}
              </p>
            </div>

            {/* Protagonist & Hacker Badge */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="p-2.5 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex items-center gap-2">
                <span className="text-2xl">{gameWorld.protagonist.avatarEmoji}</span>
                <div className="text-[11px]">
                  <div className="font-bold text-indigo-200">{gameWorld.protagonist.name}</div>
                  <div className="text-slate-400 text-[10px]">{gameWorld.protagonist.badgeTitle}</div>
                </div>
              </div>

              <div className="text-slate-600 font-bold text-xs">VS</div>

              <div className="p-2.5 rounded-2xl bg-rose-950/60 border border-rose-500/30 flex items-center gap-2">
                <span className="text-2xl">{gameWorld.hackerAntagonist.avatarEmoji}</span>
                <div className="text-[11px]">
                  <div className="font-bold text-rose-200">{gameWorld.hackerAntagonist.name}</div>
                  <div className="text-rose-400 text-[10px]">ระดับ: {gameWorld.hackerAntagonist.threatLevel}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Safety HP & Stage Progress Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-300">ความคืบหน้าคดี:</span>
              <div className="flex gap-1.5">
                {gameWorld.stages.map((stg, sIdx) => (
                  <div
                    key={sIdx}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      currentStageIdx === sIdx
                        ? 'bg-indigo-600 text-white shadow-md'
                        : currentStageIdx > sIdx
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    ด่านที่ {stg.stageNumber} {currentStageIdx > sIdx ? '✓' : ''}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">🛡️ Safety HP:</span>
                <div className="w-24 sm:w-32 bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      safetyHp > 60 ? 'bg-emerald-500' : safetyHp > 30 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${safetyHp}%` }}
                  />
                </div>
                <span className="font-bold font-mono text-emerald-400">{safetyHp}%</span>
              </div>

              <div className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold flex items-center gap-1 font-mono">
                <Zap className="w-3.5 h-3.5" />
                <span>{totalXp} XP</span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* ACTIVE STAGE CONTENT                                      */}
          {/* ========================================================= */}
          {!isGameFinished ? (
            <div className="space-y-6">
              {/* Stage Mission Header */}
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                    <Radio className="w-4 h-4 animate-pulse text-rose-500" />
                    <span>ภารกิจสืบสวน {currentStage.title}</span>
                  </span>
                  <span className="text-[11px] text-slate-400">ฉาก: {currentStage.environmentSetting}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {currentStage.missionBriefing}
                </p>
              </div>

              {/* SECTION 1: Digital Evidence Board */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <FileSearch className="w-4 h-4 text-amber-400" />
                    <span>กระดานหลักฐานดิจิทัล (คลิกเพื่อตรวจพิสูจน์นิติวิทยาศาสตร์ไซเบอร์):</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    ตรวจแล้ว {inspectedEvidence.length}/{currentStage.evidenceItems.length} ชิ้น
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {currentStage.evidenceItems.map((evidence) => {
                    const isInspected = inspectedEvidence.includes(evidence.id);
                    return (
                      <button
                        key={evidence.id}
                        onClick={() => handleInspectEvidence(evidence)}
                        className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 shadow-md group ${
                          selectedEvidenceItem?.id === evidence.id
                            ? 'bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/40'
                            : isInspected
                            ? 'bg-slate-950 border-emerald-500/40 hover:border-emerald-500'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-2xl p-2 rounded-xl bg-slate-900 border border-slate-800">
                            {evidence.icon}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            isInspected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {isInspected ? '✓ ตรวจสอบแล้ว' : 'ยังไม่ตรวจ'}
                          </span>
                        </div>

                        <div>
                          <div className="font-bold text-xs text-white group-hover:text-amber-300">
                            {evidence.name}
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                            {evidence.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Evidence Inspection Result Modal / Detail View */}
                {selectedEvidenceItem && (
                  <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2 animate-fade-in shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-indigo-300 flex items-center gap-1.5">
                        <Search className="w-4 h-4 text-amber-400" />
                        <span>ผลการวิเคราะห์ดิจิทัล: {selectedEvidenceItem.name}</span>
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        selectedEvidenceItem.isSuspicious
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {selectedEvidenceItem.isSuspicious ? '⚠️ เป็นภัยคุกคาม / สิ่งผิดปกติ' : '✓ ปลอดภัย'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {selectedEvidenceItem.analysisResult}
                    </p>
                  </div>
                )}
              </div>

              {/* SECTION 2: Investigation Cyber Puzzle */}
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                    ?
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white">
                      ปริศนาวิเคราะห์คดี (Cyber Detective Deduction)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      ตอบคำถามจากหลักฐานที่วิเคราะห์เพื่อปลดล็อกการตัดสินใจ
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 font-medium pl-2 border-l-2 border-amber-500">
                  {currentStage.investigationPuzzle.question}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentStage.investigationPuzzle.options.map((opt, oIdx) => {
                    const isSelected = selectedPuzzleOption === oIdx;
                    const isCorrect = oIdx === currentStage.investigationPuzzle.correctIndex;
                    let btnStyle = 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300';

                    if (isPuzzleAnswered) {
                      if (isCorrect) {
                        btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                      } else if (isSelected && !isCorrect) {
                        btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-200 line-through';
                      } else {
                        btnStyle = 'bg-slate-900/50 border-slate-800/50 text-slate-500 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        disabled={isPuzzleAnswered}
                        onClick={() => handleSelectPuzzle(oIdx)}
                        className={`p-3 rounded-2xl border text-left text-xs transition-all flex items-start gap-2.5 ${btnStyle}`}
                      >
                        <span className="w-5 h-5 rounded-lg bg-slate-800 text-slate-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className="leading-relaxed">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Puzzle Explanation */}
                {isPuzzleAnswered && (
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 animate-fade-in text-xs">
                    <p className="text-slate-200">
                      💡 <strong>คำอธิบาย:</strong> {currentStage.investigationPuzzle.explanation}
                    </p>
                    <p className="text-indigo-300 text-[11px]">
                      ⚖️ <strong>ข้อกฎหมาย / ความปลอดภัย:</strong> {currentStage.investigationPuzzle.cyberLawInsight}
                    </p>
                  </div>
                )}
              </div>

              {/* SECTION 3: Detective Action Decisions */}
              {isPuzzleAnswered && (
                <div className="space-y-3 animate-fade-in">
                  <label className="text-xs font-bold text-slate-300 block">
                    การตัดสินใจของสารวัตรไซเบอร์ในด่านนี้:
                  </label>

                  <div className="grid grid-cols-1 gap-2.5">
                    {currentStage.choices.map((choice, cIdx) => {
                      const isChosen = selectedChoiceLabel === choice.label;
                      return (
                        <button
                          key={cIdx}
                          disabled={!!selectedChoiceLabel}
                          onClick={() => handleSelectChoice(choice)}
                          className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                            isChosen
                              ? choice.isCorrect
                                ? 'bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/40 text-emerald-200'
                                : 'bg-rose-950/80 border-rose-500 ring-2 ring-rose-500/40 text-rose-200'
                              : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 font-bold text-xs flex items-center justify-center shrink-0">
                              {choice.label}
                            </span>
                            <span className="text-xs sm:text-sm font-medium">{choice.text}</span>
                          </div>

                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                            choice.riskLevel === 'LOW'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : choice.riskLevel === 'MEDIUM'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {choice.riskLevel === 'LOW' ? '✓ ปลอดภัย' : choice.riskLevel === 'MEDIUM' ? '⚠️ เสี่ยงปานกลาง' : '⛔ เสี่ยงสูง'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Choice Outcome Card & Next Stage Button */}
                  {choiceOutcome && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3 animate-fade-in shadow-xl">
                      <div className="text-xs text-slate-200 leading-relaxed">
                        <strong>ผลลัพธ์:</strong> {choiceOutcome.outcomeText}
                      </div>

                      <button
                        onClick={handleNextStage}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                      >
                        <span>
                          {currentStageIdx < gameWorld.stages.length - 1
                            ? `ไปต่อที่ด่านที่ ${currentStageIdx + 2}`
                            : 'สรุปผลและปิดคดีสืบสวน (Case Closed)'}
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ========================================================= */
            /* CASE CLOSED / VICTORY SUMMARY                             */
            /* ========================================================= */
            <div className="py-8 text-center space-y-6 bg-slate-950 rounded-3xl border border-indigo-500/30 p-6 sm:p-8 shadow-2xl animate-fade-in">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500/30 via-indigo-500/30 to-emerald-500/30 border border-amber-400/40 flex items-center justify-center text-4xl shadow-2xl animate-bounce">
                🎖️
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>สืบสวนและปิดคดีสำเร็จ 100% (Case Closed)</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white font-['Chakra_Petch']">
                  {gameWorld.badgeReward}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  {gameWorld.finalConclusion}
                </p>
              </div>

              {/* Learning Outcomes Checklist */}
              <div className="max-w-xl mx-auto p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-2">
                <div className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>ทักษะและความรู้ที่ได้รับจากคดีนี้:</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {gameWorld.learningOutcomes.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={resetGamePlayState}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>เล่นคดีนี้อีกครั้ง</span>
                </button>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-indigo-600 hover:opacity-90 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>สร้างคดีใหม่ด้วย Summer Engine</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>แชร์ลิงก์ให้นักเรียน</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
