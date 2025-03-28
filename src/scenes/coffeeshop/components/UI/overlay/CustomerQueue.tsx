import { useContext } from "react";
import { GameContext } from "../../../../../context/game/GameContext";
import { imageFiles } from "../../../../../assets";

const userImg = imageFiles.user;

const CustomerQueue: React.FC = () => {
  const { gameState } = useContext(GameContext);
  const quota = gameState.customerState.quota;
  const currentCustomer = gameState.customerState.completedCustomers.length;

  return (
    <div className="customerqueue__container">
      <div className="customerqueue__icon">
        <img src={userImg} />
      </div>
      <div className="customerqueue__num1-container">
        <span className="customerqueue__num customerqueue__current">
          {currentCustomer}
        </span>
      </div>
      <div className="customerqueue__divider">
        <span className="customerqueue_div">/</span>
      </div>
      <div className="customerqueue__num2-container">
        <span className="customerqueue__num customerqueue__total">{quota}</span>
      </div>
    </div>
  );
};

export default CustomerQueue;
