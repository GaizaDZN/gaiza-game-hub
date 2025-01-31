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
    if (customer?.getActive()) {
      setLoadingMessage(false);
    } else {
      setLoadingMessage(true);

      // Artificial delay to simulate message loading in UI
      const timer = setTimeout(() => {
        customer?.activateMessage();
        updateGameState({ ...gameState }); // Update game state to reflect message activation
        // Transition to the next customer message after a delay
        setTimeout(() => {
          // Logic to move to the next customer message
          // For example, update the game state to the next customer
          if (customerOrder.prevOrderState !== PrevOrderState.none) {
            customerOrder.prevOrderState = PrevOrderState.none;
            updateGameState({ ...gameState }); // Update game state to reflect the next customer message
          }
        }, 700); // .7s delay for the result message
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [customer, customerOrder, gameState, updateGameState]);

  return (
    <div className="coffee-ui-textWindow">
      <div className="textBG">
        <ul className="textContainer blink-subtle">
          {customer?.getActive ? (
            loadingMessage ? (
              <Diamonds />
            ) : customerOrder.prevOrderState != PrevOrderState.none ? (
              <ResultMessage /> // Show success/fail message
            ) : (
              <Message /> // Show the next customer message
            )
          ) : // Render the day end stats if in day end mode
          gameState.gameMode === GameMode.dayEnd ? (
            <DayEndMessage />
          ) : null}
        </ul>
      </div>
    </div>
  );
};

export default TextWindow;
