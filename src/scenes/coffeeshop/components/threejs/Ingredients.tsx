import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ResourceState } from "../../game/game";
import React from "react";
import { animated, useSpring } from "@react-spring/three";
import { coffeeConstants } from "../../game/common";

interface IngredientProps {
  iName: keyof ResourceState;
  count: number;
  position?: [number, number, number]; // Optional position prop with default
}

const Ingredients: React.FC<IngredientProps> = ({
  iName,
  count,
  position = [0, 0, 0],
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const axisHelperRef = useRef<THREE.AxesHelper>(null);
  const color = ingredientColor(iName);
  const [visible, setVisible] = useState(false);
  const [prevCount, setPrevCount] = useState(count);

  const size = 0.7;
  const radius = 0.3;

  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const rotations = useMemo(
    () =>
      Array(count)
        .fill(0)
        .map(() => ({ x: 0, y: 0 })),
    [count]
  );

  // Calculate final positions for the instances
  const getFinalPositions = (count: number) => {
    const positions = [];
    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI) / count;
      positions.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: 0,
      });
    }
    return positions;
  };

  // Spring animation for the blooming effect
  const { progress } = useSpring({
    progress: visible ? 1 : 0,
    from: { progress: 0 },
    config: { tension: 180, friction: 12 },
    reset: !visible,
    immediate: !visible,
  });

  const finalPositions = useMemo(() => getFinalPositions(count), [count]);

  useEffect(() => {
    if (!meshRef.current) return;

    if (prevCount !== count) {
      setVisible(false);
      setPrevCount(count);

      // Start blooming animation after a short delay
      setTimeout(() => {
        setVisible(true);
      }, 100);
    } else {
      setVisible(true);
    }
  }, [count, prevCount]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Set the center position of the instanced mesh
    meshRef.current.position.set(...position);
    // Rotate the entire group
    // meshRef.current.rotation.z += delta * count;

    const currentProgress = progress.get();

    finalPositions.forEach((finalPos, i) => {
      const currentX = finalPos.x * currentProgress;
      const currentY = finalPos.y * currentProgress;
      const currentZ = finalPos.z * currentProgress;

      tempObject.position.set(currentX, currentY, currentZ);

      // For single instance, apply rotation to the instance itself
      if (count === 1) {
        tempObject.rotation.z += delta;
      } else {
        tempObject.rotation.set(rotations[i].x, rotations[i].y, 0);
      }

      const scale = 0.3 + currentProgress * 0.7;
      tempObject.scale.set(scale, scale, scale);

      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });

    // Only rotate the entire mesh when there are multiple instances
    if (count > 1) {
      meshRef.current.rotation.z += delta * Math.sqrt(count);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const { scale, x, y, z } = useSpring({
    scale: visible ? 1 : 0,
    x: visible ? position[0] : position[0] - 5,
    y: visible ? position[1] : position[1] - 5,
    z: visible ? position[1] : position[1] - 2,
    config: { tension: 250, friction: 20 },
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
      color = coffeeConstants.colors.ingredients.beans;
      break;
    case "water":
      color = coffeeConstants.colors.ingredients.water;
      break;
    case "milk":
      color = coffeeConstants.colors.ingredients.milk;
      break;
    case "sugar":
      color = coffeeConstants.colors.ingredients.sugar;
      break;
    default:
      color = coffeeConstants.colors.unknown;
      break;
  }
  return color;
};
