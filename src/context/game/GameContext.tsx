import { createContext, Dispatch, SetStateAction, useContext } from "react";
import {
  GameState,
  ResourceState,
  GameMode,
} from "../../scenes/coffeeshop/game/game";
import { Vector3 } from "three";
import { CursorStateKey } from "../../scenes/coffeeshop/components/threejs/Cursor";

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
  playerHit: () => void;

  cursorState: CursorStateKey;
  setCursorState: Dispatch<SetStateAction<CursorStateKey>>;
  cursorPosition: Vector3;
  setCursorPosition: (position: Vector3) => void;
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
  playerHit: () => {},

  cursorState: "idle",
  setCursorState: () => {},
  cursorPosition: new Vector3(),
  setCursorPosition: () => {},
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

export function useScoreState() {
  const { gameState } = useGame();
  return gameState.scoreState;
}
