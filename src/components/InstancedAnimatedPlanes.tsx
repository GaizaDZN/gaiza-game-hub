import React, { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RandRange } from "../helpers/helpers";

interface InstancedAnimatedPlanesProps {
  count: number;
  videoUrl: string;
  z?: number;
  width?: number;
  height?: number;
  velocity?: number;
  playSpeed?: number;
}

const InstancedAnimatedPlanes: React.FC<InstancedAnimatedPlanesProps> = ({
  count,
  videoUrl,
  width = 1,
  height = 1,
  z = 0,
  velocity = 0.01,
  playSpeed = 1,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { viewport } = useThree();
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(
    null
  );

  if (playSpeed < 0.1) {
    throw new Error("playSpeed must be 0.1 or greater");
  }

  const positions = useRef<THREE.Vector3[]>([]);
  const boundingBoxes = useRef<THREE.Box3[]>([]);
  const tempObject = useRef(new THREE.Object3D());

  useEffect(() => {
    const newPositions: THREE.Vector3[] = [];
    const newBoundingBoxes: THREE.Box3[] = [];

    // Set up video with transparency support
    const video = document.createElement("video");
    video.src = videoUrl;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.playbackRate = playSpeed;

    video.addEventListener("loadeddata", () => {
      const texture = new THREE.VideoTexture(video);
      // Configure texture for transparency
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.format = THREE.RGBAFormat;
      setVideoTexture(texture);
      video.play().catch(console.error);
    });

    // Initialize instances
    for (let i = 0; i < count; i++) {
      const x = Math.random() * viewport.width - viewport.width / 2;
      const y = Math.random() * viewport.height - viewport.height / 2;
      const randZ = RandRange(-z, z);
      const position = new THREE.Vector3(x, y, randZ);
      newPositions.push(position);

      const boundingBox = new THREE.Box3();
      boundingBox.setFromCenterAndSize(
        position,
        new THREE.Vector3(width, height, 0.01)
      );
      newBoundingBoxes.push(boundingBox);

      tempObject.current.position.copy(position);
      tempObject.current.updateMatrix();
      meshRef.current?.setMatrixAt(i, tempObject.current.matrix);
    }

    positions.current = newPositions;
    boundingBoxes.current = newBoundingBoxes;

    if (meshRef.current) {
      meshRef.current.instanceMatrix.needsUpdate = true;
    }

    return () => {
      video.pause();
      video.src = "";
      video.load();
      if (videoTexture) {
        videoTexture.dispose();
      }
    };
  }, [count, videoUrl, viewport.width, viewport.height, width, height]);

  useFrame(() => {
    if (!meshRef.current) return;

    positions.current.forEach((position, index) => {
      position.x -= velocity;

      if (position.x + width / 2 < -viewport.width / 2) {
        position.x = viewport.width / 2 + width / 2;
        let posY = RandRange(-viewport.height / 2, viewport.height / 2);
        const posZ = RandRange(-z, z);
        if (
          posY + height > viewport.height / 2 ||
          posY - height < -viewport.height / 2
        ) {
          posY = Math.max(
            -viewport.height / 2 + height,
            Math.min(viewport.height / 2 - height, posY)
          );
        }
        position.y = posY;
        position.z = posZ;

        boundingBoxes.current[index].setFromCenterAndSize(
          position,
          new THREE.Vector3(width, height, 0.01)
        );
      }

      tempObject.current.position.copy(position);
      tempObject.current.updateMatrix();
      meshRef.current?.setMatrixAt(index, tempObject.current.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;

    if (videoTexture) {
      videoTexture.needsUpdate = true;
    }
  });

  if (!videoTexture) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={videoTexture}
        transparent={true}
        side={THREE.DoubleSide}
        alphaTest={0.1}
        depthWrite={false}
        premultipliedAlpha={true} // Added this to help with alpha blending
      />
    </instancedMesh>
  );
};

export default InstancedAnimatedPlanes;
