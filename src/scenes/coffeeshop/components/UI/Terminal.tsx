import { useContext, useEffect, useRef } from "react";
import { GameContext } from "../../../../context/game/GameContext";

const TerminalLines = () => {
  const { gameState } = useContext(GameContext);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    containerRef.current = document.querySelector(".lines-container");

    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [gameState.terminalLog.content]);

  if (gameState.terminalLog.content.length === 0) {
    return null;
  }

  const terminalLines = gameState.terminalLog.content.map((line, index) => (
    <pre key={index} className="terminal-output">
      {line}
    </pre>
  ));
  return terminalLines;
};

const Terminal: React.FC = () => {
  return (
    <div className="terminal">
      <div className="lines-container">
        <TerminalLines />
      </div>
    </div>
  );
};

export default Terminal;
