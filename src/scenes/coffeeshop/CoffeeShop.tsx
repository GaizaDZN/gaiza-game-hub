import { SceneProps } from "../common";
import React, { useEffect, useState } from "react";
import IngredientVisuals from "./components/threejs/IngredientVisuals";
import Cursor from "./components/threejs/Cursor";
import { useThree } from "@react-three/fiber";
import { inputDispatcher } from "../../context/input/InputDispatcher";
import Core from "./components/threejs/Core";

const cursor = "/src/assets/img/cursor.png";

const CoffeeShop: React.FC<SceneProps> = ({ gui }) => {
  gui.hide();
  const [isMouseOnCanvas, setIsMouseOnCanvas] = useState(false);
  const [mouseHeld, setMouseHeld] = useState(false);
  const { gl, size } = useThree();

  const handleMouseDown = (mouseButton: number) => {
    if (mouseButton === 0) setMouseHeld(true);
  };

  const handleMouseUp = (mouseButton: number) => {
    if (mouseButton === 0) setMouseHeld(false);
  };

  useEffect(() => {
    const canvas = gl.domElement;
    const handleMouseEnter = () => {
      setIsMouseOnCanvas(true);
      canvas.style.cursor = `url(${cursor}), auto`;
    };

    const handleMouseLeave = () => {
      setIsMouseOnCanvas(false);
      setMouseHeld(false);
      canvas.style.cursor = "default";
    };

    canvas.addEventListener("mouseenter", handleMouseEnter);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    inputDispatcher.subscribe("mousePress", handleMouseDown);
    inputDispatcher.subscribe("mouseUp", handleMouseUp);
    return () => {
      canvas.removeEventListener("mouseenter", handleMouseEnter);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      inputDispatcher.unsubscribe("mousePress", handleMouseDown);
      inputDispatcher.unsubscribe("mouseUp", handleMouseUp);
    };
  }, [gl, size]);

  return (
    <>
      <IngredientVisuals />
      <Cursor mouseHeld={mouseHeld} isMouseOnCanvas={isMouseOnCanvas} />
      <Core />
    </>
  );
};

export default CoffeeShop;
