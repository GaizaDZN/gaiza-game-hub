import React, { useContext, useEffect, useRef, useState } from "react";
import { InputContext } from "./InputContext";
import { GameContext } from "../game/GameContext";
import { GameMode } from "../../scenes/coffeeshop/game/game";
import { keybinds } from "./keybinds";

export const InputProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentKey, setCurrentKey] = useState<string>("");
  const { gameState } = useContext(GameContext);
  const pressedKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (gameState.gameMode !== GameMode.init) {
      const keyDownHandler = (e: KeyboardEvent) => {
        if (Object.values(keybinds.coffeeshop).includes(e.key)) {
          e.preventDefault();

          if (!pressedKeys.current.has(e.key)) {
            pressedKeys.current.add(e.key); // Mark key as pressed
            setCurrentKey(e.key);
            console.log("pressed:", e.key);
          }
        }
      };

      const keyUpHandler = (e: KeyboardEvent) => {
        if (pressedKeys.current.has(e.key)) {
          e.preventDefault();
          pressedKeys.current.delete(e.key); // Mark key as released
          setCurrentKey("");
        }
      };

      document.addEventListener("keydown", keyDownHandler);
      document.addEventListener("keyup", keyUpHandler);

      return () => {
        document.removeEventListener("keydown", keyDownHandler);
        document.removeEventListener("keyup", keyUpHandler);
      };
    }
  }, [gameState]);

  return (
    <InputContext.Provider value={{ currentKey, setCurrentKey }}>
      {children}
    </InputContext.Provider>
  );
};
