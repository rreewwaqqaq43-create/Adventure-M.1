/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Shuffle,
  RotateCcw,
  Eye,
  Database,
  Volume2,
  VolumeX,
  Flame,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { sfx } from '../../utils/audioEffects';
import { DataGraphicCard, DataGraphicType } from './DataGraphicCard';

interface Game5DataPuzzleMatchingProps {
  onComplete: (score: number, maxScore: number, xpEarned: number) => void;
}

export interface DataDetectivePair {
  pairId: string;
  graphicType: DataGraphicType;
  title: string;
  meaning: string;
  detail: string;
  textbookRef: string;
}

// 8 Official Data Concepts strictly based on สสวท. ม.1 บทที่ 5
export const MASTER_DATA_PAIRS: DataDetectivePair[] = [
  {
    pairId: 'dp-primary',
    graphicType: 'primary_data',
    title: 'ข้อมูลปฐมภูมิ (Primary Data)',
    meaning: 'ข้อมูลที่เก็บรวบรวมจากแหล่งกำเนิดโดยตรง',
    detail: 'เช่น การทำแบบสอบถาม การสัมภาษณ์ หรือการสังเกตและจดบันทึกผลด้วยตนเอง',
    textbookRef: 'สสวท. ม.1 หน้า 139',
  },
  {
    pairId: 'dp-secondary',
    graphicType: 'secondary_data',
    title: 'ข้อมูลทุติยภูมิ (Secondary Data)',
    meaning: 'ข้อมูลที่มีผู้อื่นเก็บรวบรวมหรือประมวลผลไว้แล้ว',
    detail: 'เช่น สถิติทางการของรัฐ รายงานวิจัย หรือบทความในวารสารวิชาการ',
    textbookRef: 'สสวท. ม.1 หน้า 140',
  },
  {
    pairId: 'dp-bar-chart',
    graphicType: 'bar_chart',
    title: 'แผนภูมิแท่ง (Bar Chart)',
    meaning: 'เปรียบเทียบปริมาณระหว่างหมวดหมู่ข้อมูล',
    detail: 'เหมาะสำหรับการเปรียบเทียบจำนวนนักเรียนแต่ละห้อง หรือยอดจำหน่ายสินค้า',
    textbookRef: 'สสวท. ม.1 หน้า 158',
  },
  {
    pairId: 'dp-pie-chart',
    graphicType: 'pie_chart',
    title: 'แผนภูมิรูปวงกลม (Pie Chart)',
    meaning: 'แสดงสัดส่วนของแต่ละส่วนเทียบกับทั้งหมด (100%)',
    detail: 'เหมาะสำหรับการแสดงสัดส่วนค่าใช้จ่าย สัดส่วนเพศ หรือส่วนแบ่งการตลาด',
    textbookRef: 'สสวท. ม.1 หน้า 159',
  },
  {
    pairId: 'dp-line-chart',
    graphicType: 'line_chart',
    title: 'กราฟเส้น (Line Graph)',
    meaning: 'แสดงการเปลี่ยนแปลงและแนวโน้มตามลำดับเวลา',
    detail: 'เหมาะกับข้อมูลที่มีความต่อเนื่องตามเวลา เช่น อุณหภูมิรายชั่วโมง หรือราคาหุ้น',
    textbookRef: 'สสวท. ม.1 หน้า 160',
  },
  {
    pairId: 'dp-decision-table',
    graphicType: 'decision_table',
    title: 'ตารางประเมินทางเลือก (Decision Matrix)',
    meaning: 'กำหนดเกณฑ์และประเมินเพื่อการตัดสินใจบนฐานข้อมูล',
    detail: 'ตารางวิเคราะห์เปรียบเทียบทางเลือกด้วยเกณฑ์คะแนนและน้ำหนักความสำคัญอย่างรอบคอบ',
    textbookRef: 'สสวท. ม.1 หน้า 154',
  },
  {
    pairId: 'dp-sorting',
    graphicType: 'sorting_data',
    title: 'การเรียงลำดับข้อมูล (Data Sorting)',
    meaning: 'จัดเรียงข้อมูลจากน้อยไปมาก หรือมากไปน้อย',
    detail: 'ช่วยให้ค้นหาข้อมูลได้รวดเร็วและวิเคราะห์เปรียบเทียบค่าสูงสุด-ต่ำสุดได้ง่าย',
    textbookRef: 'สสวท. ม.1 หน้า 148',
  },
  {
    pairId: 'dp-cycle',
    graphicType: 'processing_cycle',
    title: 'วงจรการประมวลผลข้อมูล (Data Processing)',
    meaning: 'กระบวนการแปลงข้อมูลดิบให้เป็นสารสนเทศ',
    detail: 'Input (ข้อมูลเข้า) -> Process (คำนวณ/จัดกลุ่ม) -> Output (สารสนเทศเพื่อการตัดสินใจ)',
    textbookRef: 'สสวท. ม.1 หน้า 141',
  },
];

