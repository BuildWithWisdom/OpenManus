import React, { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { ChatHeaderBar, TurnItem } from './components/ChatHeaderBar';
import { RightSidebar } from './components/RightSidebar';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { CourseCreationModal } from './components/CourseCreationModal';
import { LessonWorkspace } from './components/LessonWorkspace';
import { AnimationPreviewPage } from './components/preview/AnimationPreviewPage';
import { AuthScreen } from './components/AuthScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatMessage, Conversation, ThemeMode } from './types';
import { getModelById } from './models';
import { streamLLMMessage, fetchUserConversations } from './services/llmService';
import { fetchUserCourses, UserCourseSummary } from './services/courseService';
import './theme.css';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [selectedModel, setSelectedModel] = useState<string>('nvidia/nemotron-3-nano-30b-a3b');
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [streamingMap, setStreamingMap] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [showRightSidebar, setShowRightSidebar] = useState<boolean>(false);
  const [showLeftSidebar, setShowLeftSidebar] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const [activeTurnIndex, setActiveTurnIndex] = useState<number>(0);

  const [showAuthGate, setShowAuthGate] = useState<boolean>(false);
  const [guestMsgCount, setGuestMsgCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    return parseInt(localStorage.getItem('openmanus_guest_msg_count') || '0', 10);
  });
  const [activeTab, setActiveTab] = useState<'chats' | 'learning' | 'docs' | 'tools' | 'plugins'>('chats');
  const [userCourses, setUserCourses] = useState<UserCourseSummary[]>([]);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [showAnimationPreview, setShowAnimationPreview] = useState<boolean>(false);
  const [activeCourseId, setActiveCourseId] = useState<string>('');
  const [activeLessonId, setActiveLessonId] = useState<string>('');
  const [activeLessonMarkdown, setActiveLessonMarkdown] = useState<string>('');
  const [lessonCache, setLessonCache] = useState<Record<string, string>>({});

  const handleLessonContentLoaded = useCallback((markdown: string) => {
    setActiveLessonMarkdown(markdown);
    if (activeLessonId && markdown) {
      setLessonCache((prev) => ({ ...prev, [activeLessonId]: markdown }));
    }
  }, [activeLessonId]);

  const handleLessonGenerated = useCallback((generatedLessonId: string, markdown: string) => {
    if (generatedLessonId && markdown) {
      setLessonCache((prev) => ({ ...prev, [generatedLessonId]: markdown }));
    }
    setUserCourses((prevCourses) =>
      prevCourses.map((course) => ({
        ...course,
        modules: course.modules?.map((mod) => ({
          ...mod,
          lessons: mod.lessons?.map((les) =>
            les.id === generatedLessonId ? { ...les, hasContent: true } : les
          ),
        })),
      }))
    );
  }, []);

  const loadCourses = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    try {
      const courses = await fetchUserCourses(user.id);
      setUserCourses(courses);
    } catch (err) {
      console.warn('[App] Failed to load user courses:', err);
    }
  }, [user?.id, isAuthenticated]);

  const loadConversations = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    try {
      const convs = await fetchUserConversations(user.id);
      if (convs && convs.length > 0) {
        setConversations(convs);
      } else {
        setConversations([]);
      }
    } catch (err) {
      console.warn('[App] Failed to load saved conversations:', err);
    }
  }, [user?.id, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadCourses();
      loadConversations();
    }
  }, [isAuthenticated, user?.id, loadCourses, loadConversations]);

  useEffect(() => {
    const handleResize = () => {
      const mobileState = window.innerWidth < 768;
      setIsMobile(mobileState);
      if (mobileState) {
        setShowLeftSidebar(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  const activeId = useMemo(() => {
    const match = location.pathname.match(/^\/chat\/(.+)$/);
    return match ? decodeURIComponent(match[1]) : '';
  }, [location.pathname]);

  useEffect(() => {
    const lessonMatch = location.pathname.match(/^\/course\/([^/]+)\/lesson\/([^/]+)$/);
    if (lessonMatch) {
      const cId = decodeURIComponent(lessonMatch[1]);
      const lId = decodeURIComponent(lessonMatch[2]);
      setActiveCourseId(cId);
      setActiveLessonId(lId);
      setActiveTab('learning');
    }
  }, [location.pathname]);

  const activeRequestIdRef = useRef<Record<string, string>>({});
  const chatBodyRef = useRef<HTMLDivElement>(null);

  const isLoading = Boolean(loadingMap[activeId]);
  const isStreaming = Boolean(streamingMap[activeId]);

  const toggleTheme = useCallback((): void => {
    setTheme((previousTheme) => (previousTheme === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleToggleLeftSidebar = useCallback((): void => {
    setShowLeftSidebar((prev) => !prev);
  }, []);

  const defaultEmptyConv: Conversation = useMemo(
    () => ({
      id: '',
      title: 'New Chat',
      timestamp: '',
      messages: [] as ChatMessage[],
    }),
    []
  );

  const currentConversation = useMemo(() => {
    if (!activeId) {
      return defaultEmptyConv;
    }
    const found = conversations.find((c) => c.id === activeId);
    if (found) {
      return found;
    }
    return {
      id: activeId,
      title: 'New Chat',
      timestamp: '',
      messages: [] as ChatMessage[],
    };
  }, [activeId, conversations, defaultEmptyConv]);

  const turns = useMemo<TurnItem[]>(() => {
    const userMsgs = currentConversation.messages.filter((m) => m.role === 'user');
    if (userMsgs.length === 0) {
      return [{ id: 'demo-0', index: 0, title: currentConversation.title || 'New Chat' }];
    }
    return userMsgs.map((m, idx) => ({
      id: m.id,
      index: idx,
      title: m.content.length > 40 ? `${m.content.slice(0, 40)}...` : m.content,
    }));
  }, [currentConversation.messages, currentConversation.title]);

  const handleSelectTurn = useCallback((turnIndex: number): void => {
    setActiveTurnIndex(turnIndex);
    const elem = document.getElementById(`turn-${turnIndex}`);
    const scrollContainer = document.querySelector('.messages-container') as HTMLElement | null;
    if (elem && scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const elementRect = elem.getBoundingClientRect();
      const targetScrollTop = elementRect.top - containerRect.top + scrollContainer.scrollTop;
      scrollContainer.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
    }
  }, []);

  const handleToggleContents = useCallback((): void => {
    setShowRightSidebar((prev) => !prev);
  }, []);

  const prevIsLoadingRef = useRef<boolean>(false);
  useLayoutEffect(() => {
    if (isLoading && !prevIsLoadingRef.current) {
      const userMessages = currentConversation.messages.filter((m) => m.role === 'user');
      if (userMessages.length > 0) {
        const latestTurnIndex = userMessages.length - 1;
        const turnElement = document.getElementById(`turn-${latestTurnIndex}`);
        const scrollContainer = document.querySelector('.messages-container') as HTMLElement | null;

        if (turnElement && scrollContainer) {
          requestAnimationFrame(() => {
            const containerRect = scrollContainer.getBoundingClientRect();
            const elementRect = turnElement.getBoundingClientRect();
            const styles = window.getComputedStyle(scrollContainer);
            const paddingTop = parseFloat(styles.paddingTop) || 0;
            const targetScrollTop = elementRect.top - containerRect.top + scrollContainer.scrollTop - paddingTop;
            scrollContainer.scrollTo({ top: targetScrollTop, behavior: 'instant' });
          });
        }
      }
    }
    prevIsLoadingRef.current = isLoading;
  }, [isLoading, currentConversation.messages]);

  const handleAbortStream = useCallback(async (): Promise<void> => {
    const currentReqId = activeRequestIdRef.current[activeId];
    if (currentReqId) {
      setConversations((previous) =>
        previous.map((conv) => {
          if (conv.id !== activeId) return conv;
          return {
            ...conv,
            messages: conv.messages.map((msg) => {
              if (msg.id === `msg-reply-${currentReqId}` && !msg.content) {
                return {
                  ...msg,
                  content: '*[Response stopped]*',
                };
              }
              return msg;
            }),
          };
        })
      );
      delete activeRequestIdRef.current[activeId];
      setLoadingMap((prev) => ({ ...prev, [activeId]: false }));
      setStreamingMap((prev) => ({ ...prev, [activeId]: false }));
    }
  }, [activeId]);

  const handleSendMessage = useCallback(
    async (text: string): Promise<void> => {
      if (!isAuthenticated && guestMsgCount >= 1) {
        navigate('/login');
        return;
      }

      if (!isAuthenticated && guestMsgCount === 0) {
        setGuestMsgCount(1);
        localStorage.setItem('openmanus_guest_msg_count', '1');
      }

      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp,
      };

      let currentConvId = activeId;
      const isNewChat = !currentConvId;
      if (isNewChat) {
        currentConvId = `conv-${crypto.randomUUID()}`;
        navigate(`/chat/${currentConvId}`, { replace: true });
      }

      setLoadingMap((prev) => ({ ...prev, [currentConvId]: true }));
      setStreamingMap((prev) => ({ ...prev, [currentConvId]: false }));

      const existingConv = conversations.find((c) => c.id === currentConvId);
      const existingMessages = existingConv ? existingConv.messages : [];
      const updatedHistory = [...existingMessages, userMsg];

      const apiPayload = updatedHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const requestId = `req-${Date.now()}`;
      activeRequestIdRef.current[currentConvId] = requestId;

      const assistantMsg: ChatMessage = {
        id: `msg-reply-${requestId}`,
        role: 'assistant',
        content: '',
        timestamp,
      };

      setConversations((previous) => {
        const activeExists = previous.some((c) => c.id === currentConvId);
        if (!activeExists || previous.length === 0) {
          const newConv: Conversation = {
            id: currentConvId,
            title: text.slice(0, 32),
            timestamp,
            messages: [...updatedHistory, assistantMsg],
          };
          return [newConv, ...previous];
        }

        return previous.map((conv) => {
          if (conv.id === currentConvId) {
            const newTitle = conv.messages.length === 0 ? text.slice(0, 32) : conv.title;
            return {
              ...conv,
              title: newTitle,
              messages: [...updatedHistory, assistantMsg],
            };
          }
          return conv;
        });
      });

      const newTurnIndex = updatedHistory.filter((m) => m.role === 'user').length - 1;
      setActiveTurnIndex(Math.max(0, newTurnIndex));

      try {
        const modelObj = getModelById(selectedModel);
        await streamLLMMessage(
          requestId,
          apiPayload,
          selectedModel,
          modelObj?.providerSlug,
          {
            onChunk: (chunk: string) => {
              setLoadingMap((prev) => ({ ...prev, [currentConvId]: false }));
              setStreamingMap((prev) => ({ ...prev, [currentConvId]: true }));
              setConversations((previous) =>
                previous.map((conv) => {
                  if (conv.id === currentConvId) {
                    const hasAssistantMsg = conv.messages.some((m) => m.id === `msg-reply-${requestId}`);
                    if (!hasAssistantMsg) {
                      return {
                        ...conv,
                        messages: [
                          ...conv.messages,
                          {
                            id: `msg-reply-${requestId}`,
                            role: 'assistant',
                            content: chunk,
                            timestamp,
                          },
                        ],
                      };
                    }
                    return {
                      ...conv,
                      messages: conv.messages.map((m) =>
                        m.id === `msg-reply-${requestId}` ? { ...m, content: m.content + chunk } : m
                      ),
                    };
                  }
                  return conv;
                })
              );
            },
            onComplete: () => {
              setLoadingMap((prev) => ({ ...prev, [currentConvId]: false }));
              setStreamingMap((prev) => ({ ...prev, [currentConvId]: false }));
              delete activeRequestIdRef.current[currentConvId];
            },
            onError: (error: string) => {
              setConversations((previous) =>
                previous.map((conv) => {
                  if (conv.id === currentConvId) {
                    return {
                      ...conv,
                      messages: conv.messages.map((m) =>
                        m.id === `msg-reply-${requestId}`
                          ? {
                              ...m,
                              content: m.content
                                ? `${m.content}\n\n*[Stream Error: ${error}]*`
                                : `Error connecting to AI Provider: ${error}`,
                            }
                          : m
                      ),
                    };
                  }
                  return conv;
                })
              );
              setLoadingMap((prev) => ({ ...prev, [currentConvId]: false }));
              setStreamingMap((prev) => ({ ...prev, [currentConvId]: false }));
              delete activeRequestIdRef.current[currentConvId];
            },
          },
          'default',
          currentConvId
        );
      } catch (err: any) {
        setConversations((previous) =>
          previous.map((conv) => {
            if (conv.id === currentConvId) {
              return {
                ...conv,
                messages: conv.messages.map((m) =>
                  m.id === `msg-reply-${requestId}`
                    ? {
                        ...m,
                        content: `Error connecting to AI Provider: ${err?.message || 'Connection failed'}`,
                      }
                    : m
                ),
              };
            }
            return conv;
          })
        );
        setLoadingMap((prev) => ({ ...prev, [currentConvId]: false }));
        setStreamingMap((prev) => ({ ...prev, [currentConvId]: false }));
        delete activeRequestIdRef.current[currentConvId];
      }
    },
    [activeId, conversations, selectedModel, navigate, isAuthenticated, guestMsgCount]
  );

  const handleNewChat = useCallback((): void => {
    setActiveTab('chats');
    setActiveLessonId('');
    navigate('/');
    setActiveTurnIndex(0);
    if (isMobile) {
      setShowLeftSidebar(false);
    }
  }, [navigate, isMobile]);

  const handleSelectLesson = useCallback(
    (courseId: string, lessonId: string) => {
      setActiveCourseId(courseId);
      setActiveLessonId(lessonId);
      setActiveTab('learning');
      setActiveLessonMarkdown(lessonCache[lessonId] || '');
      navigate(`/course/${courseId}/lesson/${lessonId}`);
      if (isMobile) {
        setShowLeftSidebar(false);
      }
    },
    [navigate, isMobile, lessonCache]
  );

  const handleCourseCreated = useCallback(
    async () => {
      try {
        const courses = await fetchUserCourses('user-default');
        setUserCourses(courses);
      } catch (err) {
        console.error('[App] Error refreshing user courses:', err);
      }
    },
    []
  );

  const activeTurnAssistantMessage = useMemo(() => {
    const userMsgs = currentConversation.messages.filter((m) => m.role === 'user');
    if (userMsgs.length === 0) {
      return [...currentConversation.messages].reverse().find((m) => m.role === 'assistant');
    }
    const targetUserMsg = userMsgs[activeTurnIndex] || userMsgs[userMsgs.length - 1];
    if (!targetUserMsg) return undefined;
    const targetIdx = currentConversation.messages.findIndex((m) => m.id === targetUserMsg.id);
    if (targetIdx !== -1 && currentConversation.messages[targetIdx + 1]?.role === 'assistant') {
      return currentConversation.messages[targetIdx + 1];
    }
    return undefined;
  }, [currentConversation.messages, activeTurnIndex]);

  const handleSelectHeading = useCallback(
    (headingId: string): void => {
      const elem = document.getElementById(headingId);
      if (!elem) return;

      const scrollContainer = document.querySelector('.messages-container') as HTMLElement | null;

      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = elem.getBoundingClientRect();
        const headerOffset = 16;
        const targetScrollTop = elementRect.top - containerRect.top + scrollContainer.scrollTop - headerOffset;
        scrollContainer.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      } else {
        elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      if (isMobile) {
        setShowRightSidebar(false);
      }
    },
    [isMobile]
  );

  const handleSelectConversation = useCallback(
    (id: string) => {
      setActiveTab('chats');
      setActiveLessonId('');
      navigate(`/chat/${id}`);
      setActiveTurnIndex(0);
      if (isMobile) {
        setShowLeftSidebar(false);
      }
    },
    [navigate, isMobile]
  );

  const handleCloseBackdrop = useCallback(() => {
    setShowLeftSidebar(false);
    setShowRightSidebar(false);
  }, []);

  const isAnyDrawerOpenOnMobile = isMobile && (showLeftSidebar || showRightSidebar);

  const activeLessonMeta = useMemo(() => {
    if (!activeLessonId || !userCourses?.length) return null;
    for (const course of userCourses) {
      if (!course.modules) continue;
      for (const mod of course.modules) {
        if (!mod.lessons) continue;
        const found = mod.lessons.find((l) => l.id === activeLessonId);
        if (found) return found;
      }
    }
    return null;
  }, [activeLessonId, userCourses]);

  const activeLessonTitle = useMemo(() => {
    return activeLessonMeta?.title || '';
  }, [activeLessonMeta]);

  if (isAuthLoading) {
    return null;
  }

  if (location.pathname === '/login' || (!isAuthenticated && showAuthGate)) {
    return <AuthScreen onClose={() => navigate('/')} />;
  }

  return (
    <div className="app-layout" data-theme={theme}>
      {isAnyDrawerOpenOnMobile && (
        <div
          className="mobile-drawer-backdrop"
          onClick={handleCloseBackdrop}
          aria-hidden="true"
        />
      )}

      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={(id) => {
          if (!isAuthenticated) {
            navigate('/login');
            return;
          }
          handleSelectConversation(id);
        }}
        onNewChat={handleNewChat}
        selectedModel={selectedModel}
        isLeftSidebarVisible={showLeftSidebar}
        onToggleSidebar={handleToggleLeftSidebar}
        userCourses={userCourses}
        onOpenCourseModal={() => {
          if (!isAuthenticated) {
            navigate('/login');
            return;
          }
          setIsCourseModalOpen(true);
        }}
        onSelectLesson={handleSelectLesson}
        activeLessonId={activeLessonId}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAuthModal={() => navigate('/login')}
      />

      <div className="main-content">
        <div className="main-workspace-area">
          <div className="chat-workspace-card">
            <ChatHeaderBar
              title={activeTab === 'learning' && activeLessonId ? (activeLessonTitle || 'Lesson View') : currentConversation.title}
              turns={activeTab === 'learning' && activeLessonId ? [] : turns}
              activeTurnIndex={activeTurnIndex}
              onSelectTurn={handleSelectTurn}
              onToggleContents={handleToggleContents}
              hasMessages={
                activeTab === 'learning' && activeLessonId
                  ? Boolean(activeLessonMarkdown || (activeLessonId && lessonCache[activeLessonId]) || activeLessonMeta?.hasContent)
                  : currentConversation.messages.length > 0
              }
              theme={theme}
              onToggleTheme={toggleTheme}
              isLeftSidebarVisible={showLeftSidebar}
              onToggleLeftSidebar={handleToggleLeftSidebar}
              onOpenAuthModal={() => navigate('/login')}
            />

            <div className="chat-card-body" ref={chatBodyRef}>
              {activeTab === 'learning' && activeLessonId ? (
                <LessonWorkspace
                  lessonId={activeLessonId}
                  selectedModel={selectedModel}
                  initialHasContent={activeLessonMeta ? activeLessonMeta.hasContent : undefined}
                  lessonTitle={activeLessonMeta ? activeLessonMeta.title : undefined}
                  cachedMarkdown={activeLessonId ? lessonCache[activeLessonId] : undefined}
                  onLessonContentLoaded={handleLessonContentLoaded}
                  onLessonGenerated={handleLessonGenerated}
                />
              ) : (
                <MessageList
                  messages={currentConversation.messages}
                  isLoading={isLoading}
                  isStreaming={isStreaming}
                  onSelectPrompt={handleSendMessage}
                />
              )}
            </div>

            <ChatInput
              onSendMessage={handleSendMessage}
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
              disabled={isLoading || isStreaming}
              isStreaming={isLoading || isStreaming}
              onAbort={handleAbortStream}
            />
          </div>

          <RightSidebar
            isVisible={showRightSidebar}
            onClose={handleToggleContents}
            latestMessageContent={
              activeTab === 'learning' && activeLessonId
                ? activeLessonMarkdown
                : activeTurnAssistantMessage?.content
            }
            onSelectHeading={handleSelectHeading}
          />
        </div>
      </div>

      <CourseCreationModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        onCourseCreated={handleCourseCreated}
        selectedModel={selectedModel}
        onOpenAnimationPreview={() => setShowAnimationPreview(true)}
      />

      {(showAnimationPreview || location.pathname === '/animation-preview') && (
        <AnimationPreviewPage
          onClose={() => {
            setShowAnimationPreview(false);
            if (location.pathname === '/animation-preview') {
              navigate('/');
            }
          }}
          onSelectWinningOption={(winner) => {
            console.log('[App] Selected winning animation option:', winner);
          }}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
