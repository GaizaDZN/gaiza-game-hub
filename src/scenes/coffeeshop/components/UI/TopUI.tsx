import { useCallback, useContext, useEffect } from "react";
import Button from "../../../../components/Menu/buttons/Button";
import QuantityBars from "./QuantityBars";
import { ResourceState } from "../../game/game";
import { GameContext } from "../../../../context/game/GameContext";
import { Hoverable } from "../../../../context/tooltip/Hoverable";
import { keybinds } from "../../../../context/input/keybinds";
import { inputDispatcher } from "../../../../context/input/InputDispatcher";

const TopUI = () => {
  const { gameState, incrementActiveBar, playSound } = useContext(GameContext);

  const handleIncrement = useCallback(
    (ingredient: keyof ResourceState) => {
      incrementActiveBar(ingredient, () => playSound("minor_button.mp3"));
    },
    [incrementActiveBar, playSound]
  );

  const clickBtn = (classname: string, resource: keyof ResourceState) => {
    const btn = document.querySelector(classname) as HTMLElement;
    handleIncrement(resource);
    if (btn) {
      btn.classList.add("btn-click");
      // listen for animationend event
      btn.addEventListener(
        "animationend",
        () => {
          btn.classList.remove("btn-click");
        },
        { once: true }
      );
    }
  };

  useEffect(() => {
    const handleKeyPress = (key: string) => {
      switch (key) {
        case keybinds.coffeeshop.q:
          clickBtn(".beans-button", "beans");
          break;
        case keybinds.coffeeshop.w:
          clickBtn(".water-button", "water");
          break;
        case keybinds.coffeeshop.e:
          clickBtn(".milk-button", "milk");
          break;
        case keybinds.coffeeshop.r:
          clickBtn(".sugar-button", "sugar");
          break;
        default:
          break;
      }
    };

    inputDispatcher.subscribe("keyPress", handleKeyPress);
    return () => {
      inputDispatcher.unsubscribe("keyPress", handleKeyPress);
    };
  }, [handleIncrement]);

  return (
    <ul className="top-ui">
      <div className="coffee-button-group">
        <QuantityBars quantity={gameState.activeBars["beans"]} />
        <Hoverable tooltip="Beans [Q]">
          <Button
            classname="beans-button"
            content={"Beans"}
            menuName={"coffee-ui"}
            action={() => handleIncrement("beans")}
          />
        </Hoverable>
      </div>
      <div className="coffee-button-group">
        <QuantityBars quantity={gameState.activeBars["water"]} />
        <Hoverable tooltip="Water [W]">
          <Button
            classname="water-button"
            content={"Water"}
            menuName={"coffee-ui"}
            action={() => handleIncrement("water")}
          />
        </Hoverable>
      </div>
      <div className="coffee-button-group">
        <QuantityBars quantity={gameState.activeBars["milk"]} />
        <Hoverable tooltip="Milk [E]">
          <Button
            classname="milk-button"
            content={"Milk"}
            menuName={"coffee-ui"}
            action={() => handleIncrement("milk")}
          />
        </Hoverable>
      </div>
      <div className="coffee-button-group">
        <QuantityBars quantity={gameState.activeBars["sugar"]} />
        <Hoverable tooltip="Sugar [R]">
          <Button
            classname="sugar-button"
            content={"Sugar"}
            menuName={"coffee-ui"}
            action={() => handleIncrement("sugar")}
          />
        </Hoverable>
      </div>
    </ul>
  );
};
export default TopUI;
