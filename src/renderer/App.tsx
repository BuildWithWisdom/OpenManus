import React, { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { WelcomeState } from './components/WelcomeState';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { ChatMessage, Conversation, ThemeMode } from './types';
import './theme.css';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [selectedModel, setSelectedModel] = useState<string>('GPT-5.5');

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'conv-1',
      title: 'New Conversation',
      timestamp: 'Just now',
      messages: [],
    },
  ]);

  const [activeId, setActiveId] = useState<string>('conv-1');

  const toggleTheme = (): void => {
    setTheme((previousTheme) => (previousTheme === 'dark' ? 'light' : 'dark'));
  };

  const currentConversation = conversations.find((c) => c.id === activeId) || conversations[0];

  const handleSendMessage = (text: string): void => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setConversations((previous) =>
      previous.map((conv) => {
        if (conv.id === activeId) {
          const updatedMessages = [...conv.messages, userMsg];
          const newTitle = conv.messages.length === 0 ? text.slice(0, 24) : conv.title;
          return {
            ...conv,
            title: newTitle,
            messages: updatedMessages,
          };
        }
        return conv;
      })
    );
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

        <div className="content-body">
          {currentConversation.messages.length === 0 ? (
            <WelcomeState onSelectPrompt={handleSendMessage} />
          ) : (
            <MessageList messages={currentConversation.messages} />
          )}
        </div>

        <ChatInput
          onSendMessage={handleSendMessage}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
        />
      </div>
    </div>
  );
};

export default App;
