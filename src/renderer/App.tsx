import React, { useState } from 'react';

export const App: React.FC = () => {
  const [clickCount, setClickCount] = useState<number>(0);

  const incrementCounter = (): void => {
    setClickCount((previousCount) => previousCount + 1);
  };

  const resetCounter = (): void => {
    setClickCount(0);
  };

  return (
    <div className="container">
      <div className="badge">
        <span>⚡</span> React 19 + Electron Forge + Vite
      </div>
      <h1 className="hero-title">Electron + React App</h1>
      <p className="hero-subtitle">
        Your application is now configured with the scalable architecture pattern!
      </p>

      <div className="interactive-card">
        <div className="counter-value">{clickCount}</div>
        <div className="button-group">
          <button className="btn btn-primary" onClick={incrementCounter}>
            Increment Counter
          </button>
          <button className="btn btn-secondary" onClick={resetCounter}>
            Reset
          </button>
        </div>
      </div>

      <div className="footer-info">
        Main: <code>src/main/main.ts</code> | Preload: <code>src/preload/preload.ts</code> | UI: <code>src/renderer/App.tsx</code>
      </div>
    </div>
  );
};

export default App;
