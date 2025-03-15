import React, { useCallback, useEffect, useMemo } from "react";
import { GameContext } from "./GameContext";

import {
  GameState,
  Game,
  ResourceState,
  GameMode,
} from "../../scenes/coffeeshop/game/game";

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
    (resource: keyof ResourceState, onSuccess: () => void) => {
      game.incrementActiveBar(resource, onSuccess);
      setGame(new Game(game.getState()));
    },
    [game]
  );

  const resetActiveBars = useCallback(() => {
    game.resetActiveBars();
    setGame(new Game(game.getState()));
  }, [game]);

  const queueGameMode = useCallback(
    (mode: GameMode) => {
      game.queueGameMode(mode);
      setGame(new Game(game.getState()));
    },
    [game]
  );

  const setGameMode = useCallback(() => {
    game.setGameMode();
    setGame(new Game(game.getState()));
  }, [game]);

  const completeSale = useCallback(() => {
    game.completeSale();
    setGame(new Game(game.getState()));
  }, [game]);

  const checkRecipes = useCallback(() => {
    game.checkRecipes();
    setGame(new Game(game.getState()));
  }, [game]);

  const resetGame = useCallback(() => {
    game.reset();
    setGame(new Game(game.getState()));
  }, [game]);

  // Store
  const incrementStoreItem = useCallback(
    (item: keyof ResourceState) => {
      game.incrementStoreItem(item);
      setGame(new Game(game.getState()));
    },
    [game]
  );

  const resetStore = useCallback(() => {
    game.resetStore();
    setGame(new Game(game.getState()));
  }, [game]);

  const purchaseItems = useCallback(() => {
    game.purchaseItems();
    setGame(new Game(game.getState()));
  }, [game]);

  const setTextPrinting = useCallback(
    (textPrinting: boolean) => {
      game.setTextPrinting(textPrinting);
      setGame(new Game(game.getState()));
    },
    [game]
  );

  const updateGameState = useCallback(
    (gameState: GameState) => {
      game.setState(() => {
        return { ...gameState };
      });
      return setGame(new Game(game.getState()));
    },
    [game]
  );

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      gameState,
      brewCoffee,
      incrementActiveBar,
      resetActiveBars,
      setGameMode,
      queueGameMode,
      completeSale,
      checkRecipes,
      incrementStoreItem,
      resetStore,
      purchaseItems,
      updateGameState,
      resetGame,
      setTextPrinting,
    }),
    [
      gameState,
      brewCoffee,
      incrementActiveBar,
      resetActiveBars,
      setGameMode,
      queueGameMode,
      completeSale,
      checkRecipes,
      incrementStoreItem,
      resetStore,
      purchaseItems,
      resetGame,
      updateGameState,
      setTextPrinting,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
