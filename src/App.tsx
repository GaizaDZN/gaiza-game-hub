import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Main from "./pages/Main";
import "./App.css";
import { SceneConfig, SceneIds, scenes } from "./scenes/common";

const App: React.FC = () => {
  const [currentSceneId, setCurrentSceneId] = useState<string>(
    SceneIds.coffeeShopId
  );
  const [sceneList, setSceneList] = useState<SceneConfig[]>(
    Object.values(scenes)
  );
  const [currentView, setCurrentView] = useState<string>("view_0");
  const [currentScene, setCurrentScene] = useState<SceneConfig>(
    scenes[currentSceneId]
  );

  const handleViewChange = (viewId: string) => {
    setCurrentView(viewId);

    const scene = getScene(currentSceneId);
    if (scene !== undefined)
      // loop through views and toggle 'active' flag
      scene.views.forEach((view) => {
        if (viewId == view.id) {
          view.active = true;
        } else {
          view.active = false;
        }
      });
  };

  const handleSceneChange = (sceneId: string) => {
    // First update the scene list with new active states
    setSceneList((prevList) => {
      return prevList.map((scene) => ({
        ...scene,
        active: scene.id === sceneId,
        views: scene.views.map((view) => ({
          ...view,
          active: false,
        })),
      }));
    });

    // Then update the current scene ID and current scene
    setCurrentSceneId(sceneId);
    setCurrentScene(scenes[sceneId]);
    // Reset to first view or maintain some default
    setCurrentView("view_0");
  };

  const getScene = (sceneId: string): SceneConfig | undefined => {
    return sceneList.find((s) => s.id === sceneId);
  };

  const basename = "/gaiza-game-hub";
  useEffect(() => {
    setCurrentScene(scenes[currentSceneId]);
  }, [currentSceneId]);

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route
          path="/"
          element={
            <Main
              currentScene={currentScene}
              currentView={currentView}
              onViewChange={handleViewChange}
              onSceneChange={handleSceneChange}
              sceneList={sceneList}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
