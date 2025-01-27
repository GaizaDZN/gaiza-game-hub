import { SceneConfig, ViewConfig } from "../../../scenes/common";

export interface ButtonProps {
  content: string;
  menuName: string;
  action?: () => void;
  scene?: SceneConfig;
  view?: ViewConfig;
  classname?: string;
}

const Button: React.FC<ButtonProps> = ({
  content,
  menuName,
  action = () => alert("test"),
  scene,
  view,
  classname,
}) => {
  const isSceneButton = !!scene;

  let className = [
    "button",
    `${menuName}-button`,
    view?.active || scene?.active ? "button-active" : "",
  ]
    .filter(Boolean)
    .join(" ");
  if (classname != "") {
    className = `${className} ${classname}`;
  }
  const displayContent = isSceneButton ? scene?.name : content;

  return (
    <div className={className} onClick={action}>
      <span>{displayContent}</span>
    </div>
  );
};

export default Button;
