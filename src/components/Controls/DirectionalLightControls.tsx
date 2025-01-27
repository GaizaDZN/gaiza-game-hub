import { useEffect, useRef } from "react";
import { DirectionalLight } from "three";
import GUI from "lil-gui";
import { GetNestedFolder } from "../../pages/common";

interface LightControlsProps {
  initialIntensity?: number;
  color?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  gui: GUI;
}

const DirectionalLightControls: React.FC<LightControlsProps> = ({
  initialIntensity = 1,
  color = "#fff",
  position = [0, 5, 5],
  rotation = [0, 0, 0],
  gui,
}) => {
  const lightRef = useRef<DirectionalLight>(null);

  useEffect(() => {
    if (!lightRef.current) return;

    const light = lightRef.current;

    // Set initial position and rotation
    light.position.set(...position);
    light.rotation.set(...rotation);

    // Get nested folder path
    const lightsFolder = GetNestedFolder(gui, ["Lights", "Directional Lights"]);

    // Create unique name for this light instance
    const lightName = `Directional Light ${lightsFolder.folders.length + 1}`;
    const lightFolder = lightsFolder.addFolder(lightName);

    // Settings object for main controls
    const settings = {
      intensity: initialIntensity,
      color: color,
      visible: true,
    };

    // Position settings
    const positionSettings = {
      x: position[0],
      y: position[1],
      z: position[2],
    };

    // Rotation settings (in degrees for better UX)
    const rotationSettings = {
      x: rotation[0] * (180 / Math.PI),
      y: rotation[1] * (180 / Math.PI),
      z: rotation[2] * (180 / Math.PI),
    };

    // Add main controls
    lightFolder
      .add(settings, "intensity", 0, 2, 0.1)
      .onChange((value: number) => {
        light.intensity = value;
      });

    lightFolder.addColor(settings, "color").onChange((value: string) => {
      light.color.setStyle(value);
    });

    lightFolder.add(settings, "visible").onChange((value: boolean) => {
      light.visible = value;
    });

    // Add position folder and controls
    const positionFolder = lightFolder.addFolder("Position");
    positionFolder
      .add(positionSettings, "x", -10, 10, 0.1)
      .onChange((value: number) => {
        light.position.x = value;
      });
    positionFolder
      .add(positionSettings, "y", -10, 10, 0.1)
      .onChange((value: number) => {
        light.position.y = value;
      });
    positionFolder
      .add(positionSettings, "z", -10, 10, 0.1)
      .onChange((value: number) => {
        light.position.z = value;
      });

    // Add rotation folder and controls (in degrees)
    const rotationFolder = lightFolder.addFolder("Rotation");
    rotationFolder
      .add(rotationSettings, "x", -180, 180, 1)
      .onChange((value: number) => {
        light.rotation.x = value * (Math.PI / 180);
      });
    rotationFolder
      .add(rotationSettings, "y", -180, 180, 1)
      .onChange((value: number) => {
        light.rotation.y = value * (Math.PI / 180);
      });
    rotationFolder
      .add(rotationSettings, "z", -180, 180, 1)
      .onChange((value: number) => {
        light.rotation.z = value * (Math.PI / 180);
      });

    // Close all folders
    lightFolder.close();
    positionFolder.close();
    rotationFolder.close();

    return () => {
      lightFolder.destroy();
    };
  }, [initialIntensity, color, position, rotation, gui]);

  return (
    <directionalLight
      ref={lightRef}
      intensity={initialIntensity}
      color={color}
      position={position}
      rotation={rotation}
    />
  );
};

export default DirectionalLightControls;
