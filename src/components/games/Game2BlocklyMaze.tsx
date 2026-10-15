/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Play,
  RotateCcw,
  RotateCw,
  Plus,
  Trash2,
  Bot,
  Flag,
  Sparkles,
  Award,
  ArrowUp,
  Repeat,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Game2BlocklyMazeProps {
  onComplete: (score: number, maxScore: number, xpEarned: number) => void;
}

type Direction = 'UP' | 'RIGHT' | 'DOWN' | 'LEFT';

interface CommandBlock {
  id: string;
  type: 'FORWARD' | 'TURN_LEFT' | 'TURN_RIGHT' | 'REPEAT_3';
  label: string;
}

interface LevelConfig {
  level: number;
  name: string;
  gridSize: number; // e.g. 5x5
  start: { x: number; y: number; dir: Direction };
  goal: { x: number; y: number };
  walls: { x: number; y: number }[];
  hint: string;
}

const LEVELS: LevelConfig[] = [
  {
    level: 1,
    name: 'ด่าน 1: คำสั่งลำดับตรง (Sequence Path)',
    gridSize: 5,
    start: { x: 1, y: 1, dir: 'RIGHT' },
    goal: { x: 4, y: 1 },
    walls: [
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
    ],
    hint: 'ใช้คำสั่ง "เดินหน้า" 3 ครั้ง เพื่อให้หุ่นยนต์เดินไปถึงธงชัยชนะ',
  },
  {
    level: 2,
    name: 'ด่าน 2: การเลี้ยวและเปลี่ยนทิศ (Turning Corners)',
    gridSize: 5,
    start: { x: 1, y: 1, dir: 'RIGHT' },
    goal: { x: 3, y: 3 },
    walls: [
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 4, y: 1 },
      { x: 4, y: 2 },
      { x: 2, y: 4 },
    ],
    hint: 'เดินหน้า 2 ครั้ง เลี้ยวขวา แล้วเดินหน้าอีก 2 ครั้ง เพื่อเข้าสู่เป้าหมาย',
  },
  {
    level: 3,
    name: 'ด่าน 3: การวนซ้ำประหยัดบล็อก (Repeat Loop)',
    gridSize: 5,
    start: { x: 0, y: 4, dir: 'UP' },
    goal: { x: 0, y: 0 },
    walls: [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 1, y: 3 },
      { x: 1, y: 4 },
    ],
    hint: 'ใช้บล็อก "วนซ้ำ 3 ครั้ง (เดินหน้า)" เพื่อร่นระยะทางและฝึกแนวคิด Loop',
  },
];

