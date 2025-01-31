import { useCallback, useEffect, useState } from "react";
import { useSounds } from "../../../../context/game/GameContext";

const typingSound = "typing_sound.mp3";
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

  const playSound = useSounds();
  const handleUpdate = useCallback(() => {
    playSound(typingSound);
    setPrintedMessage(message.substring(0, currentCharacterIndex + 1));
    setCurrentCharacterIndex((prevIndex) => prevIndex + 1);
  }, [currentCharacterIndex, message, playSound]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (currentCharacterIndex < message.length) {
        handleUpdate();
      } else {
        clearInterval(intervalId); // Stop the interval when finished
      }
    }, delay);

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, [message, delay, currentCharacterIndex, handleUpdate]);

  if (tag === "p") {
    return <p>{printedMessage}</p>;
  } else if (tag === "pre") {
    return <pre className="terminal-output">{printedMessage}</pre>;
  }
};

export default TypewriterEffect;
