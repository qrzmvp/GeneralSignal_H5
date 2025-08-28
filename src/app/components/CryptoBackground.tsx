"use client";

import { useState, useEffect } from 'react';

function LineChart({ style }: { style: React.CSSProperties }) {
  const color = 'hsl(var(--foreground))';
  const shadowColor = 'hsl(var(--foreground) / 0.6)';

  return (
    <svg width="150" height="80" viewBox="0 0 150 80" style={style} className="floating-candlestick">
      <defs>
        <filter id="line-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={shadowColor} />
        </filter>
      </defs>
      <path
        d="M 0 40 Q 15 60, 30 40 T 60 50 T 90 30 T 120 45 T 150 40"
        stroke={color}
        strokeWidth="2"
        fill="none"
        filter="url(#line-shadow)"
      />
    </svg>
  );
}


export function CryptoBackground() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#0f172a] opacity-95" />
      <div className="absolute inset-0 bg-[radial-gradient(white,rgba(255,255,255,.2)_2px,transparent_40px),radial-gradient(white,rgba(255,255,255,.15)_1px,transparent_30px),radial-gradient(white,rgba(255,255,255,.1)_2px,transparent_40px),radial-gradient(rgba(255,255,255,.4),rgba(255,255,255,.1)_2px,transparent_30px)]"
        style={{
          backgroundSize: '550px 550px, 350px 350px, 250px 250px, 150px 150px',
          backgroundPosition: '0 0, 40px 60px, 130px 270px, 70px 100px',
        }}
      />
      <div className="floating-container">
        <div className="floating-text" style={{ top: '10%', left: '15%', animationDuration: '8s' }}>BTC +180%</div>
        <div className="floating-text" style={{ top: '20%', left: '80%', animationDuration: '7s' }}>ETH +250%</div>
        <div className="floating-text" style={{ top: '35%', left: '5%', animationDuration: '10s' }}>DOGE -50%</div>
        <div className="floating-text" style={{ top: '50%', left: '60%', animationDuration: '6s' }}>SOL +420%</div>
        <div className="floating-text" style={{ top: '65%', left: '25%', animationDuration: '9s' }}>XRP +20%</div>
        <div className="floating-text" style={{ top: '80%', left: '70%', animationDuration: '8s' }}>BNB +110%</div>
        <div className="floating-text" style={{ top: '90%', left: '10%', animationDuration: '11s' }}>ADA -130%</div>

        <LineChart style={{ top: '15%', left: '45%', animationDuration: '7s' }} />
        <LineChart style={{ top: '70%', left: '85%', animationDuration: '9s', transform: 'scaleX(-1)' }} />
        <LineChart style={{ top: '40%', left: '90%', animationDuration: '6s' }} />
        <LineChart style={{ top: '85%', left: '30%', animationDuration: '8s', transform: 'scaleX(-1)' }} />
        <LineChart style={{ top: '55%', left: '5%', animationDuration: '12s' }} />
      </div>
    </div>
  );
}
