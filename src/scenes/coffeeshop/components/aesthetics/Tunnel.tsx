import React, {
  useRef,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { commonValues } from "../threejs/common";

type TunnelSegment = THREE.Object3D & {
  localDirection: number;
  targetPosition: {
    x: number;
    y: number;
    rotX: number;
    rotY: number;
    rotZ: number;
  };
};

// Define path types
type PathType = "straight" | "sinusoidal" | "spiral" | "zigzag" | "eightShape";

const Tunnel = () => {
  const { camera } = useThree();
  const linesRef = useRef<THREE.Group>(null);
  const tunnelCount = 40;
  const width = 8;
  const height = 5;
  const spacing = tunnelCount / 6;
  const tunnelSpeed = spacing / 80;
  const fadeSpeed = spacing / 1000;
  const initialOpacity = useRef(1);
  const globalDirection = useRef(1); // flips every tunnel cycle

  // make this state-driven to change paths dynamically
  const [pathType, setPathType] = useState<PathType>("zigzag");

  // Path calculation functions - memoized for performance
  const pathFunctions = useMemo(() => {
    return {
      // Simple straight path
      straight: () => ({ x: 0, y: 0, rotX: 0, rotY: 0, rotZ: 0 }),

      // Sinusoidal curve (left/right)
      sinusoidal: (z: number) => {
        const amplitude = 10;
        const frequency = 0.02;
        const x = amplitude * Math.sin(z * frequency);
        // Calculate rotation to face along the path tangent
        const rotY = Math.atan(amplitude * frequency * Math.cos(z * frequency));

        return {
          x,
          y: 0,
          rotX: 0,
          rotY,
          rotZ: 0,
        };
      },

      // Spiral path
      spiral: (z: number) => {
        const angle = z * 0.05;
        return {
          x: 0,
          y: 0,
          rotX: 0,
          rotY: 0,
          rotZ: angle,
        };
      },

      // Zigzag path
      zigzag: (z: number, direction: number) => {
        const sectionLength = tunnelCount;
        const amplitude = 8;

        // Smooth zigzag motion
        const wave = Math.sin((Math.PI * z) / sectionLength);

        // Calculate the wave's slope for a smoother rotation effect
        const waveSlope =
          Math.cos((Math.PI * z) / sectionLength) * (Math.PI / sectionLength);

        const x = direction * amplitude * wave;
        const rotY = direction * 1.2 * waveSlope; // Smoother and reactive

        return {
          x,
          y: 0,
          rotX: 0,
          rotY,
          rotZ: 0,
        };
      },

      // Figure-eight shape
      eightShape: (z: number) => {
        const scale = 6;
        const frequency = 0.01;
        const t = z * frequency;

        // Parametric figure-eight
        const x = scale * Math.sin(t * 2);
        const y = scale * Math.sin(t) * Math.cos(t);

        // Calculate rotation to face along the path
        const dx = 2 * scale * Math.cos(t * 2) * frequency;
        const dy =
          scale *
          (Math.cos(t) * Math.cos(t) - Math.sin(t) * Math.sin(t)) *
          frequency;
        const rotY = Math.atan2(-dx, 1); // x-axis rotation based on path tangent
        const rotX = Math.atan2(dy, 1); // y-axis rotation based on path tangent

        return {
          x,
          y,
          rotX,
          rotY,
          rotZ: 0,
        };
      },
    };
  }, []);

  // Get the path position/rotation for a specific z-coordinate
  const getPathPosition = useCallback(
    (z: number, direction?: number) => {
      // Get the appropriate path function
      const pathFunc = pathFunctions[pathType];
      // Calculate position and rotation along the path
      return pathFunc(z, direction ?? globalDirection.current);
    },
    [pathFunctions, pathType]
  );

  // Memoize the calculations for opacity based on distance
  const calculateOpacityByDistance = useMemo(() => {
    return (child: THREE.Object3D) => {
      const distanceFromCamera = child.position.distanceTo(camera.position);
      const maxDistance = (commonValues.camera.far / spacing) * 2;
      const minDistance = 0;

      const opacityFactor =
        1 -
        Math.min(
          1,
          Math.max(
            0,
            (distanceFromCamera - minDistance) / (maxDistance - minDistance)
          )
        );

      return 0.1 + opacityFactor * 0.9;
    };
  }, [camera.position, spacing]);

  const resetTunnelChild = (
    linesRef: React.RefObject<THREE.Group>,
    child: TunnelSegment,
    i: number,
    material: THREE.LineBasicMaterial
  ) => {
    if (linesRef.current) {
      const furthestZ = Math.min(
        ...linesRef.current.children.map((c) => c.position.z)
      );

      const newZ = furthestZ - spacing;

      // Flip only for newly reset segments
      if (i === tunnelCount - 1) {
        globalDirection.current *= -1;
      }

      // Store the direction per segment to prevent instant flipping
      child.localDirection = globalDirection.current;

      // Get new position using the segment’s own direction
      const targetPos = getPathPosition(newZ, child.localDirection);
      child.targetPosition = targetPos;
      child.position.z = newZ;

      material.opacity = 0;
    }
  };

  // Initialize tunnel segments
  useEffect(() => {
    if (!linesRef.current) return;

    for (let i = 0; i < tunnelCount; i++) {
      const child = linesRef.current.children[i];
      // Position segments along the z-axis with spacing
      const z = -i * spacing;
      child.position.z = z;

      // Apply path position and rotation based on current path type
      const pathPosition = getPathPosition(z);
      child.position.x = pathPosition.x;
      child.position.y = pathPosition.y;
      child.rotation.x = pathPosition.rotX;
      child.rotation.y = pathPosition.rotY;
      child.rotation.z = pathPosition.rotZ;

      const material = (child as THREE.LineSegments)
        .material as THREE.LineBasicMaterial;
      initialOpacity.current = material.opacity;
    }
  }, [pathType, getPathPosition, spacing]);

  // Change the path type - example function that could be called from outside
  const changePath = (newPathType: PathType) => {
    setPathType(newPathType);
  };

  useFrame(() => {
    if (!linesRef.current) return;

    for (let i = 0; i < tunnelCount; i++) {
      const child = linesRef.current.children[i] as TunnelSegment;
      const material = (child as THREE.LineSegments)
        .material as THREE.LineBasicMaterial;

      // Move segment forward
      child.position.z += tunnelSpeed;

      // Standard path updates for non-lerping segments
      const { x, y, rotX, rotY, rotZ } = getPathPosition(child.position.z);
      child.position.x = x;
      child.position.y = y;
      child.rotation.x = rotX;
      child.rotation.y = rotY;
      child.rotation.z = rotZ;

      // Reset when too close to the camera
      if (child.position.z > commonValues.camera.zPosition) {
        resetTunnelChild(linesRef, child, i, material);
      }

      // Smooth fade-in/out effect
      const targetOpacity = calculateOpacityByDistance(child);
      material.opacity = THREE.MathUtils.lerp(
        material.opacity,
        targetOpacity,
        fadeSpeed
      );
    }
  });

  return (
    <group ref={linesRef}>
      {Array(tunnelCount)
        .fill(null)
        .map((_, i) => (
          <lineSegments key={i}>
            <edgesGeometry args={[new THREE.PlaneGeometry(width, height)]} />
            <lineBasicMaterial color="#f7a50c" transparent={true} opacity={1} />
          </lineSegments>
        ))}
    </group>
  );
};

export default Tunnel;
