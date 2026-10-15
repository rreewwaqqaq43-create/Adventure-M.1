/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Camera,
  Hand,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
  EyeOff,
  Video,
  VideoOff,
  Layers,
  ArrowRight,
  ShieldAlert,
  Info,
  MousePointer,
  HelpCircle,
  Volume2,
  VolumeX,
  Flame,
  Zap,
  Target,
  Crosshair,
  Sliders,
  Scan
} from 'lucide-react';
import { sfx } from '../../utils/audioEffects';
import { StorageService } from '../../services/storage';

interface Game1ARHandTrackingProps {
  onComplete: (score: number, maxScore: number, xpEarned: number) => void;
}

interface AbstractionItem {
  id: string;
  name: string;
  isEssential: boolean;
  category: string;
  icon: string;
  reason: string;
}

interface RoundData {
  id: number;
  missionTitle: string;
  situation: string;
  targetGoal: string;
  items: AbstractionItem[];
}

const ROUNDS: RoundData[] = [
  {
    id: 1,
    missionTitle: 'ภารกิจที่ 1: แผนที่ระบบรถไฟฟ้า (Transit Map Abstraction)',
    situation: 'ต้องการออกแบบแผนที่เส้นทางรถไฟฟ้าเพื่อให้ผู้โดยสารเดินทางได้สะดวกและรวดเร็วที่สุด',
    targetGoal: 'ใช้มือ AR หรือคลิกคัดแยกเฉพาะข้อมูลที่ "จำเป็นต่อการเดินทาง" เข้าสู่ระบบ',
    items: [
      { id: 'item-1', name: 'ชื่อสถานีรถไฟฟ้า', isEssential: true, category: 'การเดินทาง', icon: '🚉', reason: 'จำเป็นอย่างยิ่งเพื่อให้ผู้โดยสารทราบตำแหน่งขึ้น-ลง' },
      { id: 'item-2', name: 'จุดเชื่อมต่อสาย (Interchange)', isEssential: true, category: 'การเดินทาง', icon: '🔄', reason: 'จำเป็นในการเปลี่ยนขบวนรถเพื่อไปยังจุดหมาย' },
      { id: 'item-3', name: 'สีหลังคาบ้านประชาชน', isEssential: false, category: 'สิ่งแวดล้อม', icon: '🏠', reason: 'เป็นรายละเอียดปลีกย่อย ไม่จำเป็นต่อการขึ้นรถไฟฟ้า' },
      { id: 'item-4', name: 'ต้นไม้ริมทางรถไฟ', isEssential: false, category: 'สิ่งแวดล้อม', icon: '🌳', reason: 'ทำให้แผนที่รกและสับสน ละทิ้งได้ตามหลัก Abstraction' },
      { id: 'item-5', name: 'ทิศทางและลำดับสถานี', isEssential: true, category: 'การเดินทาง', icon: '➡️', reason: 'จำเป็นเพื่อรู้ว่ารถวิ่งไปทิศทางใด' },
      { id: 'item-6', name: 'จำนวนเสาไฟฟ้าริมราง', isEssential: false, category: 'สิ่งแวดล้อม', icon: '💡', reason: 'ไม่มีผลต่อการตัดสินใจเดินทาง' },
    ],
  },
  {
    id: 2,
    missionTitle: 'ภารกิจที่ 2: ระบบทะเบียนประวัตินักเรียน (Student Profile)',
    situation: 'ต้องการพัฒนาแบบฟอร์มบันทึกข้อมูลนักเรียนเพื่อการรายงานผลการเรียนของโรงเรียน',
    targetGoal: 'คัดกรองข้อมูลสำคัญทางทะเบียนนักเรียน ละทิ้งข้อมูลที่ไม่เกี่ยวข้อง',
    items: [
      { id: 'item-7', name: 'เลขประจำตัวนักเรียน', isEssential: true, category: 'ข้อมูลหลัก', icon: '🆔', reason: 'ใช้เป็นรหัสอ้างอิงเอกลักษณ์เฉพาะบุคคล (Primary Key)' },
      { id: 'item-8', name: 'ชื่อ-นามสกุล', isEssential: true, category: 'ข้อมูลหลัก', icon: '👤', reason: 'จำเป็นต่อการระบุตัวตนและออกเอกสารผลการเรียน' },
      { id: 'item-9', name: 'สีเคสโทรศัพท์ที่ชอบ', isEssential: false, category: 'ความชอบส่วนตัว', icon: '📱', reason: 'เป็นรสนิยมส่วนบุคคล ไม่เกี่ยวข้องกับการบันทึกผลการเรียน' },
      { id: 'item-10', name: 'ระดับชั้นและห้องเรียน', isEssential: true, category: 'ข้อมูลหลัก', icon: '🏫', reason: 'จำเป็นในการจัดกลุ่มและออกเกรดเฉลี่ย' },
      { id: 'item-11', name: 'ยี่ห้อรองเท้าที่ใส่มาเรียน', isEssential: false, category: 'ของใช้ส่วนตัว', icon: '👟', reason: 'ไม่มีความจำเป็นต่อการจัดการข้อมูลทางวิชาการ' },
      { id: 'item-12', name: 'แนวเพลงที่ชอบฟัง', isEssential: false, category: 'ความชอบส่วนตัว', icon: '🎵', reason: 'รายละเอียดปลีกย่อยที่ต้องละทิ้งในการตัดเกรด' },
    ],
  },
];

