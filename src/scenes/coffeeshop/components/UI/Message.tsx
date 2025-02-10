import { useCallback, useContext, useEffect } from "react";
import {
  useCustomer,
  useOrder,
  useSales,
} from "../../../../context/game/GameContext";
import React from "react";
import { PrevOrderState } from "../../game/game";
import TypewriterEffect from "./TypeWriterEffect";
import { AudioContext } from "../../../../context/audio/AudioContext";

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
      <div className="customerInner-bg"></div>
      <div className="avatar-container pixelated">
        <img src={avatar} alt="customer icon" />
      </div>
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
  const { playSound } = useContext(AudioContext);

  const onRender = useCallback(() => {
    const prevOrder = customerOrder.prevOrderState;
    if (prevOrder === PrevOrderState.success) {
      playSound("transaction_success.mp3");
    } else if (prevOrder === PrevOrderState.fail) {
      playSound("transaction_fail.mp3");
    }
  }, [customerOrder.prevOrderState, playSound]);

  useEffect(() => {
    // play sfx on render
    onRender();
  }, [onRender]);
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
