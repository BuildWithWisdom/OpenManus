import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, CheckCircle2, Sparkles, Layers, Eye, X, ArrowRightLeft } from 'lucide-react';
import { NeuralParticleCanvas } from './NeuralParticleCanvas';
import { HoloOrbitalEngine } from './HoloOrbitalEngine';
import { SequentialGenerationVisualizer } from './SequentialGenerationVisualizer';

interface AnimationPreviewPageProps {
  onClose?: () => void;
  onSelectWinningOption?: (option: 1 | 2 | 3) => void;
}

const STAGES = [
  { id: 1, label: 'Ingesting Profile', desc: 'Reading learner knowledge level & goals', percent: 25 },
  { id: 2, label: 'Mapping Knowledge Graph', desc: 'Synthesizing prerequisite dependency tree', percent: 55 },
  { id: 3, label: 'Decomposing Modules', desc: 'Creating structured learning units & lessons', percent: 85 },
  { id: 4, label: 'Finalizing Blueprint', desc: 'Validating course JSON schema & saving', percent: 100 },
];

export const AnimationPreviewPage: React.FC<AnimationPreviewPageProps> = ({
  onClose,
  onSelectWinningOption,
}) => {
  const [viewMode, setViewMode] = useState<'sequence' | 'split' | 'option1' | 'option2'>('sequence');
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [selectedWinner, setSelectedWinner] = useState<number | null>(null);
  const [sequenceKey, setSequenceKey] = useState<number>(0);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentStageIndex((prev) => (prev + 1) % STAGES.length);
    }, 2800);

    return () => clearInterval(timer);
  }, [isPlaying]);

  const activeStage = STAGES[currentStageIndex];

  const handleRestart = () => {
    setCurrentStageIndex(0);
    setIsPlaying(true);
    setSequenceKey((prev) => prev + 1);
  };

  const handleSelectWinner = (option: 1 | 2 | 3) => {
    setSelectedWinner(option);
    onSelectWinningOption?.(option);
  };

  return (
    <div className="preview-page-container">
      {/* Top Header */}
      <div className="preview-top-bar">
        <div className="preview-title-box">
          <Sparkles className="preview-sparkle-icon" size={22} />
          <div>
            <h1 className="preview-heading">Gohard AI — Animation Lab Preview</h1>
            <p className="preview-subheading">Compare live course generation animations and test the 2-stage sequential flow</p>
          </div>
        </div>

        <div className="preview-mode-switch">
          <button
            className={`mode-btn ${viewMode === 'sequence' ? 'active' : ''}`}
            onClick={() => setViewMode('sequence')}
          >
            <ArrowRightLeft size={16} />
            <span>2-Stage Flow (3s Switch)</span>
          </button>
          <button
            className={`mode-btn ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
          >
            <Layers size={16} />
            <span>Side-by-Side</span>
          </button>
          <button
            className={`mode-btn ${viewMode === 'option1' ? 'active' : ''}`}
            onClick={() => setViewMode('option1')}
          >
            <Eye size={16} />
            <span>Option 1 Only</span>
          </button>
          <button
            className={`mode-btn ${viewMode === 'option2' ? 'active' : ''}`}
            onClick={() => setViewMode('option2')}
          >
            <Eye size={16} />
            <span>Option 2 Only</span>
          </button>
        </div>

        {onClose && (
          <button className="preview-close-btn" onClick={onClose} aria-label="Close preview">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Control Toolbar */}
      <div className="preview-controls-bar">
        <div className="control-left-group">
          <button className="control-action-btn" onClick={() => setIsPlaying((prev) => !prev)}>
            <Play size={16} className={isPlaying ? 'playing' : ''} />
            <span>{isPlaying ? 'Pause Simulation' : 'Resume Simulation'}</span>
          </button>
          <button className="control-action-btn" onClick={handleRestart}>
            <RotateCcw size={16} />
            <span>Restart Stages</span>
          </button>
        </div>
      </div>

      {/* Main Preview Workspace */}
      <div className={`preview-workspace ${viewMode}`}>
        {/* SEQUENTIAL 2-STAGE FLOW CARD */}
        {viewMode === 'sequence' && (
          <div className="preview-card-wrapper full-width">
            <SequentialGenerationVisualizer key={sequenceKey} onRestart={handleRestart} />
          </div>
        )}

        {/* OPTION 1 CARD */}
        {(viewMode === 'split' || viewMode === 'option1') && (
          <div className={`preview-card-wrapper ${selectedWinner === 1 ? 'winner-card' : ''}`}>
            <div className="card-header-badge">
              <span className="option-tag">OPTION 1</span>
              <span className="option-name">Quantum Neural Canvas & Staggered Blueprint</span>
              <button
                className={`select-winner-btn ${selectedWinner === 1 ? 'selected' : ''}`}
                onClick={() => handleSelectWinner(1)}
              >
                <CheckCircle2 size={16} />
                <span>{selectedWinner === 1 ? 'Chosen Design' : 'Select Option 1'}</span>
              </button>
            </div>

            <div className="mock-modal-view">
              <div className="mock-modal-header">
                <h3 className="mock-title">Gohard AI is Structuring Your Course</h3>
                <p className="mock-subtitle">
                  Designing tailored modules for <strong>System Design Interview</strong>...
                </p>
              </div>

              {/* Neural Particle Canvas Component */}
              <div className="neural-canvas-container">
                <NeuralParticleCanvas width={520} height={190} accentColor="#10b981" />
              </div>

              {/* Dynamic Laser Progress Bar */}
              <div className="quantum-progress-box">
                <div className="progress-track">
                  <div
                    className="progress-fill-laser"
                    style={{ width: `${activeStage.percent}%` }}
                  >
                    <span className="laser-edge-light" />
                  </div>
                </div>

                <div className="progress-labels-row">
                  {STAGES.map((stg, index) => (
                    <div
                      key={stg.id}
                      className={`stage-node ${index <= currentStageIndex ? 'active' : ''}`}
                    >
                      <span className="node-dot" />
                      <span className="node-title">{stg.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real-time Materializing Blueprint Cards */}
              <div className="blueprint-cards-grid">
                {[
                  { order: 1, title: 'Module 1: Distributed Core Concepts', lessons: 4, unlockStage: 0 },
                  { order: 2, title: 'Module 2: Scalability & Load Balancing', lessons: 5, unlockStage: 1 },
                  { order: 3, title: 'Module 3: Storage & Sharding Strategies', lessons: 6, unlockStage: 2 },
                ].map((mod) => {
                  const isVisible = currentStageIndex >= mod.unlockStage;

                  return (
                    <div
                      key={mod.order}
                      className={`skeleton-module-card ${isVisible ? 'materialized' : 'hidden-skeleton'}`}
                    >
                      <div className="skeleton-card-top">
                        <span className="module-badge">MODULE 0{mod.order}</span>
                        {isVisible && <span className="status-live-tag">Materializing...</span>}
                      </div>
                      <div className="skeleton-title">{mod.title}</div>
                      <div className="skeleton-lines">
                        <div className="shimmer-line long" />
                        <div className="shimmer-line short" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* OPTION 2 CARD */}
        {(viewMode === 'split' || viewMode === 'option2') && (
          <div className={`preview-card-wrapper ${selectedWinner === 2 ? 'winner-card' : ''}`}>
            <div className="card-header-badge">
              <span className="option-tag">OPTION 2</span>
              <span className="option-name">Holographic Orbital Core & Cybernetic Terminal</span>
              <button
                className={`select-winner-btn ${selectedWinner === 2 ? 'selected' : ''}`}
                onClick={() => handleSelectWinner(2)}
              >
                <CheckCircle2 size={16} />
                <span>{selectedWinner === 2 ? 'Chosen Design' : 'Select Option 2'}</span>
              </button>
            </div>

            <div className="mock-modal-view">
              <div className="mock-modal-header">
                <h3 className="mock-title">Gohard AI is Structuring Your Course</h3>
                <p className="mock-subtitle">
                  Designing tailored modules for <strong>System Design Interview</strong>...
                </p>
              </div>

              {/* Holo Orbital Engine Component */}
              <HoloOrbitalEngine
                stageText={activeStage.label}
                progressPercent={activeStage.percent}
              />

              {/* Cyber Blueprint Cards Grid */}
              <div className="cyber-cards-grid">
                {[
                  { order: 1, title: 'Foundations of Distributed Architectures', lessons: 4 },
                  { order: 2, title: 'High Availability & Fault Tolerance', lessons: 5 },
                  { order: 3, title: 'Consensus Protocols & Replication', lessons: 6 },
                ].map((mod) => (
                  <div key={mod.order} className="cyber-module-card perspective-entrance">
                    <div className="cyber-card-header">
                      <span className="cyber-level-tag">LEVEL 0{mod.order}</span>
                      <span className="cyber-lessons-count">{mod.lessons} Lessons</span>
                    </div>
                    <div className="cyber-card-title">{mod.title}</div>
                    <div className="cyber-card-bar">
                      <div className="cyber-fill" style={{ width: `${activeStage.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimationPreviewPage;
