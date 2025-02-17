import { useActiveBars } from "../../../../context/game/GameContext";
import Ingredients from "./Ingredients";

const IngredientVisuals: React.FC = () => {
  const activeBars = useActiveBars();
  const posX = -3.2;
  const posY = -2;
  const posZ = 0;
  const distMod = 1;
  const calcDiff = (index: number) => {
    return posX + index * distMod;
  };

  return (
    <>
      {activeBars.beans > 0 && (
        <Ingredients
          iName="beans"
          count={activeBars.beans}
          position={[posX, posY, posZ]}
        />
      )}

      {activeBars.water > 0 && (
        <Ingredients
          iName="water"
          count={activeBars.water}
          position={[calcDiff(1), posY, posZ]}
        />
      )}

      {activeBars.milk > 0 && (
        <Ingredients
          iName="milk"
          count={activeBars.milk}
          position={[calcDiff(2), posY, posZ]}
        />
      )}

      {activeBars.sugar > 0 && (
        <Ingredients
          iName="sugar"
          count={activeBars.sugar}
          position={[calcDiff(3), posY, posZ]}
        />
      )}
    </>
  );
};

export default IngredientVisuals;
