import { useCallback, useContext, useEffect, useState } from "react";
import { AudioContext } from "../../../../context/audio/AudioContext";
import { GameContext } from "../../../../context/game/GameContext";

interface TypewriterEffectProps {
  message: string;
  delay?: number; // Optional delay between character appearances
  tag: string; // flag for appropiate tag
}

const TypewriterEffect: React.FC<TypewriterEffectProps> = ({
  message,
  delay = 40,
  tag,
}) => {
  const [printedMessage, setPrintedMessage] = useState("");
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);
  const { setTextPrinting, gameState } = useContext(GameContext);
  const { playSound } = useContext(AudioContext);

  const handleUpdate = useCallback(() => {
    playSound("typing_sound");
    setPrintedMessage(message.substring(0, currentCharacterIndex + 1));
    setCurrentCharacterIndex((prevIndex) => prevIndex + 1);
  }, [currentCharacterIndex, message, playSound]);

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
