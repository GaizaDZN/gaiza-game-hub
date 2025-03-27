import { SceneProps } from "../common";
import React, { useCallback, useContext, useEffect, useState } from "react";
import IngredientVisuals from "./components/threejs/IngredientVisuals";
import Cursor from "./components/threejs/Cursor";
import { useThree } from "@react-three/fiber";
import { inputDispatcher } from "../../context/input/InputDispatcher";
import Core from "./components/threejs/Core";
import Tunnel from "./components/aesthetics/Tunnel";
import { GameContext } from "../../context/game/GameContext";
import { GameMode } from "./game/game";
import { gameEventDispatcher } from "../../context/events/eventListener";
import { BASE_URL } from "../../../public/assets/assets";

const cursor = `${BASE_URL}/assets/img/cursor.png`;

const CoffeeShop: React.FC<SceneProps> = ({ gui }) => {
  gui?.hide();
  const { gameState, setGameMode, queueGameMode } = useContext(GameContext);
  const [isMouseOnCanvas, setIsMouseOnCanvas] = useState(false);
  const [mouseHeld, setMouseHeld] = useState(false);
  const { gl } = useThree();

  const handleMouseDown = (mouseButton: number) => {
    if (mouseButton === 0) setMouseHeld(true);
  };

  const handleMouseUp = (mouseButton: number) => {
    if (mouseButton === 0) setMouseHeld(false);
  };

  const handlePlayerDeath = useCallback(() => {
    queueGameMode(GameMode.dayEnd);
  }, [queueGameMode]);

  useEffect(() => {
    const canvas = gl.domElement;
    const mode = gameState.gameMode;

    // Trigger new game mode state
    if (mode != gameState.newGameMode) {
      setGameMode();
    }

    // if (gameState.player.health === 0 && mode === GameMode.sales) {
    //   queueGameMode(GameMode.dayEnd);
    // }

    const handleMouseEnter = () => {
      setIsMouseOnCanvas(true);
      canvas.style.cursor = `url(${cursor}), auto`;
    };

    const handleMouseLeave = () => {
      setIsMouseOnCanvas(false);
      setMouseHeld(false);
      canvas.style.cursor = "default";
    };

    canvas.addEventListener("mouseenter", handleMouseEnter);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    inputDispatcher.subscribe("mousePress", handleMouseDown);
    inputDispatcher.subscribe("mouseUp", handleMouseUp);
    gameEventDispatcher.subscribe("playerDeath", handlePlayerDeath);
    return () => {
      canvas.removeEventListener("mouseenter", handleMouseEnter);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      inputDispatcher.unsubscribe("mousePress", handleMouseDown);
      inputDispatcher.unsubscribe("mouseUp", handleMouseUp);
      gameEventDispatcher.unsubscribe("playerDeath", handlePlayerDeath);
    };
  }, [
    gameState.gameMode,
    gameState.newGameMode,
    gameState.player.health,
    gl.domElement,
    queueGameMode,
    setGameMode,
    handlePlayerDeath,
  ]);

  return (
    <>
      <IngredientVisuals />
      <Cursor mouseHeld={mouseHeld} isMouseOnCanvas={isMouseOnCanvas} />
      <Core />
      {gameState.gameMode === GameMode.sales && <SalesMode />}
    </>
  );
};

export default CoffeeShop;

const SalesMode = () => {
  return <Tunnel />;
};
