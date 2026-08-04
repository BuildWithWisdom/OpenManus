import React, { useState } from 'react';
import {
  Bot,
  Brain,
  FileText,
  Wrench,
  Plug,
  HelpCircle,
  Plus,
  Search,
  MoreHorizontal,
  SlidersHorizontal,
  PanelLeftClose,
  GraduationCap,
  CodeXml,
  Server,
  Terminal,
  Database,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react';
import OpenManusLogo from '../assets/OpenManusLogo';
import { Conversation } from '../types';
import { getModelDisplayName } from '../models';

interface Lesson {
  id: string;
  title: string;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface SkillItem {
  id: string;
  title: string;
  progressPercent: number;
  statusText: string;
  colorClass: 'green' | 'blue' | 'purple' | 'amber' | 'teal';
  icon: React.ReactNode;
  modules: Module[];
}

interface SidebarProps {
  conversations: Conversation[];
  activeId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  selectedModel: string;
  isLeftSidebarVisible?: boolean;
  onToggleSidebar?: () => void;
}

const SAMPLE_SKILLS: SkillItem[] = [
  {
    id: 'skill-1',
    title: 'AI Engineering',
    progressPercent: 65,
    statusText: '65% Mastered',
    colorClass: 'green',
    icon: <GraduationCap size={18} />,
    modules: [
      {
        id: 'mod-1',
        title: 'Module 1: Foundations',
        lessons: [
          { id: 'les-1-1', title: 'What is AI?' },
          { id: 'les-1-2', title: 'Machine Learning Basics' },
          { id: 'les-1-3', title: 'Neural Networks' },
          { id: 'les-1-4', title: 'Embeddings' },
        ],
      },
      {
        id: 'mod-2',
        title: 'Module 2: LLM Engineering',
        lessons: [
          { id: 'les-2-1', title: 'Prompt Engineering' },
          { id: 'les-2-2', title: 'RAG Systems' },
          { id: 'les-2-3', title: 'AI Agents' },
        ],
      },
      {
        id: 'mod-3',
        title: 'Module 3: Deployment',
        lessons: [
          { id: 'les-3-1', title: 'APIs' },
          { id: 'les-3-2', title: 'Monitoring' },
        ],
      },
    ],
  },
  {
    id: 'skill-2',
    title: 'Full Stack Development',
    progressPercent: 30,
    statusText: '30% Mastered',
    colorClass: 'blue',
    icon: <CodeXml size={18} />,
    modules: [
      {
        id: 'mod-fs-1',
        title: 'Module 1: React & Frontend Architecture',
        lessons: [
          { id: 'les-fs-1-1', title: 'Component Design' },
          { id: 'les-fs-1-2', title: 'State Management' },
        ],
      },
      {
        id: 'mod-fs-2',
        title: 'Module 2: Node.js & APIs',
        lessons: [
          { id: 'les-fs-2-1', title: 'RESTful Controllers' },
          { id: 'les-fs-2-2', title: 'Authentication' },
        ],
      },
    ],
  },
  {
    id: 'skill-3',
    title: 'System Design',
    progressPercent: 10,
    statusText: '10% Mastered',
    colorClass: 'purple',
    icon: <Server size={18} />,
    modules: [
      {
        id: 'mod-sd-1',
        title: 'Module 1: Distributed Systems',
        lessons: [{ id: 'les-sd-1-1', title: 'Load Balancing & Caching' }],
      },
    ],
  },
  {
    id: 'skill-4',
    title: 'Python Programming',
    progressPercent: 0,
    statusText: '0% Started',
    colorClass: 'amber',
    icon: <Terminal size={18} />,
    modules: [
      {
        id: 'mod-py-1',
        title: 'Module 1: Syntax & Variables',
        lessons: [{ id: 'les-py-1-1', title: 'Lists & Dictionaries' }],
      },
    ],
  },
  {
    id: 'skill-5',
    title: 'Database Fundamentals',
    progressPercent: 0,
    statusText: '0% Started',
    colorClass: 'teal',
    icon: <Database size={18} />,
    modules: [
      {
        id: 'mod-db-1',
        title: 'Module 1: Relational Schemas',
        lessons: [{ id: 'les-db-1-1', title: 'SQL & Indexing' }],
      },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  selectedModel,
  isLeftSidebarVisible = true,
  onToggleSidebar,
}) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'learning' | 'docs' | 'tools' | 'plugins'>('chats');
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string>('les-1-1');
  const [expandedModuleIds, setExpandedModuleIds] = useState<Record<string, boolean>>({
    'mod-1': true,
    'mod-2': true,
  });

  const selectedSkill = SAMPLE_SKILLS.find((s) => s.id === selectedSkillId);

  const toggleModuleExpand = (moduleId: string) => {
    setExpandedModuleIds((prev) => ({
      ...prev,
      [moduleId]: prev[moduleId] === false ? true : false,
    }));
  };

  const handleTabClick = (tab: 'chats' | 'learning' | 'docs' | 'tools' | 'plugins') => {
    setActiveTab(tab);
    if (!isLeftSidebarVisible) {
      onToggleSidebar?.();
    }
  };

  return (
    <div className="dual-sidebar-wrapper">
      {/* 1. Primary Navigation Rail (Far Left Icon Dock - ALWAYS VISIBLE) */}
      <nav className="primary-nav-rail">
        <div className="rail-top">
          <button
            className={`rail-logo-btn ${!isLeftSidebarVisible ? 'can-expand' : ''}`}
            onClick={!isLeftSidebarVisible ? onToggleSidebar : undefined}
            title={isLeftSidebarVisible ? 'Gohard' : 'Expand Sidebar'}
            aria-label={isLeftSidebarVisible ? 'Gohard' : 'Expand Sidebar'}
          >
            <span className="logo-default">
              <OpenManusLogo size={24} />
            </span>
            {!isLeftSidebarVisible && (
              <span className="logo-hover-expand">
                <PanelLeftClose size={19} />
              </span>
            )}
          </button>

          <div className="rail-menu-items">
            <button
              className={`rail-icon-btn ${activeTab === 'chats' ? 'active' : ''}`}
              onClick={() => handleTabClick('chats')}
              title="Chats"
              aria-label="Chats"
            >
              <Bot size={19} />
            </button>

            <button
              className={`rail-icon-btn ${activeTab === 'learning' ? 'active' : ''}`}
              onClick={() => handleTabClick('learning')}
              title="Learning & Skills"
              aria-label="Learning"
            >
              <Brain size={19} />
            </button>

            <button
              className={`rail-icon-btn ${activeTab === 'docs' ? 'active' : ''}`}
              onClick={() => handleTabClick('docs')}
              title="Documents"
              aria-label="Documents"
            >
              <FileText size={19} />
            </button>

            <button
              className={`rail-icon-btn ${activeTab === 'tools' ? 'active' : ''}`}
              onClick={() => handleTabClick('tools')}
              title="Tools"
              aria-label="Tools"
            >
              <Wrench size={19} />
            </button>

            <button
              className={`rail-icon-btn ${activeTab === 'plugins' ? 'active' : ''}`}
              onClick={() => handleTabClick('plugins')}
              title="Plugins"
              aria-label="Plugins"
            >
              <Plug size={19} />
            </button>
          </div>
        </div>

        <div className="rail-bottom">
          <button className="rail-icon-btn" title="Help & Settings" aria-label="Help">
            <HelpCircle size={19} />
          </button>
        </div>
      </nav>

      {/* 2. Secondary Content Panel */}
      <aside className={`sidebar-container ${!isLeftSidebarVisible ? 'hidden' : ''}`}>
        {/* View Mode 1: CHATS (Bot Icon) */}
        {activeTab === 'chats' && (
          <>
            <div className="sidebar-header">
              <span className="brand-name">Gohard</span>
              <button
                className="sidebar-toggle-btn"
                title="Collapse Sidebar"
                onClick={onToggleSidebar}
              >
                <PanelLeftClose size={18} />
              </button>
            </div>

            <div className="sidebar-action-area">
              <button className="new-chat-btn" onClick={onNewChat}>
                <Plus size={18} />
                <span>New Chat</span>
              </button>
            </div>

            <div className="chats-section">
              <div className="chats-header">
                <span className="chats-title">CHATS</span>
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
          </>
        )}

        {/* View Mode 2: LEARNING & SKILLS (Brain Icon) */}
        {activeTab === 'learning' && (
          <>
            {/* Case A: Overview Skills List */}
            {!selectedSkill && (
              <>
                <div className="sidebar-header">
                  <span className="brand-name">Gohard</span>
                  <button
                    className="sidebar-toggle-btn"
                    title="Collapse Sidebar"
                    onClick={onToggleSidebar}
                  >
                    <PanelLeftClose size={18} />
                  </button>
                </div>

                <div className="sidebar-action-area">
                  <button className="new-chat-btn" onClick={() => { }}>
                    <Plus size={18} />
                    <span>New Skill</span>
                  </button>
                </div>

                <div className="skills-section">
                  <div className="chats-header">
                    <span className="chats-title">MY SKILLS</span>
                  </div>

                  <div className="skills-list">
                    {SAMPLE_SKILLS.map((skill) => (
                      <div
                        key={skill.id}
                        className="skill-card"
                        onClick={() => setSelectedSkillId(skill.id)}
                      >
                        <div className={`skill-icon-box ${skill.colorClass}`}>
                          {skill.icon}
                        </div>

                        <div className="skill-card-content">
                          <div className="skill-card-top-row">
                            <span className="skill-card-title">{skill.title}</span>
                            <ChevronRight size={16} className="skill-chevron" />
                          </div>
                          <span className={`skill-status-text ${skill.colorClass}`}>
                            {skill.statusText}
                          </span>
                          <div className="skill-progress-bar-bg">
                            <div
                              className={`skill-progress-bar-fill ${skill.colorClass}`}
                              style={{ width: `${skill.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="recently-accessed-section">
                    <span className="chats-title">RECENTLY ACCESSED</span>
                    <div
                      className="recent-skill-card"
                      onClick={() => setSelectedSkillId('skill-1')}
                    >
                      <div className="skill-icon-box gray">
                        <GraduationCap size={18} />
                      </div>
                      <div className="skill-card-content">
                        <div className="skill-card-top-row">
                          <span className="skill-card-title">AI Engineering</span>
                          <ChevronRight size={16} className="skill-chevron" />
                        </div>
                        <span className="recent-subtitle">Continue learning</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Case B: Selected Skill Detail View */}
            {selectedSkill && (
              <>
                <div className="sidebar-header-back-row">
                  <button
                    className="back-skills-btn"
                    onClick={() => setSelectedSkillId(null)}
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Skills</span>
                  </button>
                </div>

                {/* Course Header Card matching skill's color theme */}
                <div className={`course-detail-header-card ${selectedSkill.colorClass}`}>
                  <div className={`skill-icon-box ${selectedSkill.colorClass}`}>
                    {selectedSkill.icon}
                  </div>
                  <div className="course-detail-header-info">
                    <span className="course-detail-title">{selectedSkill.title}</span>
                    <span className={`skill-status-text ${selectedSkill.colorClass}`}>
                      {selectedSkill.statusText}
                    </span>
                    <div className="skill-progress-bar-bg">
                      <div
                        className={`skill-progress-bar-fill ${selectedSkill.colorClass}`}
                        style={{ width: `${selectedSkill.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Modules Section (Clean List, like Chats) */}
                <div className="chats-section">
                  <div className="chats-header">
                    <span className="chats-title">MODULES</span>
                  </div>

                  <div className="modules-clean-list">
                    {selectedSkill.modules.map((mod) => {
                      const isExpanded = expandedModuleIds[mod.id] !== false;

                      return (
                        <div key={mod.id} className="clean-module-group">
                          {/* Module Header */}
                          <div
                            className="clean-module-header"
                            onClick={() => toggleModuleExpand(mod.id)}
                          >
                            <button className="module-chevron-btn">
                              {isExpanded ? (
                                <ChevronDown size={15} />
                              ) : (
                                <ChevronRight size={15} />
                              )}
                            </button>
                            <span className="clean-module-title">{mod.title}</span>
                          </div>

                          {/* Lessons (Indented Clean Chat Items) */}
                          {isExpanded && (
                            <div className="clean-lessons-list">
                              {mod.lessons.map((les) => (
                                <div
                                  key={les.id}
                                  className={`chat-item ${les.id === activeLessonId ? 'active' : ''
                                    }`}
                                  onClick={() => setActiveLessonId(les.id)}
                                >
                                  <span className="chat-title">{les.title}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="status-card">
            <span className="status-dot" />
            <div className="status-info">
              <span className="status-label">Connected</span>
              <span className="status-model">{getModelDisplayName(selectedModel)}</span>
            </div>
            <button className="status-settings-btn" title="Connection Settings">
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
