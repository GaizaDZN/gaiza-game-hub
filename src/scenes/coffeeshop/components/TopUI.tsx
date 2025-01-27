import { useContext } from "react";
import Button from "../../../components/Menu/buttons/Button";
import { GameContext } from "../../../context/GameContext";
import QuantityBars from "./QuantityBars";

const TopUI = () => {
  const { gameState, incrementActiveBar } = useContext(GameContext);
  return (
    <ul className="top-ui">
      <div className="coffee-button-group">
        <QuantityBars quantity={gameState.activeBars["beans"]} />
        <Button
          content={"Beans"}
          menuName={"coffee-ui"}
          action={() => incrementActiveBar("beans")}
        />
      </div>
      <div className="coffee-button-group">
        <QuantityBars quantity={gameState.activeBars["water"]} />
        <Button
          content={"Water"}
          menuName={"coffee-ui"}
          action={() => incrementActiveBar("water")}
        />
      </div>
      <div className="coffee-button-group">
        <QuantityBars quantity={gameState.activeBars["milk"]} />
        <Button
          content={"Milk"}
          menuName={"coffee-ui"}
          action={() => incrementActiveBar("milk")}
        />
      </div>
      <div className="coffee-button-group">
        <QuantityBars quantity={gameState.activeBars["sugar"]} />
        <Button
          content={"Sugar"}
          menuName={"coffee-ui"}
          action={() => incrementActiveBar("sugar")}
        />
      </div>
    </ul>
  );
};
export default TopUI;
