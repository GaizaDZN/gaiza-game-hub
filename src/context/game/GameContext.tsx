import { createContext, useContext } from "react";
import {
  GameState,
  ResourceState,
  GameMode,
} from "../../scenes/coffeeshop/game/game";

interface GameContextType {
  gameState: GameState;
  brewCoffee: (onSuccess: () => void) => void;
  incrementActiveBar: (
    resource: keyof ResourceState,
    onSuccess: () => void
  ) => void;
  resetActiveBars: () => void;
  setGameMode: () => void;
  queueGameMode: (mode: GameMode) => void;
  completeSale: () => void;
  checkRecipes: () => void;
  incrementStoreItem: (item: keyof ResourceState) => void;
  resetStore: () => void;
  purchaseItems: () => void;
  updateGameState: (game: GameState) => void;
  setTextPrinting: (textPrinting: boolean) => void;
  resetGame: () => void;
}

export const GameContext = createContext<GameContextType>({
  gameState: {} as GameState,
  brewCoffee: () => {},
  incrementActiveBar: () => {},
  resetActiveBars: () => {},
  setGameMode: () => {},
  queueGameMode: () => {},
  completeSale: () => {},
  checkRecipes: () => {},
  incrementStoreItem: () => {},
  resetStore: () => {},
  purchaseItems: () => {},
  updateGameState: () => {},
  setTextPrinting: () => {},
  resetGame: () => {},
});

// Custom hooks for accessing game state and actions
export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}

// Specialized hooks for specific parts of the game state
export function useResources() {
  const { gameState } = useGame();
  return gameState.resources;
}

export function useResourceStore() {
  const { gameState } = useGame();
  return gameState.storeState;
}

export function useActiveBars() {
  const { gameState } = useGame();
  return gameState.activeBars;
}

export function useCustomer() {
  const { gameState } = useGame();
  return gameState.customerState.currentCustomer;
}

export function useMessages() {
  const { gameState } = useGame();
  return gameState.messageLog.messages;
}

export function useOrder() {
  const { gameState } = useGame();
  return gameState.orderState;
}

export function useSales() {
  const { gameState } = useGame();
  return gameState.salesState;
}

export function useGameMode() {
  const { gameState } = useGame();
  return gameState.gameMode;
}
