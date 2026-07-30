import React from 'react';
import logoImg from './logo.png';

interface LogoProps {
  size?: number;
  className?: string;
}

export const OpenManusLogo: React.FC<LogoProps> = ({ size = 32, className = '' }) => {
  return (
    <img
      src={logoImg}
      width={size}
      height={size}
      alt="OpenManus Logo"
      className={className}
      style={{
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
    />
  );
};

export default OpenManusLogo;
