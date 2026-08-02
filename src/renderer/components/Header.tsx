import React from 'react';
import { Sun, Moon, BookOpen, Settings, PanelLeftClose } from 'lucide-react';
import { ThemeMode } from '../types';

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  isLeftSidebarVisible?: boolean;
  onToggleLeftSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  isLeftSidebarVisible = true,
  onToggleLeftSidebar,
}) => {
  return (
    <header className="global-header-container">
      <div className="global-header-left">
        {onToggleLeftSidebar && !isLeftSidebarVisible && (
          <button
            className="global-header-btn"
            onClick={onToggleLeftSidebar}
            title="Expand Sidebar"
            aria-label="Expand Left Sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      <div className="global-header-right">
        <button
          className="global-header-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <button className="global-header-btn" title="Documentation" aria-label="Documentation">
          <BookOpen size={17} />
        </button>

        <button className="global-header-btn" title="Settings" aria-label="Settings">
          <Settings size={17} />
        </button>
      </div>
    </header>
  );
};
