import React, { useRef, useEffect, useMemo, useCallback } from "react";
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
  pathType: PathType;
};

// Define path types
type PathType = "straight" | "sinusoidal" | "spiral" | "zigzag" | "eightShape";

const Tunnel = () => {
  const { camera } = useThree();
  const linesRef = useRef<THREE.Group>(null);
  const tunnelCount = 50;
  const width = 8;
  const height = 5;
  const baseSpacing = tunnelCount / 6; // Base spacing value
  const tunnelSpeed = baseSpacing / 80;
  const fadeSpeed = baseSpacing / 1000;
  const initialOpacity = useRef(1);
  const globalDirection = useRef(1);

  // make this state-driven to change paths dynamically

  const allPathTypes: PathType[] = useMemo(
    () => ["straight", "sinusoidal", "spiral", "zigzag", "eightShape"],
    []
  );

  const getRandomPathType = useCallback(
    (currentPathType: PathType): PathType => {
      const availablePathTypes = allPathTypes.filter(
        (type) => type !== currentPathType
      );
      const randomIndex = Math.floor(Math.random() * availablePathTypes.length);
      return availablePathTypes[randomIndex];
    },
    [allPathTypes]
  );

  const currentPath = useRef<PathType>("straight");
  const nextPath = useRef<PathType>(getRandomPathType(currentPath.current));

  // Path calculation functions - memoized for performance
  const pathFunctions = useMemo(() => {
    return {
      // Simple straight path
      straight: () => ({
        x: 0,
        y: 0,
        rotX: 0,
        rotY: 0,
        rotZ: 0,
        curveFactor: 0, // No curve
      }),

      // Sinusoidal curve (left/right)
      sinusoidal: (z: number) => {
        const amplitude = 10;
        const frequency = 0.02;
        const x = amplitude * Math.sin(z * frequency);
        // Calculate rotation to face along the path tangent
        const rotY = Math.atan(amplitude * frequency * Math.cos(z * frequency));

        // Calculate curve factor based on derivative of sine function
        const curveFactor = Math.abs(Math.cos(z * frequency)) * 0.5;

        return {
          x,
          y: 0,
          rotX: 0,
          rotY,
          rotZ: 0,
          curveFactor,
        };
      },

      // Spiral path
      spiral: (z: number) => {
        const angle = z * 0.05;
        // Spiral always has a curve
        const curveFactor = 0.6;

        return {
          x: 0,
          y: 0,
          rotX: 0,
          rotY: 0,
          rotZ: angle,
          curveFactor,
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

        // Calculate curve factor based on rate of change in the waveform
        const curveFactor = Math.abs(waveSlope) * 20;

        return {
          x,
          y: 0,
          rotX: 0,
          rotY,
          rotZ: 0,
          curveFactor,
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

        // Calculate curve factor based on combined rate of change in x and y
        const curveFactor = Math.min(0.8, Math.sqrt(dx * dx + dy * dy) * 0.5);

        return {
          x,
          y,
          rotX,
          rotY,
          rotZ: 0,
          curveFactor,
        };
      },
    };
  }, [tunnelCount]);

  // Function to get dynamic spacing based on curve factor
  const getDynamicSpacing = useCallback(
    (curveFactor: number) => {
      // Reduce spacing based on curve factor (higher curve = lower spacing)
      // Clamp to reasonable values to prevent segments from overlapping or separating too much
      return THREE.MathUtils.clamp(
        baseSpacing * (1 - curveFactor),
        baseSpacing * 0.4, // Min spacing (at sharpest curve)
        baseSpacing // Max spacing (straight path)
      );
    },
    [baseSpacing]
  );

  const getPathPosition = useCallback(
    (z: number, direction?: number, segmentPath?: PathType) => {
      const pathToUse = segmentPath || currentPath.current;

      if (!pathFunctions[pathToUse]) {
        console.error(`Invalid path type: ${pathToUse}`);
        return pathFunctions.straight();
      }

      const pathFunc = pathFunctions[pathToUse];

      if (pathToUse === "straight") {
        return pathFunctions.straight();
      } else if (pathToUse === "zigzag") {
        return pathFunc(z, direction ?? globalDirection.current);
      } else {
        return pathFunc(z, globalDirection.current);
      }
    },
    [pathFunctions]
  );

  // Memoize the calculations for opacity based on distance
  const calculateOpacityByDistance = useMemo(() => {
    return (child: THREE.Object3D) => {
      const distanceFromCamera = child.position.distanceTo(camera.position);
      const maxDistance = (commonValues.camera.far / baseSpacing) * 2;
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

      return 0.08 + opacityFactor * 0.9;
    };
  }, [camera.position, baseSpacing]);

  const resetTunnelChild = useCallback(
    (
      linesRef: React.RefObject<THREE.Group>,
      child: TunnelSegment,
      i: number,
      material: THREE.LineBasicMaterial
    ) => {
      if (linesRef.current) {
        const furthestZ = Math.min(
          ...linesRef.current.children.map((c) => c.position.z)
        );
        const furthestSegInfo = getPathPosition(furthestZ);

        const dynamicSpacing = getDynamicSpacing(furthestSegInfo.curveFactor);
        const newZ = furthestZ - dynamicSpacing;

        child.localDirection = child.localDirection
          ? -child.localDirection
          : -1;

        // Assign nextPath only to newly spawned segments
        child.pathType = nextPath.current;
        const targetPos = getPathPosition(
          newZ,
          child.localDirection,
          child.pathType
        );
        child.targetPosition = targetPos;
        child.position.z = newZ;

        material.opacity = 0;

        // Once the last segment is reset, update currentPath
        if (i === tunnelCount - 1) {
          currentPath.current = nextPath.current;
          nextPath.current = getRandomPathType(currentPath.current);
        }
      }
    },
    [getDynamicSpacing, getPathPosition, getRandomPathType]
  );

  // Initialize tunnel segments
  useEffect(() => {
    if (!linesRef.current) return;
    // First, position all segments with dynamic spacing
    let currentZ = 0;

    for (let i = 0; i < tunnelCount; i++) {
      const child = linesRef.current.children[i] as TunnelSegment;

      // Initialize each segment with its own localDirection
      if (child.localDirection === undefined) {
        child.localDirection = globalDirection.current;
      }

      // Apply position based on dynamic spacing
      if (i > 0) {
        // Get info for previous position to calculate spacing
        const prevPathInfo = getPathPosition(currentZ, child.localDirection);
        const dynamicSpacing = getDynamicSpacing(prevPathInfo.curveFactor);
        currentZ -= dynamicSpacing;
      }

      child.position.z = currentZ;

      // Apply path position and rotation
      const pathPosition = getPathPosition(currentZ, child.localDirection);
      child.position.x = pathPosition.x;
      child.position.y = pathPosition.y;
      child.rotation.x = pathPosition.rotX;
      child.rotation.y = pathPosition.rotY;
      child.rotation.z = pathPosition.rotZ;

      const material = (child as unknown as THREE.LineSegments)
        .material as THREE.LineBasicMaterial;
      initialOpacity.current = material.opacity;
    }
  }, [getDynamicSpacing, getPathPosition]);

  useFrame(() => {
    if (!linesRef.current) return;

    for (let i = 0; i < tunnelCount; i++) {
      const child = linesRef.current.children[i] as TunnelSegment;
      const material = (child as unknown as THREE.LineSegments)
        .material as THREE.LineBasicMaterial;

      // Move segment forward
      child.position.z += tunnelSpeed;

      try {
        // Use the segment’s own `pathType` for smooth transition
        const pathInfo = getPathPosition(
          child.position.z,
          child.localDirection,
          child.pathType
        );

        // Apply position and rotation
        child.position.x = pathInfo.x;
        child.position.y = pathInfo.y;
        child.rotation.x = pathInfo.rotX;
        child.rotation.y = pathInfo.rotY;
        child.rotation.z = pathInfo.rotZ;

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
      } catch (error) {
        console.error("Error in path calculation:", error);
      }
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
