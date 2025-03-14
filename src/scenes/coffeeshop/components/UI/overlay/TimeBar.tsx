import { useContext, useEffect, useState } from "react";
import { GameContext } from "../../../../../context/game/GameContext";

const TimeBar: React.FC = () => {
  const { gameState } = useContext(GameContext);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [animateTimer, setAnimateTimer] = useState(false);

  const timer = gameState.timers.get("sales");

  useEffect(() => {
    if (!timer) return;

    // toggle timebar animation class
    if (!animateTimer && timer.active) {
      setAnimateTimer(true);
    } else if (animateTimer && !timer.active) {
      setAnimateTimer(false);
    }

    // update the countdown
    const updateTimer = () => {
      if (!timer.active) {
        setTimeLeft(timer.allottedTime);
        return;
      }

      const timeNow = Date.now();
      const elapsed = Math.floor((timeNow - timer.startTime) / 1000); // Convert ms to seconds
      const remaining = Math.max(timer.allottedTime - elapsed, 0);
      setTimeLeft(remaining);
    };

    // Initial calculation
    updateTimer();

    // Start interval
    const interval = setInterval(updateTimer, 1000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [animateTimer, timer]);

  return (
    <div className="timebar__container">
      <div className={`timebar ${animateTimer ? "animate" : ""}`}></div>
      {timer && (
        <div className="timebar-text__container">
          <span className="timebar-text">{timeLeft}</span>
        </div>
      )}
    </div>
  );
};

export default TimeBar;
