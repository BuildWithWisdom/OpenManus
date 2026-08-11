import React, { useState, useEffect } from 'react';
import { NeuralParticleCanvas } from './NeuralParticleCanvas';
import { HoloOrbitalEngine } from './HoloOrbitalEngine';
import { Wifi, Sparkles, CheckCircle2 } from 'lucide-react';

interface SequentialGenerationVisualizerProps {
  topicTitle?: string;
  connectionDelayMs?: number;
  onRestart?: () => void;
  onPhaseChange?: (phase: 'CONNECTING' | 'GENERATING') => void;
}

export const SequentialGenerationVisualizer: React.FC<SequentialGenerationVisualizerProps> = ({
  topicTitle = 'System Design Interview',
  connectionDelayMs = 6000,
  onRestart,
  onPhaseChange,
}) => {
  const [phase, setPhase] = useState<'CONNECTING' | 'GENERATING'>('CONNECTING');
  const [progressPercent, setProgressPercent] = useState<number>(5);
  const [activeStageText, setActiveStageText] = useState<string>('Establishing secure neural connection');

  useEffect(() => {
    setPhase('CONNECTING');
    if (onPhaseChange) onPhaseChange('CONNECTING');
    setProgressPercent(8);
    setActiveStageText('Connecting to Gohard AI Agent');

    const connectTimer = setTimeout(() => {
      setPhase('GENERATING');
      if (onPhaseChange) onPhaseChange('GENERATING');
      setActiveStageText('Synthesizing domain knowledge map');
    }, connectionDelayMs);

    return () => clearTimeout(connectTimer);
  }, [connectionDelayMs, onPhaseChange]);

  useEffect(() => {
    if (phase === 'CONNECTING') {
      const interval = setInterval(() => {
        setProgressPercent((prev) => Math.min(22, prev + 3));
      }, 300);
      return () => clearInterval(interval);
    } else {
      const interval = setInterval(() => {
        setProgressPercent((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [phase]);

  return (
    <div className="sequential-visualizer-card">
      {/* Animation Viewport Container */}
      <div className="sequential-animation-viewport">
        {phase === 'CONNECTING' ? (
          <div className="view-stage connecting-stage fade-in-view">
            <NeuralParticleCanvas width={680} height={320} accentColor="#10b981" />
          </div>
        ) : (
          <div className="view-stage generating-stage fade-in-view">
            <HoloOrbitalEngine courseTitle={topicTitle} stageText={activeStageText} progressPercent={progressPercent} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SequentialGenerationVisualizer;
