import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { AudioContext } from "../../../../context/audio/AudioContext";
import { GameContext } from "../../../../context/game/GameContext";

interface TypewriterEffectProps {
  message: string;
  delay?: number; // Optional delay between character appearances
  tag: string; // flag for appropiate tag
}

const TypewriterEffect: React.FC<TypewriterEffectProps> = ({
  message,
  delay = 35,
  tag,
}) => {
  const [printedMessage, setPrintedMessage] = useState("");
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);
  const { setTextPrinting, gameState } = useContext(GameContext);
  const { playSound } = useContext(AudioContext);
  const playInterval = 45; // milliseconds between sounds
  const timeLastPlayed = useRef<number>(0);

  const playTypingSound = useCallback(() => {
    const now = performance.now();
    if (now - timeLastPlayed.current > playInterval) {
      timeLastPlayed.current = now;
      playSound("typing_sound2");
    }
  }, [playInterval, playSound]);

  const handleUpdate = useCallback(() => {
    playTypingSound();
    setPrintedMessage(message.substring(0, currentCharacterIndex + 1));
    setCurrentCharacterIndex((prevIndex) => prevIndex + 1);
  }, [currentCharacterIndex, message, playTypingSound]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (currentCharacterIndex < message.length) {
        if (gameState.textState.textFinished) {
          setTextPrinting(true);
        }

        handleUpdate();
      } else {
        clearInterval(intervalId); // Stop the interval when finished
        setTextPrinting(false);
      }
    }, delay);

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, [
    currentCharacterIndex,
    delay,
    gameState.textState.textFinished,
    handleUpdate,
    message.length,
    setTextPrinting,
  ]);

  if (tag === "p") {
    return <p>{printedMessage}</p>;
  } else if (tag === "pre") {
    return <pre className="terminal-output">{printedMessage}</pre>;
  }
};

export default TypewriterEffect;
