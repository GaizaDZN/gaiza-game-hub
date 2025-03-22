import { useCallback, useContext, useEffect, useState } from "react";
import { GameContext } from "../../../../../context/game/GameContext";
import {
  collisionEventDispatcher,
  gameEventDispatcher,
} from "../../../../../context/events/eventListener";
import { GameMode, ScoreEvent, scoreEvents } from "../../../game/game";
import { OverlayStates } from "./types";

const ScoreOverlay = () => {
  const { updateScoreState, gameState } = useContext(GameContext);
  const [pendingScoreUpdate, setPendingScoreUpdate] = useState(false);
  const [scoreOverlayState, setScoreOverlayState] =
    useState<OverlayStates>("hidden");
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
    setScore((prevScore) => prevScore + scoreEvents["sale"].score * combo);
    setPendingScoreUpdate(true); // Flag for score update
    setCombo((prevCombo) => prevCombo + 1);
  }, [combo]);

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

  const handleScoreUpdate = (score: number): string => {
    const newScoreText = "00000000";
    const newScoreStr = score.toString();
    return (
      newScoreText.substring(0, newScoreText.length - newScoreStr.length) +
      newScoreStr
    );
  };

  useEffect(() => {
    if (scoreOverlayState === "hidden" && gameState.gameMode === GameMode.sales)
      setScoreOverlayState("idle");

    if (pendingScoreUpdate) {
      updateScoreState(score, combo);
      setPendingScoreUpdate(false);
    }

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
  }, [
    combo,
    gameState.gameMode,
    handleCoreHit,
    handlePlayerDeath,
    handleSale,
    pendingScoreUpdate,
    resetCombo,
    score,
    scoreOverlayState,
    updateScoreState,
  ]);

  return (
    <div
      className={`score__container ${
        scoreOverlayState === "hidden" ? "hidden" : "fade-in ui-open"
      }`}
    >
      <div className="score-number__container">
        <span className="score-number">{handleScoreUpdate(score)}</span>
        {/* <span className="score-text">score</span> */}
      </div>
      <div className="highscore-number__container">
        {/* <span className="highscore-number">{highscore}</span> */}
        {/* <span className="highscore-text">highscore</span> */}
      </div>
      <div className="score-combo__container">
        <span className="combo-number">{combo}</span>
        <span className="combo-text">X</span>
      </div>
    </div>
  );
};

export default ScoreOverlay;
