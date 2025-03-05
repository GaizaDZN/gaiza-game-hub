import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Mesh } from "three";
import { collisionEventDispatcher } from "../../../../context/events/eventListener";
import { intervalElapsed } from "../../../../helpers/helpers";

const coreStates = {
  idle: {
    color: "#f06514",
  },
  hit: {
    color: "#f8ee91",
  },
};

// buffer around the core
export const coreBuffer = 0.15;

const Core: React.FC = () => {
  const coreRef = useRef<Mesh>(null);
  const [hit, setHit] = useState(false);
  const [coreState, setCoreState] = useState(coreStates.idle);
  const coreHitTime = useRef(0);
  const coreHitInterval = useRef(100);

  const handleCoreHit = () => {
    setHit(true);
    setCoreState(coreStates.hit);
  };

  useEffect(() => {
    collisionEventDispatcher.subscribe("coreHit", handleCoreHit);
    return () => {
      collisionEventDispatcher.unSubscribe("coreHit", handleCoreHit);
    };
  }, [hit]);

  useFrame(({ clock }) => {
    if (coreRef.current) {
      const core = coreRef.current;
      //   const position = core.position;
      //   const rotation = core.rotation;
      core.rotation.y += 0.005;
    }
    if (hit) {
      const currentTime = clock.getElapsedTime() * 1000;
      // if enough time has passed since hit return to idle state
      if (
        intervalElapsed(
          currentTime,
          coreHitTime.current,
          coreHitInterval.current
        )
      ) {
        setCoreState(coreStates.idle);
        setHit(false);
        coreHitTime.current = currentTime;
      }
    }
  });

  return (
    <mesh ref={coreRef}>
      <sphereGeometry args={[1, 4, 2]} />
      <meshBasicMaterial color={coreState.color} wireframe={true} />
    </mesh>
  );
};

export default Core;
