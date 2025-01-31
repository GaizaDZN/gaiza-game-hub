import React, { useEffect, useState } from "react";
import { useTooltip } from "./ToolTipContext";

export const Tooltip: React.FC = () => {
  const { hoveredElement, mousePosition } = useTooltip();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hoveredElement) {
      setVisible(false);
      return;
    }

    const showTooltip = () => {
      if (hoveredElement) {
        setVisible(true);
      }
    };

    const timeout = setTimeout(showTooltip, 500); // Delay before showing
    return () => clearTimeout(timeout);
  }, [hoveredElement]);

  if (!hoveredElement || !visible) return null;

  return (
    <div
      className="tool-tip fade-in ui-open"
      style={{
        top: mousePosition.y - 30, // Slight offset for visibility
        left: mousePosition.x + 15,
      }}
    >
      <span className="tool-tip-text scanning-laser">{hoveredElement}</span>
    </div>
  );
};
