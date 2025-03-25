// Define CursorBullets component - this is a persistent component

import { useRef, useContext, useEffect } from "react";
import { Vector3 } from "three";
import { GameContext } from "../../../../../context/game/GameContext";
import Bullets, {
  bulletConsts,
  BulletsHandle,
  BulletSource,
  BulletType,
} from "./Bullets";

// that manages bullet rendering regardless of firing state
interface CoreBulletProps {
  corePosition: Vector3;
  count?: number;
  bulletColor?: string;
  isActive: boolean;
  spawnTrigger: number; // Add a trigger to force bullet spawning
  target?: Vector3;
}

export const CoreBullets: React.FC<CoreBulletProps> = ({
  corePosition,
  count = 20,
  bulletColor = "red",
  isActive,
  spawnTrigger,
  target,
}) => {
  // Correctly type the ref
  const bulletsRef = useRef<BulletsHandle | null>(null);
  const { cursorPosition } = useContext(GameContext);
  useEffect(() => {
    if (isActive && spawnTrigger > 0) {
      bulletsRef.current?.spawnBullet(BulletType.Normal);
    }
  }, [isActive, spawnTrigger]);

  target = cursorPosition;

  return (
    <Bullets
      ref={bulletsRef}
      origin={corePosition}
      target={target}
      count={count}
      bulletSize={bulletConsts.enemy.size}
      bulletColor={bulletColor}
      maxLifetime={4000}
      bulletSource={BulletSource.enemy}
      bulletType={BulletType.Normal}
    />
  );
};
