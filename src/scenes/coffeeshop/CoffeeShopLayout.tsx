import { Canvas } from "@react-three/fiber";
import { SceneLayoutProps } from "../common";
import TextWindow from "./components/UI/TextWindow";
import Info from "./components/UI/Info";
import MiddleButtons from "./components/UI/MiddleButtons";
import Title from "./components/UI/Title";
import { useCallback, useContext, useEffect } from "react";
import { GameContext } from "../../context/game/GameContext";
import { GameMode } from "./game/game";
import Overlay from "./components/UI/overlay/Overlay";

const CoffeeShopLayout: React.FC<SceneLayoutProps> = ({
  currentScene,
  currentView,
  gui,
}) => {
  const { gameState, setGameMode } = useContext(GameContext);

  const initGame = useCallback(() => {
    const mode = gameState.gameMode;
    if (mode === GameMode.init) {
      setGameMode(GameMode.opening);
    }
  }, [gameState.gameMode, setGameMode]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  return (
    <div className="canvas-container-coffee">
      <div className="canvas-img-container">
        <Overlay />
        <img className="canvas-img pixelated" src="/src/assets/img/cafe.jpg" />
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
