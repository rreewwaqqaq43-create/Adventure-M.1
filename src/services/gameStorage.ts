/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Game1RoundData,
  Game2CardPair,
  Game3Question,
  Game3Monster,
  Game4ScratchStage,
  Game5DataCardPair,
  Game6ARTarget,
} from '../types';

// Helper for local storage
const getLocal = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(`comp_sci_m1_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const setLocal = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(`comp_sci_m1_${key}`, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
};

// =============================================================
// CHAPTER 1: AR Hand Tracking & Abstraction
// =============================================================
export const DEFAULT_GAME1_ROUNDS: Game1RoundData[] = [
  {
    id: 1,
    missionTitle: 'ภารกิจที่ 1: แผนที่ระบบรถไฟฟ้า (Transit Map Abstraction)',
    situation: 'ต้องการออกแบบแผนที่เส้นทางรถไฟฟ้าเพื่อให้ผู้โดยสารเดินทางได้สะดวกและรวดเร็วที่สุด',
    targetGoal: 'ใช้มือ AR หรือคลิกคัดแยกเฉพาะข้อมูลที่ "จำเป็นต่อการเดินทาง" เข้าสู่ระบบ',
    items: [
      { id: 'item-1', name: 'ชื่อสถานีรถไฟฟ้า', isEssential: true, category: 'การเดินทาง', icon: '🚉', reason: 'จำเป็นอย่างยิ่งเพื่อให้ผู้โดยสารทราบตำแหน่งขึ้น-ลง' },
      { id: 'item-2', name: 'จุดเชื่อมต่อสาย (Interchange)', isEssential: true, category: 'การเดินทาง', icon: '🔄', reason: 'จำเป็นในการเปลี่ยนขบวนรถเพื่อไปยังจุดหมาย' },
      { id: 'item-3', name: 'สีหลังคาบ้านประชาชน', isEssential: false, category: 'สิ่งแวดล้อม', icon: '🏠', reason: 'เป็นรายละเอียดปลีกย่อย ไม่จำเป็นต่อการขึ้นรถไฟฟ้า' },
      { id: 'item-4', name: 'ต้นไม้ริมทางรถไฟ', isEssential: false, category: 'สิ่งแวดล้อม', icon: '🌳', reason: 'ทำให้แผนที่รกและสับสน ละทิ้งได้ตามหลัก Abstraction' },
      { id: 'item-5', name: 'ทิศทางและลำดับสถานี', isEssential: true, category: 'การเดินทาง', icon: '➡️', reason: 'จำเป็นเพื่อรู้ว่ารถวิ่งไปทิศทางใด' },
      { id: 'item-6', name: 'จำนวนเสาไฟฟ้าริมราง', isEssential: false, category: 'สิ่งแวดล้อม', icon: '💡', reason: 'ไม่มีผลต่อการตัดสินใจเดินทาง' },
    ],
  },
  {
    id: 2,
    missionTitle: 'ภารกิจที่ 2: ระบบทะเบียนประวัตินักเรียน (Student Profile)',
    situation: 'ต้องการพัฒนาแบบฟอร์มบันทึกข้อมูลนักเรียนเพื่อการรายงานผลการเรียนของโรงเรียน',
    targetGoal: 'คัดกรองข้อมูลสำคัญทางทะเบียนนักเรียน ละทิ้งข้อมูลที่ไม่เกี่ยวข้อง',
    items: [
      { id: 'item-7', name: 'เลขประจำตัวนักเรียน', isEssential: true, category: 'ข้อมูลหลัก', icon: '🆔', reason: 'ใช้เป็นรหัสอ้างอิงเอกลักษณ์เฉพาะบุคคล (Primary Key)' },
      { id: 'item-8', name: 'ชื่อ-นามสกุล', isEssential: true, category: 'ข้อมูลหลัก', icon: '👤', reason: 'จำเป็นต่อการระบุตัวตนและออกเอกสารผลการเรียน' },
      { id: 'item-9', name: 'สีเคสโทรศัพท์ที่ชอบ', isEssential: false, category: 'ความชอบส่วนตัว', icon: '📱', reason: 'เป็นรสนิยมส่วนบุคคล ไม่เกี่ยวข้องกับการบันทึกผลการเรียน' },
      { id: 'item-10', name: 'ระดับชั้นและห้องเรียน', isEssential: true, category: 'ข้อมูลหลัก', icon: '🏫', reason: 'จำเป็นในการจัดกลุ่มและออกเกรดเฉลี่ย' },
      { id: 'item-11', name: 'ยี่ห้อรองเท้าที่ใส่มาเรียน', isEssential: false, category: 'ของใช้ส่วนตัว', icon: '👟', reason: 'ไม่มีความจำเป็นต่อการจัดการข้อมูลทางวิชาการ' },
      { id: 'item-12', name: 'แนวเพลงที่ชอบฟัง', isEssential: false, category: 'ความชอบส่วนตัว', icon: '🎵', reason: 'รายละเอียดปลีกย่อยที่ต้องละทิ้งในการตัดเกรด' },
    ],
  },
];

// =============================================================
// CHAPTER 2: Flashcards & Flowchart Matching
// =============================================================
export const DEFAULT_GAME2_PAIRS: Game2CardPair[] = [
  {
    pairId: 'p1',
    symbolOrImage: '🛑 [Terminal: วงรี]',
    name: 'จุดเริ่มต้นและสิ้นสุด (Start/End)',
    desc: 'สัญลักษณ์วงรี ใช้ระบุจุดเริ่มต้นและสิ้นสุดของโปรแกรมหรือผังงาน',
    category: 'FLOWCHART',
  },
  {
    pairId: 'p2',
    symbolOrImage: '⚙️ [Process: สี่เหลี่ยมผืนผ้า]',
    name: 'การประมวลผล / การปฏิบัติงาน',
    desc: 'สี่เหลี่ยมผืนผ้า ใช้แทนการคำนวณ กำหนดค่า หรือการประมวลผลคำสั่ง',
    category: 'FLOWCHART',
  },
  {
    pairId: 'p3',
    symbolOrImage: '💎 [Decision: สี่เหลี่ยมขนมเปียกปูน]',
    name: 'การตัดสินใจ / ตรวจสอบเงื่อนไข',
    desc: 'สี่เหลี่ยมรูปเพชร ใช้ตรวจสอบเงื่อนไข มีเส้นทางออก จริง (True) หรือ เท็จ (False)',
    category: 'FLOWCHART',
  },
  {
    pairId: 'p4',
    symbolOrImage: '📥 [Input/Output: สี่เหลี่ยมด้านขนาน]',
    name: 'การรับหรือแสดงผลข้อมูลทั่วไป',
    desc: 'สี่เหลี่ยมด้านขนาน ใช้แทนการรับเข้าข้อมูลหรือแสดงผลโดยไม่ระบุอุปกรณ์',
    category: 'FLOWCHART',
  },
  {
    pairId: 'p5',
    symbolOrImage: '⚪ [Connector: วงกลม]',
    name: 'จุดเชื่อมต่อในหน้าเดียวกัน',
    desc: 'วงกลมขนาดเล็ก ใช้เชื่อมต่อเส้นทางการทำงานในหน้าเดียวกัน',
    category: 'FLOWCHART',
  },
  {
    pairId: 'p6',
    symbolOrImage: '🧭 [1. วิเคราะห์ปัญหา]',
    name: 'ทำความเข้าใจและกำหนดรายละเอียดปัญหา',
    desc: 'ขั้นตอนแรก: ระบุว่าอะไรคือข้อมูลเข้า (Input), ข้อมูลออก (Output), และเงื่อนไข',
    category: 'STEP',
  },
];

// =============================================================
// CHAPTER 3: Python Cyber Quest & Boss Battle
// =============================================================
export const DEFAULT_GAME3_MONSTERS: Game3Monster[] = [
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

export const DEFAULT_GAME3_QUESTIONS: Record<number, Game3Question[]> = {
  1: [
    {
      id: 'q1-1',
      category: 'print & string',
      tier: 'easy_mod',
      prompt: 'ต้องการแสดงข้อความว่า "Hello Python" ออกทางหน้าจอ ต้องใช้คำสั่งใด?',
      codeSnippet: '# ต้องการผลลัพธ์:\n# Hello Python',
      options: [
        'print("Hello Python")',
        'echo "Hello Python"',
        'display(Hello Python)',
        'System.out.println("Hello Python")',
      ],
      correctIndex: 0,
      explanation: 'ในภาษา Python คำสั่ง print() ใช้สำหรับแสดงผลข้อมูลออกทางจอภาพ และข้อความต้องอยู่ในเครื่องหมายคำพูด',
      hint: 'คำสั่งขึ้นต้นด้วย p มีวงเล็บเปิดปิด',
      damageValue: 35,
    },
    {
      id: 'q1-2',
      category: 'variables',
      tier: 'easy_mod',
      prompt: 'ชื่อตัวแปรในภาษา Python ข้อใดตั้งชื่อได้ "ถูกต้องตามหลักไวยากรณ์"?',
      options: ['2score', 'my_score', 'total score', 'class'],
      correctIndex: 1,
      explanation: 'ชื่อตัวแปรห้ามขึ้นต้นด้วยตัวเลข, ห้ามมีเว้นวรรค, และห้ามใช้คำสงวน (เช่น class) ชื่อ my_score จึงถูกต้อง',
      hint: 'ใช้เครื่องหมายขีดล่าง (underscore) เชื่อมคำได้',
      damageValue: 35,
    },
    {
      id: 'q1-3',
      category: 'data types',
      tier: 'easy_mod',
      prompt: 'ข้อมูล x = 15.5 จัดเป็นข้อมูลประเภท (Data Type) ใดใน Python?',
      codeSnippet: 'x = 15.5\nprint(type(x))',
      options: ['int (จำนวนเต็ม)', 'float (ทศนิยม)', 'str (ข้อความ)', 'bool (บูลีน)'],
      correctIndex: 1,
      explanation: 'ตัวเลขที่มีจุดทศนิยมจัดเป็น float (Floating Point Number)',
      hint: 'มีจุดทศนิยม',
      damageValue: 35,
    },
  ],
  2: [
    {
      id: 'q2-1',
      category: 'input & casting',
      tier: 'easy_mod',
      prompt: 'ต้องการรับค่าตัวเลขจำนวนเต็มจากแป้นพิมพ์มาเก็บในตัวแปร age ต้องเขียนคำสั่งอย่างไร?',
      codeSnippet: 'age = ?(input("กรอกอายุ: "))',
      options: ['int', 'str', 'float', 'num'],
      correctIndex: 0,
      explanation: 'ฟังก์ชัน input() รับค่ามาเป็น string เสมอ จึงต้องใช้ int() เพื่อแปลงเป็นจำนวนเต็มสำหรับการคำนวณ',
      hint: 'ย่อมาจาก integer',
      damageValue: 40,
    },
    {
      id: 'q2-2',
      category: 'operators',
      tier: 'medium',
      prompt: 'ผลลัพธ์ของนิพจน์ 17 // 3 ใน Python คือข้อใด?',
      codeSnippet: 'result = 17 // 3\nprint(result)',
      options: ['5.6667', '5', '2', '5.0'],
      correctIndex: 1,
      explanation: 'เครื่องหมาย // คือ Floor Division หรือการหารปัดเศษทิ้งเป็นจำนวนเต็ม 17 // 3 ได้ 5 (เศษ 2 ได้จาก 17 % 3)',
      hint: '// คือการหารเอาเฉพาะผลลัพธ์จำนวนเต็ม ไม่เอาเศษ',
      damageValue: 40,
    },
  ],
  3: [
    {
      id: 'q3-1',
      category: 'conditionals',
      tier: 'medium',
      prompt: 'ถ้า score = 75 เงื่อนไขใดจะประเมินค่าเป็น True?',
      codeSnippet: 'score = 75\n# เงื่อนไขใดถูกต้อง?',
      options: ['score >= 80', 'score < 50', 'score >= 70 and score < 80', 'score == 70'],
      correctIndex: 2,
      explanation: '75 มากกว่าหรือเท่ากับ 70 และน้อยกว่า 80 ทั้งสองฝั่งเป็นจริง ผลลัพธ์จึงเป็น True',
      hint: '75 อยู่ระหว่าง 70 ถึง 80',
      damageValue: 45,
    },
  ],
  4: [
    {
      id: 'q4-1',
      category: 'loops',
      tier: 'medium_plus',
      prompt: 'คำสั่ง for i in range(1, 6): จะวนซ้ำทั้งหมดกี่รอบ และค่า i ตัวสุดท้ายคือเท่าใด?',
      codeSnippet: 'for i in range(1, 6):\n    print(i)',
      options: ['5 รอบ, ค่า i ตัวสุดท้ายคือ 5', '6 รอบ, ค่า i ตัวสุดท้ายคือ 6', '5 รอบ, ค่า i ตัวสุดท้ายคือ 6', '4 รอบ, ค่า i ตัวสุดท้ายคือ 5'],
      correctIndex: 0,
      explanation: 'range(1, 6) เริ่มที่ 1 สิ้นสุดก่อน 6 (คือ 1, 2, 3, 4, 5) วนซ้ำ 5 รอบ และ i ตัวสุดท้ายคือ 5',
      hint: 'range(start, stop) จะไม่รวมค่า stop',
      damageValue: 50,
    },
  ],
  5: [
    {
      id: 'q5-1',
      category: 'comprehensive',
      tier: 'medium_plus',
      prompt: 'พิจารณาโค้ดด้านล่าง ผลลัพธ์ที่แสดงคืออะไร?',
      codeSnippet: 'total = 0\nfor x in [2, 4, 6]:\n    total += x\nprint(total)',
      options: ['12', '0', '6', '246'],
      correctIndex: 0,
      explanation: 'total เริ่มต้นที่ 0 บวกเพิ่มทีละ 2, 4, 6 ได้ 0 + 2 + 4 + 6 = 12',
      hint: '2 + 4 + 6 เท่ากับเท่าไหร่',
      damageValue: 60,
    },
  ],
};

// =============================================================
// CHAPTER 4: Scratch AI Studio & Stages
// =============================================================
export const DEFAULT_GAME4_STAGES: Game4ScratchStage[] = [
  {
    stageNumber: 1,
    title: 'ด่านที่ 1: ก้าวแรกสู่ Scratch & ธงเขียว (Events & Motion)',
    subtitle: 'เริ่มต้นโปรแกรมด้วยการคลิกธงเขียวและการเดินของตัวละคร',
    objective: 'เมื่อคลิกธงเขียว ⚑ ให้แมว Scratch เดินไปข้างหน้า 30 ก้าว แล้วพูดว่า "Hello Scratch!"',
    conceptName: 'บล็อกเหตุการณ์ (Events) และบล็อกเคลื่อนไหว (Motion)',
    textbookPage: 'หนังสือ สสวท. ม.1 หน้า 90–95',
    mascotHint: 'วางบล็อก "when green flag clicked ⚑" เป็นบล็อกแรก ตามด้วย "move (30) steps" และ "say [Hello Scratch!] for 2 secs"',
    requiredBlockKeywords: ['when green flag', 'move', 'say'],
    initialBlocks: ['when green flag clicked ⚑'],
    targetScore: 20,
    availableBlocks: [
      {
        category: 'Events (เหตุการณ์)',
        color: 'bg-amber-500 text-slate-950 font-bold',
        blocks: ['when green flag clicked ⚑', 'when [space] key pressed'],
      },
      {
        category: 'Motion (เคลื่อนไหว)',
        color: 'bg-blue-600 text-white font-bold',
        blocks: ['move (30) steps', 'move (10) steps', 'turn right 15 degrees'],
      },
      {
        category: 'Looks (แสดงผล)',
        color: 'bg-purple-600 text-white font-bold',
        blocks: ['say [Hello Scratch!] for 2 secs', 'next costume', 'say [Meow!]'],
      },
    ],
  },
  {
    stageNumber: 2,
    title: 'ด่านที่ 2: การวนซ้ำและการสะท้อนขอบเวที (Forever & Bounce)',
    subtitle: 'สั่งให้แมวเดินลาดตระเวนตลอดเวลาโดยไม่หลุดออกจากจอ',
    objective: 'ใช้บล็อกวนซ้ำตลอด (forever) สั่งให้แมวเดินไปข้างหน้า สลับท่าเดิน (next costume) และถ้าชนขอบให้สะท้อนกลับ (if on edge, bounce)',
    conceptName: 'โครงสร้างควบคุมแบบวนซ้ำ (Loop) และการตรวจจับขอบเวที',
    textbookPage: 'หนังสือ สสวท. ม.1 หน้า 102–108',
    mascotHint: 'นำบล็อก "forever" มาครอบคำสั่ง "move (10) steps", "next costume" และ "if on edge, bounce"',
    requiredBlockKeywords: ['forever', 'move', 'if on edge, bounce'],
    initialBlocks: ['when green flag clicked ⚑'],
    targetScore: 40,
    availableBlocks: [
      {
        category: 'Control (ควบคุม)',
        color: 'bg-orange-500 text-slate-950 font-bold',
        blocks: ['forever', 'repeat (10)', 'wait 0.1 secs'],
      },
      {
        category: 'Motion (เคลื่อนไหว)',
        color: 'bg-blue-600 text-white font-bold',
        blocks: ['move (15) steps', 'if on edge, bounce', 'point in direction (90)'],
      },
      {
        category: 'Looks (แสดงผล)',
        color: 'bg-purple-600 text-white font-bold',
        blocks: ['next costume', 'switch costume to [costume1]'],
      },
    ],
  },
  {
    stageNumber: 3,
    title: 'ด่านที่ 3: ตัวแปรและการตัดสินใจ (Variables & Conditional)',
    subtitle: 'ระบบเก็บคะแนนเหรียญทองและตรวจสอบเงื่อนไขชนะเกม',
    objective: 'สร้างตัวแปร score เริ่มต้นที่ 0 เมื่อเดินชนเหรียญให้เปลี่ยนค่า score เพิ่ม 1 และถ้า score >= 5 ให้พูดว่า "You Win!"',
    conceptName: 'ตัวแปร (Variables) และเงื่อนไข (if-then)',
    textbookPage: 'หนังสือ สสวท. ม.1 หน้า 115–122',
    mascotHint: 'ใช้บล็อก "set [score] to 0" ตามด้วยบล็อก "if <touching [Coin]?> then" -> "change [score] by 1"',
    requiredBlockKeywords: ['score', 'if', 'change'],
    initialBlocks: ['when green flag clicked ⚑', 'set [score] to 0'],
    targetScore: 60,
    availableBlocks: [
      {
        category: 'Variables (ตัวแปร)',
        color: 'bg-amber-600 text-white font-bold',
        blocks: ['set [score] to 0', 'change [score] by 1', 'show variable [score]'],
      },
      {
        category: 'Control & Sensing',
        color: 'bg-teal-600 text-white font-bold',
        blocks: ['if <touching [Coin]?> then', 'forever', 'wait 0.2 secs'],
      },
      {
        category: 'Looks (แสดงผล)',
        color: 'bg-purple-600 text-white font-bold',
        blocks: ['say [You Win!] for 2 secs', 'say [Got coin!] for 1 secs'],
      },
    ],
  },
];

// =============================================================
// CHAPTER 5: Data Detective & Card Pairs
// =============================================================
export const DEFAULT_GAME5_PAIRS: Game5DataCardPair[] = [
  {
    pairId: 'dp-1',
    symbol: '📝 [ข้อมูลปฐมภูมิ]',
    name: 'เก็บรวบรวมจากแหล่งกำเนิดโดยตรง',
    detail: 'เช่น การทำแบบสอบถาม การสัมภาษณ์ หรือการสังเกตและจดบันทึกด้วยตนเอง',
    category: 'SOURCE',
  },
  {
    pairId: 'dp-2',
    symbol: '📚 [ข้อมูลทุติยภูมิ]',
    name: 'อ้างอิงจากข้อมูลที่มีผู้อื่นรวบรวมไว้แล้ว',
    detail: 'เช่น สถิติประชากรของรัฐ รายงานวิจัย หรือบทความในวารสารวิชาการ',
    category: 'SOURCE',
  },
  {
    pairId: 'dp-3',
    symbol: '⚖️ [Binary Search: ทวิภาค]',
    name: 'ค้นหาแบบแบ่งครึ่ง (ข้อมูลต้องเรียงลำดับแล้ว)',
    detail: 'เปรียบเทียบข้อมูลตัวกลางแล้วตัดครึ่งที่ไม่เกี่ยวข้องทิ้ง ทำงานได้รวดเร็วมาก',
    category: 'ALGO',
  },
  {
    pairId: 'dp-4',
    symbol: '🫧 [Bubble Sort: เรียงแบบฟอง]',
    name: 'เปรียบเทียบข้อมูลคู่ติดกันแล้วสลับตำแหน่ง',
    detail: 'นำค่าที่มากกว่าลอยตัวขึ้นไปข้างหน้าเหมือนฟองสบู่จนครบทุกตำแหน่ง',
    category: 'ALGO',
  },
  {
    pairId: 'dp-5',
    symbol: '📊 [แผนภูมิแท่ง (Bar Chart)]',
    name: 'เปรียบเทียบปริมาณระหว่างหมวดหมู่',
    detail: 'เหมาะสำหรับการเปรียบเทียบจำนวนนักเรียนแต่ละห้อง หรือยอดขายสินค้าแต่ละชนิด',
    category: 'CHART',
  },
  {
    pairId: 'dp-6',
    symbol: '📈 [กราฟเส้น (Line Graph)]',
    name: 'แสดงการเปลี่ยนแปลงและแนวโน้มตามเวลา',
    detail: 'เหมาะกับข้อมูลที่มีความต่อเนื่อง เช่น อุณหภูมิตลอด 24 ชั่วโมง หรือราคาหุ้น',
    category: 'CHART',
  },
  {
    pairId: 'dp-7',
    symbol: '🥧 [แผนภูมิรูปวงกลม (Pie Chart)]',
    name: 'แสดงสัดส่วนของข้อมูลเทียบกับทั้งหมด 100%',
    detail: 'เหมาะกับการแสดงสัดส่วนค่าใช้จ่าย สัดส่วนประชากรชาย-หญิง',
    category: 'CHART',
  },
];

// =============================================================
// CHAPTER 6: AR Cyber Guardian Targets
// =============================================================
export const DEFAULT_GAME6_TARGETS: Game6ARTarget[] = [
  {
    id: 't1',
    name: 'Phishing SMS หลอกแจกเงิน',
    type: 'THREAT',
    icon: '🚨',
    x: 20,
    y: 35,
    vx: 0.15,
    vy: 0.1,
    lawRef: 'ภัยคุกคามฟิชชิ่ง หลอกเอา OTP และรหัสธนาคาร',
    advice: 'ห้ามกดลิงก์แปลกปลอมและห้ามส่งรหัส OTP ให้ใครเด็ดขาด',
    scanned: false,
  },
  {
    id: 't2',
    name: 'สัญญาอนุญาต Creative Commons (CC-BY)',
    type: 'SAFE',
    icon: '🛡️',
    x: 75,
    y: 25,
    vx: -0.12,
    vy: 0.15,
    lawRef: 'การใช้งานผลงานอย่างถูกลิขสิทธิ์พร้อมระบุที่มา',
    advice: 'ใช้งานได้ถูกต้องตามกฎหมายลิขสิทธิ์และมีจริยธรรมดิจิทัล',
    scanned: false,
  },
  {
    id: 't3',
    name: 'มัลแวร์แฝงไฟล์ cracked_game.exe',
    type: 'THREAT',
    icon: '🦠',
    x: 35,
    y: 70,
    vx: 0.18,
    vy: -0.12,
    lawRef: 'พ.ร.บ.คอมพิวเตอร์ มาตรา 10 (รบกวนการทำงานของระบบ)',
    advice: 'ดาวน์โหลดโปรแกรมจากผู้ผลิตที่น่าเชื่อถือเท่านั้น',
    scanned: false,
  },
  {
    id: 't4',
    name: 'การตั้งรหัสผ่าน 2-Factor Authentication (2FA)',
    type: 'SAFE',
    icon: '🔐',
    x: 65,
    y: 60,
    vx: -0.15,
    vy: -0.1,
    lawRef: 'มาตรการความปลอดภัยไซเบอร์สากล (ISO 27001)',
    advice: 'ช่วยปกป้องบัญชีแม้รหัสผ่านจะถูกขโมย แนะนำให้เปิดใช้งานทุกบัญชี',
    scanned: false,
  },
  {
    id: 't5',
    name: 'ข่าวปลอม Fake News ใส่ร้ายผู้อื่น',
    type: 'THREAT',
    icon: '⚠️',
    x: 80,
    y: 45,
    vx: 0.1,
    vy: 0.15,
    lawRef: 'พ.ร.บ.คอมพิวเตอร์ มาตรา 14 (นำเข้าข้อมูลอันเป็นเท็จ)',
    advice: 'หยุดคิด ตรวจสอบแหล่งที่มาก่อนแชร์ และไม่ส่งต่อข้อมูลเท็จ',
    scanned: false,
  },
  {
    id: 't6',
    name: 'การเบลอหน้าคนอื่นในรูปถ่ายก่อนโพสต์ (PDPA)',
    type: 'SAFE',
    icon: '✨',
    x: 25,
    y: 75,
    vx: -0.1,
    vy: 0.1,
    lawRef: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)',
    advice: 'เคารพสิทธิความเป็นส่วนตัวของผู้อื่นก่อนนำภาพไปเผยแพร่สาธารณะ',
    scanned: false,
  },
];

// =============================================================
// GAME STORAGE SERVICE API
// =============================================================
export const GameStorageService = {
  // Chapter 1
  getGame1Rounds: (): Game1RoundData[] => {
    return getLocal<Game1RoundData[]>('game_1_rounds', DEFAULT_GAME1_ROUNDS);
  },
  saveGame1Rounds: (rounds: Game1RoundData[]): void => {
    setLocal('game_1_rounds', rounds);
  },

  // Chapter 2
  getGame2Pairs: (): Game2CardPair[] => {
    return getLocal<Game2CardPair[]>('game_2_pairs', DEFAULT_GAME2_PAIRS);
  },
  saveGame2Pairs: (pairs: Game2CardPair[]): void => {
    setLocal('game_2_pairs', pairs);
  },

  // Chapter 3
  getGame3Questions: (): Record<number, Game3Question[]> => {
    return getLocal<Record<number, Game3Question[]>>('game_3_questions', DEFAULT_GAME3_QUESTIONS);
  },
  saveGame3Questions: (questions: Record<number, Game3Question[]>): void => {
    setLocal('game_3_questions', questions);
  },
  getGame3Monsters: (): Game3Monster[] => {
    return getLocal<Game3Monster[]>('game_3_monsters', DEFAULT_GAME3_MONSTERS);
  },
  saveGame3Monsters: (monsters: Game3Monster[]): void => {
    setLocal('game_3_monsters', monsters);
  },

  // Chapter 4
  getGame4Stages: (): Game4ScratchStage[] => {
    return getLocal<Game4ScratchStage[]>('game_4_stages', DEFAULT_GAME4_STAGES);
  },
  saveGame4Stages: (stages: Game4ScratchStage[]): void => {
    setLocal('game_4_stages', stages);
  },

  // Chapter 5
  getGame5Pairs: (): Game5DataCardPair[] => {
    return getLocal<Game5DataCardPair[]>('game_5_pairs', DEFAULT_GAME5_PAIRS);
  },
  saveGame5Pairs: (pairs: Game5DataCardPair[]): void => {
    setLocal('game_5_pairs', pairs);
  },

  // Chapter 6
  getGame6Targets: (): Game6ARTarget[] => {
    return getLocal<Game6ARTarget[]>('game_6_targets', DEFAULT_GAME6_TARGETS);
  },
  saveGame6Targets: (targets: Game6ARTarget[]): void => {
    setLocal('game_6_targets', targets);
  },

  // Reset to default
  resetGameToDefault: (chapterNumber: number): void => {
    switch (chapterNumber) {
      case 1:
        GameStorageService.saveGame1Rounds(DEFAULT_GAME1_ROUNDS);
        break;
      case 2:
        GameStorageService.saveGame2Pairs(DEFAULT_GAME2_PAIRS);
        break;
      case 3:
        GameStorageService.saveGame3Questions(DEFAULT_GAME3_QUESTIONS);
        GameStorageService.saveGame3Monsters(DEFAULT_GAME3_MONSTERS);
        break;
      case 4:
        GameStorageService.saveGame4Stages(DEFAULT_GAME4_STAGES);
        break;
      case 5:
        GameStorageService.saveGame5Pairs(DEFAULT_GAME5_PAIRS);
        break;
      case 6:
        GameStorageService.saveGame6Targets(DEFAULT_GAME6_TARGETS);
        break;
    }
  },
};
