import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Paperclip, CodeXml, Globe, ChevronDown, ArrowUp, Square } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  disabled?: boolean;
  isStreaming?: boolean;
  onAbort?: () => void;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

export interface ModelGroup {
  provider: string;
  models: ModelOption[];
}

export const MODEL_GROUPS: ModelGroup[] = [
  {
    provider: 'NVIDIA NIM',
    models: [
      { id: 'deepseek-ai/deepseek-v4-pro', name: 'DeepSeek V4 Pro', provider: 'NVIDIA NIM' },
      { id: 'deepseek-ai/deepseek-v4-flash', name: 'DeepSeek V4 Flash', provider: 'NVIDIA NIM' },
      { id: 'deepseek-ai/deepseek-coder-6.7b-instruct', name: 'DeepSeek Coder 6.7B', provider: 'NVIDIA NIM' },
      { id: 'thinkingmachines/inkling', name: 'Inkling Reasoning', provider: 'NVIDIA NIM' },
      { id: 'z-ai/glm-5.2', name: 'GLM 5.2', provider: 'NVIDIA NIM' },
      { id: 'stepfun-ai/step-3.7-flash', name: 'Step 3.7 Flash', provider: 'NVIDIA NIM' },
      { id: 'moonshotai/kimi-k2.6', name: 'Kimi K2.6', provider: 'NVIDIA NIM' },
      { id: 'nvidia/nemotron-3-ultra-550b-a55b', name: 'Nemotron 3 Ultra', provider: 'NVIDIA NIM' },
      { id: 'nvidia/nemotron-3-super-120b-a12b', name: 'Nemotron 3 Super', provider: 'NVIDIA NIM' },
      { id: 'nvidia/nemotron-3-nano-30b-a3b', name: 'Nemotron 3 Nano', provider: 'NVIDIA NIM' },
    ],
  },
  {
    provider: 'Cloudflare Workers AI',
    models: [
      { id: '@cf/zai-org/glm-4.7-flash', name: 'GLM 4.7 Flash', provider: 'Cloudflare Workers AI' },
      { id: '@cf/zai-org/glm-5.2', name: 'GLM 5.2', provider: 'Cloudflare Workers AI' },
      { id: '@cf/moonshotai/kimi-k2.6', name: 'Kimi K2.6', provider: 'Cloudflare Workers AI' },
      { id: '@cf/moonshotai/kimi-k2.7-code', name: 'Kimi K2.7 Code', provider: 'Cloudflare Workers AI' },
    ],
  },
];

export const MODEL_OPTIONS: ModelOption[] = MODEL_GROUPS.flatMap((group) => group.models);

export const getModelDisplayName = (modelId: string): string => {
  for (const group of MODEL_GROUPS) {
    const found = group.models.find((m) => m.id === modelId);
    if (found) return found.name;
  }
  const parts = modelId.split('/');
  return parts.length > 1 ? parts[1] : modelId;
};

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  selectedModel,
  onSelectModel,
  disabled = false,
  isStreaming = false,
  onAbort,
}) => {
  const [text, setText] = useState<string>('');
  const [showModelDropdown, setShowModelDropdown] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    };

    if (showModelDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModelDropdown]);

  const activeModelOption = MODEL_OPTIONS.find((m) => m.id === selectedModel);
  const activeLabel = activeModelOption ? activeModelOption.name : getModelDisplayName(selectedModel);

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
          disabled={disabled || isStreaming}
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
            <div ref={dropdownRef} className="card-model-dropdown-container">
              <button
                className="card-model-select-btn"
                onClick={() => setShowModelDropdown((previousState) => !previousState)}
              >
                <span>{activeLabel}</span>
                <ChevronDown size={13} />
              </button>

              {showModelDropdown && (
                <div className="card-model-dropdown-menu">
                  {MODEL_GROUPS.map((group) => (
                    <div key={group.provider} className="card-model-group">
                      <div className="card-model-group-header">{group.provider}</div>
                      {group.models.map((model) => (
                        <div
                          key={model.id}
                          className={`card-model-option ${model.id === selectedModel ? 'active' : ''}`}
                          onClick={() => {
                            onSelectModel(model.id);
                            setShowModelDropdown(false);
                          }}
                        >
                          {model.name}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isStreaming ? (
              <button
                className="card-send-btn active streaming-stop-btn"
                onClick={onAbort}
                title="Stop generation"
              >
                <Square size={14} fill="currentColor" />
              </button>
            ) : (
              <button
                className={`card-send-btn ${text.trim() ? 'active' : ''}`}
                onClick={handleSubmit}
                disabled={!text.trim() || disabled}
                title="Send message"
              >
                <ArrowUp size={17} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
