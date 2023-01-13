import { useOnScreenTypeChange } from "./ScreenTypeContext";
import type { CardStatus } from "../types/types";

export const useAutoHideMobileBottomBar = (setCard: (value: CardStatus) => void) => {
  useOnScreenTypeChange(({ orientation }) => {
    if (orientation === "landscape") setCard("hidden");
  });
};
