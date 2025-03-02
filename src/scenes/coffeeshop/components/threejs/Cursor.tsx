import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { Mesh } from "three";
import * as THREE from "three";

interface cursorProps {
  mouseHeld: boolean;
  isMouseOnCanvas: boolean;
}
// follows the mouse position
const Cursor: React.FC<cursorProps> = ({ mouseHeld, isMouseOnCanvas }) => {
  const meshRef = useRef<Mesh>(null);
  const targetPosition = useRef(new THREE.Vector3());

  // const axisHelperRef = useRef<THREE.AxesHelper>(null);
  const { viewport, pointer } = useThree();

  const lerpFactor = 0.05;

  useFrame(() => {
    if (
      meshRef.current &&
      (isMouseOnCanvas ||
        !meshRef.current.position.equals(targetPosition.current))
    ) {
      const normalizedX = pointer.x;
      const normalizedY = pointer.y;

      // Convert normalized coordinates to world space
      let worldX = (normalizedX * viewport.width) / 2;
      let worldY = (normalizedY * viewport.height) / 2;

      // Calculate 90% of the canvas bounds
      const maxX = (viewport.width / 2) * 0.9;
      const maxY = (viewport.height / 2) * 0.9;

      // Always clamp to ensure the cursor stays within bounds
      worldX = Math.max(-maxX, Math.min(worldX, maxX));
      worldY = Math.max(-maxY, Math.min(worldY, maxY));

      // Update the target position
      targetPosition.current.set(worldX, worldY, 0);

      // Lerp the current position toward the target
      meshRef.current.position.lerp(targetPosition.current, lerpFactor);

      // Ensure cursor always looks toward the center
      meshRef.current.lookAt(0, 0, 0);
      meshRef.current.rotateX(Math.PI / 2);
    }
  });

  return (
    <mesh ref={meshRef}>
      <meshBasicMaterial color="#e2a115" />
      <coneGeometry args={[0.2, 0.5, 6]} />
    </mesh>
  );
};

export default Cursor;
