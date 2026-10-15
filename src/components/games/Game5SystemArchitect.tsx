/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Cpu,
  HardDrive,
  Monitor,
  Keyboard,
  Wifi,
  Globe,
  Server,
  Router,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  Sparkles,
  Send,
  Radio
} from 'lucide-react';

interface Game5SystemArchitectProps {
  onComplete: (score: number, maxScore: number, xpEarned: number) => void;
}

interface HardwareItem {
  id: string;
  name: string;
  icon: any;
  category: 'INPUT' | 'PROCESSING' | 'STORAGE' | 'OUTPUT';
  desc: string;
}

const HARDWARE_ITEMS: HardwareItem[] = [
  { id: 'h1', name: 'คีย์บอร์ด & เมาส์', icon: Keyboard, category: 'INPUT', desc: 'รับข้อมูลจากผู้ใช้เข้าสู่คอมพิวเตอร์' },
  { id: 'h2', name: 'CPU (หน่วยประมวลผลกลาง)', icon: Cpu, category: 'PROCESSING', desc: 'สมองของคอมพิวเตอร์ คำนวณตรรกะและประมวลผล' },
  { id: 'h3', name: 'SSD / Harddisk / RAM', icon: HardDrive, category: 'STORAGE', desc: 'จัดเก็บข้อมูลถาวรและหน่วยความจำชั่วคราว' },
  { id: 'h4', name: 'จอภาพ (Monitor)', icon: Monitor, category: 'OUTPUT', desc: 'แสดงผลลัพธ์ภาพและข้อมูลให้ผู้ใช้มองเห็น' },
];

