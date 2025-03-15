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
import "./styles/coffeeshop.scss";
import { PerspectiveCamera } from "@react-three/drei";
import { commonValues } from "./components/threejs/common";

const CoffeeShopLayout: React.FC<SceneLayoutProps> = ({
  currentScene,
  currentView,
  gui,
}) => {
  const { gameState, queueGameMode } = useContext(GameContext);
  const initGame = useCallback(() => {
    const mode = gameState.gameMode;
    if (mode === GameMode.init) {
      queueGameMode(GameMode.opening);
    }
  }, [gameState.gameMode, queueGameMode]);

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

        {/* <OrthographicCamera
          makeDefault
          ref={cameraRef}
          zoom={45}
          position={[0, 0, 10]} // Camera position
          near={0.1} // Near clipping plane
          far={20} // Far clipping plane
        /> */}
        {/* Perspective camera required for tunnel visualisation */}
        <PerspectiveCamera
          makeDefault
          args={[
            75, // fov (field of view) - default: 75
            window.innerWidth / window.innerHeight, // aspect - default: window.innerWidth / window.innerHeight
            0.1, // near - default: 0.1
            commonValues.camera.far, // far - default: 1000
          ]}
          position={[0, 0, commonValues.camera.zPosition]}
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
