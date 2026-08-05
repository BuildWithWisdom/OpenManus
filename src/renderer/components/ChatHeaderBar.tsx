import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  SlidersHorizontal,
  MoreHorizontal,
  Copy,
  Download,
  Edit2,
  Trash2,
  Sun,
  Moon,
  BookOpen,
  Settings,
  PanelLeft,
} from 'lucide-react';
import { ThemeMode } from '../types';

export interface TurnItem {
  id: string;
  index: number;
  title: string;
}

interface ChatHeaderBarProps {
  title?: string;
  turns?: TurnItem[];
  activeTurnIndex?: number;
  onSelectTurn?: (turnIndex: number) => void;
  onToggleContents?: () => void;
  hasMessages?: boolean;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  isLeftSidebarVisible?: boolean;
  onToggleLeftSidebar?: () => void;
}

export const ChatHeaderBar: React.FC<ChatHeaderBarProps> = ({
  title = 'New Conversation',
  turns = [],
  activeTurnIndex = 0,
  onSelectTurn,
  onToggleContents,
  hasMessages = false,
  theme = 'dark',
  onToggleTheme,
  isLeftSidebarVisible = true,
  onToggleLeftSidebar,
}) => {
  const [showTurnsDropdown, setShowTurnsDropdown] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);

  const turnsMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const isDisabled = !hasMessages;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
      if (turnsMenuRef.current && !turnsMenuRef.current.contains(event.target as Node)) {
        setShowTurnsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const effectiveTurns: TurnItem[] =
    turns.length > 0
      ? turns
      : [{ id: 'demo-0', index: 0, title: title || 'New Conversation' }];

  const currentTurn = effectiveTurns[activeTurnIndex] || effectiveTurns[0];

  return (
    <div className="chat-card-header">
      <div className="chat-header-left-group">
        {onToggleLeftSidebar && (
          <button
            type="button"
            className={`chat-action-btn sidebar-open-btn ${!isLeftSidebarVisible ? 'visible' : ''}`}
            onClick={onToggleLeftSidebar}
            title="Open Sidebar"
            aria-label="Open Sidebar"
          >
            <PanelLeft size={21} />
          </button>
        )}

        <div className="chat-title-dropdown-container" ref={turnsMenuRef}>
          <button
            type="button"
            className="chat-title-wrapper-btn"
            disabled={isDisabled}
            onClick={() => {
              if (isDisabled) return;
              setShowTurnsDropdown((prev) => !prev);
              setShowMoreMenu(false);
            }}
          >
            <span className="chat-card-title">{hasMessages ? currentTurn.title : title}</span>
            {!isDisabled && <ChevronDown size={16} className="chat-title-chevron" />}
          </button>

          {showTurnsDropdown && !isDisabled && (
            <div className="turns-dropdown-menu">
              {effectiveTurns.map((turn) => {
                const isActive = turn.index === activeTurnIndex;
                return (
                  <button
                    key={turn.id}
                    type="button"
                    className={`turn-dropdown-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      onSelectTurn?.(turn.index);
                      setShowTurnsDropdown(false);
                    }}
                  >
                    <span className="turn-label">{turn.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="chat-header-actions">
        <button
          className="chat-action-btn"
          title="Toggle Contents"
          disabled={isDisabled}
          onClick={onToggleContents}
          aria-label="Toggle Contents"
        >
          <SlidersHorizontal size={21} />
        </button>

        <div className="chat-more-dropdown-container" ref={moreMenuRef}>
          <button
            className="chat-action-btn"
            title="More Options"
            aria-label="More Options"
            onClick={() => {
              setShowMoreMenu((prev) => !prev);
              setShowTurnsDropdown(false);
            }}
          >
            <MoreHorizontal size={21} />
          </button>

          {showMoreMenu && (
            <div className="chat-more-menu">
              <button type="button" className="chat-more-item" disabled={isDisabled}>
                <Copy size={18} />
                <span>Copy conversation</span>
              </button>
              <button type="button" className="chat-more-item" disabled={isDisabled}>
                <Download size={18} />
                <span>Export chat</span>
              </button>
              <button type="button" className="chat-more-item" disabled={isDisabled}>
                <Edit2 size={18} />
                <span>Rename chat</span>
              </button>
              <button type="button" className="chat-more-item mobile-only-item">
                <BookOpen size={18} />
                <span>Documentation</span>
              </button>
              <button type="button" className="chat-more-item mobile-only-item">
                <Settings size={18} />
                <span>Settings</span>
              </button>
              <div className="chat-more-divider" />
              <button type="button" className="chat-more-item danger" disabled={isDisabled}>
                <Trash2 size={18} />
                <span>Delete chat</span>
              </button>
            </div>
          )}
        </div>

        <button className="chat-action-btn desktop-only-action" title="Documentation" aria-label="Documentation">
          <BookOpen size={20} />
        </button>

        <button className="chat-action-btn desktop-only-action" title="Settings" aria-label="Settings">
          <Settings size={20} />
        </button>
      </div>
    </div>
  );
};
