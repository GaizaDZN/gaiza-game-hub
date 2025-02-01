import { createContext, useContext } from "react";

type InputContextType = {
  currentKey: string;
  confirm: boolean;
  cancel: boolean;
  setConfirm: (state: boolean) => void;
  setCancel: (state: boolean) => void;
  setCurrentKey: (key: string) => void;
};

export const InputContext = createContext<InputContextType>({
  currentKey: "",
  confirm: false,
  cancel: false,
  setConfirm: () => {},
  setCancel: () => {},
  setCurrentKey: () => {},
});

export const useInput = () => {
  const context = useContext(InputContext);
  if (!context) {
    throw new Error("useInput must be used within an InputProvider");
  }
  return context;
};
