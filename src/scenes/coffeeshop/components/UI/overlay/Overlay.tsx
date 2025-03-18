import { useContext } from "react";
import { GameContext } from "../../../../../context/game/GameContext";
import { GameMode } from "../../../game/game";
import CustomerQueue from "./CustomerQueue";
import CoffeeQueue from "./CoffeeQueue";
import TimeBar from "./TimeBar";
import ScoreOverlay from "./Score";

const SalesOverlay: React.FC = () => {
  return (
    <div className="canvas__overlay overlay__sales">
      <CustomerQueue />
      <CoffeeQueue />
      <TimeBar />
    </div>
  );
};

const Overlay: React.FC = () => {
  const { gameState } = useContext(GameContext);
  return (
    <div className="canvas__overlay-container scanlines">
      <ScoreOverlay />
      {gameState.gameMode === GameMode.sales && <SalesOverlay />}
    </div>
  );
};

export default Overlay;
