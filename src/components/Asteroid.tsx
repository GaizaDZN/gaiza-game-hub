import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

const Asteroid: React.FC = () => {
  const asteroidRef = useRef<THREE.Mesh>(null!);
  //   const { viewport } = useThree();

  //   const velocity = 0.01;
  const asteroidSize = 1;

  useFrame(() => {
    asteroidRef.current.rotation.x += 0.005;
    asteroidRef.current.rotation.z += 0.005;

    // move
    // meshRef.current.position.x += velocity;
    // if (meshRef.current.position.x > 10) {
    //   velocity = velocity * -1;
    // } else if (meshRef.current.position.x < -10) {
    //   velocity = velocity * -1;
    // }
  });

  return (
    <>
      <mesh ref={asteroidRef} position={[0, 0, 0]}>
        <boxGeometry args={[asteroidSize, asteroidSize, asteroidSize]} />
        <meshStandardMaterial color={"#29cee3"} />
      </mesh>
    </>
  );
};

export default Asteroid;
