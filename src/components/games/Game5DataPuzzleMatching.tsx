/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Shuffle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Palette,
  Eye,
  Layers,
  HelpCircle,
  Database,
  BarChart2,
  Binary,
  Award,
  Volume2,
  VolumeX,
  Flame
} from 'lucide-react';
import { sfx } from '../../utils/audioEffects';
import { StorageService } from '../../services/storage';

interface Game5DataPuzzleMatchingProps {
  onComplete: (score: number, maxScore: number, xpEarned: number) => void;
}

interface DataCardPair {
  pairId: string;
  symbol: string;
  name: string;
  detail: string;
  category: 'SOURCE' | 'ALGO' | 'CHART';
}

const MASTER_DATA_PAIRS: DataCardPair[] = [
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
    name: 'แสดงสัดส่วนของแต่ละส่วนเทียบกับทั้งหมด (100%)',
    detail: 'เหมาะสำหรับการแสดงเปอร์เซ็นต์ค่าใช้จ่ายประจำเดือน หรือสัดส่วนเพศ',
    category: 'CHART',
  },
];

interface PlayableCard {
  uniqueId: string;
  pairId: string;
  type: 'SYMBOL' | 'TEXT';
  content: string;
}

const AI_CARD_THEMES = [
  { id: 'matrix', name: 'AI Matrix Emerald', border: 'border-emerald-500/50', cardBack: 'bg-emerald-950/40 text-emerald-400' },
  { id: 'hologram', name: 'AI Hologram Amber', border: 'border-amber-500/50', cardBack: 'bg-amber-950/40 text-amber-400' },
  { id: 'crystal', name: 'AI Data Crystal Blue', border: 'border-sky-500/50', cardBack: 'bg-sky-950/40 text-sky-400' },
  { id: 'neon', name: 'AI Cyber Violet', border: 'border-purple-500/50', cardBack: 'bg-purple-950/40 text-purple-400' },
];

