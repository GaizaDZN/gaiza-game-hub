import { useContext } from "react";
import { ResourceState } from "../../../game/game";
import { GameContext } from "../../../../../context/game/GameContext";

interface StoreItemProps {
  quantity: number;
  price?: number;
  itemName: keyof ResourceState;
}

const StoreItem: React.FC<StoreItemProps> = ({
  itemName,
  price = 1,
  quantity,
}) => {
  const capitalized = itemName.charAt(0).toUpperCase() + itemName.slice(1);

  return (
    <li className="store__item">
      <div className="store__item-title">
        <span>{capitalized}</span>
      </div>
      <div className="store__item-price">
        <span>{price}G</span>
      </div>
      <div className="store__item-quantity">
        <span>{quantity}</span>
      </div>
      <div className="store__button-quantity">
        <span>+</span>
      </div>
    </li>
  );
};

const Store: React.FC = () => {
  const { gameState } = useContext(GameContext);

  const handleReset = () => {
    alert("Reset store quantities");
  };

  const handleBuy = () => {
    alert(
      "Add quantities of store to game.resourceState > reset store quantities"
    );
  };

  return (
    <div className="store__container">
      <div className="store__items-container">
        <ul className="store__items">
          <StoreItem itemName="beans" quantity={gameState.storeState.beans} />
          <StoreItem itemName="water" quantity={gameState.storeState.water} />
          <StoreItem itemName="milk" quantity={gameState.storeState.milk} />
          <StoreItem itemName="sugar" quantity={gameState.storeState.sugar} />
        </ul>
        <div className="store__sales">
          <div className="store__total-price" onClick={handleBuy}>
            <span>Total: 0G</span>
          </div>
          <div className="store__button-buy" onClick={handleBuy}>
            <span>Buy</span>
          </div>
          <div className="store__button-reset" onClick={handleReset}>
            <span>Reset</span>
          </div>
        </div>
      </div>

      <img className="store__bg" src="/src/assets/img/store.jpg"></img>
    </div>
  );
};

export default Store;
