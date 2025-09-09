"use client";

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export function NetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    
    // Initial check inside useEffect to ensure it runs only on the client
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[200] flex items-center justify-center rounded-lg bg-black/80 px-6 py-3 text-white shadow-lg">
      <WifiOff className="mr-3 h-5 w-5" />
      <span className="text-sm font-medium">网络失败, 请稍后再试~</span>
    </div>
  );
}
