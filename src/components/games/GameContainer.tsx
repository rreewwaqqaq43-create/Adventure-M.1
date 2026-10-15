/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Game1ARHandTracking } from './Game1ARHandTracking';
import { Game2FlashcardMatching } from './Game2FlashcardMatching';
import { Game3PythonTextAdventure } from './Game3PythonTextAdventure';
import { Game4ScratchAIStudio } from './Game4ScratchAIStudio';
import { Game5DataPuzzleMatching } from './Game5DataPuzzleMatching';
import { Game6SummerEngine } from './Game6SummerEngine';

interface GameContainerProps {
  chapterId: number;
  onGameComplete: (score: number, maxScore: number, xpEarned: number) => void;
}

export const GameContainer: React.FC<GameContainerProps> = ({
  chapterId,
  onGameComplete,
}) => {
  switch (chapterId) {
    case 1:
      // บทที่ 1: AR Hand Tracking (แนวคิดเชิงนามธรรม - Abstraction)
      return <Game1ARHandTracking onComplete={onGameComplete} />;
    case 2:
      // บทที่ 2: Flashcards & Matching Games (เปิดไพ่ให้จำก่อนเริ่ม สุ่มโจทย์ - ผังงานและการแก้ปัญหา)
      return <Game2FlashcardMatching onComplete={onGameComplete} />;
    case 3:
      // บทที่ 3: Interactive Text Adventure with LLM (Python Cyber Quest)
      return <Game3PythonTextAdventure onComplete={onGameComplete} />;
    case 4:
      // บทที่ 4: AI Model Training Platform (Vision, Text, Audio) + Scratch Block Game Creator
      return <Game4ScratchAIStudio onComplete={onGameComplete} />;
    case 5:
      // บทที่ 5: Interactive Quiz & Puzzle (Flashcards & Matching Games - ข้อมูลและการประมวลผล)
      return <Game5DataPuzzleMatching onComplete={onGameComplete} />;
    case 6:
      // บทที่ 6: Gameer.io & Summer Engine (สร้างเกมสืบสวนตามจับแฮกเกอร์ Phishing ด้วย AI แชร์ลิงก์เล่นได้ทันที)
      return <Game6SummerEngine onComplete={onGameComplete} />;
    default:
      return <Game1ARHandTracking onComplete={onGameComplete} />;
  }
};
