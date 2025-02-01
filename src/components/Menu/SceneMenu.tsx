import { useContext } from "react";
import { GameContext } from "../../context/game/GameContext";
import { SceneConfig } from "../../scenes/common";
import Button from "./buttons/Button";

interface SceneMenuProps {
  sceneMenuToggle: string;
  onSceneChange: (sceneId: string) => void;
  sceneList: SceneConfig[];
}

const SceneMenu: React.FC<SceneMenuProps> = ({
  sceneMenuToggle,
  onSceneChange,
  sceneList,
}) => {
  const { resetGame } = useContext(GameContext);

  const handleSceneChange = (sceneId: string) => {
    resetGame();
    onSceneChange(sceneId);
  };

  const Scenes = () => {
    return sceneList.map((scene) => (
      <Button
        key={scene.id}
        content={scene.name}
        menuName="sceneMenu"
        action={() => handleSceneChange(scene.id)}
      />
    ));
  };
  return <div className={sceneMenuToggle}>{Scenes()}</div>;
};

export default SceneMenu;
