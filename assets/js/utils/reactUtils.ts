import { useState } from "react";

export const useRerender = () => {
  const [value, setValue] = useState(false);
  return () => setValue(!value);
};
