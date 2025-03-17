import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { GameContext } from "../../../../../context/game/GameContext";
import {
  CollisionEvent,
  collisionEventDispatcher,
  GameEvent,
  gameEventDispatcher,
} from "../../../../../context/events/eventListener";
import { ScoreEvent, scoreEvents } from "../../../game/game";

const ScoreOverlay = () => {
  const { updateScoreState } = useContext(GameContext);
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
    setCombo(combo + 1);
  }, [increaseScore, combo]);

  const resetCombo = useCallback(() => {
    setCombo(1);
  }, []);

  const handlePlayerDeath = useCallback(() => {
    updateScoreState(score, combo);
  }, [combo, score, updateScoreState]);

  const eventHandlers = useMemo(
    () => ({
      coreHit: handleCoreHit,
      playerHit: resetCombo,
      playerDeath: handlePlayerDeath,
      sale: handleSale,
      saleFail: resetCombo,
    }),
    [handleCoreHit, handleSale, resetCombo, handlePlayerDeath]
  );

  useEffect(() => {
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      if (event.startsWith("core") || event.startsWith("player")) {
        collisionEventDispatcher.subscribe(event as CollisionEvent, handler);
      } else {
        gameEventDispatcher.subscribe(event as GameEvent, handler);
      }
    });

    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        if (event.startsWith("core") || event.startsWith("player")) {
          collisionEventDispatcher.unsubscribe(
            event as CollisionEvent,
            handler
          );
        } else {
          gameEventDispatcher.unsubscribe(event as GameEvent, handler);
        }
      });
    };
  }, [eventHandlers]);

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
