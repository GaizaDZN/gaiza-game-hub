import {
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { coreBuffer } from "../Core";
import { collisionEventDispatcher } from "../../../../../context/events/eventListener";

// Bullets.tsx

export interface BulletsHandle {
  spawnBullet: () => boolean;
}

export interface BulletProps {
  origin: THREE.Vector3;
  target?: THREE.Vector3;
  velocity?: THREE.Vector3;
  count?: number;
  bulletSize?: number;
  bulletColor?: string;
  maxLifetime?: number;
}

interface Bullet {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  bulletSize: number;
  active: boolean;
  createdAt?: number;
}

const bulletDefaults = {
  count: 10,
  size: 0.2,
  color: "red",
  maxLifetime: 2000,
};

const Bullets = forwardRef<BulletsHandle, BulletProps>(
  (
    {
      origin,
      target = new THREE.Vector3(0, 0, 0),
      velocity = new THREE.Vector3(0, 0.2, 0),
      count = bulletDefaults.count,
      bulletSize = bulletDefaults.size,
      bulletColor = bulletDefaults.color,
      maxLifetime = bulletDefaults.maxLifetime,
    },
    ref
  ) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const bullets = useRef<Bullet[]>([]);
    const initializedRef = useRef(false);
    const { viewport } = useThree();

    // Initialize bullet pool
    useEffect(() => {
      if (!initializedRef.current) {
        bullets.current = Array(count)
          .fill(null)
          .map(() => ({
            position: origin.clone(),
            velocity: velocity.clone(),
            bulletSize: bulletSize,
            active: false,
          }));

        initializedRef.current = true;
      }
    }, [bulletSize, count, origin, velocity]);

    // Function to spawn a bullet
    const spawnBullet = useCallback(() => {
      const inactiveBullet = bullets.current.find((b) => !b.active);
      if (inactiveBullet) {
        const direction = new THREE.Vector3()
          .subVectors(target, origin)
          .normalize();

        inactiveBullet.position.copy(origin);
        inactiveBullet.velocity.copy(direction.multiplyScalar(0.1));
        inactiveBullet.active = true;
        inactiveBullet.createdAt = Date.now();

        return true;
      }
      return false;
    }, [origin, target]);

    // Expose the spawnBullet function to the parent component via ref
    useImperativeHandle(ref, () => ({
      spawnBullet,
    }));

    const bulletOffScreen = (
      bullet: Bullet,
      maxX: number,
      maxY: number
    ): boolean => {
      return (
        bullet.position.x < -maxX ||
        bullet.position.x > maxX ||
        bullet.position.y < -maxY ||
        bullet.position.y > maxY
      );
    };

    const bulletExpired = (bullet: Bullet): boolean | 0 | undefined => {
      const currentTime = Date.now();
      return bullet.createdAt && currentTime - bullet.createdAt > maxLifetime;
    };

    // Dead zone within coreBuffer - if a bullet enters this position it hits the core.
    const coreRadius =
      (Math.min(viewport.width, viewport.height) / 2) * coreBuffer;

    useFrame(() => {
      if (!meshRef.current) return;
      const maxX = viewport.width / 2;
      const maxY = viewport.height / 2;

      const dummy = new THREE.Object3D();
      bullets.current.forEach((bullet, index) => {
        if (!bullet.active) {
          // Skip rendering inactive bullets by setting their matrix to identity
          dummy.position.set(0, 0, 0); // Move off-screen
          dummy.scale.set(0, 0, 0); // Scale to zero to make it invisible
          dummy.updateMatrix();
          meshRef.current?.setMatrixAt(index, dummy.matrix);
          return;
        }

        bullet.position.add(bullet.velocity);

        // Deactivate bullet
        if (bulletOffScreen(bullet, maxX, maxY) || bulletExpired(bullet)) {
          bullet.active = false;
          return;
        }

        // Handle collisions

        // Compute distance from the center
        const distanceFromCenter = Math.sqrt(
          bullet.position.x ** 2 + bullet.position.y ** 2
        );
        const maxDistance = Math.sqrt(maxX ** 2 + maxY ** 2);
        const distanceRatio = distanceFromCenter / maxDistance;

        if (distanceFromCenter < coreRadius) {
          bullet.active = false;
          collisionEventDispatcher.dispatch("coreHit");
          return;
        }

        dummy.position.copy(bullet.position);

        // Scale: increase size as cursor moves away from center (e.g., 1.0 at center, up to 1.5 at edges)
        const minScale = 0.6;
        const maxScale = 1;
        const scaleAdjustment =
          bullet.bulletSize *
          (minScale + (maxScale - minScale) * distanceRatio);
        // Apply scale based on distance from center

        dummy.scale.set(scaleAdjustment, scaleAdjustment, scaleAdjustment);
        dummy.updateMatrix();
        meshRef.current?.setMatrixAt(index, dummy.matrix);
      });

      if (meshRef.current.instanceMatrix) {
        meshRef.current.instanceMatrix.needsUpdate = true;
      }
    });

    return (
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshBasicMaterial color={bulletColor} />
      </instancedMesh>
    );
  }
);

export default Bullets;
