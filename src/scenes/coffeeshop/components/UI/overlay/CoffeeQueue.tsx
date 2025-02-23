import { useEffect, useState } from "react";
import { useOrder } from "../../../../../context/game/GameContext";
import { CoffeeState } from "../../../game/coffeeshop.types";

const CoffeeQueueItem: React.FC<{ coffeeType: keyof CoffeeState }> = ({
  coffeeType,
}) => {
  // determine render based on coffeeType
  const handleCoffeeType = () => {
    switch (coffeeType) {
      case "latte":
        return "Latte";
      case "black":
        return "Black";
      case "americano":
        return "Americano";
      case "espresso":
        return "Espresso";
      case "cappuccino":
        return "Cappuccino";
      default:
        break;
    }
  };
  return (
    <div className="order__container">
      <div className="orders">
        <div className="coffee-item__container">
          <div className="coffee-item">{handleCoffeeType()}</div>
        </div>
        <div className="order-state__container">
          <span className="order-state">✅</span>
        </div>
      </div>
    </div>
  );
};
const CoffeeQueue: React.FC = () => {
  const [checklist, setChecklist] = useState<(keyof CoffeeState)[]>([]);
  const orderState = useOrder();

  useEffect(() => {
    // convert map to array of coffeeTypes
    const items: (keyof CoffeeState)[] = [];
    orderState.checkList.forEach((val, key) => {
      if (val > 0) {
        for (let i = 0; i < val; i++) {
          items.push(key);
        }
      }
    });
    setChecklist(items);
  }, [orderState.checkList]);

  return (
    <div className="coffee-queue__container">
      <div className="coffee-queue">
        {checklist.map((coffee, idx) => (
          <CoffeeQueueItem key={`${coffee}-${idx}`} coffeeType={coffee} />
        ))}
      </div>
    </div>
  );
};

export default CoffeeQueue;
