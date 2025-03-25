import { useFrame } from "@react-three/fiber";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Mesh, Vector3 } from "three";
import { collisionEventDispatcher } from "../../../../context/events/eventListener";
import { commonValues } from "./common";
import { GameContext } from "../../../../context/game/GameContext";
import { fireRateElapsed, RandRange } from "../../../../helpers/helpers";
import { GameMode } from "../../game/game";
import { AudioContext } from "../../../../context/audio/AudioContext";

// buffer around the core
export const coreBuffer = 0.15;

const Core: React.FC = () => {
  const coreRef = useRef<Mesh>(null);
  const { gameState, cursorState } = useContext(GameContext);
  const { playSound } = useContext(AudioContext);
  // const corePosition = useRef(new Vector3());
  const [coreState, setCoreState] = useState(coreStates.idle);
  const [bulletSpawnTrigger, setBulletSpawnTrigger] = useState(0);

  const hitTimeout = useRef<NodeJS.Timeout | null>(null);
  const coreHitInterval = commonValues.hit.interval;

  // Bullet spawning state
  const [isFiring, setIsFiring] = useState(false);
  const lastBulletTime = useRef(1500);
  const bulletInterval = useRef(1500); // Milliseconds between bullet spawns

  const playCoreHitSound = useCallback(() => {
    const randNum = Math.ceil(RandRange(0, 3));
    switch (randNum) {
      case 1:
        playSound("core_hit");
        break;
      case 2:
        playSound("core_hit2");
        break;
      case 3:
        playSound("core_hit3");
        break;
      default:
        playSound("core_hit");
        break;
    }
  }, [playSound]);

  const handleCoreHit = useCallback(() => {
    playCoreHitSound();
    setCoreState(coreStates.hit);
    if (hitTimeout.current) {
      clearTimeout(hitTimeout.current); // Clear any existing timeout
    }
    hitTimeout.current = setTimeout(() => {
      setCoreState(coreStates.idle);
      hitTimeout.current = null;
    }, coreHitInterval);
  }, [coreHitInterval, playCoreHitSound]);

  useEffect(() => {
    collisionEventDispatcher.subscribe("coreHit", handleCoreHit);
    setIsFiring(gameState.gameMode === GameMode.sales);

    return () => {
      collisionEventDispatcher.unsubscribe("coreHit", handleCoreHit);
      if (hitTimeout.current) {
        clearTimeout(hitTimeout.current);
      }
    };
  }, [gameState.gameMode, handleCoreHit]);

  useFrame(({ clock }) => {
    if (!coreRef.current) return;
    const core = coreRef.current;
    core.rotation.y += 0.005;

    // Handle bullet spawning
    if (isFiring && cursorState != "dead") {
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
  });

  return (
    <>
      <mesh ref={coreRef} position={new Vector3(0, 0, commonValues.layer.game)}>
        <sphereGeometry args={[0.5, 4, 2]} />
        <meshBasicMaterial color={coreState.color} wireframe={true} />
      </mesh>

      {/* Persistent bullet component */}
      {/* <CoreBullets
        corePosition={corePosition.current}
        count={20}
        bulletColor="red"
        isActive={isFiring}
        spawnTrigger={bulletSpawnTrigger}
      /> */}
    </>
  );
};

export default Core;

const coreStates = {
  idle: {
    color: "#f06514",
  },
  hit: {
    color: "#f8ee91",
  },
};
