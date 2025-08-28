"use client";

import { useState, useEffect } from 'react';

function Candlestick({ type = 'up', style }: { type: 'up' | 'down', style: React.CSSProperties }) {
  const color = type === 'up' ? 'hsl(140 100% 30%)' : 'hsl(0 100% 40%)';
  const shadowColor = type === 'up' ? 'hsl(140 100% 40% / 0.7)' : 'hsl(0 100% 50% / 0.7)';
  return (
    <svg width="30" height="60" viewBox="0 0 30 60" style={style} className="floating-candlestick">
       <defs>
        <filter id={`shadow-${type}`} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={shadowColor} />
        </filter>
      </defs>
      <g filter={`url(#shadow-${type})`}>
        <line x1="15" y1="0" x2="15" y2="10" stroke={color} strokeWidth="2" />
        <rect x="10" y="10" width="10" height="30" fill={color} />
        <line x1="15" y1="40" x2="15" y2="60" stroke={color} strokeWidth="2" />
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

        <Candlestick type="up" style={{ top: '15%', left: '45%', animationDuration: '7s' }} />
        <Candlestick type="down" style={{ top: '70%', left: '85%', animationDuration: '9s' }} />
        <Candlestick type="up" style={{ top: '40%', left: '90%', animationDuration: '6s' }} />
        <Candlestick type="down" style={{ top: '85%', left: '30%', animationDuration: '8s' }} />
      </div>
    </div>
  );
}
