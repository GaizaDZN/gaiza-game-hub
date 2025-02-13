import { useContext } from "react";
import { GameContext } from "../../../../../context/game/GameContext";
import { GameMode } from "../../../game/game";
import CustomerQueue from "./CustomerQueue";

const SalesOverlay: React.FC = () => {
  return (
    <div className="canvas__overlay overlay__sales">
      <CustomerQueue />
    </div>
  );
};

const Overlay: React.FC = () => {
  const { gameState } = useContext(GameContext);
  return (
    <div className="canvas__overlay-container">
      {gameState.gameMode === GameMode.sales && <SalesOverlay />}
    </div>
  );
};

export default Overlay;
