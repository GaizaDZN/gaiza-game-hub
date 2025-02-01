import React, { useContext, useEffect, useRef } from "react";
import { GameContext } from "../game/GameContext";
import { GameMode } from "../../scenes/coffeeshop/game/game";
import { keybinds } from "./keybinds";
import { inputDispatcher } from "./InputDispatcher";

export const InputProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { gameState } = useContext(GameContext);
  const pressedKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (gameState.gameMode !== GameMode.init) {
      const keyDownHandler = (e: KeyboardEvent) => {
        if (Object.values(keybinds.coffeeshop).includes(e.key)) {
          e.preventDefault();

          console.log("key pressed: ", e.key);
          if (!pressedKeys.current.has(e.key)) {
            pressedKeys.current.add(e.key);
            inputDispatcher.dispatch("keyPress", e.key);

            if (e.key === keybinds.coffeeshop.enter) {
              inputDispatcher.dispatch("confirm");
            }
            if (e.key === keybinds.coffeeshop.escape) {
              inputDispatcher.dispatch("cancel");
            }
          }
        }
      };

      const keyUpHandler = (e: KeyboardEvent) => {
        if (pressedKeys.current.has(e.key)) {
          e.preventDefault();
          pressedKeys.current.delete(e.key);
          inputDispatcher.dispatch("keyPress", ""); // Clear key
        }
      };

      document.addEventListener("keydown", keyDownHandler);
      document.addEventListener("keyup", keyUpHandler);

      return () => {
        document.removeEventListener("keydown", keyDownHandler);
        document.removeEventListener("keyup", keyUpHandler);
      };
    }
  }, [gameState.gameMode]);

  return <>{children}</>;
};
