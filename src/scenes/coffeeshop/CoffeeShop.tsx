import { useThree } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import { GuiControls, SceneProps } from "../common";
import gsap from "gsap";
import * as THREE from "three";
import React from "react";

interface ColorPalette {
  [key: string]: string;
}
const colorPalette: ColorPalette = {
  background: "#50352d",
  counter: "#8a5a3c",
  barista: "#4f9a68",
  customer: "#d9c148",
};

const CoffeeShop: React.FC<SceneProps> = ({
  gui,
  configScene,
  currentView,
}) => {
  const { camera, scene } = useThree();
  const controlsRef = useRef<GuiControls>({});
  const perspCamera = camera as THREE.PerspectiveCamera;
  const baristaRef = useRef<THREE.Mesh>(null);
  const isAnimating = useRef(false);

  useEffect(() => {
    scene.background = null;
    const viewConfig =
      configScene.views.find((view) => view.id === currentView) ||
      configScene.views[0];

    if (viewConfig) {
      const { position, rotation, fov } = viewConfig.camera;

      // Animate camera position
      gsap.to(camera.position, {
        x: position[0],
        y: position[1],
        z: position[2],
        duration: 1,
        ease: "power2.inOut",
        onUpdate: () => {
          controlsRef.current.posX?.updateDisplay();
          controlsRef.current.posY?.updateDisplay();
          controlsRef.current.posZ?.updateDisplay();
        },
      });

      // Animate camera rotation
      gsap.to(camera.rotation, {
        x: rotation[0],
        y: rotation[1],
        z: rotation[2],
        duration: 1,
        ease: "power2.inOut",
        onUpdate: () => {
          controlsRef.current.rotX?.updateDisplay();
          controlsRef.current.rotY?.updateDisplay();
          controlsRef.current.rotZ?.updateDisplay();
        },
      });

      if (fov && perspCamera.fov) {
        gsap.to(perspCamera, {
          fov,
          duration: 1,
          ease: "power2.inOut",
          onUpdate: () => {
            perspCamera.updateProjectionMatrix();
            controlsRef.current.fov?.updateDisplay();
          },
        });
      }

      // Destroy existing camera folder if it exists
      if (controlsRef.current.cameraFolder) {
        controlsRef.current.cameraFolder.destroy();
      }

      // Create new camera folder and controls
      const cameraFolder = gui.addFolder("Camera");
      const positionFolder = cameraFolder.addFolder("Position");
      const rotationFolder = cameraFolder.addFolder("Rotation");

      // Store reference to the camera folder
      controlsRef.current.cameraFolder = cameraFolder;

      // Add position controls
      controlsRef.current.posX = positionFolder
        .add(camera.position, "x")
        .min(-10)
        .max(10)
        .step(0.01)
        .name("X");

      controlsRef.current.posY = positionFolder
        .add(camera.position, "y")
        .min(-10)
        .max(10)
        .step(0.01)
        .name("Y");

      controlsRef.current.posZ = positionFolder
        .add(camera.position, "z")
        .min(-10)
        .max(10)
        .step(0.01)
        .name("Z");

      // Add rotation controls
      controlsRef.current.rotX = rotationFolder
        .add(camera.rotation, "x")
        .min(-Math.PI)
        .max(Math.PI)
        .step(0.01)
        .name("X");

      controlsRef.current.rotY = rotationFolder
        .add(camera.rotation, "y")
        .min(-Math.PI)
        .max(Math.PI)
        .step(0.01)
        .name("Y");

      controlsRef.current.rotZ = rotationFolder
        .add(camera.rotation, "z")
        .min(-Math.PI)
        .max(Math.PI)
        .step(0.01)
        .name("Z");

      // Add FOV control if it's a PerspectiveCamera
      if (perspCamera.fov) {
        controlsRef.current.fov = cameraFolder
          .add(perspCamera, "fov")
          .min(10)
          .max(120)
          .step(1)
          .name("FOV")
          .onChange(() => {
            perspCamera.updateProjectionMatrix();
          });
      }

      gui.close();
    }

    // Animate Barista/Player
    if (baristaRef.current) {
      isAnimating.current = true;
    }

    // Cleanup function
    return () => {
      if (controlsRef.current.cameraFolder) {
        controlsRef.current.cameraFolder.destroy();
      }
      controlsRef.current = {};
    };
  }, [camera, currentView, gui, perspCamera, configScene.views, scene]);

  return (
    <>
      <mesh>
        <meshBasicMaterial color={"orange"} />
      </mesh>
    </>
  );
};

export default CoffeeShop;
