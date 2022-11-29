import { useEffect, useState } from "react";

export const useRerender = () => {
  const [value, setValue] = useState(false);
  return () => setValue(!value);
};

export const changeSizeDynamically = () => {
  useEffect(() => {
    const changeCssHeightVariable = () =>
      window.document.documentElement.style.setProperty("--window-inner-height", `${window.innerHeight}px`);
    changeCssHeightVariable();
    window.addEventListener("resize", changeCssHeightVariable);

    return window.removeEventListener("resize", changeCssHeightVariable);
  }, []);
};