interface PlayableCard {
  uniqueId: string;
  pairId: string;
  type: 'GRAPHIC' | 'TEXT';
  pair: DataDetectivePair;
}

const DATA_CARD_THEMES = [
  { id: 'crystal', name: 'ธีม Data Crystal Sky', cardBack: 'border-sky-500/50 bg-sky-950/40 text-sky-400' },
  { id: 'matrix', name: 'ธีม Cyber Emerald', cardBack: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-400' },
  { id: 'hologram', name: 'ธีม Solar Amber', cardBack: 'border-amber-500/50 bg-amber-950/40 text-amber-400' },
  { id: 'neon', name: 'ธีม Cyber Violet', cardBack: 'border-purple-500/50 bg-purple-950/40 text-purple-400' },
];

export const Game5DataPuzzleMatching: React.FC<Game5DataPuzzleMatchingProps> = ({ onComplete }) => {
  const [themeIdx, setThemeIdx] = useState(0);
  const [cards, setCards] = useState<PlayableCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [, setScore] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [floatingPopup, setFloatingPopup] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(sfx.isMuted);
  const [isFinished, setIsFinished] = useState(false);
  const [previewActive, setPreviewActive] = useState(true);
  const [previewCountdown, setPreviewCountdown] = useState(6);

  const currentTheme = DATA_CARD_THEMES[themeIdx];

  // Initialize and randomize round (Pick 6 pairs = 12 cards)
  const initGame = () => {
    const shuffledPool = [...MASTER_DATA_PAIRS].sort(() => 0.5 - Math.random());
    const selected = shuffledPool.slice(0, 6);

    const generatedCards: PlayableCard[] = [];
    selected.forEach((p) => {
      // Card 1: Real Graphic Illustration of Data concept
      generatedCards.push({
        uniqueId: `${p.pairId}-gfx`,
        pairId: p.pairId,
        type: 'GRAPHIC',
        pair: p,
      });
      // Card 2: Official Meaning & Description Text
      generatedCards.push({
        uniqueId: `${p.pairId}-txt`,
        pairId: p.pairId,
        type: 'TEXT',
        pair: p,
      });
    });

    // Shuffle the 12 cards
    const randomized = generatedCards.sort(() => 0.5 - Math.random());
    setCards(randomized);
    setFlippedIds([]);
    setMatchedPairIds([]);
    setMoves(0);
    setScore(0);
    setComboStreak(0);
    setIsFinished(false);

    // Switch theme on restart
    setThemeIdx((prev) => (prev + 1) % DATA_CARD_THEMES.length);

    // Preview Phase: Open cards first for student memorization
    setPreviewActive(true);
    setPreviewCountdown(6);
  };

  useEffect(() => {
    initGame();
  }, []);

  // Preview countdown timer
  useEffect(() => {
    if (!previewActive) return;
    if (previewCountdown <= 0) {
      setPreviewActive(false);
      return;
    }
    const timer = setTimeout(() => {
      setPreviewCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [previewActive, previewCountdown]);

  // Handle Card Click
  const handleCardClick = (card: PlayableCard) => {
    if (previewActive) return;
    if (matchedPairIds.includes(card.pairId)) return;
    if (flippedIds.includes(card.uniqueId)) return;
    if (flippedIds.length >= 2) return;

    sfx.playCardFlip();
    const newFlipped = [...flippedIds, card.uniqueId];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);
      const card1 = cards.find((c) => c.uniqueId === newFlipped[0]);
      const card2 = cards.find((c) => c.uniqueId === newFlipped[1]);

      if (card1 && card2 && card1.pairId === card2.pairId) {
        // Matched!
        const nextCombo = comboStreak + 1;
        setComboStreak(nextCombo);
        const earned = 15 + nextCombo * 5;

        if (nextCombo >= 2) {
          sfx.playCombo(nextCombo);
          setFloatingPopup(`จับคู่ถูกต้อง! +${earned} XP 🔥 x${nextCombo} STREAK!`);
        } else {
          sfx.playCorrect();
          setFloatingPopup(`จับคู่ถูกต้อง: ${card1.pair.title}! +${earned} XP`);
        }
        setTimeout(() => setFloatingPopup(null), 1200);

        setTimeout(() => {
          setMatchedPairIds((prev) => {
            const next = [...prev, card1.pairId];
            if (next.length === cards.length / 2) {
              // Game Complete!
              setIsFinished(true);
              sfx.playVictory();
              const finalScore = Math.max(70, 100 - (moves + 1 - 6) * 4);
              confetti({ particleCount: 85, spread: 75, origin: { y: 0.6 } });
              onComplete(finalScore, 100, 250);
            }
            return next;
          });
          setFlippedIds([]);
          setScore((prev) => prev + earned);
        }, 500);
      } else {
        // Not matched - flip back
        setComboStreak(0);
        sfx.playError();
        setTimeout(() => {
          setFlippedIds([]);
        }, 1100);
      }
    }
  };

  const handleSkipPreview = () => {
    setPreviewActive(false);
    setPreviewCountdown(0);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 text-slate-100 max-w-5xl mx-auto shadow-2xl relative">
      {/* Floating score / combo popup */}
      {floatingPopup && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none px-5 py-2.5 rounded-2xl bg-slate-950/95 border-2 border-sky-400 text-sky-300 font-bold text-sm sm:text-base shadow-2xl animate-bounce backdrop-blur-md">
          {floatingPopup}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-inner">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white font-['Chakra_Petch'] flex items-center gap-2">
              <span>มินิเกมนักสืบข้อมูล (Data Detective Graphic Matching)</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                ม.1 บทที่ 5
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              จับคู่รูปภาพกราฟิกข้อมูล แหล่งข้อมูล และแผนภูมิการประมวลผล (เปิดไพ่ให้จำก่อนเริ่ม สุ่ม 6 คู่ในแต่ละรอบ)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {comboStreak >= 2 && (
            <div className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-sky-500/20 to-teal-500/20 border border-sky-500/50 text-sky-300 font-bold text-xs flex items-center gap-1 animate-pulse shadow-lg shadow-sky-500/10">
              <Flame className="w-3.5 h-3.5 text-sky-400" />
              <span>x{comboStreak} STREAK!</span>
            </div>
          )}

          <button
            onClick={() => {
              const muted = sfx.toggleMute();
              setIsMuted(muted);
            }}
            type="button"
            title={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>

          <button
            onClick={initGame}
            type="button"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            title="สุ่มโจทย์ใหม่"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>สุ่มโจทย์ใหม่</span>
          </button>

          <div className="text-xs px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sky-400 font-bold">
            จับคู่สำเร็จ: {matchedPairIds.length} / {cards.length / 2}
          </div>
        </div>
      </div>

      {/* Preview Phase Notification */}
      {previewActive && (
        <div className="mt-4 p-3.5 rounded-2xl bg-sky-950/80 border border-sky-500/50 text-sky-200 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse shadow-xl">
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <Eye className="w-5 h-5 text-sky-400 shrink-0" />
            <div>
              <span className="font-bold text-white">ช่วงเวลาจดจำภาพกราฟิก (Preview Phase): </span>
              <span>ระบบเปิดไพ่ให้ดูภาพประกอบและความหมายก่อนเริ่ม จะคว่ำไพ่ในอีก </span>
              <span className="font-black text-sky-300 text-base font-mono underline">
                {previewCountdown} วินาที
              </span>
            </div>
          </div>
          <button
            onClick={handleSkipPreview}
            type="button"
            className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs shrink-0 transition-colors shadow hover:scale-105"
          >
            จำได้แล้ว! เริ่มเล่นเลย
          </button>
        </div>
      )}

      {/* Stats bar */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400 bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-sky-400" />
          <span>โหมด: <strong className="text-slate-200">ภาพประกอบการประมวลผลข้อมูล สสวท. (Educational Graphics)</strong></span>
        </div>
        <div>
          <span>เปิดไปแล้ว: <strong className="text-sky-400 font-mono font-bold">{moves}</strong> ครั้ง</span>
        </div>
      </div>

      {!isFinished ? (
        /* Card Grid: 12 Cards (3x4 or 4x3) */
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {cards.map((card) => {
            const isFlipped = previewActive || flippedIds.includes(card.uniqueId) || matchedPairIds.includes(card.pairId);
            const isMatched = matchedPairIds.includes(card.pairId);

            return (
              <div
                key={card.uniqueId}
                onClick={() => handleCardClick(card)}
                className={`relative min-h-[145px] sm:min-h-[160px] rounded-2xl cursor-pointer select-none transition-all duration-300 transform ${
                  isMatched ? 'opacity-85 scale-95' : 'hover:-translate-y-1'
                }`}
              >
                <div
                  className={`w-full h-full rounded-2xl border-2 transition-all duration-300 p-3 flex flex-col items-center justify-center text-center shadow-lg ${
                    isFlipped
                      ? isMatched
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/40 shadow-emerald-900/30'
                        : 'bg-slate-950 border-sky-500/70 text-slate-100 ring-1 ring-sky-500/30'
                      : `${currentTheme.cardBack} hover:border-slate-400`
                  }`}
                >
                  {isFlipped ? (
                    <div className="w-full h-full flex flex-col items-center justify-between animate-fade-in space-y-1">
                      {card.type === 'GRAPHIC' ? (
                        /* CARD TYPE 1: Real Graphic Illustration */
                        <>
                          <div className="flex-1 flex items-center justify-center py-1">
                            <DataGraphicCard
                              type={card.pair.graphicType}
                              size="sm"
                              className="scale-110 sm:scale-120"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-sky-300 font-bold block truncate max-w-[150px]">
                              {card.pair.title}
                            </span>
                            <span className="text-[9px] text-slate-400 mt-0.5 block">
                              ภาพประกอบความรู้
                            </span>
                          </div>
                        </>
                      ) : (
                        /* CARD TYPE 2: Meaning & Explanation */
                        <>
                          <div className="flex-1 flex flex-col items-center justify-center space-y-1 px-1">
                            <span className="text-xs sm:text-sm font-black text-amber-300 leading-tight">
                              {card.pair.meaning}
                            </span>
                            <span className="text-[10px] text-slate-300 leading-snug line-clamp-2">
                              {card.pair.detail}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-slate-400 block">
                              นิยาม ({card.pair.textbookRef})
                            </span>
                          </div>
                        </>
                      )}

                      {isMatched && (
                        <div className="pt-1 flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>จับคู่สำเร็จ!</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Card Back Pattern */
                    <div className="flex flex-col items-center justify-center space-y-2 opacity-90">
                      <div className="w-10 h-10 rounded-2xl bg-slate-900/90 border border-slate-700 flex items-center justify-center text-lg shadow-inner">
                        📊
                      </div>
                      <div className="text-[11px] font-mono font-bold tracking-wider uppercase text-sky-400">
                        DATA DETECTIVE
                      </div>
                      <span className="text-[9px] text-slate-400">คลิกเพื่อเปิดดู</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Finished Screen */
        <div className="mt-8 py-8 text-center space-y-5">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-4xl shadow-xl animate-bounce">
            🏆
          </div>

          <div>
            <h4 className="text-2xl font-black text-white font-['Chakra_Petch']">
              ยอดเยี่ยมมาก! คุณจับคู่นักสืบข้อมูลได้ถูกต้องครบทุกคู่
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
              ใช้จำนวนการเปิดทั้งหมด {moves} ครั้ง เข้าใจการจำแนกข้อมูลปฐมภูมิ-ทุติยภูมิ แผนภูมิ และการประมวลผลข้อมูลเพื่อการตัดสินใจ
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sky-500/20 border border-sky-500/40 text-sky-300 font-bold text-sm shadow-lg">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <span>ได้รับ +250 XP พิชิตข้อมูลและการประมวลผล! 📊</span>
          </div>

          <div className="pt-3 flex items-center justify-center gap-3">
            <button
              onClick={initGame}
              type="button"
              className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 transition-all shadow hover:scale-105"
            >
              <RotateCcw className="w-4 h-4" />
              <span>เล่นรอบใหม่ (สุ่มข้อมูลชุดใหม่)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
