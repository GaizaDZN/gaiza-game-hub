import { useCallback, useContext, useEffect, useState } from "react";
import { GameContext } from "../../../../../context/game/GameContext";
import {
  collisionEventDispatcher,
  gameEventDispatcher,
} from "../../../../../context/events/eventListener";
import { ScoreEvent, scoreEvents } from "../../../game/game";

const ScoreOverlay = () => {
  const { gameState } = useContext(GameContext);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);

  const increaseScore = useCallback(
    (scoreEventType: ScoreEvent) => {
      setScore((prevScore: number) => {
        return prevScore + scoreEvents[scoreEventType].score * combo;
      });
    },
    [combo]
  );

  const handleCoreHit = useCallback(() => {
    increaseScore("coreHit");
  }, [increaseScore]);

  const handleSale = useCallback(() => {
    increaseScore("sale");
  }, [increaseScore]);

  useEffect(() => {
    collisionEventDispatcher.subscribe("coreHit", handleCoreHit);
    gameEventDispatcher.subscribe("sale", handleSale);
    return () => {
      collisionEventDispatcher.unSubscribe("coreHit", handleCoreHit);
      gameEventDispatcher.unSubscribe("sale", handleSale);
    };
  }, [handleCoreHit, handleSale]);

  return (
    <div className="score__container">
      <div className="score-number__container">
        <span className="score-number">{score}</span>
        <span className="score-text">score</span>
      </div>
      <div className="score-combo__container">
        <span className="combo-number">{combo}</span>
        <span className="combo-text">combo</span>
      </div>
    </div>
  );
};

export default ScoreOverlay;
