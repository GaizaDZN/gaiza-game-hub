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
    // Don't proceed if not in sales mode
    if (gameState.gameMode != GameMode.sales) return () => {}; // Return empty cleanup function

    if (customer?.getActive()) {
      setLoadingMessage(false);
    } else {
      setLoadingMessage(true);

      // First timer for message loading
      const loadingTimer = setTimeout(() => {
        customer?.activateMessage();
        updateGameState({ ...gameState });

        // Second timer for next customer message
        const transitionTimer = setTimeout(() => {
          if (customerOrder.prevOrderState !== PrevOrderState.none) {
            customerOrder.prevOrderState = PrevOrderState.none;
            updateGameState({ ...gameState });
          }
        }, 700);

        // Return cleanup function that clears both timers
        return () => {
          clearTimeout(loadingTimer);
          clearTimeout(transitionTimer);
        };
      }, 700);

      // Cleanup function for the loading timer
      return () => clearTimeout(loadingTimer);
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
