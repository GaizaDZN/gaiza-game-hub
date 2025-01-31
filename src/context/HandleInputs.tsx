import { useCallback, useContext, useEffect } from "react";
import { SceneConfig } from "../scenes/common";
import { debounce } from "lodash";
import { GameContext } from "./game/GameContext";

export enum ButtonAction {
  Confirm,
  Cancel,
}

interface HandleInputProps {
  scene: SceneConfig;
}

const HandleInputs: React.FC<HandleInputProps> = ({ scene }) => {
  const { handleMove, setCurrentKey } = useContext(GameContext);

  const debouncedKeyHandler = useCallback(
    debounce((key: string) => {
      setCurrentKey(key);
      handleMove(key);
    }, 30),
    [handleMove, setCurrentKey]
  );

  useEffect(() => {
    if (scene.acceptsInput) {
      function keyDownHandler(e: globalThis.KeyboardEvent) {
        e.preventDefault();
        debouncedKeyHandler(e.key);
      }

      function keyUpHandler(e: globalThis.KeyboardEvent) {
        e.preventDefault();
        setCurrentKey("");
        debouncedKeyHandler.cancel();
      }

      document.addEventListener("keydown", keyDownHandler);
      document.addEventListener("keyup", keyUpHandler);

      return () => {
        document.removeEventListener("keydown", keyDownHandler);
        document.removeEventListener("keyup", keyUpHandler);
        debouncedKeyHandler.cancel();
      };
    }
  }, [scene.acceptsInput, debouncedKeyHandler, setCurrentKey]);

  return null;
};

export default HandleInputs;
