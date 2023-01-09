import { useEffect, useState } from "react";

export const useRerender = () => {
  const [value, setValue] = useState(false);
  return () => setValue(!value);
};

export const useDynamicResizing = () => {
  useEffect(() => {
    const changeCssHeightVariable = () => {
      const fiftyMiliseconds = 50;
      setTimeout(
        () => window.document.documentElement.style.setProperty("--window-inner-height", `${window.innerHeight}px`),
        fiftyMiliseconds
      );
    };

    changeCssHeightVariable();
    window.addEventListener("resize", changeCssHeightVariable);

    return () => {
      window.onresize = null;
    };
  }, []);
};

export const useStateTimeout = (
  callback: () => void,
  defaultValue = false,
  deactivationTime = 5_000,
): [boolean, () => void] => {
  const [status, setStatus] = useState(defaultValue);

  const toggle = () => {
    setStatus(true);
    callback();
    setTimeout(() => setStatus((prevStatus) => !prevStatus), deactivationTime);
  };
  return [status, toggle];
};
