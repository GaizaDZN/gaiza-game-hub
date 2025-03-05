import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Mesh } from "three";
import { collisionEventDispatcher } from "../../../../context/events/eventListener";
import { intervalElapsed } from "../../../../helpers/helpers";
import { commonValues } from "./common";

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
  const [coreState, setCoreState] = useState(coreStates.idle);
  const hitTimeout = useRef<NodeJS.Timeout | null>(null);
  const coreHitInterval = commonValues.hit.interval;

  const handleCoreHit = () => {
    setCoreState(coreStates.hit);
    if (hitTimeout.current) {
      clearTimeout(hitTimeout.current); // Clear any existing timeout
    }
    hitTimeout.current = setTimeout(() => {
      setCoreState(coreStates.idle);
      hitTimeout.current = null;
    }, coreHitInterval);
  };

  useEffect(() => {
    collisionEventDispatcher.subscribe("coreHit", handleCoreHit);
    return () => {
      collisionEventDispatcher.unSubscribe("coreHit", handleCoreHit);
      if (hitTimeout.current) {
        clearTimeout(hitTimeout.current);
      }
    };
  }, []);

  useFrame(() => {
    if (coreRef.current) {
      const core = coreRef.current;
      core.rotation.y += 0.005;
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
