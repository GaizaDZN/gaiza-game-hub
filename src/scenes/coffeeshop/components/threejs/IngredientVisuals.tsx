import { useActiveBars } from "../../../../context/game/GameContext";
import Ingredients from "./Ingredients";

const IngredientVisuals: React.FC = () => {
  const activeBars = useActiveBars();
  return (
    <>
      {activeBars.beans > 0 && (
        <Ingredients
          iName="beans"
          count={activeBars.beans}
          position={[-4.5, -2, 0]}
        />
      )}

      {activeBars.water > 0 && (
        <Ingredients
          iName="water"
          count={activeBars.water}
          position={[-3.5, -2, 0]}
        />
      )}

      {activeBars.milk > 0 && (
        <Ingredients
          iName="milk"
          count={activeBars.milk}
          position={[-2.5, -2, 0]}
        />
      )}

      {activeBars.sugar > 0 && (
        <Ingredients
          iName="sugar"
          count={activeBars.sugar}
          position={[-1.5, -2, 0]}
        />
      )}
    </>
  );
};

export default IngredientVisuals;
