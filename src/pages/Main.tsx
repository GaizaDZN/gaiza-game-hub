import Sidebar from "../components/Menu/Sidebar";
import { Canvas } from "@react-three/fiber";
import {
  SceneConfig,
  SceneLayoutProps,
  ViewConfig,
} from "../scenes/common.tsx";
import GUI from "lil-gui";
import BottomBar from "../components/Menu/BottomBar.tsx";
import RightBar from "../components/Menu/RightBar.tsx";
import { useEffect, useState } from "react";
import { GameProvider } from "../context/game/GameProvider.tsx";
import CoffeeShopLayout from "../scenes/coffeeshop/CoffeeShopLayout.tsx";
import { TooltipProvider } from "../context/tooltip/ToolTipProvider.tsx";
import { InputProvider } from "../context/input/InputProvider.tsx";
import { AudioProvider } from "../context/audio/AudioProvider.tsx";

// Create a centralized GUI instance
const gui = new GUI({ title: "GUI Controls" });
const lights = gui.addFolder("Lights");
lights.addFolder("Ambient Lights");
lights.addFolder("Directional Lights");
lights.close();
gui.hide();
// Scene-specific components
const DefaultSceneLayout: React.FC<SceneLayoutProps> = ({
  currentScene,
  currentView,
}) => (
  <div className="canvas-container">
    <Canvas className="canvas-app">
      <currentScene.component
        gui={gui}
        configScene={currentScene}
        currentView={currentView}
      />
    </Canvas>
  </div>
);

// Type definitions

interface MainProps extends SceneLayoutProps {
  onViewChange: (viewId: string) => void;
  onSceneChange: (sceneId: string) => void;
  sceneList: SceneConfig[];
}

// Scene layout mapping
const SCENE_LAYOUTS: Record<string, React.FC<SceneLayoutProps>> = {
  stars: DefaultSceneLayout,
  shapes: DefaultSceneLayout,
  coffeeShop: CoffeeShopLayout,
  // Add more scene layouts as needed
};

const Main: React.FC<MainProps> = ({
  currentScene,
  currentView,
  onViewChange,
  onSceneChange,
  sceneList,
}) => {
  const [sceneViews, setSceneViews] = useState<ViewConfig[]>(
    currentScene.views
  );

  useEffect(() => {
    setSceneViews(currentScene.views);
  }, [currentScene]);

  // Get the appropriate layout component or fall back to default
  const SceneLayout = SCENE_LAYOUTS[currentScene.id] || DefaultSceneLayout;

  return (
    <div className="main">
      <GameProvider>
        <AudioProvider>
          <InputProvider>
            <TooltipProvider>
              <Sidebar
                views={sceneViews}
                onViewChange={onViewChange}
                onSceneChange={onSceneChange}
                sceneList={sceneList}
              />
              <SceneLayout
                currentScene={currentScene}
                currentView={currentView}
                gui={gui}
              />
              <BottomBar />
              <RightBar />
            </TooltipProvider>
          </InputProvider>
        </AudioProvider>
      </GameProvider>
    </div>
  );
};

export default Main;
