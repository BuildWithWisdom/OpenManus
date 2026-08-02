import React, { useState, useRef, KeyboardEvent } from 'react';
import { Paperclip, CodeXml, Globe, ChevronDown, ArrowUp } from 'lucide-react';

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
    <div className="chat-card-input-wrapper">
      <div className="chat-card-input-box">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask Gohard anything..."
          rows={1}
          disabled={disabled}
          className="chat-card-textarea"
        />

        <div className="chat-card-input-toolbar">
          <div className="card-toolbar-left">
            <button className="card-tool-box" title="Attach file" aria-label="Attach file">
              <Paperclip size={16} />
            </button>
            <button className="card-tool-box" title="Code & Tools" aria-label="Code & Tools">
              <CodeXml size={16} />
            </button>
            <button className="card-tool-box" title="Web Search" aria-label="Web Search">
              <Globe size={16} />
            </button>
          </div>

          <div className="card-toolbar-right">
            <div className="card-model-dropdown-container">
              <button
                className="card-model-select-btn"
                onClick={() => setShowModelDropdown((previousState) => !previousState)}
              >
                <span>{selectedModel}</span>
                <ChevronDown size={13} />
              </button>

              {showModelDropdown && (
                <div className="card-model-dropdown-menu">
                  {AVAILABLE_MODELS.map((model) => (
                    <div
                      key={model}
                      className={`card-model-option ${model === selectedModel ? 'active' : ''}`}
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
              className={`card-send-btn ${text.trim() ? 'active' : ''}`}
              onClick={handleSubmit}
              disabled={!text.trim() || disabled}
              title="Send message"
            >
              <ArrowUp size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
