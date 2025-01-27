import MovingStars from "./MovingStars";
import { GUI, Controller } from "lil-gui";
import Shapes from "./Shapes";
import CoffeeShop from "./coffeeshop/CoffeeShop";

export interface GuiControls {
  posX?: Controller;
  posY?: Controller;
  posZ?: Controller;
  rotX?: Controller;
  rotY?: Controller;
  rotZ?: Controller;
  fov?: Controller;
  cameraFolder?: GUI;
}

// Camera types
interface CameraConfig {
  position: [number, number, number];
  rotation: [number, number, number];
  fov?: number;
  near?: number;
  far?: number;
}

// Types for view configurations
export interface ViewConfig {
  id: string;
  sceneId: string; // So that every view can reference it's parent scene.
  name: string;
  camera: CameraConfig;
  behavior?: string; // Define specific behaviors for objects in this view
  active: boolean;
}

// Types for scene management
export interface SceneConfig {
  id: string;
  name: string;
  component: React.FC<SceneProps>;
  views: ViewConfig[];
  active: boolean;
  acceptsInput: boolean;
}

export interface SceneLayoutProps {
  currentScene: SceneConfig;
  currentView: string;
  gui: GUI;
}

export interface SceneProps {
  gui: GUI;
  configScene: SceneConfig;
  currentView?: string;
}

export const SceneIds = {
  starsId: "stars",
  shapesId: "shapes",
  coffeeShopId: "coffeeShop",
};

const starsId = "stars";
const shapesId = "shapes";

export const scenes: Record<string, SceneConfig> = {
  stars: {
    id: starsId,
    name: "Stars",
    component: MovingStars,
    views: [
      {
        id: "view_0",
        sceneId: SceneIds.starsId,
        name: "view_0",
        camera: {
          position: [0, 0, 8],
          rotation: [0, 0, 0],
          fov: 45,
        },
        active: false,
      },
      {
        id: "view_1",
        sceneId: SceneIds.starsId,
        name: "view_1",
        camera: {
          position: [0, 0, 0.6],
          rotation: [0.0184, -1.131, 1.57],
          fov: 75,
        },
        active: false,
      },
      {
        id: "view_2",
        sceneId: SceneIds.starsId,
        name: "view_2",
        camera: {
          position: [0, 0, -0.47],
          rotation: [0, 1.988, -1.581],
          fov: 75,
        },
        active: false,
      },
    ],
    active: true,
    acceptsInput: false,
  },
  shapes: {
    views: [
      {
        id: "view_0",
        sceneId: SceneIds.shapesId,
        name: "view_0",
        camera: {
          position: [0, 0, 8],
          rotation: [0, 0, 0],
          fov: 45,
        },
        active: false,
      },
    ],
    id: shapesId,
    name: "Shapes",
    component: Shapes,
    active: false,
    acceptsInput: false,
  },
  coffeeShop: {
    views: [
      {
        id: "view_0",
        sceneId: SceneIds.coffeeShopId,
        name: "view_0",
        camera: {
          position: [0, 0, 8],
          rotation: [0, 0, 0],
          fov: 45,
        },
        active: false,
      },
    ],
    id: SceneIds.coffeeShopId,
    name: "CoffeeShop",
    component: CoffeeShop,
    active: false,

    acceptsInput: true,
  },
  // Add more scenes here...
};
