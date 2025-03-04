import {
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

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
        console.log(`Initialized ${count} bullets in pool`);
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

        console.log("Bullet spawned", {
          from: origin.clone(),
          velocity: inactiveBullet.velocity.clone(),
        });

        return true;
      }
      console.log("No inactive bullets available");
      return false;
    }, [origin, target]);

    // Expose the spawnBullet function to the parent component via ref
    useImperativeHandle(ref, () => ({
      spawnBullet,
    }));

    useFrame(() => {
      if (!meshRef.current) return;
      const maxX = viewport.width / 2;
      const maxY = viewport.height / 2;
      const currentTime = Date.now();

      bullets.current.forEach((bullet, index) => {
        if (!bullet.active) return;

        bullet.position.add(bullet.velocity);

        const isOffScreen =
          bullet.position.x < -maxX ||
          bullet.position.x > maxX ||
          bullet.position.y < -maxY ||
          bullet.position.y > maxY;

        const exceededLifetime =
          bullet.createdAt && currentTime - bullet.createdAt > maxLifetime;

        if (isOffScreen || exceededLifetime) {
          bullet.active = false;
          bullet.position.x = 1000;
          bullet.position.y = 1000;
        }

        const dummy = new THREE.Object3D();
        dummy.position.copy(bullet.position);
        dummy.scale.set(
          bullet.bulletSize,
          bullet.bulletSize,
          bullet.bulletSize
        );
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
