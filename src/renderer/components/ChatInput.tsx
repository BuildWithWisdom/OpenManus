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

import { MODEL_GROUPS, getModelDisplayName, ModelOption, ModelGroup } from '../models';
export { MODEL_GROUPS, getModelDisplayName };
export type { ModelOption, ModelGroup };

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
  const [modelGroups, setModelGroups] = useState<ModelGroup[]>(MODEL_GROUPS);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchModels = async () => {
      try {
        let groups: ModelGroup[] | undefined;
        if (window.electronAPI?.getAvailableModels) {
          groups = await window.electronAPI.getAvailableModels();
        } else if (window.electron?.ipcRenderer?.invoke) {
          groups = await window.electron.ipcRenderer.invoke('chat:getAvailableModels');
        }
        if (isMounted && Array.isArray(groups) && groups.length > 0) {
          setModelGroups(groups);
          if (!selectedModel && groups[0]?.models?.[0]?.id) {
            onSelectModel(groups[0].models[0].id);
          }
        }
      } catch (err) {
        console.error('[Fetch Available Models Failed]:', err);
      }
    };
    fetchModels();
    return () => {
      isMounted = false;
    };
  }, []);

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

  const allModels = modelGroups.flatMap((group) => group.models);
  const activeModelOption = allModels.find((m) => m.id === selectedModel);
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
                  {modelGroups.length === 0 ? (
                    <div className="card-model-option" style={{ opacity: 0.6, fontStyle: 'italic' }}>
                      Loading models...
                    </div>
                  ) : (
                    modelGroups.map((group) => (
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
                    ))
                  )}
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
