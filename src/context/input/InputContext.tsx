import { createContext, useContext } from "react";

type InputContextType = {
  currentKey: string;
  setCurrentKey: (key: string) => void;
};

export const InputContext = createContext<InputContextType>({
  currentKey: "",
  setCurrentKey: () => {},
});

export const useInput = () => {
  const context = useContext(InputContext);
  if (!context) {
    throw new Error("useInput must be used within an InputProvider");
  }
  return context;
};
