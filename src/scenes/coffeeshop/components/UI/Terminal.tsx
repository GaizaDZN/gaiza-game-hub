import { useContext } from "react";
import { GameContext } from "../../../../context/game/GameContext";

const TerminalLines = () => {
  const { gameState } = useContext(GameContext);

  if (gameState.terminalLog.content.length === 0) {
    return;
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
      <TerminalLines />
    </div>
  );
};

export default Terminal;
