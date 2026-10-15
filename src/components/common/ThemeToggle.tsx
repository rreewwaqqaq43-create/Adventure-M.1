/**
 * Theme Toggle Component
 * Allows users to switch seamlessly between Dark Mode and Light Mode.
 */

import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { ThemeService, ThemeMode } from '../../utils/theme';
import { feedback } from '../../utils/feedback';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabel = false,
  className = '',
}) => {
  const [theme, setTheme] = useState<ThemeMode>(() => ThemeService.getTheme());

  useEffect(() => {
    // Initial sync
    const current = ThemeService.getTheme();
    setTheme(current);
    ThemeService.applyTheme(current);

    const handleThemeChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: ThemeMode }>;
      if (customEvent.detail?.theme) {
        setTheme(customEvent.detail.theme);
      }
    };

    window.addEventListener('app-theme-changed', handleThemeChanged);
    return () => {
      window.removeEventListener('app-theme-changed', handleThemeChanged);
    };
  }, []);

  const handleToggle = () => {
    const nextTheme = ThemeService.toggleTheme();
    setTheme(nextTheme);

    if (nextTheme === 'light') {
      feedback.edit('สลับเป็นโหมดสว่าง (Light Mode) ☀️', 'ปรับโทนสีพื้นหลังเป็นสีขาวสบายตา');
    } else {
      feedback.edit('สลับเป็นโหมดมืด (Dark Mode) 🌙', 'ปรับโทนสีพื้นหลังเป็นสีเข้มสไตล์ Cyberpunk');
    }
  };

  const isLight = theme === 'light';

  return (
    <button
      id="theme-toggle-btn"
      type="button"
      onClick={handleToggle}
      aria-label={isLight ? 'สลับเป็นโหมดมืด' : 'สลับเป็นโหมดสว่าง'}
      title={isLight ? 'สลับเป็นโหมดมืด (Dark Mode 🌙)' : 'สลับเป็นโหมดสว่าง (Light Mode ☀️)'}
      className={`relative inline-flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all duration-300 cursor-pointer group hover:scale-105 active:scale-95 ${
        isLight
          ? 'bg-amber-100 hover:bg-amber-200/80 border-amber-300 text-amber-900 shadow-sm'
          : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-300 shadow-inner'
      } ${className}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isLight ? (
          <Sun className="w-4 h-4 text-amber-600 transition-transform duration-300 rotate-0 group-hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-amber-300 transition-transform duration-300 -rotate-12 group-hover:rotate-0" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-semibold font-['Chakra_Petch'] hidden sm:inline">
          {isLight ? 'โหมดสว่าง' : 'โหมดมืด'}
        </span>
      )}
    </button>
  );
};
