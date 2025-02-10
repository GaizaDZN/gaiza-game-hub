import React, { useCallback, useMemo } from "react";
import { Howl, Howler } from "howler";

import { soundFiles } from "../../assets/assets";
import { AudioContext } from "./AudioContext";

interface AudioProviderProps {
  children: React.ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
  const howlInstances = useMemo<Record<string, Howl>>(() => ({}), []);

  const playSound = useCallback(
    (filename: string) => {
      if (!soundFiles[filename]) {
        console.warn(`Sound file ${filename} not found`);
        return;
      }

      // Create a new Howl instance if it doesn't exist
      if (!howlInstances[filename]) {
        howlInstances[filename] = new Howl({
          src: [soundFiles[filename]],
          preload: true, // Preload the audio file
          autoplay: false, // Don't autoplay
        });
      }

      // Play the sound
      howlInstances[filename].play();
    },
    [howlInstances]
  );

  const stopSound = useCallback(
    (filename: string) => {
      if (howlInstances[filename]) {
        howlInstances[filename].stop();
      }
    },
    [howlInstances]
  );

  const setVolume = useCallback((volume: number) => {
    Howler.volume(volume);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      playSound,
      stopSound,
      setVolume,
    }),
    [playSound, setVolume, stopSound]
  );

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
}
