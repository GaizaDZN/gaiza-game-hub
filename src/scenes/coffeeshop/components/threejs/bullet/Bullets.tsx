import {
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useContext,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { coreBuffer } from "../Core";
import { collisionEventDispatcher } from "../../../../../context/events/eventListener";
import { GameContext } from "../../../../../context/game/GameContext";
import { GameMode } from "../../../game/game";

export enum BulletType {
  Normal, // default, accelerates in the target direction.
  Missile, // continuously tracks the target for a short duration.
  Explosive, // explodes when reaching the target, releasing smaller bullets in a radial pattern.
}

export interface BulletsHandle {
  spawnBullet: (bulletType: BulletType) => boolean;
}

export enum BulletSource {
  player = 0,
  enemy = 1,
}

export interface BulletProps {
  bulletType: BulletType;
  bulletSource: BulletSource;
  origin: THREE.Vector3;
  target?: THREE.Vector3;
  velocity?: THREE.Vector3;
  count?: number;
  bulletSize?: number;
  bulletColor?: string;
  maxLifetime?: number;
}

interface Bullet {
  bulletType?: BulletType;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  bulletSize: number;
  active: boolean;
  createdAt?: number;
  bulletSource: BulletSource;
}

export const bulletConsts = {
  player: {
    count: 20,
    size: 0.2,
    color: "yellow",
    maxLifetime: 2500,
    speed: 0.1,
  },

  enemy: {
    count: 20,
    size: 0.15,
    color: "red",
    maxLifetime: 4000,
    speed: 0.03,
  },
};

const Bullets = forwardRef<BulletsHandle, BulletProps>(
  (
    {
      origin,
      target = new THREE.Vector3(0, 0, 0),
      velocity = new THREE.Vector3(0, bulletConsts.enemy.speed, 0),
      count = bulletConsts.enemy.count,
      bulletSize = bulletConsts.enemy.size,
      bulletColor = bulletConsts.enemy.color,
      maxLifetime = bulletConsts.enemy.maxLifetime,
      bulletSource,
      bulletType = BulletType.Normal,
    },
    ref
  ) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const bullets = useRef<Bullet[]>([]);
    const initializedRef = useRef(false);
    const { cursorState, gameState } = useContext(GameContext);
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
            bulletSource,
            bulletType,
          }));

        initializedRef.current = true;
      }
    }, [bulletSize, bulletSource, bulletType, count, origin, velocity]);

    // Function to spawn a bullet
    const spawnBullet = useCallback(
      (bulletType: BulletType) => {
        const inactiveBullet = bullets.current.find((b) => !b.active);
        if (inactiveBullet) {
          const direction = new THREE.Vector3()
            .subVectors(target, origin)
            .normalize();

          switch (bulletType) {
            case BulletType.Normal: {
              break;
            }
            case BulletType.Missile: {
              inactiveBullet.velocity.set(0, 0.1, 0); // initial missile velocity
              break;
            }

            default:
              break;
          }
          const bulletSpeed =
            inactiveBullet.bulletSource === BulletSource.player
              ? bulletConsts.player.speed
              : bulletConsts.enemy.speed;
          inactiveBullet.position.copy(origin);
          inactiveBullet.velocity.copy(direction.multiplyScalar(bulletSpeed));
          inactiveBullet.active = true;
          inactiveBullet.createdAt = Date.now();
          return true;
        }
        return false;
      },
      [origin, target]
    );

    // COLLISION //////////////////////////////////////
    const handlePlayerCollision = (
      bullet: Bullet,
      distanceToTarget: number
    ) => {
      const distanceFromCore = distanceToTarget + coreBuffer;
      if (bullet.bulletSource === BulletSource.player) {
        if (distanceFromCore < coreRadius) {
          bullet.active = false;
          collisionEventDispatcher.dispatch("coreHit");
          return;
        }
      }
    };
    const handleEnemyCollision = (bullet: Bullet, distanceToTarget: number) => {
      if (
        bullet.bulletSource === BulletSource.enemy &&
        cursorState !== "hit" &&
        cursorState !== "dead" &&
        gameState.gameMode === GameMode.sales
      ) {
        // const distanceFromCursor = bullet.position.distanceTo(cursorPosition);
        if (distanceToTarget < 0.15) {
          // TODO: change this to cursor size
          bullet.active = false;
          collisionEventDispatcher.dispatch("playerHit");
          return;
        }
      }
    };

    // Expose the spawnBullet function to the parent component via ref
    useImperativeHandle(ref, () => ({
      spawnBullet: (bulletType: BulletType) => spawnBullet(bulletType),
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

    // MOVEMENT //////////////////////////////////////
    const updateBulletPosition = (bullet: Bullet) => {
      switch (bullet.bulletType) {
        case BulletType.Normal:
          updateNormalBullet(bullet);
          break;
        case BulletType.Missile:
          updateMissile(bullet);
          break;
        default:
          throw new Error(`bullet type ${bullet.bulletType} not recognized`);
      }
    };

    // bullets that move directly to the target.
    const updateNormalBullet = (bullet: Bullet) => {
      bullet.position.add(bullet.velocity);
    };

    // bullets that move outward and then curve toward the target.
    const updateMissile = (bullet: Bullet) => {
      const direction = new THREE.Vector3()
        .subVectors(target, bullet.position)
        .normalize();
      bullet.velocity.lerp(direction, 0.05);
      bullet.position.add(bullet.velocity);
    };

    // ANIMATION /////////////////////////////////////////////////

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

        // Move bullet
        updateBulletPosition(bullet);

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
        const distanceToTarget = bullet.position.distanceTo(target);

        // Explosives
        if (
          bullet.bulletType === BulletType.Explosive &&
          distanceToTarget < 0.1
        ) {
          // EXPLODE
        }

        // Player bullets
        handlePlayerCollision(bullet, distanceToTarget);

        // Enemy bullets
        handleEnemyCollision(bullet, distanceToTarget);

        dummy.position.copy(bullet.position);

        if (bullet.bulletSource === BulletSource.player) {
          const minScale = 0.6;
          const maxScale = 1;
          const scaleAdjustment =
            bullet.bulletSize *
            (minScale + (maxScale - minScale) * distanceRatio);
          // Apply scale based on distance from center
          dummy.scale.set(scaleAdjustment, scaleAdjustment, scaleAdjustment);
        } else {
          dummy.scale.set(
            bullet.bulletSize,
            bullet.bulletSize,
            bullet.bulletSize
          );
        }

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
