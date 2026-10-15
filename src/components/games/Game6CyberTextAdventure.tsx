/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  ShieldAlert,
  ShieldCheck,
  Bot,
  Sparkles,
  Send,
  RotateCcw,
  Volume2,
  VolumeX,
  AlertTriangle,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Flame,
  Zap,
  Terminal,
  MessageSquare,
  Lock,
  ChevronRight
} from 'lucide-react';
import { sfx } from '../../utils/audioEffects';

interface Game6CyberTextAdventureProps {
  onComplete: (score: number, maxScore: number, xpEarned: number) => void;
}

interface ScenarioOption {
  label: string;
  text: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | string;
}

interface GameTurnResult {
  narrative: string;
  safetyScoreDelta: number;
  isSafeChoice: boolean;
  situationTitle: string;
  threatCategory: string;
  options: ScenarioOption[];
  educationalInsight: string;
  isStoryCompleted: boolean;
}

interface StoryHistoryItem {
  turn: number;
  playerAction: string;
  narrative: string;
  isSafeChoice: boolean;
  educationalInsight: string;
}

const PRESET_PROMPTS = [
  {
    id: 'stranger-data',
    title: 'คนแปลกหน้าทักแชทขอข้อมูลส่วนตัว',
    icon: '💬',
    prompt: 'จำลองสถานการณ์ว่าฉันถูกคนแปลกหน้าทักมาขอข้อมูลส่วนตัว ให้ตัวเลือก A, B, C กับฉันว่าจะตอบสนองอย่างไร และจะเกิดผลลัพธ์อะไรตามมา',
  },
  {
    id: 'phishing-sms',
    title: 'SMS หลอกแจกเงิน & ฟิชชิ่งลิงก์',
    icon: '🚨',
    prompt: 'จำลองสถานการณ์ว่าฉันได้รับ SMS อ้างว่าเป็นเจ้าหน้าที่ธนาคารแจ้งว่าได้รับเงินรางวัล ให้กดลิงก์กรอกรหัส OTP ให้ตัวเลือก A, B, C กับฉันว่าจะตอบสนองอย่างไร',
  },
  {
    id: 'cracked-game',
    title: 'ไฟล์โปรแกรมโกงเกมแฝงไวรัส',
    icon: '🎮',
    prompt: 'จำลองสถานการณ์ว่าเพื่อนในเกมส่งลิงก์ดาวน์โหลดโปรแกรมโกงเกม cracked.exe ที่อาจแฝงมัลแวร์ขโมยรหัสผ่าน ให้ตัวเลือก A, B, C กับฉันว่าจะจัดการอย่างไร',
  },
  {
    id: 'cyberbullying',
    title: 'การบูลลี่และโพสต์ประจานในกลุ่ม',
    icon: '👥',
    prompt: 'จำลองสถานการณ์ว่าฉันพบเห็นเพื่อนถูกโพสต์ประจานและกลั่นแกล้ง (Cyberbullying) ในกลุ่มโซเชียล ให้ตัวเลือก A, B, C ตามหลักกฎหมาย พ.ร.บ.คอมพิวเตอร์',
  },
  {
    id: 'copyright-music',
    title: 'ลิขสิทธิ์เพลงและรูปภาพในคลิป',
    icon: '🎨',
    prompt: 'จำลองสถานการณ์ว่าฉันกำลังทำคลิปวิดีโอส่งครูและต้องการนำรูปและเพลงคนอื่นมาใช้ ให้ตัวเลือก A, B, C ตามหลักสัญญาอนุญาต Creative Commons',
  },
];

