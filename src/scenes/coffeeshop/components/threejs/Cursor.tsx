// Cursor.tsx
import React, { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Mesh } from "three";
import Bullets, { BulletsHandle } from "./bullet/Bullets";

// Define CursorBullets component - this is a persistent component
// that manages bullet rendering regardless of firing state
interface CursorBulletProps {
  cursorPosition: THREE.Vector3;
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
      bulletsRef.current?.spawnBullet();
    }
  }, [isActive, spawnTrigger]);

  return (
    <Bullets
      ref={bulletsRef}
      origin={cursorPosition}
      target={new THREE.Vector3(0, 0, 0)}
      count={count}
      bulletSize={0.1}
      bulletColor={bulletColor}
      maxLifetime={2000}
    />
  );
};

interface cursorProps {
  mouseHeld: boolean;
  isMouseOnCanvas: boolean;
}

const Cursor: React.FC<cursorProps> = ({ mouseHeld, isMouseOnCanvas }) => {
  const cursorRef = useRef<Mesh>(null);
  const targetPosition = useRef(new THREE.Vector3());
  const { viewport, pointer } = useThree();
  const lerpFactor = 0.07;

  // Bullet spawning state
  const [isFiring, setIsFiring] = useState(false);
  const lastBulletTime = useRef(0);
  const bulletInterval = useRef(200); // Milliseconds between bullet spawns

  // Create a reference for cursor position that doesn't change with renders
  const cursorPosition = useRef(new THREE.Vector3());

  // Create a counter to trigger new bullet spawns
  const [bulletSpawnTrigger, setBulletSpawnTrigger] = useState(0);

  const isWithinTolerance = (
    pos1: THREE.Vector3,
    pos2: THREE.Vector3,
    tolerance: number
  ) => {
    return pos1.distanceTo(pos2) <= tolerance;
  };

  // Effect to control bullet spawning based on mouse state
  useEffect(() => {
    if (mouseHeld) {
      setIsFiring(true);
      console.log("Mouse held - firing enabled");
    } else {
      setIsFiring(false);
      console.log("Mouse released - firing disabled");
    }
  }, [mouseHeld]);

  useFrame(({ clock }) => {
    if (cursorRef.current) {
      const tolerance = 0.12;
      const cursorOnTarget = isWithinTolerance(
        cursorRef.current.position,
        targetPosition.current,
        tolerance
      );

      if ((isMouseOnCanvas && mouseHeld) || !cursorOnTarget) {
        const normalizedX = pointer.x;
        const normalizedY = pointer.y;
        const currentPosition = cursorRef.current.position;

        // Convert normalized coordinates to world space
        let worldX = (normalizedX * viewport.width) / 2;
        let worldY = (normalizedY * viewport.height) / 2;

        // Calculate 90% of the canvas bounds
        const maxX = (viewport.width / 2) * 0.9;
        const maxY = (viewport.height / 2) * 0.9;

        // Always clamp to ensure the cursor stays within bounds
        worldX = Math.max(-maxX, Math.min(worldX, maxX));
        worldY = Math.max(-maxY, Math.min(worldY, maxY));

        // Update the target position
        if (mouseHeld) {
          targetPosition.current.set(worldX, worldY, 0);
        }
        const distanceToTarget = currentPosition.distanceTo(
          targetPosition.current
        );

        // Lerp the current position toward the target
        // Scale lerp factor with distance to targetPosition (faster when further away)
        const adjustedLerp = Math.min(
          (1 - Math.exp(-distanceToTarget)) * lerpFactor + 0.1,
          lerpFactor
        );
        currentPosition.lerp(targetPosition.current, adjustedLerp);

        // Store current position for bullets
        cursorPosition.current.copy(currentPosition);

        // Ensure cursor always looks toward the center
        cursorRef.current.lookAt(0, 0, 0);
        cursorRef.current.rotateX(Math.PI / 2);

        // Handle bullet spawning when mouse is held
        if (mouseHeld && isFiring) {
          const currentTime = clock.getElapsedTime() * 1000; // Convert to milliseconds

          // Check if enough time has passed since last bullet
          if (currentTime - lastBulletTime.current > bulletInterval.current) {
            lastBulletTime.current = currentTime;
            console.log(
              "Time to spawn a bullet!",
              cursorPosition.current.clone()
            );

            // Increment the spawn trigger to cause a new bullet to spawn
            // without affecting existing bullets
            setBulletSpawnTrigger((prev) => prev + 1);
          }
        }
      }
    }
  });

  return (
    <>
      <mesh ref={cursorRef} position={[0, 0, 0]}>
        <meshBasicMaterial color={mouseHeld ? "#ff9900" : "#e2a115"} />
        <coneGeometry args={[0.2, 0.5, 6]} />
      </mesh>

      {/* Persistent bullet component */}
      <CursorBullets
        cursorPosition={cursorPosition.current}
        count={20}
        bulletColor="yellow"
        isActive={isFiring}
        spawnTrigger={bulletSpawnTrigger} // Pass the trigger to force spawning
      />
    </>
  );
};

export default Cursor;
