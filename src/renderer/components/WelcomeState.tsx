import React from 'react';
import { Lightbulb, Code, FileText, TrendingUp, ArrowRight } from 'lucide-react';
import GohardLogo from './GohardLogo';

interface WelcomeStateProps {
  onSelectPrompt: (promptText: string) => void;
}

export const WelcomeState: React.FC<WelcomeStateProps> = ({ onSelectPrompt }) => {
  const promptSuggestions = [
    {
      id: 'transformer-analogy',
      icon: <Lightbulb size={20} className="prompt-icon" />,
      text: 'Explain Transformers using a simple analogy',
    },
    {
      id: 'nn-from-scratch',
      icon: <Code size={20} className="prompt-icon" />,
      text: 'Teach me how to build a neural network from scratch',
    },
    {
      id: 'system-design',
      icon: <FileText size={20} className="prompt-icon" />,
      text: 'Teach me System Design for scaling apps',
    },
    {
      id: 'sql-nosql-deepdive',
      icon: <TrendingUp size={20} className="prompt-icon" />,
      text: 'Compare SQL vs. NoSQL databases',
    },
  ];

  return (
    <div className="welcome-container">
      <div className="welcome-hero">
        <GohardLogo size={52} className="hero-logo" />
        <h1 className="welcome-title">
          Hello, I’m <span className="highlight-green">Gohard.</span>
        </h1>
        <p className="welcome-subtitle">What should I teach you today?</p>
      </div>

      <div className="prompt-cards-grid">
        {promptSuggestions.map((prompt) => (
          <div
            key={prompt.id}
            className="prompt-card"
            onClick={() => onSelectPrompt(prompt.text)}
          >
            <div className="card-top">{prompt.icon}</div>
            <p className="card-text">{prompt.text}</p>
            <div className="card-bottom">
              <ArrowRight size={16} className="arrow-icon" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
