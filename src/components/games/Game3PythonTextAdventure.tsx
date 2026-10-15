/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Sword,
  Shield,
  Zap,
  Sparkles,
  Heart,
  Bot,
  Terminal,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Award,
  Flame,
  Volume2,
  VolumeX,
  Play,
  Cpu,
  ChevronRight,
  BookOpen,
  Send,
  Eye,
  Crosshair,
  ShieldAlert,
  Wand2
} from 'lucide-react';
import { sfx } from '../../utils/audioEffects';
import { StorageService } from '../../services/storage';

interface Game3PythonTextAdventureProps {
  onComplete: (score: number, maxScore: number, xpEarned: number) => void;
}

type DifficultyTier = 'easy_mod' | 'medium' | 'medium_plus';

interface Question {
  id: string;
  category: string;
  tier: DifficultyTier;
  prompt: string;
  codeSnippet?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint: string;
  damageValue: number;
}

interface Monster {
  id: number;
  name: string;
  title: string;
  avatar: string;
  bgGradient: string;
  maxHp: number;
  currentHp: number;
  attackPower: number;
  conceptFocus: string;
  description: string;
}

// 5 Balanced Dungeon Bosses for Grade 7 (ม.1)
const MONSTERS_DATA: Omit<Monster, 'currentHp'>[] = [
  {
    id: 1,
    name: 'Syntax Slime',
    title: 'สไลม์ไวยากรณ์ & ตัวแปรเบื้องต้น',
    avatar: '🟢',
    bgGradient: 'from-emerald-950/60 to-slate-900',
    maxHp: 80,
    attackPower: 12,
    conceptFocus: 'คำสั่ง print(), ตัวแปร, ข้อมูลตัวเลขและข้อความ',
    description: 'สไลม์วุ้นเรืองแสงที่ปล่อยบั๊กตัวแปรออกมาป่วนระบบไพทอน',
  },
  {
    id: 2,
    name: 'I/O Mecha Golem',
    title: 'โกเลมรับส่งข้อมูล & คำนวณคณิตศาสตร์',
    avatar: '🤖',
    bgGradient: 'from-cyan-950/60 to-slate-900',
    maxHp: 100,
    attackPower: 15,
    conceptFocus: 'คำสั่ง input(), การแปลงชนิดข้อมูล int(), float(), ตัวดำเนินการ +, -, *, /, %',
    description: 'หุ่นยนต์ศิลาโบราณที่ต้องการค่าตัวเลขและข้อมูลนำเข้าที่ถูกต้องเพื่อปิดเกราะพลังงาน',
  },
  {
    id: 3,
    name: 'Condition Cyber Wolf',
    title: 'หมาป่าตรรกะ if-elif-else',
    avatar: '🐺',
    bgGradient: 'from-amber-950/60 to-slate-900',
    maxHp: 120,
    attackPower: 18,
    conceptFocus: 'คำสั่งเงื่อนไข if, elif, else และตัวเปรียบเทียบ ==, !=, >, <',
    description: 'หมาป่าไซเบอร์ที่มีการตัดสินใจแยกสาขาอย่างรวดเร็ว ต้องใช้เงื่อนไขที่ถูกต้องเพื่อสยบมัน',
  },
  {
    id: 4,
    name: 'Looping Hydra',
    title: 'ไฮดราวงวนซ้ำ for-while & ลิสต์',
    avatar: '🐍',
    bgGradient: 'from-purple-950/60 to-slate-900',
    maxHp: 140,
    attackPower: 20,
    conceptFocus: 'คำสั่งวนซ้ำ for i in range(), while loop และโครงสร้าง List',
    description: 'ไฮดราหลายหัวที่วนซ้ำการโจมตีไม่รู้จบ ต้องใช้ลูปที่แม่นยำเพื่อตัดหัวพร้อมกัน',
  },
  {
    id: 5,
    name: 'Compiler Bug Dragon Lord',
    title: 'ราชันย์มังกรบั๊กคอมไพเลอร์ (Boss ใหญ่)',
    avatar: '🐉',
    bgGradient: 'from-rose-950/60 to-slate-900',
    maxHp: 180,
    attackPower: 22,
    conceptFocus: 'การดีบัก, ฟังก์ชัน def, การแก้ปัญหา Python ครอบคลุมทุกบท',
    description: 'บอสใหญ่ผู้ครอบงำระบบ Neo-Pythonia จงใช้ทุกวิชาที่เรียนมาเผด็จศึก!',
  },
];

