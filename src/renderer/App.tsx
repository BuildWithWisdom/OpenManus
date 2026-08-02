import React, { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatHeaderBar, TurnItem } from './components/ChatHeaderBar';
import { RightSidebar } from './components/RightSidebar';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { ChatMessage, Conversation, ThemeMode } from './types';
import './theme.css';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [selectedModel, setSelectedModel] = useState<string>('deepseek-ai/deepseek-v4-pro');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [showRightSidebar, setShowRightSidebar] = useState<boolean>(false);
  const [showLeftSidebar, setShowLeftSidebar] = useState<boolean>(true);
  const [activeTurnIndex, setActiveTurnIndex] = useState<number>(0);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const activeRequestIdRef = useRef<string | null>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);

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
      messages: [],
    }),
    []
  );

  const currentConversation = conversations.find((c) => c.id === activeId) || conversations[0] || defaultEmptyConv;

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

  useEffect(() => {
    if (!window.electronAPI) return;

    const cleanupToken = window.electronAPI.onTokenChunk(({ requestId, chunk }) => {
      setConversations((previous) =>
        previous.map((conv) => {
          const hasTargetMessage = conv.messages.some((m) => m.id === `msg-reply-${requestId}`);
          if (!hasTargetMessage) return conv;

          return {
            ...conv,
            messages: conv.messages.map((msg) => {
              if (msg.id === `msg-reply-${requestId}`) {
                return {
                  ...msg,
                  content: msg.content + chunk,
                };
              }
              return msg;
            }),
          };
        })
      );
    });

    const cleanupComplete = window.electronAPI.onStreamComplete(({ requestId }) => {
      if (activeRequestIdRef.current === requestId) {
        setIsLoading(false);
        setIsStreaming(false);
        activeRequestIdRef.current = null;
      }
    });

    const cleanupError = window.electronAPI.onStreamError(({ requestId, error }) => {
      if (activeRequestIdRef.current === requestId) {
        setIsLoading(false);
        setIsStreaming(false);
        activeRequestIdRef.current = null;
      }

      setConversations((previous) =>
        previous.map((conv) => {
          const hasTargetMessage = conv.messages.some((m) => m.id === `msg-reply-${requestId}`);
          if (!hasTargetMessage) return conv;

          return {
            ...conv,
            messages: conv.messages.map((msg) => {
              if (msg.id === `msg-reply-${requestId}`) {
                return {
                  ...msg,
                  content: msg.content
                    ? `${msg.content}\n\n*[Stream Error: ${error}]*`
                    : `Error connecting to AI Provider: ${error}`,
                };
              }
              return msg;
            }),
          };
        })
      );
    });

    return () => {
      cleanupToken();
      cleanupComplete();
      cleanupError();
    };
  }, []);

  const handleAbortStream = useCallback(async (): Promise<void> => {
    if (activeRequestIdRef.current) {
      const currentReqId = activeRequestIdRef.current;
      if (window.electronAPI?.abortStream) {
        await window.electronAPI.abortStream(currentReqId);
      }
      setConversations((previous) =>
        previous.map((conv) => {
          const hasTargetMessage = conv.messages.some((m) => m.id === `msg-reply-${currentReqId}`);
          if (!hasTargetMessage) return conv;

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
      setIsLoading(false);
      setIsStreaming(false);
      activeRequestIdRef.current = null;
    }
  }, []);

  const handleSendMessage = useCallback(
    async (text: string): Promise<void> => {
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp,
      };

      let currentConvId = activeId;
      if (!currentConvId) {
        currentConvId = `conv-${Date.now()}`;
        setActiveId(currentConvId);
      }

      const existingConv = conversations.find((c) => c.id === currentConvId);
      const existingMessages = existingConv ? existingConv.messages : [];
      const updatedHistory = [...existingMessages, userMsg];

      const apiPayload = updatedHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const requestId = `req-${Date.now()}`;
      activeRequestIdRef.current = requestId;

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

      setIsLoading(true);
      setIsStreaming(true);

      try {
        if (window.electronAPI?.streamMessageToLLM) {
          await window.electronAPI.streamMessageToLLM(requestId, apiPayload, selectedModel);
        } else if (window.electronAPI?.sendMessageToLLM) {
          const response = await window.electronAPI.sendMessageToLLM(apiPayload, selectedModel);
          setConversations((previous) =>
            previous.map((conv) => {
              if (conv.id === currentConvId) {
                return {
                  ...conv,
                  messages: conv.messages.map((m) =>
                    m.id === `msg-reply-${requestId}` ? { ...m, content: response.message } : m
                  ),
                };
              }
              return conv;
            })
          );
          setIsLoading(false);
          setIsStreaming(false);
        } else {
          setConversations((previous) =>
            previous.map((conv) => {
              if (conv.id === currentConvId) {
                return {
                  ...conv,
                  messages: conv.messages.map((m) =>
                    m.id === `msg-reply-${requestId}`
                      ? { ...m, content: 'Electron API bridge not available.' }
                      : m
                  ),
                };
              }
              return conv;
            })
          );
          setIsLoading(false);
          setIsStreaming(false);
        }
      } catch (err: any) {
        setConversations((previous) =>
          previous.map((conv) => {
            if (conv.id === currentConvId) {
              return {
                ...conv,
                messages: conv.messages.map((m) =>
                  m.id === `msg-reply-${requestId}`
                    ? { ...m, content: `Error streaming message: ${err?.message || 'Unknown error'}` }
                    : m
                ),
              };
            }
            return conv;
          })
        );
        setIsLoading(false);
        setIsStreaming(false);
      }
    },
    [activeId, conversations, selectedModel]
  );

  const handleNewChat = useCallback((): void => {
    const newConvId = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id: newConvId,
      title: 'New Chat',
      timestamp: 'Just now',
      messages: [],
    };
    setConversations((previous) => [newConv, ...previous]);
    setActiveId(newConvId);
    setActiveTurnIndex(0);
  }, []);

  const activeTurnAssistantMessage = useMemo(() => {
    const userMsgs = currentConversation.messages.filter((m) => m.role === 'user');
    if (userMsgs.length === 0) {
      return [...currentConversation.messages].reverse().find((m) => m.role === 'assistant');
    }
    const targetUserMsg = userMsgs[activeTurnIndex] || userMsgs[userMsgs.length - 1];
    if (!targetUserMsg) return undefined;
    const targetIdx = currentConversation.messages.indexOf(targetUserMsg);
    if (targetIdx !== -1 && currentConversation.messages[targetIdx + 1]?.role === 'assistant') {
      return currentConversation.messages[targetIdx + 1];
    }
    return undefined;
  }, [currentConversation.messages, activeTurnIndex]);

  const handleSelectHeading = useCallback((headingId: string): void => {
    const elem = document.getElementById(headingId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveId(id);
    setActiveTurnIndex(0);
  }, []);

  return (
    <div className="app-layout" data-theme={theme}>
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        selectedModel={selectedModel}
        isLeftSidebarVisible={showLeftSidebar}
        onToggleSidebar={handleToggleLeftSidebar}
      />

      <div className="main-content">
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          isLeftSidebarVisible={showLeftSidebar}
          onToggleLeftSidebar={handleToggleLeftSidebar}
        />

        <div className="main-workspace-area">
          <div className="chat-workspace-card">
            <ChatHeaderBar
              title={currentConversation.title}
              turns={turns}
              activeTurnIndex={activeTurnIndex}
              onSelectTurn={handleSelectTurn}
              onToggleContents={handleToggleContents}
              hasMessages={currentConversation.messages.length > 0}
            />

            <div className="chat-card-body" ref={chatBodyRef}>
              <MessageList
                messages={currentConversation.messages}
                isLoading={isLoading}
                onSelectPrompt={handleSendMessage}
              />
            </div>

            <ChatInput
              onSendMessage={handleSendMessage}
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
              disabled={isLoading && !isStreaming}
              isStreaming={isStreaming}
              onAbort={handleAbortStream}
            />
          </div>

          <RightSidebar
            isVisible={showRightSidebar}
            onClose={handleToggleContents}
            latestMessageContent={activeTurnAssistantMessage?.content}
            onSelectHeading={handleSelectHeading}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
