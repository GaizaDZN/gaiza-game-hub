import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ResourceState } from "../../game/game";
import React from "react";
import { animated, useSpring } from "@react-spring/three";

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
  const axisHelperRef = useRef<THREE.AxesHelper>(null); // Ref for the AxesHelper
  const color = ingredientColor(iName);
  const [visible, setVisible] = useState(false);

  // Configuration
  const size = 0.7; // Size of cube
  const radius = 0.3; // Radius of the circle/polygon

  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const rotations = useMemo(
    () =>
      Array(count)
        .fill(0)
        .map(() => ({ x: 0, y: 0 })),
    [count]
  );

  // Calculate positions based on count
  const getPositions = (
    count: number,
    axis: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
  ) => {
    // Default axis
    const positions = [];
    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI) / count; // No need to subtract Math.PI / 2 unless you have a specific starting point in mind.
      const pointOnCircle = new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0
      );

      // Rotate around the specified axis:
      pointOnCircle.applyAxisAngle(axis, 0); // Start with no rotation.  Rotations will be applied in useFrame.

      positions.push({
        x: pointOnCircle.x,
        y: pointOnCircle.y,
        z: pointOnCircle.z,
      });
    }
    return positions;
  };

  const [rotationAxis, setRotationAxis] = useState(new THREE.Vector3(0, 0, 0)); // State for the rotation axis

  const positions = useMemo(
    () => getPositions(count, rotationAxis),
    [count, rotationAxis]
  );

  useEffect(() => {
    if (!meshRef.current) return;

    setVisible(true);

    positions.forEach((pos, i) => {
      tempObject.position.set(
        pos.x + position[0],
        pos.y + position[1],
        pos.z + position[2]
      );
      tempObject.rotation.set(position[0], position[1], position[2]);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });

    // Add AxesHelper to visualize rotation axis.
    if (axisHelperRef.current) {
      meshRef.current.add(axisHelperRef.current); // Add it to the instanced mesh
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, positions, position, tempObject]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    if (count === 1) {
      // Rotate the single instance:
      tempObject.position.set(position[0], position[1], position[2]); // Local position
      tempObject.rotation.x += delta / 2;
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(0, tempObject.matrix);
      meshRef.current.instanceMatrix.needsUpdate = true;
    } else if (count > 1) {
      // 1. Set the rotation point of the instanced mesh to center:
      meshRef.current.position.set(position[0], position[1], position[2]);
      // 2. Rotate the instanced mesh:
      meshRef.current.rotation.z += delta / 2;
      // 3. IMPORTANT: Reset the position of the individual instances.
      //    This is needed because rotating the instanced mesh moves the instances.
      positions.forEach((pos, i) => {
        tempObject.position.set(pos.x, pos.y, pos.z); // Just the *local* position
        tempObject.rotation.set(rotations[i].x, rotations[i].y, 0);
        tempObject.updateMatrix();
        meshRef.current!.setMatrixAt(i, tempObject.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  const { scale, x, y, z } = useSpring({
    scale: visible ? 1 : 0,
    x: visible ? position[0] : position[0] - 2,
    y: visible ? position[1] : position[1] - 2,
    z: visible ? position[1] : position[1] - 2,
  });

  const adjustedSize = size / count;

  return (
    <animated.mesh scale={scale} position-x={x} position-y={y} position-z={z}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[adjustedSize, adjustedSize, adjustedSize]} />
        <meshBasicMaterial color={color} />
      </instancedMesh>
    </animated.mesh>
  );
};

export default Ingredients;

const ingredientColor = (iName: keyof ResourceState): string => {
  let color: string = "white";

  switch (iName) {
    case "beans":
      color = "#cc701a";
      break;
    case "water":
      color = "#4e93ec";
      break;
    case "milk":
      color = "#d6faff";
      break;
    case "sugar":
      color = "#ffde4c";
      break;
    default:
      break;
  }
  return color;
};
