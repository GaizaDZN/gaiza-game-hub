import { useContext } from "react";
import { GameContext } from "../../../../context/game/GameContext";
import Store from "./store/Store";

const Info: React.FC = () => {
  const { gameState, checkRecipes } = useContext(GameContext);
  return (
    <div className="coffee-ui-info">
      <div className="coffee-ui-resources">
        <ul className="resource-list">
          <li className="resource-info">
            <img src="/src/assets/img/coffee.png" alt="beans icon" />
            <span>{gameState.resources.beans}</span>
          </li>
          <li className="resource-info">
            <img src="/src/assets/img/water.png" alt="water icon" />
            <span>{gameState.resources.water}</span>
          </li>
          <li className="resource-info">
            <img src="/src/assets/img/milk.png" alt="milk icon" />
            <span>{gameState.resources.milk}</span>
          </li>
          <li className="resource-info">
            <img src="/src/assets/img/sugar.png" alt="sugar icon" />
            <span>{gameState.resources.sugar}</span>
          </li>
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
        <li>
          <div>
            <div className="coffee-name">
              <span>Latte</span>
            </div>
            <div className="quantity">
              <span>{gameState.coffeeState.latte}</span>
            </div>
          </div>
        </li>
        <li>
          <div>
            <div className="coffee-name">
              <span>Espresso</span>
            </div>
            <div className="quantity">
              <span>{gameState.coffeeState.espresso}</span>
            </div>
          </div>
        </li>
        <li>
          <div>
            <div className="coffee-name">
              <span>Cappuccino</span>
            </div>
            <div className="quantity">
              <span>{gameState.coffeeState.cappuccino}</span>
            </div>
          </div>
        </li>
        <li>
          <div>
            <div className="coffee-name">
              <span>Americano</span>
            </div>
            <div className="quantity">
              <span>{gameState.coffeeState.americano}</span>
            </div>
          </div>
        </li>
        <li>
          <div>
            <div className="coffee-name">
              <span>Black</span>
            </div>
            <div className="quantity">
              <span>{gameState.coffeeState.black}</span>
            </div>
          </div>
        </li>
        <li className="recipes-btn btn" onClick={checkRecipes}>
          <span>Recipes</span>
        </li>
      </ul>
      <Store />
    </div>
  );
};

export default Info;
