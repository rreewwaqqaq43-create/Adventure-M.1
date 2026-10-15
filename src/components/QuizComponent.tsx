/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Quiz, QuizQuestion, User } from '../types';
import { StorageService, QuizAttemptRecord } from '../services/storage';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Send,
  Eye,
  AlertTriangle,
  Info,
  Star,
  Trophy,
  TrendingUp,
  Target,
  Crown,
  Medal,
  Flame,
} from 'lucide-react';
import { LeaderboardModal } from './LeaderboardModal';

interface QuizComponentProps {
  quiz: Quiz;
  chapterNumber?: number;
  currentUser?: User | null;
  onQuizComplete: (score: number, maxScore: number, xpEarned: number) => void;
}

export const QuizComponent: React.FC<QuizComponentProps> = ({
  quiz,
  chapterNumber,
  currentUser,
  onQuizComplete,
}) => {
  const isPreTest = quiz.type === 'pre_test' || quiz.title.toLowerCase().includes('ก่อนเรียน');
  const questions: QuizQuestion[] = quiz.questions || [];
  const targetChapter = quiz.chapterNumber || chapterNumber || 1;
  const isTeacherOrAdmin = currentUser?.role === 'teacher' || currentUser?.role === 'admin';

  // Check if Pre-test was completed before allowing Post-test
  const isPreTestCompleted = isPreTest || isTeacherOrAdmin || StorageService.getQuizAttempts().some(
    (a) => a.chapterNumber === targetChapter && a.quizType === 'pre_test' && (!currentUser || a.userId === currentUser.id || a.userId === 'anonymous-student')
  );

  const [currentIdx, setCurrentIdx] = useState(0);
  // Map of question index -> selected option index
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  // In post-test immediate mode, tracks if current question has been checked
  const [immediateAnswered, setImmediateAnswered] = useState<Record<number, boolean>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [showReview, setShowReview] = useState(true);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [levelUpMessage, setLevelUpMessage] = useState<string | null>(null);
  const [earnedMedalTitle, setEarnedMedalTitle] = useState<string | null>(null);

  if (!isPreTestCompleted && !isPreTest) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center space-y-4 bg-slate-950/90 border-2 border-emerald-500/40 rounded-3xl shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-3xl">
          🔒
        </div>
        <div className="space-y-1.5 max-w-md">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
            ขั้นตอนที่ 1: แบบทดสอบก่อนเรียน (Pre-test)
          </span>
          <h3 className="text-lg font-bold text-white font-['Chakra_Petch']">
            ต้องทำแบบทดสอบก่อนเรียน (Pre-test) ให้เสร็จก่อน
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            ตามระเบียบการวัดผลการเรียนรู้ นักเรียนต้องทำแบบทดสอบก่อนเรียน ประจำบทที่ {targetChapter} ให้ครบถ้วนก่อน จึงจะสามารถตอบหรือส่งคำตอบแบบทดสอบหลังเรียน (Post-test) ได้
          </p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx] || {
    id: 'q-default',
    question: 'ไม่มีคำถามในบทนี้',
    options: ['ข้อ ก', 'ข้อ ข'],
    correctAnswer: 0,
    explanation: 'เนื้อหาเพิ่มเติม',
  };

  const correctIndex = currentQ.correctIndex ?? currentQ.correctAnswer ?? 0;
  const currentSelected = selectedAnswers[currentIdx];

  const handleSelectOption = (optIdx: number) => {
    if (isPreTest) {
      // In Pre-test: Students can freely select/change their answer. NO spoilers shown!
      setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: optIdx }));
    } else {
      // In Post-test: Students select and see immediate feedback for reinforcement
      if (immediateAnswered[currentIdx]) return;
      setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: optIdx }));
      setImmediateAnswered((prev) => ({ ...prev, [currentIdx]: true }));
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const calculateScore = () => {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      const selected = selectedAnswers[idx];
      const correct = q.correctIndex ?? q.correctAnswer ?? 0;
      if (selected === correct) {
        correctCount += 1;
      }
    });
    return correctCount;
  };

  const handleSubmitQuiz = () => {
    const finalScore = calculateScore();
    const starPointsEarned = finalScore * 10;
    const xpEarned = finalScore * 20 + 40;
    const passThreshold = Math.ceil(questions.length * 0.6);
    const hasPassed = finalScore >= passThreshold;
    setIsFinished(true);

    // Save attempt record for teacher mistake analytics
    const activeUser = currentUser || StorageService.getCurrentUser();
    const userId = activeUser?.id || 'anonymous-student';
    const attempt: QuizAttemptRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      quizId: quiz.id,
      chapterNumber: quiz.chapterNumber || chapterNumber || 1,
      quizType: isPreTest ? 'pre_test' : 'post_test',
      userId: userId,
      userName: activeUser?.name || 'นักเรียน ม.1',
      score: finalScore,
      maxScore: questions.length,
      completedAt: new Date().toISOString(),
      answers: questions.map((q, idx) => {
        const selected = selectedAnswers[idx] ?? -1;
        const correct = q.correctIndex ?? q.correctAnswer ?? 0;
        return {
          questionId: q.id,
          questionText: q.question,
          selectedOption: selected,
          selectedText: selected >= 0 ? q.options[selected] : 'ไม่ได้ตอบ',
          correctOption: correct,
          correctText: q.options[correct] || '',
          isCorrect: selected === correct,
          explanation: q.explanation || '',
        };
      }),
    };

    StorageService.saveQuizAttempt(attempt);

    // Gamification 1: Level Progression (Level 1 -> Level 2...)
    const profile = StorageService.getStudentProfile(userId);
    if (profile) {
      const oldLevel = profile.level || 1;
      const updatedXP = (profile.xp || 0) + xpEarned;
      let newLevel = 1;
      if (updatedXP >= 1650) newLevel = 6;
      else if (updatedXP >= 1250) newLevel = 5;
      else if (updatedXP >= 900) newLevel = 4;
      else if (updatedXP >= 600) newLevel = 3;
      else if (updatedXP >= 150) newLevel = 2;
      else newLevel = 1;

      if (newLevel > oldLevel) {
        setLevelUpMessage(`🎉 LEVEL UP! เลเวลของคุณเพิ่มขึ้นจาก Level ${oldLevel} เป็น Level ${newLevel}!`);
      }

      StorageService.updateStudentProfile({
        ...profile,
        xp: updatedXP,
        level: newLevel,
      });
    }

    // Gamification 2: Medal/Badge Rewards (ทำภารกิจครบได้เหรียญ)
    if (!isPreTest && hasPassed) {
      if (targetChapter === 7) {
        const pct = finalScore / questions.length;
        if (pct >= 0.8) {
          StorageService.awardBadge(userId, 'badge-7');
          setEarnedMedalTitle('🥇 เหรียญทองคำมหาบัณฑิต 6 บทเรียน (Grandmaster Gold)');
        } else {
          StorageService.awardBadge(userId, 'badge-7');
          setEarnedMedalTitle('🥈 เหรียญเงินผู้พิชิต 6 บทเรียน (Silver Medal)');
        }
      } else {
        StorageService.awardBadge(userId, `badge-${targetChapter}`);
        setEarnedMedalTitle(`🏆 เหรียญรางวัลประจำด่านที่ ${targetChapter}`);
      }
    }

    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    onQuizComplete(finalScore, questions.length, xpEarned);
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedAnswers({});
    setImmediateAnswered({});
    setIsFinished(false);
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const isAllAnswered = questions.length > 0 && answeredCount === questions.length;

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
        ไม่มีคำถามสำหรับบทเรียนนี้
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 text-slate-100 max-w-3xl mx-auto shadow-2xl">
      {/* Quiz Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isPreTest
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
            }`}
          >
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-base sm:text-lg text-white font-['Chakra_Petch']">
                {quiz.title}
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isPreTest
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {isPreTest ? 'แบบทดสอบก่อนเรียน' : 'แบบทดสอบหลังเรียน'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>⭐ ตอบถูกได้ 10 คะแนน / ข้อ (เต็ม {questions.length * 10} คะแนน)</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isPreTest
                ? '🔒 โหมดก่อนเรียน: นักเรียนตอบให้ครบทุกข้อก่อน ระบบจึงจะแสดงผลคะแนนและเฉลยคำตอบ'
                : '🎯 โหมดหลังเรียน: วัดผลสัมฤทธิ์ สสวท. ม.1 (ตอบถูกได้ข้อละ 10 คะแนน เพื่อปลดล็อคผ่านด่านและรับเหรียญรางวัล)'}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs text-slate-400">
            {isFinished ? 'คะแนนสะสม (⭐)' : 'ตอบแล้ว'}
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-400 font-['Chakra_Petch'] flex items-center gap-1 justify-end">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>
              {isFinished
                ? `${calculateScore() * 10} / ${questions.length * 10}`
                : `${answeredCount} / ${questions.length} ข้อ`}
            </span>
          </div>
        </div>
      </div>

      {!isFinished ? (
        <div className="mt-5 space-y-5">
          {/* Question Index Navigator Dots */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              ข้อสอบทั้งหมด:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {questions.map((_, idx) => {
                const isCurrent = idx === currentIdx;
                const isSelected = selectedAnswers[idx] !== undefined;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400 shadow-md scale-105'
                        : isSelected
                        ? 'bg-indigo-600/40 text-indigo-200 border border-indigo-500/40'
                        : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <span className="text-xs text-slate-400">
              ข้อที่ {currentIdx + 1}/{questions.length}
            </span>
          </div>

          {/* Question Text Box */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
              <div className="flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>คำถามข้อที่ {currentIdx + 1} จาก {questions.length}</span>
              </div>
              {isPreTest && (
                <span className="text-[11px] text-slate-400 font-normal">
                  (เลือกคำตอบแล้วกด "ข้อถัดไป" จนครบ)
                </span>
              )}
            </div>
            <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed">
              {currentQ.question}
            </p>
          </div>

          {/* Choices List */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt: string, optIdx: number) => {
              const isSelected = currentSelected === optIdx;
              const isCorrectOpt = optIdx === correctIndex;
              const isAnsweredThis = immediateAnswered[currentIdx];

              let buttonStyle =
                'bg-slate-950/80 border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/60 text-slate-200';

              if (isPreTest) {
                // In Pre-test: Highlight chosen option in rich amber, NO right/wrong spoilers!
                if (isSelected) {
                  buttonStyle =
                    'bg-amber-500/20 border-amber-500 text-amber-200 font-semibold ring-1 ring-amber-500/50';
                }
              } else {
                // In Post-test immediate feedback mode
                if (isAnsweredThis) {
                  if (isCorrectOpt) {
                    buttonStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold';
                  } else if (isSelected && !isCorrectOpt) {
                    buttonStyle = 'bg-rose-500/20 border-rose-500 text-rose-300 font-semibold';
                  } else {
                    buttonStyle = 'opacity-40 border-slate-800 text-slate-500';
                  }
                }
              }

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-center justify-between group ${buttonStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="text-xs sm:text-sm leading-relaxed">{opt}</span>
                  </div>

                  {/* Immediate feedback check/cross in post-test only */}
                  {!isPreTest && isAnsweredThis && (
                    <div className="shrink-0 ml-2 flex items-center gap-1.5">
                      {isCorrectOpt && (
                        <>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 animate-bounce">
                            ⭐ +10 คะแนน!
                          </span>
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        </>
                      )}
                      {isSelected && !isCorrectOpt && (
                        <>
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-bold border border-rose-500/40">
                            0 คะแนน
                          </span>
                          <XCircle className="w-5 h-5 text-rose-400" />
                        </>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Post-test explanation preview (only in post-test after answer) */}
          {!isPreTest && immediateAnswered[currentIdx] && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                <Sparkles className="w-4 h-4" />
                <span>คำอธิบายเฉลย (สสวท. ม.1):</span>
              </div>
              <p className="text-slate-300 leading-relaxed pl-5">
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Pre-test notice */}
          {isPreTest && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300/90 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                เมื่อตอบครบทุกข้อแล้ว กดปุ่ม <strong>"ส่งคำตอบแบบทดสอบก่อนเรียน"</strong> ระบบจะเฉลยคำตอบพร้อมคำอธิบายให้ทราบทั้งหมด
              </span>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-3">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                currentIdx === 0
                  ? 'opacity-40 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ข้อก่อนหน้า</span>
            </button>

            <div className="flex items-center gap-2">
              {currentIdx < questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all"
                >
                  <span>ข้อถัดไป</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : null}

              {/* Submit Button */}
              <button
                onClick={handleSubmitQuiz}
                disabled={!isAllAnswered && isPreTest}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md ${
                  isAllAnswered || !isPreTest
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 hover:scale-105'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>
                  {isAllAnswered
                    ? isPreTest
                      ? 'ส่งคำตอบแบบทดสอบก่อนเรียน'
                      : 'ส่งข้อสอบและดูผลคะแนน'
                    : `ตอบครบแล้วส่ง (${answeredCount}/${questions.length})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Quiz Finished & Comprehensive Review Screen */
        <div className="py-6 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-3xl shadow-lg">
              🏆
            </div>
            <div>
              <h4 className="text-2xl font-black text-white font-['Chakra_Petch']">
                ทำแบบทดสอบเสร็จสมบูรณ์!
              </h4>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {quiz.title} • {isPreTest ? 'แบบทดสอบก่อนเรียน (Pre-test)' : 'แบบทดสอบหลังเรียน (Post-test)'}
              </p>
            </div>

            {/* Level Up Notification Banner */}
            {levelUpMessage && (
              <div className="p-3.5 bg-gradient-to-r from-amber-500/25 via-yellow-500/25 to-amber-500/25 border-2 border-amber-400/80 rounded-2xl text-amber-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl animate-bounce">
                <Crown className="w-5 h-5 text-amber-400" />
                <span>{levelUpMessage}</span>
              </div>
            )}

            {/* Medal Unlocked Banner */}
            {earnedMedalTitle && (
              <div className="p-3 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 rounded-2xl text-yellow-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span>ปลดล็อครางวัล: {earnedMedalTitle}</span>
              </div>
            )}

            {/* Gamified Score Badges (ตอบถูกได้ 10 คะแนน) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl text-center">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-amber-500/30">
                <div className="text-[11px] text-amber-300 font-bold flex items-center justify-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>คะแนนสะสม (⭐)</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-400 font-['Chakra_Petch'] mt-0.5">
                  +{calculateScore() * 10}
                </div>
                <div className="text-[10px] text-slate-400">ข้อละ 10 คะแนน ({calculateScore()}/{questions.length} ข้อ)</div>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-indigo-500/30">
                <div className="text-[11px] text-indigo-300 font-bold flex items-center justify-center gap-1">
                  <Target className="w-3.5 h-3.5 text-indigo-400" />
                  <span>คิดเป็นร้อยละ</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white font-['Chakra_Petch'] mt-0.5">
                  {Math.round((calculateScore() / questions.length) * 100)}%
                </div>
                <div className="text-[10px] text-slate-400">{Math.round((calculateScore() / questions.length) * 100) >= 60 ? '🎯 ผ่านเกณฑ์' : '⏳ ต้องฝึกฝนเพิ่ม'}</div>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-emerald-500/30">
                <div className="text-[11px] text-emerald-300 font-bold flex items-center justify-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>XP ที่ได้รับ</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 font-['Chakra_Petch'] mt-0.5">
                  +{calculateScore() * 20 + 40} XP
                </div>
                <div className="text-[10px] text-slate-400">📈 ไต่ระดับสู่ Level ถัดไป</div>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-yellow-500/30">
                <div className="text-[11px] text-yellow-300 font-bold flex items-center justify-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                  <span>เหรียญรางวัล (🏆)</span>
                </div>
                <div className="text-sm sm:text-base font-black text-yellow-400 font-['Chakra_Petch'] mt-0.5 truncate">
                  {earnedMedalTitle ? 'ได้รับเหรียญ' : (isPreTest ? 'ทดสอบวัดระดับ' : 'ผ่านด่าน')}
                </div>
                <div className="text-[10px] text-slate-400">{earnedMedalTitle ? 'ปลดล็อคแล้ว' : 'บันทึกลงระบบ'}</div>
              </div>
            </div>

            {/* Quick Leaderboard Open Button */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsLeaderboardOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-transform hover:scale-105 cursor-pointer"
              >
                <Trophy className="w-4 h-4" />
                <span>🥇 ดูอันดับคะแนนเทียบเพื่อนในห้อง (Leaderboard)</span>
              </button>
            </div>
          </div>

          {/* Toggle Full Review Button */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>เฉลยคำตอบละเอียดทุกข้อ (พร้อมคำอธิบาย สสวท. ม.1):</span>
            </div>
            <button
              onClick={() => setShowReview((prev) => !prev)}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium"
            >
              {showReview ? 'ซ่อนเฉลย' : 'แสดงเฉลย'}
            </button>
          </div>

          {/* Review Question List */}
          {showReview && (
            <div className="space-y-4">
              {questions.map((q, idx) => {
                const selected = selectedAnswers[idx];
                const correct = q.correctIndex ?? q.correctAnswer ?? 0;
                const isCorrect = selected === correct;

                return (
                  <div
                    key={q.id || idx}
                    className={`p-4 rounded-2xl border transition-all text-left space-y-3 ${
                      isCorrect
                        ? 'bg-slate-950/70 border-emerald-500/40'
                        : 'bg-rose-950/20 border-rose-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                            isCorrect
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white leading-relaxed">
                            {q.question}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ถูกต้อง</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>ตอบผิด</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Answers Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div
                        className={`p-2.5 rounded-xl border ${
                          isCorrect
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                            : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                        }`}
                      >
                        <span className="text-slate-400 block text-[11px]">คำตอบที่คุณเลือก:</span>
                        <div className="font-semibold mt-0.5">
                          {selected !== undefined && q.options[selected]
                            ? `(${String.fromCharCode(65 + selected)}) ${q.options[selected]}`
                            : 'ไม่ได้เลือกคำตอบ'}
                        </div>
                      </div>

                      {!isCorrect && (
                        <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-200">
                          <span className="text-slate-400 block text-[11px]">คำตอบที่ถูกต้อง:</span>
                          <div className="font-semibold mt-0.5">
                            ({String.fromCharCode(65 + correct)}) {q.options[correct]}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1">
                        <div className="font-bold text-amber-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>คำอธิบายเฉลยตามหนังสือ สสวท. ม.1:</span>
                        </div>
                        <p className="leading-relaxed pl-5 text-slate-300">
                          {q.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Restart */}
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={handleRestart}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>ทำแบบทดสอบใหม่อีกครั้ง</span>
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        currentUser={currentUser}
        currentStudent={StorageService.getStudentProfile(currentUser?.id || '') || null}
      />
    </div>
  );
};
