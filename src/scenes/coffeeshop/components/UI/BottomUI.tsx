import { useCallback, useContext, useEffect } from "react";
import { GameContext } from "../../../../context/game/GameContext";
import { GameMode } from "../../game/game";
import classNames from "classnames";
import { Hoverable } from "../../../../context/tooltip/Hoverable";
import { keybinds } from "../../../../context/input/keybinds";
import { inputDispatcher } from "../../../../context/input/InputDispatcher";

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

  const confirmCheck = useCallback(() => {
    const mode = gameState.gameMode;
    switch (mode) {
      case GameMode.opening:
        setGameMode(GameMode.sales);
        break;
      case GameMode.sales:
        completeSale();
        break;
      case GameMode.dayEnd:
        setGameMode(GameMode.opening);
        break;
      default:
        break;
    }
  }, [completeSale, gameState.gameMode, setGameMode]);

  const handleConfirm = () => {
    playSound(confirmSFX);
    confirmCheck();
  };

  const handleCancel = () => {
    playSound(cancelSFX);
  };

  const handleBrewCoffee = () => {
    brewCoffee(() => playSound(brewSFX));
  };

  const clickBtn = (classname: string) => {
    const btn = document.querySelector(classname) as HTMLElement;
    if (btn) {
      const pointerEvent = new PointerEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
        view: window,
        button: 0, // Left mouse button
        buttons: 1, // Left mouse button pressed
        clientX: btn.offsetLeft + btn.offsetWidth / 2, // Center of the button
        clientY: btn.offsetTop + btn.offsetHeight / 2,
      });
      btn.dispatchEvent(pointerEvent);

      const pointerUpEvent = new PointerEvent("pointerup", {
        bubbles: true,
        cancelable: true,
        view: window,
        button: 0, // Left mouse button
        buttons: 0, // No buttons pressed
        clientX: btn.offsetLeft + btn.offsetWidth / 2, // Center of the button
        clientY: btn.offsetTop + btn.offsetHeight / 2,
      });
      btn.dispatchEvent(pointerUpEvent);

      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
        button: 0, // Left mouse button
        clientX: btn.offsetLeft + btn.offsetWidth / 2, // Center of the button
        clientY: btn.offsetTop + btn.offsetHeight / 2,
      });
      btn.dispatchEvent(clickEvent);
    }
  };

  useEffect(() => {
    const handleKeyPress = (key: string) => {
      switch (key) {
        case keybinds.coffeeshop.enter:
          clickBtn(".brew-button");
          break;
        case keybinds.coffeeshop.space:
          clickBtn(".confirm-button");
          break;
        case keybinds.coffeeshop.backspace:
          clickBtn(".reset-button");
          break;
        case keybinds.coffeeshop.escape:
          clickBtn(".cancel-button");
          break;
        default:
          break;
      }
    };

    inputDispatcher.subscribe("keyPress", handleKeyPress);
    inputDispatcher.subscribe("confirm", handleKeyPress);
    inputDispatcher.subscribe("cancel", handleKeyPress);
    return () => {
      inputDispatcher.unsubscribe("keyPress", handleKeyPress);
      inputDispatcher.unsubscribe("confirm", handleKeyPress);
      inputDispatcher.unsubscribe("cancel", handleKeyPress);
    };
  }, [confirmCheck]);

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
