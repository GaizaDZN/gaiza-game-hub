import { Canvas } from "@react-three/fiber";
import { SceneLayoutProps } from "../common";
import TextWindow from "./components/TextWindow";
import Info from "./components/Info";
import MiddleButtons from "./components/MiddleButtons";
import Title from "./components/Title";
import { useContext, useEffect } from "react";
import { GameContext } from "../../context/GameContext";
import { GameMode } from "./game/game";

const CoffeeShopLayout: React.FC<SceneLayoutProps> = ({
  currentScene,
  currentView,
  gui,
}) => {
  const { gameState, setGameMode } = useContext(GameContext);

  useEffect(() => {
    if (gameState.gameMode === GameMode.init) {
      setGameMode(GameMode.opening);
    }
  }, [gameState.gameMode, setGameMode]);

  return (
    <div className="canvas-container-coffee">
      <div className="canvas-img-container">
        <img className="canvas-img" src="/src/assets/img/cafe.jpg" />
      </div>
      <Canvas
        className="canvas-coffee"
        gl={{ alpha: true }}
        style={{ background: "transparent" }}
      >
        <currentScene.component
          gui={gui}
          configScene={currentScene}
          currentView={currentView}
        />
      </Canvas>
      <Title />
      <MiddleButtons />
      <Info />
      <TextWindow />
    </div>
  );
};

export default CoffeeShopLayout;
