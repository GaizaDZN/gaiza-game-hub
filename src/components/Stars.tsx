import { useRef, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RandRange } from "../helpers/helpers";

interface StarInstance {
  position: THREE.Vector3;
  color: THREE.Color;
  speed: number;
}

interface StarsProps {
  count?: number;
  colors?: string[];
  height: number;
  width: number;
  scale: number;
  velocity: number;
  propPosition: [number, number, number];
}

const Stars: React.FC<StarsProps> = ({
  count = 50,
  colors = ["#f172ff", "#ff7b7b", "#ffdf61", "#5fafff"],
  velocity,
  height,
  width,
  propPosition,
  scale = 0.1,
}) => {
  const starSize = scale;
  const baseVelocity = velocity;
  const starHeight = height;
  const starWidth = width;

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { viewport } = useThree();

  // Create a temporary object for matrix updates
  const tempObject = useMemo(() => new THREE.Object3D(), []);

  // Create initial instance data
  const instances = useMemo(() => {
    const temp: StarInstance[] = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        position: new THREE.Vector3(
          propPosition[0] != 0
            ? propPosition[0]
            : Math.random() * viewport.width - viewport.width / 2,
          propPosition[1] != 0
            ? propPosition[1]
            : Math.random() * viewport.height - viewport.height / 2,
          RandRange(propPosition[2] - 0.2, propPosition[2])
        ),
        color: new THREE.Color(
          colors[Math.floor(Math.random() * colors.length)]
        ),
        speed: baseVelocity * (0.8 + Math.random() * 0.4), // Random speed variation
      });
    }
    return temp;
  }, [count, viewport.width, viewport.height, colors]);

  // Set initial colors
  useEffect(() => {
    if (!meshRef.current) return;

    instances.forEach((instance, i) => {
      meshRef.current?.setColorAt(i, instance.color);
    });

    // Need to flag colors for update
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [instances]);

  // Animation loop
  useFrame(() => {
    if (!meshRef.current) return;

    instances.forEach((instance, i) => {
      // Update position
      instance.position.x -= instance.speed;

      // Reset position if star moves off screen
      if (instance.position.x < -viewport.width / 2 - starSize) {
        instance.position.x = viewport.width / 2 + starSize;
        instance.position.y =
          Math.random() * viewport.height - viewport.height / 2;
        instance.position.z = RandRange(propPosition[2] - 0.2, propPosition[2]);
      }

      // Update matrix for this instance
      tempObject.position.copy(instance.position);
      tempObject.updateMatrix();
      meshRef.current?.setMatrixAt(i, tempObject.matrix);
    });

    // Flag for matrix update
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[starWidth, starHeight]} />
      <meshBasicMaterial side={2} />
    </instancedMesh>
  );
};

export default Stars;
