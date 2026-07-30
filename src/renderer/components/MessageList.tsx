import React, { useEffect, useRef } from 'react';
import OpenManusLogo from '../assets/OpenManusLogo';
import { ChatMessage } from '../types';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="messages-container">
      {messages.map((message) => (
        <div key={message.id} className={`message-row ${message.role}`}>
          {message.role === 'assistant' && (
            <div className="avatar-container">
              <OpenManusLogo size={24} />
            </div>
          )}

          <div className="message-bubble">
            <div className="message-content">{message.content}</div>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="message-row assistant">
          <div className="avatar-container">
            <OpenManusLogo size={24} />
          </div>
          <div className="message-bubble loading">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
