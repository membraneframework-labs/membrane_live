import { createContext } from "react";
import { ScreenType } from "../types/types";

export const ScreenTypeContext = createContext<ScreenType>({ device: "desktop", orientation: "landscape" });
