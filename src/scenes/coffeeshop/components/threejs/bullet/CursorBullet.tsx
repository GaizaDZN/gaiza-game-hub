// Define CursorBullets component - this is a persistent component

import { useRef, useEffect } from "react";
import Bullets, { BulletsHandle, BulletSource, BulletType } from "./Bullets";
import { Vector3 } from "three";

// that manages bullet rendering regardless of firing state
interface CursorBulletProps {
  cursorPosition: Vector3;
  count?: number;
  bulletColor?: string;
  isActive: boolean;
  spawnTrigger: number; // Add a trigger to force bullet spawning
}

const CursorBullets: React.FC<CursorBulletProps> = ({
  cursorPosition,
  count = 10,
  bulletColor = "yellow",
  isActive,
  spawnTrigger,
}) => {
  // Correctly type the ref
  const bulletsRef = useRef<BulletsHandle | null>(null);

  useEffect(() => {
    if (isActive && spawnTrigger > 0) {
      bulletsRef.current?.spawnBullet(BulletType.Normal);
    }
  }, [isActive, spawnTrigger]);

  return (
    <Bullets
      ref={bulletsRef}
      origin={cursorPosition}
      target={new Vector3(0, 0, 0)}
      count={count}
      bulletSize={0.15}
      bulletColor={bulletColor}
      maxLifetime={2000}
      bulletSource={BulletSource.player}
      bulletType={BulletType.Normal}
    />
  );
};

export default CursorBullets;
