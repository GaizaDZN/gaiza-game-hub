import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Main from "./pages/Main";
import "./App.css";
import { SceneConfig, SceneIds, scenes } from "./scenes/common";
import GUI from "lil-gui";

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

  // Add an effect to keep currentScene in sync with currentSceneId
  useEffect(() => {
    setCurrentScene(scenes[currentSceneId]);
  }, [currentSceneId]);

  return (
    <BrowserRouter>
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
              gui={new GUI()}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
