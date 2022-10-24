import { useEffect, useState } from "react";
import type { ScreenType } from "../types";

const useCheckScreenType = () => {
  const breakPixelValue = 768;
  const mqlLandscape = window.matchMedia("(orientation: landscape)");
  const mqlMobilePortrait = window.matchMedia(`(max-width: ${breakPixelValue}px)`);
  const mqlMobileLandscape = window.matchMedia(`(max-height: ${breakPixelValue}px)`);

  const [screenType, setScreenType] = useState<ScreenType>({
    orientation: mqlLandscape.matches ? "landscape" : "portrait",
    device: (mqlLandscape.matches ? mqlMobileLandscape.matches : mqlMobilePortrait.matches)
      ? "mobile"
      : "normal",
  });

  const onLandscapeChange = (e: MediaQueryListEvent) => {
    const query = `(max-${e.matches ? "height" : "width"}: ${breakPixelValue}px)`;
    setScreenType((prev) => {
      const newScreenType: ScreenType = {
        orientation: e.matches ? "landscape" : "portrait",
        device: window.matchMedia(query).matches ? "mobile" : "normal",
      };
      if (prev.device == newScreenType.device && prev.orientation == newScreenType.orientation)
        return prev;
      return newScreenType;
    });
  };

  const onMobilePortraitChange = (e: MediaQueryListEvent) => {
    if (window.matchMedia("(orientation: portrait)").matches)
      setScreenType((prev) => {
        const newScreenType: ScreenType = {
          orientation: "portrait",
          device: e.matches ? "mobile" : "normal",
        };
        if (prev.device == newScreenType.device && prev.orientation == newScreenType.orientation)
          return prev;
        return newScreenType;
      });
  };

  const onMobileLandscapeChange = (e: MediaQueryListEvent) => {
    if (window.matchMedia("(orientation: landscape)").matches)
      setScreenType((prev) => {
        const newScreenType: ScreenType = {
          orientation: "landscape",
          device: e.matches ? "mobile" : "normal",
        };
        if (prev.device == newScreenType.device && prev.orientation == newScreenType.orientation)
          return prev;
        return newScreenType;
      });
  };

  useEffect(() => {
    mqlLandscape.addEventListener("change", onLandscapeChange);
    mqlMobilePortrait.addEventListener("change", onMobilePortraitChange);
    mqlMobileLandscape.addEventListener("change", onMobileLandscapeChange);

    return () => {
      mqlLandscape.removeEventListener("change", onLandscapeChange);
      mqlMobilePortrait.removeEventListener("change", onMobilePortraitChange);
      mqlMobileLandscape.removeEventListener("change", onMobileLandscapeChange);
    };
  }, []);

  return screenType;
};

export default useCheckScreenType;
