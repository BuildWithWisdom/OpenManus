import React from 'react';
import { Lightbulb, Code, FileText, TrendingUp, ArrowRight } from 'lucide-react';
import OpenManusLogo from '../assets/OpenManusLogo';

interface WelcomeStateProps {
  onSelectPrompt: (promptText: string) => void;
}

export const WelcomeState: React.FC<WelcomeStateProps> = ({ onSelectPrompt }) => {
  const promptSuggestions = [
    {
      id: 'llm-explain',
      icon: <Lightbulb size={20} className="prompt-icon" />,
      text: 'Explain how large language models work',
    },
    {
      id: 'python-csv',
      icon: <Code size={20} className="prompt-icon" />,
      text: 'Write a Python function to parse a CSV file',
    },
    {
      id: 'summarize-paper',
      icon: <FileText size={20} className="prompt-icon" />,
      text: 'Summarize this research paper',
    },
    {
      id: 'react-vue',
      icon: <TrendingUp size={20} className="prompt-icon" />,
      text: 'Compare React and Vue in detail',
    },
  ];

  return (
    <div className="welcome-container">
      <div className="welcome-hero">
        <OpenManusLogo size={52} className="hero-logo" />
        <h1 className="welcome-title">
          Hello, I’m <span className="highlight-green">Gohard</span>.
        </h1>
        <p className="welcome-subtitle">How can I help you today?</p>
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
