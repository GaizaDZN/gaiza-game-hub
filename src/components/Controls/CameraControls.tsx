import { useFrame, useThree } from "@react-three/fiber";
import GUI from "lil-gui";
import { useEffect } from "react";

interface GUIProps {
  gui: GUI;
}

const CameraControl: React.FC<GUIProps> = ({ gui }) => {
  const { camera } = useThree();

  useFrame(() => {
    // ... your animation logic here
  });

  useEffect(() => {
    const cameraFolder = gui.addFolder("Camera");
    const positionFolder = cameraFolder.addFolder("Position");
    const rotationFolder = cameraFolder.addFolder("Rotation");

    positionFolder.add(camera.position, "x").min(-10).max(10).step(0.1);
    positionFolder.add(camera.position, "y").min(-10).max(10).step(0.1);
    positionFolder.add(camera.position, "z").min(-10).max(10).step(0.1);

    rotationFolder.add(camera.rotation, "x", -Math.PI, Math.PI);
    rotationFolder.add(camera.rotation, "y", -Math.PI, Math.PI);
    rotationFolder.add(camera.rotation, "z", -Math.PI, Math.PI);

    positionFolder.close();
    rotationFolder.close();

    return () => {
      gui.destroy();
    };
  }, [camera, gui]);

  return null;
};

export default CameraControl;
