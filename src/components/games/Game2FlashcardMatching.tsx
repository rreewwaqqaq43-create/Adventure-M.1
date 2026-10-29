/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  RotateCcw,
  Eye,
  Shuffle,
  Layers,
  Volume2,
  VolumeX,
  Flame,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { sfx } from '../../utils/audioEffects';
import { FlowchartSymbolGraphic, FlowchartShapeType } from './FlowchartSymbolGraphic';

interface Game2FlashcardMatchingProps {
  onComplete: (score: number, maxScore: number, xpEarned: number) => void;
}

export interface FlowchartCardPair {
  pairId: string;
  shapeType: FlowchartShapeType;
  symbolName: string;
  englishName: string;
  meaning: string;
  detail: string;
  textbookRef: string;
}

// 8 Official Flowchart Symbols strictly based on สสวท. ม.1 & User's Attached Reference Sheet
export const MASTER_FLOWCHART_PAIRS: FlowchartCardPair[] = [
  {
    pairId: 'fc-terminal',
    shapeType: 'terminal',
    symbolName: 'จุดเริ่มต้นและสิ้นสุด',
    englishName: 'BEGIN หรือ END',
    meaning: 'จุดเริ่มต้นหรือจุดสิ้นสุดของการทำงาน',
    detail: 'สัญลักษณ์วงรีมน/สเตเดียม ใช้ระบุจุดเริ่มต้นและสิ้นสุดของผังงาน',
    textbookRef: 'สสวท. ม.1 หน้า 29',
  },
  {
    pairId: 'fc-flowline',
    shapeType: 'flow_line',
    symbolName: 'ลูกศรแสดงทิศทาง',
    englishName: 'FLOW LINE',
    meaning: 'ทิศทางการดำเนินงาน',
    detail: 'เส้นลูกศร ใช้กำหนดลำดับขั้นตอนและทิศทางการดำเนินงานของผังงาน',
    textbookRef: 'สสวท. ม.1 หน้า 29',
  },
  {
    pairId: 'fc-process',
    shapeType: 'process',
    symbolName: 'การดำเนินงาน / ปฏิบัติงาน',
    englishName: 'PROCESS',
    meaning: 'การดำเนินงาน หรือการประเมินผล',
    detail: 'สี่เหลี่ยมผืนผ้า ใช้แทนการคำนวณ กำหนดค่า หรือการปฏิบัติงานคำสั่ง',
    textbookRef: 'สสวท. ม.1 หน้า 29',
  },
  {
    pairId: 'fc-manual-input',
    shapeType: 'manual_input',
    symbolName: 'การนำเข้าด้วยแป้นพิมพ์',
    englishName: 'MANUAL INPUT',
    meaning: 'การนำเข้าด้วยการป้อนค่าทางแป้นพิมพ์',
    detail: 'สี่เหลี่ยมคางหมูด้านบนเอียง ใช้รับข้อมูลเข้าโดยตรงจากการพิมพ์ของมนุษย์',
    textbookRef: 'สสวท. ม.1 หน้า 30',
  },
  {
    pairId: 'fc-decision',
    shapeType: 'decision',
    symbolName: 'การตัดสินใจตามเงื่อนไข',
    englishName: 'DECISION',
    meaning: 'การตัดสินใจตามเงื่อนไขที่กำหนดไว้',
    detail: 'สี่เหลี่ยมข้าวหลามตัด ใช้ตรวจสอบเงื่อนไข มีเส้นทางออก จริง (True) หรือ เท็จ (False)',
    textbookRef: 'สสวท. ม.1 หน้า 30',
  },
  {
    pairId: 'fc-connector',
    shapeType: 'connector',
    symbolName: 'จุดเชื่อมต่อของผังงาน',
    englishName: 'CONNECTION',
    meaning: 'จุดเชื่อมต่อของผังงาน',
    detail: 'วงกลม ใช้เชื่อมต่อเส้นทางการทำงานของผังงานภายในหน้าเดียวกัน',
    textbookRef: 'สสวท. ม.1 หน้า 30',
  },
  {
    pairId: 'fc-display',
    shapeType: 'display',
    symbolName: 'การแสดงผลบนหน้าจอ',
    englishName: 'DISPLAY',
    meaning: 'การแสดงผลบนหน้าจอภาพ',
    detail: 'สัญลักษณ์หัวแหลมซ้าย ท้ายมนขวา ใช้แทนการแสดงผลลัพธ์ข้อมูลออกทางจอภาพ',
    textbookRef: 'สสวท. ม.1 หน้า 31',
  },
  {
    pairId: 'fc-input-output',
    shapeType: 'input_output',
    symbolName: 'รับข้อมูล / นำเข้าหรือออกทั่วไป',
    englishName: 'GENERAL INPUT/OUTPUT',
    meaning: 'การนำเข้าหรือนำออกโดยไม่ระบุชนิดของข้อมูล',
    detail: 'สี่เหลี่ยมด้านขนาน ใช้รับหรือแสดงผลข้อมูลโดยไม่ระบุอุปกรณ์เฉพาะ',
    textbookRef: 'สสวท. ม.1 หน้า 31',
  },
];

