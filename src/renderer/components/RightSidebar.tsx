import React, { useState, useMemo } from 'react';
import { X, ChevronDown, Brain, FileText } from 'lucide-react';

interface RightSidebarProps {
  isVisible?: boolean;
  onClose?: () => void;
  latestMessageContent?: string;
  onSelectHeading?: (headingId: string) => void;
}

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
};

export const RightSidebar: React.FC<RightSidebarProps> = ({
  isVisible = true,
  onClose,
  latestMessageContent,
  onSelectHeading,
}) => {
  const [activeTocId, setActiveTocId] = useState<string>('');
  const [isThoughtExpanded, setIsThoughtExpanded] = useState<boolean>(false);

  const tocItems = useMemo(() => {
    if (!latestMessageContent) return [];

    // Strip code blocks so Python/Bash comments (# comment) are ignored
    const contentWithoutCode = latestMessageContent.replace(/```[\s\S]*?```/g, '');

    // Match exclusively top-level H2 (##) section headings for Table of Contents
    const headingRegex = /^##\s+(.+)$/gm;
    const matches = Array.from(contentWithoutCode.matchAll(headingRegex));

    if (matches.length === 0) return [];

    const seenIds = new Set<string>();
    const uniqueItems: { id: string; label: string }[] = [];

    for (const match of matches) {
      const text = (match[1] || match[0] || '').trim();
      if (!text) continue;
      const id = `heading-${slugify(text)}`;

      if (!seenIds.has(id)) {
        seenIds.add(id);
        uniqueItems.push({ id, label: text });
      }
    }

    return uniqueItems;
  }, [latestMessageContent]);

  return (
    <aside className={`right-sidebar-container ${!isVisible ? 'hidden' : ''}`}>
      {/* Section 1: Contents */}
      <div className="right-sidebar-section">
        <div className="section-header-row">
          <span className="section-title">Contents</span>
          {onClose && (
            <button className="section-close-btn" onClick={onClose} title="Close Panel">
              <X size={15} />
            </button>
          )}
        </div>

        <nav className="toc-list">
          {tocItems.length > 0 ? (
            tocItems.map((item, idx) => {
              const isActive = activeTocId === item.id || (activeTocId === '' && idx === 0);
              return (
                <button
                  key={item.id}
                  className={`toc-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTocId(item.id);
                    onSelectHeading?.(item.id);
                  }}
                >
                  {item.label}
                </button>
              );
            })
          ) : (
            <span className="empty-section-text">No headings in current message.</span>
          )}
        </nav>
      </div>

      {/* Section 2: Thought Process */}
      <div className="right-sidebar-section">
        <div className="section-header-row">
          <span className="section-title">Thought process</span>
          <ChevronDown
            size={15}
            className={`section-chevron ${isThoughtExpanded ? 'expanded' : ''}`}
            onClick={() => setIsThoughtExpanded(!isThoughtExpanded)}
          />
        </div>

        <div
          className="thought-card"
          onClick={() => setIsThoughtExpanded(!isThoughtExpanded)}
        >
          <div className="thought-icon-box">
            <Brain size={16} />
          </div>
          <div className="thought-info">
            <span className="thought-title">Thought process</span>
            <span className="thought-subtitle">
              {isThoughtExpanded ? 'Click to collapse' : 'Click to expand'}
            </span>
          </div>
        </div>
      </div>

      {/* Section 3: Related */}
      <div className="right-sidebar-section">
        <div className="section-header-row">
          <span className="section-title">Related</span>
        </div>

        <div className="related-links-list">
          <div className="related-card">
            <div className="related-icon-box">
              <FileText size={16} />
            </div>
            <div className="related-info">
              <span className="related-title">OpenManus Documentation</span>
              <div className="related-subtitle-row">
                <span className="related-subtitle">Project Workspace</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
