/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  ArrowDownUp,
  Search,
  CheckCircle2,
  RotateCcw,
  Award,
  ChevronRight,
  HelpCircle,
  BarChart2
} from 'lucide-react';

interface Game3DataMasterProps {
  onComplete: (score: number, maxScore: number, xpEarned: number) => void;
}

export const Game3DataMaster: React.FC<Game3DataMasterProps> = ({ onComplete }) => {
  const [tab, setTab] = useState<'binary_search' | 'bubble_sort'>('binary_search');

  // Binary Search State
  const [targetNumber, setTargetNumber] = useState<number>(() => Math.floor(Math.random() * 100) + 1);
  const [guessInput, setGuessInput] = useState<string>('');
  const [searchMin, setSearchMin] = useState<number>(1);
  const [searchMax, setSearchMax] = useState<number>(100);
  const [searchAttempts, setSearchAttempts] = useState<number>(0);
  const [searchHistory, setSearchHistory] = useState<{ guess: number; hint: 'HIGHER' | 'LOWER' | 'CORRECT' }[]>([]);
  const [searchWon, setSearchWon] = useState(false);

  // Bubble Sort State
  const INITIAL_NUMBERS = [42, 17, 89, 23, 65, 8];
  const [numbers, setNumbers] = useState<number[]>([...INITIAL_NUMBERS]);
  const [swapCount, setSwapCount] = useState(0);
  const [sortWon, setSortWon] = useState(false);

  // Handle Binary Search Guess
  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(guessInput, 10);
    if (isNaN(val) || val < 1 || val > 100) return;

    setSearchAttempts((prev) => prev + 1);
    setGuessInput('');

    if (val === targetNumber) {
      setSearchWon(true);
      setSearchHistory((prev) => [{ guess: val, hint: 'CORRECT' }, ...prev]);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } else if (val < targetNumber) {
      if (val >= searchMin) setSearchMin(val + 1);
      setSearchHistory((prev) => [{ guess: val, hint: 'HIGHER' }, ...prev]);
    } else {
      if (val <= searchMax) setSearchMax(val - 1);
      setSearchHistory((prev) => [{ guess: val, hint: 'LOWER' }, ...prev]);
    }
  };

  const restartBinarySearch = () => {
    setTargetNumber(Math.floor(Math.random() * 100) + 1);
    setSearchMin(1);
    setSearchMax(100);
    setSearchAttempts(0);
    setSearchHistory([]);
    setSearchWon(false);
  };

  // Handle Bubble Sort Swap of adjacent elements
  const handleSwap = (i: number) => {
    if (i < 0 || i >= numbers.length - 1 || sortWon) return;

    const newArr = [...numbers];
    const temp = newArr[i];
    newArr[i] = newArr[i + 1];
    newArr[i + 1] = temp;

    setNumbers(newArr);
    setSwapCount((prev) => prev + 1);

    // Check if sorted ascending
    const isSorted = newArr.every((val, idx, arr) => idx === 0 || arr[idx - 1] <= val);
    if (isSorted) {
      setSortWon(true);
      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
    }
  };

  const resetSort = () => {
    setNumbers([...INITIAL_NUMBERS]);
    setSwapCount(0);
    setSortWon(false);
  };

  const handleFinishAll = () => {
    const totalScore = (searchWon ? 1 : 0) + (sortWon ? 1 : 0);
    const xpEarned = totalScore * 50 + 50;
    onComplete(totalScore, 2, xpEarned);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 max-w-3xl mx-auto shadow-2xl">
      {/* Game Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <ArrowDownUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white font-['Chakra_Petch']">
              มินิเกม: จัดระเบียบข้อมูลกู้โลก (Data Master & Search)
            </h3>
            <p className="text-xs text-slate-400">
              เรียนรู้ขั้นตอนวิธีค้นหาแบบแบ่งครึ่ง (Binary Search) และการจัดเรียงข้อมูล (Sorting)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {searchWon && sortWon && (
            <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-lg flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>สำเร็จ 2/2 ภารกิจ</span>
            </span>
          )}
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setTab('binary_search')}
          className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
            tab === 'binary_search'
              ? 'bg-teal-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>1. ค้นหาแบบทวิภาค (Binary Search)</span>
          {searchWon && <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />}
        </button>

        <button
          onClick={() => setTab('bubble_sort')}
          className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
            tab === 'bubble_sort'
              ? 'bg-teal-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>2. จัดเรียงข้อมูล (Data Sorting)</span>
          {sortWon && <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />}
        </button>
      </div>

      {/* Tab 1: Binary Search */}
      {tab === 'binary_search' && (
        <div className="mt-6 space-y-5">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-teal-400">
                โจทย์: ทายตัวเลขปริศนาระหว่าง 1 ถึง 100
              </span>
              <span className="text-xs text-slate-400">
                ช่วงความน่าจะเป็นปัจจุบัน: <strong className="text-amber-300">[{searchMin} - {searchMax}]</strong>
              </span>
            </div>
            <p className="text-xs text-slate-300">
              💡 เคล็ดลับ Binary Search: ให้ทายค่ากึ่งกลางเสมอ เพื่อตัดตัวเลือกออกไปทีละครึ่งหนึ่ง จะทายถูกภายในไม่เกิน 7 ครั้ง!
            </p>
          </div>

          {!searchWon ? (
            <form onSubmit={handleGuessSubmit} className="flex gap-2">
              <input
                type="number"
                min={1}
                max={100}
                required
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder={`ลองทายตัวเลข (แนะนำ: ${Math.floor((searchMin + searchMax) / 2)})`}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow hover:scale-105"
              >
                ทายค่า
              </button>
            </form>
          ) : (
            <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="font-bold text-emerald-300 text-base">
                ยินดีด้วย! ตัวเลขปริศนาคือ {targetNumber}
              </div>
              <div className="text-xs text-slate-300">
                คุณใช้ไปทั้งหมด {searchAttempts} ครั้ง ยอดเยี่ยมมาก!
              </div>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={restartBinarySearch}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-300 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>เล่นรอบใหม่</span>
                </button>
                <button
                  onClick={() => setTab('bubble_sort')}
                  className="px-4 py-1.5 bg-teal-500 text-slate-950 font-semibold rounded-lg text-xs"
                >
                  ไปต่อภารกิจที่ 2 →
                </button>
              </div>
            </div>
          )}

          {/* History / Attempts */}
          {searchHistory.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-400">ประวัติการทาย:</div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((item, idx) => (
                  <span
                    key={idx}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                      item.hint === 'CORRECT'
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : item.hint === 'HIGHER'
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                    }`}
                  >
                    ทาย {item.guess} → {item.hint === 'CORRECT' ? 'ถูกต้อง!' : item.hint === 'HIGHER' ? 'น้อยไป (ต้องมากกว่านี้)' : 'มากไป (ต้องน้อยกว่านี้)'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Bubble Sort */}
      {tab === 'bubble_sort' && (
        <div className="mt-6 space-y-6">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-teal-400">
                ภารกิจ: สลับตำแหน่งตัวเลขให้เรียงจาก "น้อยไปมาก"
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                คลิกที่ปุ่ม ⇄ ระหว่างคู่ตัวเลขเพื่อสลับที่กัน
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">จำนวนครั้งที่สลับ</div>
              <div className="text-lg font-bold text-amber-400">{swapCount} ครั้ง</div>
            </div>
          </div>

          {/* Sorting Visual Bar/Blocks */}
          <div className="flex items-center justify-center gap-1 sm:gap-2 py-6 px-2 bg-slate-950/60 rounded-2xl border border-slate-800 overflow-x-auto">
            {numbers.map((num, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center">
                  <div
                    className="w-12 sm:w-16 rounded-xl bg-gradient-to-t from-teal-600 to-cyan-500 border border-teal-400/40 flex items-center justify-center font-black text-slate-950 text-base sm:text-xl shadow-lg transition-all"
                    style={{ height: `${Math.max(60, num * 1.5)}px` }}
                  >
                    {num}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1.5">ลำดับที่ {i + 1}</span>
                </div>

                {i < numbers.length - 1 && (
                  <button
                    disabled={sortWon}
                    onClick={() => handleSwap(i)}
                    title={`สลับค่า ${numbers[i]} กับ ${numbers[i + 1]}`}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-slate-400 border border-slate-700 transition-all hover:scale-110 active:scale-95 text-xs font-bold"
                  >
                    ⇄
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>

          {sortWon ? (
            <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="font-bold text-emerald-300 text-base">
                เรียงลำดับสำเร็จ! ข้อมูลถูกจัดระเบียบเรียบร้อยแล้ว
              </div>
              <div className="text-xs text-slate-300">
                คุณใช้การสลับ {swapCount} ครั้งเพื่อเรียงจากน้อยไปหามาก
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>เป้าหมายเรียงลำดับ: 8 → 17 → 23 → 42 → 65 → 89</span>
              <button
                onClick={resetSort}
                className="text-amber-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีเซ็ตค่าเริ่มต้น</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Complete Button */}
      {(searchWon || sortWon) && (
        <div className="mt-8 pt-4 border-t border-slate-800 flex justify-end">
          <button
            id="data-master-finish-btn"
            onClick={handleFinishAll}
            className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md hover:scale-105 flex items-center gap-2"
          >
            <Award className="w-4 h-4" />
            <span>รับคะแนนและ XP ภารกิจจัดระเบียบข้อมูล</span>
          </button>
        </div>
      )}
    </div>
  );
};