interface PlayableCard {
  uniqueId: string;
  pairId: string;
  type: 'SYMBOL' | 'TEXT';
  pair: FlowchartCardPair;
}

const CARD_THEMES = [
  { id: 'neon', name: 'ธีม Cyber Blue', cardBack: 'border-cyan-500/50 bg-cyan-950/40 text-cyan-400' },
  { id: 'emerald', name: 'ธีม Matrix Emerald', cardBack: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-400' },
  { id: 'solar', name: 'ธีม Solar Amber', cardBack: 'border-amber-500/50 bg-amber-950/40 text-amber-400' },
  { id: 'cosmic', name: 'ธีม Cosmic Violet', cardBack: 'border-purple-500/50 bg-purple-950/40 text-purple-400' },
];

export const Game2FlashcardMatching: React.FC<Game2FlashcardMatchingProps> = ({ onComplete }) => {
  const [themeIdx, setThemeIdx] = useState(0);
  const [cards, setCards] = useState<PlayableCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [previewActive, setPreviewActive] = useState(true);
  const [previewCountdown, setPreviewCountdown] = useState(6);
  const [movesCount, setMovesCount] = useState(0);
  const [, setScore] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [floatingPopup, setFloatingPopup] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(sfx.isMuted);
  const [isFinished, setIsFinished] = useState(false);

  const currentTheme = CARD_THEMES[themeIdx];

  // Initialize and randomize round (Pick 6 pairs = 12 cards)
  const initGame = () => {
    const shuffledPool = [...MASTER_FLOWCHART_PAIRS].sort(() => 0.5 - Math.random());
    const selected = shuffledPool.slice(0, 6);

    const generatedCards: PlayableCard[] = [];
    selected.forEach((p) => {
      // Card 1: Authentic SVG Flowchart Symbol
      generatedCards.push({
        uniqueId: `${p.pairId}-sym`,
        pairId: p.pairId,
        type: 'SYMBOL',
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
    setMovesCount(0);
    setScore(0);
    setComboStreak(0);
    setIsFinished(false);

    // Switch theme on restart
    setThemeIdx((prev) => (prev + 1) % CARD_THEMES.length);

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
      setMovesCount((prev) => prev + 1);
      const card1 = cards.find((c) => c.uniqueId === newFlipped[0]);
      const card2 = cards.find((c) => c.uniqueId === newFlipped[1]);

      if (card1 && card2 && card1.pairId === card2.pairId) {
        // Matched!
        const nextCombo = comboStreak + 1;
        setComboStreak(nextCombo);
        const earned = 15 + nextCombo * 5;

        if (nextCombo >= 2) {
          sfx.playCombo(nextCombo);
          setFloatingPopup(`จับคู่สัญลักษณ์ผังงานถูกต้อง! +${earned} XP 🔥 x${nextCombo} STREAK!`);
        } else {
          sfx.playCorrect();
          setFloatingPopup(`จับคู่ถูกต้อง: ${card1.pair.symbolName}! +${earned} XP`);
        }
        setTimeout(() => setFloatingPopup(null), 1200);

        setTimeout(() => {
          setMatchedPairIds((prev) => {
            const next = [...prev, card1.pairId];
            if (next.length === cards.length / 2) {
              // Game Complete!
              setIsFinished(true);
              sfx.playVictory();
              const finalScore = Math.max(70, 100 - (movesCount + 1 - 6) * 4);
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none px-5 py-2.5 rounded-2xl bg-slate-950/95 border-2 border-cyan-400 text-cyan-300 font-bold text-sm sm:text-base shadow-2xl animate-bounce backdrop-blur-md">
          {floatingPopup}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white font-['Chakra_Petch'] flex items-center gap-2">
              <span>มินิเกมจับคู่รูปสัญลักษณ์ผังงาน (Flowchart Matching)</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                ม.1 บทที่ 2
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              รูปสัญลักษณ์มาตรฐานตามหนังสือ สสวท. (เปิดไพ่ให้จดจำก่อนเริ่มเล่น และสุ่มสัญลักษณ์ 6 คู่ในแต่ละรอบ)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {comboStreak >= 2 && (
            <div className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/50 text-cyan-300 font-bold text-xs flex items-center gap-1 animate-pulse shadow-lg shadow-cyan-500/10">
              <Flame className="w-3.5 h-3.5 text-cyan-400" />
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
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            onClick={initGame}
            type="button"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            title="สุ่มโจทย์และสัญลักษณ์ใหม่"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>สุ่มโจทย์ใหม่</span>
          </button>

          <div className="text-xs px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-cyan-400 font-bold">
            จับคู่สำเร็จ: {matchedPairIds.length} / {cards.length / 2}
          </div>
        </div>
      </div>

      {/* Preview Phase Notification */}
      {previewActive && (
        <div className="mt-4 p-3.5 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse shadow-xl">
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <Eye className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <span className="font-bold text-white">ช่วงเวลาจดจำตำแหน่งไพ่ (Preview Phase): </span>
              <span>ระบบเปิดไพ่ให้ดูรูปสัญลักษณ์และความหมายก่อนเริ่ม จะคว่ำไพ่ในอีก </span>
              <span className="font-black text-cyan-300 text-base font-mono underline">
                {previewCountdown} วินาที
              </span>
            </div>
          </div>
          <button
            onClick={handleSkipPreview}
            type="button"
            className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shrink-0 transition-colors shadow hover:scale-105"
          >
            จำได้แล้ว! เริ่มเล่นเลย
          </button>
        </div>
      )}

      {/* Stats bar */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400 bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span>โหมด: <strong className="text-slate-200">รูปทรงผังงานมาตรฐาน สสวท. (SVG Graphics)</strong></span>
        </div>
        <div>
          <span>เปิดไปแล้ว: <strong className="text-cyan-400 font-mono font-bold">{movesCount}</strong> ครั้ง</span>
        </div>
      </div>

      {!isFinished ? (
        /* Card Grid: 12 Cards (3x4 or 4x3) with Responsive Height */
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {cards.map((card) => {
            const isFlipped = previewActive || flippedIds.includes(card.uniqueId) || matchedPairIds.includes(card.pairId);
            const isMatched = matchedPairIds.includes(card.pairId);

            return (
              <div
                key={card.uniqueId}
                onClick={() => handleCardClick(card)}
                className={`relative min-h-[140px] sm:min-h-[155px] rounded-2xl cursor-pointer select-none transition-all duration-300 transform ${
                  isMatched ? 'opacity-85 scale-95' : 'hover:-translate-y-1'
                }`}
              >
                <div
                  className={`w-full h-full rounded-2xl border-2 transition-all duration-300 p-3 flex flex-col items-center justify-center text-center shadow-lg ${
                    isFlipped
                      ? isMatched
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/40 shadow-emerald-900/30'
                        : 'bg-slate-950 border-cyan-500/70 text-slate-100 ring-1 ring-cyan-500/30'
                      : `${currentTheme.cardBack} hover:border-slate-400`
                  }`}
                >
                  {isFlipped ? (
                    <div className="w-full h-full flex flex-col items-center justify-between animate-fade-in space-y-1">
                      {card.type === 'SYMBOL' ? (
                        /* CARD TYPE 1: Real Flowchart SVG Symbol */
                        <>
                          <div className="flex-1 flex items-center justify-center py-1">
                            <FlowchartSymbolGraphic
                              shape={card.pair.shapeType}
                              size="sm"
                              className="scale-110 sm:scale-125"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-cyan-300 font-bold block">
                              {card.pair.englishName}
                            </span>
                            <span className="text-[9px] text-slate-400 mt-0.5 block">
                              รูปสัญลักษณ์ผังงาน
                            </span>
                          </div>
                        </>
                      ) : (
                        /* CARD TYPE 2: Meaning & Description */
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
                              ความหมาย ({card.pair.textbookRef})
                            </span>
                          </div>
                        </>
                      )}

                      {isMatched && (
                        <div className="pt-1 flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ถูกต้อง!</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Card Back Pattern */
                    <div className="flex flex-col items-center justify-center space-y-2 opacity-90">
                      <div className="w-10 h-10 rounded-2xl bg-slate-900/90 border border-slate-700 flex items-center justify-center text-lg shadow-inner">
                        📐
                      </div>
                      <div className="text-[11px] font-mono font-bold tracking-wider uppercase text-cyan-400">
                        FLOWCHART
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
            🎉
          </div>

          <div>
            <h4 className="text-2xl font-black text-white font-['Chakra_Petch']">
              ยอดเยี่ยมมาก! คุณจับคู่สัญลักษณ์ผังงานได้ถูกต้องครบทุกคู่
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
              ใช้จำนวนการเปิดทั้งหมด {movesCount} ครั้ง เข้าใจความหมายและรูปทรงสัญลักษณ์ผังงานมาตรฐาน สสวท. อย่างแม่นยำ
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-sm shadow-lg">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span>ได้รับ +250 XP พิชิตผังงานและรหัสลำลอง! 🏆</span>
          </div>

          <div className="pt-3 flex items-center justify-center gap-3">
            <button
              onClick={initGame}
              type="button"
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 transition-all shadow hover:scale-105"
            >
              <RotateCcw className="w-4 h-4" />
              <span>เล่นรอบใหม่ (สุ่มสัญลักษณ์ชุดใหม่)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
