import { createContext } from "react";

export const StreamStartContext = createContext<{
  streamStart: Date | null;
  setStreamStart: React.Dispatch<React.SetStateAction<Date | null>> | null;
}>({ streamStart: null, setStreamStart: null });
