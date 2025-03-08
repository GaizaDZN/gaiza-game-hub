import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { commonValues } from "../threejs/common";

const Tunnel = () => {
  const linesRef = useRef<THREE.Group>(null);
  const tunnelCount = 20;
  const width = 8;
  const height = 5;
  const tunnelSpeed = 0.01;
  const spacing = 1.5; // Spacing between tunnel segments
  const fadeSpeed = 0.005; // Adjust fade-in speed
  const initialOpacity = useRef(1); // Store initial opacity

  // Create multiple LineSegments for the tunnel
  useEffect(() => {
    if (!linesRef.current) return;

    // set initial tunnel depth
    // Each tunnel section gets its own position
    for (let i = 0; i < tunnelCount; i++) {
      const child = linesRef.current.children[i];

      child.position.z = i * spacing; // -spacing

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

      // Reset position and set opacity to 0
      if (child.position.z > 5) {
        child.position.z =
          linesRef.current.children[i].position.z - tunnelCount * spacing; // spacing
        material.opacity = 0;
      }

      // Gradually increase opacity for segments that are fading in
      if (material.opacity < initialOpacity.current) {
        material.opacity = Math.min(
          material.opacity + fadeSpeed,
          initialOpacity.current
        );
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
