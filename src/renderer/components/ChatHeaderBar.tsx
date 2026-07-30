import React from 'react';
import { ChevronDown, SlidersHorizontal, History, MoreHorizontal } from 'lucide-react';

interface ChatHeaderBarProps {
  title?: string;
  onToggleContents?: () => void;
}

export const ChatHeaderBar: React.FC<ChatHeaderBarProps> = ({
  title = 'Explain embeddings',
  onToggleContents,
}) => {
  return (
    <div className="chat-card-header">
      <div className="chat-title-wrapper">
        <span className="chat-card-title">{title}</span>
        <ChevronDown size={14} className="chat-title-chevron" />
      </div>

      <div className="chat-header-actions">
        <button
          className="chat-action-btn"
          title="Toggle Contents"
          onClick={onToggleContents}
          aria-label="Toggle Contents"
        >
          <SlidersHorizontal size={17} />
        </button>

        <button className="chat-action-btn" title="Chat History" aria-label="Chat History">
          <History size={17} />
        </button>

        <button className="chat-action-btn" title="More Options" aria-label="More Options">
          <MoreHorizontal size={17} />
        </button>
      </div>
    </div>
  );
};
