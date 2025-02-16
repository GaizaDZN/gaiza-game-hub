import { SceneProps } from "../common";
import React from "react";
import IngredientVisuals from "./components/threejs/IngredientVisuals";

const CoffeeShop: React.FC<SceneProps> = ({ gui }) => {
  gui.close();

  return (
    <>
      <IngredientVisuals />
    </>
  );
};

export default CoffeeShop;
