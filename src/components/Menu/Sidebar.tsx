import { useContext, useState } from "react";
import { SceneConfig, ViewConfig } from "../../scenes/common";
import Button from "./buttons/Button";
import SceneMenu from "./SceneMenu";
import ArrowButton from "./buttons/ArrowButton";
import { GameContext } from "../../context/game/GameContext";

interface SidebarProps {
  views: ViewConfig[];
  onViewChange: (viewId: string) => void;
  onSceneChange: (viewId: string) => void;
  sceneList: SceneConfig[];
}

const Sidebar: React.FC<SidebarProps> = ({
  views,
  onViewChange,
  onSceneChange,
  sceneList,
}) => {
  const [sceneMenuToggle, setSceneMenuToggle] = useState<string>(
    "sceneMenu sceneMenu-closed"
  );
  const { activeGameInfo } = useContext(GameContext);
  const menuName = "sidebar";

  const toggleSceneMenu = () => {
    if (sceneMenuToggle === "sceneMenu sceneMenu-closed") {
      setSceneMenuToggle("sceneMenu sceneMenu-open");
    } else {
      setSceneMenuToggle("sceneMenu sceneMenu-closed");
    }
  };

  return (
    <div className="sidebar">
      <SceneMenu
        sceneList={sceneList}
        sceneMenuToggle={sceneMenuToggle}
        onSceneChange={onSceneChange}
      />
      <div className="viewMenu-sidebar">
        <div className="sceneName-sidebar">
          <div className="sceneName">
            <span>Scene:</span>
            <span>{views[0].sceneId.toUpperCase()}</span>
          </div>
          <ArrowButton toggleSceneMenu={toggleSceneMenu} />
        </div>
        {views.length > 1
          ? views.map((view) => (
              <Button
                key={view.id}
                action={() => onViewChange(view.id)}
                content={view.name}
                menuName={menuName}
                view={view}
              />
            ))
          : ""}
        {activeGameInfo && <SidebarInfo sceneComponent={activeGameInfo} />}
      </div>
      <div className="sidebar-bottom"></div>
    </div>
  );
};

export default Sidebar;

interface SidebarInfoProps {
  sceneComponent: React.FC;
}
// Information about the scene, controls, purpose, etc.
const SidebarInfo: React.FC<SidebarInfoProps> = ({ sceneComponent }) => {
  return <div className="sidebar-info">{sceneComponent({})}</div>;
};
