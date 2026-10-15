/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
  EyeOff,
  Palette,
  Shuffle,
  Clock,
  Layers,
  HelpCircle,
  Award,
  Volume2,
  VolumeX,
  Flame
} from 'lucide-react';
import { sfx } from '../../utils/audioEffects';
import { StorageService } from '../../services/storage';

interface Game2FlashcardMatchingProps {
  onComplete: (score: number, maxScore: number, xpEarned: number) => void;
}

interface CardPair {
  pairId: string;
  symbolOrImage: string;
  name: string;
  desc: string;
  category: 'FLOWCHART' | 'STEP' | 'PSEUDOCODE';
}

const MASTER_PAIRS: CardPair[] = [
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
  {
    pairId: 'p7',
    symbolOrImage: '📐 [2. การวางแผน]',
    name: 'ออกแบบขั้นตอนวิธีและผังงาน (Plan)',
    desc: 'ขั้นตอนที่สอง: ถ่ายทอดความคิดเป็นรหัสลำลอง (Pseudocode) หรือผังงาน',
    category: 'STEP',
  },
  {
    pairId: 'p8',
    symbolOrImage: '💻 [3. ดำเนินการ]',
    name: 'ลงมือเขียนโค้ดและแก้ปัญหา (Execute)',
    desc: 'ขั้นตอนที่สาม: เขียนโปรแกรมตามขั้นตอนวิธีที่ได้ออกแบบไว้',
    category: 'STEP',
  },
  {
    pairId: 'p9',
    symbolOrImage: '🔍 [4. ตรวจสอบ]',
    name: 'ทดสอบและประเมินผล (Verify)',
    desc: 'ขั้นตอนที่สี่: ตรวจสอบความถูกต้องของผลลัพธ์ด้วยชุดข้อมูลทดสอบ',
    category: 'STEP',
  },
];

interface PlayableCard {
  uniqueId: string;
  pairId: string;
  type: 'SYMBOL' | 'TEXT';
  content: string;
  category: string;
}

