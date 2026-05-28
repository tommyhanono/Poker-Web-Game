import { useEffect, useState } from 'react';

const THEME_KEY = 'poker_theme';

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'classic');

  useEffect(() => {
    document.documentElement.classList.toggle('theme-modern', theme === 'modern');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'classic' ? 'modern' : 'classic');
  return { theme, toggle };
}

export default function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="btn-action btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5"
      title="Switch theme"
    >
      {theme === 'classic' ? '🎰 Classic' : '⚡ Modern'}
    </button>
  );
}
