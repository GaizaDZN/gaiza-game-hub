import { useCallback, useContext, useEffect, useState } from "react";
import { GameContext } from "../../../../../context/game/GameContext";
import {
  collisionEventDispatcher,
  gameEventDispatcher,
} from "../../../../../context/events/eventListener";
import { ScoreEvent, scoreEvents } from "../../../game/game";

const ScoreOverlay = () => {
  const { updateScoreState, gameState } = useContext(GameContext);
  const [score, setScore] = useState(0);
  const [highscore, setHighscore] = useState(gameState.scoreState.highScore);
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
    setHighscore(Math.max(score, highscore));
  }, [highscore, increaseScore, score]);

  const handleSale = useCallback(() => {
    setScore((prevScore) => {
      const newScore = prevScore + scoreEvents["sale"].score * combo;
      updateScoreState(newScore, combo);
      return newScore;
    });

    setCombo((prevCombo) => prevCombo + 1);
  }, [updateScoreState, combo]);

  const resetCombo = useCallback(() => {
    setCombo(1);
  }, []);

  const handlePlayerDeath = useCallback(() => {
    updateScoreState(score, combo);
    setHighscore(Math.max(score, highscore));
  }, [combo, highscore, score, updateScoreState]);

  const handleSalesStart = () => {
    setScore(0);
  };

  useEffect(() => {
    collisionEventDispatcher.subscribe("coreHit", handleCoreHit);
    collisionEventDispatcher.subscribe("playerHit", resetCombo);
    gameEventDispatcher.subscribe("playerDeath", handlePlayerDeath);
    gameEventDispatcher.subscribe("sale", handleSale);
    gameEventDispatcher.subscribe("saleFail", resetCombo);
    gameEventDispatcher.subscribe("enterSalesMode", handleSalesStart);

    return () => {
      collisionEventDispatcher.unsubscribe("coreHit", handleCoreHit);
      collisionEventDispatcher.unsubscribe("playerHit", resetCombo);
      gameEventDispatcher.unsubscribe("playerDeath", handlePlayerDeath);
      gameEventDispatcher.unsubscribe("sale", handleSale);
      gameEventDispatcher.unsubscribe("saleFail", resetCombo);
      gameEventDispatcher.unsubscribe("enterSalesMode", handleSalesStart);
    };
  }, [handleCoreHit, handlePlayerDeath, handleSale, resetCombo]);

  return (
    <div className="score__container">
      <div className="score-number__container">
        <span className="score-number">{score}</span>
        <span className="score-text">score</span>
      </div>
      <div className="highscore-number__container">
        <span className="highscore-number">{highscore}</span>
        <span className="highscore-text">highscore</span>
      </div>
      <div className="score-combo__container">
        <span className="combo-number">{combo}</span>
        <span className="combo-text">combo</span>
      </div>
    </div>
  );
};

export default ScoreOverlay;
