import { useContext } from "react";
import { ResourceState } from "../../../game/game";
import { GameContext } from "../../../../../context/game/GameContext";
import { resourceCost } from "../../../game/coffeeshop.types";
import { BASE_URL } from "../../../../../assets/assets";

interface StoreItemProps {
  quantity: number;
  itemName: keyof ResourceState;
}

const StoreItem: React.FC<StoreItemProps> = ({ itemName, quantity }) => {
  const capitalized = itemName.charAt(0).toUpperCase() + itemName.slice(1);
  const { incrementStoreItem } = useContext(GameContext);
  const handleItemClick = (item: keyof ResourceState) => {
    incrementStoreItem(item);
  };
  const itemPrice = resourceCost[itemName];

  return (
    <li className="store__item" onClick={() => handleItemClick(itemName)}>
      <div className="store__item-title">
        <span>{capitalized}</span>
      </div>
      <div className="store__item-price">
        <span>{itemPrice}G</span>
      </div>
      <div className="store__item-quantity">
        <span>{quantity}</span>
      </div>
    </li>
  );
};

const Store: React.FC = () => {
  const { gameState, resetStore, purchaseItems } = useContext(GameContext);

  const handleReset = () => {
    resetStore();
  };

  const handleBuy = () => {
    purchaseItems();
  };

  return (
    <div className="store__container">
      <div className="store__items-container ui-open">
        <ul className="store__items">
          <StoreItem itemName="beans" quantity={gameState.storeState.beans} />
          <StoreItem itemName="water" quantity={gameState.storeState.water} />
          <StoreItem itemName="milk" quantity={gameState.storeState.milk} />
          <StoreItem itemName="sugar" quantity={gameState.storeState.sugar} />
        </ul>
      </div>
      <div className="store__sales">
        <div className="store__total-price" onClick={handleBuy}>
          <div className="store__total-price-container">
            {gameState.storeState.totalPrice > 0 && (
              <span className="store__total-price-amount">
                {gameState.storeState.totalPrice.toFixed(2)}
              </span>
            )}
          </div>
          <div className="store__total-text-container">
            <span className="store__total-price-g">G</span>
          </div>
        </div>
        <div
          className="store__button-reset sales__button"
          onClick={handleReset}
        >
          <span>Reset</span>
        </div>
        <div className="store__button-buy sales__button" onClick={handleBuy}>
          <span>Buy</span>
        </div>
      </div>
      <img className="store__bg" src={`${BASE_URL}/assets/img/store.jpg`}></img>
    </div>
  );
};

export default Store;
