/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Game1RoundData,
  Game1Item,
  Game2CardPair,
  Game3Question,
  Game3Monster,
  Game4ScratchStage,
  Game5DataCardPair,
  Game6ARTarget,
} from '../../types';
import { StorageService } from '../../services/storage';
import { feedback } from '../../utils/feedback';
import {
  Gamepad2,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  Layers,
  Sparkles,
  Bot,
  ShieldAlert,
  Edit3,
  Sliders,
  Code
} from 'lucide-react';

interface TeacherGameEditorProps {
  selectedChapter: number;
  onGameSaved?: () => void;
}

export const TeacherGameEditor: React.FC<TeacherGameEditorProps> = ({
  selectedChapter,
  onGameSaved,
}) => {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // States for each of the 6 chapter mini-games
  const [game1Rounds, setGame1Rounds] = useState<Game1RoundData[]>(() =>
    StorageService.games.getGame1Rounds()
  );
  const [game2Pairs, setGame2Pairs] = useState<Game2CardPair[]>(() =>
    StorageService.games.getGame2Pairs()
  );
  const [game3Questions, setGame3Questions] = useState<Record<number, Game3Question[]>>(() =>
    StorageService.games.getGame3Questions()
  );
  const [game3Monsters, setGame3Monsters] = useState<Game3Monster[]>(() =>
    StorageService.games.getGame3Monsters()
  );
  const [game4Stages, setGame4Stages] = useState<Game4ScratchStage[]>(() =>
    StorageService.games.getGame4Stages()
  );
  const [game5Pairs, setGame5Pairs] = useState<Game5DataCardPair[]>(() =>
    StorageService.games.getGame5Pairs()
  );
  const [game6Targets, setGame6Targets] = useState<Game6ARTarget[]>(() =>
    StorageService.games.getGame6Targets()
  );

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    feedback.save(msg);
    if (onGameSaved) onGameSaved();
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Reset current chapter game to defaults
  const handleReset = () => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการคืนค่าเริ่มต้นของมินิเกมบทที่ ${selectedChapter}? ข้อมูลที่แก้ไขไว้จะถูกแทนที่ด้วยค่ามาตรฐาน สสวท.`)) {
      return;
    }
    StorageService.games.resetGameToDefault(selectedChapter);
    setGame1Rounds(StorageService.games.getGame1Rounds());
    setGame2Pairs(StorageService.games.getGame2Pairs());
    setGame3Questions(StorageService.games.getGame3Questions());
    setGame3Monsters(StorageService.games.getGame3Monsters());
    setGame4Stages(StorageService.games.getGame4Stages());
    setGame5Pairs(StorageService.games.getGame5Pairs());
    setGame6Targets(StorageService.games.getGame6Targets());
    showNotification(`คืนค่าเริ่มต้นมินิเกมบทที่ ${selectedChapter} สำเร็จแล้ว!`);
  };

  // -------------------------------------------------------------
  // CHAPTER 1 SAVE & HANDLERS
  // -------------------------------------------------------------
  const handleSaveGame1 = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.games.saveGame1Rounds(game1Rounds);
    showNotification('บันทึกการตั้งค่าภารกิจและรายการข้อมูล บทที่ 1 สำเร็จ!');
  };

  const handleAddItemGame1 = (roundIndex: number) => {
    const updated = [...game1Rounds];
    const newItem: Game1Item = {
      id: `item-${Date.now()}`,
      name: 'ข้อมูลใหม่ที่ต้องการทดสอบ',
      isEssential: true,
      category: 'ข้อมูลทั่วไป',
      icon: '📌',
      reason: 'เหตุผลที่จำเป็นหรือไม่จำเป็นตามหลักคิดเชิงนามธรรม',
    };
    updated[roundIndex].items.push(newItem);
    setGame1Rounds(updated);
  };

  const handleDeleteItemGame1 = (roundIndex: number, itemIndex: number) => {
    const updated = [...game1Rounds];
    updated[roundIndex].items.splice(itemIndex, 1);
    setGame1Rounds(updated);
  };

  // -------------------------------------------------------------
  // CHAPTER 2 SAVE & HANDLERS
  // -------------------------------------------------------------
  const handleSaveGame2 = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.games.saveGame2Pairs(game2Pairs);
    showNotification('บันทึกการ์ดจับคู่ผังงานและรหัสลำลอง บทที่ 2 สำเร็จ!');
  };

  const handleAddPairGame2 = () => {
    const newPair: Game2CardPair = {
      pairId: `p-${Date.now()}`,
      symbolOrImage: '🔷 [สัญลักษณ์ใหม่]',
      name: 'ชื่อสัญลักษณ์ / คำสั่ง',
      desc: 'คำอธิบายความหมายและการนำไปใช้งานในผังงาน',
      category: 'FLOWCHART',
    };
    setGame2Pairs([...game2Pairs, newPair]);
  };

  const handleDeletePairGame2 = (index: number) => {
    const updated = [...game2Pairs];
    updated.splice(index, 1);
    setGame2Pairs(updated);
  };

  // -------------------------------------------------------------
  // CHAPTER 3 SAVE & HANDLERS
  // -------------------------------------------------------------
  const handleSaveGame3 = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.games.saveGame3Questions(game3Questions);
    StorageService.games.saveGame3Monsters(game3Monsters);
    showNotification('บันทึกโจทย์โค้ดไพทอนและบอสมอนสเตอร์ บทที่ 3 สำเร็จ!');
  };

  const handleAddQuestionGame3 = (level: number) => {
    const updated = { ...game3Questions };
    const currentList = updated[level] || [];
    const newQ: Game3Question = {
      id: `py-q-${Date.now()}`,
      prompt: 'โจทย์ทดสอบความเข้าใจคำสั่ง Python ใหม่',
      starterCode: '# พิมพ์โค้ดหรือคำถามที่นี่\nx = 10\nprint(x)',
      choices: ['ผลลัพธ์ ก', 'ผลลัพธ์ ข', 'ผลลัพธ์ ค', 'ผลลัพธ์ ง'],
      correctAnswer: 0,
      explanation: 'คำอธิบายอย่างละเอียดว่าทำไมตัวเลือกนี้จึงถูกต้องตามหลักไพทอน',
      damageBonus: 35,
    };
    updated[level] = [...currentList, newQ];
    setGame3Questions(updated);
  };

  const handleDeleteQuestionGame3 = (level: number, qIndex: number) => {
    const updated = { ...game3Questions };
    const list = [...(updated[level] || [])];
    list.splice(qIndex, 1);
    updated[level] = list;
    setGame3Questions(updated);
  };

  // -------------------------------------------------------------
  // CHAPTER 4 SAVE & HANDLERS
  // -------------------------------------------------------------
  const handleSaveGame4 = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.games.saveGame4Stages(game4Stages);
    showNotification('บันทึกด่านและบล็อกคำสั่ง Scratch บทที่ 4 สำเร็จ!');
  };

  const handleAddStageGame4 = () => {
    const newStage: Game4ScratchStage = {
      stageNumber: game4Stages.length + 1,
      title: `ด่านที่ ${game4Stages.length + 1}: ภารกิจ Scratch ใหม่`,
      story: 'คำบรรยายสถานการณ์และเป้าหมายที่ตัวละครต้องทำให้สำเร็จ',
      targetScore: 100,
      availableBlocks: ['when_green_flag', 'move_steps', 'repeat_loop', 'if_condition', 'say_hello'],
      solutionSequence: ['when_green_flag', 'move_steps'],
    };
    setGame4Stages([...game4Stages, newStage]);
  };

  const handleDeleteStageGame4 = (idx: number) => {
    const updated = [...game4Stages];
    updated.splice(idx, 1);
    setGame4Stages(updated);
  };

  // -------------------------------------------------------------
  // CHAPTER 5 SAVE & HANDLERS
  // -------------------------------------------------------------
  const handleSaveGame5 = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.games.saveGame5Pairs(game5Pairs);
    showNotification('บันทึกการ์ดประเภทข้อมูลและการประมวลผล บทที่ 5 สำเร็จ!');
  };

  const handleAddPairGame5 = () => {
    const newCard: Game5DataCardPair = {
      cardId: `dc-${Date.now()}`,
      term: 'คำศัพท์ / แหล่งข้อมูลใหม่',
      category: 'PRIMARY',
      description: 'คำอธิบายคุณลักษณะและวิธีการจัดเก็บหรือประมวลผล',
      example: 'ตัวอย่างข้อมูลจริงในชีวิตประจำวัน',
    };
    setGame5Pairs([...game5Pairs, newCard]);
  };

  const handleDeletePairGame5 = (idx: number) => {
    const updated = [...game5Pairs];
    updated.splice(idx, 1);
    setGame5Pairs(updated);
  };

  // -------------------------------------------------------------
  // CHAPTER 6 SAVE & HANDLERS
  // -------------------------------------------------------------
  const handleSaveGame6 = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.games.saveGame6Targets(game6Targets);
    showNotification('บันทึกเป้าหมาย AR และสถานการณ์ภัยไซเบอร์ บทที่ 6 สำเร็จ!');
  };

  const handleAddTargetGame6 = () => {
    const newTarget: Game6ARTarget = {
      targetId: `target-${Date.now()}`,
      threatName: 'ภัยคุกคามทางไซเบอร์ / กฎหมายใหม่',
      riskLevel: 'HIGH',
      scenario: 'สถานการณ์จำลองที่ผู้เรียนพบเจอขณะใช้งานสื่อสังคมออนไลน์หรืออุปกรณ์ไอที',
      options: ['วิธีรับมือ ก', 'วิธีรับมือ ข', 'วิธีรับมือ ค', 'วิธีรับมือ ง'],
      correctOptionIndex: 0,
      mitigationGuide: 'แนวทางการปฏิบัติที่ถูกต้องตามหลักความปลอดภัยและจริยธรรมดิจิทัล',
    };
    setGame6Targets([...game6Targets, newTarget]);
  };

  const handleDeleteTargetGame6 = (idx: number) => {
    const updated = [...game6Targets];
    updated.splice(idx, 1);
    setGame6Targets(updated);
  };

  if (selectedChapter === 7) {
    return (
      <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 border-2 border-amber-500/40 text-center space-y-4 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto text-3xl">
          📝
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider">
            ด่านพิเศษ: วัดผลสัมฤทธิ์ปลายภาคเรียน
          </span>
          <h3 className="text-xl font-bold text-white font-['Chakra_Petch']">
            ด่านที่ 7 ไม่มีมินิเกม (สอบวัดผลสัมฤทธิ์ล้วนๆ รวม 6 บทเรียน)
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            ด่านที่ 7 เป็นคลังข้อสอบวัดผลสัมฤทธิ์รวม 6 บทเรียน มีแบบทดสอบก่อนเรียน 30 ข้อ และแบบทดสอบหลังเรียน 30 ข้อ เพื่อวัดพัฒนาการองค์รวม คุณครูและผู้ดูแลระบบสามารถเพิ่ม ลบ และแก้ไขข้อสอบได้ที่แท็บ <strong className="text-amber-300">"ข้อสอบ (ก่อน/หลังเรียน)"</strong> ด้านบน
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with Reset and Save info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white font-['Chakra_Petch']">
              เครื่องมือแก้ไขมินิเกม บทที่ {selectedChapter} (Teacher Game Configuration)
            </h3>
            <p className="text-xs text-slate-400">
              คุณครูสามารถแก้ไขคำชี้แจง ตัวเลือก เงื่อนไขคำตอบ และเพิ่ม-ลบเนื้อหาในมินิเกมได้ทั้งหมด
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>คืนค่าเริ่มต้น สสวท.</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-emerald-300 text-xs font-semibold shadow-lg animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* CHAPTER 1: AR Hand Tracking & Abstraction                */}
      {/* ========================================================= */}
      {selectedChapter === 1 && (
        <form onSubmit={handleSaveGame1} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>ภารกิจคัดแยกข้อมูลเชิงนามธรรม (AR Abstraction)</span>
              </h4>
              <p className="text-xs text-slate-400">
                นักเรียนจะใช้การจับมือผ่านกล้อง AR หรือคลิกคัดแยกระหว่างข้อมูลจำเป็น (Essential) และไม่จำเป็น
              </p>
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>บันทึกมินิเกมบทที่ 1</span>
            </button>
          </div>

          <div className="space-y-6">
            {game1Rounds.map((round, rIdx) => (
              <div key={round.id || `game1-round-${rIdx}`} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center">
                      {rIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={round.missionTitle}
                      onChange={(e) => {
                        const updated = [...game1Rounds];
                        updated[rIdx].missionTitle = e.target.value;
                        setGame1Rounds(updated);
                      }}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500 w-full sm:w-80"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddItemGame1(rIdx)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1 w-fit"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มรายการข้อมูล</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">สถานการณ์จำลอง (Situation)</label>
                    <input
                      type="text"
                      value={round.situation}
                      onChange={(e) => {
                        const updated = [...game1Rounds];
                        updated[rIdx].situation = e.target.value;
                        setGame1Rounds(updated);
                      }}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">เป้าหมายภารกิจ (Target Goal)</label>
                    <input
                      type="text"
                      value={round.targetGoal}
                      onChange={(e) => {
                        const updated = [...game1Rounds];
                        updated[rIdx].targetGoal = e.target.value;
                        setGame1Rounds(updated);
                      }}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2.5 pt-2">
                  <div className="text-xs font-bold text-slate-300">รายการข้อมูลในสถานการณ์ ({round.items.length} รายการ):</div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {round.items.map((item, iIdx) => (
                      <div key={item.id ? `item-${item.id}-${iIdx}` : `item-${rIdx}-${iIdx}`} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center gap-3">
                        <input
                          type="text"
                          value={item.icon}
                          onChange={(e) => {
                            const updated = [...game1Rounds];
                            updated[rIdx].items[iIdx].icon = e.target.value;
                            setGame1Rounds(updated);
                          }}
                          className="w-12 text-center py-1 bg-slate-900 border border-slate-800 rounded-lg text-base"
                          title="ไอคอนอีโมจิ"
                        />
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const updated = [...game1Rounds];
                            updated[rIdx].items[iIdx].name = e.target.value;
                            setGame1Rounds(updated);
                          }}
                          placeholder="ชื่อข้อมูล"
                          className="flex-1 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                        />
                        <input
                          type="text"
                          value={item.reason}
                          onChange={(e) => {
                            const updated = [...game1Rounds];
                            updated[rIdx].items[iIdx].reason = e.target.value;
                            setGame1Rounds(updated);
                          }}
                          placeholder="เหตุผลประกอบ"
                          className="flex-1 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...game1Rounds];
                            updated[rIdx].items[iIdx].isEssential = !updated[rIdx].items[iIdx].isEssential;
                            setGame1Rounds(updated);
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                            item.isEssential
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {item.isEssential ? '✓ จำเป็น (Essential)' : '✗ ปลีกย่อย (Non-Essential)'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItemGame1(rIdx, iIdx)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                          title="ลบรายการ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* CHAPTER 2: Flashcards & Flowchart Matching                */}
      {/* ========================================================= */}
      {selectedChapter === 2 && (
        <form onSubmit={handleSaveGame2} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>การ์ดจับคู่สัญลักษณ์ผังงานและรหัสลำลอง ({game2Pairs.length} คู่)</span>
              </h4>
              <p className="text-xs text-slate-400">
                นักเรียนจะได้ฝึกเปิดการ์ดจับคู่สัญลักษณ์ ความหมาย และการประยุกต์ใช้ในการแก้ปัญหา
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddPairGame2}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มการ์ดใหม่</span>
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                <span>บันทึกมินิเกมบทที่ 2</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {game2Pairs.map((pair, idx) => (
              <div key={pair.pairId ? `game2-pair-${pair.pairId}-${idx}` : `game2-pair-${idx}`} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-emerald-400">การ์ดที่ {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleDeletePairGame2(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">สัญลักษณ์หรือรูปภาพ</label>
                  <input
                    type="text"
                    value={pair.symbolOrImage}
                    onChange={(e) => {
                      const updated = [...game2Pairs];
                      updated[idx].symbolOrImage = e.target.value;
                      setGame2Pairs(updated);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">ชื่อสัญลักษณ์ / คำสั่ง</label>
                  <input
                    type="text"
                    value={pair.name}
                    onChange={(e) => {
                      const updated = [...game2Pairs];
                      updated[idx].name = e.target.value;
                      setGame2Pairs(updated);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">คำอธิบายความหมาย</label>
                  <textarea
                    rows={2}
                    value={pair.desc}
                    onChange={(e) => {
                      const updated = [...game2Pairs];
                      updated[idx].desc = e.target.value;
                      setGame2Pairs(updated);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300"
                  />
                </div>
              </div>
            ))}
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* CHAPTER 3: Python Cyber Quest                             */}
      {/* ========================================================= */}
      {selectedChapter === 3 && (
        <form onSubmit={handleSaveGame3} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" />
                <span>โจทย์คำสั่ง Python และการต่อสู้บอส (Cyber Quest)</span>
              </h4>
              <p className="text-xs text-slate-400">
                ปรับแต่งโจทย์โค้ด ตัวเลือก คำอธิบาย และบอสประจำแต่ละระดับ
              </p>
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>บันทึกมินิเกมบทที่ 3</span>
            </button>
          </div>

          {[1, 2, 3].map((lvl) => (
            <div key={`game3-lvl-${lvl}`} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs font-bold">
                    ระดับ {lvl}
                  </span>
                  <span className="text-xs text-slate-300 font-semibold">
                    {game3Monsters.find((m) => m.id === lvl)?.name || `บอสระดับ ${lvl}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddQuestionGame3(lvl)}
                  className="px-3 py-1 rounded-lg bg-slate-800 text-indigo-300 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มข้อคำถาม</span>
                </button>
              </div>

              {/* Questions */}
              <div className="space-y-3">
                {(game3Questions[lvl] || []).map((q, qIdx) => (
                  <div key={q.id ? `game3-q-${lvl}-${q.id}-${qIdx}` : `game3-q-${lvl}-${qIdx}`} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400">คำถามที่ {qIdx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestionGame3(lvl, qIdx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={q.prompt}
                      onChange={(e) => {
                        const updated = { ...game3Questions };
                        updated[lvl][qIdx].prompt = e.target.value;
                        setGame3Questions(updated);
                      }}
                      placeholder="โจทย์คำถาม"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                    />

                    <textarea
                      rows={2}
                      value={q.starterCode || ''}
                      onChange={(e) => {
                        const updated = { ...game3Questions };
                        updated[lvl][qIdx].starterCode = e.target.value;
                        setGame3Questions(updated);
                      }}
                      placeholder="โค้ดตัวอย่าง Python"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-300"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(q.choices || []).map((choice: string, cIdx: number) => (
                        <div key={`game3-choice-${lvl}-${q.id || qIdx}-${cIdx}`} className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            name={`q-${lvl}-${qIdx}-correct`}
                            checked={q.correctAnswer === cIdx}
                            onChange={() => {
                              const updated = { ...game3Questions };
                              updated[lvl][qIdx].correctAnswer = cIdx;
                              setGame3Questions(updated);
                            }}
                            className="text-indigo-500"
                          />
                          <input
                            type="text"
                            value={choice}
                            onChange={(e) => {
                              const updated = { ...game3Questions };
                              if (!updated[lvl][qIdx].choices) {
                                updated[lvl][qIdx].choices = [];
                              }
                              updated[lvl][qIdx].choices![cIdx] = e.target.value;
                              setGame3Questions(updated);
                            }}
                            className="flex-1 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200"
                          />
                        </div>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) => {
                        const updated = { ...game3Questions };
                        updated[lvl][qIdx].explanation = e.target.value;
                        setGame3Questions(updated);
                      }}
                      placeholder="คำอธิบายเฉลย"
                      className="w-full px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-400"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </form>
      )}

      {/* ========================================================= */}
      {/* CHAPTER 4: Scratch AI Studio                              */}
      {/* ========================================================= */}
      {selectedChapter === 4 && (
        <form onSubmit={handleSaveGame4} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-amber-400" />
                <span>ด่านและภารกิจการต่อบล็อก Scratch ({game4Stages.length} ด่าน)</span>
              </h4>
              <p className="text-xs text-slate-400">
                ตั้งค่าบล็อกคำสั่งที่มีให้ใช้งาน เงื่อนไขการชนะ และเรื่องราวประจำด่าน
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddStageGame4}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มด่านใหม่</span>
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                <span>บันทึกมินิเกมบทที่ 4</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {game4Stages.map((st, idx) => (
              <div key={st.stageNumber ? `game4-stage-${st.stageNumber}-${idx}` : `game4-stage-${idx}`} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-amber-400">ด่านที่ {st.stageNumber}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteStageGame4(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">ชื่อด่าน</label>
                    <input
                      type="text"
                      value={st.title}
                      onChange={(e) => {
                        const updated = [...game4Stages];
                        updated[idx].title = e.target.value;
                        setGame4Stages(updated);
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">คะแนนเป้าหมาย</label>
                    <input
                      type="number"
                      value={st.targetScore}
                      onChange={(e) => {
                        const updated = [...game4Stages];
                        updated[idx].targetScore = Number(e.target.value);
                        setGame4Stages(updated);
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">เรื่องราวและเป้าหมาย</label>
                  <textarea
                    rows={2}
                    value={st.story}
                    onChange={(e) => {
                      const updated = [...game4Stages];
                      updated[idx].story = e.target.value;
                      setGame4Stages(updated);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300"
                  />
                </div>
              </div>
            ))}
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* CHAPTER 5: Data Puzzle Matching                           */}
      {/* ========================================================= */}
      {selectedChapter === 5 && (
        <form onSubmit={handleSaveGame5} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>การ์ดจำแนกประเภทข้อมูลและการประมวลผล ({game5Pairs.length} รายการ)</span>
              </h4>
              <p className="text-xs text-slate-400">
                กำหนดการ์ดข้อมูลและหมวดหมู่ (ปฐมภูมิ, ทุติยภูมิ, เชิงปริมาณ, เชิงคุณภาพ)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddPairGame5}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มการ์ดข้อมูล</span>
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                <span>บันทึกมินิเกมบทที่ 5</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {game5Pairs.map((pair, idx) => (
              <div key={pair.cardId ? `game5-card-${pair.cardId}-${idx}` : `game5-card-${idx}`} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-cyan-400">ข้อมูลที่ {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleDeletePairGame5(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">คำศัพท์ / แหล่งข้อมูล</label>
                    <input
                      type="text"
                      value={pair.term}
                      onChange={(e) => {
                        const updated = [...game5Pairs];
                        updated[idx].term = e.target.value;
                        setGame5Pairs(updated);
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">หมวดหมู่ข้อมูล</label>
                    <select
                      value={pair.category}
                      onChange={(e) => {
                        const updated = [...game5Pairs];
                        updated[idx].category = e.target.value as any;
                        setGame5Pairs(updated);
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                    >
                      <option value="PRIMARY">ข้อมูลปฐมภูมิ (Primary)</option>
                      <option value="SECONDARY">ข้อมูลทุติยภูมิ (Secondary)</option>
                      <option value="QUANTITATIVE">ข้อมูลเชิงปริมาณ (Quantitative)</option>
                      <option value="QUALITATIVE">ข้อมูลเชิงคุณภาพ (Qualitative)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">คำอธิบายความหมาย</label>
                  <input
                    type="text"
                    value={pair.description}
                    onChange={(e) => {
                      const updated = [...game5Pairs];
                      updated[idx].description = e.target.value;
                      setGame5Pairs(updated);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">ตัวอย่างประกอบ</label>
                  <input
                    type="text"
                    value={pair.example}
                    onChange={(e) => {
                      const updated = [...game5Pairs];
                      updated[idx].example = e.target.value;
                      setGame5Pairs(updated);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300"
                  />
                </div>
              </div>
            ))}
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* CHAPTER 6: AI Cyber Text Adventure & Threat Simulation    */}
      {/* ========================================================= */}
      {selectedChapter === 6 && (
        <form onSubmit={handleSaveGame6} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>สถานการณ์จำลองภัยไซเบอร์ & AI Text Adventure ({game6Targets.length} สถานการณ์)</span>
              </h4>
              <p className="text-xs text-slate-400">
                AI ทำหน้าที่เป็น Game Master รันสถานการณ์จำลองไซเบอร์ ให้ตัวเลือก A, B, C และประเมินผลลัพธ์ตามกฎหมายจริง
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddTargetGame6}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มสถานการณ์</span>
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                <span>บันทึกมินิเกมบทที่ 6</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {game6Targets.map((target, idx) => (
              <div key={target.targetId ? `game6-target-${target.targetId}-${idx}` : `game6-target-${idx}`} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-rose-400">ภัยคุกคามที่ {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteTargetGame6(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">ชื่อภัยคุกคาม</label>
                    <input
                      type="text"
                      value={target.threatName}
                      onChange={(e) => {
                        const updated = [...game6Targets];
                        updated[idx].threatName = e.target.value;
                        setGame6Targets(updated);
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">ระดับความเสี่ยง</label>
                    <select
                      value={target.riskLevel}
                      onChange={(e) => {
                        const updated = [...game6Targets];
                        updated[idx].riskLevel = e.target.value as any;
                        setGame6Targets(updated);
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                    >
                      <option value="LOW">ต่ำ (Low)</option>
                      <option value="MEDIUM">ปานกลาง (Medium)</option>
                      <option value="HIGH">สูง (High)</option>
                      <option value="CRITICAL">วิกฤต (Critical)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">สถานการณ์จำลอง</label>
                  <textarea
                    rows={2}
                    value={target.scenario}
                    onChange={(e) => {
                      const updated = [...game6Targets];
                      updated[idx].scenario = e.target.value;
                      setGame6Targets(updated);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1.5">ตัวเลือกวิธีรับมือ (เลือกตัวที่ถูก):</label>
                  <div className="space-y-1.5">
                    {(target.options || []).map((opt: string, oIdx: number) => (
                      <div key={`game6-target-opt-${target.targetId || idx}-${oIdx}`} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`target-${idx}-opt`}
                          checked={target.correctOptionIndex === oIdx}
                          onChange={() => {
                            const updated = [...game6Targets];
                            updated[idx].correctOptionIndex = oIdx;
                            setGame6Targets(updated);
                          }}
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const updated = [...game6Targets];
                            if (!updated[idx].options) {
                              updated[idx].options = [];
                            }
                            updated[idx].options![oIdx] = e.target.value;
                            setGame6Targets(updated);
                          }}
                          className="flex-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">คำแนะนำการรับมือที่ถูกต้อง (Mitigation Guide)</label>
                  <input
                    type="text"
                    value={target.mitigationGuide}
                    onChange={(e) => {
                      const updated = [...game6Targets];
                      updated[idx].mitigationGuide = e.target.value;
                      setGame6Targets(updated);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400"
                  />
                </div>
              </div>
            ))}
          </div>
        </form>
      )}
    </div>
  );
};
