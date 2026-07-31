import React, { useState, useMemo, useCallback } from 'react';
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
  const [selectedModel, setSelectedModel] = useState<string>('step-3.7-flash');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showRightSidebar, setShowRightSidebar] = useState<boolean>(false);
  const [activeTurnIndex, setActiveTurnIndex] = useState<number>(0);

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'conv-1',
      title: 'New Conversation',
      timestamp: 'Just now',
      messages: [],
    },
  ]);

  const [activeId, setActiveId] = useState<string>('conv-1');

  const toggleTheme = useCallback((): void => {
    setTheme((previousTheme) => (previousTheme === 'dark' ? 'light' : 'dark'));
  }, []);

  const currentConversation = conversations.find((c) => c.id === activeId) || conversations[0];

  const turns = useMemo<TurnItem[]>(() => {
    const userMsgs = currentConversation.messages.filter((m) => m.role === 'user');
    if (userMsgs.length === 0) {
      return [{ id: 'demo-0', index: 0, title: 'New Conversation' }];
    }
    return userMsgs.map((m, idx) => ({
      id: m.id,
      index: idx,
      title: m.content.length > 40 ? `${m.content.slice(0, 40)}...` : m.content,
    }));
  }, [currentConversation.messages]);

  const handleSelectTurn = useCallback((turnIndex: number): void => {
    setActiveTurnIndex(turnIndex);
    const elem = document.getElementById(`turn-${turnIndex}`);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleToggleContents = useCallback((): void => {
    setShowRightSidebar((prev) => !prev);
  }, []);

  const handleSendMessage = useCallback(async (text: string): Promise<void> => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    let updatedHistory: ChatMessage[] = [];

    setConversations((previous) =>
      previous.map((conv) => {
        if (conv.id === activeId) {
          updatedHistory = [...conv.messages, userMsg];
          const newTitle = conv.messages.length === 0 ? text.slice(0, 32) : conv.title;
          return {
            ...conv,
            title: newTitle,
            messages: updatedHistory,
          };
        }
        return conv;
      })
    );

    const newTurnIndex = updatedHistory.filter((m) => m.role === 'user').length - 1;
    setActiveTurnIndex(Math.max(0, newTurnIndex));

    setIsLoading(true);

    try {
      const apiPayload = updatedHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      let assistantResponseText = '';

      if (window.electronAPI?.sendMessageToLLM) {
        const response = await window.electronAPI.sendMessageToLLM(apiPayload, selectedModel);
        assistantResponseText = response.message;
      } else {
        assistantResponseText = 'Electron API bridge not available.';
      }

      const assistantMsg: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        role: 'assistant',
        content: assistantResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setConversations((previous) =>
        previous.map((conv) => {
          if (conv.id === activeId) {
            return {
              ...conv,
              messages: [...conv.messages, assistantMsg],
            };
          }
          return conv;
        })
      );
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: `Error connecting to StepFun AI: ${err?.message || 'Unknown error'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setConversations((previous) =>
        previous.map((conv) => {
          if (conv.id === activeId) {
            return {
              ...conv,
              messages: [...conv.messages, errorMsg],
            };
          }
          return conv;
        })
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeId, selectedModel]);

  const handleNewChat = useCallback((): void => {
    const newConvId = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id: newConvId,
      title: 'New Conversation',
      timestamp: 'Just now',
      messages: [],
    };
    setConversations((previous) => [newConv, ...previous]);
    setActiveId(newConvId);
    setActiveTurnIndex(0);
  }, []);

  // Find assistant message for active turn
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
      />

      <div className="main-content">
        <Header theme={theme} onToggleTheme={toggleTheme} />

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

            <div className="chat-card-body">
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
              disabled={isLoading}
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
