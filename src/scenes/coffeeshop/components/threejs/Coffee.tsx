import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const Coffee: React.FC = () => {
  const coffeeRef = useRef<THREE.Mesh>(null);
  const coffeeSize = 1;

  useFrame((_, delta) => {
    if (coffeeRef.current) {
      coffeeRef.current.rotation.x += delta;
      coffeeRef.current.rotation.y += delta / 2;
    }
  });

  return (
    <mesh ref={coffeeRef}>
      <boxGeometry args={[coffeeSize, coffeeSize, coffeeSize]} />
      <meshBasicMaterial color={"#ff9e0c"} />
    </mesh>
  );
};

export default Coffee;
