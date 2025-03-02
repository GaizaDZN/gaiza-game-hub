import { useActiveBars } from "../../../../context/game/GameContext";
import Ingredients from "./Ingredients";

const IngredientVisuals: React.FC = () => {
  const activeBars = useActiveBars();
  const posX = -3.3;
  const posY = -2;
  const posZ = 0;
  const size = 0.5;
  const radius = 0.25;
  const distMod = 0.7;
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
          size={size}
          radius={radius}
        />
      )}

      {activeBars.water > 0 && (
        <Ingredients
          iName="water"
          count={activeBars.water}
          position={[calcDiff(1), posY, posZ]}
          size={size}
          radius={radius}
        />
      )}

      {activeBars.milk > 0 && (
        <Ingredients
          iName="milk"
          count={activeBars.milk}
          position={[calcDiff(2), posY, posZ]}
          size={size}
          radius={radius}
        />
      )}

      {activeBars.sugar > 0 && (
        <Ingredients
          iName="sugar"
          count={activeBars.sugar}
          position={[calcDiff(3), posY, posZ]}
          size={size}
          radius={radius}
        />
      )}
    </>
  );
};

export default IngredientVisuals;
