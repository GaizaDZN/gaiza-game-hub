import React, { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { commonValues } from "../threejs/common";

enum tunnelPatterns {
  Default = 0,
  CurveLeft = 1,
  CurveRight = 2,
  CurveDown = 3,
  CurveUp = 4,
  Spiral = 5,
  Loop = 6,
}

const Tunnel = () => {
  const { camera } = useThree();
  const linesRef = useRef<THREE.Group>(null);
  const tunnelCount = 20;
  const width = 8;
  const height = 5;
  const tunnelSpeed = 0.07;
  const spacing = 6; // Spacing between tunnel segments
  const fadeSpeed = 0.5; // Adjust fade-in speed
  const initialOpacity = useRef(1); // Store initial opacity

  const resetTunnelChild = (
    linesRef: React.RefObject<THREE.Group<THREE.Object3DEventMap>>,
    child: THREE.Object3D<THREE.Object3DEventMap>,
    i: number,
    material: THREE.LineBasicMaterial
  ) => {
    if (linesRef.current) {
      child.position.z =
        linesRef.current.children[i].position.z - tunnelCount * spacing;
      material.opacity = 0; // Start completely transparent
    }
  };

  // Calculate opacity based on distance from camera
  const calculateOpacityByDistance = (child: THREE.Object3D) => {
    // Calculate distance from camera to this specific child object
    const distanceFromCamera = child.position.distanceTo(camera.position);

    // Map distance to opacity: closer = more opaque, farther = more transparent
    // You can adjust these values to get the effect you want
    const maxDistance = commonValues.camera.far / 6;
    const minDistance = 0;

    // Linear mapping from distance to opacity (inverse relationship)
    const opacityFactor =
      1 -
      Math.min(
        1,
        Math.max(
          0,
          (distanceFromCamera - minDistance) / (maxDistance - minDistance)
        )
      );

    // Scale the opacity factor to your desired range (e.g., 0.1 to 1.0)
    return 0.1 + opacityFactor * 0.9;
  };

  // Create multiple LineSegments for the tunnel
  useEffect(() => {
    if (!linesRef.current) return;

    // set initial tunnel depth
    // Each tunnel section gets its own position
    for (let i = 0; i < tunnelCount; i++) {
      const child = linesRef.current.children[i];
      child.position.z = i * spacing;

      const material = (child as THREE.LineSegments)
        .material as THREE.LineBasicMaterial;
      initialOpacity.current = material.opacity; // Store initial opacity
    }
  }, []);

  useFrame(() => {
    if (!linesRef.current) return;

    for (let i = 0; i < tunnelCount; i++) {
      const child = linesRef.current.children[i];
      const material = (child as THREE.LineSegments)
        .material as THREE.LineBasicMaterial;

      child.position.z += tunnelSpeed;

      // Reset position and set opacity to 0 when it gets too close to the camera
      if (child.position.z > commonValues.camera.zPosition) {
        resetTunnelChild(linesRef, child, i, material);
      }

      // Calculate target opacity based on distance
      const targetOpacity = calculateOpacityByDistance(child);

      // For new segments that are fading in
      if (material.opacity < targetOpacity) {
        // Gradually increase opacity, but don't exceed the distance-based target
        material.opacity = Math.min(
          material.opacity + fadeSpeed,
          targetOpacity
        );
      } else {
        // For existing segments, just set to the target opacity
        material.opacity = targetOpacity;
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
