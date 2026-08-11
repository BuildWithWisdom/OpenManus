import React, { useEffect, useRef } from 'react';

interface Particle {
  positionX: number;
  positionY: number;
  velocityX: number;
  velocityY: number;
  radius: number;
  baseAlpha: number;
  pulseSpeed: number;
  pulsePhase: number;
}

interface NeuralParticleCanvasProps {
  width?: number;
  height?: number;
  particleCount?: number;
  accentColor?: string;
}

export const NeuralParticleCanvas: React.FC<NeuralParticleCanvasProps> = ({
  width = 600,
  height = 220,
  particleCount = 28,
  accentColor = '#10b981',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    let animationFrameId: number;

    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      positionX: Math.random() * width,
      positionY: Math.random() * height,
      velocityX: (Math.random() - 0.5) * 0.7,
      velocityY: (Math.random() - 0.5) * 0.7,
      radius: Math.random() * 2.5 + 1.5,
      baseAlpha: Math.random() * 0.5 + 0.3,
      pulseSpeed: Math.random() * 0.03 + 0.01,
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    let rotationAngle = 0;

    const renderFrame = () => {
      context.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      rotationAngle += 0.008;

      context.save();
      context.translate(centerX, centerY);
      context.rotate(rotationAngle);

      const outerGlow = context.createRadialGradient(0, 0, 10, 0, 0, 65);
      outerGlow.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
      outerGlow.addColorStop(0.5, 'rgba(6, 182, 212, 0.15)');
      outerGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
      context.fillStyle = outerGlow;
      context.beginPath();
      context.arc(0, 0, 65, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = 'rgba(16, 185, 129, 0.25)';
      context.lineWidth = 1.2;
      context.beginPath();
      context.ellipse(0, 0, 50, 22, Math.PI / 4, 0, Math.PI * 2);
      context.stroke();

      context.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      context.beginPath();
      context.ellipse(0, 0, 50, 22, -Math.PI / 4, 0, Math.PI * 2);
      context.stroke();

      context.restore();

      const coreGradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, 24);
      coreGradient.addColorStop(0, '#34d399');
      coreGradient.addColorStop(0.6, '#10b981');
      coreGradient.addColorStop(1, '#059669');

      context.fillStyle = coreGradient;
      context.shadowColor = '#10b981';
      context.shadowBlur = 18;
      context.beginPath();
      context.arc(centerX, centerY, 14, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;

      for (let firstIndex = 0; firstIndex < particles.length; firstIndex++) {
        for (let secondIndex = firstIndex + 1; secondIndex < particles.length; secondIndex++) {
          const firstParticle = particles[firstIndex];
          const secondParticle = particles[secondIndex];
          const deltaX = firstParticle.positionX - secondParticle.positionX;
          const deltaY = firstParticle.positionY - secondParticle.positionY;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

          if (distance < 95) {
            const lineOpacity = (1 - distance / 95) * 0.35;
            context.strokeStyle = `rgba(16, 185, 129, ${lineOpacity})`;
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(firstParticle.positionX, firstParticle.positionY);
            context.lineTo(secondParticle.positionX, secondParticle.positionY);
            context.stroke();
          }
        }

        const currentParticle = particles[firstIndex];
        const distanceToCoreX = currentParticle.positionX - centerX;
        const distanceToCoreY = currentParticle.positionY - centerY;
        const distanceToCore = Math.sqrt(distanceToCoreX * distanceToCoreX + distanceToCoreY * distanceToCoreY);

        if (distanceToCore < 130) {
          const coreOpacity = (1 - distanceToCore / 130) * 0.25;
          context.strokeStyle = `rgba(52, 211, 153, ${coreOpacity})`;
          context.lineWidth = 0.8;
          context.beginPath();
          context.moveTo(currentParticle.positionX, currentParticle.positionY);
          context.lineTo(centerX, centerY);
          context.stroke();
        }
      }

      particles.forEach((particle) => {
        particle.positionX += particle.velocityX;
        particle.positionY += particle.velocityY;

        if (particle.positionX < 0 || particle.positionX > width) particle.velocityX *= -1;
        if (particle.positionY < 0 || particle.positionY > height) particle.velocityY *= -1;

        particle.pulsePhase += particle.pulseSpeed;
        const currentAlpha = particle.baseAlpha + Math.sin(particle.pulsePhase) * 0.2;

        context.fillStyle = accentColor;
        context.globalAlpha = Math.max(0.1, Math.min(1, currentAlpha));
        context.shadowColor = accentColor;
        context.shadowBlur = 8;
        context.beginPath();
        context.arc(particle.positionX, particle.positionY, particle.radius, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;
        context.globalAlpha = 1;
      });

      animationFrameId = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [width, height, particleCount, accentColor]);

  return (
    <div className="neural-canvas-wrapper">
      <canvas ref={canvasRef} width={width} height={height} className="neural-canvas-element" />
    </div>
  );
};

export default NeuralParticleCanvas;
