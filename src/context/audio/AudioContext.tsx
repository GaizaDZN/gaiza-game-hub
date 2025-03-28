import { createContext, useContext } from "react";
import { soundFiles } from "../../assets";

interface AudioContextType {
  playSound: (filename: keyof typeof soundFiles) => void;
  stopSound: (filename: keyof typeof soundFiles) => void;
  setVolume: (volume: number) => void;
  getSound: (filename: keyof typeof soundFiles) => Howl | undefined;
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
