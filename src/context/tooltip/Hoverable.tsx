import React from "react";
import { useTooltip } from "./ToolTipContext";

type HoverableProps = {
  tooltip: string;
  children: React.ReactNode;
  className?: string;
};

export const Hoverable: React.FC<HoverableProps> = ({ tooltip, children }) => {
  const { setHoveredElement, setMousePosition } = useTooltip();

  return (
    <div
      onMouseEnter={(e) => {
        setHoveredElement(tooltip);
        setMousePosition({ x: e.clientX, y: e.clientY });
      }}
      onMouseMove={(e) => setMousePosition({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setHoveredElement(null)}
      style={{ display: "contents" }} // Ensures no layout interference
    >
      {children}
    </div>
  );
};
