import { useContext } from "react";
import { GameContext } from "../../../../context/game/GameContext";
import Store from "./store/Store";
import { GameMode } from "../../game/game";
import { imageFiles } from "../../../../assets";

const CoffeeQuantity: React.FC<{ name: string; quantity: number }> = ({
  name,
  quantity,
}) => {
  return (
    <li>
      <div>
        <div className="coffee-name">
          <span>{name}</span>
        </div>
        <div className="quantity">
          <span>{quantity}</span>
        </div>
      </div>
    </li>
  );
};

const ResourceQuantity: React.FC<{ url: string; quantity: number }> = ({
  url,
  quantity,
}) => {
  return (
    <li className="resource-info">
      <img src={url} />
      <span>{quantity}</span>
    </li>
  );
};

const Info: React.FC = () => {
  const { gameState, checkRecipes } = useContext(GameContext);
  return (
    <div className="coffee-ui-info">
      <div className="coffee-ui-resources">
        <ul className="resource-list">
          <ResourceQuantity
            url={imageFiles.coffee}
            quantity={gameState.resources.beans}
          />
          <ResourceQuantity
            url={imageFiles.water}
            quantity={gameState.resources.water}
          />
          <ResourceQuantity
            url={imageFiles.milk}
            quantity={gameState.resources.milk}
          />
          <ResourceQuantity
            url={imageFiles.sugar}
            quantity={gameState.resources.sugar}
          />
        </ul>
      </div>
      <div className="coffee-ui-money">
        <div className="money__number__container">
          <span className="money__number">{gameState.player.money}</span>
        </div>
        <div className="money__container">
          <div className="money__text__container">
            <span className="money__text">G</span>
          </div>
        </div>
      </div>
      <ul className="coffee-quantities">
        <CoffeeQuantity name="Latte" quantity={gameState.coffeeState.latte} />
        <CoffeeQuantity
          name="Espresso"
          quantity={gameState.coffeeState.espresso}
        />
        <CoffeeQuantity
          name="Cappuccino"
          quantity={gameState.coffeeState.cappuccino}
        />
        <CoffeeQuantity
          name="Americano"
          quantity={gameState.coffeeState.americano}
        />
        <CoffeeQuantity name="Black" quantity={gameState.coffeeState.black} />
        <li className="recipes-btn btn" onClick={checkRecipes}>
          <span>Recipes</span>
        </li>
      </ul>
      {gameState.gameMode !== GameMode.sales && <Store />}
    </div>
  );
};

export default Info;
