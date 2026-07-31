import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ThumbsUp, ThumbsDown, Copy, RotateCw, Check } from 'lucide-react';
import OpenManusLogo from '../assets/OpenManusLogo';
import { ChatMessage } from '../types';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
};

const CodeBlock = ({ language, value }: { language: string; value: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayLang = language
    ? language.charAt(0).toUpperCase() + language.slice(1)
    : 'TypeScript';

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <div className="code-lang-tab">{displayLang}</div>
        <button className="code-copy-btn" onClick={handleCopy}>
          {copied ? (
            <>
              <Check size={14} />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'typescript'}
        style={oneDark}
        showLineNumbers={true}
        lineNumberStyle={{
          minWidth: '2.5em',
          paddingRight: '1em',
          color: 'rgba(255, 255, 255, 0.25)',
          textAlign: 'right',
          userSelect: 'none',
        }}
        customStyle={{
          margin: 0,
          padding: '14px 16px',
          background: '#0d1117',
          fontSize: '13px',
          lineHeight: '1.6',
          fontFamily: 'monospace',
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px',
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const displayMessages =
    messages.length > 0
      ? messages
      : [
          {
            id: 'demo-1',
            role: 'user' as const,
            content: 'Explain embeddings.',
            timestamp: '10:42 AM',
          },
          {
            id: 'demo-2',
            role: 'assistant' as const,
            timestamp: '10:42 AM',
            content: `Embeddings are numerical representations of data—such as text, images, or audio—that capture semantic meaning in a way that computers can understand.

They convert complex data (like words or sentences) into vectors of numbers in a high-dimensional space, where similar items are located closer together.

---

### How it works

1. **Input** $\\rightarrow$ You provide text (e.g., a sentence).
2. **Model** $\\rightarrow$ An embedding model processes the input.
3. **Output** $\\rightarrow$ A vector of floats is generated.

These vectors can then be used for tasks like similarity search, clustering, classification, or as input to other machine learning models.

\`\`\`typescript
import { OpenAI } from 'openai';

const openai = new OpenAI();
const res = await openai.embeddings.create({
  model: 'text-embedding-3-small',
});
\`\`\``,
          },
        ];

  let userTurnCounter = 0;

  return (
    <div className="messages-container">
      {displayMessages.map((message) => {
        let turnId: string | undefined = undefined;
        if (message.role === 'user') {
          turnId = `turn-${userTurnCounter++}`;
        }

        return (
          <div key={message.id} id={turnId} className={`message-row ${message.role}`}>
            {message.role === 'user' ? (
              <div className="user-message-wrapper">
                <span className="user-timestamp">{message.timestamp || '10:42 AM'}</span>
                <div className="message-bubble user">
                  <div className="message-content">{message.content}</div>
                </div>
              </div>
            ) : (
              <div className="assistant-message-wrapper">
                <div className="assistant-header-row">
                  <div className="avatar-container">
                    <OpenManusLogo size={20} />
                  </div>
                  <span className="assistant-name">Argus</span>
                  <span className="assistant-timestamp">{message.timestamp || '10:42 AM'}</span>
                </div>

                <div className="message-bubble assistant">
                  <div className="message-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1({ children }) {
                          const textStr = Array.isArray(children) ? children.join('') : String(children);
                          const id = `heading-${slugify(textStr)}`;
                          return <h1 id={id} className="md-heading md-h1">{children}</h1>;
                        },
                        h2({ children }) {
                          const textStr = Array.isArray(children) ? children.join('') : String(children);
                          const id = `heading-${slugify(textStr)}`;
                          return <h2 id={id} className="md-heading md-h2">{children}</h2>;
                        },
                        h3({ children }) {
                          const textStr = Array.isArray(children) ? children.join('') : String(children);
                          const id = `heading-${slugify(textStr)}`;
                          return <h3 id={id} className="md-heading md-h3">{children}</h3>;
                        },
                        p({ children }) {
                          return <p className="md-paragraph">{children}</p>;
                        },
                        ul({ children }) {
                          return <ul className="md-list md-ul">{children}</ul>;
                        },
                        ol({ children }) {
                          return <ol className="md-list md-ol">{children}</ol>;
                        },
                        li({ children }) {
                          return <li className="md-list-item">{children}</li>;
                        },
                        strong({ children }) {
                          return <strong className="md-strong">{children}</strong>;
                        },
                        hr() {
                          return <hr className="content-divider" />;
                        },
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          const codeString = String(children).replace(/\n$/, '');

                          if (!inline && match) {
                            return <CodeBlock language={match[1]} value={codeString} />;
                          }

                          if (!inline && codeString.includes('\n')) {
                            return <CodeBlock language="typescript" value={codeString} />;
                          }

                          return (
                            <code className="inline-code" {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>

                  <div className="message-action-bar">
                    <button className="action-icon-btn" title="Like response">
                      <ThumbsUp size={15} />
                    </button>
                    <button className="action-icon-btn" title="Dislike response">
                      <ThumbsDown size={15} />
                    </button>
                    <button
                      className="action-icon-btn"
                      title="Copy message"
                      onClick={() => handleCopyMessage(message.id, message.content)}
                    >
                      {copiedMsgId === message.id ? <Check size={15} /> : <Copy size={15} />}
                    </button>
                    <button className="action-icon-btn" title="Regenerate response">
                      <RotateCw size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {isLoading && (
        <div className="message-row assistant">
          <div className="assistant-message-wrapper">
            <div className="assistant-header-row">
              <div className="avatar-container">
                <OpenManusLogo size={20} />
              </div>
              <span className="assistant-name">Argus</span>
            </div>
            <div className="message-bubble loading">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