export const Game5SystemArchitect: React.FC<Game5SystemArchitectProps> = ({ onComplete }) => {
  const [activeTab, setActiveTab] = useState<'hardware' | 'network'>('hardware');

  // Hardware classification state
  const [placedItems, setPlacedItems] = useState<{ [itemId: string]: string }>({});
  const [hardwareScore, setHardwareScore] = useState(0);
  const [hardwareDone, setHardwareDone] = useState(false);

  // Network ping simulator state
  const [targetHost, setTargetHost] = useState('school-cloud.ac.th');
  const [pingPackets, setPingPackets] = useState<{ seq: number; time: number; status: 'SUCCESS' }[]>([]);
  const [isPinging, setIsPinging] = useState(false);
  const [networkDone, setNetworkDone] = useState(false);

  const handlePlaceItem = (itemId: string, selectedCategory: string) => {
    const item = HARDWARE_ITEMS.find((h) => h.id === itemId);
    if (!item) return;

    setPlacedItems((prev) => ({ ...prev, [itemId]: selectedCategory }));

    // Check when all 4 are placed
    const updated = { ...placedItems, [itemId]: selectedCategory };
    if (Object.keys(updated).length === HARDWARE_ITEMS.length) {
      let correct = 0;
      HARDWARE_ITEMS.forEach((h) => {
        if (updated[h.id] === h.category) correct++;
      });
      setHardwareScore(correct);
      setHardwareDone(true);
      if (correct === 4) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      }
    }
  };

  const handleSimulatePing = async () => {
    if (isPinging) return;
    setIsPinging(true);
    setPingPackets([]);

    for (let i = 1; i <= 4; i++) {
      await new Promise((r) => setTimeout(r, 400));
      const pingMs = Math.floor(12 + Math.random() * 15);
      setPingPackets((prev) => [...prev, { seq: i, time: pingMs, status: 'SUCCESS' }]);
    }

    setIsPinging(false);
    setNetworkDone(true);
    confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
  };

  const handleFinish = () => {
    const totalScore = (hardwareScore >= 3 ? 1 : 0) + (networkDone ? 1 : 0);
    const xp = totalScore * 50 + 60;
    onComplete(totalScore, 2, xp);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 max-w-3xl mx-auto shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white font-['Chakra_Petch']">
              มินิเกม: สถาปนิกคอมพิวเตอร์และเครือข่าย (System & Network)
            </h3>
            <p className="text-xs text-slate-400">
              เรียนรู้องค์ประกอบฮาร์ดแวร์พื้นฐานและการสื่อสารข้อมูลเครือข่าย
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('hardware')}
          className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'hardware'
              ? 'bg-purple-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>ส่วนที่ 1: วงจรคอมพิวเตอร์ (Hardware)</span>
          {hardwareDone && <CheckCircle2 className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => setActiveTab('network')}
          className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'network'
              ? 'bg-purple-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wifi className="w-4 h-4" />
          <span>ส่วนที่ 2: จำลองเครือข่าย (Network Ping)</span>
          {networkDone && <CheckCircle2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Tab 1: Hardware Classification */}
      {activeTab === 'hardware' && (
        <div className="mt-6 space-y-6">
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
            💡 <strong>ภารกิจ:</strong> จับคู่อุปกรณ์คอมพิวเตอร์กับหน้าที่ 4 หน่วยพื้นฐาน: รับเข้า (Input), ประมวลผล (Processing), จัดเก็บ (Storage), และส่งออก (Output)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {HARDWARE_ITEMS.map((item) => {
              const Icon = item.icon;
              const currentChoice = placedItems[item.id];
              const isCorrect = currentChoice === item.category;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    hardwareDone
                      ? isCorrect
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-200'
                        : 'bg-rose-500/15 border-rose-500 text-rose-200'
                      : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{item.name}</div>
                      <div className="text-[11px] text-slate-400">{item.desc}</div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-[11px] text-slate-400 mb-1">เลือกประเภทหน่วย:</label>
                    <select
                      disabled={hardwareDone}
                      value={currentChoice || ''}
                      onChange={(e) => handlePlaceItem(item.id, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
                    >
                      <option value="">-- กรุณาเลือกหน่วย --</option>
                      <option value="INPUT">1. หน่วยรับเข้า (Input Unit)</option>
                      <option value="PROCESSING">2. หน่วยประมวลผลกลาง (CPU)</option>
                      <option value="STORAGE">3. หน่วยความจำ / จัดเก็บ (Storage)</option>
                      <option value="OUTPUT">4. หน่วยส่งออก (Output Unit)</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          {hardwareDone && (
            <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>จำแนกถูกต้อง {hardwareScore} / 4 ชิ้นส่วน!</span>
              </div>
              <button
                onClick={() => setActiveTab('network')}
                className="px-4 py-1.5 bg-purple-500 text-slate-950 font-bold rounded-lg text-xs"
              >
                ไปส่วนที่ 2: เครือข่าย →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Network Topology & Ping Simulator */}
      {activeTab === 'network' && (
        <div className="mt-6 space-y-6">
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
            💡 <strong>ภารกิจ:</strong> สังเกตการส่งแพ็กเก็ตข้อมูลจากเครื่องนักเรียน ผ่านเราเตอร์ ไปยังเซิร์ฟเวอร์โรงเรียน
          </div>

          {/* Network Diagram */}
          <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between relative overflow-hidden">
            {/* Step 1: Client PC */}
            <div className="flex flex-col items-center z-10">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Monitor className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-white mt-1.5">เครื่องนักเรียน</span>
              <span className="text-[10px] text-slate-400">192.168.1.50</span>
            </div>

            {/* Cable 1 */}
            <div className="flex-1 h-0.5 bg-slate-700 relative mx-2">
              {isPinging && (
                <div className="w-3 h-3 rounded-full bg-amber-400 absolute -top-1 animate-ping" />
              )}
            </div>

            {/* Step 2: Router */}
            <div className="flex flex-col items-center z-10">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Router className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-white mt-1.5">Wi-Fi Router</span>
              <span className="text-[10px] text-slate-400">Gateway 192.168.1.1</span>
            </div>

            {/* Cable 2 */}
            <div className="flex-1 h-0.5 bg-slate-700 relative mx-2" />

            {/* Step 3: School Cloud Server */}
            <div className="flex flex-col items-center z-10">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Server className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-white mt-1.5">Cloud Server</span>
              <span className="text-[10px] text-slate-400">203.150.12.8</span>
            </div>
          </div>

          {/* Ping Controls */}
          <div className="flex gap-2">
            <input
              type="text"
              value={targetHost}
              onChange={(e) => setTargetHost(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-400"
            />
            <button
              disabled={isPinging}
              onClick={handleSimulatePing}
              className="px-5 py-2.5 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow hover:scale-105 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isPinging ? 'กำลังส่งข้อมูล...' : 'ส่งแพ็กเก็ตทดสอบ (Ping)'}</span>
            </button>
          </div>

          {/* Ping Results Output */}
          {pingPackets.length > 0 && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs space-y-1">
              <div className="text-slate-400">PING {targetHost} (64 bytes of data):</div>
              {pingPackets.map((pkt) => (
                <div key={pkt.seq} className="text-emerald-400">
                  64 bytes from {targetHost}: icmp_seq={pkt.seq} ttl=58 time={pkt.time} ms (สถานะปกติ)
                </div>
              ))}
              {networkDone && (
                <div className="text-amber-300 font-bold pt-1">
                  --- สถิติการสื่อสาร: 4 packets transmitted, 4 received, 0% packet loss ---
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Completion */}
      {(hardwareDone || networkDone) && (
        <div className="mt-8 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={handleFinish}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md hover:scale-105 flex items-center gap-2"
          >
            <Award className="w-4 h-4" />
            <span>รับคะแนนและ XP สถาปนิกคอมพิวเตอร์</span>
          </button>
        </div>
      )}
    </div>
  );
};
