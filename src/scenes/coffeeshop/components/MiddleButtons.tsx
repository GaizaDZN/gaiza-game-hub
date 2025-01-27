import Terminal from "./Terminal";
import BottomUI from "./BottomUI";
import TopUI from "./TopUI";

const MiddleButtons: React.FC = () => {
  return (
    <div className="coffee-ui-buttons">
      <TopUI />
      <Terminal />
      <BottomUI />
    </div>
  );
};

export default MiddleButtons;
