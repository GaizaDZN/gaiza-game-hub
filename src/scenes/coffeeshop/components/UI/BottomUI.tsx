import { useCallback, useContext, useEffect, useState } from "react";
import { GameContext } from "../../../../context/game/GameContext";
import { GameMode } from "../../game/game";
import classNames from "classnames";
import { Hoverable } from "../../../../context/tooltip/Hoverable";
import { InputContext } from "../../../../context/input/InputContext";
import { keybinds } from "../../../../context/input/keybinds";

const confirmSFX = "confirm.mp3";
const cancelSFX = "stop-13692.mp3";
const brewSFX = "brew.mp3";

const BottomUI = () => {
  const {
    gameState,
    resetActiveBars,
    brewCoffee,
    setGameMode,
    completeSale,
    playSound,
  } = useContext(GameContext);
  const { currentKey } = useContext(InputContext);
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

  const handleConfirm = () => {
    playSound(confirmSFX);
    setConfirm(true);
  };

  const handleCancel = () => {
    playSound(cancelSFX);
    setCancel(true);
  };

  const handleBrewCoffee = () => {
    brewCoffee(() => playSound(brewSFX));
  };

  const clickBtn = (classname: string) => {
    const btn = document.querySelector(classname) as HTMLElement;
    if (btn) {
      btn.click();
    }
  };

  useEffect(() => {
    if (confirm) {
      confirmCheck();
      setConfirm(false);
    }

    if (cancel) {
      setCancel(false);
    }

    if (currentKey) {
      switch (currentKey) {
        case keybinds.coffeeshop.enter:
          clickBtn(".confirm-button");
          break;
        case keybinds.coffeeshop.space:
          clickBtn(".brew-button");
          break;
      }
    }
  }, [cancel, confirm, currentKey, confirmCheck]);

  return (
    <div className="bottom-ui">
      <div className="button-container">
        <div className="small-buttons">
          <Hoverable tooltip="Reset">
            <div className="btn reset-button" onClick={resetActiveBars}>
              <div className="btn-wrapper">
                <div className="btn-body">
                  <span className="btn-bg"></span>
                  <p>Reset</p>
                </div>
              </div>
            </div>
          </Hoverable>
          <Hoverable tooltip="Confirm [Enter]">
            <div
              className={classNames("btn confirm-button", {
                "btn-pulse": gameState.gameMode === GameMode.opening,
              })}
              onClick={handleConfirm}
            >
              <div className="btn-wrapper">
                <div className="btn-body">
                  <span className="btn-bg"></span>
                  <p>Confirm</p>
                </div>
              </div>
            </div>
          </Hoverable>
          <Hoverable tooltip={"Cancel"}>
            <div className="btn cancel-button" onClick={handleCancel}>
              <div className="btn-wrapper">
                <div className="btn-body">
                  <span className="btn-bg"></span>
                  <p>Cancel</p>
                </div>
              </div>
            </div>
          </Hoverable>
        </div>
        <Hoverable tooltip={"Brew [Space]"}>
          <div className="brew-button" onClick={handleBrewCoffee}>
            <div className="btn-wrapper">
              <div className="btn-tail"></div>
              <div className="btn-body">
                <p>Brew</p>
              </div>
            </div>
          </div>
        </Hoverable>
      </div>
    </div>
  );
};

export default BottomUI;