export const Game5DataPuzzleMatching: React.FC<Game5DataPuzzleMatchingProps> = ({ onComplete }) => {
  const [themeIdx, setThemeIdx] = useState(0);
  const [cards, setCards] = useState<PlayableCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [floatingPopup, setFloatingPopup] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(sfx.isMuted);
  const [isFinished, setIsFinished] = useState(false);

  // Peek / memorization mode
  const [previewActive, setPreviewActive] = useState(true);
  const [countdown, setCountdown] = useState(5);

  const currentTheme = AI_CARD_THEMES[themeIdx];

  const initGame = () => {
    // Pick pairs from teacher storage or fallback to MASTER_DATA_PAIRS
    const customPairs = StorageService.games.getGame5Pairs();
    const sourcePairs =
      customPairs && customPairs.length >= 4
        ? customPairs.map((cp, idx) => ({
            pairId: cp.pairId || cp.cardId || `card-${idx}`,
            symbol: cp.symbol || cp.example || cp.term || '📊',
            name: cp.name || cp.term || 'ข้อมูล',
            category: cp.category as any,
          }))
        : MASTER_DATA_PAIRS;

    const shuffledPool = [...sourcePairs].sort(() => 0.5 - Math.random());
    const count = Math.min(shuffledPool.length, 6);
    const selected = shuffledPool.slice(0, count);

    const generated: PlayableCard[] = [];
    selected.forEach((p) => {
      generated.push({
        uniqueId: `${p.pairId}-sym`,
        pairId: p.pairId,
        type: 'SYMBOL',
        content: p.symbol || '📊',
      });
      generated.push({
        uniqueId: `${p.pairId}-txt`,
        pairId: p.pairId,
        type: 'TEXT',
        content: p.name || 'ข้อมูล',
      });
    });

    setCards(generated.sort(() => 0.5 - Math.random()));
    setFlippedIds([]);
    setMatchedPairIds([]);
    setMoves(0);
    setScore(0);
    setComboStreak(0);
    setIsFinished(false);

    // AI theme switch
    setThemeIdx((prev) => (prev + 1) % AI_CARD_THEMES.length);

    // Preview active
    setPreviewActive(true);
    setCountdown(5);
  };

  useEffect(() => {
    initGame();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!previewActive) return;
    if (countdown <= 0) {
      setPreviewActive(false);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [previewActive, countdown]);

  const handleCardClick = (card: PlayableCard) => {
    if (previewActive) return;
    if (matchedPairIds.includes(card.pairId)) return;
    if (flippedIds.includes(card.uniqueId)) return;
    if (flippedIds.length >= 2) return;

    sfx.playCardFlip();
    const newFlipped = [...flippedIds, card.uniqueId];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const c1 = cards.find((c) => c.uniqueId === newFlipped[0]);
      const c2 = cards.find((c) => c.uniqueId === newFlipped[1]);

      if (c1 && c2 && c1.pairId === c2.pairId) {
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
            const next = [...prev, c1.pairId];
            if (next.length === cards.length / 2) {
              setIsFinished(true);
              sfx.playVictory();
              const finalScore = Math.max(70, 100 - (moves + 1 - 6) * 4);
              confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
              onComplete(finalScore, 100, 250);
            }
            return next;
          });
          setFlippedIds([]);
          setScore((s) => s + earned);
        }, 500);
      } else {
        setComboStreak(0);
        sfx.playError();
        setTimeout(() => {
          setFlippedIds([]);
        }, 1100);
      }
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 text-slate-100 max-w-4xl mx-auto shadow-2xl relative">
      {/* Floating score / combo popup */}
      {floatingPopup && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none px-4 py-2 rounded-2xl bg-slate-950/90 border border-emerald-400 text-emerald-300 font-bold text-sm sm:text-base shadow-2xl animate-bounce backdrop-blur-md">
          {floatingPopup}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white font-['Chakra_Petch'] flex items-center gap-2">
              <span>Interactive Quiz & Puzzle: ข้อมูลและการประมวลผล</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ม.1 บทที่ 5
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              เกมจับคู่ภาพกับคำศัพท์และการ์ดทายใจ (AI ลวดลายการ์ดและสุ่มโจทย์ไม่ซ้ำรอบ)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {comboStreak >= 2 && (
            <div className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center gap-1 animate-pulse shadow-lg shadow-emerald-500/10">
              <Flame className="w-3.5 h-3.5 text-emerald-400" />
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
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={initGame}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            title="สุ่มโจทย์และลวดลายการ์ดใหม่"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>สุ่มโจทย์ใหม่</span>
          </button>
          <div className="text-xs px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-emerald-400">
            คู่ที่เปิดได้: {matchedPairIds.length} / {cards.length / 2}
          </div>
        </div>
      </div>

      {/* Preview Banner */}
      {previewActive && (
        <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse shadow-lg">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Eye className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>เปิดไพ่ให้จดจำก่อนเริ่มเล่น:</strong> จะคว่ำการ์ดในอีก{' '}
              <span className="font-mono font-bold text-emerald-300 underline">{countdown} วินาที</span>
            </span>
          </div>
          <button
            onClick={() => setPreviewActive(false)}
            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow"
          >
            เริ่มคว่ำไพ่เลย
          </button>
        </div>
      )}

      {/* Info bar */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <Palette className="w-3.5 h-3.5 text-slate-500" />
          <span>ธีมการ์ด AI: <strong className="text-slate-200">{currentTheme.name}</strong></span>
        </div>
        <div>
          <span>เปิดไปแล้ว: <strong className="text-emerald-400 font-mono">{moves}</strong> ครั้ง</span>
        </div>
      </div>

      {!isFinished ? (
        /* Cards Grid */
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {cards.map((card) => {
            const isFlipped = previewActive || flippedIds.includes(card.uniqueId) || matchedPairIds.includes(card.pairId);
            const isMatched = matchedPairIds.includes(card.pairId);

            return (
              <div
                key={card.uniqueId}
                onClick={() => handleCardClick(card)}
                className={`relative h-28 sm:h-32 rounded-2xl cursor-pointer select-none transition-all duration-300 transform ${
                  isMatched ? 'opacity-85 scale-95' : 'hover:-translate-y-1'
                }`}
              >
                <div
                  className={`w-full h-full rounded-2xl border transition-all duration-300 p-3 flex flex-col items-center justify-center text-center shadow-lg ${
                    isFlipped
                      ? isMatched
                        ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 ring-2 ring-emerald-500/40'
                        : 'bg-slate-950 border-emerald-500/60 text-slate-100 ring-1 ring-emerald-500/30'
                      : `${currentTheme.cardBack} ${currentTheme.border} hover:border-slate-500`
                  }`}
                >
                  {isFlipped ? (
                    <div className="space-y-1 animate-fade-in">
                      <div className="text-xs sm:text-sm font-bold leading-snug">
                        {card.content}
                      </div>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {card.type === 'SYMBOL' ? 'คำหลัก / ภาพ' : 'ความหมาย / ตัวอย่าง'}
                      </span>
                      {isMatched && (
                        <span className="text-[9px] text-emerald-400 font-bold block">
                          ✓ จับคู่สำเร็จ
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-1 opacity-90">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-base shadow-inner">
                        📊
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                        DATA PUZZLE
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
          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-4xl shadow-xl">
            🏆
          </div>

          <div>
            <h4 className="text-2xl font-black text-white font-['Chakra_Petch']">
              ยินดีด้วย! คุณพิชิตการจับคู่ Data Puzzle ครบทุกคู่
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              เปิดการ์ด {moves} ครั้ง ได้คะแนนความจำและความเข้าใจข้อมูล {Math.max(70, 100 - (moves - 6) * 4)} คะแนน
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>ได้รับ +250 XP พิชิตข้อมูลและการประมวลผล!</span>
          </div>

          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={initGame}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>เล่นใหม่อีกครั้ง (สุ่มโจทย์ใหม่)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
