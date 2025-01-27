import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  DriftLeft,
  RandFromStringArr,
  RandMeshPosition,
} from "../helpers/helpers";

const ShootingStar: React.FC = () => {
  const starRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  const starSize = 0.1;
  const starVelocity = 0.01;
  const starColors: string[] = ["#f7a8ff", "#ffb3b3", "#ffeb99", "#99ccff"];

  useEffect(() => {
    RandMeshPosition(starRef, viewport.width, viewport.height);
  });

  // animation
  useFrame(() => {
    DriftLeft(starRef, starVelocity, viewport.width, viewport.height, starSize);
  });

  return (
    <mesh ref={starRef} position={[0, 0, 0]}>
      <planeGeometry args={[starSize, starSize]} />
      <meshStandardMaterial color={RandFromStringArr(starColors)} />
    </mesh>
  );
};

export default ShootingStar;
