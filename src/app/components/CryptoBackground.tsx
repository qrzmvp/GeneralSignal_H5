"use client";

import { useState, useEffect } from 'react';

function CandlestickChart({ style, pattern = 1 }: { style: React.CSSProperties, pattern?: number }) {
  const color = 'hsl(var(--foreground))';
  const shadowColor = 'hsl(var(--foreground) / 0.6)';

  const patterns = [
    // Pattern 1: Upward trend
    <g key="p1">
      <line x1="10" y1="10" x2="10" y2="45" stroke={color} strokeWidth="1.5" />
      <rect x="5" y="25" width="10" height="15" fill={color} />
      <line x1="30" y1="5" x2="30" y2="40" stroke={color} strokeWidth="1.5" />
      <rect x="25" y="15" width="10" height="20" fill={color} />
      <line x1="50" y1="2" x2="50" y2="35" stroke={color} strokeWidth="1.5" />
      <rect x="45" y="8" width="10" height="18" fill={color} />
    </g>,
    // Pattern 2: Downward trend
    <g key="p2">
      <line x1="10" y1="2" x2="10" y2="35" stroke={color} strokeWidth="1.5" />
      <rect x="5" y="8" width="10" height="18" fill="none" stroke={color} strokeWidth="1.5" />
      <line x1="30" y1="5" x2="30" y2="40" stroke={color} strokeWidth="1.5" />
      <rect x="25" y="15" width="10" height="20" fill="none" stroke={color} strokeWidth="1.5" />
      <line x1="50" y1="10" x2="50" y2="45" stroke={color} strokeWidth="1.5" />
      <rect x="45" y="25" width="10" height="15" fill="none" stroke={color} strokeWidth="1.5" />
    </g>,
    // Pattern 3: Volatile / Sideways
    <g key="p3">
       <line x1="10" y1="5" x2="10" y2="45" stroke={color} strokeWidth="1.5" />
       <rect x="5" y="15" width="10" height="20" fill={color} />
       <line x1="30" y1="10" x2="30" y2="40" stroke={color} strokeWidth="1.5" />
       <rect x="25" y="25" width="10" height="10" fill="none" stroke={color} strokeWidth="1.5" />
       <line x1="50" y1="2" x2="50" y2="38" stroke={color} strokeWidth="1.5" />
       <rect x="45" y="10" width="10" height="15" fill={color} />
    </g>
  ];

  return (
    <svg width="60" height="50" viewBox="0 0 60 50" style={style} className="floating-candlestick">
      <defs>
        <filter id="candlestick-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor={shadowColor} />
        </filter>
      </defs>
      <g filter="url(#candlestick-shadow)">
        {patterns[pattern]}
      </g>
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

        <CandlestickChart style={{ top: '15%', left: '45%', animationDuration: '7s' }} pattern={0} />
        <CandlestickChart style={{ top: '70%', left: '85%', animationDuration: '9s', transform: 'scaleX(-1)' }} pattern={1} />
        <CandlestickChart style={{ top: '40%', left: '90%', animationDuration: '6s' }} pattern={2}/>
        <CandlestickChart style={{ top: '85%', left: '30%', animationDuration: '8s', transform: 'scaleX(-1)' }} pattern={0} />
        <CandlestickChart style={{ top: '55%', left: '5%', animationDuration: '12s' }} pattern={1} />
        <CandlestickChart style={{ top: '5%', left: '70%', animationDuration: '10s', transform: 'scaleX(-1)' }} pattern={2} />
        <CandlestickChart style={{ top: '25%', left: '30%', animationDuration: '8s' }} pattern={1} />
      </div>
    </div>
  );
}
