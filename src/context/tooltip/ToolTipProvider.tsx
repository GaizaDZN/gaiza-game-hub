import React, { useState } from "react";
import { TooltipContext } from "./ToolTipContext";
import { Tooltip } from "./Tooltip";

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  return (
    <TooltipContext.Provider
      value={{
        hoveredElement,
        setHoveredElement,
        mousePosition,
        setMousePosition,
      }}
    >
      {children}
      <Tooltip />
    </TooltipContext.Provider>
  );
};
