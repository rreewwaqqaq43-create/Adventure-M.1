/**
 * Theme Manager for CS Adventure M.1
 * Supports Dark Mode (โหมดมืด) & Light Mode (โหมดสว่าง)
 */

export type ThemeMode = 'dark' | 'light';

export const ThemeService = {
  getTheme(): ThemeMode {
    if (typeof window === 'undefined') return 'dark';
    try {
      const saved = localStorage.getItem('cs-adventure-theme') as ThemeMode | null;
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {}
    return 'dark';
  },

  setTheme(theme: ThemeMode) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('cs-adventure-theme', theme);
    } catch {}
    this.applyTheme(theme);
    window.dispatchEvent(new CustomEvent('app-theme-changed', { detail: { theme } }));
  },

  applyTheme(theme: ThemeMode) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;

    if (theme === 'light') {
      root.classList.add('light-theme');
      body.classList.add('light-theme');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.remove('light-theme');
      body.classList.remove('light-theme');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    }
  },

  toggleTheme(): ThemeMode {
    const current = this.getTheme();
    const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  },

  init() {
    if (typeof window !== 'undefined') {
      const current = this.getTheme();
      this.applyTheme(current);
    }
  }
};
