import { useCallback, useEffect, useState } from "react";

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
  defaultValue: boolean = false,
  deactivationTime: number = 5_000,
  callback: () => void
): any => {
  const [status, setStatus] = useState(defaultValue);

  // useEffect( () => {
  //   const ref = setTimeout(() => setStatus((prevStatus) => !prevStatus), deactivationTime);
  //   return () => {
  //     clearTimeout(ref);
  //   }
  // }, [status]);

  const toggle = () => {
    setStatus(true);
    callback();
    setTimeout(() => setStatus((prevStatus) => !prevStatus), deactivationTime);
  };
  return [status, toggle];
};
