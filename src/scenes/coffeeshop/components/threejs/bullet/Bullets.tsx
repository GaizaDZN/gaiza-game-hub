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

    const createBulletPath = (bullet: Bullet | undefined): THREE.Vector3[] => {
      const newBulletPath: THREE.Vector3[] = [];

      if (bullet) {
        // create path based on bullet type
      }
      return newBulletPath;
    };

    // Establish a new target for bullets with multiple stages (missiles, explosives)
    const setBulletTargets = (bullet: Bullet | undefined) => {
      if (bullet) {
        switch (bullet.bulletType) {
          case BulletType.Missile:
            // if no path or target position has changed, create a path.
            if (!bullet.bulletPath) {
              bullet.bulletPath = createBulletPath(bullet);
            } else {
              // update path if end target has changed - for tracking.
              // maybe update on an interval to prevent too many re-renders?
              const lastTarget =
                bullet.bulletPath[bullet.bulletPath.length - 1];
              if (lastTarget != target) {
                bullet.bulletPath = createBulletPath(bullet);
              }
            }
            break;
          case BulletType.Explosive:
            // Assign targets to children in a radius. Create children if null.
            if (!bullet.bulletChildren) {
              // bullet.bulletChildren = createExplosiveChildren(bullet);
            }
            break;
          //
          default:
            console.log(
              `Bullet type ${bullet.bulletType} not recognized. Using missile default.`
            );
            break;
        }
      }
    };

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

    const activateBullet = (
      origin: THREE.Vector3,
      target: THREE.Vector3 | null,
      source: BulletSource
    ): Bullet | null => {
      const inactiveBullet = bullets.current.find((b) => !b.active);
      if (!inactiveBullet) return null;

      inactiveBullet.position.copy(origin);
      inactiveBullet.bulletTarget = target ? target.clone() : null;
      inactiveBullet.velocity.set(0, 0, 0);
      inactiveBullet.active = true;
      inactiveBullet.createdAt = Date.now();

      // Calculate direction and assign velocity
      const bulletSpeed =
        source === BulletSource.player
          ? bulletConsts.player.speed
          : bulletConsts.enemy.speed;

      if (target) {
        const direction = new THREE.Vector3()
          .subVectors(target, origin)
          .normalize();
        inactiveBullet.velocity.copy(direction.multiplyScalar(bulletSpeed));
      }

      return inactiveBullet;
    };

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

        return activateBullet(origin, targetPosition, bulletSource) !== null;
      },
      [bulletSource, origin, target]
    );

    // COLLISION //////////////////////////////////////

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
      // move outward from origin
      if (bullet.stage === 0) {
        bullet.position.add(bullet.velocity);
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
        const distanceToTarget = bullet.position.distanceTo(target);

        // Explosives
        if (
          bullet.bulletType === BulletType.Explosive &&
          bullet.stage === 0 &&
          distanceToTarget < 0.5
        ) {
          // EXPLODE
          explodeBullet(bullet);
        }

        // Player bullets

        const distanceFromCore = distanceToTarget + coreBuffer;
        if (bullet.bulletSource === BulletSource.player) {
          if (distanceFromCore < coreRadius) {
            bullet.active = false;
            collisionEventDispatcher.dispatch("coreHit");
          }
        }

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