// Fallback scenarios if offline
const FALLBACK_DATA: Record<string, GameTurnResult> = {
  initial: {
    narrative: 'มีข้อความจากผู้ใช้ปริศนาโปรไฟล์รูปอนิเมะทักแชท DM เข้ามา: "สวัสดีครับน้อง พอดีพี่เป็นแอดมินกิจกรรมสุ่มแจกไอดีเกมและบัตรเติมเงินฟรี 500 บาท รบกวนขอชื่อ-นามสกุล เบอร์โทรศัพท์ และรหัส OTP 6 หลักที่ส่งไปที่เบอร์ของน้องหน่อยครับ"',
    safetyScoreDelta: 0,
    isSafeChoice: true,
    situationTitle: 'การรับมือข้อความจากคนแปลกหน้า (PDPA & Scammer)',
    threatCategory: 'การหลอกลวงเอาข้อมูลส่วนบุคคลและรหัส OTP',
    options: [
      { label: 'A', text: 'บล็อกบัญชีนี้ทันที และแคปหน้าจอแจ้งคุณครูหรือผู้ปกครอง', riskLevel: 'LOW' },
      { label: 'B', text: 'ตอบปฏิเสธไปว่าไม่รับรางวัล แต่ให้เบอร์โทรศัพท์ไว้เผื่อมีกิจกรรมอื่น', riskLevel: 'MEDIUM' },
      { label: 'C', text: 'รีบส่งรหัส OTP 6 หลักให้ทันทีเพราะอยากได้บัตรเติมเงิน 500 บาท', riskLevel: 'HIGH' },
    ],
    educationalInsight: 'รหัส OTP และข้อมูลส่วนตัวเปรียบเสมือนกุญแจบ้าน ห้ามส่งให้คนอื่นเด็ดขาด ตามหลักความปลอดภัยไซเบอร์และ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)',
    isStoryCompleted: false,
  },
};

