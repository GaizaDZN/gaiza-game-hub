import { useContext, useEffect } from "react";
import { DayEndMessage, Message, ResultMessage } from "./Message";
import {
  GameContext,
  useCustomer,
  useOrder,
} from "../../../../context/game/GameContext";
import React from "react";
import { GameMode, PrevOrderState } from "../../game/game";

const Diamonds = () => {
  return (
    <div className="diamonds">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
};

const TextWindow: React.FC = () => {
  const { gameState, updateGameState } = useContext(GameContext);
  const [loadingMessage, setLoadingMessage] = React.useState(true);
  const customer = useCustomer();
  const customerOrder = useOrder();

  useEffect(() => {
    if (gameState.gameMode !== GameMode.sales) return;

    // Only set loading to true when customer is not active
    if (!customer?.isActive()) {
      setLoadingMessage(true);

      const loadingTimer = setTimeout(() => {
        customer?.activateMessage();
        updateGameState({ ...gameState });
        setLoadingMessage(false);

        if (customerOrder.prevOrderState !== PrevOrderState.none) {
          const transitionTimer = setTimeout(() => {
            customerOrder.prevOrderState = PrevOrderState.none;
            updateGameState({ ...gameState });
          }, 700);

          return () => clearTimeout(transitionTimer);
        }
      }, 700);

      return () => clearTimeout(loadingTimer);
    }
  }, [customer, customerOrder, gameState, updateGameState]);

  const renderContent = () => {
    // no customer / customer
    if (!customer) {
      return gameState.gameMode === GameMode.dayEnd ? <DayEndMessage /> : null;
    }

    // active customer
    if (loadingMessage) {
      return <Diamonds />;
    }

    // customer message
    return customerOrder.prevOrderState !== PrevOrderState.none ? (
      <ResultMessage />
    ) : (
      <Message />
    );
  };

  return (
    <div className="coffee-ui-textWindow">
      <div className="textBG">
        <ul className="textContainer blink-subtle">{renderContent()}</ul>
      </div>
    </div>
  );
};

export default TextWindow;