// Rich question bank balanced for Grade 7 (ม.1) Python
const QUESTION_BANK: Record<number, Question[]> = {
  // Stage 1: Variables & print()
  1: [
    {
      id: 'q1-1',
      category: 'print & string',
      tier: 'easy_mod',
      prompt: 'ต้องการแสดงข้อความว่า "Hello Python" ออกทางหน้าจอ ต้องใช้คำสั่งใด?',
      options: [
        'print("Hello Python")',
        'echo("Hello Python")',
        'display("Hello Python")',
        'write("Hello Python")',
      ],
      correctIndex: 0,
      explanation: 'ในภาษา Python คำสั่งมาตรฐานที่ใช้แสดงผลข้อความคือ print(...)',
      hint: 'คำสั่งขึ้นต้นด้วยตัวอักษร p มี 5 ตัวอักษร',
      damageValue: 30,
    },
    {
      id: 'q1-2',
      category: 'variables',
      tier: 'medium',
      prompt: 'โค้ดใดต่อไปนี้เป็นการตั้งชื่อตัวแปรและกำหนดค่าตัวเลขที่ "ถูกต้องตามกฎไวยากรณ์ Python"?',
      options: [
        'score = 100',
        '100 = score',
        '2score = 100',
        'score-total = 100',
      ],
      correctIndex: 0,
      explanation: 'ชื่อตัวแปรต้องอยู่ด้านซ้ายของเครื่องหมาย = และห้ามขึ้นต้นด้วยตัวเลขหรือใช้เครื่องหมายขีดกลาง (-)',
      hint: 'ชื่อตัวแปรต้องอยู่ฝั่งซ้าย เครื่องหมาย = อยู่ตรงกลาง',
      damageValue: 35,
    },
    {
      id: 'q1-3',
      category: 'data types',
      tier: 'medium',
      codeSnippet: `name = "Somchai"\nage = 13\nheight = 155.5`,
      prompt: 'จากโค้ดข้างต้น ตัวแปร age และ height มีชนิดข้อมูล (Data Type) ตามลำดับเป็นแบบใด?',
      options: [
        'int (จำนวนเต็ม) และ float (ทศนิยม)',
        'str (ข้อความ) และ int (จำนวนเต็ม)',
        'float (ทศนิยม) และ str (ข้อความ)',
        'bool (บูลีน) และ int (จำนวนเต็ม)',
      ],
      correctIndex: 0,
      explanation: 'age เก็บ 13 เป็นเลขจำนวนเต็ม (int) ส่วน height เก็บ 155.5 ที่มีทศนิยม (float)',
      hint: '13 ไม่มีจุดทศนิยมจึงเป็น int ส่วน 155.5 มีจุดทศนิยมจึงเป็น float',
      damageValue: 35,
    },
    {
      id: 'q1-4',
      category: 'trace output',
      tier: 'medium_plus',
      codeSnippet: `a = "5"\nb = "10"\nprint(a + b)`,
      prompt: 'ผลลัพธ์ของการรันโค้ดชุดนี้คืออะไร?',
      options: [
        '"510"',
        '15',
        '50',
        'เกิดข้อผิดพลาด SyntaxError',
      ],
      correctIndex: 0,
      explanation: 'เนื่องจากทั้ง "5" และ "10" อยู่ในเครื่องหมายคำพูด จึงเป็นสตริง (str) เครื่องหมาย + จะนำข้อความมาต่อกันกลายเป็น "510"',
      hint: 'สังเกตว่ามีเครื่องหมายคำพูดครอบตัวเลขอยู่ ดังนั้นจึงไม่ใช่การบวกเลขทางคณิตศาสตร์ แต่เป็นการต่อข้อความ',
      damageValue: 40,
    },
  ],

  // Stage 2: input() & Arithmetic
  2: [
    {
      id: 'q2-1',
      category: 'input & casting',
      tier: 'easy_mod',
      prompt: 'เมื่อผู้ใช้กรอกข้อมูลผ่านคำสั่ง input() ข้อมูลที่ได้รับเข้ามาใน Python จะมีชนิดข้อมูลเริ่มต้นเป็นอะไรเสมอ?',
      options: [
        'str (ข้อความ)',
        'int (จำนวนเต็ม)',
        'float (ทศนิยม)',
        'bool (บูลีน)',
      ],
      correctIndex: 0,
      explanation: 'ฟังก์ชัน input() ในภาษา Python จะคืนค่ากลับมาเป็นข้อความ (str) เสมอ แม้ผู้ใช้จะพิมพ์ตัวเลขก็ตาม',
      hint: 'ถ้าต้องการนำไปคำนวณเลข ต้องแปลงด้วย int() หรือ float() ก่อนเสมอ เพราะค่าเริ่มต้นเป็นสตริง',
      damageValue: 35,
    },
    {
      id: 'q2-2',
      category: 'modulo operator',
      tier: 'medium',
      codeSnippet: `result = 17 % 5\nprint(result)`,
      prompt: 'ผลลัพธ์ของการคำนวณตัวดำเนินการมอดุโล (%) นี้มีค่าเท่าใด?',
      options: [
        '2',
        '3.4',
        '3',
        '0',
      ],
      correctIndex: 0,
      explanation: 'เครื่องหมาย % คือตัวดำเนินการ Modulo หา "เศษจากการหาร" 17 หารด้วย 5 ได้ผลลัพธ์ 3 เศษ 2 ดังนั้นคำตอบคือ 2',
      hint: '17 ÷ 5 = 3 เหลือเศษเท่าไร?',
      damageValue: 40,
    },
    {
      id: 'q2-3',
      category: 'casting conversion',
      tier: 'medium',
      codeSnippet: `price = input("ราคา: ")  # สมมติผู้ใช้ใส่ 50\ntotal = int(price) + 20\nprint(total)`,
      prompt: 'เหตุใดจึงต้องใช้ฟังก์ชัน int(price) ก่อนนำไปบวกกับ 20?',
      options: [
        'เพื่อแปลงสตริงจาก input() ให้กลายเป็นตัวเลขจำนวนเต็มก่อนคำนวณ',
        'เพื่อทำให้ตัวแปร price แสดงผลทางหน้าจอ',
        'เพื่อตรวจสอบว่าราคาเกิน 100 บาทหรือไม่',
        'เพื่อลบจุดทศนิยมของราคาออก',
      ],
      correctIndex: 0,
      explanation: 'เพราะ input() คืนค่าเป็น str การนำ str + int โดยตรงจะเกิด TypeError จึงต้องแปลงด้วย int() ก่อน',
      hint: 'สตริงไม่สามารถนำมาบวกกับตัวเลขตรงๆ ได้ ต้องแปลงเป็นชนิดตัวเลขก่อน',
      damageValue: 35,
    },
    {
      id: 'q2-4',
      category: 'math expressions',
      tier: 'medium_plus',
      codeSnippet: `x = 2 + 3 * 4\nprint(x)`,
      prompt: 'ตามลำดับความสำคัญของเครื่องหมายทางคณิตศาสตร์ (Precedence) ค่าของ x จะเป็นเท่าใด?',
      options: [
        '14',
        '20',
        '24',
        '10',
      ],
      correctIndex: 0,
      explanation: 'เครื่องหมายคูณ (*) มีลำดับความสำคัญสูงกว่าบวก (+) จึงทำ 3 * 4 = 12 ก่อน แล้วนำไปบวก 2 ได้ผลลัพธ์ 14',
      hint: 'ทำคูณก่อนบวก: (3 * 4) + 2',
      damageValue: 40,
    },
  ],

  // Stage 3: Conditions if-elif-else
  3: [
    {
      id: 'q3-1',
      category: 'if-else basics',
      tier: 'easy_mod',
      prompt: 'สัญลักษณ์ใดที่ต้องใส่ไว้ "ท้ายบรรทัด" ของคำสั่ง if, elif และ else เสมอในภาษา Python?',
      options: [
        ': (โคลอน)',
        '; (เซมิโคลอน)',
        '{ } (วงเล็บปีกกา)',
        'then',
      ],
      correctIndex: 0,
      explanation: 'ในไวยากรณ์ Python ทุกครั้งที่เขียนหัวข้อบล็อก เช่น if, elif, else, for, def ต้องลงท้ายด้วยเครื่องหมายโคลอน (:)',
      hint: 'เครื่องหมายจุดคู่ซ้อนกันในแนวตั้ง',
      damageValue: 35,
    },
    {
      id: 'q3-2',
      category: 'comparison operators',
      tier: 'medium',
      codeSnippet: `score = 75\nif score >= 80:\n    grade = "A"\nelif score >= 70:\n    grade = "B"\nelse:\n    grade = "C"\nprint(grade)`,
      prompt: 'เมื่อตัวแปร score มีค่าเท่ากับ 75 โค้ดนี้จะพิมพ์ผลลัพธ์เป็นอะไร?',
      options: [
        '"B"',
        '"A"',
        '"C"',
        '"A" และ "B"',
      ],
      correctIndex: 0,
      explanation: '75 ไม่มากกว่าเท่ากับ 80 (เป็น False) จึงข้ามมาตรวจเงื่อนไข elif 75 >= 70 ซึ่งเป็น True จึงได้เกรด "B"',
      hint: '75 ตกอยู่ในช่วง 70 ถึง 79 ซึ่งตรงกับเงื่อนไขของ elif',
      damageValue: 40,
    },
    {
      id: 'q3-3',
      category: 'equality check',
      tier: 'medium',
      prompt: 'การตรวจสอบว่าค่าตัวแปร a "เท่ากับ" ค่าตัวแปร b ในเงื่อนไข if ต้องใช้ตัวดำเนินการเปรียบเทียบใด?',
      options: [
        '== (เท่ากับสองตัว)',
        '= (เท่ากับตัวเดียว)',
        'equals',
        ':=',
      ],
      correctIndex: 0,
      explanation: 'เครื่องหมาย == ใช้เปรียบเทียบความเท่ากัน ส่วนเครื่องหมาย = ตัวเดียวใช้กำหนดค่าให้ตัวแปร (Assignment)',
      hint: 'เปรียบเทียบใช้สองตัว กำหนดค่าใช้ตัวเดียว',
      damageValue: 35,
    },
    {
      id: 'q3-4',
      category: 'logical conditions',
      tier: 'medium_plus',
      codeSnippet: `num = 14\nif num % 2 == 0:\n    print("เลขคู่")\nelse:\n    print("เลขคี่")`,
      prompt: 'โค้ดนี้ใช้หลักการใดในการตรวจสอบว่าเป็น "เลขคู่" หรือ "เลขคี่"?',
      options: [
        'นำเลขมาหารเอาเศษด้วย 2 ถ้าเศษเท่ากับ 0 แสดงว่าเป็นเลขคู่',
        'นำเลขมาคูณด้วย 2 ถ้าได้ผลลัพธ์เป็น 14 แสดงว่าเป็นเลขคู่',
        'ตรวจสอบความยาวของตัวเลขในระบบฐานสอง',
        'แปลงตัวเลขเป็นข้อความแล้วดูตัวอักษรตัวสุดท้าย',
      ],
      correctIndex: 0,
      explanation: 'การใช้ num % 2 == 0 หมายถึงการหารด้วย 2 แล้วเหลือเศษ 0 ซึ่งเป็นคุณสมบัติเฉพาะของเลขคู่',
      hint: 'เศษจากการหารด้วย 2 ของเลขคู่จะเป็น 0 เสมอ',
      damageValue: 45,
    },
  ],

  // Stage 4: Loops & Lists
  4: [
    {
      id: 'q4-1',
      category: 'for loop & range',
      tier: 'easy_mod',
      codeSnippet: `for i in range(4):\n    print(i)`,
      prompt: 'โค้ดวนซ้ำนี้จะแสดงตัวเลขใดบ้างตามลำดับ?',
      options: [
        '0, 1, 2, 3',
        '1, 2, 3, 4',
        '0, 1, 2, 3, 4',
        '4, 4, 4, 4',
      ],
      correctIndex: 0,
      explanation: 'ฟังก์ชัน range(4) จะเริ่มสร้างตัวเลขตั้งแต่ 0 จนถึงก่อนหน้า 4 คือ 0, 1, 2, 3 (ทั้งหมด 4 รอบ)',
      hint: 'การนับในคอมพิวเตอร์และ range(n) จะเริ่มต้นนับที่เลข 0 เสมอ และสิ้นสุดที่ n-1',
      damageValue: 40,
    },
    {
      id: 'q4-2',
      category: 'list indexing',
      tier: 'medium',
      codeSnippet: `heroes = ["Warrior", "Mage", "Archer"]\nprint(heroes[0])`,
      prompt: 'ผลลัพธ์ของการเรียกดูข้อมูล heroes[0] จะได้ค่าอะไร?',
      options: [
        '"Warrior"',
        '"Mage"',
        '"Archer"',
        'เกิดข้อผิดพลาด IndexError',
      ],
      correctIndex: 0,
      explanation: 'ดัชนี (Index) ของ List ในภาษา Python เริ่มต้นที่ตำแหน่ง 0 เสมอ ดังนั้น heroes[0] คือสมาชิกตัวแรกสุด "Warrior"',
      hint: 'ลำดับสมาชิกตัวแรกใน List จะอยู่ที่ Index หมายเลข 0',
      damageValue: 40,
    },
    {
      id: 'q4-3',
      category: 'while loop',
      tier: 'medium',
      codeSnippet: `count = 1\nwhile count <= 3:\n    print("Attack!")\n    count = count + 1`,
      prompt: 'ข้อความ "Attack!" จะถูกพิมพ์ออกมาทางหน้าจอทั้งหมดกี่ครั้ง?',
      options: [
        '3 ครั้ง',
        '2 ครั้ง',
        '4 ครั้ง',
        'วนซ้ำไม่รู้จบ (Infinite Loop)',
      ],
      correctIndex: 0,
      explanation: 'เริ่มที่ count=1 (พิมพ์ครั้งที่ 1) -> count=2 (พิมพ์ครั้งที่ 2) -> count=3 (พิมพ์ครั้งที่ 3) -> count=4 หลุดจากลูป รวมพิมพ์ 3 ครั้ง',
      hint: 'รอบที่ 1: count=1, รอบที่ 2: count=2, รอบที่ 3: count=3 พอ count=4 จะไม่เข้าเงื่อนไข',
      damageValue: 40,
    },
    {
      id: 'q4-4',
      category: 'list append & len',
      tier: 'medium_plus',
      codeSnippet: `items = ["Sword", "Shield"]\nitems.append("Potion")\nprint(len(items))`,
      prompt: 'หลังจากคำสั่ง append() ทำงานเสร็จ คำสั่ง len(items) จะแสดงตัวเลขใด?',
      options: [
        '3',
        '2',
        '1',
        '"Potion"',
      ],
      correctIndex: 0,
      explanation: 'เดิมมี 2 ไอเทม เมื่อ append("Potion") เพิ่มเข้ามาอีก 1 ชิ้น ฟังก์ชัน len() จะนับจำนวนสมาชิกทั้งหมดได้ 3',
      hint: 'คำสั่ง append() เป็นการเพิ่มสมาชิกใหม่ต่อท้าย ส่วน len() ใช้นับจำนวนสมาชิกทั้งหมด',
      damageValue: 45,
    },
  ],

  // Stage 5: Boss Dragon - Functions & Bug Fixing
  5: [
    {
      id: 'q5-1',
      category: 'functions def',
      tier: 'easy_mod',
      prompt: 'คีย์เวิร์ดที่ใช้ในการ "สร้างหรือนิยามฟังก์ชันใหม่" ในภาษา Python คือคำใด?',
      options: [
        'def',
        'function',
        'func',
        'create',
      ],
      correctIndex: 0,
      explanation: 'ในภาษา Python คำสั่งที่ใช้ประกาศฟังก์ชันคือ def ย่อมาจาก define function',
      hint: 'คำสั้นๆ 3 ตัวอักษร ขึ้นต้นด้วยตัว d',
      damageValue: 45,
    },
    {
      id: 'q5-2',
      category: 'bug fixing & indentation',
      tier: 'medium',
      codeSnippet: `def power_strike(atk):\nresult = atk * 2\nreturn result`,
      prompt: 'โค้ดข้างต้นนี้มีข้อผิดพลาดประเภทใดที่ทำให้โปรแกรมรันไม่ผ่าน?',
      options: [
        'IndentationError: ลืมย่อหน้า (เว้นวรรค) บรรทัดที่อยู่ในฟังก์ชัน',
        'SyntaxError: ไม่สามารถนำ atk มาคูณกับ 2 ได้',
        'TypeError: คำสั่ง return ต้องใส่เครื่องหมายคำพูด',
        'NameError: ไม่มีชื่อฟังก์ชันในระบบ',
      ],
      correctIndex: 0,
      explanation: 'ในภาษา Python โครงสร้างคำสั่งภายในฟังก์ชันหรือบล็อกคำสั่งจะต้องมีการเว้นวรรคย่อหน้า (Indentation) เสมอ',
      hint: 'ดูการจัดแนวขอบซ้ายของบรรทัดที่ 2 และ 3 เทียบกับบรรทัดแรก',
      damageValue: 50,
    },
    {
      id: 'q5-3',
      category: 'function call & return',
      tier: 'medium_plus',
      codeSnippet: `def calculate_damage(base, bonus):\n    total = base + (bonus * 2)\n    return total\n\nfinal_dmg = calculate_damage(30, 10)\nprint(final_dmg)`,
      prompt: 'ค่าตัวเลขที่ final_dmg จะแสดงผลออกมาคือเท่าใด?',
      options: [
        '50',
        '80',
        '40',
        '60',
      ],
      correctIndex: 0,
      explanation: 'base = 30, bonus = 10 -> bonus * 2 = 20 -> 30 + 20 = 50 คืนค่า 50 กลับมาเก็บใน final_dmg',
      hint: 'คำนวณในวงเล็บก่อน: (10 * 2) = 20 แล้วนำไปบวกกับ 30',
      damageValue: 55,
    },
    {
      id: 'q5-4',
      category: 'ultimate boss riddle',
      tier: 'medium_plus',
      codeSnippet: `magic_spells = ["Fire", "Ice", "Lightning"]\nfor spell in magic_spells:\n    if spell == "Lightning":\n        print("Critical Strike!")`,
      prompt: 'เมื่อลูปทำงานจนถึงรอบสุดท้าย ข้อความ "Critical Strike!" จะถูกพิมพ์ออกมาเพราะเหตุใด?',
      options: [
        'เพราะเงื่อนไข spell == "Lightning" เป็น True ในการวนซ้ำรอบที่สาม',
        'เพราะคำว่า Lightning อยู่ในตำแหน่ง index 0',
        'เพราะลูปจะรันเฉพาะคำสั่ง if เสมอ',
        'เพราะคำสั่ง print() ถูกบังคับให้ทำงานก่อนจบลูป',
      ],
      correctIndex: 0,
      explanation: 'การวนซ้ำ for-in จะหยิบสมาชิกทีละตัว เมื่อถึงรอบที่สาม spell จะเท่ากับ "Lightning" ทำให้ if ตรวจสอบเป็น True และพิมพ์ข้อความ',
      hint: 'ในการวนซ้ำรอบที่สาม ตัวแปร spell จะเก็บค่า "Lightning" พอดี',
      damageValue: 60,
    },
  ],
};

