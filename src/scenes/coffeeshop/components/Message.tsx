import { useEffect, useState } from "react";
import {
  useCustomer,
  useOrder,
  useSales,
  useSounds,
} from "../../../context/GameContext";
import React from "react";
import { PrevOrderState } from "../game/game";

const userImg = "/src/assets/img/user.png";

const DefaultAvatar: React.FC = () => {
  return (
    <div className="customerInner">
      <img src={userImg} alt="customer icon" />
    </div>
  );
};

const CustomerAvatar: React.FC<{ avatar: string }> = ({ avatar }) => {
  return (
    <div className="customerInner avatar">
      <img className="" src={avatar} alt="customer icon" />
    </div>
  );
};

export const Message: React.FC = () => {
  const currentCustomer = useCustomer();
  const [isRendered, setIsRendered] = React.useState(false);

  useEffect(() => {
    // Triggers when the component mounts
    setIsRendered(true);
  }, []);

  return (
    <li
      className={`message-container scanning-laser data-stream ${
        isRendered ? "fade-in ui-open" : "fade-out ui-close"
      }`}
    >
      {currentCustomer?.getPortrait() === undefined ? (
        <DefaultAvatar />
      ) : (
        <CustomerAvatar avatar={currentCustomer?.getPortrait() || userImg} />
      )}
      {currentCustomer && (
        <div className="allText-container">
          <div className="textInner-container">
            <span className="customerName">
              {currentCustomer.getCustomerMessage().customerName}
            </span>
            <div className="textInner">
              <TypewriterEffect
                message={currentCustomer.getCustomerMessage().content}
                tag="p"
              />
            </div>
          </div>
        </div>
      )}
    </li>
  );
};

export const ResultMessage: React.FC = () => {
  const customerOrder = useOrder();
  return (
    <li className="message-container fade-in ui-open">
      <div className="allText-container-result">
        <div className="textInner-container">
          <div
            className={`textInner ${
              customerOrder.prevOrderState === PrevOrderState.success
                ? "result-success"
                : "result-fail"
            }`}
          >
            <p>
              {customerOrder.prevOrderState === PrevOrderState.success
                ? "TRANSACTION APPROVED."
                : "TRANSACTION FAILURE."}
            </p>
          </div>
        </div>
      </div>
    </li>
  );
};

export const DayEndMessage: React.FC = () => {
  const salesState = useSales();

  return (
    <li className="message-container fade-in ui-open">
      <div className="allText-container-result">
        <div className="textInner-container">
          <table className="day-end-stats">
            <tbody>
              <tr>
                <td>Total Transactions:</td>
                <td>{salesState.goodOrders + salesState.badOrders}</td>
              </tr>
              <tr>
                <td>Success:</td>
                <td>{salesState.goodOrders}</td>
              </tr>
              <tr>
                <td>Fail:</td>
                <td>{salesState.badOrders}</td>
              </tr>
              <tr>
                <td>Profit:</td>
                <td>
                  ${+(salesState.moneyEnd - salesState.moneyStart).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </li>
  );
};

const typingSound = "typing_sound.mp3";
interface TypewriterEffectProps {
  message: string;
  delay?: number; // Optional delay between character appearances
  tag: string; // flag for appropiate tag
}

const TypewriterEffect: React.FC<TypewriterEffectProps> = ({
  message,
  delay = 40,
  tag,
}) => {
  const [printedMessage, setPrintedMessage] = useState("");
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);

  const playSound = useSounds();
  const handleUpdate = () => {
    playSound(typingSound);
    setPrintedMessage(message.substring(0, currentCharacterIndex + 1));
    setCurrentCharacterIndex((prevIndex) => prevIndex + 1);
  };
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (currentCharacterIndex < message.length) {
        handleUpdate();
      } else {
        clearInterval(intervalId); // Stop the interval when finished
      }
    }, delay);

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, [message, delay, currentCharacterIndex]);

  if (tag === "p") {
    return <p>{printedMessage}</p>;
  } else if (tag === "pre") {
    return <pre>{printedMessage}</pre>;
  }
};
