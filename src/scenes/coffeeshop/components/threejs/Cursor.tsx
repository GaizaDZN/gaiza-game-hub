// Cursor.tsx
import React, { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Mesh } from "three";
import Bullets, { BulletsHandle } from "./bullet/Bullets";
import { coreBuffer } from "./Core";
import { commonValues } from "./common";

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
      bulletSize={0.15}
      bulletColor={bulletColor}
      maxLifetime={2000}
    />
  );
};

const cursorBuffer = 0.18;
const canvasBuffer = 0.6; // cursor distance from canvas edges.

interface cursorProps {
  mouseHeld: boolean;
  isMouseOnCanvas: boolean;
}

const Cursor: React.FC<cursorProps> = ({ mouseHeld, isMouseOnCanvas }) => {
  const cursorRef = useRef<Mesh>(null);
  const targetPosition = useRef(
    new THREE.Vector3(0, 0, commonValues.layer.game)
  );
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

  // Define the outer movement bounds
  const maxX = (viewport.width / 2) * canvasBuffer;
  const maxY = (viewport.height / 2) * canvasBuffer;

  // Inner dead zone radius
  const minRadius =
    (Math.min(viewport.width, viewport.height) / 2) *
    (coreBuffer + cursorBuffer);

  const isWithinTolerance = (
    pos1: THREE.Vector3,
    pos2: THREE.Vector3,
    tolerance: number
  ) => {
    return pos1.distanceTo(pos2) <= tolerance;
  };

  const fireRateElapsed = (
    currentTime: number,
    lastBulletTime: number,
    bulletInterval: number
  ): boolean => {
    return currentTime - lastBulletTime > bulletInterval;
  };

  // Effect to control bullet spawning based on mouse state
  useEffect(() => {
    if (mouseHeld && isMouseOnCanvas) {
      setIsFiring(true);
    } else {
      setIsFiring(false);
      setBulletSpawnTrigger(0);
    }
  }, [mouseHeld, isMouseOnCanvas]);

  useFrame(({ clock }) => {
    if (cursorRef.current) {
      const tolerance = 0.12;
      const cursorOnTarget = isWithinTolerance(
        cursorRef.current.position,
        targetPosition.current,
        tolerance
      );

      if (isMouseOnCanvas || !cursorOnTarget) {
        const normalizedX = pointer.x;
        const normalizedY = pointer.y;
        const currentPosition = cursorRef.current.position;

        // Calculate raw world position
        const rawWorldX = (normalizedX * viewport.width) / 2;
        const rawWorldY = (normalizedY * viewport.height) / 2;

        // Check distance from center using the raw coordinates
        const distanceFromCenter = Math.sqrt(rawWorldX ** 2 + rawWorldY ** 2);

        // Calculate scale and z-level adjustment based on distance from center
        // These values can be tuned to get the desired effect
        const maxDistance = Math.sqrt(maxX ** 2 + maxY ** 2);
        const distanceRatio = distanceFromCenter / maxDistance;

        // Scale: increase size as cursor moves away from center (e.g., 1.0 at center, up to 1.5 at edges)
        const minScale = 1.0;
        const maxScale = 1.5;
        const scaleAdjustment =
          minScale + (maxScale - minScale) * distanceRatio;

        // Z-level: bring cursor forward as it moves toward edges
        // Assuming commonValues.layer.game is your base z-level
        const minZ = commonValues.layer.game;
        const maxZ = commonValues.layer.game + 1; // Adjust value as needed
        const zAdjustment = minZ + (maxZ - minZ) * distanceRatio;

        // Calculate final world coordinates with dead zone enforcement
        let worldX, worldY;

        if (distanceFromCenter < minRadius) {
          // If would be in dead zone, project to the edge of the dead zone
          const angle = Math.atan2(rawWorldY, rawWorldX);
          worldX = minRadius * Math.cos(angle);
          worldY = minRadius * Math.sin(angle);
        } else {
          // Otherwise use the raw position
          worldX = rawWorldX;
          worldY = rawWorldY;
        }

        // Apply max bounds
        worldX = Math.max(-maxX, Math.min(worldX, maxX));
        worldY = Math.max(-maxY, Math.min(worldY, maxY));

        // Update target position with adjusted z-level
        targetPosition.current.set(worldX, worldY, zAdjustment);
        const distanceToTarget = currentPosition.distanceTo(
          targetPosition.current
        );

        // Lerp position toward target
        const adjustedLerp = Math.min(
          (1 - Math.exp(-distanceToTarget)) * lerpFactor + 0.1,
          lerpFactor
        );
        currentPosition.lerp(targetPosition.current, adjustedLerp);

        // Store current position for bullets
        cursorPosition.current.copy(currentPosition);

        // Apply scale based on distance
        cursorRef.current.scale.set(
          scaleAdjustment,
          scaleAdjustment,
          scaleAdjustment
        );

        // Ensure cursor always looks toward the center
        cursorRef.current.lookAt(0, 0, commonValues.layer.game);
        cursorRef.current.rotateX(Math.PI / 2);

        // Handle bullet spawning
        if (mouseHeld && isFiring) {
          const currentTime = clock.getElapsedTime() * 1000;
          if (
            fireRateElapsed(
              currentTime,
              lastBulletTime.current,
              bulletInterval.current
            )
          ) {
            lastBulletTime.current = currentTime;
            setBulletSpawnTrigger((prev) => prev + 1);
          }
        }
      }
    }
  });

  return (
    <>
      <mesh ref={cursorRef} position={[0, 0, 0]}>
        <meshBasicMaterial color={mouseHeld ? "#f7b80c" : "#0fdd0f"} />
        <coneGeometry args={[0.1, 0.3, 6]} />
      </mesh>

      {/* Persistent bullet component */}
      <CursorBullets
        cursorPosition={cursorPosition.current}
        count={20}
        bulletColor="yellow"
        isActive={isFiring}
        spawnTrigger={bulletSpawnTrigger}
      />
    </>
  );
};

export default Cursor;
