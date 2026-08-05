import React, { useEffect, useLayoutEffect, useRef, useState, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ThumbsUp, ThumbsDown, Copy, RotateCw, Check, Maximize2, X, ZoomIn, ZoomOut, RotateCcw, ChevronRight, Loader2 } from 'lucide-react';
import mermaid from 'mermaid';
import OpenManusLogo from '../assets/OpenManusLogo';
import { WelcomeState } from './WelcomeState';
import { ChatMessage } from '../types';

export interface ParsedMessageContent {
  thinking: string | null;
  mainContent: string;
  isStillThinking: boolean;
}

export function parseMessageThinking(content: string): ParsedMessageContent {
  const thinkStartMatch = content.match(/<think>/i);
  if (!thinkStartMatch || thinkStartMatch.index === undefined) {
    return { thinking: null, mainContent: content, isStillThinking: false };
  }

  const startIndex = thinkStartMatch.index + thinkStartMatch[0].length;
  const thinkEndMatch = content.match(/<\/think>/i);

  if (thinkEndMatch && thinkEndMatch.index !== undefined) {
    const thinking = content.slice(startIndex, thinkEndMatch.index).trim();
    const mainContent = (content.slice(0, thinkStartMatch.index) + content.slice(thinkEndMatch.index + thinkEndMatch[0].length)).trim();
    return { thinking, mainContent, isStillThinking: false };
  }

  const thinking = content.slice(startIndex).trim();
  const mainContent = content.slice(0, thinkStartMatch.index).trim();
  return { thinking, mainContent, isStillThinking: true };
}

const ThoughtCard: React.FC<{ thinking: string; isStillThinking: boolean }> = ({ thinking, isStillThinking }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <div className="thought-card-wrapper" style={{ marginBottom: '14px' }}>
      <div
        className="thought-card-header"
        onClick={() => setIsExpanded((prev) => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: '#161b22',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          userSelect: 'none',
        }}
      >
        <ChevronRight
          size={14}
          style={{
            transform: isExpanded ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
        />
        <span>{isStillThinking ? 'Thinking...' : 'Thought Process'}</span>
      </div>

      {isExpanded && (
        <div
          className="thought-card-content"
          style={{
            marginTop: '6px',
            padding: '12px',
            backgroundColor: '#0d1117',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            fontSize: '13px',
            lineHeight: '1.6',
            color: 'var(--text-muted)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {thinking}
        </div>
      )}
    </div>
  );
};

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  isStreaming?: boolean;
  onSelectPrompt?: (text: string) => void;
}

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
};

const normalizeMermaidChart = (chart: string): string => {
  let clean = chart
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/-->\s*subgraph\s+([^\n]+)/gi, '\nsubgraph $1')
    .replace(/^\s*style\s+.*$/gim, '')
    .replace(/^\s*classDef\s+.*$/gim, '')
    .replace(/^\s*class\s+.*$/gim, '');

  const stripEmojis = (str: string) =>
    str.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '').trim();

  // Line-by-line subgraph normalizer (handles ALL 4 syntax formats 100% reliably):
  clean = clean.replace(/^\s*subgraph\s+(.+)$/gim, (line, matchBody) => {
    let body = matchBody.trim();

    // 1. ID ["Title"] or ID [Title]
    let bracketMatch = body.match(/^([A-Za-z0-9_]+)\s*\[\s*"?(.*?)"?\s*\]$/);
    if (bracketMatch) {
      const id = bracketMatch[1];
      const title = stripEmojis(bracketMatch[2].replace(/<br\s*\/?>|&nbsp;/gi, ''));
      return `subgraph ${id}["${title}"]`;
    }

    // 2. ID "Title"
    let idQuoteMatch = body.match(/^([A-Za-z0-9_]+)\s*["']([^"']+)["']$/);
    if (idQuoteMatch) {
      const id = idQuoteMatch[1];
      const title = stripEmojis(idQuoteMatch[2].replace(/<br\s*\/?>|&nbsp;/gi, ''));
      return `subgraph ${id}["${title}"]`;
    }

    // 3. Quoted title: "Function Calling"
    let quoteMatch = body.match(/^["']([^"']+)["']$/);
    if (quoteMatch) {
      const title = stripEmojis(quoteMatch[1].replace(/<br\s*\/?>|&nbsp;/gi, ''));
      const safeId = title.replace(/\s+/g, '_');
      return `subgraph ${safeId}["${title}"]`;
    }

    // 4. Unquoted single-word or multi-word ID (e.g. Function_Calling or Function Calling)
    const title = stripEmojis(body.replace(/_/g, ' ').replace(/<br\s*\/?>|&nbsp;/gi, ''));
    const safeId = body.replace(/\s+/g, '_');
    return `subgraph ${safeId}["${title}"]`;
  });

  // Auto-quote unquoted node labels containing special characters, parens, or line breaks
  clean = clean.replace(/([A-Za-z0-9_]+)\s*(\[|\{|\()([^\n\]\}]+)(\]|\}|\))/g, (fullMatch, id, openChar, content, closeChar) => {
    const trimmed = content.trim();
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return fullMatch;
    }
    const cleanContent = stripEmojis(trimmed);
    return `${id}${openChar}"${cleanContent}"${closeChar}`;
  });

  // Global node label emoji scrubber (strips emojis from all node shape labels)
  clean = clean.replace(/(\[[^\]]+\]|\([^\)]+\)|\{[^\}]+\})/g, (match) => {
    return stripEmojis(match);
  });

  return clean;
};