export const Game3PythonTextAdventure: React.FC<Game3PythonTextAdventureProps> = ({
  onComplete,
}) => {
  // Game & Combat State
  const [currentStageIndex, setCurrentStageIndex] = useState(0); // 0 to 4
  const [monsters, setMonsters] = useState<Monster[]>(() =>
    MONSTERS_DATA.map((m) => ({ ...m, currentHp: m.maxHp }))
  );

  // Player Stats
  const [playerHp, setPlayerHp] = useState(100);
  const [maxPlayerHp] = useState(100);
  const [playerMp, setPlayerMp] = useState(100);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState(0);

  // Combat Mode & Current Question
  const [combatMode, setCombatMode] = useState<'attack' | 'critical' | 'shield' | 'terminal'>('attack');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Freeform Python Terminal
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string | null>(null);

  // Dungeon Master Narrator State
  const [dmSpeech, setDmSpeech] = useState<string>(
    'ยินดีต้อนรับผู้กล้าเข้าสู่ Neo-Pythonia! ข้าคือ AI Dungeon Master ผู้คุมกฎแห่งมิติไพทอน ตอบคำถามและร่ายโค้ดไพทอนเพื่อพิชิตมอนสเตอร์บั๊กทั้ง 5 ด่าน!'
  );
  const [dmMood, setDmMood] = useState<'idle' | 'happy' | 'warning' | 'cheering' | 'adapting'>('idle');
  const [difficultyTier, setDifficultyTier] = useState<DifficultyTier>('medium');
  const [aiAdaptiveNote, setAiAdaptiveNote] = useState<string>(
    'AI Dungeon Master กำลังปรับความยากระดับ: ปานกลาง (สมดุล ม.1)'
  );

  // Combat FX
  const [playerAnim, setPlayerAnim] = useState<'idle' | 'attack' | 'hit' | 'heal'>('idle');
  const [monsterAnim, setMonsterAnim] = useState<'idle' | 'hit' | 'attack' | 'die'>('idle');
  const [floatingText, setFloatingText] = useState<{ text: string; color: string; id: number }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isGameCleared, setIsGameCleared] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const currentMonster = monsters[currentStageIndex];

  // Helper to add floating combat text
  const addFloatingText = (text: string, color: string) => {
    const id = Date.now() + Math.random();
    setFloatingText((prev) => [...prev, { text, color, id }]);
    setTimeout(() => {
      setFloatingText((prev) => prev.filter((item) => item.id !== id));
    }, 1200);
  };

  // Select balanced question based on current stage and player's adaptive difficulty tier
  const pickNextQuestion = (stage: number, tier: DifficultyTier) => {
    // Check if teacher added custom questions for this stage
    const customQuestionsMap = StorageService.games.getGame3Questions();
    const customForStage: Question[] = (customQuestionsMap[stage + 1] || []).map((cq) => ({
      id: cq.id,
      category: cq.category || 'Python Quiz',
      tier: (cq.tier as DifficultyTier) || 'medium',
      prompt: cq.prompt,
      codeSnippet: cq.codeSnippet || cq.starterCode || '',
      options: cq.options || cq.choices || ['ก', 'ข', 'ค', 'ง'],
      correctIndex: cq.correctIndex !== undefined ? cq.correctIndex : (cq.correctAnswer ?? 0),
      explanation: cq.explanation,
      hint: cq.hint || 'วิเคราะห์คำสั่งไพทอนและตัวเลือก',
      damageValue: cq.damageValue || cq.damageBonus || 35,
    }));

    const stageQuestions = [
      ...(QUESTION_BANK[stage + 1] || QUESTION_BANK[1]),
      ...customForStage,
    ];
    // Filter questions matching tier if possible, else fallback to any in stage
    const matching = stageQuestions.filter((q) => q.tier === tier);
    const pool = matching.length > 0 ? matching : stageQuestions;
    const randomQ = pool[Math.floor(Math.random() * pool.length)];
    setCurrentQuestion(randomQ);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setShowExplanation(false);
    setShowHint(false);
  };

  // Initialize stage
  useEffect(() => {
    pickNextQuestion(currentStageIndex, difficultyTier);
  }, [currentStageIndex]);

  // Real-time difficulty adaptation logic
  const adaptDifficulty = (wasCorrect: boolean, newStreak: number) => {
    let nextTier: DifficultyTier = difficultyTier;
    let note = '';

    if (wasCorrect) {
      if (newStreak >= 3) {
        nextTier = 'medium_plus';
        note = '⚡ ผู้กล้าแม่นยำมาก! AI Dungeon Master ปรับความยากขึ้นเป็น "ท้าทายปานกลาง" พร้อมเพิ่มโบนัสคะแนน!';
        setDmMood('cheering');
      } else if (newStreak >= 1) {
        nextTier = 'medium';
        note = '✨ AI Dungeon Master ปรับระดับโจทย์เป็น "มาตรฐานปานกลาง" เหมาะสำหรับนักเรียน ม.1!';
        setDmMood('happy');
      }
    } else {
      if (playerHp <= 40 || newStreak === 0) {
        nextTier = 'easy_mod';
        note = '🛡️ AI Dungeon Master ปรับความยากลงสู่ "ระดับพื้นฐาน ม.1" เพื่อให้คุณจับหลักการได้ง่ายขึ้น!';
        setDmMood('warning');
      } else {
        nextTier = 'medium';
        note = '💡 AI Dungeon Master รักษาระดับโจทย์ที่ "ระดับปานกลางสมดุล"';
        setDmMood('idle');
      }
    }

    setDifficultyTier(nextTier);
    setAiAdaptiveNote(note);
  };

  // Handle Player Answer Choice
  const handleAnswerSubmit = async (optionIdx: number) => {
    if (isAnswerSubmitted || !currentQuestion || isGameOver || isGameCleared) return;

    setSelectedOption(optionIdx);
    setIsAnswerSubmitted(true);
    setTotalQuestionsAnswered((prev) => prev + 1);

    const isCorrect = optionIdx === currentQuestion.correctIndex;

    if (isCorrect) {
      // SUCCESS HIT!
      sfx.playCorrect();
      const newStreak = streak + 1;
      setStreak(newStreak);
      setCorrectAnswersCount((prev) => prev + 1);

      // Calculate damage with streak multiplier
      const multiplier = newStreak >= 3 ? 1.5 : newStreak >= 2 ? 1.2 : 1.0;
      const baseDmg = currentQuestion.damageValue;
      const calculatedDmg = Math.round(baseDmg * multiplier);

      setPlayerAnim('attack');
      setMonsterAnim('hit');
      addFloatingText(`💥 -${calculatedDmg} HP ${newStreak >= 3 ? '(CRITICAL!)' : ''}`, 'text-amber-400');

      const xpEarned = Math.round(25 * multiplier);
      setScore((prev) => prev + calculatedDmg);
      setTotalXpEarned((prev) => prev + xpEarned);

      // Update Monster HP
      const updatedMonsters = [...monsters];
      const newMonsterHp = Math.max(0, updatedMonsters[currentStageIndex].currentHp - calculatedDmg);
      updatedMonsters[currentStageIndex].currentHp = newMonsterHp;
      setMonsters(updatedMonsters);

      // DM Speech & Adaptive tier
      setDmSpeech(
        `ยอดเยี่ยมมาก! การฟาดฟันคำสั่ง "${currentQuestion.options[optionIdx]}" สร้างความเสียหาย ${calculatedDmg} HP! ${currentQuestion.explanation}`
      );
      adaptDifficulty(true, newStreak);

      setTimeout(() => {
        setPlayerAnim('idle');
        setMonsterAnim('idle');
      }, 500);

      // Check if current monster is defeated
      if (newMonsterHp <= 0) {
        handleMonsterDefeated();
      }
    } else {
      // WRONG ANSWER - MONSTER COUNTER ATTACKS!
      sfx.playWrong();
      setStreak(0);
      setPlayerAnim('hit');
      setMonsterAnim('attack');

      const monsterAtk = currentMonster.attackPower;
      const newPlayerHp = Math.max(0, playerHp - monsterAtk);
      setPlayerHp(newPlayerHp);
      addFloatingText(`🛡️ โดนสวนกลับ -${monsterAtk} HP!`, 'text-rose-400');

      setDmSpeech(
        `ยังไม่ถูกต้องนะผู้กล้า! คำตอบที่ถูกคือ "${currentQuestion.options[currentQuestion.correctIndex]}" (${currentQuestion.explanation}) มอนสเตอร์สวนกลับ ${monsterAtk} HP!`
      );
      adaptDifficulty(false, 0);

      setTimeout(() => {
        setPlayerAnim('idle');
        setMonsterAnim('idle');
      }, 500);

      if (newPlayerHp <= 0) {
        setIsGameOver(true);
      }
    }

    setShowExplanation(true);
  };

  // Handle Monster Defeat & Stage Progression
  const handleMonsterDefeated = () => {
    sfx.playGameSuccess();
    setMonsterAnim('die');
    addFloatingText(`✨ พิชิต ${currentMonster.name} สำเร็จ!`, 'text-emerald-400');

    if (currentStageIndex >= MONSTERS_DATA.length - 1) {
      // ALL 5 STAGES CLEARED! BOSS DEFEATED!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setIsGameCleared(true);
      setDmSpeech(
        '🏆 มหัศจรรย์ยิ่งนัก! ท่านได้พิชิต "Compiler Bug Dragon Lord" และปลดปล่อยอาณาจักร Neo-Pythonia ได้สำเร็จ สมบูรณ์แบบทุกหลักการไพทอน ม.1!'
      );
      onComplete(score + 100, 500, totalXpEarned + 100);
    } else {
      // Move to Next Stage after brief delay
      setTimeout(() => {
        const nextStage = currentStageIndex + 1;
        setCurrentStageIndex(nextStage);
        setMonsterAnim('idle');
        // Bonus heal between stages
        setPlayerHp((prev) => Math.min(maxPlayerHp, prev + 25));
        addFloatingText('💚 ฟื้นฟู +25 HP เมื่อผ่านด่าน!', 'text-emerald-400');
        setDmSpeech(
          `ก้าวเข้าสู่ด่านที่ ${nextStage + 1}: เผชิญหน้ากับ "${MONSTERS_DATA[nextStage].name}" (${MONSTERS_DATA[nextStage].title})!`
        );
      }, 1400);
    }
  };

  // Freeform Python Terminal Command Execution (Interactive Spell Cast)
  const handleRunTerminalCode = () => {
    if (!terminalInput.trim()) return;

    const trimmed = terminalInput.trim();
    let output = '';
    let success = false;
    let dmg = 25;

    // Simulate safe Python snippets
    if (trimmed.startsWith('print(') && trimmed.endsWith(')')) {
      const inner = trimmed.slice(6, -1);
      output = `>>> [STDOUT]: ${inner.replace(/["']/g, '')}`;
      success = true;
      dmg = 35;
    } else if (trimmed.includes('=') && !trimmed.includes('==')) {
      output = `>>> กำหนดค่าตัวแปรในหน่วยความจำสำเร็จ: ${trimmed}`;
      success = true;
      dmg = 30;
    } else if (trimmed.startsWith('for ') || trimmed.startsWith('while ')) {
      output = `>>> รันคำสั่งวงวนซ้ำ Loop สำเร็จ (5 รอบ)`;
      success = true;
      dmg = 45;
    } else if (trimmed.startsWith('def ')) {
      output = `>>> ประกาศฟังก์ชันเวทมนตร์ Python สำเร็จ`;
      success = true;
      dmg = 50;
    } else {
      output = `>>> [PYTHON INTERPRETER]: คำสั่ง "${trimmed}" ถูกคอมไพล์และปล่อยพลังเวท`;
      success = true;
      dmg = 25;
    }

    setTerminalOutput(output);

    if (success) {
      sfx.playCollectStar();
      setPlayerAnim('attack');
      setMonsterAnim('hit');
      addFloatingText(`⚡ เวทโค้ดสด -${dmg} HP!`, 'text-cyan-400');

      const updatedMonsters = [...monsters];
      const newMonsterHp = Math.max(0, updatedMonsters[currentStageIndex].currentHp - dmg);
      updatedMonsters[currentStageIndex].currentHp = newMonsterHp;
      setMonsters(updatedMonsters);

      setScore((prev) => prev + dmg);
      setTotalXpEarned((prev) => prev + 15);
      setDmSpeech(`🪄 ยอดเยี่ยม! ท่านร่ายโค้ดสด: "${trimmed}" สร้างความเสียหาย ${dmg} HP แก่มอนสเตอร์!`);

      setTimeout(() => {
        setPlayerAnim('idle');
        setMonsterAnim('idle');
      }, 500);

      if (newMonsterHp <= 0) {
        handleMonsterDefeated();
      }
    }
  };

  // Reset Game
  const handleRestartGame = () => {
    setCurrentStageIndex(0);
    setMonsters(MONSTERS_DATA.map((m) => ({ ...m, currentHp: m.maxHp })));
    setPlayerHp(100);
    setPlayerMp(100);
    setStreak(0);
    setScore(0);
    setTotalXpEarned(0);
    setIsGameOver(false);
    setIsGameCleared(false);
    setDifficultyTier('medium');
    setDmSpeech('เริ่มต้นการผจญภัยรอบใหม่! จงแสดงฝีมือไพทอนให้เต็มที่!');
    pickNextQuestion(0, 'medium');
  };

  return (
    <div className="space-y-6 select-none font-['Prompt'] text-slate-100">
      {/* 1. TOP HEADER: DUNGEON MASTER & ADAPTIVE DIFFICULTY STATUS */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          {/* Dungeon Master Avatar & Speech */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="relative">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-600 to-indigo-600 p-0.5 shadow-lg shadow-indigo-500/20">
                <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-2xl">
                  🧙‍♂️
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white font-['Chakra_Petch']">
                  AI Dungeon Master (ผู้คุมเกม)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                  Adaptive AI
                </span>
              </div>
              <p className="text-xs text-amber-300 font-medium line-clamp-2 mt-0.5">
                "{dmSpeech}"
              </p>
            </div>
          </div>

          {/* Real-time Adaptive Difficulty Pill */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <div className="px-3.5 py-1.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-bold">ระดับความยากเรียลไทม์:</span>
              <span
                className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                  difficultyTier === 'easy_mod'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : difficultyTier === 'medium'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {difficultyTier === 'easy_mod'
                  ? '🟢 พื้นฐาน ม.1'
                  : difficultyTier === 'medium'
                  ? '🟡 มาตรฐานปานกลาง'
                  : '🟣 ท้าทายปานกลาง'}
              </span>
            </div>

            {streak >= 2 && (
              <div className="px-3 py-1.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center gap-1.5 animate-bounce">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>COMBO x{streak}!</span>
              </div>
            )}
          </div>
        </div>

        {/* Adaptive AI Notification Banner */}
        <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/60 px-4 py-2 rounded-2xl border border-slate-800/60">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-300">{aiAdaptiveNote}</span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            ด่านที่ {currentStageIndex + 1} / 5
          </span>
        </div>
      </div>

      {/* 2. RPG BATTLE ARENA (HERO VS MONSTER) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT: HERO STATUS (4 Cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-amber-500 p-0.5 transition-transform ${
                    playerAnim === 'attack'
                      ? 'scale-110 -rotate-6'
                      : playerAnim === 'hit'
                      ? 'translate-x-2 bg-rose-500'
                      : ''
                  }`}
                >
                  <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-2xl">
                    🧙
                  </div>
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-base font-['Chakra_Petch']">
                    ผู้กล้าไพทอน (Player)
                  </h4>
                  <div className="text-[11px] text-amber-400 font-bold">
                    จอมเวทไพทอน ม.1
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400">คะแนนสะสม</div>
                <div className="font-mono font-black text-amber-400 text-lg">
                  {score}
                </div>
              </div>
            </div>

            {/* Health Bar */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-rose-400">
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  <span>พลังชีวิต (HP)</span>
                </span>
                <span className="font-mono text-slate-200">
                  {playerHp} / {maxPlayerHp}
                </span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-500 ${
                    playerHp > 50
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      : playerHp > 25
                      ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                      : 'bg-gradient-to-r from-rose-600 to-rose-400 animate-pulse'
                  }`}
                  style={{ width: `${(playerHp / maxPlayerHp) * 100}%` }}
                />
              </div>
            </div>

            {/* Combat Actions Switcher */}
            <div className="mt-6 space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                เลือกรูปแบบการต่อสู้ (Combat Mode):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCombatMode('attack')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
                    combatMode === 'attack'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <Sword className="w-4 h-4" />
                  <span>โจมตีทายโจทย์</span>
                </button>

                <button
                  onClick={() => setCombatMode('terminal')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
                    combatMode === 'terminal'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-black'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <Terminal className="w-4 h-4" />
                  <span>เทอร์มินัลโค้ดสด</span>
                </button>
              </div>
            </div>
          </div>

          {/* Player stats footer */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <div>
              ตอบถูก: <span className="text-emerald-400 font-bold">{correctAnswersCount}</span> / {totalQuestionsAnswered} ข้อ
            </div>
            <div>
              XP ได้รับ: <span className="text-amber-400 font-bold">+{totalXpEarned} XP</span>
            </div>
          </div>
        </div>

        {/* RIGHT: MONSTER ENCOUNTER & BATTLE LOG (8 Cols) */}
        <div
          className={`lg:col-span-8 p-6 rounded-3xl bg-gradient-to-br ${currentMonster.bgGradient} border border-slate-800 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden`}
        >
          {/* Floating Combat Damage Text */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {floatingText.map((item) => (
              <div
                key={item.id}
                className={`text-xl sm:text-2xl font-black font-['Chakra_Petch'] drop-shadow-md animate-fade-in-up ${item.color}`}
              >
                {item.text}
              </div>
            ))}
          </div>

          {/* Monster Profile & HP Bar */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-3xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-4xl shadow-2xl transition-transform ${
                    monsterAnim === 'hit'
                      ? 'scale-90 rotate-12 bg-rose-950/80'
                      : monsterAnim === 'attack'
                      ? 'scale-125 -translate-x-3 bg-amber-950'
                      : monsterAnim === 'die'
                      ? 'opacity-0 scale-50'
                      : 'animate-bounce'
                  }`}
                >
                  {currentMonster.avatar}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-black text-white font-['Chakra_Petch']">
                      {currentMonster.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-black border border-rose-500/30">
                      BOSS #{currentMonster.id}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 font-medium">
                    {currentMonster.title}
                  </div>
                  <div className="text-[11px] text-amber-400/90 mt-0.5">
                    🎯 จุดเน้น: {currentMonster.conceptFocus}
                  </div>
                </div>
              </div>

              {/* Monster HP */}
              <div className="w-full sm:w-48 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-rose-400">Monster HP</span>
                  <span className="font-mono text-slate-200">
                    {currentMonster.currentHp} / {currentMonster.maxHp}
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500"
                    style={{
                      width: `${(currentMonster.currentHp / currentMonster.maxHp) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. COMBAT INTERACTION SECTION */}
          {combatMode === 'attack' && currentQuestion && (
            <div className="space-y-4 bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Zap className="w-4 h-4" />
                  <span>โจทย์ไพทอนพิชิตมอนสเตอร์:</span>
                </span>

                <button
                  onClick={() => setShowHint(!showHint)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showHint ? 'ซ่อนคำใบ้' : 'ขอคำใบ้จาก DM'}</span>
                </button>
              </div>

              {/* Question Prompt */}
              <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
                {currentQuestion.prompt}
              </p>

              {/* Python Code Snippet if applicable */}
              {currentQuestion.codeSnippet && (
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs sm:text-sm text-emerald-400 overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{currentQuestion.codeSnippet}</pre>
                </div>
              )}

              {/* Hint Box */}
              {showHint && (
                <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex items-start gap-2 animate-fade-in">
                  <Bot className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">คำใบ้จาก AI Dungeon Master:</span> {currentQuestion.hint}
                  </div>
                </div>
              )}

              {/* Options 4 Choices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {currentQuestion.options.map((opt, idx) => {
                  let btnStyle = 'bg-slate-900 border-slate-800 text-slate-200 hover:border-amber-500/50';

                  if (isAnswerSubmitted) {
                    if (idx === currentQuestion.correctIndex) {
                      btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-black ring-1 ring-emerald-400';
                    } else if (idx === selectedOption) {
                      btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300 ring-1 ring-rose-400';
                    } else {
                      btnStyle = 'bg-slate-900/40 border-slate-800/40 text-slate-500 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isAnswerSubmitted}
                      onClick={() => handleAnswerSubmit(idx)}
                      className={`p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-start gap-2.5 ${btnStyle}`}
                    >
                      <span className="w-5 h-5 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-black shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 font-medium">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Post Answer Next Step */}
              {isAnswerSubmitted && (
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-300">
                    {selectedOption === currentQuestion.correctIndex ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>โจมตีถูกต้อง! +{currentQuestion.damageValue} DMG</span>
                      </span>
                    ) : (
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        <span>โดนสวนกลับ! -{currentMonster.attackPower} HP</span>
                      </span>
                    )}
                  </span>

                  {currentMonster.currentHp > 0 && (
                    <button
                      onClick={() => pickNextQuestion(currentStageIndex, difficultyTier)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-colors flex items-center gap-1.5 shadow-lg"
                    >
                      <span>โจทย์ต่อไป</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* COMBAT MODE: FREEFORM PYTHON TERMINAL */}
          {combatMode === 'terminal' && (
            <div className="space-y-4 bg-slate-950/90 p-5 rounded-2xl border border-slate-800/80 font-mono text-xs">
              <div className="flex items-center justify-between text-cyan-400 text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  <span>Python Cyber Spell Terminal (รันโค้ดสดเพื่อปล่อยเวท):</span>
                </span>
                <span className="text-[10px] text-slate-500">Live Execution</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunTerminalCode()}
                  placeholder='เช่น print("Attack!"), x = 10, for i in range(3): fire()'
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-cyan-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 font-mono text-xs"
                />
                <button
                  onClick={handleRunTerminalCode}
                  className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-colors flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>รันโค้ด</span>
                </button>
              </div>

              {terminalOutput && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400">
                  {terminalOutput}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. GAME OVER OR VICTORY MODAL */}
      {isGameCleared && (
        <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-amber-950/40 border border-amber-500/40 text-center space-y-6 shadow-2xl animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center mx-auto text-4xl shadow-xl animate-bounce">
            🏆
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Chakra_Petch']">
              พิชิตดันเจี้ยนไพทอนสำเร็จ! (Dungeon Cleared)
            </h2>
            <p className="text-sm text-amber-300 max-w-xl mx-auto">
              คุณได้ปราบมอนสเตอร์ทั้ง 5 ด่าน ตั้งแต่ตัวแปร เงื่อนไข วงวนซ้ำ จนถึงมังกรบั๊กคอมไพเลอร์!
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 py-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 min-w-36">
              <div className="text-xs text-slate-400">คะแนนการต่อสู้</div>
              <div className="text-2xl font-black text-amber-400 font-mono">{score}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 min-w-36">
              <div className="text-xs text-slate-400">XP ที่ได้รับ</div>
              <div className="text-2xl font-black text-emerald-400 font-mono">+{totalXpEarned + 100} XP</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 min-w-36">
              <div className="text-xs text-slate-400">อัตราความแม่นยำ</div>
              <div className="text-2xl font-black text-cyan-400 font-mono">
                {totalQuestionsAnswered > 0
                  ? `${Math.round((correctAnswersCount / totalQuestionsAnswered) * 100)}%`
                  : '100%'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleRestartGame}
              className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>เล่นซ้ำอีกครั้ง</span>
            </button>
          </div>
        </div>
      )}

      {isGameOver && (
        <div className="p-8 rounded-3xl bg-slate-900 border border-rose-500/40 text-center space-y-6 shadow-2xl animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center mx-auto text-3xl">
            💀
          </div>

          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-white font-['Chakra_Petch']">
              พลังชีวิตหมดลง! (Defeated in Dungeon)
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              AI Dungeon Master ได้เตรียมการช่วยเหลือและปรับระดับโจทย์ให้เหมาะสมยิ่งขึ้น ลองใหม่อีกครั้ง!
            </p>
          </div>

          <button
            onClick={handleRestartGame}
            className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-colors flex items-center gap-2 mx-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ลองใหม่อีกครั้ง (ฟื้นคืนชีพ)</span>
          </button>
        </div>
      )}
    </div>
  );
};
