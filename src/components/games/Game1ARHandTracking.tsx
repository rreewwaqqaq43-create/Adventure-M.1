/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
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
  ArrowRight,
  ShieldAlert,
  Info,
  MousePointer,
  Volume2,
  VolumeX,
  Flame,
  Zap,
  Target,
  Scan,
  Activity,
  Layers
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
    targetGoal: 'กำมือ (Fist) เพื่อคีบจับการ์ด แล้วเคลื่อนมือไปที่ช่องและแบมือ (Open) เพื่อคัดแยก',
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

// MediaPipe 21 Hand Landmarks bone connections
const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index finger
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle finger
  [5, 9], [9, 10], [10, 11], [11, 12],
  // Ring finger
  [9, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [13, 17], [17, 18], [18, 19], [19, 20],
  // Palm base
  [0, 17],
];

// Euclidean distance helper
const distance2D = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
};

export const Game1ARHandTracking: React.FC<Game1ARHandTrackingProps> = ({ onComplete }) => {
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [allowSimulationFallback, setAllowSimulationFallback] = useState(false);

  // AR Hand position (0 to 100 percentage)
  const [handPos, setHandPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const smoothedPos = useRef<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [handGesture, setHandGesture] = useState<'open' | 'fist' | 'neutral'>('open');
  const [trackingConfidence, setTrackingConfidence] = useState(0);

  // Interaction & Game State
  const [hoverTarget, setHoverTarget] = useState<string | null>(null);
  const [hoverProgress, setHoverProgress] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showVisionMonitor, setShowVisionMonitor] = useState(true);
  const [stabilityMode, setStabilityMode] = useState<'smooth' | 'ultra_steady'>('smooth');

  // Classification results
  const [classified, setClassified] = useState<{ [itemId: string]: 'essential' | 'non_essential' }>({});
  const [score, setScore] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [floatingPopup, setFloatingPopup] = useState<string | null>(null);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [isMuted, setIsMuted] = useState(sfx.isMuted);
  const [feedback, setFeedback] = useState<{ message: string; isCorrect: boolean } | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const arCanvasRef = useRef<HTMLCanvasElement>(null);
  const monitorCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const animFrameIdRef = useRef<number | null>(null);
  const consecutiveFistRef = useRef<number>(0);
  const consecutiveOpenRef = useRef<number>(0);

  // Rounds
  const [rounds] = useState<RoundData[]>(() => {
    const custom = StorageService.games.getGame1Rounds();
    return custom && custom.length > 0 ? custom : ROUNDS;
  });
  const currentRound = rounds[currentRoundIdx] || rounds[0] || ROUNDS[0];
  const remainingItems = currentRound.items.filter((item) => !classified[item.id]);

  // Initialize MediaPipe HandLandmarker Model
  const initMediaPipeModel = async (): Promise<HandLandmarker | null> => {
    if (handLandmarkerRef.current) return handLandmarkerRef.current;
    try {
      setIsModelLoading(true);
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      handLandmarkerRef.current = landmarker;
      setIsModelLoading(false);
      return landmarker;
    } catch (err) {
      console.warn('Failed to load GPU delegate, trying CPU fallback:', err);
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
        });
        handLandmarkerRef.current = landmarker;
        setIsModelLoading(false);
        return landmarker;
      } catch (cpuErr) {
        console.error('Fatal MediaPipe loading error:', cpuErr);
        setIsModelLoading(false);
        setCameraError('ไม่สามารถโหลดโมเดล MediaPipe HandLandmarker ได้ สามารถใช้เมาส์/สัมผัสเล่นแทนได้ทันที');
        return null;
      }
    }
  };

  // Start Real Camera Stream
  const startCamera = async () => {
    try {
      setIsCameraLoading(true);
      setCameraError(null);

      // Pre-load MediaPipe HandLandmarker
      await initMediaPipeModel();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
      setIsCameraLoading(false);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(
        'ไม่สามารถเข้าถึงกล้องเว็บแคมได้ กรุณาอนุญาตสิทธิ์เข้าถึงกล้องในเบราว์เซอร์ หรือเลือก "ใช้โหมดจำลองเมาส์/สัมผัส" เพื่อเล่นได้ทันที'
      );
      setIsCameraActive(false);
      setIsCameraLoading(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsHandDetected(false);
  };

  // Auto request camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Handle Item Select
  const handleItemSelect = useCallback((item: AbstractionItem) => {
    setSelectedItemId(item.id);
    sfx.playLock();
  }, []);

  // Classify item (by ID or currently selected)
  const handleClassify = useCallback(
    (target: 'essential' | 'non_essential', specificItemId?: string) => {
      const targetId = specificItemId || selectedItemId;
      if (!targetId) return;

      const item = currentRound.items.find((i) => i.id === targetId);
      if (!item) return;

      const isCorrect =
        (target === 'essential' && item.isEssential) ||
        (target === 'non_essential' && !item.isEssential);

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
          message: `ถูกต้อง! "${item.name}" คือ ${
            item.isEssential ? 'สิ่งจำเป็น' : 'รายละเอียดที่ไม่จำเป็น'
          } (${item.reason})`,
          isCorrect: true,
        });
      } else {
        setComboStreak(0);
        sfx.playError();
        setIsScreenShaking(true);
        setTimeout(() => setIsScreenShaking(false), 400);
        setFloatingPopup('❌ ข้อมูลไม่ตรงหมวด');
        setFeedback({
          message: `ยังไม่ถูกต้อง: "${item.name}" แท้จริงแล้วคือ ${
            item.isEssential ? 'สิ่งจำเป็น' : 'รายละเอียดที่ไม่จำเป็น'
          } (${item.reason})`,
          isCorrect: false,
        });
      }

      setTimeout(() => setFloatingPopup(null), 1200);
      setClassified((prev) => ({ ...prev, [item.id]: target }));
      setSelectedItemId(null);
    },
    [selectedItemId, currentRound, comboStreak]
  );

  // Main AR Hand Tracking & Hologram Rendering Loop
  useEffect(() => {
    if (!isCameraActive) return;

    let isRunning = true;

    const runVisionTracking = (timestamp: number) => {
      if (!isRunning) return;

      const video = videoRef.current;
      const arCanvas = arCanvasRef.current;
      const monitorCanvas = monitorCanvasRef.current;
      const landmarker = handLandmarkerRef.current;

      if (video && video.readyState >= 2 && landmarker) {
        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;

          const results = landmarker.detectForVideo(video, timestamp);

          // Update AR Canvas sizing
          if (arCanvas) {
            if (arCanvas.width !== video.videoWidth || arCanvas.height !== video.videoHeight) {
              arCanvas.width = video.videoWidth || 640;
              arCanvas.height = video.videoHeight || 480;
            }
          }

          if (results && results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0]; // 21 hand landmarks (normalized 0-1)
            setIsHandDetected(true);
            setTrackingConfidence(Math.round((results.handedness[0]?.[0]?.score || 0.95) * 100));

            // 1. Gesture Recognition: Fist (กำมือ) vs Open Hand (แบมือ)
            const wrist = landmarks[0];
            const middleMcp = landmarks[9];
            const palmScale = distance2D(wrist, middleMcp) || 0.1;

            // Measure tip-to-wrist distance relative to MCP-to-wrist distance for 4 fingers
            const isIndexCurled = distance2D(landmarks[8], wrist) < distance2D(landmarks[5], wrist) * 1.15;
            const isMiddleCurled = distance2D(landmarks[12], wrist) < distance2D(landmarks[9], wrist) * 1.15;
            const isRingCurled = distance2D(landmarks[16], wrist) < distance2D(landmarks[13], wrist) * 1.15;
            const isPinkyCurled = distance2D(landmarks[20], wrist) < distance2D(landmarks[17], wrist) * 1.15;

            // Alternative pinch gesture (thumb tip to index tip)
            const pinchDist = distance2D(landmarks[4], landmarks[8]);
            const isPinch = pinchDist < palmScale * 0.38;

            const curledCount =
              (isIndexCurled ? 1 : 0) +
              (isMiddleCurled ? 1 : 0) +
              (isRingCurled ? 1 : 0) +
              (isPinkyCurled ? 1 : 0);

            const isCurrentFist = curledCount >= 3 || isPinch;
            const isCurrentOpen = curledCount <= 1 && !isPinch;

            // Debounce gesture states for rock-solid stability
            if (isCurrentFist) {
              consecutiveFistRef.current += 1;
              consecutiveOpenRef.current = 0;
            } else if (isCurrentOpen) {
              consecutiveOpenRef.current += 1;
              consecutiveFistRef.current = 0;
            } else {
              consecutiveFistRef.current = 0;
              consecutiveOpenRef.current = 0;
            }

            const isConfirmedFist = consecutiveFistRef.current >= 2;
            const isConfirmedOpen = consecutiveOpenRef.current >= 2;

            const currentGestureState = isConfirmedFist
              ? 'fist'
              : isConfirmedOpen
              ? 'open'
              : 'neutral';
            setHandGesture(currentGestureState);

            // 2. Cursor Position Calculation (Mirrored for natural mirror view)
            // Use blended palm center + index MCP as an unshakeable anchor
            const rawX = (1 - (middleMcp.x * 0.6 + landmarks[5].x * 0.4)) * 100;
            const rawY = (middleMcp.y * 0.6 + landmarks[5].y * 0.4) * 100;

            const alpha = stabilityMode === 'ultra_steady' ? 0.22 : 0.45;
            smoothedPos.current = {
              x: smoothedPos.current.x * (1 - alpha) + rawX * alpha,
              y: smoothedPos.current.y * (1 - alpha) + rawY * alpha,
            };
            setHandPos({ x: smoothedPos.current.x, y: smoothedPos.current.y });

            // 3. Render 3D Holographic Hand Model on the Main AR Overlay Canvas
            if (arCanvas) {
              const ctx = arCanvas.getContext('2d');
              if (ctx) {
                const cw = arCanvas.width;
                const ch = arCanvas.height;
                ctx.clearRect(0, 0, cw, ch);

                const isFistActive = currentGestureState === 'fist';
                const boneColor = isFistActive ? '#f59e0b' : '#00f0ff';
                const glowColor = isFistActive ? 'rgba(245, 158, 11, 0.8)' : 'rgba(0, 240, 255, 0.8)';

                // Draw Bones (Connections)
                ctx.save();
                ctx.lineWidth = 3.5;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = boneColor;
                ctx.shadowColor = glowColor;
                ctx.shadowBlur = 12;

                HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
                  const p1 = landmarks[startIdx];
                  const p2 = landmarks[endIdx];
                  // Mirrored horizontally: x' = (1 - x) * width
                  const x1 = (1 - p1.x) * cw;
                  const y1 = p1.y * ch;
                  const x2 = (1 - p2.x) * cw;
                  const y2 = p2.y * ch;

                  ctx.beginPath();
                  ctx.moveTo(x1, y1);
                  ctx.lineTo(x2, y2);
                  ctx.stroke();
                });

                // Draw 21 Holographic Joints (Landmarks)
                landmarks.forEach((lm, idx) => {
                  const x = (1 - lm.x) * cw;
                  const y = lm.y * ch;
                  const isFingertip = [4, 8, 12, 16, 20].includes(idx);
                  const isWrist = idx === 0;

                  // Outer glowing ring
                  ctx.beginPath();
                  ctx.arc(x, y, isFingertip ? 7 : isWrist ? 8 : 4.5, 0, Math.PI * 2);
                  ctx.fillStyle = isFistActive ? '#fbbf24' : '#38bdf8';
                  ctx.shadowColor = glowColor;
                  ctx.shadowBlur = 10;
                  ctx.fill();

                  // Center bright node
                  ctx.beginPath();
                  ctx.arc(x, y, isFingertip ? 3.5 : 2, 0, Math.PI * 2);
                  ctx.fillStyle = '#ffffff';
                  ctx.fill();
                });

                // Draw Holographic Hand Status Badge over the Hand
                const palmCenterX = (1 - middleMcp.x) * cw;
                const palmCenterY = middleMcp.y * ch;

                ctx.font = 'bold 12px Chakra Petch, monospace';
                const statusBadge = isFistActive
                  ? '✊ กำมือ (คีบจับวัตถุ)'
                  : isConfirmedOpen
                  ? '🖐️ แบมือ (พร้อมคัดแยก)'
                  : '✋ กำลังตรวจจับ';
                ctx.fillStyle = isFistActive ? '#fbbf24' : '#38bdf8';
                ctx.shadowColor = glowColor;
                ctx.shadowBlur = 8;
                ctx.fillText(statusBadge, Math.max(10, palmCenterX - 60), Math.max(25, palmCenterY - 45));

                ctx.restore();
              }
            }

            // 4. Render Picture-in-Picture Vision Monitor
            if (monitorCanvas) {
              const mCtx = monitorCanvas.getContext('2d');
              if (mCtx) {
                const mw = monitorCanvas.width;
                const mh = monitorCanvas.height;
                mCtx.clearRect(0, 0, mw, mh);

                // Draw mirrored video
                mCtx.save();
                mCtx.scale(-1, 1);
                mCtx.drawImage(video, -mw, 0, mw, mh);
                mCtx.restore();

                // Draw miniature holographic skeleton in PIP
                mCtx.save();
                mCtx.lineWidth = 1.8;
                mCtx.strokeStyle = currentGestureState === 'fist' ? '#f59e0b' : '#00f0ff';
                HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
                  const p1 = landmarks[startIdx];
                  const p2 = landmarks[endIdx];
                  mCtx.beginPath();
                  mCtx.moveTo((1 - p1.x) * mw, p1.y * mh);
                  mCtx.lineTo((1 - p2.x) * mw, p2.y * mh);
                  mCtx.stroke();
                });

                // Landmark points
                landmarks.forEach((lm) => {
                  mCtx.fillStyle = '#ffffff';
                  mCtx.beginPath();
                  mCtx.arc((1 - lm.x) * mw, lm.y * mh, 2, 0, Math.PI * 2);
                  mCtx.fill();
                });

                // Monitor HUD Text
                mCtx.fillStyle = '#00f0ff';
                mCtx.font = 'bold 9px monospace';
                mCtx.fillText(
                  `AI HAND 21-PTS [${results.handedness[0]?.[0]?.displayName || 'Right'}]`,
                  6,
                  12
                );
                mCtx.fillStyle = currentGestureState === 'fist' ? '#fbbf24' : '#34d399';
                mCtx.fillText(
                  `GESTURE: ${currentGestureState.toUpperCase()}`,
                  6,
                  mh - 6
                );
                mCtx.restore();
              }
            }
          } else {
            // No hand detected in current frame
            setIsHandDetected(false);
            if (arCanvas) {
              const ctx = arCanvas.getContext('2d');
              if (ctx) ctx.clearRect(0, 0, arCanvas.width, arCanvas.height);
            }
            if (monitorCanvas) {
              const mCtx = monitorCanvas.getContext('2d');
              if (mCtx) {
                const mw = monitorCanvas.width;
                const mh = monitorCanvas.height;
                mCtx.save();
                mCtx.scale(-1, 1);
                mCtx.drawImage(video, -mw, 0, mw, mh);
                mCtx.restore();
                mCtx.fillStyle = '#f59e0b';
                mCtx.font = 'bold 9px monospace';
                mCtx.fillText('⚠️ ยกมือขึ้นหน้ากล้อง...', 8, 16);
              }
            }
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(runVisionTracking);
    };

    animFrameIdRef.current = requestAnimationFrame(runVisionTracking);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isCameraActive, stabilityMode]);

  // Automated Gesture Interaction Engine (Fist to Grab, Open Hand to Drop, or Hover Dwell)
  useEffect(() => {
    if (isFinished) return;

    const interval = setInterval(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const px = rect.left + (handPos.x / 100) * rect.width;
      const py = rect.top + (handPos.y / 100) * rect.height;

      const targetElement = document.elementFromPoint(px, py);

      // ACTION 1: Grabbing an item card
      if (!selectedItemId) {
        const itemElem = targetElement?.closest('[data-item-card-id]') as HTMLElement | null;
        const itemId = itemElem?.getAttribute('data-item-card-id');

        if (itemId) {
          const targetItem = currentRound.items.find((i) => i.id === itemId);
          if (targetItem && !classified[targetItem.id]) {
            setHoverTarget(itemId);

            // Condition A: Player clenched fist over the card -> INSTANT GRAB!
            if (handGesture === 'fist') {
              handleItemSelect(targetItem);
              setHoverProgress(0);
              return;
            }

            // Condition B: Accessible Hover Dwell fallback (keep hand over card for ~0.8s)
            setHoverProgress((prev) => {
              if (prev >= 100) {
                handleItemSelect(targetItem);
                return 0;
              }
              return prev + 25;
            });
            return;
          }
        }
      }

      // ACTION 2: Dropping selected card into Essential or Non-Essential Zone
      if (selectedItemId) {
        const isEssentialZone =
          Boolean(targetElement?.closest('[data-zone="essential"]')) || handPos.x <= 32;
        const isNonEssentialZone =
          Boolean(targetElement?.closest('[data-zone="non_essential"]')) || handPos.x >= 68;

        if (isEssentialZone) {
          setHoverTarget('essential');

          // Condition A: Player opened hand (แบมือ) inside Essential zone -> DROP!
          if (handGesture === 'open') {
            handleClassify('essential');
            setHoverProgress(0);
            return;
          }

          // Condition B: Hover Dwell fallback
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

          // Condition A: Player opened hand (แบมือ) inside Non-Essential zone -> DROP!
          if (handGesture === 'open') {
            handleClassify('non_essential');
            setHoverProgress(0);
            return;
          }

          // Condition B: Hover Dwell fallback
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

      // If hand moved away from interactive zones, decay dwell smoothly
      setHoverProgress((prev) => (prev > 0 ? Math.max(0, prev - 25) : 0));
      if (hoverProgress <= 0) {
        setHoverTarget(null);
      }
    }, 60);

    return () => clearInterval(interval);
  }, [
    handPos,
    handGesture,
    selectedItemId,
    classified,
    currentRound,
    isFinished,
    hoverProgress,
    handleItemSelect,
    handleClassify,
  ]);

  // Pointer / Mouse / Touch fallback move handler
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
    setHandPos({ x, y });
    setIsHandDetected(true);
  };

  // Keyboard shortcut listener ('1' / Left Arrow for Essential, '2' / Right Arrow for Non-Essential)
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
  }, [selectedItemId, handleClassify]);

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
    <div
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 text-slate-100 max-w-4xl mx-auto shadow-2xl transition-transform ${
        isScreenShaking ? 'scale-[0.99] translate-x-1 ring-2 ring-rose-500/50' : ''
      }`}
    >
      {/* Floating score / combo popup */}
      {floatingPopup && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none px-4 py-2 rounded-2xl bg-slate-950/95 border border-amber-400 text-amber-300 font-bold text-sm sm:text-base shadow-2xl animate-bounce backdrop-blur-md">
          {floatingPopup}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Hand className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white font-['Chakra_Petch'] flex items-center gap-2">
              <span>AR Hand Tracking: คัดแยกสิ่งสำคัญ (Abstraction)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                MediaPipe AI Vision
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              โมเดลตรวจจับโครงกระดูกมือ 21 จุด • กำมือ (Fist) เพื่อจับการ์ด • แบมือ (Open) เพื่อปล่อยลงช่อง
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

          {/* Hand Tracking Gesture Badge */}
          {isCameraActive && (
            <div
              className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                handGesture === 'fist'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : isHandDetected
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <Activity className="w-3 h-3 animate-spin" />
              <span>
                {handGesture === 'fist'
                  ? '✊ กำมือ (คีบจับ)'
                  : isHandDetected
                  ? '🖐️ แบมือ (เปิด)'
                  : '🔍 กำลังค้นหามือ'}
              </span>
            </div>
          )}

          {/* Anti-Shake Stability Mode Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
            <span className="text-slate-400 pl-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">กันสั่น:</span>
            </span>
            <button
              onClick={() => setStabilityMode('smooth')}
              className={`px-2 py-0.5 rounded-lg font-mono transition-colors text-[10px] ${
                stabilityMode === 'smooth'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ลื่นไหล
            </button>
            <button
              onClick={() => setStabilityMode('ultra_steady')}
              className={`px-2 py-0.5 rounded-lg font-mono transition-colors text-[10px] ${
                stabilityMode === 'ultra_steady'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              นิ่งสนิท
            </button>
          </div>

          {/* Calibration / Center button */}
          {isCameraActive && (
            <button
              onClick={() => {
                setHandPos({ x: 50, y: 50 });
                sfx.playLock();
              }}
              title="ตั้งศูนย์ตำแหน่งกลับมาตรงกลาง"
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">ตั้งศูนย์</span>
            </button>
          )}

          {/* Vision Monitor Toggle */}
          <button
            onClick={() => setShowVisionMonitor((prev) => !prev)}
            title="เปิด/ปิด จอมอนิเตอร์ AR Vision"
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              showVisionMonitor
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Scan className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">มอนิเตอร์ AR</span>
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

      {/* AR Dynamic Guide Banner */}
      {isCameraActive && (
        <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-950 to-indigo-950/40 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-md animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="text-xl p-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
              🖐️
            </span>
            <div className="text-xs">
              <span className="font-bold text-white">ท่าทางมือสั่งการ: </span>
              <span className="text-slate-300">
                1. ขยับมือไปชี้การ์ด 2. <strong className="text-amber-300">กำมือ (✊)</strong> เพื่อจับการ์ด 3. เลื่อนมือไปที่ช่อง 4. <strong className="text-cyan-300">แบมือ (🖐️)</strong> เพื่อปล่อยลงช่อง
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono shrink-0">
            <span
              className={`w-2 h-2 rounded-full ${
                isHandDetected ? 'bg-cyan-400 animate-ping' : 'bg-amber-500 animate-pulse'
              }`}
            />
            <span>{isHandDetected ? `ตรวจพบมือ (${trackingConfidence}%)` : 'ยกมือขึ้นหน้ากล้อง...'}</span>
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
            ใช้โหมดจำลองเมาส์/สัมผัส
          </button>
        </div>
      )}

      {/* Camera Pre-Start Setup Screen */}
      {!isCameraActive && !allowSimulationFallback && !isFinished ? (
        <div className="mt-4 p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-5 shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-500/10">
            <Hand className="w-8 h-8 animate-bounce" />
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg sm:text-xl font-bold text-white font-['Chakra_Petch']">
              ภารกิจแนวคิดเชิงนามธรรม (AR Hand Tracking Abstraction)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              ควบคุมด้วยกล้อง <strong>AR Hand Tracking แท้จริง</strong> (ตรวจจับโครงกระดูก 21 จุด) หรือเลือก <strong>โหมดคลิกตอบ / ลากการ์ด / ทัชสกรีน</strong> เป็นตัวเลือกสำรองได้ทันที
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={startCamera}
              disabled={isCameraLoading || isModelLoading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95"
            >
              {isCameraLoading || isModelLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>{isModelLoading ? 'กำลังโหลดโมเดล AI MediaPipe...' : 'กำลังเชื่อมต่อกล้อง...'}</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  <span>📷 เปิดกล้อง AR ตรวจจับมือ 21 จุด</span>
                </>
              )}
            </button>

            <button
              onClick={() => setAllowSimulationFallback(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <MousePointer className="w-4 h-4" />
              <span>⚡ เล่นสำรอง (คลิก / ลาก / ทัชสกรีน)</span>
            </button>
          </div>
        </div>
      ) : !isFinished ? (
        <div className="mt-4 space-y-4">
          {/* Situation Banner */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-cyan-300">{currentRound.missionTitle}</span>
              <span className="text-slate-400">
                ด่านที่ {currentRoundIdx + 1} / {rounds.length}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">{currentRound.situation}</p>
            <p className="text-[11px] text-cyan-400/90 font-medium">🎯 {currentRound.targetGoal}</p>
          </div>

          {/* AR Stage Container */}
          <div
            ref={containerRef}
            onPointerMove={handlePointerMove}
            className="relative min-h-[400px] sm:min-h-[440px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden select-none touch-none cursor-crosshair shadow-inner"
          >
            {/* Real Webcam Video Stream */}
            {isCameraActive && (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover opacity-75 -scale-x-100 filter contrast-110 brightness-95 pointer-events-none"
                />
                {/* 3D Hologram Hand Skeleton Canvas Overlay */}
                <canvas
                  ref={arCanvasRef}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none z-15"
                />
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 text-[10px] text-cyan-300 font-mono flex items-center gap-1.5 shadow-lg pointer-events-none">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isHandDetected ? 'bg-cyan-400 animate-ping' : 'bg-amber-400 animate-pulse'
                    }`}
                  />
                  <span>
                    {isHandDetected
                      ? `AR HOLOGRAM HAND • ${handGesture === 'fist' ? '✊ กำมือ (คีบวัตถุ)' : '🖐️ แบมือ'}`
                      : 'AR SENSOR ACTIVE • ยกมือขึ้นหน้ากล้อง'}
                  </span>
                </div>
              </>
            )}

            {/* Grid Reticle Background */}
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
              <span className="text-xs sm:text-sm font-bold text-emerald-400">สิ่งจำเป็น</span>
              <span className="text-[10px] text-emerald-300/80">(Essential)</span>
              <span className="text-[9px] text-slate-400 mt-1 hidden sm:inline">คัดกรองไว้แก้ปัญหา</span>
              <span className="mt-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold shadow">
                ◀ แบมือปล่อยที่นี่
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
              <span className="text-xs sm:text-sm font-bold text-rose-400">รายละเอียดปลีกย่อย</span>
              <span className="text-[10px] text-rose-300/80">(Non-Essential)</span>
              <span className="text-[9px] text-slate-400 mt-1 hidden sm:inline">ละทิ้งเพื่อความกระชับ</span>
              <span className="mt-2 text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-slate-950 font-bold shadow">
                แบมือปล่อยที่นี่ ▶
              </span>
            </div>

            {/* Center Area: Floating Unclassified Items */}
            <div className="absolute inset-x-32 sm:inset-x-52 top-4 bottom-12 flex flex-col items-center justify-center gap-2 overflow-y-auto p-1.5 z-10">
              {remainingItems.length === 0 ? (
                <div className="text-center py-6 bg-slate-950/90 p-4 rounded-2xl border border-emerald-500/30 shadow-xl backdrop-blur-md">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center text-2xl mb-2">
                    ✓
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-emerald-300">คัดแยกครบทุกรายการแล้ว!</p>
                  <button
                    onClick={handleNextRound}
                    className="mt-3 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 mx-auto shadow-lg"
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
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                            isSelected
                              ? 'bg-amber-500/50 text-white font-bold'
                              : isHovered
                              ? 'bg-cyan-500/50 text-white animate-pulse'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isSelected ? '✊ จับอยู่' : isHovered ? 'กำลังล็อค...' : 'กำมือเพื่อจับ'}
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

            {/* Live AR PIP Vision Monitor */}
            {isCameraActive && showVisionMonitor && (
              <div className="absolute bottom-12 right-3 z-30 p-2 rounded-2xl bg-slate-950/95 border border-cyan-500/40 backdrop-blur-md shadow-2xl flex flex-col items-center max-w-[150px]">
                <div className="flex items-center justify-between w-full pb-1 px-0.5 text-[9px] font-mono text-cyan-400">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    AR VISION PIP
                  </span>
                  <button
                    onClick={() => setShowVisionMonitor(false)}
                    className="text-slate-400 hover:text-white text-xs"
                    title="ปิดจอมอนิเตอร์"
                  >
                    ×
                  </button>
                </div>
                <canvas
                  ref={monitorCanvasRef}
                  width={130}
                  height={98}
                  className="rounded-xl border border-slate-800 bg-slate-900"
                />
                <span className="text-[9px] text-slate-400 mt-1 font-mono">
                  {isHandDetected ? `21-Joints Active` : `รอตรวจจับมือ...`}
                </span>
              </div>
            )}

            {/* Hologram Hand Pointer & Attached Floating Card */}
            <div
              className="absolute pointer-events-none transition-transform duration-75 ease-out z-40"
              style={{
                left: `${handPos.x}%`,
                top: `${handPos.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="relative flex flex-col items-center">
                {/* Floating Card Thumbnail Attached to Hand */}
                {selectedItem && (
                  <div className="mb-2 px-2.5 py-1.5 rounded-xl bg-amber-500/90 text-slate-950 font-bold text-[11px] shadow-2xl border border-amber-300 flex items-center gap-1.5 animate-bounce">
                    <span>{selectedItem.icon}</span>
                    <span className="truncate max-w-[110px]">{selectedItem.name}</span>
                  </div>
                )}

                {/* Laser Reticle & Dwell Ring */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      className="stroke-slate-800"
                      strokeWidth="2.5"
                      fill="transparent"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      className="stroke-cyan-400"
                      strokeWidth="3.5"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 20}
                      strokeDashoffset={2 * Math.PI * 20 * (1 - hoverProgress / 100)}
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Center Node */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      selectedItemId
                        ? 'bg-amber-500/40 border-2 border-amber-400 shadow-[0_0_15px_#f59e0b] scale-110'
                        : handGesture === 'fist'
                        ? 'bg-amber-500/30 border-2 border-amber-400 shadow-[0_0_12px_#f59e0b]'
                        : 'bg-cyan-500/30 border-2 border-cyan-400 shadow-[0_0_12px_#06b6d4]'
                    }`}
                  >
                    <span className="text-base select-none">
                      {selectedItemId ? '✊' : handGesture === 'fist' ? '✊' : '🖐️'}
                    </span>
                  </div>
                </div>

                <span className="mt-0.5 text-[9px] font-mono text-cyan-300 font-bold bg-slate-950/90 px-1.5 py-0.2 rounded border border-cyan-500/40 shadow">
                  {selectedItemId
                    ? 'HOLDING CARD'
                    : handGesture === 'fist'
                    ? 'FIST DETECTED'
                    : 'AR HAND 21-PTS'}
                </span>
              </div>
            </div>

            {/* Footer Prompt */}
            <div className="absolute bottom-2 inset-x-4 bg-slate-950/90 backdrop-blur-sm border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-slate-400 flex items-center justify-between z-20">
              <span>
                🖐️ กำมือเพื่อจับการ์ด / แบมือเพื่อปล่อย หรือกดปุ่ม <strong>[◀ จำเป็น]</strong> / <strong>[ปลีกย่อย ▶]</strong> หรือกดแป้น <strong>1 / 2</strong>
              </span>
              <span className="text-cyan-400 font-medium">เหลือ {remainingItems.length} รายการ</span>
            </div>
          </div>

          {/* Quick Action Dock for Selected Item */}
          {selectedItem && (
            <div className="p-3 bg-slate-950 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{selectedItem.icon}</span>
                <div>
                  <div className="text-xs font-bold text-white">
                    กำลังจัดหมวดหมู่: <span className="text-amber-300">{selectedItem.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">หมวด: {selectedItem.category}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleClassify('essential')}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all hover:scale-105"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>◀ เป็นสิ่งจำเป็น (แบมือ)</span>
                </button>
                <button
                  onClick={() => handleClassify('non_essential')}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all hover:scale-105"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>รายละเอียดปลีกย่อย ▶ (แบมือ)</span>
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
          <div className="w-20 h-20 mx-auto rounded-3xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-4xl shadow-xl shadow-cyan-500/10">
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

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold text-sm">
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
