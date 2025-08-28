"use client";

import { useState, useEffect } from 'react';

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
      <div className="absolute inset-0 bg-[#0f172a] opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(white,rgba(255,255,255,.2)_2px,transparent_40px),radial-gradient(white,rgba(255,255,255,.15)_1px,transparent_30px),radial-gradient(white,rgba(255,255,255,.1)_2px,transparent_40px),radial-gradient(rgba(255,255,255,.4),rgba(255,255,255,.1)_2px,transparent_30px)]"
        style={{
          backgroundSize: '550px 550px, 350px 350px, 250px 250px, 150px 150px',
          backgroundPosition: '0 0, 40px 60px, 130px 270px, 70px 100px',
        }}
      />
      <div className="floating-text-container">
        <div className="floating-text" style={{ top: '10%', left: '15%', animationDuration: '15s' }}>BTC +1.8%</div>
        <div className="floating-text" style={{ top: '20%', left: '80%', animationDuration: '12s' }}>ETH +2.5%</div>
        <div className="floating-text" style={{ top: '35%', left: '5%', animationDuration: '18s' }}>DOGE -0.5%</div>
        <div className="floating-text" style={{ top: '50%', left: '60%', animationDuration: '10s' }}>SOL +4.2%</div>
        <div className="floating-text" style={{ top: '65%', left: '25%', animationDuration: '16s' }}>XRP +0.2%</div>
        <div className="floating-text" style={{ top: '80%', left: '70%', animationDuration: '14s' }}>BNB +1.1%</div>
        <div className="floating-text" style={{ top: '90%', left: '10%', animationDuration: '20s' }}>ADA -1.3%</div>
      </div>
    </div>
  );
}