mermaid.initialize({
  startOnLoad: false,
  suppressErrorRendering: true,
  theme: 'dark',
  securityLevel: 'loose',
  flowchart: {
    curve: 'basis',
    nodeSpacing: 50,
    rankSpacing: 50,
    padding: 20,
    subGraphTitleMargin: {
      top: 12,
      bottom: 20,
    },
    htmlLabels: true,
  },
  themeVariables: {
    darkMode: true,
    background: 'transparent',
    primaryColor: '#161b22',
    primaryTextColor: '#ffffff',
    primaryBorderColor: '#10b981',
    lineColor: '#64748b',
    secondaryColor: '#2563eb',
    tertiaryColor: '#f59e0b',
    nodeBorder: '#10b981',
    clusterBkg: '#11161d',
    clusterBorder: 'rgba(255, 255, 255, 0.15)',
    titleColor: '#ffffff',
    textColor: '#ffffff',
    labelColor: '#ffffff',
  },
});

const fixSvgDimensions = (svgStr: string): string => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgStr, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');
    if (!svgEl) return svgStr;

    const viewBox = svgEl.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(/[\s,]+/).map(Number);
      if (parts.length === 4 && !isNaN(parts[2]) && !isNaN(parts[3]) && parts[2] > 0 && parts[3] > 0) {
        const scale = 1.85;
        const w = Math.round(parts[2] * scale);
        const h = Math.round(parts[3] * scale);
        svgEl.setAttribute('width', `${w}px`);
        svgEl.setAttribute('height', `${h}px`);
        svgEl.style.width = `${w}px`;
        svgEl.style.height = `${h}px`;
        svgEl.style.maxWidth = '100%';
      }
    }
    return svgEl.outerHTML;
  } catch {
    return svgStr;
  }
};

const renderedSvgCache = new Map<string, string>();

