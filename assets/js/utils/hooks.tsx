import { useEffect, useState } from "react";
import type { ScreenType } from "../types";

const useCheckScreenType = () => {
  const breakPixelValue = 500;
  const mqlLandscape = window.matchMedia("(orientation: landscape)");
  const mqlMobilePortrait = window.matchMedia(`(max-width: ${breakPixelValue}px)`);
  const mqlMobileLandscape = window.matchMedia(`(max-height: ${breakPixelValue}px)`);
  const localStorageDevice = localStorage.getItem("deviceType") || "";

  const setDevice = (isMobile: boolean): "desktop" | "mobile" => {
    if (localStorageDevice == "desktop" || localStorageDevice == "mobile")
      return localStorageDevice;
    return isMobile ? "mobile" : "desktop";
  };

  const [screenType, setScreenType] = useState<ScreenType>({
    orientation: mqlLandscape.matches ? "landscape" : "portrait",
    device: setDevice(
      mqlLandscape.matches ? mqlMobileLandscape.matches : mqlMobilePortrait.matches
    ),
  });

  const onLandscapeChange = (e: MediaQueryListEvent) => {
    const query = `(max-${e.matches ? "height" : "width"}: ${breakPixelValue}px)`;
    setScreenType((prev) => {
      const newScreenType: ScreenType = {
        orientation: e.matches ? "landscape" : "portrait",
        device: setDevice(window.matchMedia(query).matches),
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
          device: setDevice(e.matches),
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
          device: setDevice(e.matches),
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
