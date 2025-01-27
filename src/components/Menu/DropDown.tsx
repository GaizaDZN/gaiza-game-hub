import Button, { ButtonProps } from "./buttons/ViewButton";

interface DropDownProps {
  menuName: string;
  buttons: ButtonProps[];
}

// takes buttons and renders them in a list format
const DropDown: React.FC<DropDownProps> = ({ menuName, buttons }) => {
  const className = `dropdown-${menuName}`;
  const alertMsg = `${menuName} button_`;
  return (
    <ul className={className}>
      {buttons.map((button, index) => (
        <li key={index}>
          <Button
            content={button.content}
            menuName={menuName}
            action={() => alert(alertMsg + index)}
          />
        </li>
      ))}
    </ul>
  );
};

export default DropDown;
