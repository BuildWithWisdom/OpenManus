import React, { useState } from 'react';
import { X, ChevronDown, Brain, FileText, BookOpen, ExternalLink } from 'lucide-react';

interface RightSidebarProps {
  onClose?: () => void;
}

const TOC_ITEMS = [
  { id: 'embeddings', label: 'What are embeddings?', active: true },
  { id: 'how-it-works', label: 'How it works', active: false },
  { id: 'why-useful', label: 'Why they are useful', active: false },
  { id: 'use-cases', label: 'Common use cases', active: false },
  { id: 'models', label: 'Embedding models', active: false },
  { id: 'summary', label: 'Summary', active: false },
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

export const RightSidebar: React.FC<RightSidebarProps> = ({ onClose }) => {
  const [activeTocId, setActiveTocId] = useState<string>('embeddings');
  const [isThoughtExpanded, setIsThoughtExpanded] = useState<boolean>(false);

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
          {TOC_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`toc-item ${item.id === activeTocId ? 'active' : ''}`}
              onClick={() => setActiveTocId(item.id)}
            >
              {item.label}
            </button>
          ))}
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
