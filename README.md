# 🚀 Adventure M.1 - ผจญภัย สนุกคิด พิชิตวิทยาการคำนวณ (สสวท. ม.1)

> แพลตฟอร์มการเรียนรู้วิทยาการคำนวณ ระดับชั้นมัธยมศึกษาปีที่ 1 ตามหลักสูตร สสวท. ในรูปแบบ **Gamified Adventure Learning Experience** พร้อมมินิเกมเชิงโต้ตอบ คลังข้อสอบวัดผลสัมฤทธิ์ และระบบจัดการสำหรับคุณครูและผู้ดูแลระบบแบบครบวงจร

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC.svg)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28.svg)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)

---

## ✨ ไฮไลท์ฟีเจอร์เด่น (Key Features)

### 🗺️ 1. แผนที่การผจญภัย 7 ด่านหลัก (Curriculum Map)
- **ด่านที่ 1: แนวคิดเชิงคำนวณ (Computational Thinking)** — มินิเกม AR Hand Tracking แยกแยะคุณลักษณะสำคัญ (Abstraction)
- **ด่านที่ 2: การแก้ปัญหาด้วยผังงาน (Flowcharts & Algorithms)** — มินิเกมเปิดไพ่จับคู่ผังงาน รหัสลำลอง และขั้นตอนวิธี
- **ด่านที่ 3: เริ่มต้นกับ Python (Introduction to Python)** — มินิเกม Interactive Text Adventure แก้บั๊กและพิชิตภารกิจโค้ด
- **ด่านที่ 4: Scratch & AI Model Studio** — ฝึกโมเดล AI (Vision, Text, Audio) และบล็อกสร้างเกมคำนวณ
- **ด่านที่ 5: ข้อมูลและการประมวลผล (Data & Processing)** — มินิเกมจับคู่ปริศนาตรวจสอบความน่าเชื่อถือและการวิเคราะห์สารสนเทศ
- **ด่านที่ 6: การใช้เทคโนโลยีอย่างปลอดภัย (Cyber Safety & Digital Ethics)** — มินิเกมสืบสวนตามจับภัยคุกคามไซเบอร์และกฎหมายคอมพิวเตอร์
- **ด่านที่ 7: คลังข้อสอบวัดผลสัมฤทธิ์รวม 6 บท (Comprehensive Exam & Review)** — แบบทดสอบก่อนเรียน 30 ข้อ และแบบทดสอบหลังเรียน 30 ข้อ (รวม 60 ข้อ เต็ม 300 คะแนน ตอบถูกข้อละ 10 คะแนน) พร้อมเหรียญมหาบัณฑิต 🏆 (ไม่มีมินิเกม เป็นการสอบและทบทวนเนื้อหาล้วนๆ)

### 🎨 2. ระบบธีมสี & การตอบสนองสัมผัส (Themes & Sensory Feedback)
- **โหมดมืด (Dark Mode 🌙)**: สไตล์ Sci-Fi Cyberpunk เรืองรอง เหมาะสำหรับการใช้งานในที่แสงน้อย
- **โหมดสว่าง (Light Mode ☀️)**: โทนสีขาวสว่าง สบายตา พร้อมตัวหนังสือคมชัดและป้ายพาสเทลน่ารัก
- **Multi-Sensory Feedback**:
  - เสียงตอบสนองเฉพาะการกระทำสังเคราะห์ด้วย Web Audio API (✨ เพิ่ม, 💾 บันทึก, ✏️ แก้ไข, 🗑️ ลบ)
  - ระบบสั่นตอบสนอง (Haptic Vibration) บนมือถือและแท็บเล็ต
  - แถบแจ้งเตือนลอย Action Feedback Toast ทันสมัย

### 👨‍🏫 3. ระบบจัดการสำหรับคุณครูและแอดมิน (Teacher & Admin Portals)
- **จัดการห้องเรียนและนักเรียน**: เพิ่มห้องเรียน, เพิ่มนักเรียนรายคน/นำเข้ารายชื่อชุด, จัดการสิทธิ์
- **ระบบล็อคด่าน (Stage Locking)**: ควบคุมการปลดล็อคบทเรียนทั้งระดับสากลหรือรายห้องเรียน พร้อมรหัส PIN คุณครู
- **แก้ไขคลังข้อสอบและเนื้อหา**: เพิ่ม แก้ไข ลบ ข้อสอบก่อนเรียน/หลังเรียนได้อย่างอิสระ
- **ตรวจและให้คะแนนใบงาน (Worksheet Grading)**: ตรวจคำตอบนักเรียนพร้อมส่งฟีดแบ็กตรงเข้ากล่องจดหมายนักเรียน
- **ส่งออกคะแนน (Google Sheets & CSV Export)**: ส่งออกสมุดเกรดและผลการประเมินสู่ Google Sheets ทันที

