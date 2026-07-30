import React from 'react';
import { Plus, Search, Bot, MoreHorizontal, SlidersHorizontal, PanelLeftClose } from 'lucide-react';
import OpenManusLogo from '../assets/OpenManusLogo';
import { Conversation } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  selectedModel: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  selectedModel,
}) => {
  return (
    <aside className="sidebar-container">
      <div className="sidebar-header">
        <div className="brand-group">
          <OpenManusLogo size={20} />
          <span className="brand-name">OpenManus</span>
        </div>
        <button className="sidebar-toggle-btn" title="Toggle Sidebar">
          <PanelLeftClose size={18} />
        </button>
      </div>

      <div className="sidebar-action-area">
        <button className="new-chat-btn" onClick={onNewChat}>
          <Plus size={18} />
          <span>Start Task</span>
        </button>
      </div>

      <div className="chats-section">
        <div className="chats-header">
          <span className="chats-title">TASKS</span>
          <button className="search-btn" title="Search chats">
            <Search size={16} />
          </button>
        </div>

        <div className="chats-list">
          {conversations.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${chat.id === activeId ? 'active' : ''}`}
              onClick={() => onSelectConversation(chat.id)}
            >
              <Bot size={16} className="chat-icon" />
              <span className="chat-title">{chat.title}</span>
              <button
                className="chat-more-btn"
                title="Options"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="status-card">
          <div className="status-info">
            <div className="status-row">
              <span className="status-dot" />
              <span className="status-label">Connected</span>
            </div>
            <span className="status-model">{selectedModel}</span>
          </div>
          <button className="status-settings-btn" title="Connection Settings">
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};
