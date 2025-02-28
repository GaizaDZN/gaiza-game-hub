import { useContext } from "react";
import { GameContext, useOrder } from "../../../../../context/game/GameContext";
import { OrderItem } from "../../../game/coffeeshop.types";

const CoffeeQueueItem: React.FC<{ orderItem: OrderItem }> = ({ orderItem }) => {
  const handleCoffeeState = (): string => {
    let result = "◼";
    if (orderItem.getComplete()) {
      result = "✔";
    }
    return result;
  };

  return (
    <div className="order__container">
      <div className="orders">
        <div className="coffee-item__container">
          <div className="coffee-item">
            {orderItem.getName()[0].toUpperCase() +
              orderItem.getName().slice(1)}
          </div>
        </div>
        <div className="order-state__container">
          <span className="order-state">{handleCoffeeState()}</span>
        </div>
      </div>
    </div>
  );
};

const CoffeeQueue: React.FC = () => {
  const items = useOrder().currentOrder?.getItems();
  const { gameState } = useContext(GameContext);
  const finished = gameState.textState.textFinished;

  return (
    <div className={`coffee-queue__container ${finished ? "fade-in" : ""}`}>
      <div className="coffee-queue">
        {items &&
          finished &&
          items.map((item) => (
            <CoffeeQueueItem key={item.getID()} orderItem={item} />
          ))}
      </div>
    </div>
  );
};

export default CoffeeQueue;
