import React, { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RandMeshPosition } from "../helpers/helpers";

interface AnimatedPlaneProps {
  mediaUrl: string;
  width?: number;
  height?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  velocity?: number;
}

const AnimatedPlane: React.FC<AnimatedPlaneProps> = ({
  mediaUrl,
  width = 1,
  height = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  velocity = 0.01,
}) => {
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(
    null
  );
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  const boundingBox = useRef(new THREE.Box3());

  // Function to update bounding box
  const updateBoundingBox = () => {
    if (meshRef.current) {
      boundingBox.current.setFromObject(meshRef.current);
    }
  };

  // Function to check if mesh is out of view and reset position
  const checkAndResetPosition = () => {
    if (!meshRef.current) return;

    // Update bounding box
    updateBoundingBox();

    // Convert viewport coordinates to world coordinates
    const leftEdge = -viewport.width / 2;

    // Check if the entire bounding box is beyond the left edge
    if (boundingBox.current.max.x < leftEdge) {
      // Calculate the width of the bounding box
      const boxWidth = boundingBox.current.max.x - boundingBox.current.min.x;

      // Move the mesh to the right side of the viewport
      // Add the box width to ensure the mesh is completely off-screen when it starts
      meshRef.current.position.x = viewport.width / 2 + boxWidth;
    }
  };

  useEffect(() => {
    // Create video element
    const video = document.createElement("video");
    video.src = mediaUrl;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    // Create texture once video is ready
    video.addEventListener("loadeddata", () => {
      const texture = new THREE.VideoTexture(video);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.format = THREE.RGBAFormat;
      setVideoTexture(texture);
      video.play().catch(console.error);
    });

    // Initial position
    RandMeshPosition(meshRef, viewport.width, viewport.height);

    return () => {
      video.pause();
      video.src = "";
      video.load();

      if (videoTexture) {
        videoTexture.dispose();
      }
    };
  }, [mediaUrl]);

  useFrame(() => {
    if (videoTexture) {
      videoTexture.needsUpdate = true;
    }

    if (meshRef.current) {
      // Move the mesh left
      meshRef.current.position.x -= velocity;

      // Check if we need to reset position
      checkAndResetPosition();
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={
        position.some((p) => p !== 0)
          ? new THREE.Vector3(...position)
          : undefined
      }
      rotation={new THREE.Euler(...rotation)}
    >
      <planeGeometry args={[width, height]} />
      {videoTexture && (
        <meshBasicMaterial
          map={videoTexture}
          transparent
          side={THREE.DoubleSide}
        />
      )}
    </mesh>
  );
};

export default AnimatedPlane;
