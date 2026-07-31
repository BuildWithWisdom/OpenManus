import React, { useState } from 'react';
import {
  ChevronDown,
  SlidersHorizontal,
  MoreHorizontal,
  Copy,
  Download,
  Edit2,
  Trash2,
} from 'lucide-react';

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
}

export const ChatHeaderBar: React.FC<ChatHeaderBarProps> = ({
  title = 'New Conversation',
  turns = [],
  activeTurnIndex = 0,
  onSelectTurn,
  onToggleContents,
  hasMessages = false,
}) => {
  const [showTurnsDropdown, setShowTurnsDropdown] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);

  const isDisabled = !hasMessages;

  const effectiveTurns: TurnItem[] =
    turns.length > 0
      ? turns
      : [{ id: 'demo-0', index: 0, title: title || 'New Conversation' }];

  const currentTurn = effectiveTurns[activeTurnIndex] || effectiveTurns[0];

  return (
    <div className="chat-card-header">
      <div className="chat-title-dropdown-container">
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
          {!isDisabled && <ChevronDown size={14} className="chat-title-chevron" />}
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

      <div className="chat-header-actions">
        <button
          className="chat-action-btn"
          title="Toggle Contents"
          disabled={isDisabled}
          onClick={onToggleContents}
          aria-label="Toggle Contents"
        >
          <SlidersHorizontal size={17} />
        </button>

        <div className="chat-more-dropdown-container">
          <button
            className="chat-action-btn"
            title="More Options"
            disabled={isDisabled}
            aria-label="More Options"
            onClick={() => {
              if (isDisabled) return;
              setShowMoreMenu((prev) => !prev);
              setShowTurnsDropdown(false);
            }}
          >
            <MoreHorizontal size={17} />
          </button>

          {showMoreMenu && !isDisabled && (
            <div className="chat-more-menu">
              <button type="button" className="chat-more-item">
                <Copy size={15} />
                <span>Copy conversation</span>
              </button>
              <button type="button" className="chat-more-item">
                <Download size={15} />
                <span>Export chat</span>
              </button>
              <button type="button" className="chat-more-item">
                <Edit2 size={15} />
                <span>Rename chat</span>
              </button>
              <div className="chat-more-divider" />
              <button type="button" className="chat-more-item danger">
                <Trash2 size={15} />
                <span>Delete chat</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
