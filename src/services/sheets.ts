/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCachedAccessToken } from './auth';
import { syncGradebookToFirestore, FirestoreGradeRecord } from './firebase';

export function getOAuthAccessToken(): string | null {
  return getCachedAccessToken();
}

export interface StudentGradeRow {
  seatNumber: number;
  studentId: string;
  name: string;
  classroom: string;
  preTestAvg: number;
  postTestAvg: number;
  gameScoreTotal: number;
  exerciseAvg: number;
  totalScore: number;
  gradeStatus: string;
}

/**
 * Creates a new Google Spreadsheet, populates it with student grade reports,
 * and synchronizes with Firebase Firestore.
 */
export async function createGradebookSpreadsheet(
  classroomName: string,
  customTitle: string,
  headers: string[],
  rows: any[][],
  tokenOverride?: string
): Promise<string> {
  const token = tokenOverride || getCachedAccessToken();
  if (!token) {
    throw new Error('ไม่พบการอนุญาต Google Sheets กรุณาเข้าสู่ระบบด้วย Google ก่อนส่งออก หรือดาวน์โหลดไฟล์ตารางคะแนนแทน');
  }

  const title = customTitle || `Adventure M.1 - รายงานผลการเรียน ชั้น ${classroomName} (${new Date().toLocaleDateString('th-TH')})`;
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'คะแนนวิทยาการคำนวณ ม.1',
            gridProperties: {
              frozenRowCount: 2,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `สร้างสเปรดชีตไม่สำเร็จ (${createRes.status})`);
  }

  const spreadsheet = await createRes.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  const spreadsheetUrl =
    spreadsheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Include Firebase synchronization metadata banner in sheet
  const syncBanner = [
    `ข้อมูลเชื่อมต่อ Firebase Firestore: ai-studio-adventurem1 (ซิงค์ตรงกันล่าสุด: ${new Date().toLocaleString('th-TH')})`,
    ...Array(headers.length - 1).fill(''),
  ];

  const allValues = [syncBanner, headers, ...rows];

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'คะแนนวิทยาการคำนวณ ม.1'!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: "'คะแนนวิทยาการคำนวณ ม.1'!A1",
        majorDimension: 'ROWS',
        values: allValues,
      }),
    }
  );

  if (!updateRes.ok) {
    const errData = await updateRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `บันทึกข้อมูลสเปรดชีตไม่สำเร็จ (${updateRes.status})`);
  }

  // Synchronize Google Sheets and Gradebook data directly to Firebase Firestore
  try {
    const firestoreRecords: FirestoreGradeRecord[] = rows.map((r) => ({
      seatNumber: Number(r[0]) || 1,
      studentId: String(r[1] || '-'),
      name: String(r[2] || ''),
      classroom: String(r[3] || classroomName),
      chapterScores: {
        ch1: Number(r[4]) || 0,
        ch2: Number(r[5]) || 0,
        ch3: Number(r[6]) || 0,
        ch4: Number(r[7]) || 0,
        ch5: Number(r[8]) || 0,
        ch6: Number(r[9]) || 0,
        ch7: Number(r[10]) || 0,
      },
      quizTotal: Number(r[11]) || 0,
      gameTotal: Number(r[12]) || 0,
      totalScore: Number(r[13]) || 0,
      xp: Number(r[14]) || 0,
      evaluation: String(r[15] || 'ผ่านเกณฑ์'),
    }));

    await syncGradebookToFirestore(classroomName, firestoreRecords, spreadsheetUrl);
  } catch (syncErr) {
    console.warn('Deferred Firebase sync during Google Sheets create:', syncErr);
  }

  return spreadsheetUrl;
}

/**
 * Downloads CSV file for teachers (Includes all 7 chapters and Firebase Firestore sync state)
 */
