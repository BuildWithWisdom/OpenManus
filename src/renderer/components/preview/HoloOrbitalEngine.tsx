import React, { useEffect, useState, useRef, useMemo } from 'react';

interface HoloOrbitalEngineProps {
  courseTitle?: string;
  stageText?: string;
  progressPercent?: number;
}

function getTailoredLessonTitles(title: string): string[] {
  const lower = title.toLowerCase();

  if (
    lower.includes('machine learning') ||
    lower.includes('ml') ||
    lower.includes('ai') ||
    lower.includes('llm') ||
    lower.includes('deep learning')
  ) {
    return [
      'Foundations & Core Mathematical Objectives',
      'Data Cleaning, Feature Engineering & Normalization',
      'Supervised & Unsupervised Model Topologies',
      'Deep Neural Networks & Representation Learning',
      'Transformer Architectures & Self-Attention Mechanisms',
      'Loss Functions, Backpropagation & Optimization',
      'Model Evaluation, Cross-Validation & Hyperparameters',
      'Quantization, Pruning & Low-Latency Serving',
      'Real-Time Inference & Vector Indexing',
      'MLOps Automated Pipelines & Continuous Evaluation',
      'Interactive Model Fine-Tuning Sandbox',
      'Hands-On AI Capstone Architecture Lab',
      'Synthesizing Module Quiz & Code Verification...',
      'Optimizing Knowledge Graph Embeddings...',
      'Finalizing Production Artifacts...',
    ];
  }

  if (
    lower.includes('react') ||
    lower.includes('frontend') ||
    lower.includes('web') ||
    lower.includes('ui') ||
    lower.includes('css') ||
    lower.includes('javascript') ||
    lower.includes('typescript')
  ) {
    return [
      'Modern Component Architecture & State Paradigms',
      'Custom React Hooks & Reusable Logic Encapsulation',
      'Virtual DOM Reconciliation & Render Optimization',
      'Server Components & Streaming Server-Side Rendering',
      'Client-Side Routing & Dynamic Module Prefetching',
      'Global State Management & Signal Patterns',
      'Accessible UI Design, ARIA & Keyboard Navigation',
      'Production Bundle Splitting & Tree Shaking',
      'End-to-End Testing & Component Verification',
      'Hands-On Frontend Engineering Capstone Project',
      'Synthesizing Interactive Component Sandboxes...',
      'Validating Code Examples & Exercises...',
      'Finalizing Production Build Manifest...',
    ];
  }

  if (
    lower.includes('backend') ||
    lower.includes('node') ||
    lower.includes('system') ||
    lower.includes('api') ||
    lower.includes('microservice') ||
    lower.includes('database') ||
    lower.includes('sql')
  ) {
    return [
      'Foundations of High-Scale Backend Systems',
      'RESTful & GraphQL API Design Patterns',
      'Data Ingestion Pipelines & Event Streaming',
      'Database Schema Design & Query Optimization',
      'Distributed Caching & In-Memory Storage',
      'Authentication, Authorization & OAuth2 Flow',
      'Microservices Communication & Service Mesh',
      'Resiliency, Rate Limiting & Circuit Breakers',
      'CI/CD Deployment Pipelines & Monitoring',
      'Hands-On Production Backend Capstone',
      'Synthesizing Backend Code Sandboxes...',
      'Verifying Endpoints & Data Schemas...',
      'Finalizing API Documentation & Artifacts...',
    ];
  }

  return [
    `Foundations & Core Concepts of ${title}`,
    'Fundamental Principles & Key Concepts',
    'Advanced Architecture & Implementation Patterns',
    'Data Structuring & Workflow Optimization',
    'Security, Performance & Best Practices',
    'Integration Strategies & Real-World Use Cases',
    'Troubleshooting, Debugging & Maintenance',
    `Hands-On Capstone Project for ${title}`,
    'Synthesizing Practical Coding Challenges...',
    'Validating Knowledge Check Quizzes...',
    'Finalizing Course Modules & Syllabus...',
  ];
}

export const HoloOrbitalEngine: React.FC<HoloOrbitalEngineProps> = ({
  courseTitle = 'System Design Interview',
  stageText = 'Synthesizing Curriculum Map',
}) => {
  const [visibleCount, setVisibleCount] = useState<number>(1);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const lessonTitles = useMemo(() => getTailoredLessonTitles(courseTitle), [courseTitle]);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleCount((prev) => prev + 1);
    }, 1300);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [visibleCount]);

  return (
    <div className="holo-engine-container">
      <div className="holo-viewport">
        <div className="holo-grid-overlay" />
        <svg className="holo-svg-ring" viewBox="0 0 200 200">
          <defs>
            <radialGradient id="plasmaGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Outer Ring */}
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            stroke="rgba(16, 185, 129, 0.2)"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />

          {/* Middle Rotating Ring */}
          <circle
            cx="100"
            cy="100"
            r="72"
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth="2.5"
            strokeDasharray="80 40 20 40"
            className="spin-clockwise"
          />

          {/* Inner Counter-Rotating Ring */}
          <circle
            cx="100"
            cy="100"
            r="54"
            fill="none"
            stroke="#34d399"
            strokeWidth="1.8"
            strokeDasharray="40 20 60 10"
            className="spin-counter-clockwise"
          />

          {/* Core Plasma Aura */}
          <circle cx="100" cy="100" r="32" fill="url(#plasmaGlow)" className="holo-pulse-core" />
          <circle cx="100" cy="100" r="14" fill="#34d399" className="holo-solid-core" />
        </svg>

        <div className="holo-scanline" />
      </div>

      <div className="holo-terminal-box">
        <div className="terminal-header-bar">
          <span className="terminal-title-text">{courseTitle}</span>
        </div>
        <div className="terminal-log-body" ref={logContainerRef}>
          {lessonTitles.slice(0, visibleCount).map((lessonTitle, index) => (
            <div key={index} className="terminal-log-line fade-in">
              <span className="log-prefix">&gt;</span>
              <span className="log-text">{lessonTitle}</span>
            </div>
          ))}
          <div className="terminal-active-prompt">
            <span className="log-prefix">&gt;</span>
            <span className="log-text active-stage">{stageText}...</span>
            <span className="terminal-cursor" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HoloOrbitalEngine;
