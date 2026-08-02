import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ThumbsUp, ThumbsDown, Copy, RotateCw, Check, Maximize2, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import mermaid from 'mermaid';
import OpenManusLogo from '../assets/OpenManusLogo';
import { WelcomeState } from './WelcomeState';
import { ChatMessage } from '../types';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
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
    subgraphPadding: 40,
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

const MermaidDiagram = React.memo(({ chart, onExpand }: { chart: string; onExpand: (svg: string) => void }) => {
  const [svgMarkup, setSvgMarkup] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const uniqueId = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const cleanChart = normalizeMermaidChart(chart);

    mermaid
      .render(uniqueId, cleanChart)
      .then(({ svg }) => {
        if (isMounted) {
          setSvgMarkup(svg);
          setHasError(false);
        }
      })
      .catch((err) => {
        console.error('Mermaid render error:', err);
        if (isMounted) {
          setHasError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (hasError) {
    return <CodeBlock language="mermaid" value={chart} />;
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
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
});

export const MessageList: React.FC<MessageListProps> = React.memo(
  ({ messages, isLoading, onSelectPrompt }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const zoomWrapperRef = useRef<HTMLDivElement>(null);
    const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
    const [expandedSvg, setExpandedSvg] = useState<string | null>(null);
    const [diagramZoom, setDiagramZoom] = useState<number>(1);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const panPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const isDraggingRef = useRef<boolean>(false);
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
      if (e.button !== 0) return;
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

    // Continuous ResizeObserver auto-scroll anchor (handles text landing & asynchronous diagram rendering)
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const observer = new ResizeObserver(() => {
        container.scrollTop = container.scrollHeight;
      });

      observer.observe(container);

      // Scroll immediately on new message or loading change
      container.scrollTop = container.scrollHeight;

      return () => {
        observer.disconnect();
      };
    }, [messages.length, isLoading]);

    const handleCopyMessage = (id: string, text: string) => {
      navigator.clipboard.writeText(text);
      setCopiedMsgId(id);
      setTimeout(() => setCopiedMsgId(null), 2000);
    };

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
        {messages.map((message) => {
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
                    <span className="assistant-name">Gohard</span>
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
                          code({ inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            const codeString = String(children).replace(/\n$/, '');

                            if (!inline && match && match[1] === 'mermaid') {
                              return <MermaidDiagram chart={codeString} onExpand={(svg) => setExpandedSvg(svg)} />;
                            }

                            if (!inline && match) {
                              return <CodeBlock language="typescript" value={codeString} />;
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