export const Game1ARHandTracking: React.FC<Game1ARHandTrackingProps> = ({ onComplete }) => {
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [allowSimulationFallback, setAllowSimulationFallback] = useState(false);
  
  // Marker & Color Tracking Mode: 'hand' (AR Hand Tracking - ค่าเริ่มต้น), 'red' (Marker แดง), 'green', 'blue', 'yellow', 'custom'
  const [trackMode, setTrackMode] = useState<'hand' | 'red' | 'green' | 'blue' | 'yellow' | 'custom'>('hand');
  const [customColor, setCustomColor] = useState<{ r: number; g: number; b: number }>({ r: 220, g: 30, b: 30 });
  
  // AR Hand/Marker position (0 to 100 percentages)
  const [handPos, setHandPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const rawTargetPos = useRef<{ x: number; y: number }>({ x: 50, y: 50 });
  const smoothedPos = useRef<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [isFingerTracked, setIsFingerTracked] = useState(false);
  const [trackingConfidence, setTrackingConfidence] = useState(0);
  const [markerPixelCount, setMarkerPixelCount] = useState(0);
  const [sensitivity, setSensitivity] = useState<'normal' | 'high' | 'ultra'>('high');
  const [stabilityMode, setStabilityMode] = useState<'smooth' | 'ultra_steady'>('ultra_steady');
  const [showVisionMonitor, setShowVisionMonitor] = useState(true);
  const [hoverTarget, setHoverTarget] = useState<string | null>(null);
  const [hoverProgress, setHoverProgress] = useState(0);
  const [hoverActionText, setHoverActionText] = useState<string>('');
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Classification results
  const [classified, setClassified] = useState<{ [itemId: string]: 'essential' | 'non_essential' }>({});
  const [score, setScore] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [floatingPopup, setFloatingPopup] = useState<string | null>(null);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [isMuted, setIsMuted] = useState(sfx.isMuted);
  const [feedback, setFeedback] = useState<{ message: string; isCorrect: boolean } | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const monitorCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevFrameData = useRef<Uint8Array | null>(null);

  const [rounds] = useState<RoundData[]>(() => {
    const custom = StorageService.games.getGame1Rounds();
    return custom && custom.length > 0 ? custom : ROUNDS;
  });
  const currentRound = rounds[currentRoundIdx] || rounds[0] || ROUNDS[0];
  const remainingItems = currentRound.items.filter((item) => !classified[item.id]);

  // Start Camera (Real Camera Stream)
  const startCamera = async () => {
    try {
      setIsCameraLoading(true);
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (e) {
          console.warn('Video play error:', e);
        }
      }
      setIsCameraActive(true);
      setIsHandDetected(true);
      setIsCameraLoading(false);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('ไม่สามารถเข้าถึงกล้องเว็บแคมได้ กรุณาอนุญาตสิทธิ์เข้าถึงกล้องในเบราว์เซอร์เพื่อเล่นเกมด้วยกล้องจริง');
      setIsCameraActive(false);
      setIsCameraLoading(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Auto request camera on component mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Real-time Optical Color & Marker Tracking Engine (Red, Green, Blue, Yellow, Custom Marker & Skin)
  useEffect(() => {
    if (!isCameraActive) return;

    let animId: number;
    let lastTime = 0;
    const FRAME_INTERVAL = 28; // ~35 FPS for silky-smooth marker tracking
    let prevFrame: Uint8Array | null = null;

    const trackMarker = (timestamp: number) => {
      if (timestamp - lastTime > FRAME_INTERVAL) {
        lastTime = timestamp;
        const video = videoRef.current;
        const processCanvas = canvasRef.current;
        const monitorCanvas = monitorCanvasRef.current;

        if (video && processCanvas && video.readyState >= 2) {
          const pw = processCanvas.width;
          const ph = processCanvas.height;
          const ctx = processCanvas.getContext('2d', { willReadFrequently: true });

          if (ctx) {
            ctx.drawImage(video, 0, 0, pw, ph);
            const frame = ctx.getImageData(0, 0, pw, ph);
            const data = frame.data;

            let matchPixelCount = 0;
            let sumX = 0;
            let sumY = 0;
            let minX = pw;
            let maxX = 0;
            let minY = ph;
            let maxY = 0;
            let peakX = -1;
            let peakY = ph;

            // Step 1: Scan Pixels based on active Marker / Color Track Mode
            for (let y = 3; y < ph - 3; y += 2) {
              for (let x = 3; x < pw - 3; x += 2) {
                const idx = (y * pw + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];

                let isMatch = false;

                if (trackMode === 'red') {
                  // High-saturation RED object / paper / marker filter (ignores face and skin)
                  isMatch =
                    r > 80 &&
                    r > g * 1.4 &&
                    r > b * 1.4 &&
                    (r - Math.max(g, b)) > 26;
                } else if (trackMode === 'green') {
                  // GREEN marker filter
                  isMatch =
                    g > 75 &&
                    g > r * 1.3 &&
                    g > b * 1.3 &&
                    (g - Math.max(r, b)) > 22;
                } else if (trackMode === 'blue') {
                  // BLUE marker filter
                  isMatch =
                    b > 75 &&
                    b > r * 1.3 &&
                    b > g * 1.3 &&
                    (b - Math.max(r, g)) > 22;
                } else if (trackMode === 'yellow') {
                  // YELLOW / Orange marker filter
                  isMatch =
                    r > 115 &&
                    g > 95 &&
                    b < 85 &&
                    (r + g) > 2.2 * b;
                } else if (trackMode === 'custom') {
                  // Custom sampled color via Eyedropper
                  const colorDiff = Math.hypot(r - customColor.r, g - customColor.g, b - customColor.b);
                  isMatch = colorDiff < (sensitivity === 'ultra' ? 65 : sensitivity === 'high' ? 52 : 40);
                } else {
                  // Hand/Skin mode (Adaptive YCbCr + RGB chrominance test)
                  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
                  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

                  // Exclude upper-middle central face zone (28% to 72% width, top 48% height) to prevent locking on face/forehead
                  const isFaceZone = x >= pw * 0.28 && x <= pw * 0.72 && y <= ph * 0.48;

                  isMatch =
                    !isFaceZone &&
                    r > 42 &&
                    g > 24 &&
                    b > 14 &&
                    r > g &&
                    (r - g) >= 6 &&
                    lum >= (sensitivity === 'ultra' ? 18 : 26) &&
                    cb >= 68 &&
                    cb <= 145 &&
                    cr >= 122 &&
                    cr <= 186;
                }

                if (isMatch) {
                  matchPixelCount++;
                  sumX += x;
                  sumY += y;

                  if (x < minX) minX = x;
                  if (x > maxX) maxX = x;
                  if (y < minY) minY = y;
                  if (y > maxY) maxY = y;

                  // Topmost apex pixel for precise aiming (prioritize finger tip)
                  if (y < peakY) {
                    peakY = y;
                    peakX = x;
                  }
                }
              }
            }

            setMarkerPixelCount(matchPixelCount);

            // Minimum pixel threshold to avoid random optical noise
            const minRequiredPixels = trackMode === 'hand' ? 18 : 10;

            if (matchPixelCount >= minRequiredPixels && peakX !== -1) {
              const centroidX = sumX / matchPixelCount;
              const centroidY = sumY / matchPixelCount;

              // For Hand Tracking, apex is the index fingertip!
              const pointX = trackMode === 'hand' ? peakX * 0.7 + centroidX * 0.3 : centroidX * 0.45 + peakX * 0.55;
              const pointY = trackMode === 'hand' ? peakY * 0.9 + centroidY * 0.1 : peakY * 0.85 + centroidY * 0.15;

              // Mirror X because selfie video is mirrored
              const targetX = Math.max(4, Math.min(96, ((pw - pointX) / pw) * 100));
              const targetY = Math.max(5, Math.min(95, (pointY / ph) * 100));

              rawTargetPos.current = { x: targetX, y: targetY };

              const curX = smoothedPos.current.x;
              const curY = smoothedPos.current.y;
              const deltaX = targetX - curX;
              const deltaY = targetY - curY;
              const dist = Math.hypot(deltaX, deltaY);

              // Multi-Tier Deadband Filter for Rock-Solid Stability
              const deadbandThreshold = stabilityMode === 'ultra_steady' ? 1.6 : 0.9;

              if (dist > deadbandThreshold) {
                // Smooth interpolation factor
                const lerpFactor = dist > 14 ? 0.6 : dist > 6 ? 0.38 : 0.24;
                const nextX = curX + deltaX * lerpFactor;
                const nextY = curY + deltaY * lerpFactor;

                smoothedPos.current = { x: nextX, y: nextY };
                setHandPos({ x: Number(nextX.toFixed(2)), y: Number(nextY.toFixed(2)) });
              }

              setIsHandDetected(true);
              setIsFingerTracked(true);
              const conf = Math.min(100, Math.max(50, Math.round((matchPixelCount / 90) * 100)));
              setTrackingConfidence(conf);

              // Render PIP Vision Monitor with Marker Bounding Box & HUD
              if (monitorCanvas) {
                const mCtx = monitorCanvas.getContext('2d');
                if (mCtx) {
                  const mw = monitorCanvas.width;
                  const mh = monitorCanvas.height;
                  mCtx.clearRect(0, 0, mw, mh);

                  // Draw mirrored video frame
                  mCtx.save();
                  mCtx.scale(-1, 1);
                  mCtx.drawImage(video, -mw, 0, mw, mh);
                  mCtx.restore();

                  // Convert bounding box to mirrored monitor coordinates
                  const scaleX = mw / pw;
                  const scaleY = mh / ph;
                  const boxLeft = (pw - maxX) * scaleX;
                  const boxTop = minY * scaleY;
                  const boxWidth = (maxX - minX) * scaleX;
                  const boxHeight = (maxY - minY) * scaleY;

                  // Theme color for HUD
                  const markerColorHex =
                    trackMode === 'red'
                      ? '#ef4444'
                      : trackMode === 'green'
                      ? '#10b981'
                      : trackMode === 'blue'
                      ? '#3b82f6'
                      : trackMode === 'yellow'
                      ? '#eab308'
                      : trackMode === 'custom'
                      ? `rgb(${customColor.r}, ${customColor.g}, ${customColor.b})`
                      : '#38bdf8';

                  // 1. Draw Bounding Box around detected object
                  mCtx.strokeStyle = markerColorHex;
                  mCtx.lineWidth = 2;
                  mCtx.strokeRect(boxLeft, boxTop, boxWidth, boxHeight);

                  // 2. Corner Bracket Accents
                  const bLen = Math.min(10, Math.min(boxWidth, boxHeight) / 3);
                  mCtx.lineWidth = 3;
                  mCtx.beginPath();
                  // Top-Left
                  mCtx.moveTo(boxLeft, boxTop + bLen);
                  mCtx.lineTo(boxLeft, boxTop);
                  mCtx.lineTo(boxLeft + bLen, boxTop);
                  // Top-Right
                  mCtx.moveTo(boxLeft + boxWidth - bLen, boxTop);
                  mCtx.lineTo(boxLeft + boxWidth, boxTop);
                  mCtx.lineTo(boxLeft + boxWidth, boxTop + bLen);
                  mCtx.stroke();

                  // 3. Stabilized Laser Crosshair Point
                  const monX = (smoothedPos.current.x / 100) * mw;
                  const monY = (smoothedPos.current.y / 100) * mh;

                  mCtx.strokeStyle = markerColorHex;
                  mCtx.lineWidth = 2.5;
                  mCtx.beginPath();
                  mCtx.arc(monX, monY, 11, 0, Math.PI * 2);
                  mCtx.stroke();

                  // Laser Beam
                  mCtx.strokeStyle = `${markerColorHex}88`;
                  mCtx.lineWidth = 1.5;
                  mCtx.beginPath();
                  mCtx.moveTo(monX, mh);
                  mCtx.lineTo(monX, monY);
                  mCtx.stroke();

                  // Center Laser Core
                  mCtx.fillStyle = '#ffffff';
                  mCtx.beginPath();
                  mCtx.arc(monX, monY, 3, 0, Math.PI * 2);
                  mCtx.fill();

                  // HUD Label Text
                  mCtx.fillStyle = markerColorHex;
                  mCtx.font = 'bold 9px monospace';
                  const labelTitle =
                    trackMode === 'red'
                      ? '🔴 RED MARKER'
                      : trackMode === 'green'
                      ? '🟢 GREEN MARKER'
                      : trackMode === 'blue'
                      ? '🔵 BLUE MARKER'
                      : trackMode === 'yellow'
                      ? '🟡 YELLOW MARKER'
                      : trackMode === 'custom'
                      ? '🎯 CUSTOM COLOR'
                      : '✋ HAND TRACK';
                  mCtx.fillText(`${labelTitle} [${matchPixelCount}px]`, Math.max(4, boxLeft), Math.max(12, boxTop - 4));
                }
              }
            } else {
              setIsFingerTracked(false);
              setTrackingConfidence(0);

              // Clear monitor overlay if no marker
              if (monitorCanvas) {
                const mCtx = monitorCanvas.getContext('2d');
                if (mCtx) {
                  const mw = monitorCanvas.width;
                  const mh = monitorCanvas.height;
                  mCtx.save();
                  mCtx.scale(-1, 1);
                  mCtx.drawImage(video, -mw, 0, mw, mh);
                  mCtx.restore();

                  mCtx.fillStyle = '#ef4444';
                  mCtx.font = 'bold 9px monospace';
                  mCtx.fillText('⚠️ ค้นหาวัตถุสี...', 10, 20);
                }
              }
            }
          }
        }
      }
      animId = requestAnimationFrame(trackMarker);
    };

    animId = requestAnimationFrame(trackMarker);
    return () => cancelAnimationFrame(animId);
  }, [isCameraActive, trackMode, customColor, sensitivity, stabilityMode]);

  // Automated Hands-Free Hover / Dwell Selection using Fingertip Position
  useEffect(() => {
    if (!isCameraActive || isFinished) return;

    const dwellInterval = setInterval(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const px = rect.left + (handPos.x / 100) * rect.width;
      const py = rect.top + (handPos.y / 100) * rect.height;

      const targetElement = document.elementFromPoint(px, py);

      // Case 1: Hovering over an item card to SELECT it
      const itemElem = targetElement?.closest('[data-item-card-id]') as HTMLElement | null;
      const itemId = itemElem?.getAttribute('data-item-card-id');

      if (itemId && !selectedItemId) {
        const targetItem = currentRound.items.find((i) => i.id === itemId);
        if (targetItem && !classified[targetItem.id]) {
          setHoverTarget(itemId);
          setHoverActionText(`ชี้ค้างเลือก: ${targetItem.name}`);
          setHoverProgress((prev) => {
            if (prev >= 100) {
              handleItemSelect(targetItem);
              return 0;
            }
            return prev + 22;
          });
          return;
        }
      }

      // Case 2: Item is already selected, hovering over classification zones
      if (selectedItemId) {
        const isEssentialZone =
          Boolean(targetElement?.closest('[data-zone="essential"]')) || handPos.x <= 30;
        const isNonEssentialZone =
          Boolean(targetElement?.closest('[data-zone="non_essential"]')) || handPos.x >= 70;

        if (isEssentialZone) {
          setHoverTarget('essential');
          setHoverActionText('ชี้ค้างส่งเข้า "สิ่งจำเป็น"');
          setHoverProgress((prev) => {
            if (prev >= 100) {
              handleClassify('essential');
              return 0;
            }
            return prev + 25;
          });
          return;
        }

        if (isNonEssentialZone) {
          setHoverTarget('non_essential');
          setHoverActionText('ชี้ค้างส่งเข้า "รายละเอียดปลีกย่อย"');
          setHoverProgress((prev) => {
            if (prev >= 100) {
              handleClassify('non_essential');
              return 0;
            }
            return prev + 25;
          });
          return;
        }
      }

      // If finger moved away, decay dwell smoothly
      setHoverProgress((prev) => (prev > 0 ? Math.max(0, prev - 25) : 0));
      if (hoverProgress <= 0) {
        setHoverTarget(null);
        setHoverActionText('');
      }
    }, 60);

    return () => clearInterval(dwellInterval);
  }, [isCameraActive, handPos, selectedItemId, classified, currentRound, isFinished, hoverProgress]);

  // Handle pointer / mouse / touch move fallback
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
    setHandPos({ x, y });
    setIsHandDetected(true);
  };

  // Handle Item Select
  const handleItemSelect = (item: AbstractionItem) => {
    setSelectedItemId(item.id);
    setIsGrabbing(true);
    sfx.playLock();
  };

  // Classify item (by ID or currently selected)
  const handleClassify = (target: 'essential' | 'non_essential', specificItemId?: string) => {
    const targetId = specificItemId || selectedItemId;
    if (!targetId) return;

    const item = currentRound.items.find((i) => i.id === targetId);
    if (!item) return;

    const isCorrect = (target === 'essential' && item.isEssential) || (target === 'non_essential' && !item.isEssential);

    if (isCorrect) {
      const nextCombo = comboStreak + 1;
      setComboStreak(nextCombo);
      const earned = 15 + nextCombo * 5;
      setScore((prev) => prev + earned);

      if (nextCombo >= 2) {
        sfx.playCombo(nextCombo);
        setFloatingPopup(`+${earned} XP 🔥 COMBO x${nextCombo}!`);
      } else {
        sfx.playCorrect();
        setFloatingPopup(`+${earned} XP ถูกต้อง!`);
      }

      setFeedback({
        message: `ถูกต้อง! "${item.name}" คือ ${item.isEssential ? 'สิ่งจำเป็น' : 'รายละเอียดที่ไม่จำเป็น'} (${item.reason})`,
        isCorrect: true,
      });
    } else {
      setComboStreak(0);
      sfx.playError();
      setIsScreenShaking(true);
      setTimeout(() => setIsScreenShaking(false), 400);
      setFloatingPopup('❌ ข้อมูลไม่ตรงหมวด');
      setFeedback({
        message: `ยังไม่ถูกต้อง: "${item.name}" แท้จริงแล้วคือ ${item.isEssential ? 'สิ่งจำเป็น' : 'รายละเอียดที่ไม่จำเป็น'} (${item.reason})`,
        isCorrect: false,
      });
    }

    setTimeout(() => setFloatingPopup(null), 1200);
    setClassified((prev) => ({ ...prev, [item.id]: target }));
    setSelectedItemId(null);
    setIsGrabbing(false);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedItemId) {
        if (e.key === 'ArrowLeft' || e.key === '1') {
          handleClassify('essential');
        } else if (e.key === 'ArrowRight' || e.key === '2') {
          handleClassify('non_essential');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, currentRound]);

  const handleNextRound = () => {
    if (currentRoundIdx < rounds.length - 1) {
      setCurrentRoundIdx((prev) => prev + 1);
      setClassified({});
      setSelectedItemId(null);
      setFeedback(null);
    } else {
      setIsFinished(true);
      sfx.playVictory();
      const totalScore = Math.min(100, Math.round((score / 90) * 100));
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      onComplete(totalScore, 100, 250);
    }
  };

  const handleRestart = () => {
    setCurrentRoundIdx(0);
    setClassified({});
    setSelectedItemId(null);
    setScore(0);
    setComboStreak(0);
    setFeedback(null);
    setIsFinished(false);
  };

  const selectedItem = currentRound.items.find((i) => i.id === selectedItemId);

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 text-slate-100 max-w-4xl mx-auto shadow-2xl transition-transform ${isScreenShaking ? 'scale-[0.99] translate-x-1 ring-2 ring-rose-500/50' : ''}`}>
      {/* Hidden processing canvas for webcam vision */}
      <canvas ref={canvasRef} width={160} height={120} className="hidden" />

      {/* Floating score / combo popup */}
      {floatingPopup && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none px-4 py-2 rounded-2xl bg-slate-950/90 border border-amber-400 text-amber-300 font-bold text-sm sm:text-base shadow-2xl animate-bounce backdrop-blur-md">
          {floatingPopup}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Hand className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white font-['Chakra_Petch'] flex items-center gap-2">
              <span>AR Hand Tracking: คัดแยกสิ่งสำคัญ (Abstraction)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ม.1 บทที่ 1
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              ควบคุมด้วยกล้อง AR จับการเคลื่อนไหวมือ หรือใช้เมาส์/สัมผัส/คลิกเลือกได้ 100%
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {comboStreak >= 2 && (
            <div className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center gap-1 animate-pulse shadow-lg shadow-amber-500/10">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>x{comboStreak} STREAK!</span>
            </div>
          )}

          {/* Marker & Color Tracking Mode Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
            <span className="text-slate-400 pl-1.5 flex items-center gap-1">
              <Crosshair className="w-3 h-3 text-rose-400" />
              <span className="hidden sm:inline">โหมดสี:</span>
            </span>
            <button
              onClick={() => {
                setTrackMode('red');
                sfx.playLock();
              }}
              title="จับวัตถุสีแดง / กระดาษสีแดง / ปากกาแดง (แนะนำ - แม่นยำสูงสุด ไม่หลุด 100%)"
              className={`px-2 py-0.5 rounded-lg font-bold transition-all text-[10px] flex items-center gap-1 ${
                trackMode === 'red'
                  ? 'bg-rose-600 text-white shadow-md ring-1 ring-rose-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🔴</span>
              <span>แดง (แนะนำ)</span>
            </button>
            <button
              onClick={() => {
                setTrackMode('green');
                sfx.playLock();
              }}
              title="จับวัตถุสีเขียว"
              className={`px-2 py-0.5 rounded-lg font-bold transition-all text-[10px] flex items-center gap-1 ${
                trackMode === 'green'
                  ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🟢</span>
              <span>เขียว</span>
            </button>
            <button
              onClick={() => {
                setTrackMode('blue');
                sfx.playLock();
              }}
              title="จับวัตถุสีน้ำเงิน/ฟ้า"
              className={`px-2 py-0.5 rounded-lg font-bold transition-all text-[10px] flex items-center gap-1 ${
                trackMode === 'blue'
                  ? 'bg-sky-600 text-white shadow-md ring-1 ring-sky-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🔵</span>
              <span>น้ำเงิน</span>
            </button>
            <button
              onClick={() => {
                setTrackMode('yellow');
                sfx.playLock();
              }}
              title="จับวัตถุสีเหลือง/ส้ม"
              className={`px-2 py-0.5 rounded-lg font-bold transition-all text-[10px] flex items-center gap-1 ${
                trackMode === 'yellow'
                  ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🟡</span>
              <span>เหลือง</span>
            </button>
            <button
              onClick={() => {
                setTrackMode('hand');
                sfx.playLock();
              }}
              title="จับมือเปล่า (Skin Tracker)"
              className={`px-2 py-0.5 rounded-lg font-bold transition-all text-[10px] flex items-center gap-1 ${
                trackMode === 'hand'
                  ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>✋</span>
              <span>มือเปล่า</span>
            </button>
          </div>

          {/* Anti-Shake Stability Mode Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
            <span className="text-slate-400 pl-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">กันสั่น:</span>
            </span>
            <button
              onClick={() => setStabilityMode('ultra_steady')}
              className={`px-2 py-0.5 rounded-lg font-mono transition-colors text-[10px] ${
                stabilityMode === 'ultra_steady'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              นิ่งสนิท
            </button>
            <button
              onClick={() => setStabilityMode('smooth')}
              className={`px-2 py-0.5 rounded-lg font-mono transition-colors text-[10px] ${
                stabilityMode === 'smooth'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ลื่นไหล
            </button>
          </div>

          {/* Calibration button */}
          {isCameraActive && (
            <button
              onClick={() => {
                setHandPos({ x: 50, y: 50 });
                sfx.playLock();
              }}
              title="ตั้งศูนย์ตำแหน่งกลับมาตรงกลาง"
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">ตั้งศูนย์</span>
            </button>
          )}

          {/* Vision Monitor Toggle */}
          <button
            onClick={() => setShowVisionMonitor((prev) => !prev)}
            title="เปิด/ปิด จอมอนิเตอร์ตรวจจับสี AI"
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              showVisionMonitor
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Scan className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">มอนิเตอร์สี AI</span>
          </button>

          <button
            onClick={() => {
              const muted = sfx.toggleMute();
              setIsMuted(muted);
            }}
            title={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={isCameraActive ? stopCamera : startCamera}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              isCameraActive
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {isCameraActive ? <Video className="w-3.5 h-3.5 text-emerald-400" /> : <Camera className="w-3.5 h-3.5" />}
            <span>{isCameraActive ? 'กล้อง AR เปิดอยู่' : 'เปิดกล้อง AR'}</span>
          </button>

          <div className="text-xs px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400">คะแนน: </span>
            <span className="font-bold text-amber-400 font-['Chakra_Petch']">{score}</span>
          </div>
        </div>
      </div>

      {/* AR Tracking Dynamic Instructional Guide Bar */}
      {isCameraActive && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-950 to-rose-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-md animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="text-xl p-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
              {trackMode === 'hand' ? '✋' : trackMode === 'red' ? '🔴' : trackMode === 'green' ? '🟢' : trackMode === 'blue' ? '🔵' : '🎯'}
            </span>
            <div className="text-xs">
              <span className="font-bold text-white">
                {trackMode === 'hand' ? 'โหมด AR Hand & Finger Tracking: ' : 'โหมด Color / Marker Tracking: '}
              </span>
              <span className="text-slate-300">
                {trackMode === 'hand'
                  ? 'ยกมือและชี้ด้วยนิ้วชี้หน้ากล้องเพื่อเลื่อนเป้าเลเซอร์ หรือสลับเป็นโหมด 🔴 วัตถุสีแดง ที่เมนูด้านบน'
                  : 'นำวัตถุสีที่เลือก (เช่น ฝาขวด, ปากกา, กระดาษสี) มาขยับหน้ากล้องเพื่อเลื่อนเป้าเลเซอร์ได้แม่นยำ 100%'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono shrink-0">
            <span className={`w-2 h-2 rounded-full ${isFingerTracked ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'}`} />
            <span>{isFingerTracked ? `ล็อคเป้าหมาย (${markerPixelCount}px)` : 'กำลังค้นหามือ/วัตถุ...'}</span>
          </div>
        </div>
      )}

      {cameraError && (
        <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{cameraError}</span>
          </div>
          <button
            onClick={() => setAllowSimulationFallback(true)}
            className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 text-[11px] font-semibold whitespace-nowrap"
          >
            ใช้โหมดจำลองเมาส์
          </button>
        </div>
      )}

      {/* CAMERA REQUIRED SETUP SCREEN (If camera not active and not in simulation fallback) */}
      {!isCameraActive && !allowSimulationFallback && !isFinished ? (
        <div className="mt-4 p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-5 shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
            <Hand className="w-8 h-8 animate-bounce" />
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg sm:text-xl font-bold text-white font-['Chakra_Petch']">
              ภารกิจแนวคิดเชิงนามธรรม (Abstraction Mission)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              เลือกเล่นได้ทั้งโหมด <strong>กล้อง AR ตรวจจับนิ้วชี้</strong> หรือ <strong>โหมดคลิกตอบด่วน / ลากการ์ด / แป้นพิมพ์</strong> ได้ทันที
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={startCamera}
              disabled={isCameraLoading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
            >
              {isCameraLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>กำลังเชื่อมต่อกล้อง...</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  <span>📷 เปิดกล้อง AR ตรวจจับนิ้วจริง</span>
                </>
              )}
            </button>

            <button
              onClick={() => setAllowSimulationFallback(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <MousePointer className="w-4 h-4" />
              <span>⚡ เล่นทันที (คลิก / ลากการ์ด / แป้นพิมพ์)</span>
            </button>
          </div>
        </div>
      ) : !isFinished ? (
        <div className="mt-4 space-y-4">
          {/* Situation Banner */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-300">{currentRound.missionTitle}</span>
              <span className="text-slate-400">ด่านที่ {currentRoundIdx + 1} / {rounds.length}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">{currentRound.situation}</p>
            <p className="text-[11px] text-amber-400/90 font-medium">🎯 {currentRound.targetGoal}</p>
          </div>

          {/* AR Stage Container */}
          <div
            ref={containerRef}
            onPointerMove={handlePointerMove}
            className="relative min-h-[380px] sm:min-h-[420px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden select-none touch-none cursor-crosshair shadow-inner"
          >
            {/* Real Webcam Video Stream with High Clarity */}
            {isCameraActive && (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover opacity-80 -scale-x-100 filter contrast-110 brightness-95 pointer-events-none"
                />
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-emerald-500/40 text-[10px] text-emerald-300 font-mono flex items-center gap-1.5 shadow-lg pointer-events-none">
                  <span className={`w-2 h-2 rounded-full ${isFingerTracked ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-pulse'}`} />
                  <span>
                    {isFingerTracked
                      ? `LIVE AR FINGERTIP AI • ตรวจพบนิ้วชี้ (${trackingConfidence}%)`
                      : 'LIVE AR WEBCAM • ยกนิ้วชี้ขึ้นหน้ากล้องเพื่อเล็ง'}
                  </span>
                </div>
              </>
            )}

            {/* Grid & AR Reticle Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] opacity-25 pointer-events-none" />

            {/* Left Zone: Essential Elements (สิ่งจำเป็น) */}
            <div
              data-zone="essential"
              onClick={() => handleClassify('essential')}
              className={`absolute top-4 left-3 sm:left-4 bottom-12 w-28 sm:w-44 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-3 text-center cursor-pointer z-10 ${
                hoverTarget === 'essential'
                  ? 'border-emerald-400 bg-emerald-500/35 ring-4 ring-emerald-400/50 scale-[1.03] shadow-xl shadow-emerald-500/30'
                  : selectedItemId
                  ? 'border-emerald-500 bg-emerald-500/25 scale-[1.02] shadow-lg shadow-emerald-500/20'
                  : 'border-emerald-500/30 bg-emerald-950/30 hover:border-emerald-500/60'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1 text-xl">
                <Eye className="w-5 h-5" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-emerald-400">
                สิ่งจำเป็น
              </span>
              <span className="text-[10px] text-emerald-300/80">
                (Essential)
              </span>
              <span className="text-[9px] text-slate-400 mt-1 hidden sm:inline">
                คัดกรองไว้แก้ปัญหา
              </span>
              <span className="mt-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold shadow">
                ◀ กดส่งที่นี่
              </span>
            </div>

            {/* Right Zone: Non-Essential Details (รายละเอียดปลีกย่อย) */}
            <div
              data-zone="non_essential"
              onClick={() => handleClassify('non_essential')}
              className={`absolute top-4 right-3 sm:right-4 bottom-12 w-28 sm:w-44 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-3 text-center cursor-pointer z-10 ${
                hoverTarget === 'non_essential'
                  ? 'border-rose-400 bg-rose-500/35 ring-4 ring-rose-400/50 scale-[1.03] shadow-xl shadow-rose-500/30'
                  : selectedItemId
                  ? 'border-rose-500 bg-rose-500/25 scale-[1.02] shadow-lg shadow-rose-500/20'
                  : 'border-rose-500/30 bg-rose-950/30 hover:border-rose-500/60'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-1 text-xl">
                <EyeOff className="w-5 h-5" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-rose-400">
                รายละเอียดปลีกย่อย
              </span>
              <span className="text-[10px] text-rose-300/80">
                (Non-Essential)
              </span>
              <span className="text-[9px] text-slate-400 mt-1 hidden sm:inline">
                ละทิ้งเพื่อความกระชับ
              </span>
              <span className="mt-2 text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-slate-950 font-bold shadow">
                กดส่งที่นี่ ▶
              </span>
            </div>

            {/* Center Area: Floating Unclassified Items */}
            <div className="absolute inset-x-32 sm:inset-x-52 top-4 bottom-12 flex flex-col items-center justify-center gap-2 overflow-y-auto p-1.5 z-10">
              {remainingItems.length === 0 ? (
                <div className="text-center py-6 bg-slate-950/90 p-4 rounded-2xl border border-emerald-500/30 shadow-xl backdrop-blur-md">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center text-2xl mb-2">
                    ✓
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-emerald-300">
                    คัดแยกครบทุกรายการแล้ว!
                  </p>
                  <button
                    onClick={handleNextRound}
                    className="mt-3 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 mx-auto shadow-lg"
                  >
                    <span>{currentRoundIdx < rounds.length - 1 ? 'ด่านถัดไป' : 'ดูสรุปคะแนน'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                remainingItems.map((item) => {
                  const isSelected = selectedItemId === item.id;
                  const isHovered = hoverTarget === item.id;
                  return (
                    <div
                      key={item.id}
                      data-item-card-id={item.id}
                      className={`w-full max-w-[240px] p-2 rounded-xl border text-xs flex flex-col gap-1.5 transition-all shadow-md backdrop-blur-md ${
                        isSelected
                          ? 'bg-amber-500/40 border-amber-400 text-white ring-2 ring-amber-400 scale-[1.03] shadow-amber-500/30'
                          : isHovered
                          ? 'bg-cyan-500/40 border-cyan-400 text-cyan-100 ring-2 ring-cyan-400 scale-[1.03] shadow-cyan-500/30'
                          : 'bg-slate-900/90 border-slate-700 text-slate-200'
                      }`}
                    >
                      <div
                        onClick={() => handleItemSelect(item)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{item.icon}</span>
                          <span className="font-semibold text-[11px] sm:text-xs truncate max-w-[130px]">
                            {item.name}
                          </span>
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          isSelected
                            ? 'bg-amber-500/50 text-white font-bold'
                            : isHovered
                            ? 'bg-cyan-500/50 text-white animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {isSelected ? 'เลือกอยู่' : isHovered ? 'กำลังล็อค...' : 'เลือก'}
                        </span>
                      </div>

                      {/* Quick 1-Click action buttons on each card */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClassify('essential', item.id);
                          }}
                          className="px-1.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 hover:text-white border border-emerald-500/40 font-bold text-[10px] flex items-center justify-center gap-1 transition-colors"
                        >
                          <span>◀ จำเป็น</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClassify('non_essential', item.id);
                          }}
                          className="px-1.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-[10px] flex items-center justify-center gap-1 transition-colors"
                        >
                          <span>ปลีกย่อย ▶</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Live Computer Vision Color & Marker Monitor PIP (Toggleable & Interactive Eyedropper) */}
            {isCameraActive && showVisionMonitor && (
              <div className="absolute bottom-12 right-3 z-30 p-2 rounded-2xl bg-slate-950/95 border border-rose-500/40 backdrop-blur-md shadow-2xl flex flex-col items-center max-w-[150px]">
                <div className="flex items-center justify-between w-full pb-1 px-0.5 text-[9px] font-mono text-rose-400">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    COLOR VISION AI
                  </span>
                  <button
                    onClick={() => setShowVisionMonitor(false)}
                    className="text-slate-400 hover:text-white text-xs"
                    title="ปิดจอมอนิเตอร์"
                  >
                    ×
                  </button>
                </div>
                <div className="relative group cursor-crosshair">
                  <canvas
                    ref={monitorCanvasRef}
                    width={130}
                    height={95}
                    onClick={(e) => {
                      // Eyedropper: Click on canvas to sample custom color
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = Math.floor(((e.clientX - rect.left) / rect.width) * 130);
                      const clickY = Math.floor(((e.clientY - rect.top) / rect.height) * 95);
                      const ctx = e.currentTarget.getContext('2d');
                      if (ctx) {
                        const pixel = ctx.getImageData(clickX, clickY, 1, 1).data;
                        setCustomColor({ r: pixel[0], g: pixel[1], b: pixel[2] });
                        setTrackMode('custom');
                        sfx.playLock();
                      }
                    }}
                    title="คลิกที่จุดใดก็ได้บนจอเพื่อดูดสีวัตถุเป้าหมาย (Eyedropper)"
                    className="rounded-lg bg-black border border-slate-800"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 text-[8px] text-center text-slate-300 py-0.5 pointer-events-none">
                    🎯 คลิกเพื่อดูดสีวัตถุ
                  </div>
                </div>
                <div className="text-[9px] text-slate-300 font-mono mt-1 text-center">
                  {isFingerTracked ? (
                    <span className="text-emerald-400 font-bold">✓ ตรวจพบวัตถุสี</span>
                  ) : (
                    <span className="text-rose-400">🔴 นำวัตถุสีแดงมาจ่อ</span>
                  )}
                </div>
              </div>
            )}

            {/* AR Virtual Marker Reticle Cursor with Dwell Ring */}
            <div
              className="absolute pointer-events-none transition-all duration-75 -translate-x-1/2 -translate-y-1/2 z-40"
              style={{ left: `${handPos.x}%`, top: `${handPos.y}%` }}
            >
              <div className="relative flex flex-col items-center">
                {/* Floating Action Text */}
                {hoverActionText && (
                  <div className="mb-1 px-2.5 py-0.5 rounded-full bg-slate-950/95 border border-amber-400 text-amber-300 text-[10px] font-bold font-mono whitespace-nowrap shadow-xl animate-pulse">
                    {hoverActionText}
                  </div>
                )}

                {/* Reticle with circular dwell timer */}
                <div className="relative w-14 h-14 flex items-center justify-center">
                  {/* SVG Dwell Progress Ring */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="28"
                      cy="28"
                      r="22"
                      className="stroke-slate-800/80"
                      strokeWidth="3.5"
                      fill="none"
                    />
                    <circle
                      cx="28"
                      cy="28"
                      r="22"
                      className={hoverTarget ? 'stroke-amber-400 transition-all' : 'stroke-rose-400'}
                      strokeWidth="3.5"
                      fill="none"
                      strokeDasharray={2 * Math.PI * 22}
                      strokeDashoffset={2 * Math.PI * 22 * (1 - hoverProgress / 100)}
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Center Laser Core */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      isGrabbing || hoverTarget
                        ? 'bg-amber-500/40 border-2 border-amber-400 shadow-[0_0_15px_#f59e0b] scale-110'
                        : trackMode === 'red'
                        ? 'bg-rose-500/30 border-2 border-rose-400 shadow-[0_0_12px_#f43f5e]'
                        : trackMode === 'green'
                        ? 'bg-emerald-500/30 border-2 border-emerald-400 shadow-[0_0_12px_#10b981]'
                        : trackMode === 'blue'
                        ? 'bg-sky-500/30 border-2 border-sky-400 shadow-[0_0_12px_#0ea5e9]'
                        : 'bg-amber-500/30 border-2 border-amber-400 shadow-[0_0_12px_#f59e0b]'
                    }`}
                  >
                    <span className="text-base select-none">
                      {trackMode === 'red'
                        ? '🔴'
                        : trackMode === 'green'
                        ? '🟢'
                        : trackMode === 'blue'
                        ? '🔵'
                        : trackMode === 'yellow'
                        ? '🟡'
                        : '🎯'}
                    </span>
                  </div>
                </div>

                <span className="mt-0.5 text-[9px] font-mono text-rose-300 font-bold bg-slate-950/90 px-1.5 py-0.2 rounded border border-rose-500/40 shadow">
                  {isFingerTracked ? 'MARKER LOCKED' : 'AR COLOR POINTER'}
                </span>
              </div>
            </div>

            {/* Footer Prompt */}
            <div className="absolute bottom-2 inset-x-4 bg-slate-950/90 backdrop-blur-sm border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-slate-400 flex items-center justify-between z-20">
              <span>🔴 ขยับวัตถุสีแดงเพื่อเล็ง หรือกดปุ่ม <strong>[◀ จำเป็น]</strong> / <strong>[ปลีกย่อย ▶]</strong> หรือกดแป้น <strong>1 / 2</strong></span>
              <span className="text-amber-400 font-medium">เหลือ {remainingItems.length} รายการ</span>
            </div>
          </div>

          {/* Quick Action Dock for Selected Item (Guaranteed accessible control) */}
          {selectedItem && (
            <div className="p-3 bg-slate-950 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{selectedItem.icon}</span>
                <div>
                  <div className="text-xs font-bold text-white">
                    กำลังจัดหมวดหมู่: <span className="text-amber-300">{selectedItem.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    หมวด: {selectedItem.category}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleClassify('essential')}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all hover:scale-105"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>◀ เป็นสิ่งจำเป็น</span>
                </button>
                <button
                  onClick={() => handleClassify('non_essential')}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all hover:scale-105"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>รายละเอียดปลีกย่อย ▶</span>
                </button>
              </div>
            </div>
          )}

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 animate-fade-in ${
                feedback.isCorrect
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              }`}
            >
              {feedback.isCorrect ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className="leading-relaxed">{feedback.message}</span>
            </div>
          )}
        </div>
      ) : (
        /* Finished Screen */
        <div className="mt-8 py-6 text-center space-y-5">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-4xl shadow-xl">
            🏆
          </div>

          <div>
            <h4 className="text-2xl font-black text-white font-['Chakra_Petch']">
              ยินดีด้วย! คุณพิชิตภารกิจ AR Hand Tracking (Abstraction)
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              ฝึกทักษะการคัดแยกสิ่งจำเป็นออกจากรายละเอียดที่ไม่เกี่ยวข้องสำเร็จ ได้คะแนน {score} คะแนน
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>ได้รับ +250 XP พิชิตแนวคิดเชิงนามธรรม!</span>
          </div>

          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={handleRestart}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>เล่นใหม่อีกครั้ง</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
