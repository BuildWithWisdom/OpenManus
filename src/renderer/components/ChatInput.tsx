import React, { useState, useRef, KeyboardEvent } from 'react';
import { Paperclip, Box, Globe, ChevronDown, ArrowUp } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  disabled?: boolean;
}

const AVAILABLE_MODELS = ['step-3.7-flash', 'step-3.5-flash', 'step-1.5v', 'GPT-4o', 'Claude 3.5 Sonnet'];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  selectedModel,
  onSelectModel,
  disabled = false,
}) => {
  const [text, setText] = useState<string>('');
  const [showModelDropdown, setShowModelDropdown] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (): void => {
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setText(event.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  return (
    <div className="chat-input-wrapper">
      <div className="chat-input-box">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          rows={1}
          disabled={disabled}
          className="chat-textarea"
        />

        <div className="chat-input-toolbar">
          <div className="toolbar-left">
            <button className="tool-btn" title="Attach file" aria-label="Attach file">
              <Paperclip size={18} />
            </button>
            <button className="tool-btn" title="Plugins & Tools" aria-label="Plugins & Tools">
              <Box size={18} />
            </button>
            <button className="tool-btn" title="Web Search" aria-label="Web Search">
              <Globe size={18} />
            </button>
          </div>

          <div className="toolbar-right">
            <div className="model-dropdown-container">
              <button
                className="model-select-btn"
                onClick={() => setShowModelDropdown((previousState) => !previousState)}
              >
                <span>{selectedModel}</span>
                <ChevronDown size={14} />
              </button>

              {showModelDropdown && (
                <div className="model-dropdown-menu">
                  {AVAILABLE_MODELS.map((model) => (
                    <div
                      key={model}
                      className={`model-option ${model === selectedModel ? 'active' : ''}`}
                      onClick={() => {
                        onSelectModel(model);
                        setShowModelDropdown(false);
                      }}
                    >
                      {model}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              className={`send-btn ${text.trim() ? 'active' : ''}`}
              onClick={handleSubmit}
              disabled={!text.trim() || disabled}
              title="Send message"
            >
              <ArrowUp size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="disclaimer-text">
        OpenManus may make mistakes. Check important info.
      </div>
    </div>
  );
};
