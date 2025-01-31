import { coffeeAscii } from "../../ascii/art";
import Ascii from "../aesthetics/Ascii";

const Title: React.FC = () => {
  return (
    <div className="coffee-ui-title">
      <div className="title">
        <span>Coffee Shop</span>
      </div>
      <div className="sub-title">
        <span>ManillaOS v1.3.4</span>
      </div>
      <Ascii content={coffeeAscii} className="title-ascii" />
    </div>
  );
};

export default Title;
