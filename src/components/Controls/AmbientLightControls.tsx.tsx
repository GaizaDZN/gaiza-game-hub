import { useEffect, useRef } from "react";
import { AmbientLight } from "three";
import GUI from "lil-gui";
import { GetNestedFolder } from "../../pages/common";

interface LightControlsProps {
  initialIntensity?: number;
  color?: string;
  gui: GUI;
}

const AmbientLightControls: React.FC<LightControlsProps> = ({
  initialIntensity = 1,
  color = "#fff",
  gui,
}) => {
  const lightRef = useRef<AmbientLight>(null);

  useEffect(() => {
    if (!lightRef.current) return;

    const light = lightRef.current;

    // Get nested folder path
    const lightsFolder = GetNestedFolder(gui, ["Lights", "Ambient Lights"]);

    // Create unique name for this light instance
    const lightName = `Ambient Light ${lightsFolder.folders.length + 1}`;
    const lightFolder = lightsFolder.addFolder(lightName);

    // Settings object
    const settings = {
      intensity: initialIntensity,
      color: color,
      visible: true,
    };

    // Add controls
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

    lightFolder.close();

    return () => {
      lightFolder.destroy();
    };
  }, [initialIntensity, color, gui]);

  return (
    <ambientLight ref={lightRef} intensity={initialIntensity} color={color} />
  );
};

export default AmbientLightControls;