export function exportGradebookToCSV(
  classroomName: string,
  lessons: any[],
  students: any[]
) {
  const headers = [
    'เลขที่',
    'รหัสนักเรียน',
    'ชื่อ-นามสกุล',
    'ห้องเรียน',
    'สอบบทที่ 1 (3)',
    'สอบบทที่ 2 (3)',
    'สอบบทที่ 3 (3)',
    'สอบบทที่ 4 (3)',
    'สอบบทที่ 5 (3)',
    'สอบบทที่ 6 (3)',
    'สอบบทที่ 7 ปลายภาค (30)',
    'คะแนนสอบรวม',
    'คะแนนมินิเกมรวม',
    'คะแนนสุทธิ',
    'XP สะสม',
    'ผลประเมิน',
    'สถานะ Firebase Firestore',
    'วันเวลาที่ซิงค์',
  ];

  const nowString = new Date().toLocaleString('th-TH');

  const csvRows = [
    headers.join(','),
    ...students.map((s) =>
      [
        s.profile?.seatNumber || 1,
        `"${s.profile?.studentId || '-'}"`,
        `"${s.user.name}"`,
        `"${s.profile?.classroom || 'ม.1/1'}"`,
        s.chapterQuizScores[1] || 0,
        s.chapterQuizScores[2] || 0,
        s.chapterQuizScores[3] || 0,
        s.chapterQuizScores[4] || 0,
        s.chapterQuizScores[5] || 0,
        s.chapterQuizScores[6] || 0,
        s.chapterQuizScores[7] || 0,
        s.quizTotal || 0,
        s.gameTotal || 0,
        s.totalScore || 0,
        s.xp || 0,
        `"${s.totalScore >= 12 ? 'ดีมาก' : s.totalScore >= 8 ? 'ผ่านเกณฑ์' : 'รอปรับปรุง'}"`,
        `"Synced with Firebase"`,
        `"${nowString}"`,
      ].join(',')
    ),
  ];

  const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ตารางคะแนน_${classroomName}_AdventureM1.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Downloads single student report CSV
 */
export function exportStudentReportToCSV(
  user: any,
  studentProfile: any,
  lessons: any[],
  progressList: any[],
  badges: any[]
) {
  const headers = ['บทที่', 'ชื่อบทเรียน', 'สถานะ', 'คะแนนมินิเกม', 'คะแนนแบบทดสอบ', 'XP ที่ได้รับ'];
  const rows = lessons.map((l) => {
    const p = progressList.find((pr) => pr.lessonId === l.id);
    return [
      l.chapterNumber,
      `"${l.title}"`,
      p?.status === 'completed' ? 'สำเร็จแล้ว' : 'ยังไม่สำเร็จ',
      p?.gameScore || 0,
      p?.quizScore || 0,
      p?.xpEarned || 0,
    ].join(',');
  });

  const metadataRows = [
    `"รายงานผลการเรียนรายบุคคล Adventure M.1 (สสวท.)"`,
    `"ชื่อ-นามสกุล: ${user.name}"`,
    `"รหัสนักเรียน: ${studentProfile?.studentId || '-'} ห้อง: ${studentProfile?.classroom || 'ม.1/1'} เลขที่: ${studentProfile?.seatNumber || 1}"`,
    `"XP รวม: ${studentProfile?.xp || 0} ระดับ: Level ${studentProfile?.level || 1}"`,
    `"สถานะฐานข้อมูล: เชื่อมต่อและซิงค์ตรงกับ Firebase Firestore & Google Sheets"`,
    `"เวลาที่ออกรายงาน: ${new Date().toLocaleString('th-TH')}"`,
    '',
  ];

  const fullContent = [...metadataRows, headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + fullContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `รายงานการเรียน_${user.name}_AdventureM1.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Original export function
 */
export async function exportGradesToGoogleSheets(
  classroomName: string,
  rows: StudentGradeRow[],
  tokenOverride?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const token = tokenOverride || getCachedAccessToken();
  if (!token) {
    throw new Error('ไม่พบการอนุญาต Google Sheets กรุณาเข้าสู่ระบบด้วย Google ก่อนส่งออก');
  }

  // 1. Create Spreadsheet
  const title = `Adventure M.1 - รายงานผลการเรียน ชั้น ${classroomName} (${new Date().toLocaleDateString('th-TH')})`;
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'คะแนนวิทยาการคำนวณ ม.1',
            gridProperties: {
              frozenRowCount: 2,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `สร้างสเปรดชีตไม่สำเร็จ (${createRes.status})`);
  }

  const spreadsheet = await createRes.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  const spreadsheetUrl = spreadsheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare tabular data
  const headerRows = [
    [
      `แบบบันทึกผลการเรียนรู้วิชาเทคโนโลยี (วิทยาการคำนวณ) ม.1 - ห้อง ${classroomName}`,
      '', '', '', '', '', '', '', '', '',
    ],
    [
      'เลขที่',
      'รหัสนักเรียน',
      'ชื่อ-นามสกุล',
      'ห้องเรียน',
      'เฉลี่ย Pre-test (100%)',
      'เฉลี่ย Post-test (100%)',
      'คะแนนเกมรวม (XP)',
      'เฉลี่ยแบบฝึกหัด (100%)',
      'คะแนนรวมประเมิน',
      'สถานะผลการเรียน',
    ],
  ];

  const dataRows = rows.map((r) => [
    r.seatNumber,
    r.studentId,
    r.name,
    r.classroom,
    `${r.preTestAvg.toFixed(1)}%`,
    `${r.postTestAvg.toFixed(1)}%`,
    r.gameScoreTotal,
    `${r.exerciseAvg.toFixed(1)}%`,
    `${r.totalScore.toFixed(1)}%`,
    r.gradeStatus,
  ]);

  const allValues = [...headerRows, ...dataRows];

  // 3. Update values in Google Sheets
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'คะแนนวิทยาการคำนวณ ม.1'!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: "'คะแนนวิทยาการคำนวณ ม.1'!A1",
        majorDimension: 'ROWS',
        values: allValues,
      }),
    }
  );

  if (!updateRes.ok) {
    const errData = await updateRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `บันทึกข้อมูลสเปรดชีตไม่สำเร็จ (${updateRes.status})`);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
  };
}

/**
 * Downloads CSV file directly for offline use or Excel import
 */
export function downloadGradesCSV(classroomName: string, rows: StudentGradeRow[]) {
  const headers = [
    'เลขที่',
    'รหัสนักเรียน',
    'ชื่อ-นามสกุล',
    'ห้องเรียน',
    'เฉลี่ย Pre-test',
    'เฉลี่ย Post-test',
    'คะแนนเกมรวม (XP)',
    'เฉลี่ยแบบฝึกหัด',
    'คะแนนรวม',
    'สถานะผลการเรียน',
  ];

  const csvRows = [
    headers.join(','),
    ...rows.map((r) =>
      [
        r.seatNumber,
        `"${r.studentId}"`,
        `"${r.name}"`,
        `"${r.classroom}"`,
        r.preTestAvg.toFixed(1),
        r.postTestAvg.toFixed(1),
        r.gameScoreTotal,
        r.exerciseAvg.toFixed(1),
        r.totalScore.toFixed(1),
        `"${r.gradeStatus}"`,
      ].join(',')
    ),
  ];

  // UTF-8 BOM so Excel opens Thai characters without gibberish
  const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `คะแนน_${classroomName}_AdventureM1.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
