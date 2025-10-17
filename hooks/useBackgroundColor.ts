"use client";
import { useState, useEffect } from 'react';

export function useBackgroundColor() {
  const [backgroundColor, setBackgroundColor] = useState<string>('#87CEEB');

  // Load saved color from localStorage on mount
  useEffect(() => {
    const savedColor = localStorage.getItem('vrm-background-color');
    if (savedColor) {
      setBackgroundColor(savedColor);
    }
  }, []);

  // Save color to localStorage when it changes
  const updateBackgroundColor = (color: string) => {
    setBackgroundColor(color);
    localStorage.setItem('vrm-background-color', color);
  };

  return {
    backgroundColor,
    setBackgroundColor: updateBackgroundColor
  };
}
