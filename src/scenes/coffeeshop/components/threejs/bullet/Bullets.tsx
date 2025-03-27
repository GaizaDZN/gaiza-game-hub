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
  stage: number;
  bulletTarget: THREE.Vector3 | null; // for creating paths to actual target
  bulletPath: THREE.Vector3[] | null;
  bulletChildren: Bullet[] | null; // for explosives
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
  bullet: {
    explosive: {
      small: {
        count: 3,
        radius: 2,
      },
      medium: {
        count: 5,
        radius: 3,
      },
      large: {
        count: 8,
        radius: 4,
      },
    },
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

    const initBullet = useCallback((): Bullet => {
      return {
        position: origin.clone(),
        velocity: velocity.clone(),
        bulletSize: bulletSize,
        active: false,
        bulletSource,
        bulletType,
        stage: 0,
        bulletTarget: null,
        bulletPath: null,
        bulletChildren: null,
      };
    }, [origin, velocity, bulletSize, bulletSource, bulletType]);

    // Initialize bullet pool
    useEffect(() => {
      if (!initializedRef.current) {
        bullets.current = Array(count)
          .fill(null)
          .map(() => initBullet());

        initializedRef.current = true;
      }
    }, [
      bulletSize,
      bulletSource,
      bulletType,
      count,
      initBullet,
      origin,
      velocity,
    ]);

    // Expose the spawnBullet function to the parent component via ref
    useImperativeHandle(ref, () => ({
      spawnBullet: (bulletType: BulletType) => spawnBullet(bulletType),
    }));

    const explodeBullet = (parentBullet: Bullet) => {
      const { count, radius } = bulletConsts.bullet.explosive.large;

      const explosionOrigin = parentBullet.bulletTarget ?? target;

      for (let i = 0; i < count; i++) {
        const angle = (i * Math.PI * 2) / count;
        const pelletTarget = new THREE.Vector3(
          explosionOrigin.x + Math.cos(angle) * radius,
          explosionOrigin.y + Math.sin(angle) * radius,
          explosionOrigin.z
        );

        const pellet = activateBullet(
          parentBullet.position,
          pelletTarget,
          parentBullet.bulletSource
        );
        // increase stage - only bullets at stage 0 should explode
        if (pellet) pellet.stage = 1;
      }
      parentBullet.active = false;
    };

    const createMissilePath = useCallback(
      (bullet: Bullet): THREE.Vector3[] => {
        const path: THREE.Vector3[] = [];
        const start = origin.clone();
        const end = target.clone();

        // arc
        const midX = (start.x + end.x) / 2;
        const midY = Math.max(start.y, end.y) + Math.abs(end.y - start.y) * 1.1;
        const mid = new THREE.Vector3(midX, midY, origin.z);

        const steps = 10; // more steps = smoother curve
        let prevPoint = start.clone();
        path.push(prevPoint.clone());

        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const p1 = new THREE.Vector3().lerpVectors(start, mid, t);
          const p2 = new THREE.Vector3().lerpVectors(mid, end, t);
          const point = new THREE.Vector3().lerpVectors(p1, p2, t);

          // only add the point if it's sufficiently far from the last one
          if (prevPoint.distanceTo(point) > 0.3) {
            path.push(point.clone());
            prevPoint = point.clone();
          }
        }

        bullet.bulletTarget = path[1]; // 0 is the bullet origin
        return path;
      },
      [origin, target]
    );

    const adjustTrajectory = useCallback(
      (newTarget: THREE.Vector3, bullet: Bullet, source: BulletSource) => {
        let bulletSpeed =
          source === BulletSource.player
            ? bulletConsts.player.speed
            : bulletConsts.enemy.speed;
        if (bullet.bulletType === BulletType.Missile) {
          bulletSpeed = bulletSpeed / 3;
        }

        const direction = new THREE.Vector3()
          .subVectors(newTarget, bullet.stage === 0 ? origin : bullet.position)
          .normalize();
        bullet.velocity.copy(direction.multiplyScalar(bulletSpeed));
      },
      [origin]
    );

    const activateBullet = useCallback(
      (
        origin: THREE.Vector3,
        target: THREE.Vector3 | null,
        source: BulletSource
      ): Bullet | null => {
        const inactiveBullet = bullets.current.find((b) => !b.active);
        if (!inactiveBullet) return null;

        inactiveBullet.position.copy(origin);
        inactiveBullet.bulletTarget = target ? target.clone() : null;
        inactiveBullet.velocity.set(0, 0, 0);
        inactiveBullet.stage = 0;
        inactiveBullet.bulletPath = null;

        // Add missile logic
        if (bulletType === BulletType.Missile && inactiveBullet) {
          inactiveBullet.bulletPath = createMissilePath(inactiveBullet);
        }

        // Calculate direction and assign velocity
        const targetToUse = inactiveBullet.bulletTarget || target;
        if (targetToUse) {
          adjustTrajectory(targetToUse, inactiveBullet, source);
        }

        inactiveBullet.active = true;
        inactiveBullet.createdAt = Date.now();
        return inactiveBullet;
      },
      [adjustTrajectory, bulletType, createMissilePath]
    );

    // Function to spawn a bullet
    const spawnBullet = useCallback(
      (bulletType: BulletType) => {
        const targetPosition =
          bulletType === BulletType.Missile
            ? origin
                .clone()
                .add(
                  new THREE.Vector3(
                    Math.random() * 0.1 - 0.05,
                    Math.random() * 0.1 - 0.05,
                    0
                  )
                )
            : target;

        const newBullet = activateBullet(origin, targetPosition, bulletSource);

        return newBullet != null;
      },
      [activateBullet, bulletSource, origin, target]
    );

    // COLLISION //////////////////////////////////////

    const handleEnemyCollision = (bullet: Bullet, distanceToTarget: number) => {
      if (
        bullet.bulletSource === BulletSource.enemy &&
        cursorState !== "hit" &&
        cursorState !== "dead" &&
        gameState.gameMode === GameMode.sales
      ) {
        if (distanceToTarget < 0.15) {
          bullet.active = false;
          collisionEventDispatcher.dispatch("playerHit");
          return;
        }
      }
    };

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
        case BulletType.Normal || BulletType.Explosive:
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

    // bullets that move outward from origin and then curve toward the target.
    const updateMissile = (bullet: Bullet) => {
      bullet.position.add(bullet.velocity);

      // adjust path if target has moved - tracking (target never moves)
      // if (bullet.bulletPath) {
      //   const lastTarget = bullet.bulletPath[bullet.bulletPath.length - 1];
      //   if (!lastTarget.equals(target)) {
      //     // recreate path only if target has moved significantly
      //     const distanceToOriginalTarget = lastTarget.distanceTo(target);
      //     if (distanceToOriginalTarget > 0.8) {
      //       bullet.bulletPath = createMissilePath(bullet);
      //     }
      //   }
      // }
    };

    const handleBulletStaging = (bullet: Bullet, distanceToTarget: number) => {
      switch (bullet.bulletType) {
        case BulletType.Explosive:
          if (bullet.stage === 0 && distanceToTarget < 0.5) {
            explodeBullet(bullet);
          }
          return;

        case BulletType.Missile:
          if (bullet.bulletPath)
            if (
              distanceToTarget <= 0.15 &&
              bullet.stage < bullet.bulletPath.length - 1
            ) {
              // check if current waypoint is reached and if there are more
              bullet.stage++;

              // update target to next waypoint.
              if (bullet.stage < bullet.bulletPath.length) {
                bullet.bulletTarget = bullet.bulletPath[bullet.stage];
                adjustTrajectory(
                  bullet.bulletTarget,
                  bullet,
                  bullet.bulletSource
                );
              }
            }
          return;
        default:
          return;
      }
    };

    const triggerCoreHit = (bullet: Bullet) => {
      bullet.active = false;
      collisionEventDispatcher.dispatch("coreHit");
    };

    const handlePlayerCollisions = (
      bullet: Bullet,
      distanceToTarget: number
    ) => {
      switch (bullet.bulletType) {
        case BulletType.Normal:
          {
            const distanceFromCore = distanceToTarget + coreBuffer;
            if (distanceFromCore < coreRadius) {
              triggerCoreHit(bullet);
            }
          }
          return;
        case BulletType.Missile:
          {
            if (bullet.bulletPath) {
              if (
                bullet.bulletTarget?.equals(target) &&
                distanceToTarget < coreRadius - bullet.bulletSize * 2.9
              ) {
                triggerCoreHit(bullet);
              }
            }
          }
          return;
        default:
          break;
      }
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

        const distanceToTarget = bullet.position.distanceTo(
          bullet.bulletTarget ?? target
        );

        // bullets with a bulletTarget will undergo special staging logic
        if (
          bullet.bulletType === BulletType.Missile ||
          bullet.bulletType === BulletType.Explosive
        ) {
          // Special bullet staging logic
          handleBulletStaging(bullet, distanceToTarget);
        }

        if (bullet.bulletSource === BulletSource.player) {
          handlePlayerCollisions(bullet, distanceToTarget);
        } else {
          handleEnemyCollision(bullet, distanceToTarget);
        }

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
