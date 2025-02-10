import React, { useCallback, useMemo } from "react";

import { soundFiles } from "../../assets/assets";
import { AudioContext } from "./AudioContext";

interface AudioProviderProps {
  children: React.ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
  // Sounds

  const playSound = useCallback((filename: string) => {
    if (soundFiles[filename]) {
      const audio = new Audio(soundFiles[filename]);
      audio.play();
    } else {
      console.warn(`Sound file ${filename} not found`);
    }
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      playSound,
    }),
    [playSound]
  );

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
}
