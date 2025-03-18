import React, { useRef, useEffect, useMemo, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { commonValues } from "../threejs/common";

const Tunnel = () => {
  const { camera } = useThree();
  const linesRef = useRef<THREE.Group>(null);
  const tunnelCount = 60;
  const width = 8;
  const height = 5;
  const baseSpacing = tunnelCount / 8; // Base spacing value
  const fadeSpeed = baseSpacing / 1000;
  const globalDirection = useRef(1);
  const pathUpdating = true;

  // make this state-driven to change paths dynamically

  const allPathTypes: PathType[] = useMemo(
    () => ["straight", "sinusoidal", "spiral", "zigzag"],
    []
  );

  const getRandomPathType = useCallback(
    (currentPathType: PathType): PathType => {
      const availablePathTypes = allPathTypes.filter(
        (type) => type !== currentPathType
      );
      const randomIndex = Math.floor(Math.random() * availablePathTypes.length);
      const newPathType = availablePathTypes[randomIndex];
      return newPathType;
    },
    [allPathTypes]
  );

  const currentPath = useRef<PathType>("sinusoidal");
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
        const amplitude = -60; // -60 to 60 looks good at .02 frequency
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
        const angle = z * 0.1; // Adjusted for smoother rotation
        const baseCurveFactor = tunnelCount / 4;
        const cameraPos = camera.position;

        // Calculate distance from camera and blend factor
        const distanceFromCamera = Math.abs(z - cameraPos.z);
        const maxBlendDistance = 50; // Start blending when within this distance
        const blendFactor =
          1 - Math.min(distanceFromCamera / maxBlendDistance, 1);

        // Reduce spiral radius as we approach the camera
        const adjustedCurveFactor = baseCurveFactor * (1 - 0.8 * blendFactor);

        // Base spiral position
        const spiralX = Math.cos(angle) * adjustedCurveFactor;
        const spiralY = Math.sin(angle) * adjustedCurveFactor;

        // Smoothly blend towards camera position
        const x = THREE.MathUtils.lerp(spiralX, cameraPos.x, blendFactor);
        const y = THREE.MathUtils.lerp(spiralY, cameraPos.y, blendFactor);

        return {
          x,
          y,
          rotX: 0,
          rotY: 0,
          rotZ: 0,
          curveFactor: adjustedCurveFactor,
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
    };
  }, [camera.position]);

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
      const maxDistance =
        (commonValues.camera.far / baseSpacing) *
        pathConfigs[currentPath.current].maxDistanceMultiplier;
      const minDistance = 0;
      const modifier = pathConfigs[currentPath.current].modifier;

      // adjust modifier and maxDistoance for current path

      const opacityFactor =
        1 -
        Math.min(
          1,
          Math.max(
            0,
            (distanceFromCamera - minDistance) / (maxDistance - minDistance)
          )
        );

      return modifier + opacityFactor;
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
        if (pathUpdating) {
          child.pathType = nextPath.current;
        }
        const targetPos = getPathPosition(
          newZ,
          child.localDirection,
          child.pathType
        );
        child.targetPosition = targetPos;
        child.position.z = newZ;

        material.opacity = 0;

        // update segment tunnel pattern
        if (pathUpdating) {
          if (i === tunnelCount - 1) {
            currentPath.current = nextPath.current;
            nextPath.current = getRandomPathType(currentPath.current);
          }
        }
      }
    },
    [getDynamicSpacing, getPathPosition, getRandomPathType, pathUpdating]
  );

  const updateChildPosition = useCallback(
    (child: TunnelSegment) => {
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
    },
    [getPathPosition]
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
      updateChildPosition(child);

      // Calculate and set the initial opacity based on the segment's position
      const material = (child as unknown as THREE.LineSegments)
        .material as THREE.LineBasicMaterial;
      material.opacity = calculateOpacityByDistance(child);
    }
  }, [
    calculateOpacityByDistance,
    getDynamicSpacing,
    getPathPosition,
    updateChildPosition,
  ]);

  useFrame(() => {
    if (!linesRef.current) return;

    for (let i = 0; i < tunnelCount; i++) {
      const child = linesRef.current.children[i] as TunnelSegment;
      const material = (child as unknown as THREE.LineSegments)
        .material as THREE.LineBasicMaterial;

      // Move segment forward
      child.position.z += pathConfigs[currentPath.current].tunnelSpeed;

      try {
        updateChildPosition(child);
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

const pathConfigs = {
  straight: {
    modifier: 0.02,
    maxDistanceMultiplier: 2,
    tunnelSpeed: 0.12,
    fadeSpeed: 0.025,
  },
  sinusoidal: {
    modifier: 0.05,
    maxDistanceMultiplier: 4,
    tunnelSpeed: 0.12,
    fadeSpeed: 0.025,
  },
  spiral: {
    modifier: 0.02,
    maxDistanceMultiplier: 3,
    tunnelSpeed: 0.12,
    fadeSpeed: 0.025,
  },
  zigzag: {
    modifier: 0.04,
    maxDistanceMultiplier: 3,
    tunnelSpeed: 0.12,
    fadeSpeed: 0.025,
  },
};

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
type PathType = "straight" | "sinusoidal" | "spiral" | "zigzag";
