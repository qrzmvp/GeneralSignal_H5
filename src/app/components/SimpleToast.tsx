"use client";

import { useState, useEffect } from 'react';

interface SimpleToastProps {
  message: string;
  duration?: number;
  onDismiss: () => void;
}

export function SimpleToast({ message, duration = 1000, onDismiss }: SimpleToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] rounded-lg bg-black/80 px-6 py-3 text-white shadow-lg animate-in fade-in zoom-in-95">
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
