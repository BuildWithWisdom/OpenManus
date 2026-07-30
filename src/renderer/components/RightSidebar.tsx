import React, { useState, useMemo } from 'react';
import { X, ChevronDown, Brain, FileText, BookOpen, ExternalLink } from 'lucide-react';

interface RightSidebarProps {
  onClose?: () => void;
  latestMessageContent?: string;
}

const DEFAULT_TOC_ITEMS = [
  { id: 'embeddings', label: 'What are embeddings?' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'why-useful', label: 'Why they are useful' },
  { id: 'use-cases', label: 'Common use cases' },
  { id: 'models', label: 'Embedding models' },
  { id: 'summary', label: 'Summary' },
];

const RELATED_LINKS = [
  {
    id: 'rel-1',
    icon: FileText,
    title: 'Vector Databases 101',
    subtitle: 'docs.argus.dev',
    isExternal: false,
  },
  {
    id: 'rel-2',
    icon: BookOpen,
    title: 'OpenAI Embeddings Cookbook',
    subtitle: 'cookbook.openai.com',
    isExternal: true,
  },
  {
    id: 'rel-3',
    icon: FileText,
    title: 'Understanding Embeddings',
    subtitle: 'towardsdatascience.com',
    isExternal: true,
  },
];

export const RightSidebar: React.FC<RightSidebarProps> = ({ onClose, latestMessageContent }) => {
  const [activeTocId, setActiveTocId] = useState<string>('0');
  const [isThoughtExpanded, setIsThoughtExpanded] = useState<boolean>(false);

  const tocItems = useMemo(() => {
    if (!latestMessageContent) return DEFAULT_TOC_ITEMS;

    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const matches = Array.from(latestMessageContent.matchAll(headingRegex));

    if (matches.length === 0) return DEFAULT_TOC_ITEMS;

    return matches.map((match, index) => ({
      id: `toc-${index}`,
      label: match[2].trim(),
    }));
  }, [latestMessageContent]);

  return (
    <aside className="right-sidebar-container">
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
          {tocItems.map((item, idx) => {
            const isActive = activeTocId === item.id || (activeTocId === '0' && idx === 0);
            return (
              <button
                key={item.id}
                className={`toc-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTocId(item.id)}
              >
                {item.label}
              </button>
            );
          })}
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
            <span className="thought-subtitle">Click to expand</span>
          </div>
        </div>
      </div>

      {/* Section 3: Related */}
      <div className="right-sidebar-section">
        <div className="section-header-row">
          <span className="section-title">Related</span>
        </div>

        <div className="related-links-list">
          {RELATED_LINKS.map((link) => {
            const IconComponent = link.icon;
            return (
              <div key={link.id} className="related-card">
                <div className="related-icon-box">
                  <IconComponent size={16} />
                </div>
                <div className="related-info">
                  <span className="related-title">{link.title}</span>
                  <div className="related-subtitle-row">
                    <span className="related-subtitle">{link.subtitle}</span>
                    {link.isExternal && <ExternalLink size={12} className="external-link-icon" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
