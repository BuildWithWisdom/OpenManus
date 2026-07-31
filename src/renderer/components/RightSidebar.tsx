import React, { useState, useMemo } from 'react';
import { X, ChevronDown, Brain, FileText, BookOpen, ExternalLink } from 'lucide-react';

interface RightSidebarProps {
  onClose?: () => void;
  latestMessageContent?: string;
  onSelectHeading?: (headingId: string) => void;
}

const DEFAULT_TOC_ITEMS = [
  { id: 'heading-what-are-embeddings', label: 'What are embeddings?' },
  { id: 'heading-how-it-works', label: 'How it works' },
  { id: 'heading-why-they-are-useful', label: 'Why they are useful' },
  { id: 'heading-common-use-cases', label: 'Common use cases' },
  { id: 'heading-embedding-models', label: 'Embedding models' },
  { id: 'heading-summary', label: 'Summary' },
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

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
};

export const RightSidebar: React.FC<RightSidebarProps> = ({
  onClose,
  latestMessageContent,
  onSelectHeading,
}) => {
  const [activeTocId, setActiveTocId] = useState<string>('');
  const [isThoughtExpanded, setIsThoughtExpanded] = useState<boolean>(false);

  const tocItems = useMemo(() => {
    if (!latestMessageContent) return DEFAULT_TOC_ITEMS;

    // Strip code blocks so Python/Bash comments (# comment) are ignored
    const contentWithoutCode = latestMessageContent.replace(/```[\s\S]*?```/g, '');

    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const matches = Array.from(contentWithoutCode.matchAll(headingRegex));

    if (matches.length === 0) return DEFAULT_TOC_ITEMS;

    return matches.map((match) => {
      const text = match[2].trim();
      const id = `heading-${slugify(text)}`;
      return {
        id,
        label: text,
      };
    });
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
