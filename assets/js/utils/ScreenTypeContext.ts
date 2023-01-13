import { createContext, useContext, useEffect } from "react";
import { ScreenType } from "../types/types";

export const ScreenTypeContext = createContext<ScreenType>({ device: "desktop", orientation: "landscape" });

export const useOnScreenTypeChange = (callback: (screenType: ScreenType) => void) => {
  const screenType: ScreenType = useContext(ScreenTypeContext);

  useEffect(() => {
    callback(screenType);
  }, [callback, screenType]);
};
