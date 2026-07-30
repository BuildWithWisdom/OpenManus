import React, { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatHeaderBar } from './components/ChatHeaderBar';
import { RightSidebar } from './components/RightSidebar';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { ChatMessage, Conversation, ThemeMode } from './types';
import './theme.css';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [selectedModel, setSelectedModel] = useState<string>('step-3.7-flash');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showRightSidebar, setShowRightSidebar] = useState<boolean>(true);

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'conv-1',
      title: 'Explain embeddings',
      timestamp: 'Just now',
      messages: [],
    },
  ]);

  const [activeId, setActiveId] = useState<string>('conv-1');

  const toggleTheme = (): void => {
    setTheme((previousTheme) => (previousTheme === 'dark' ? 'light' : 'dark'));
  };

  const currentConversation = conversations.find((c) => c.id === activeId) || conversations[0];

  const handleSendMessage = async (text: string): Promise<void> => {
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
          const newTitle = conv.messages.length === 0 ? text.slice(0, 24) : conv.title;
          return {
            ...conv,
            title: newTitle,
            messages: updatedHistory,
          };
        }
        return conv;
      })
    );

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
  };

  const handleNewChat = (): void => {
    const newConvId = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id: newConvId,
      title: 'New Conversation',
      timestamp: 'Just now',
      messages: [],
    };
    setConversations((previous) => [newConv, ...previous]);
    setActiveId(newConvId);
  };

  return (
    <div className="app-layout" data-theme={theme}>
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={setActiveId}
        onNewChat={handleNewChat}
        selectedModel={selectedModel}
      />

      <div className="main-content">
        <Header theme={theme} onToggleTheme={toggleTheme} />

        <div className="main-workspace-area">
          <div className="chat-workspace-card">
            <ChatHeaderBar
              title={currentConversation.title}
              onToggleContents={() => setShowRightSidebar(!showRightSidebar)}
            />

            <div className="chat-card-body">
              <MessageList messages={currentConversation.messages} isLoading={isLoading} />
            </div>

            <ChatInput
              onSendMessage={handleSendMessage}
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
              disabled={isLoading}
            />
          </div>

          {showRightSidebar && (
            <RightSidebar onClose={() => setShowRightSidebar(false)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
