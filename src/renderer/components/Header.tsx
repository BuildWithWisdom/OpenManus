import React from 'react';
import { Sun, Moon, BookOpen, Settings } from 'lucide-react';
import { ThemeMode } from '../types';

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme }) => {
  return (
    <header className="header-container">
      <div className="header-left" />

      <div className="header-center" />

      <div className="header-right">
        <button
          className="header-icon-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className="header-icon-btn" title="Documentation" aria-label="Documentation">
          <BookOpen size={18} />
        </button>

        <button className="header-icon-btn" title="Settings" aria-label="Settings">
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
