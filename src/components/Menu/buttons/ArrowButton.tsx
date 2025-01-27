import { useState } from "react";

interface ArrowButtonProps {
  toggleSceneMenu: () => void;
}

const ArrowButton: React.FC<ArrowButtonProps> = ({ toggleSceneMenu }) => {
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  const flipArrow = () => {
    setIsFlipped(!isFlipped);
    toggleSceneMenu();
  };

  return (
    <div
      className={`sceneName-button button ${isFlipped ? "flipped" : ""}`}
      onClick={flipArrow}
    >
      <div className="arrow">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
};

export default ArrowButton;