const MermaidDiagram = React.memo(({ chart, onExpand }: { chart: string; onExpand: (svg: string) => void }) => {
  const cachedSvg = renderedSvgCache.get(chart);
  const [svgMarkup, setSvgMarkup] = useState<string>(cachedSvg || '');
  const [hasError, setHasError] = useState<boolean>(false);
  const [isRendering, setIsRendering] = useState<boolean>(!cachedSvg);

  useEffect(() => {
    let isMounted = true;

    if (renderedSvgCache.has(chart)) {
      const cached = renderedSvgCache.get(chart)!;
      setSvgMarkup(cached);
      setHasError(false);
      setIsRendering(false);
      return;
    }

    setIsRendering(true);

    const timer = setTimeout(() => {
      const uniqueId = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const cleanChart = normalizeMermaidChart(chart);

      mermaid
        .render(uniqueId, cleanChart)
        .then(({ svg }) => {
          if (isMounted) {
            const normalizedSvg = fixSvgDimensions(svg);
            renderedSvgCache.set(chart, normalizedSvg);
            setSvgMarkup(normalizedSvg);
            setHasError(false);
            setIsRendering(false);
          }
        })
        .catch((err) => {
          console.error('Mermaid render error:', err);
          if (isMounted) {
            setHasError(true);
            setIsRendering(false);
          }
        });
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [chart]);

  if (hasError) {
    return <CodeBlock language="mermaid" value={chart} />;
  }

  if (isRendering || !svgMarkup) {
    return (
      <div className="mermaid-card-container mermaid-skeleton-loading">
        <div className="mermaid-loading-wrapper">
          <Loader2 size={16} className="mermaid-spinner" />
          <span>Generating diagram...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mermaid-card-container">
      <button
        className="mermaid-expand-btn"
        title="View Full Diagram"
        onClick={() => onExpand(svgMarkup)}
      >
        <Maximize2 size={14} />
        <span>Expand</span>
      </button>
      <div
        className="mermaid-svg-wrapper"
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />
    </div>
  );
});

const CodeBlock = React.memo(({ language, value }: { language: string; value: string }) => {
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
        showLineNumbers={false}
        customStyle={{
          margin: 0,
          padding: '14px 16px',
          background: '#0d1117',
          fontSize: '13px',
          lineHeight: '1.6',
          fontFamily: 'monospace',
          borderBottomLeftRadius: '10px',
          borderBottomRightRadius: '10px',
          maxWidth: '100%',
          overflowX: 'auto',
          minWidth: 0,
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
});

interface MessageRowProps {
  message: ChatMessage;
  currentTurnIndex: number;
  isLastAssistant: boolean;
  isLoading?: boolean;
  copiedMsgId: string | null;
  onCopyMessage: (id: string, text: string) => void;
  onExpandMermaid: (svg: string) => void;
}

const MessageRow = React.memo<MessageRowProps>(
  ({ message, currentTurnIndex, isLastAssistant, isLoading, copiedMsgId, onCopyMessage, onExpandMermaid }) => {
    return (
      <div
        id={message.role === 'user' ? `turn-${currentTurnIndex}` : undefined}
        className={`message-row ${message.role}`}
      >
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
                <OpenManusLogo size={22} />
              </div>
              <span className="assistant-name">Gohard</span>
              <span className="assistant-timestamp">{message.timestamp || '10:42 AM'}</span>
            </div>

            <div className="message-bubble assistant">
              <div className="message-content">
                {(() => {
                  const parsed = parseMessageThinking(message.content);
                  return (
                    <>
                      {parsed.thinking && (
                        <ThoughtCard
                          thinking={parsed.thinking}
                          isStillThinking={parsed.isStillThinking}
                        />
                      )}
                      {parsed.mainContent ? (
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
                            table({ children }) {
                              return (
                                <div className="md-table-wrapper">
                                  <table className="md-table">{children}</table>
                                </div>
                              );
                            },
                            thead({ children }) {
                              return <thead className="md-thead">{children}</thead>;
                            },
                            tbody({ children }) {
                              return <tbody className="md-tbody">{children}</tbody>;
                            },
                            tr({ children }) {
                              return <tr className="md-tr">{children}</tr>;
                            },
                            th({ children }) {
                              return <th className="md-th">{children}</th>;
                            },
                            td({ children }) {
                              return <td className="md-td">{children}</td>;
                            },
                            code({ inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              const codeString = String(children).replace(/\n$/, '');
                              const lang = match ? match[1].toLowerCase() : '';

                              if (!inline && lang === 'mermaid') {
                                return <MermaidDiagram chart={codeString} onExpand={onExpandMermaid} />;
                              }

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
                          {parsed.mainContent}
                        </ReactMarkdown>
                      ) : (isLastAssistant && isLoading) ? (
                        <div className="message-bubble loading">
                          <span className="dot" />
                          <span className="dot" />
                          <span className="dot" />
                        </div>
                      ) : !message.content ? (
                        <div className="message-content stopped" style={{ opacity: 0.6, fontStyle: 'italic', fontSize: '13px' }}>
                          [Response stopped]
                        </div>
                      ) : null}
                    </>
                  );
                })()}
              </div>

              {(!isLastAssistant || !isLoading) && message.content && (
                <div className="message-action-bar">
                  <button className="action-icon-btn" title="Like response">
                    <ThumbsUp size={15.5} />
                  </button>
                  <button className="action-icon-btn" title="Dislike response">
                    <ThumbsDown size={15.5} />
                  </button>
                  <button
                    className="action-icon-btn"
                    title="Copy message"
                    onClick={() => onCopyMessage(message.id, message.content)}
                  >
                    {copiedMsgId === message.id ? <Check size={15.5} /> : <Copy size={15.5} />}
                  </button>
                  <button className="action-icon-btn" title="Regenerate response">
                    <RotateCw size={15.5} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

export const MessageList: React.FC<MessageListProps> = React.memo(
  ({ messages, isLoading, isStreaming, onSelectPrompt }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const zoomWrapperRef = useRef<HTMLDivElement>(null);
    const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
    const [expandedSvg, setExpandedSvg] = useState<string | null>(null);
    const [diagramZoom, setDiagramZoom] = useState<number>(1);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const panPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const isDraggingRef = useRef<boolean>(false);
    const lastTouchTimeRef = useRef<number>(0);
    const animFrameRef = useRef<number | null>(null);

    const updateTransform = (x: number, y: number, zoom: number) => {
      if (zoomWrapperRef.current) {
        zoomWrapperRef.current.style.transform = `translate3d(${x}px, ${y}px, 0px) scale(${zoom})`;
      }
    };

    const resetDiagramView = () => {
      setDiagramZoom(1);
      panPosRef.current = { x: 0, y: 0 };
      updateTransform(0, 0, 1);
    };

    useEffect(() => {
      if (expandedSvg) {
        updateTransform(panPosRef.current.x, panPosRef.current.y, diagramZoom);
      }
    }, [diagramZoom, expandedSvg]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0 || Date.now() - lastTouchTimeRef.current < 500) return;
      e.preventDefault();
      isDraggingRef.current = true;
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - panPosRef.current.x,
        y: e.clientY - panPosRef.current.y,
      };

      const handleGlobalMouseMove = (moveEvent: MouseEvent) => {
        if (!isDraggingRef.current) return;
        const newX = moveEvent.clientX - dragStartRef.current.x;
        const newY = moveEvent.clientY - dragStartRef.current.y;
        panPosRef.current = { x: newX, y: newY };

        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
        }
        animFrameRef.current = requestAnimationFrame(() => {
          updateTransform(newX, newY, diagramZoom);
        });
      };

      const handleGlobalMouseUp = () => {
        isDraggingRef.current = false;
        setIsDragging(false);
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
        }
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };

      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length !== 1) return;
      lastTouchTimeRef.current = Date.now();
      isDraggingRef.current = true;
      setIsDragging(true);
      const touch = e.touches[0];
      dragStartRef.current = {
        x: touch.clientX - panPosRef.current.x,
        y: touch.clientY - panPosRef.current.y,
      };

      const handleGlobalTouchMove = (moveEvent: TouchEvent) => {
        if (!isDraggingRef.current || moveEvent.touches.length !== 1) return;
        const touchItem = moveEvent.touches[0];
        const newX = touchItem.clientX - dragStartRef.current.x;
        const newY = touchItem.clientY - dragStartRef.current.y;
        panPosRef.current = { x: newX, y: newY };

        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
        }
        animFrameRef.current = requestAnimationFrame(() => {
          updateTransform(newX, newY, diagramZoom);
        });
      };

      const handleGlobalTouchEnd = () => {
        isDraggingRef.current = false;
        setIsDragging(false);
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
        }
        window.removeEventListener('touchmove', handleGlobalTouchMove);
        window.removeEventListener('touchend', handleGlobalTouchEnd);
        window.removeEventListener('touchcancel', handleGlobalTouchEnd);
      };

      window.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });
      window.addEventListener('touchend', handleGlobalTouchEnd);
      window.addEventListener('touchcancel', handleGlobalTouchEnd);
    };

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY > 0 ? -0.15 : 0.15;
        setDiagramZoom((z) => Math.min(Math.max(z + delta, 0.4), 3.0));
      } else {
        const newX = panPosRef.current.x - e.deltaX;
        const newY = panPosRef.current.y - e.deltaY;
        panPosRef.current = { x: newX, y: newY };
        updateTransform(newX, newY, diagramZoom);
      }
    };


    const spacerRef = useRef<HTMLDivElement>(null);
    const [dynamicSpacerHeight, setDynamicSpacerHeight] = useState<number>(40);

    useLayoutEffect(() => {
      if (!isLoading && !isStreaming) {
        setDynamicSpacerHeight(40);
        return;
      }
      const container = containerRef.current;
      const spacer = spacerRef.current;
      const userMessages = messages.filter((m) => m.role === 'user');
      if (!container || !spacer || userMessages.length === 0) return;

      const latestTurnIndex = userMessages.length - 1;
      const turnElement = document.getElementById(`turn-${latestTurnIndex}`);
      if (turnElement) {
        const styles = window.getComputedStyle(container);
        const paddingTop = parseFloat(styles.paddingTop) || 0;
        const paddingBottom = parseFloat(styles.paddingBottom) || 0;
        const innerHeight = container.clientHeight - paddingTop - paddingBottom;
        const turnRect = turnElement.getBoundingClientRect();
        const spacerRect = spacer.getBoundingClientRect();
        const contentBelowTurnTop = spacerRect.top - turnRect.top;
        const neededSpacer = Math.max(0, innerHeight - contentBelowTurnTop);
        setDynamicSpacerHeight(neededSpacer);
      }
    }, [isLoading, messages]);



    const handleCopyMessage = useCallback((id: string, text: string) => {
      navigator.clipboard.writeText(text);
      setCopiedMsgId(id);
      setTimeout(() => setCopiedMsgId(null), 2000);
    }, []);

    const handleSelectPromptFallback = (text: string) => {
      if (onSelectPrompt) {
        onSelectPrompt(text);
      }
    };

    if (messages.length === 0 && !isLoading) {
      return <WelcomeState onSelectPrompt={handleSelectPromptFallback} />;
    }

    let userTurnCounter = 0;

    return (
      <div className="messages-container" ref={containerRef}>
        {messages.map((message, idx) => {
          const currentTurnIndex = message.role === 'user' ? userTurnCounter++ : -1;
          const isLastAssistant = message.role === 'assistant' && idx === messages.length - 1;
          return (
            <MessageRow
              key={message.id}
              message={message}
              currentTurnIndex={currentTurnIndex}
              isLastAssistant={isLastAssistant}
              isLoading={isLoading}
              copiedMsgId={copiedMsgId}
              onCopyMessage={handleCopyMessage}
              onExpandMermaid={setExpandedSvg}
            />
          );
        })}

        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="message-row assistant loading-row">
            <div className="assistant-message-wrapper">
              <div className="assistant-header-row">
                <div className="avatar-container">
                  <OpenManusLogo size={20} />
                </div>
                <span className="assistant-name">Gohard</span>
              </div>
              <div className="message-bubble loading">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={spacerRef} className="messages-bottom-spacer" style={{ height: `${dynamicSpacerHeight}px` }} aria-hidden="true" />

        {/* Fullscreen Diagram Lightbox Modal */}
        {expandedSvg && (
          <div
            className="diagram-modal-overlay"
            onClick={() => {
              setExpandedSvg(null);
              resetDiagramView();
            }}
          >
            <div className="diagram-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="diagram-modal-header">
                <span className="diagram-modal-title">Full Diagram View</span>
                <div className="diagram-modal-controls">
                  <button
                    className="diagram-modal-btn"
                    onClick={() => setDiagramZoom((z) => Math.max(z - 0.2, 0.4))}
                    title="Zoom Out (-)"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <span className="diagram-zoom-indicator">
                    {Math.round(diagramZoom * 100)}%
                  </span>
                  <button
                    className="diagram-modal-btn"
                    onClick={() => setDiagramZoom((z) => Math.min(z + 0.25, 3.0))}
                    title="Zoom In (+)"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button
                    className="diagram-modal-btn"
                    onClick={resetDiagramView}
                    title="Reset View & Zoom"
                  >
                    <RotateCcw size={15} />
                  </button>
                  <div className="diagram-divider" />
                  <button
                    className="diagram-modal-close-btn"
                    onClick={() => {
                      setExpandedSvg(null);
                      resetDiagramView();
                    }}
                    title="Close (Esc)"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div
                className={`diagram-modal-body ${isDragging ? 'dragging' : ''}`}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onDoubleClick={resetDiagramView}
                onWheel={handleWheel}
              >
                <div
                  ref={zoomWrapperRef}
                  className="diagram-zoom-wrapper"
                  dangerouslySetInnerHTML={{ __html: expandedSvg }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);
