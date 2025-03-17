import { useCallback, useContext, useEffect } from "react";
import { GameContext } from "../../../../../context/game/GameContext";
import { collisionEventDispatcher } from "../../../../../context/events/eventListener";
import { ScoreEvent } from "../../../game/game";

const ScoreOverlay = () => {
  const { gameState, triggerScoreEvent } = useContext(GameContext);

  const score = gameState.scoreState.score;
  const combo = gameState.scoreState.combo;

  const handleCoreHit = useCallback(() => {
    const event: ScoreEvent = "coreHit";
    triggerScoreEvent(event);
  }, [triggerScoreEvent]);

  useEffect(() => {
    collisionEventDispatcher.subscribe("coreHit", handleCoreHit);
  }, [handleCoreHit]);

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
