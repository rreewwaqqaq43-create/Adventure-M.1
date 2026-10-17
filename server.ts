import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Persistent database file configuration
const DB_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DB_DIR, 'db.json');

function ensureDbFile(): Record<string, any> {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initialData: Record<string, any> = {
        videos: null,
        deleted_video_ids: [],
        stage_locks: null,
        classes: null,
        quizzes: null,
        lessons: null,
        worksheets: null,
        student_profiles: null,
        progress_list: null,
        updated_at: new Date().toISOString(),
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading persistent database:', err);
    return {};
  }
}

function saveDbFile(data: Record<string, any>) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    data.updated_at = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving persistent database:', err);
  }
}

async function startServer() {
  const app = express();

  // Resolve port:
  // 1. Check for CLI --port flag (passed by control plane)
  // 2. Check DEFAULT_APP_PORT or APP_PORT
  // 3. Check PORT env (unless it's 8080, which is where Nginx runs in this container)
  // 4. Default to 3000 (strict AI Studio requirement)
  let PORT = 3000;
  const portArgIdx = process.argv.indexOf('--port');
  if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
    const val = parseInt(process.argv[portArgIdx + 1], 10);
    if (!isNaN(val)) PORT = val;
  } else if (process.env.DEFAULT_APP_PORT) {
    const val = parseInt(process.env.DEFAULT_APP_PORT, 10);
    if (!isNaN(val)) PORT = val;
  } else if (process.env.APP_PORT) {
    const val = parseInt(process.env.APP_PORT, 10);
    if (!isNaN(val)) PORT = val;
  } else if (process.env.PORT && process.env.PORT !== '8080') {
    const val = parseInt(process.env.PORT, 10);
    if (!isNaN(val)) PORT = val;
  }

  app.use(express.json({ limit: '10mb' }));

  // Database API: Load all saved persistent data
  app.get('/api/db/load', (req, res) => {
    try {
      const db = ensureDbFile();
      return res.json({ success: true, data: db });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Database load error' });
    }
  });

  // Database API: Sync persistent data
  app.post('/api/db/sync', (req, res) => {
    try {
      const currentDb = ensureDbFile();
      const updates = req.body || {};
      const newDb = {
        ...currentDb,
        ...updates,
      };
      // Keep deleted_video_ids cumulative so deleted videos never resurrect
      if (Array.isArray(updates.deleted_video_ids)) {
        const set = new Set([...(currentDb.deleted_video_ids || []), ...updates.deleted_video_ids]);
        newDb.deleted_video_ids = Array.from(set);
      }
      saveDbFile(newDb);
      return res.json({ success: true, message: 'Database saved successfully', timestamp: newDb.updated_at });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Database sync error' });
    }
  });

  // GET /api/data/export-json: Download complete JSON database
  app.get('/api/data/export-json', (req, res) => {
    try {
      const db = ensureDbFile();
      res.setHeader('Content-Disposition', 'attachment; filename="adventure_m1_full_data.json"');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.send(JSON.stringify(db, null, 2));
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Data export error' });
    }
  });

  // GET /api/export/download: Download compressed full project archive
  app.get('/api/export/download', (req, res) => {
    try {
      const archivePath = path.resolve(__dirname, 'adventure-m1-code.tar.gz');
      // Ensure latest committed archive is generated
      try {
        execSync('git add .', { cwd: __dirname });
        try {
          execSync('git commit -m "chore: snapshot code and data before archive export"', { cwd: __dirname });
        } catch {}
        execSync('git archive --format=tar.gz -o adventure-m1-code.tar.gz HEAD', { cwd: __dirname });
      } catch (archiveErr) {
        console.warn('git archive warning:', archiveErr);
      }
      if (!fs.existsSync(archivePath)) {
        return res.status(404).json({ success: false, error: 'Archive file could not be generated' });
      }
      res.setHeader('Content-Disposition', 'attachment; filename="adventure-m1-code.tar.gz"');
      res.setHeader('Content-Type', 'application/gzip');
      return res.sendFile(archivePath);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Download error' });
    }
  });

  // POST /api/github/push: Push project repository to user's GitHub
  app.post('/api/github/push', (req, res) => {
    try {
      const { repoUrl, token, branch = 'main', allData } = req.body || {};
      if (!repoUrl) {
        return res.status(400).json({ success: false, error: 'กรุณาระบุ URL ของ GitHub Repository' });
      }

      // If client provided full application dataset, persist it to disk first so git tracks it
      if (allData && typeof allData === 'object') {
        saveDbFile(allData);
        try {
          const exportPath = path.resolve(DB_DIR, 'adventure_m1_dataset.json');
          fs.writeFileSync(exportPath, JSON.stringify(allData, null, 2), 'utf-8');
        } catch (e) {
          console.warn('Could not write export dataset:', e);
        }
      }

      let authenticatedUrl = repoUrl.trim();
      if (token && token.trim()) {
        const cleanToken = token.trim();
        let stripped = authenticatedUrl.replace(/^https?:\/\//, '');
        if (stripped.includes('@')) {
          stripped = stripped.split('@')[1];
        }
        authenticatedUrl = `https://${cleanToken}@${stripped}`;
      }

      // Commit all uncommitted changes and persistent data files
      try {
        execSync('git add .', { cwd: __dirname });
        execSync('git commit -m "update: Sync all application data and latest codebase to GitHub"', { cwd: __dirname });
      } catch {}

      try {
        execSync('git remote remove origin', { cwd: __dirname, stdio: 'ignore' });
      } catch {}

      execSync(`git remote add origin ${authenticatedUrl}`, { cwd: __dirname });
      execSync(`git push -u origin ${branch} --force`, { cwd: __dirname, timeout: 30000 });

      return res.json({ success: true, message: `อัปโหลดโค้ดและข้อมูลทั้งหมดขึ้น GitHub (${branch}) สำเร็จเรียบร้อย!` });
    } catch (err: any) {
      const errorMsg = err?.stderr?.toString() || err?.message || 'Git push error';
      return res.status(500).json({
        success: false,
        error: `ไม่สามารถ Push ขึ้น GitHub ได้: ${errorMsg}. กรุณาตรวจสอบว่าใส่ Personal Access Token (PAT) ที่มีสิทธิ์ repo หรือใส่ URL ถูกต้องหรือไม่`,
      });
    }
  });

  // Shared Gemini client
  const geminiApiKey = process.env.GEMINI_API_KEY || '';
  const ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // POST /api/python-adventure (AI Dungeon Master for Python Quiz RPG)
  app.post('/api/python-adventure', async (req, res) => {
    try {
      const { playerInput, currentMonster, playerStats = {}, difficultyTier = 'medium' } = req.body;

      const systemInstruction = `
คุณคือ "AI Dungeon Master" (ผู้คุมดันเจี้ยน) ประจำเกม "Python Dungeon Master: Quiz RPG"
เป้าหมายคือสอนและทดสอบวิชา "วิทยาการคำนวณ มัธยมศึกษาปีที่ 1 (สสวท.) บทที่ 3: การเขียนโปรแกรมด้วยภาษาไพทอน (Python)"

ความยากของโจทย์:
- ปรับระดับความยากตามความสามารถของผู้เล่นในระดับ "ปานกลาง สมดุล เหมาะสำหรับนักเรียน ม.1" ไม่ยากเกินไปและไม่ง่ายเกินไป
- หัวข้อที่ครอบคลุม: ตัวแปร (Variables), ชนิดข้อมูล (str, int, float, bool), input(), print(), ตัวดำเนินการ (+, -, *, /, %, ==, !=, >, <), คำสั่ง if-elif-else, คำสั่ง for-while-range(), และฟังก์ชัน/ลิสต์เบื้องต้น

บทบาทของคุณ:
- บรรยายการต่อสู้ด้วยน้ำเสียง Dungeon Master ที่ตื่นเต้นและมีอารมณ์ขัน (แฟนตาซี + ไซเบอร์)
- ประเมินคำตอบ/โค้ดของผู้เล่น หากถูกต้องให้บรรยายการโจมตีที่ทรงพลัง พร้อมสร้างโจทย์ Python ข้อต่อไป
- หากผิด ให้ Dungeon Master อธิบายข้อผิดพลาดอย่างอ่อนโยนและให้กำลังใจ พร้อมคำใบ้
- ส่งออกข้อมูลเป็น JSON ตาม Schema ที่กำหนด
`;

      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: `สถานะการต่อสู้ปัจจุบัน:
- มอนสเตอร์ที่กำลังต่อสู้: ${JSON.stringify(currentMonster || { name: 'Syntax Slime', hp: 100, maxHp: 100 })}
- สถานะผู้เล่น: HP=${playerStats.hp || 100}, Streak=${playerStats.streak || 0}, Level=${playerStats.level || 1}
- ระดับความยากปัจจุบัน: ${difficultyTier}
- การกระทำ/คำตอบล่าสุดของผู้เล่น: "${playerInput || 'เริ่มต้นการต่อสู้'}"

กรุณาสร้างการตอบสนองของ Dungeon Master, ผลการต่อสู้, คำถาม Python ข้อถัดไป (พร้อมตัวเลือก 4 ช้อยส์ หรือโจทย์ทายผลลัพธ์โค้ด) ในรูปแบบ JSON`,
            },
          ],
        },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dmSpeech: {
                type: Type.STRING,
                description: 'คำพูดและคำบรรยายของ AI Dungeon Master ต่อการกระทำล่าสุดของผู้เล่น (ภาษาไทย)',
              },
              isCorrect: {
                type: Type.BOOLEAN,
                description: 'การกระทำหรือคำตอบของผู้เล่นถูกต้องหรือไม่',
              },
              playerDamageDealt: {
                type: Type.INTEGER,
                description: 'ความเสียหายที่ผู้เล่นทำได้ต่อมอนสเตอร์ (เช่น 25-45 HP)',
              },
              monsterDamageDealt: {
                type: Type.INTEGER,
                description: 'ความเสียหายที่มอนสเตอร์ทำต่อผู้เล่นหากตอบผิด (0 หากตอบถูก, 10-20 หากตอบผิด)',
              },
              adaptedDifficulty: {
                type: Type.STRING,
                description: 'ระดับความยากที่ Dungeon Master ปรับเปลี่ยน (easy / medium / medium_plus)',
              },
              nextQuestion: {
                type: Type.OBJECT,
                properties: {
                  prompt: {
                    type: Type.STRING,
                    description: 'คำถามหรือโจทย์ Python ข้อต่อไป',
                  },
                  codeSnippet: {
                    type: Type.STRING,
                    description: 'โค้ด Python ประกอบโจทย์ (ถ้ามี)',
                  },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '4 ตัวเลือกคำตอบ (A, B, C, D)',
                  },
                  correctIndex: {
                    type: Type.INTEGER,
                    description: 'ดัชนีตัวเลือกที่ถูกต้อง (0-3)',
                  },
                  explanation: {
                    type: Type.STRING,
                    description: 'คำอธิบายหลักการ Python ที่ถูกต้องกระชับ เข้าใจง่าย',
                  },
                  hint: {
                    type: Type.STRING,
                    description: 'คำใบ้จาก Dungeon Master',
                  },
                },
                required: ['prompt', 'options', 'correctIndex', 'explanation', 'hint'],
              },
            },
            required: [
              'dmSpeech',
              'isCorrect',
              'playerDamageDealt',
              'monsterDamageDealt',
              'adaptedDifficulty',
              'nextQuestion',
            ],
          },
        },
      });

      const responseText = response.text || '{}';
      const parsedData = JSON.parse(responseText);

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (error: any) {
      console.error('Gemini Python Dungeon Master API error:', error);
      return res.status(500).json({
        success: false,
        error: error?.message || 'Server error occurred',
      });
    }
  });

  // POST /api/cyber-adventure (AI Game Master for Chapter 6: Cyber Safety Text-Based Adventure)
  app.post('/api/cyber-adventure', async (req, res) => {
    try {
      const {
        scenarioPrompt = 'จำลองสถานการณ์ว่าฉันถูกคนแปลกหน้าทักมาขอข้อมูลส่วนตัว ให้ตัวเลือก A, B, C กับฉันว่าจะตอบสนองอย่างไร และจะเกิดผลลัพธ์อะไรตามมา',
        playerAction = 'เริ่มต้นเกม',
        history = [],
        currentSafetyHp = 100,
        turnCount = 1,
      } = req.body;

      const systemInstruction = `
คุณคือ "AI Cyber Game Master" (ผู้ดำเนินเกมจำลองสถานการณ์ไซเบอร์) ประจำเกมผจญภัย Text-based Adventure: "Cyber Safety & Digital Citizen Quest"
สำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 1 (สสวท. บทที่ 6: การใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย)

เป้าหมายการเรียนรู้:
1. การปกป้องข้อมูลส่วนบุคคล (PDPA) และการระวังคนแปลกหน้า/มิจฉาชีพทักมาขอข้อมูลส่วนตัวหรือรหัส OTP
2. การรู้เท่าทันฟิชชิ่ง (Phishing), ไวรัส/มัลแวร์, และการดาวน์โหลดไฟล์ที่ไม่ปลอดภัย
3. การรับมือการกลั่นแกล้งบนโลกไซเบอร์ (Cyberbullying)
4. การเคารพลิขสิทธิ์และทรัพย์สินทางปัญญา (Copyright & Creative Commons)
5. กฎหมาย พ.ร.บ. ว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ และมารยาทดิจิทัล (Netiquette)

บทบาทของคุณ:
- ดำเนินเรื่องราวจำลองสถานการณ์ตามคำสั่งที่ผู้เล่นป้อนเข้ามา เช่น "${scenarioPrompt}"
- หากผู้เล่นเลือกช้อยส์หรือพิมพ์คำสั่งเข้ามา ให้ประเมินผลลัพธ์ที่เกิดขึ้นอย่างสมจริง (Outcome & Consequence) ว่าการตัดสินใจนั้นถูกต้อง ปลอดภัย หรือมีความเสี่ยง
- ให้คะแนนความปลอดภัย (Safety HP: เพิ่มขึ้นเมื่อตัดสินใจถูกต้อง ปลอดภัย หรือลดลงเมื่อตกเป็นเหยื่อ)
- มอบ 3-4 ตัวเลือก (A, B, C, D) ที่น่าสนใจ ท้าทาย และมีทั้งทางเลือกที่ปลอดภัย ทางเลือกเสี่ยง และทางเลือกแก้ไขปัญหา
- สรุปข้อคิดความรู้ทางไซเบอร์ที่อ้างอิงกฎหมาย พ.ร.บ. คอมพิวเตอร์ หรือแนวทางปฏิบัติที่ดี (Cyber Safety Insight)
- ตอบกลับในรูปแบบ JSON ตาม Schema ที่กำหนดเสมอ
`;

      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: `คำสั่งจำลองสถานการณ์ของผู้เล่น: "${scenarioPrompt}"
ประวัติการเล่นก่อนหน้า: ${JSON.stringify(history.slice(-4))}
การกระทำ/ตัวเลือกที่ผู้เล่นเพิ่งเลือกในเทิร์นนี้: "${playerAction}"
สถานะคะแนนความปลอดภัยปัจจุบัน: Safety HP = ${currentSafetyHp}, Turn = ${turnCount}

กรุณาสร้างผลลัพธ์ของเหตุการณ์ล่าสุด (Outcome) และเหตุการณ์จำลองถัดไป พร้อมตัวเลือกตัวอักษร A, B, C (และ D) ในรูปแบบ JSON:`,
            },
          ],
        },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              narrative: {
                type: Type.STRING,
                description: 'คำบรรยายสถานการณ์และผลลัพธ์ที่เกิดขึ้นจากการตัดสินใจของผู้เล่น (ภาษาไทย ภาษาเข้าใจง่าย น่าติดตาม)',
              },
              safetyScoreDelta: {
                type: Type.INTEGER,
                description: 'คะแนนความปลอดภัยที่เปลี่ยนแปลง (+10 ถึง +25 หากปลอดภัยและถูกต้อง, -10 ถึง -30 หากเสี่ยงหรือตกเป็นเหยื่อ)',
              },
              isSafeChoice: {
                type: Type.BOOLEAN,
                description: 'การตัดสินใจนี้ปลอดภัยและถูกต้องตามหลักวิทยาการคำนวณและกฎหมายไซเบอร์หรือไม่',
              },
              situationTitle: {
                type: Type.STRING,
                description: 'ชื่อตอนหรือสถานการณ์ปัจจุบันสั้นๆ',
              },
              threatCategory: {
                type: Type.STRING,
                description: 'ประเภทภัยไซเบอร์ (เช่น ข้อมูลส่วนบุคคล/PDPA, ฟิชชิ่ง/หลอกลวง, มัลแวร์, Cyberbullying, ลิขสิทธิ์)',
              },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING, description: 'รหัสตัวเลือก เช่น A, B, C, D' },
                    text: { type: Type.STRING, description: 'ข้อความการกระทำของตัวเลือก' },
                    riskLevel: { type: Type.STRING, description: 'ระดับความเสี่ยง (LOW, MEDIUM, HIGH)' },
                  },
                  required: ['label', 'text', 'riskLevel'],
                },
                description: 'ตัวเลือก 3-4 ทางเลือกให้ผู้เล่นตัดสินใจในก้าวถัดไป',
              },
              educationalInsight: {
                type: Type.STRING,
                description: 'ความรู้ ข้อแนะนำ และกฎหมาย พ.ร.บ.คอมพิวเตอร์ ที่เกี่ยวข้องกับสถานการณ์นี้',
              },
              isStoryCompleted: {
                type: Type.BOOLEAN,
                description: 'สถานการณ์ดำเนินมาถึงบทสรุปจบสมบูรณ์แล้วหรือไม่ (เช่น หลังจากเล่นครบ 4-5 เทิร์น)',
              },
            },
            required: [
              'narrative',
              'safetyScoreDelta',
              'isSafeChoice',
              'situationTitle',
              'threatCategory',
              'options',
              'educationalInsight',
              'isStoryCompleted',
            ],
          },
        },
      });

      const responseText = response.text || '{}';
      const parsedData = JSON.parse(responseText);

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (error: any) {
      console.error('Gemini Cyber Adventure API error:', error);
      return res.status(500).json({
        success: false,
        error: error?.message || 'Server error occurred',
      });
    }
  });

  // POST /api/summer-game-engine/generate (Gameer.io & Summer Engine Game Generator)
  app.post('/api/summer-game-engine/generate', async (req, res) => {
    try {
      const {
        prompt = 'สร้างเกมสืบสวนที่ผู้เล่นต้องตามจับแฮกเกอร์ที่ส่ง Phishing อีเมล',
        author = 'คุณครูวิทยาการคำนวณ',
      } = req.body;

      const systemInstruction = `
คุณคือ "Summer Engine & Gameer.io AI Game Architect"
ระบบสร้างเกมการเรียนรู้วิทยาการคำนวณ ม.1 (สสวท. บทที่ 6: การใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย)
หน้าที่ของคุณคือรับคำสั่ง Prompt จากผู้ใช้ เช่น "${prompt}" แล้วสร้าง "เกมสืบสวน/ผจญภัยไซเบอร์ฉบับสมบูรณ์" ที่มี:
1. ชื่อเกมสุดเร้าใจ ธีมสืบสวนคดีดิจิทัล
2. เรื่องย่อ (Synopsis) และบทนำคดี
3. ตัวละครหลัก (นักสืบไซเบอร์/ผู้เล่น), ตัวร้ายแฮกเกอร์ (Antagonist), และตัวละครประกอบ (NPCs/พยาน/ผู้ต้องสงสัย)
4. ด่านภารกิจสืบสวน (Stages/Missions) 3 ด่านที่ต่อเนื่องกัน:
   - แต่ละด่านมีหลักฐานให้ตรวจสอบ (Evidence Items)
   - มีปริศนาวิเคราะห์คดี (Investigation Puzzle) 4 ตัวเลือก พร้อมเฉลยและเหตุผลทางวิทยาการคำนวณ
   - มีทางเลือกตัดสินใจ (Interactive Action Choices) ที่ส่งผลต่อคะแนนความปลอดภัย (Safety HP)
5. อ้างอิงเนื้อหาหลักสูตร สสวท. ม.1 และกฎหมาย พ.ร.บ.ว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ และ PDPA อย่างแม่นยำ
6. ส่งออกผลลัพธ์เป็น JSON ตาม Schema ที่กำหนด
`;

      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: `สร้างเกมสืบสวน/ผจญภัยไซเบอร์ตามคำสั่งนี้:
"${prompt}"
ผู้สร้าง: ${author}

กรุณาสร้างเกมฉบับเต็มพร้อมเล่น ประกอบด้วยเนื้อเรื่อง ตัวละคร 3 ด่านภารกิจ หลักฐาน ปริศนา และตัวเลือกตัดสินใจ ในรูปแบบ JSON:`,
            },
          ],
        },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'ชื่อเกมสุดเท่และน่าสนใจ' },
              genre: { type: Type.STRING, description: 'ประเภทของเกม เช่น Cyber Detective, Text Adventure' },
              synopsis: { type: Type.STRING, description: 'เนื้อเรื่องย่อเบื้องหลังคดีและภารกิจ' },
              themeColor: { type: Type.STRING, description: 'โทนสีของเกม เช่น indigo, cyan, emerald, rose, amber' },
              protagonist: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'ชื่อตัวละครผู้เล่น' },
                  role: { type: Type.STRING, description: 'บทบาท เช่น สายสืบไซเบอร์ ม.1' },
                  avatarEmoji: { type: Type.STRING, description: 'อิโมจิประจำตัว เช่น 🕵️‍♂️, 👩‍💻' },
                  badgeTitle: { type: Type.STRING, description: 'ยศหรือฉายา' },
                },
                required: ['name', 'role', 'avatarEmoji', 'badgeTitle'],
              },
              hackerAntagonist: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'ชื่อหรือฉายาของแฮกเกอร์' },
                  alias: { type: Type.STRING, description: 'โค้ดเนม เช่น ShadowPhisher, ZeroDay' },
                  avatarEmoji: { type: Type.STRING, description: 'อิโมจิแฮกเกอร์ เช่น 🦹‍♂️, 👾, 🎭' },
                  threatLevel: { type: Type.STRING, description: 'ระดับอันตราย เช่น High, Critical' },
                  motive: { type: Type.STRING, description: 'แรงจูงใจในการก่อเหตุ' },
                },
                required: ['name', 'alias', 'avatarEmoji', 'threatLevel', 'motive'],
              },
              characters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: 'ID ตัวละคร' },
                    name: { type: Type.STRING, description: 'ชื่อตัวละคร' },
                    role: { type: Type.STRING, description: 'บทบาท เช่น ครูฝ่ายไอที, เพื่อนร่วมห้อง, เหยื่อ' },
                    avatarEmoji: { type: Type.STRING, description: 'อิโมจิตัวละคร เช่น 👨‍🏫, 👩‍🎓' },
                    description: { type: Type.STRING, description: 'ลักษณะและข้อมูลเบื้องต้น' },
                    hintDialogue: { type: Type.STRING, description: 'คำพูดให้เบาะแสกับผู้เล่น' },
                  },
                  required: ['id', 'name', 'role', 'avatarEmoji', 'description', 'hintDialogue'],
                },
                description: 'รายชื่อตัวละคร NPC และพยานในคดี 2-3 คน',
              },
              stages: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    stageNumber: { type: Type.INTEGER, description: 'ลำดับด่าน 1-3' },
                    title: { type: Type.STRING, description: 'ชื่อด่าน' },
                    missionBriefing: { type: Type.STRING, description: 'คำชี้แจงภารกิจประจำด่าน' },
                    environmentSetting: { type: Type.STRING, description: 'บรรยากาศและฉากเหตุการณ์' },
                    evidenceItems: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING, description: 'ID หลักฐาน' },
                          name: { type: Type.STRING, description: 'ชื่อหลักฐาน' },
                          icon: { type: Type.STRING, description: 'อิโมจิหลักฐาน เช่น 📧, 🔗, 📁' },
                          description: { type: Type.STRING, description: 'รายละเอียดของหลักฐาน' },
                          isSuspicious: { type: Type.BOOLEAN, description: 'หลักฐานนี้เป็นสิ่งผิดปกติ/ภัยคุกคามหรือไม่' },
                          analysisResult: { type: Type.STRING, description: 'ผลการตรวจวิเคราะห์ดิจิทัลนิติวิทยาศาสตร์' },
                        },
                        required: ['id', 'name', 'icon', 'description', 'isSuspicious', 'analysisResult'],
                      },
                      description: 'หลักฐานดิจิทัลให้ผู้เล่นตรวจสอบ 2-3 ชิ้น',
                    },
                    investigationPuzzle: {
                      type: Type.OBJECT,
                      properties: {
                        question: { type: Type.STRING, description: 'คำถามทดสอบการวิเคราะห์คดีและหลักการไซเบอร์' },
                        options: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: '4 ตัวเลือกคำตอบ' },
                        correctIndex: { type: Type.INTEGER, description: 'ดัชนีคำตอบที่ถูกต้อง 0-3' },
                        explanation: { type: Type.STRING, description: 'คำอธิบายอย่างละเอียด' },
                        cyberLawInsight: { type: Type.STRING, description: 'ข้อกฎหมายหรือหลักความปลอดภัยที่เกี่ยวข้อง' },
                      },
                      required: ['question', 'options', 'correctIndex', 'explanation', 'cyberLawInsight'],
                    },
                    choices: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING, description: 'รหัสตัวเลือก เช่น A, B, C' },
                          text: { type: Type.STRING, description: 'การตัดสินใจของนักสืบ' },
                          outcomeText: { type: Type.STRING, description: 'ผลลัพธ์ที่เกิดขึ้นหลังเลือก' },
                          isCorrect: { type: Type.BOOLEAN, description: 'เป็นการตัดสินใจที่ถูกต้องและปลอดภัยหรือไม่' },
                          riskLevel: { type: Type.STRING, description: 'LOW, MEDIUM, HIGH' },
                          safetyHpDelta: { type: Type.INTEGER, description: 'การเปลี่ยนแปลง HP เช่น +20 หรือ -20' },
                        },
                        required: ['label', 'text', 'outcomeText', 'isCorrect', 'riskLevel', 'safetyHpDelta'],
                      },
                      description: '3 ตัวเลือกการกระทำในด่านนี้',
                    },
                  },
                  required: ['stageNumber', 'title', 'missionBriefing', 'environmentSetting', 'evidenceItems', 'investigationPuzzle', 'choices'],
                },
                description: 'รายการด่านภารกิจสืบสวน 3 ด่าน',
              },
              finalConclusion: { type: Type.STRING, description: 'บทสรุปคดีเมื่อจับกุมแฮกเกอร์ได้สำเร็จ' },
              badgeReward: { type: Type.STRING, description: 'ชื่อเหรียญรางวัลเกียรติยศ' },
              learningOutcomes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'สิ่งที่ผู้เล่นได้เรียนรู้จากเกมนี้',
              },
            },
            required: [
              'title',
              'genre',
              'synopsis',
              'themeColor',
              'protagonist',
              'hackerAntagonist',
              'characters',
              'stages',
              'finalConclusion',
              'badgeReward',
              'learningOutcomes',
            ],
          },
        },
      });

      const responseText = response.text || '{}';
      const parsedData = JSON.parse(responseText);

      // Generate a unique room/game ID
      const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const gameId = `GAME-${randomCode}`;
      const fullGameObject = {
        ...parsedData,
        id: gameId,
        prompt,
        author,
        createdAt: new Date().toISOString(),
      };

      // Save into persistent DB
      const currentDb = ensureDbFile();
      const customGames = currentDb.custom_summer_games || {};
      customGames[gameId] = fullGameObject;
      currentDb.custom_summer_games = customGames;
      saveDbFile(currentDb);

      return res.json({
        success: true,
        gameId,
        data: fullGameObject,
      });
    } catch (error: any) {
      console.error('Summer Engine Game Generator error:', error);
      return res.status(500).json({
        success: false,
        error: error?.message || 'Failed to generate game world',
      });
    }
  });

  // GET /api/summer-game-engine/get/:gameId (Load a generated game by ID / Room code)
  app.get('/api/summer-game-engine/get/:gameId', (req, res) => {
    try {
      const { gameId } = req.params;
      const currentDb = ensureDbFile();
      const customGames = currentDb.custom_summer_games || {};
      const game = customGames[gameId];

      if (!game) {
        return res.status(404).json({ success: false, error: 'Game not found' });
      }

      return res.json({ success: true, data: game });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Server error' });
    }
  });

  // GET /api/summer-game-engine/list (List all generated community/teacher games)
  app.get('/api/summer-game-engine/list', (req, res) => {
    try {
      const currentDb = ensureDbFile();
      const customGames = currentDb.custom_summer_games || {};
      const list = Object.values(customGames);
      return res.json({ success: true, data: list });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Server error' });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    console.error(`Dev server encountered an error on port ${PORT}:`, err);
  });
}

startServer();
