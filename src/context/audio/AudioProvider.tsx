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

      if (!howlInstances[filename]) {
        howlInstances[filename] = new Howl({
          src: [soundFiles[filename]],
          preload: true,
          autoplay: false,
        });
      }

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

  const getSound = useCallback(
    (filename: string): Howl | undefined => {
      return howlInstances[filename];
    },
    [howlInstances]
  );

  const value = useMemo(
    () => ({
      playSound,
      stopSound,
      setVolume,
      getSound,
    }),
    [playSound, stopSound, setVolume, getSound]
  );

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
}
