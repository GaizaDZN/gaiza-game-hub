import Ticker from "./Ticker";

const BottomBar: React.FC = () => {
  return (
    <div className="bottom-bar">
      <Ticker />
      <div className="bottom-bar-block"></div>
    </div>
  );
};

export default BottomBar;
