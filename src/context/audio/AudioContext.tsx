import { createContext, useContext } from "react";

interface AudioContextType {
  playSound: (filename: string) => void;
  stopSound: (filename: string) => void;
  setVolume: (volume: number) => void;
  getSound: (filename: string) => Howl | undefined;
}

export const AudioContext = createContext<AudioContextType>({
  playSound: () => {},
  stopSound: () => {},
  setVolume: () => {},
  getSound: () => undefined,
});

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}

export function useSounds() {
  const { playSound } = useAudio();
  return playSound;
}
