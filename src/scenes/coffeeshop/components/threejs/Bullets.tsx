// Bullets.tsx
import React, { useRef, useCallback, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface BulletProps {
  origin: THREE.Vector3;
  target?: THREE.Vector3;
  velocity?: THREE.Vector3;
  count?: number;
  bulletSize?: number;
  bulletColor?: string;
}

interface Bullet {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  bulletSize: number;
  active: boolean;
}

const bulletDefaults = {
  count: 10,
  size: 0.2,
  color: "red",
};

const Bullets: React.FC<BulletProps> = ({
  origin,
  target = new THREE.Vector3(0, 0, 0),
  velocity = new THREE.Vector3(0, 0.2, 0),
  count = bulletDefaults.count,
  bulletSize = bulletDefaults.size,
  bulletColor = bulletDefaults.color,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { viewport } = useThree();

  // Create a pool of bullets
  const bullets = useRef<Bullet[]>([]);

  // Initialize bullet pool
  useEffect(() => {
    // Create initial bullet pool
    bullets.current = Array(count)
      .fill(null)
      .map(() => ({
        position: origin.clone(),
        velocity: velocity.clone(),
        bulletSize: bulletSize,
        active: false,
      }));

    console.log(`Initialized ${count} bullets in pool`);
  }, [bulletSize, count, origin, velocity]);

  // Function to spawn a new bullet
  const spawnBullet = useCallback(() => {
    // Find an inactive bullet
    const inactiveBullet = bullets.current.find((b) => !b.active);

    if (inactiveBullet) {
      // Calculate direction from origin to target
      const direction = new THREE.Vector3()
        .subVectors(target, origin)
        .normalize();

      // Reset the bullet
      inactiveBullet.position.copy(origin);
      inactiveBullet.velocity.copy(direction.multiplyScalar(0.1)); // Speed of 0.1
      inactiveBullet.active = true;

      console.log("Bullet spawned", {
        from: origin.clone(),
        velocity: inactiveBullet.velocity.clone(),
      });

      return true;
    }

    console.log("No inactive bullets available");
    return false;
  }, [origin, target]);

  // Spawn a bullet when the component mounts or when dependencies change
  useEffect(() => {
    spawnBullet();
  }, [spawnBullet]);

  // Update bullets on each frame
  useFrame(() => {
    if (!meshRef.current) return;

    // Calculate screen bounds for culling
    const maxX = viewport.width / 2;
    const maxY = viewport.height / 2;

    // Update each bullet
    bullets.current.forEach((bullet, index) => {
      if (!bullet.active) return;

      // Move the bullet
      bullet.position.add(bullet.velocity);

      // Check if bullet is off-screen
      if (
        bullet.position.x < -maxX ||
        bullet.position.x > maxX ||
        bullet.position.y < -maxY ||
        bullet.position.y > maxY
      ) {
        bullet.active = false;
        console.log("Bullet deactivated (off-screen)");
      }

      // Update the instanced mesh
      const dummy = new THREE.Object3D();
      dummy.position.copy(bullet.position);
      dummy.scale.set(bullet.bulletSize, bullet.bulletSize, bullet.bulletSize);
      dummy.updateMatrix();

      meshRef.current?.setMatrixAt(index, dummy.matrix);
    });

    // Mark the instance matrix as needing an update
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.5, 8, 8]} />
      <meshBasicMaterial color={bulletColor} />
    </instancedMesh>
  );
};

export default Bullets;

// Define CursorBullets component
interface CursorBulletProps {
  cursorPosition: THREE.Vector3;
  count?: number;
  bulletColor?: string;
  isActive: boolean;
}

export const CursorBullets: React.FC<CursorBulletProps> = ({
  cursorPosition,
  count = 10,
  bulletColor = "yellow",
  isActive,
}) => {
  // Log current cursor position
  console.log("CursorBullets rendered", {
    cursorPosition: cursorPosition.clone(),
    isActive,
  });

  // Only render bullets if active
  if (!isActive) return null;

  return (
    <Bullets
      origin={cursorPosition}
      target={new THREE.Vector3(0, 0, 0)} // Target center of screen
      count={count}
      bulletSize={0.1}
      bulletColor={bulletColor}
    />
  );
};