export const Game6CyberTextAdventure: React.FC<Game6CyberTextAdventureProps> = ({ onComplete }) => {
  const [activeScenarioPrompt, setActiveScenarioPrompt] = useState<string>(PRESET_PROMPTS[0].prompt);
  const [customPromptInput, setCustomPromptInput] = useState<string>('');
  const [playerActionInput, setPlayerActionInput] = useState<string>('');
  const [currentTurn, setCurrentTurn] = useState<number>(1);
  const [safetyHp, setSafetyHp] = useState<number>(100);
  const [comboStreak, setComboStreak] = useState<number>(0);
  const [totalXp, setTotalXp] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sfx.isMuted);

  const [currentResult, setCurrentResult] = useState<GameTurnResult>(FALLBACK_DATA.initial);
  const [history, setHistory] = useState<StoryHistoryItem[]>([]);
  const storyEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of story log
  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, currentResult, isLoading]);

  // Request next story turn from AI
  const executeTurn = async (actionText: string, scenarioText?: string) => {
    setIsLoading(true);
    const targetScenario = scenarioText || activeScenarioPrompt;

    try {
      const res = await fetch('/api/cyber-adventure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioPrompt: targetScenario,
          playerAction: actionText,
          history: history.map((h) => ({
            turn: h.turn,
            action: h.playerAction,
            outcome: h.narrative,
          })),
          currentSafetyHp: safetyHp,
          turnCount: currentTurn,
        }),
      });

      const json = await res.json();

      if (json.success && json.data) {
        const data: GameTurnResult = json.data;

        // Sound effect based on choice
        if (data.isSafeChoice) {
          sfx.playCorrect();
          const nextStreak = comboStreak + 1;
          setComboStreak(nextStreak);
          setTotalXp((prev) => prev + 30 + nextStreak * 10);
        } else {
          sfx.playError();
          setComboStreak(0);
        }

        // Update Safety HP
        const newHp = Math.max(0, Math.min(100, safetyHp + (data.safetyScoreDelta || 0)));
        setSafetyHp(newHp);

        // Record history
        setHistory((prev) => [
          ...prev,
          {
            turn: currentTurn,
            playerAction: actionText,
            narrative: data.narrative,
            isSafeChoice: data.isSafeChoice,
            educationalInsight: data.educationalInsight,
          },
        ]);

        setCurrentResult(data);
        setCurrentTurn((prev) => prev + 1);

        // Check if story ends (turn >= 4 or game completed or HP <= 0)
        if (data.isStoryCompleted || currentTurn >= 4 || newHp <= 0) {
          setIsFinished(true);
          sfx.playVictory();
          confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
          const finalScore = Math.max(20, Math.min(100, Math.round((newHp + totalXp / 3))));
          onComplete(finalScore, 100, 250);
        }
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (err) {
      console.warn('AI Adventure Error:', err);
      // Fallback response
      const fallbackResult: GameTurnResult = {
        narrative: `คุณตัดสินใจ: "${actionText}" ผลคือระบบความปลอดภัยทำงานได้ถูกต้อง! คุณสามารถปกป้องข้อมูลส่วนตัวและไม่ตกเป็นเหยื่อของผู้ไม่หวังดี`,
        safetyScoreDelta: 15,
        isSafeChoice: true,
        situationTitle: 'การตัดสินใจอย่างปลอดภัย',
        threatCategory: 'การป้องกันข้อมูลส่วนบุคคล',
        options: [
          { label: 'A', text: 'บล็อกการติดต่อและเปลี่ยนรหัสผ่านทันที', riskLevel: 'LOW' },
          { label: 'B', text: 'ตรวจสอบประวัติการเข้าสู่ระบบใน Settings', riskLevel: 'LOW' },
          { label: 'C', text: 'สรุปบทเรียนและจบภารกิจ', riskLevel: 'LOW' },
        ],
        educationalInsight: 'การมีสติและไม่แชร์ข้อมูลให้คนแปลกหน้าเป็นหัวใจสำคัญของการเป็นพลเมืองดิจิทัลที่มีคุณภาพ',
        isStoryCompleted: currentTurn >= 3,
      };

      setHistory((prev) => [
        ...prev,
        {
          turn: currentTurn,
          playerAction: actionText,
          narrative: fallbackResult.narrative,
          isSafeChoice: true,
          educationalInsight: fallbackResult.educationalInsight,
        },
      ]);
      setCurrentResult(fallbackResult);
      setCurrentTurn((prev) => prev + 1);

      if (currentTurn >= 3) {
        setIsFinished(true);
        sfx.playVictory();
        onComplete(90, 100, 250);
      }
    } finally {
      setIsLoading(false);
      setPlayerActionInput('');
    }
  };

  // Start a new scenario
  const handleStartScenario = (promptText: string) => {
    setActiveScenarioPrompt(promptText);
    setCurrentTurn(1);
    setSafetyHp(100);
    setComboStreak(0);
    setHistory([]);
    setIsFinished(false);
    executeTurn('เริ่มจำลองสถานการณ์', promptText);
  };

  const handleRestart = () => {
    setCurrentTurn(1);
    setSafetyHp(100);
    setComboStreak(0);
    setTotalXp(0);
    setHistory([]);
    setIsFinished(false);
    executeTurn('เริ่มจำลองสถานการณ์ใหม่', activeScenarioPrompt);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 text-slate-100 max-w-4xl mx-auto shadow-2xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white font-['Chakra_Petch'] flex items-center gap-2">
              <span>Cyber Text Adventure: AI จำลองสถานการณ์ไซเบอร์</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                ม.1 บทที่ 6
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              AI รับบทเป็น Game Master สร้างสถานการณ์โต้ตอบ ให้ตัวเลือก A, B, C และจำลองผลลัพธ์ตามกฎหมายจริง
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Safety HP Bar */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400">🛡️ Safety HP:</span>
            <div className="w-20 sm:w-28 bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  safetyHp > 60 ? 'bg-emerald-500' : safetyHp > 30 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${safetyHp}%` }}
              />
            </div>
            <span className="font-bold font-mono text-emerald-400">{safetyHp}%</span>
          </div>

          <button
            onClick={() => {
              const muted = sfx.toggleMute();
              setIsMuted(muted);
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Preset Scenario Selector Buttons */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span>เลือกหัวข้อจำลองสถานการณ์ หรือป้อนคำสั่งให้ AI รันเกม:</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PRESET_PROMPTS.slice(0, 3).map((item) => (
            <button
              key={item.id}
              onClick={() => handleStartScenario(item.prompt)}
              disabled={isLoading}
              className={`p-2.5 rounded-xl border text-xs text-left font-semibold transition-all flex items-center gap-2 ${
                activeScenarioPrompt === item.prompt
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/40'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="truncate">{item.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom AI Prompt Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (customPromptInput.trim()) {
            handleStartScenario(customPromptInput.trim());
          }
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={customPromptInput}
          onChange={(e) => setCustomPromptInput(e.target.value)}
          placeholder='หรือพิมพ์คำสั่งจำลองสถานการณ์ตามใจชอบ เช่น "จำลองว่าฉันเจอคนแอบอ้างเป็นดารามาขอยืมเงิน..."'
          className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={isLoading || !customPromptInput.trim()}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md shrink-0 transition-transform active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          <span>รันสถานการณ์ AI</span>
        </button>
      </form>

      {/* Story & Interactive Turn Area */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-inner max-h-[460px] overflow-y-auto">
        {/* Story Log History */}
        {history.map((turnItem, idx) => (
          <div key={idx} className="space-y-2 border-b border-slate-900 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400">
                ตอนที่ {turnItem.turn}
              </span>
              <span className="text-xs font-semibold text-amber-300">
                การตัดสินใจ: &ldquo;{turnItem.playerAction}&rdquo;
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-2 border-l-2 border-slate-800">
              {turnItem.narrative}
            </p>

            {turnItem.educationalInsight && (
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] flex items-start gap-2">
                <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-indigo-400" />
                <span>💡 <strong>ความรู้ไซเบอร์:</strong> {turnItem.educationalInsight}</span>
              </div>
            )}
          </div>
        ))}

        {/* Current Turn Active Narrative */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-xs flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" />
              <span>AI Game Master • {currentResult.situationTitle || 'สถานการณ์ปัจจุบัน'}</span>
            </span>
            <span className="text-[11px] text-slate-400">หมวดหมู่: {currentResult.threatCategory}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-100 text-xs sm:text-sm leading-relaxed shadow-md">
            {isLoading ? (
              <div className="flex items-center gap-2.5 text-indigo-300 py-2">
                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <span>AI Game Master กำลังประมวลผลการตัดสินใจและคำนวณผลลัพธ์...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="whitespace-pre-line">{currentResult.narrative}</p>
                {currentResult.educationalInsight && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    <span><strong>คำแนะนำความปลอดภัย:</strong> {currentResult.educationalInsight}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div ref={storyEndRef} />
      </div>

      {/* Interactive Options & Action Choices */}
      {!isFinished ? (
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300 block">
            คุณจะตัดสินใจตอบสนองอย่างไร? (เลือกตัวเลือก A, B, C หรือพิมพ์เอง):
          </label>

          <div className="grid grid-cols-1 gap-2.5">
            {currentResult.options?.map((opt, idx) => (
              <button
                key={idx}
                disabled={isLoading}
                onClick={() => executeTurn(`เลือกข้อ ${opt.label}: ${opt.text}`)}
                className="w-full p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/60 text-left transition-all flex items-center justify-between gap-3 group shadow-md hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-xs flex items-center justify-center shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    {opt.label || String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                    {opt.text}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    opt.riskLevel === 'LOW'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : opt.riskLevel === 'MEDIUM'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {opt.riskLevel === 'LOW' ? '✓ ปลอดภัย' : opt.riskLevel === 'MEDIUM' ? '⚠️ ระวัง' : '⛔ เสี่ยงสูง'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </div>
              </button>
            ))}
          </div>

          {/* Custom Response Text Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (playerActionInput.trim()) {
                executeTurn(playerActionInput.trim());
              }
            }}
            className="flex gap-2 pt-1"
          >
            <input
              type="text"
              value={playerActionInput}
              onChange={(e) => setPlayerActionInput(e.target.value)}
              placeholder='หรือพิมพ์การกระทำที่ต้องการเอง เช่น "ฉันจะแคปหลักฐานแล้วโทรแจ้งสายด่วน 1441 ทันที"'
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isLoading || !playerActionInput.trim()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md shrink-0 transition-transform active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>ส่งการกระทำ</span>
            </button>
          </form>
        </div>
      ) : (
        /* Victory & Summary Screen */
        <div className="py-6 text-center space-y-4 bg-slate-950 rounded-2xl border border-indigo-500/30 p-6 shadow-xl animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-500/30 to-emerald-500/30 border border-indigo-400/40 flex items-center justify-center text-3xl shadow-xl">
            🏆
          </div>

          <div>
            <h4 className="text-xl font-bold text-white font-['Chakra_Petch']">
              ภารกิจจำลองสถานการณ์ไซเบอร์สำเร็จ! (Quest Completed)
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              คุณได้ผ่านการทดสอบการตัดสินใจในโลกไซเบอร์อย่างปลอดภัย ได้รับคะแนนความปลอดภัย {safetyHp}%
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-bold text-xs sm:text-sm">
            <Sparkles className="w-4 h-4" />
            <span>ได้รับ +250 XP พิชิตการใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย!</span>
          </div>

          <div className="pt-3 flex items-center justify-center gap-3">
            <button
              onClick={handleRestart}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>เล่นสถานการณ์ใหม่อีกครั้ง</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
