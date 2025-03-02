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
  const pressedMouseButtons = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (gameState.gameMode !== GameMode.init) {
      // Key handlers
      const keyDownHandler = (e: KeyboardEvent) => {
        if (Object.values(keybinds.coffeeshop).includes(e.key)) {
          e.preventDefault();
          // console.log("key pressed: ", e.key);
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

      // Mouse handlers
      const mouseDownHandler = (e: MouseEvent) => {
        if (!pressedMouseButtons.current.has(e.button)) {
          pressedMouseButtons.current.add(e.button);
          inputDispatcher.dispatch("mousePress", e.button);
        }
      };

      const mouseUpHandler = (e: MouseEvent) => {
        if (pressedMouseButtons.current.has(e.button)) {
          e.preventDefault();
          pressedMouseButtons.current.delete(e.button);
          inputDispatcher.dispatch("mouseUp", e.button);
        }
      };

      // Event listeners
      document.addEventListener("keydown", keyDownHandler);
      document.addEventListener("keyup", keyUpHandler);
      document.addEventListener("mousedown", mouseDownHandler);
      document.addEventListener("mouseup", mouseUpHandler);
      return () => {
        document.removeEventListener("keydown", keyDownHandler);
        document.removeEventListener("keyup", keyUpHandler);
        document.removeEventListener("mousedown", mouseDownHandler);
        document.removeEventListener("mouseup", mouseUpHandler);
      };
    }
  }, [gameState.gameMode]);

  return <>{children}</>;
};
