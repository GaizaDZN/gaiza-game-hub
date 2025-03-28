import {
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useContext,
  useMemo,
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
  bulletType: BulletType;
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
  isPellet: boolean;
  trailInstances: TrailInstance[];
  needsReset: boolean;
}

interface TrailInstance {
  position: THREE.Vector3;
  opacity: number;
  active: boolean;
  maxLifetime: number;
  createdAt?: number;
  needsReset: boolean;
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
  trail: {
    lifetime: 1000,
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
      bulletType,
    },
    ref
  ) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const trailMeshRef = useRef<THREE.InstancedMesh>(null);
    const bulletPool = useRef<Bullet[]>([]);
    const trailPool = useRef<TrailInstance[]>([]);
    const initializedRef = useRef(false);
    const { cursorState, gameState } = useContext(GameContext);
    const { viewport } = useThree();

    const initBullet = useCallback((): Bullet => {
      return {
        position: origin.clone(),
        velocity: velocity.clone(),
        bulletSize: bulletSize,
        active: false,
        bulletSource: bulletSource,
        bulletType: bulletType,
        stage: 0,
        bulletTarget: null,
        bulletPath: null,
        bulletChildren: null,
        isPellet: false,
        trailInstances: [],
        needsReset: false,
      };
    }, [origin, velocity, bulletSize, bulletSource, bulletType]);

    const initTrail = useCallback((): TrailInstance => {
      return {
        position: new THREE.Vector3(0, 0, 0),
        opacity: 0,
        active: false,
        maxLifetime: bulletConsts.trail.lifetime,
        needsReset: false,
      };
    }, []);

    // Initialize bullet pool
    useEffect(() => {
      if (!initializedRef.current) {
        bulletPool.current = Array(count)
          .fill(null)
          .map(() => initBullet());

        trailPool.current = Array(count * 5)
          .fill(null)
          .map(() => initTrail());

        initializedRef.current = true;
      }
    }, [
      bulletSize,
      bulletSource,
      bulletType,
      count,
      initBullet,
      initTrail,
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
          parentBullet.bulletSource,
          BulletType.Normal
        );

        if (pellet) {
          pellet.isPellet = true;
          // increase stage - only bullets at stage 0 should explode
          pellet.stage = 1;
        }
      }
      deactivateInstance(parentBullet);
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
          if (prevPoint.distanceTo(point) > 0.2) {
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
        source: BulletSource,
        type: BulletType
      ): Bullet | null => {
        const inactiveBullet = bulletPool.current.find((b) => !b.active);
        if (!inactiveBullet) return null;

        inactiveBullet.position.copy(origin);
        inactiveBullet.bulletTarget = null;
        inactiveBullet.velocity.set(0, 0, 0);
        inactiveBullet.stage = 0;
        inactiveBullet.bulletPath = null;
        inactiveBullet.bulletType = type;

        // Add missile logic
        if (
          inactiveBullet.bulletType === BulletType.Missile &&
          inactiveBullet
        ) {
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
      [adjustTrajectory, createMissilePath]
    );

    // Function to spawn a bullet
    const spawnBullet = useCallback(
      (type: BulletType) => {
        const newBullet = activateBullet(origin, target, bulletSource, type);

        return newBullet != null;
      },
      [activateBullet, bulletSource, origin, target]
    );

    const spawnTrail = useCallback((bullet: Bullet) => {
      // find first inactive trail in the pool
      const availableTrail = trailPool.current.find((trail) => !trail.active);

      if (availableTrail) {
        availableTrail.position.copy(bullet.position);
        availableTrail.opacity = 1.0;
        availableTrail.active = true;
        availableTrail.createdAt = Date.now();

        // TODO: Limit total active trails per bullet
        const activeBulletTrails = trailPool.current.filter(
          (trail) =>
            trail.active && trail.position.distanceTo(bullet.position) < 1
        );

        if (activeBulletTrails.length > 5) {
          // deactivate the oldest trail
          const oldestTrail = activeBulletTrails[0];
          deactivateInstance(oldestTrail);
          oldestTrail.opacity = 0;
        }
      }
    }, []);

    // COLLISION //////////////////////////////////////

    const handleEnemyCollision = (bullet: Bullet, distanceToTarget: number) => {
      if (
        bullet.bulletSource === BulletSource.enemy &&
        cursorState !== "hit" &&
        cursorState !== "dead" &&
        gameState.gameMode === GameMode.sales
      ) {
        if (distanceToTarget < 0.15) {
          deactivateInstance(bullet);
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

    const trailExpired = (trail: TrailInstance): boolean | 0 | undefined => {
      const currentTime = Date.now();
      return (
        trail.createdAt && currentTime - trail.createdAt > trail.maxLifetime
      );
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
        case BulletType.Explosive:
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
          if (bullet.stage === 0 && distanceToTarget < 0.8) {
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
      deactivateInstance(bullet);
      collisionEventDispatcher.dispatch("coreHit");
    };

    const handlePlayerCollisions = (
      bullet: Bullet,
      distanceToTarget: number
    ) => {
      switch (bullet.bulletType) {
        case BulletType.Normal:
          {
            if (distanceToTarget < coreRadius - bullet.bulletSize) {
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

    const getAdjustedScale = (
      bullet: Bullet,
      distanceRatio: number
    ): number => {
      const minScale = 0.6;
      const maxScale = 1;
      return (
        bullet.bulletSize * (minScale + (maxScale - minScale) * distanceRatio)
      );
    };

    const deactivateInstance = (instance: Bullet | TrailInstance): void => {
      instance.active = false;
      instance.needsReset = true;
    };

    const resetInstance = (
      object3d: THREE.Object3D,
      index: number,
      ref: React.RefObject<
        THREE.InstancedMesh<
          THREE.BufferGeometry<THREE.NormalBufferAttributes>,
          THREE.Material | THREE.Material[],
          THREE.InstancedMeshEventMap
        >
      >
    ) => {
      object3d.position.set(0, 0, 0);
      object3d.scale.set(0, 0, 0);
      object3d.updateMatrix();
      ref.current?.setMatrixAt(index, object3d.matrix);
    };

    // ANIMATION /////////////////////////////////////////////////

    const dummy = useMemo(() => new THREE.Object3D(), []);
    const trailDummy = useMemo(() => new THREE.Object3D(), []);
    const pos1 = useMemo(() => new THREE.Vector3(), []);
    const pos2 = useMemo(() => new THREE.Vector3(), []);

    useFrame(() => {
      if (!meshRef.current) return;
      const maxX = viewport.width / 2;
      const maxY = viewport.height / 2;

      let shouldUpdateInstanceMatrix = false;
      let shouldUpdateTrailMatrix = false;

      bulletPool.current.forEach((bullet, index) => {
        if (!bullet.active) {
          resetInstance(dummy, index, meshRef);
          bullet.needsReset = false;
          shouldUpdateInstanceMatrix = true;
          return;
        }

        // Move bullet
        updateBulletPosition(bullet);

        // Spawn trail instance every few frames
        if (Math.random() > 0.7) {
          spawnTrail(bullet);
        }

        // COLLISIONS /////////////////////////////////////////////

        if (bulletOffScreen(bullet, maxX, maxY) || bulletExpired(bullet)) {
          deactivateInstance(bullet);
          return;
        }

        // Compute distance from the center
        const distanceFromCenter = Math.sqrt(
          bullet.position.x ** 2 + bullet.position.y ** 2
        );
        const maxDistance = Math.sqrt(maxX ** 2 + maxY ** 2);
        const distanceRatio = distanceFromCenter / maxDistance;

        pos1.copy(bullet.position);
        pos2.copy(bullet.bulletTarget ?? target);
        // flatten Z-axis
        pos1.z = 0;
        pos2.z = 0;
        const distance2D = pos1.distanceTo(pos2);

        // bullets with staging logic
        if (
          bullet.bulletType === BulletType.Missile ||
          bullet.bulletType === BulletType.Explosive
        ) {
          // Special bullet staging logic
          handleBulletStaging(bullet, distance2D);
        }

        if (bullet.bulletSource === BulletSource.player) {
          handlePlayerCollisions(bullet, distance2D);
        } else {
          handleEnemyCollision(bullet, distance2D);
        }

        dummy.position.copy(bullet.position);

        if (bullet.bulletSource === BulletSource.player) {
          const scaleAdjustment = getAdjustedScale(bullet, distanceRatio);
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
        shouldUpdateInstanceMatrix = true;
      });

      // TRAILS ////////////////////////////////////////////////////
      // Render trails from the pool
      trailPool.current.forEach((trail, trailIndex) => {
        if (!trail.active && trail.needsReset) {
          resetInstance(trailDummy, trailIndex, trailMeshRef);
          trail.needsReset = false;
          shouldUpdateTrailMatrix = true;
          return;
        }

        // Reduce opacity
        trail.opacity -= 0.1;

        // Deactivate if opacity is too low or time expired
        if (trail.opacity <= 0 || trailExpired(trail)) {
          deactivateInstance(trail);
          return;
        }

        // Render trail
        trailDummy.position.copy(trail.position);
        trailDummy.scale.set(0.2, 0.2, 0.2); // Adjust trail size as needed
        trailDummy.updateMatrix();

        trailMeshRef.current?.setMatrixAt(trailIndex, trailDummy.matrix);
        shouldUpdateTrailMatrix = true;
      });

      if (shouldUpdateInstanceMatrix && meshRef.current.instanceMatrix) {
        meshRef.current.instanceMatrix.needsUpdate = true;
      }

      if (shouldUpdateTrailMatrix && trailMeshRef.current?.instanceMatrix) {
        trailMeshRef.current.instanceMatrix.needsUpdate = true;
      }
    });

    return (
      <>
        {/* Main bullets */}
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
          <sphereGeometry args={[0.5, 3, 3]} />
          <meshBasicMaterial color={bulletColor} />
        </instancedMesh>

        {/* Trail instances */}
        <instancedMesh
          ref={trailMeshRef}
          args={[undefined, undefined, count * 5]}
        >
          <sphereGeometry args={[0.2, 1, 1]} />
          <meshBasicMaterial color={bulletColor} transparent opacity={1} />
        </instancedMesh>
      </>
    );
  }
);

export default Bullets;
