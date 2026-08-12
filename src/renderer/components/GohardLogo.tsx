import React from 'react';
import logoImg from '../assets/logo.png';

interface LogoProps {
  size?: number;
  className?: string;
}

export const GohardLogo: React.FC<LogoProps> = ({ size = 32, className = '' }) => {
  return (
    <img
      src={logoImg}
      width={size}
      height={size}
      alt="Gohard Logo"
      className={className}
      style={{
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
    />
  );
};

export default GohardLogo;
