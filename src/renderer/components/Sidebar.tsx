import React, { useState, useEffect } from 'react';
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
  BookOpen,
} from 'lucide-react';
import OpenManusLogo from '../assets/OpenManusLogo';
import { Conversation } from '../types';
import { getModelDisplayName } from '../models';
import { UserCourseSummary } from '../services/courseService';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  selectedModel: string;
  isLeftSidebarVisible?: boolean;
  onToggleSidebar?: () => void;
  userCourses?: UserCourseSummary[];
  onOpenCourseModal?: () => void;
  onSelectLesson?: (courseId: string, lessonId: string) => void;
  activeLessonId?: string;
  activeTab?: 'chats' | 'learning' | 'docs' | 'tools' | 'plugins';
  onTabChange?: (tab: 'chats' | 'learning' | 'docs' | 'tools' | 'plugins') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  selectedModel,
  isLeftSidebarVisible = true,
  onToggleSidebar,
  userCourses = [],
  onOpenCourseModal,
  onSelectLesson,
  activeLessonId = '',
  activeTab = 'chats',
  onTabChange,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [expandedModuleIds, setExpandedModuleIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (activeLessonId && userCourses?.length > 0) {
      for (const course of userCourses) {
        if (!course.modules) continue;
        for (const mod of course.modules) {
          if (!mod.lessons) continue;
          if (mod.lessons.some((l) => l.id === activeLessonId)) {
            setSelectedCourseId(course.id);
            return;
          }
        }
      }
    }
  }, [activeLessonId, userCourses]);

  const displayCourses = userCourses;
  const selectedCourse = displayCourses.find((c) => c.id === selectedCourseId);

  const toggleModuleExpand = (moduleId: string) => {
    setExpandedModuleIds((prev) => ({
      ...prev,
      [moduleId]: prev[moduleId] === false ? true : false,
    }));
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const COMING_SOON_LABELS: Record<string, string> = {
    docs: 'Documents',
    tools: 'Tools',
    plugins: 'Plugins',
    help: 'Help & Settings',
  };

  const showComingSoonToast = (featureKey: string) => {
    const label = COMING_SOON_LABELS[featureKey] || featureKey;
    setToastMessage(`${label} are coming to Gohard soon`);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 2500);
  };

  const handleTabClick = (tab: 'chats' | 'learning' | 'docs' | 'tools' | 'plugins') => {
    if (tab === 'docs' || tab === 'tools' || tab === 'plugins') {
      showComingSoonToast(tab);
      return;
    }
    onTabChange?.(tab);
    if (!isLeftSidebarVisible) {
      onToggleSidebar?.();
    }
  };

  return (
    <div className="dual-sidebar-wrapper">
      {/* 1. Primary Navigation Rail */}
      <nav className="primary-nav-rail">
        <div className="rail-top">
          <button
            className={`rail-logo-btn ${!isLeftSidebarVisible ? 'can-expand' : ''}`}
            onClick={!isLeftSidebarVisible ? onToggleSidebar : undefined}
            title={isLeftSidebarVisible ? 'Gohard' : 'Expand Sidebar'}
            aria-label={isLeftSidebarVisible ? 'Gohard' : 'Expand Sidebar'}
          >
            <span className="logo-default">
              <OpenManusLogo size={25} />
            </span>
            {!isLeftSidebarVisible && (
              <span className="logo-hover-expand">
                <PanelLeftClose size={20} />
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
              <Bot size={20} />
            </button>

            <button
              className={`rail-icon-btn ${activeTab === 'learning' ? 'active' : ''}`}
              onClick={() => handleTabClick('learning')}
              title="Learning & Courses"
              aria-label="Learning"
            >
              <Brain size={20} />
            </button>

            <button
              className="rail-icon-btn"
              onClick={() => handleTabClick('docs')}
              title="Documents"
              aria-label="Documents"
            >
              <FileText size={20} />
            </button>

            <button
              className="rail-icon-btn"
              onClick={() => handleTabClick('tools')}
              title="Tools"
              aria-label="Tools"
            >
              <Wrench size={20} />
            </button>

            <button
              className="rail-icon-btn"
              onClick={() => handleTabClick('plugins')}
              title="Plugins"
              aria-label="Plugins"
            >
              <Plug size={20} />
            </button>
          </div>
        </div>

        <div className="rail-bottom">
          <button
            className="rail-icon-btn"
            title="Help & Settings"
            aria-label="Help"
            onClick={() => showComingSoonToast('help')}
          >
            <HelpCircle size={20} />
          </button>
        </div>
      </nav>

      {/* 2. Secondary Content Panel */}
      <aside className={`sidebar-container ${!isLeftSidebarVisible ? 'hidden' : ''}`}>
        {/* View Mode 1: CHATS */}
        {activeTab === 'chats' && (
          <>
            <div className="sidebar-header">
              <span className="brand-name">Gohard</span>
              <button
                className="sidebar-toggle-btn"
                title="Collapse Sidebar"
                onClick={onToggleSidebar}
              >
                <PanelLeftClose size={19} />
              </button>
            </div>

            <div className="sidebar-action-area">
              <button className="new-chat-btn" onClick={onNewChat}>
                <Plus size={19} />
                <span>New Chat</span>
              </button>
            </div>

            <div className="chats-section">
              <div className="chats-header">
                <span className="chats-title">CHATS</span>
                <button className="search-btn" title="Search chats">
                  <Search size={17} />
                </button>
              </div>

              <div className="chats-list">
                {conversations.map((chat) => (
                  <div
                    key={chat.id}
                    className={`chat-item ${chat.id === activeId ? 'active' : ''}`}
                    onClick={() => onSelectConversation(chat.id)}
                  >
                    <Bot size={17} className="chat-icon" />
                    <span className="chat-title">{chat.title}</span>
                    <button
                      className="chat-more-btn"
                      title="Options"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <MoreHorizontal size={17} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* View Mode 2: LEARNING & COURSES */}
        {activeTab === 'learning' && (
          <>
            {/* Case A: Courses List */}
            {!selectedCourse && (
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
                  <button className="new-chat-btn" onClick={onOpenCourseModal}>
                    <Plus size={18} />
                    <span>Create Skill</span>
                  </button>
                </div>

                <div className="skills-section">
                  <div className="chats-header">
                    <span className="chats-title">MY COURSES</span>
                  </div>

                  <div className="skills-list">
                    {displayCourses.map((course) => (
                      <div
                        key={course.id}
                        className="skill-card"
                        onClick={() => setSelectedCourseId(course.id)}
                      >
                        <div className="skill-icon-box green">
                          <GraduationCap size={18} />
                        </div>

                        <div className="skill-card-content">
                          <div className="skill-card-top-row">
                            <span className="skill-card-title">{course.title}</span>
                            <ChevronRight size={16} className="skill-chevron" />
                          </div>
                          <span className="skill-status-text green">
                            {course.totalLessons} Lessons
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Case B: Selected Course Detail View */}
            {selectedCourse && (
              <>
                <div className="sidebar-header-back-row">
                  <button
                    className="back-skills-btn"
                    onClick={() => setSelectedCourseId(null)}
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Courses</span>
                  </button>
                  <button
                    className="sidebar-toggle-btn"
                    title="Collapse Sidebar"
                    onClick={onToggleSidebar}
                  >
                    <PanelLeftClose size={18} />
                  </button>
                </div>

                <div className="course-detail-header-card green">
                  <div className="skill-icon-box green">
                    <GraduationCap size={18} />
                  </div>
                  <div className="course-detail-header-info">
                    <span className="course-detail-title">{selectedCourse.title}</span>
                    <span className="skill-status-text green">
                      {selectedCourse.totalLessons} Lessons
                    </span>
                  </div>
                </div>

                <div className="chats-section">
                  <div className="chats-header">
                    <span className="chats-title">MODULES</span>
                  </div>

                  <div className="modules-clean-list">
                    {selectedCourse.modules.map((mod) => {
                      const isExpanded = expandedModuleIds[mod.id] !== false;

                      return (
                        <div key={mod.id} className="clean-module-group">
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

                          {isExpanded && (
                            <div className="clean-lessons-list">
                              {mod.lessons.map((les) => (
                                <div
                                  key={les.id}
                                  className={`chat-item ${les.id === activeLessonId ? 'active' : ''}`}
                                  onClick={() => onSelectLesson?.(selectedCourse.id, les.id)}
                                >
                                  <BookOpen size={15} className="chat-icon" />
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
      </aside>

      {toastMessage && (
        <div className="sidebar-toast">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
