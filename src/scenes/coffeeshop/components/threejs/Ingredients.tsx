import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ResourceState } from "../../game/game";
import React from "react";

const ingredientColor = (iName: keyof ResourceState): string => {
  let color: string = "white";

  switch (iName) {
    case "beans":
      color = "#cc701a";
      break;
    case "water":
      color = "#659fec";
      break;
    case "milk":
      color = "#d6faff";
      break;
    case "sugar":
      color = "#fde36f";
      break;
    default:
      break;
  }
  return color;
};

interface IngredientProps {
  iName: keyof ResourceState;
  count: number;
  position?: [number, number, number]; // Optional position prop with default
}

const Ingredients: React.FC<IngredientProps> = ({
  iName,
  count,
  position = [0, 0, 0], // Default to center if not provided
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const color = ingredientColor(iName);

  // Configuration
  const size = 0.2; // Size of each cube
  const radius = 0.5; // Radius of the circle/polygon

  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const rotations = useMemo(
    () =>
      Array(count)
        .fill(0)
        .map(() => ({ x: 0, y: 0 })),
    [count]
  );

  // Calculate positions based on count
  const getPositions = (count: number) => {
    if (count === 3) {
      // Triangle
      const positions = [];
      for (let i = 0; i < 3; i++) {
        const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2; // Start from top
        positions.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          z: 0,
        });
      }
      return positions;
    } else if (count === 4) {
      // Square
      return [
        { x: -radius, y: radius, z: 0 }, // Top left
        { x: radius, y: radius, z: 0 }, // Top right
        { x: -radius, y: -radius, z: 0 }, // Bottom left
        { x: radius, y: -radius, z: 0 }, // Bottom right
      ];
    } else {
      // Circle
      const positions = [];
      for (let i = 0; i < count; i++) {
        const angle = (i * 2 * Math.PI) / count - Math.PI / 2; // Start from top
        positions.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          z: 0,
        });
      }
      return positions;
    }
  };

  const positions = useMemo(() => getPositions(count), [count, radius]);

  useEffect(() => {
    if (!meshRef.current) return;

    positions.forEach((pos, i) => {
      tempObject.position.set(
        pos.x + position[0],
        pos.y + position[1],
        pos.z + position[2]
      );
      tempObject.rotation.set(0, 0, 0);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, positions, position, tempObject]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    positions.forEach((pos, i) => {
      // Update stored rotations
      rotations[i].x += delta;
      rotations[i].y += delta / 2;

      // Apply position and updated rotation
      tempObject.position.set(
        pos.x + position[0],
        pos.y + position[1],
        pos.z + position[2]
      );
      tempObject.rotation.set(rotations[i].x, rotations[i].y, 0);

      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[size, size, size]} />
      <meshBasicMaterial color={color} />
    </instancedMesh>
  );
};

export default Ingredients;