export const Game2BlocklyMaze: React.FC<Game2BlocklyMazeProps> = ({ onComplete }) => {
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const currentLevel = LEVELS[currentLevelIdx];

  // Robot State
  const [robotPos, setRobotPos] = useState({ ...currentLevel.start });
  const [program, setProgram] = useState<CommandBlock[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [levelPassed, setLevelPassed] = useState(false);
  const [totalScore, setTotalScore] = useState(0);

  // Reset robot when level changes
  useEffect(() => {
    resetRobot();
    setProgram([]);
    setLevelPassed(false);
    setStatusMsg(null);
  }, [currentLevelIdx]);

  const resetRobot = () => {
    setRobotPos({ ...currentLevel.start });
    setActiveBlockIndex(null);
    setIsRunning(false);
  };

  const addBlock = (type: CommandBlock['type'], label: string) => {
    if (isRunning) return;
    const newBlock: CommandBlock = {
      id: `block-${Date.now()}-${Math.random()}`,
      type,
      label,
    };
    setProgram((prev) => [...prev, newBlock]);
  };

  const removeBlock = (index: number) => {
    if (isRunning) return;
    setProgram((prev) => prev.filter((_, idx) => idx !== index));
  };

  const clearProgram = () => {
    if (isRunning) return;
    setProgram([]);
    resetRobot();
    setStatusMsg(null);
  };

  // Run the program step by step
  const handleRunProgram = async () => {
    if (isRunning || program.length === 0) return;
    setIsRunning(true);
    setStatusMsg('กำลังประมวลผลคำสั่งทีละบล็อก...');
    resetRobot();

    let curX = currentLevel.start.x;
    let curY = currentLevel.start.y;
    let curDir = currentLevel.start.dir;

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Expand commands (handling Repeat block)
    const expandedActions: { type: string; blockIdx: number }[] = [];
    program.forEach((block, idx) => {
      if (block.type === 'REPEAT_3') {
        expandedActions.push({ type: 'FORWARD', blockIdx: idx });
        expandedActions.push({ type: 'FORWARD', blockIdx: idx });
        expandedActions.push({ type: 'FORWARD', blockIdx: idx });
      } else {
        expandedActions.push({ type: block.type, blockIdx: idx });
      }
    });

    for (let i = 0; i < expandedActions.length; i++) {
      const action = expandedActions[i];
      setActiveBlockIndex(action.blockIdx);
      await delay(450);

      if (action.type === 'TURN_LEFT') {
        const dirs: Direction[] = ['UP', 'LEFT', 'DOWN', 'RIGHT'];
        const curIdx = dirs.indexOf(curDir);
        curDir = dirs[(curIdx + 1) % 4];
        setRobotPos({ x: curX, y: curY, dir: curDir });
      } else if (action.type === 'TURN_RIGHT') {
        const dirs: Direction[] = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
        const curIdx = dirs.indexOf(curDir);
        curDir = dirs[(curIdx + 1) % 4];
        setRobotPos({ x: curX, y: curY, dir: curDir });
      } else if (action.type === 'FORWARD') {
        let nextX = curX;
        let nextY = curY;
        if (curDir === 'UP') nextY -= 1;
        if (curDir === 'DOWN') nextY += 1;
        if (curDir === 'LEFT') nextX -= 1;
        if (curDir === 'RIGHT') nextX += 1;

        // Check boundaries
        if (
          nextX < 0 ||
          nextX >= currentLevel.gridSize ||
          nextY < 0 ||
          nextY >= currentLevel.gridSize
        ) {
          setStatusMsg('ชนขอบพื้นที่! ตรวจสอบคำสั่งของคุณใหม่อีกครั้ง');
          setIsRunning(false);
          setActiveBlockIndex(null);
          return;
        }

        // Check wall collision
        const hitWall = currentLevel.walls.some((w) => w.x === nextX && w.y === nextY);
        if (hitWall) {
          setStatusMsg('ชนสิ่งกีดขวาง! โปรแกรมหยุดการทำงาน');
          setIsRunning(false);
          setActiveBlockIndex(null);
          return;
        }

        curX = nextX;
        curY = nextY;
        setRobotPos({ x: curX, y: curY, dir: curDir });
      }

      // Check if reached goal
      if (curX === currentLevel.goal.x && curY === currentLevel.goal.y) {
        setStatusMsg('ยินดีด้วย! หุ่นยนต์เดินทางถึงเป้าหมายสำเร็จ 🎉');
        setIsRunning(false);
        setActiveBlockIndex(null);
        setLevelPassed(true);
        setTotalScore((prev) => prev + 1);
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        return;
      }
    }

    // Finished program without reaching goal
    setIsRunning(false);
    setActiveBlockIndex(null);
    if (curX !== currentLevel.goal.x || curY !== currentLevel.goal.y) {
      setStatusMsg('ยังไม่ถึงเป้าหมาย ลองเพิ่มบล็อกคำสั่งเพิ่มเติมดูสิ!');
    }
  };

  const handleNextLevel = () => {
    if (currentLevelIdx < LEVELS.length - 1) {
      setCurrentLevelIdx((prev) => prev + 1);
    } else {
      // Finished all 3 levels
      const finalScore = totalScore + 1;
      const xpEarned = finalScore * 40 + 80;
      onComplete(finalScore, LEVELS.length, xpEarned);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 max-w-4xl mx-auto shadow-2xl">
      {/* Game Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white font-['Chakra_Petch']">
              มินิเกม: Blockly Maze Runner
            </h3>
            <p className="text-xs text-slate-400">{currentLevel.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-slate-400">
            ด่าน: <span className="font-bold text-amber-400">{currentLevelIdx + 1}/{LEVELS.length}</span>
          </div>
          <div className="text-xs text-slate-400">
            คะแนน: <span className="font-bold text-emerald-400">{totalScore}</span>
          </div>
        </div>
      </div>

      {/* Hint Alert */}
      <div className="mt-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center gap-2">
        <Sparkles className="w-4 h-4 shrink-0 text-indigo-400" />
        <span>คำแนะนำ: {currentLevel.hint}</span>
      </div>

      {/* Game Area: Maze Grid (Left) + Blockly Workspace (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
        {/* Left: 5x5 Maze Visualizer */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 bg-slate-950 rounded-2xl border border-slate-800">
          <div className="grid grid-cols-5 gap-1.5 p-2 bg-slate-900 rounded-xl border border-slate-800">
            {Array.from({ length: currentLevel.gridSize }).map((_, r) =>
              Array.from({ length: currentLevel.gridSize }).map((_, c) => {
                const isRobot = robotPos.x === c && robotPos.y === r;
                const isGoal = currentLevel.goal.x === c && currentLevel.goal.y === r;
                const isWall = currentLevel.walls.some((w) => w.x === c && w.y === r);

                let cellBg = 'bg-slate-950/60 border border-slate-800/80';
                if (isWall) cellBg = 'bg-slate-800 border border-slate-700';
                if (isGoal) cellBg = 'bg-amber-500/20 border border-amber-500/40';

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center relative transition-all ${cellBg}`}
                  >
                    {isWall && (
                      <div className="w-6 h-6 rounded bg-slate-700/80 border border-slate-600 flex items-center justify-center text-[10px] text-slate-400">
                        🧱
                      </div>
                    )}

                    {isGoal && !isRobot && (
                      <Flag className="w-6 h-6 text-amber-400 animate-bounce" />
                    )}

                    {isRobot && (
                      <div
                        className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg transform transition-transform duration-300"
                        style={{
                          transform:
                            robotPos.dir === 'UP'
                              ? 'rotate(0deg)'
                              : robotPos.dir === 'RIGHT'
                              ? 'rotate(90deg)'
                              : robotPos.dir === 'DOWN'
                              ? 'rotate(180deg)'
                              : 'rotate(270deg)',
                        }}
                      >
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Status Message */}
          {statusMsg && (
            <div
              className={`mt-4 w-full p-2.5 rounded-xl text-xs text-center font-medium border ${
                levelPassed
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              }`}
            >
              {statusMsg}
            </div>
          )}
        </div>

        {/* Right: Blockly Command Blocks & Program Sequence */}
        <div className="lg:col-span-6 space-y-4">
          {/* Palette: Available Scratch/Blockly Blocks */}
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2">
              กล่องคำสั่ง (คลิกเพื่อเพิ่มลงโปรแกรม):
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={isRunning}
                onClick={() => addBlock('FORWARD', 'เดินหน้า (Move Forward)')}
                className="p-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all hover:scale-[1.02] text-left"
              >
                <ArrowUp className="w-4 h-4 text-blue-400" />
                <span>เดินหน้า 1 ก้าว</span>
              </button>

              <button
                disabled={isRunning}
                onClick={() => addBlock('TURN_LEFT', 'เลี้ยวซ้าย (Turn Left)')}
                className="p-2.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all hover:scale-[1.02] text-left"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>เลี้ยวซ้าย 90°</span>
              </button>

              <button
                disabled={isRunning}
                onClick={() => addBlock('TURN_RIGHT', 'เลี้ยวขวา (Turn Right)')}
                className="p-2.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all hover:scale-[1.02] text-left"
              >
                <RotateCw className="w-4 h-4 text-amber-400" />
                <span>เลี้ยวขวา 90°</span>
              </button>

              <button
                disabled={isRunning}
                onClick={() => addBlock('REPEAT_3', 'วนซ้ำ 3 ครั้ง: เดินหน้า')}
                className="p-2.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all hover:scale-[1.02] text-left"
              >
                <Repeat className="w-4 h-4 text-purple-400" />
                <span>วนซ้ำ 3 ครั้ง</span>
              </button>
            </div>
          </div>

          {/* Program Queue */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">
                บล็อกคำสั่งของโปรแกรม ({program.length})
              </span>
              <button
                disabled={isRunning || program.length === 0}
                onClick={clearProgram}
                className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>ล้างคำสั่ง</span>
              </button>
            </div>

            <div className="min-h-[140px] max-h-[180px] overflow-y-auto space-y-1.5 p-2 bg-slate-900/60 rounded-lg border border-slate-800/80">
              {program.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-8">
                  ยังไม่มีคำสั่ง คลิกเลือกบล็อกคำสั่งด้านบนเพื่อสร้างอัลกอริทึม
                </div>
              ) : (
                program.map((block, idx) => (
                  <div
                    key={block.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
                      activeBlockIndex === idx
                        ? 'bg-amber-400 text-slate-950 scale-105 shadow-md'
                        : block.type === 'FORWARD'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : block.type === 'REPEAT_3'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] opacity-70">#{idx + 1}</span>
                      <span>{block.label}</span>
                    </div>
                    {!isRunning && (
                      <button
                        onClick={() => removeBlock(idx)}
                        className="opacity-70 hover:opacity-100 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Execution Controls */}
          <div className="flex items-center gap-2">
            {!levelPassed ? (
              <>
                <button
                  id="maze-run-btn"
                  disabled={isRunning || program.length === 0}
                  onClick={handleRunProgram}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>{isRunning ? 'กำลังทำงาน...' : 'สั่งรันโปรแกรม'}</span>
                </button>
                <button
                  disabled={isRunning}
                  onClick={resetRobot}
                  title="รีเซ็ตตำแหน่งเริ่มต้น"
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                id="maze-next-btn"
                onClick={handleNextLevel}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:scale-105"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{currentLevelIdx < LEVELS.length - 1 ? 'ผ่านด่าน! ไปด่านถัดไป →' : 'ผ่านครบทุกด่าน! รับ XP รวม'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
