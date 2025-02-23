import { useEffect, useState } from "react";
import { useCustomer } from "../../../../../context/game/GameContext";
import { Coffee } from "../../../game/coffeeshop.types";

const CoffeeQueueItem: React.FC<{ coffeeType: string; coffee: Coffee }> = ({
  coffeeType,
  coffee,
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
  const handleCoffeeState = (): string => {
    let result = "◼";
    if (coffee.complete) {
      result = "✔";
    }
    return result;
  };

  return (
    <div className="order__container">
      <div className="orders">
        <div className="coffee-item__container">
          <div className="coffee-item">{handleCoffeeType()}</div>
        </div>
        <div className="order-state__container">
          <span className="order-state">{handleCoffeeState()}</span>
        </div>
      </div>
    </div>
  );
};
const CoffeeQueue: React.FC = () => {
  const [checklist, setChecklist] = useState<Map<string, Coffee>>(new Map());

  const customer = useCustomer();

  useEffect(() => {
    // convert map to array of coffeeTypes
    const drinks = customer?.getOrder().getDrinks();
    if (drinks) {
      setChecklist(drinks);
    }
  }, [customer]);

  return (
    <div className="coffee-queue__container">
      <div className="coffee-queue">
        {checklist &&
          Array.from(checklist).flatMap(([coffeeName, coffee], coffeeIdx) =>
            Array.from({ length: coffee.getQuantity() }).map((_, qtyIdx) => (
              <CoffeeQueueItem
                key={`${coffeeName}-${coffeeIdx}-${qtyIdx}`}
                coffeeType={coffeeName}
                coffee={coffee}
              />
            ))
          )}
      </div>
    </div>
  );
};

export default CoffeeQueue;