### ☁️ 4. การเชื่อมต่อฐานข้อมูลคลาวด์ (Cloud Firestore & Persistence)
- เชื่อมต่อ Cloud Firestore เพื่อจัดเก็บข้อมูลข้อสอบ วิดีโอ การล็อคด่าน และผลคะแนน
- ทำงานคู่กับระบบ Local Storage และ Express Backend สำรองข้อมูลออฟไลน์อัตโนมัติ

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Lucide React Icons
- **Animation & Effects**: Canvas Confetti, Motion, Web Audio API Synthesizer
- **Backend & Cloud**: Express (Node.js), Firebase Cloud Firestore, Firebase Authentication
- **External Integrations**: Google Workspace Sheets API (OAuth 2.0), YouTube Iframe Player

---

## 🚀 วิธีการติดตั้งและรันในเครื่อง (Local Setup)

### ข้อกำหนดเบื้องต้น (Prerequisites)
- [Node.js](https://nodejs.org/) เวอร์ชั่น 18 ขึ้นไป
- [npm](https://www.npmjs.com/)

### ขั้นตอนการรันโปรเจกต์
```bash
# 1. โคลนโปรเจกต์
git clone https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
cd <YOUR_REPO_NAME>

# 2. ติดตั้ง Dependencies ทั้งหมด
npm install

# 3. รัน Development Server
npm run dev
```

เปิดบราวเซอร์ไปที่: `http://localhost:3000`

### การสร้างเวอร์ชัน Production (Build)
```bash
npm run build
npm start
```

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
├── index.html                   # HTML entry point (SEO, fonts, meta tags)
├── firebase-applet-config.json  # Firebase client configuration
├── firestore.rules              # Firestore security access control rules
├── package.json                 # Project dependencies and npm scripts
├── server.ts                    # Full-stack Express server with Vite middleware
├── src/
│   ├── main.tsx                 # React application mounting & startup
│   ├── App.tsx                  # Main application orchestrator & view routing
│   ├── index.css                # Tailwind CSS global styles, tactile press & light/dark themes
│   ├── types.ts                 # TypeScript interfaces (Lessons, Quizzes, Profiles, Badges)
│   ├── components/              # Modular UI components
│   │   ├── Navbar.tsx           # Global header, search trigger, theme switcher, role pills
│   │   ├── HeroBanner.tsx       # Welcome dashboard hero with gamification stats
│   │   ├── LearningMap.tsx      # Interactive stage map nodes with chapter 1-7
│   │   ├── LessonDetailModal.tsx# Comprehensive study modal with tabs for pre/post-test & content
│   │   ├── QuizComponent.tsx    # 30-question interactive assessment engine
│   │   ├── VideoLibrary.tsx     # IPST curated video lessons player & playlists
│   │   ├── common/              # Common UI widgets (ThemeToggle, ActionFeedbackToast, etc.)
│   │   ├── games/               # Chapter 1-6 minigames (AR, Python Quest, Scratch AI, etc.)
│   │   ├── teacher/             # Classroom, Worksheet, and Content Management consoles
│   │   └── admin/               # Administrative user, security, and export modules
│   ├── services/                # API and Data Services
│   │   ├── firebase.ts          # Firestore database client & test connection
│   │   ├── storage.ts           # Local storage caching, state sync & master seed data
│   │   ├── auth.ts              # Google & credential authentication handlers
│   │   └── sheets.ts            # Google Sheets gradebook sync & export
│   └── utils/                   # Helpers (audioEffects.ts, feedback.ts, theme.ts, youtube.ts)
└── README.md
```

---

## 📄 ใบอนุญาต (License)

โปรเจกต์นี้เผยแพร่ภายใต้สัญญาอนุญาต [Apache License 2.0](LICENSE)