const AI_THEMES = [
  { id: 'cyber', name: 'AI Cyber Blue', bg: 'from-blue-600 to-cyan-500', cardBack: 'border-cyan-500/50 bg-cyan-950/40 text-cyan-400' },
  { id: 'neon', name: 'AI Neon Emerald', bg: 'from-emerald-600 to-teal-500', cardBack: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-400' },
  { id: 'solar', name: 'AI Solar Gold', bg: 'from-amber-600 to-yellow-500', cardBack: 'border-amber-500/50 bg-amber-950/40 text-amber-400' },
  { id: 'cosmic', name: 'AI Cosmic Violet', bg: 'from-purple-600 to-indigo-500', cardBack: 'border-purple-500/50 bg-purple-950/40 text-purple-400' },
];

export const Game2FlashcardMatching: React.FC<Game2FlashcardMatchingProps> = ({ onComplete }) => {
  const [themeIdx, setThemeIdx] = useState(0);
  const [cards, setCards] = useState<PlayableCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [previewActive, setPreviewActive] = useState(true);
  const [previewCountdown, setPreviewCountdown] = useState(5);
  const [movesCount, setMovesCount] = useState(0);
  const [score, setScore] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [floatingPopup, setFloatingPopup] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(sfx.isMuted);
  const [isFinished, setIsFinished] = useState(false);

  const currentTheme = AI_THEMES[themeIdx];

  // Initialize and randomize round
  const initGame = () => {
    // Pick pairs from teacher storage or fallback to MASTER_PAIRS
    const customPairs = StorageService.games.getGame2Pairs();
    const sourcePairs = customPairs && customPairs.length >= 4 ? customPairs : MASTER_PAIRS;
    const shuffledPool = [...sourcePairs].sort(() => 0.5 - Math.random());
    const pairCount = Math.min(shuffledPool.length, 6);
    const selected = shuffledPool.slice(0, pairCount);

    const generatedCards: PlayableCard[] = [];
    selected.forEach((p) => {
      generatedCards.push({
        uniqueId: `${p.pairId}-sym`,
        pairId: p.pairId,
        type: 'SYMBOL',
        content: p.symbolOrImage,
        category: p.category,
      });
      generatedCards.push({
        uniqueId: `${p.pairId}-txt`,
        pairId: p.pairId,
        type: 'TEXT',
        content: p.name,
        category: p.category,
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

    // AI Theme shuffle
    setThemeIdx((prev) => (prev + 1) % AI_THEMES.length);

    // "ต้องเปิดไพ่ให้นักเรียนได้รู้ก่อน" (Peek / Preview Phase)
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
          setFloatingPopup(`จับคู่ถูกต้อง! +${earned} XP 🔥 x${nextCombo} STREAK!`);
        } else {
          sfx.playCorrect();
          setFloatingPopup(`จับคู่ถูกต้อง! +${earned} XP`);
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
              confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 text-slate-100 max-w-4xl mx-auto shadow-2xl relative">
      {/* Floating score / combo popup */}
      {floatingPopup && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none px-4 py-2 rounded-2xl bg-slate-950/90 border border-cyan-400 text-cyan-300 font-bold text-sm sm:text-base shadow-2xl animate-bounce backdrop-blur-md">
          {floatingPopup}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white font-['Chakra_Petch'] flex items-center gap-2">
              <span>Flashcards & Matching: ผังงานและการแก้ปัญหา</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                ม.1 บทที่ 2
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              จดจำสัญลักษณ์ผังงานและขั้นตอนแก้ปัญหา (เปิดไพ่ให้จำก่อนเริ่มเล่น สุ่มโจทย์ไม่ซ้ำ)
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
            title={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            onClick={initGame}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            title="สุ่มโจทย์และธีมการ์ดใหม่"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>สุ่มโจทย์ใหม่</span>
          </button>

          <div className="text-xs px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-cyan-400">
            เปิดคู่: {matchedPairIds.length} / {cards.length / 2}
          </div>
        </div>
      </div>

      {/* Preview Phase Notification */}
      {previewActive && (
        <div className="mt-4 p-3.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse shadow-lg">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm">
            <Eye className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <span className="font-bold text-white">ช่วงเวลาจดจำไพ่ (Preview Phase): </span>
              <span>ระบบเปิดไพ่ให้ดูตำแหน่งก่อนเริ่มเล่น จะคว่ำไพ่ในอีก </span>
              <span className="font-black text-cyan-300 text-base font-mono underline">
                {previewCountdown} วินาที
              </span>
            </div>
          </div>
          <button
            onClick={handleSkipPreview}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shrink-0 transition-colors shadow"
          >
            พร้อมแล้ว! เริ่มคว่ำไพ่เลย
          </button>
        </div>
      )}

      {/* Stats bar */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <Palette className="w-3.5 h-3.5 text-slate-500" />
          <span>ธีมการ์ด: <strong className="text-slate-200">{currentTheme.name}</strong></span>
        </div>
        <div>
          <span>จำนวนครั้งที่เปิด: <strong className="text-cyan-400 font-mono">{movesCount}</strong></span>
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
                className={`relative h-28 sm:h-32 rounded-2xl cursor-pointer perspective-1000 select-none transition-all duration-300 transform ${
                  isMatched ? 'opacity-85 scale-95' : 'hover:-translate-y-1'
                }`}
              >
                <div
                  className={`w-full h-full rounded-2xl border transition-all duration-300 p-3 flex flex-col items-center justify-center text-center shadow-lg ${
                    isFlipped
                      ? isMatched
                        ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 ring-2 ring-emerald-500/40'
                        : 'bg-slate-950 border-cyan-500/60 text-slate-100 ring-1 ring-cyan-500/30'
                      : `${currentTheme.cardBack} hover:border-slate-500`
                  }`}
                >
                  {isFlipped ? (
                    <div className="space-y-1 animate-fade-in">
                      <div className="text-sm sm:text-base font-bold leading-snug">
                        {card.content}
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
                        {card.type === 'SYMBOL' ? 'รูปสัญลักษณ์' : 'ความหมาย'}
                      </span>
                      {isMatched && (
                        <span className="text-[9px] text-emerald-400 font-bold block">
                          ✓ จับคู่สำเร็จ
                        </span>
                      )}
                    </div>
                  ) : (
                    /* Card Back Pattern */
                    <div className="flex flex-col items-center justify-center space-y-1.5 opacity-90">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-base shadow-inner">
                        🎴
                      </div>
                      <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400">
                        FLOWCHART
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Finished Screen */
        <div className="mt-8 py-6 text-center space-y-5">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-4xl shadow-xl">
            🎉
          </div>

          <div>
            <h4 className="text-2xl font-black text-white font-['Chakra_Petch']">
              ยอดเยี่ยมมาก! คุณจับคู่ Flashcards สำเร็จครบทุกคู่
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              ใช้จำนวนการเปิดทั้งหมด {movesCount} ครั้ง ได้คะแนนความจำและตรรกะผังงาน {Math.max(70, 100 - (movesCount - 6) * 4)} คะแนน
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>ได้รับ +250 XP พิชิตผังงานและรหัสลำลอง!</span>
          </div>

          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={initGame}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>เล่นรอบใหม่ (สุ่มโจทย์ใหม่)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
