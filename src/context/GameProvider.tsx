import React, { useCallback, useEffect, useMemo } from "react";
import { GameContext } from "./GameContext";
import {
  Game,
  GameMode,
  GameState,
  ResourceState,
} from "../scenes/coffeeshop/game/game";
import { soundFiles } from "../assets/assets";

interface GameProviderProps {
  children: React.ReactNode;
  initialState?: Partial<GameState>;
}

export function GameProvider({ children, initialState }: GameProviderProps) {
  // Use useState with a function to ensure game is only created once
  const [game, setGame] = React.useState(() => new Game(initialState));
  const [gameState, setGameState] = React.useState(game.getState());

  // Update local state when game version changes
  useEffect(() => {
    const newState = game.getState();
    if (newState.version !== gameState.version) {
      setGameState(newState);
    }
  }, [game, gameState.version]);

  // Memoize game actions to prevent unnecessary re-renders
  const brewCoffee = useCallback(
    (onSuccess: () => void) => {
      game.brewCoffee(onSuccess);
      setGame(new Game(game.getState()));
    },
    [game]
  );

  const incrementActiveBar = useCallback(
    (resource: keyof ResourceState) => {
      game.incrementActiveBar(resource);
      setGame(new Game(game.getState()));
    },
    [game]
  );

  const resetActiveBars = useCallback(() => {
    game.resetActiveBars();
    setGame(new Game(game.getState()));
  }, [game]);

  const setGameMode = useCallback(
    (mode: GameMode) => {
      game.setGameMode(mode);
      setGame(new Game(game.getState()));
    },
    [game]
  );

  const completeSale = useCallback(() => {
    game.completeSale();
    setGame(new Game(game.getState()));
  }, [game]);

  const checkRecipes = useCallback(() => {
    game.checkRecipes();
    setGame(new Game(game.getState()));
  }, [game]);

  const updateGameState = useCallback(
    (gameState: GameState) => {
      game.setState(() => {
        return { ...gameState };
      });
      return setGame(new Game(game.getState()));
    },
    [game]
  );

  // Sounds

  const playSound = (filename: string) => {
    if (soundFiles[filename]) {
      const audio = new Audio(soundFiles[filename]);
      audio.play();
    } else {
      console.warn(`Sound file ${filename} not found`);
    }
  };

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      gameState,
      brewCoffee,
      incrementActiveBar,
      resetActiveBars,
      setGameMode,
      completeSale,
      checkRecipes,
      updateGameState,
      playSound,
    }),
    [
      gameState,
      brewCoffee,
      incrementActiveBar,
      resetActiveBars,
      setGameMode,
      completeSale,
      checkRecipes,
      updateGameState,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
