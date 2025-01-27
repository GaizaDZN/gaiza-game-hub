import { useCallback, useContext, useEffect, useState } from "react";
import { GameContext } from "../../../context/GameContext";
import { GameMode } from "../game/game";
import classNames from "classnames";

const BottomUI = () => {
  const { gameState, resetActiveBars, brewCoffee, setGameMode, completeSale } =
    useContext(GameContext);
  const [confirm, setConfirm] = useState<boolean>(false);
  const [cancel, setCancel] = useState<boolean>(false);

  const confirmCheck = useCallback(() => {
    const mode = gameState.gameMode;
    switch (mode) {
      case GameMode.opening:
        setGameMode(GameMode.sales);
        break;
      case GameMode.sales:
        completeSale();
        break;
      case GameMode.closing:
        break;
      default:
        break;
    }
  }, [completeSale, gameState.gameMode, setGameMode]);

  useEffect(() => {
    if (confirm) {
      confirmCheck();
      setConfirm(false);
    }

    if (cancel) {
      setCancel(false);
    }
  }, [cancel, confirm, confirmCheck]);

  return (
    <div className="bottom-ui">
      <div className="button-container">
        <div className="small-buttons">
          <div className="btn reset-button" onClick={resetActiveBars}>
            <div className="btn-wrapper">
              <div className="btn-body">
                <span className="btn-bg"></span>
                <p>Reset</p>
              </div>
            </div>
          </div>
          <div
            className={classNames("btn confirm-button", {
              "btn-pulse": gameState.gameMode === GameMode.opening,
            })}
            onClick={() => setConfirm(true)}
          >
            <div className="btn-wrapper">
              <div className="btn-body">
                <span className="btn-bg"></span>
                <p>Confirm</p>
              </div>
            </div>
          </div>
          <div className="btn cancel-button" onClick={() => setCancel(true)}>
            <div className="btn-wrapper">
              <div className="btn-body">
                <span className="btn-bg"></span>
                <p>Cancel</p>
              </div>
            </div>
          </div>
        </div>
        <div className="brew-button" onClick={brewCoffee}>
          <div className="btn-wrapper">
            <div className="btn-tail"></div>
            <div className="btn-body">
              <p>Brew</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomUI;
