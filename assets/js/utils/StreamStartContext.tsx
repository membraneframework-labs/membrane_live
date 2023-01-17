import React, { useContext, useState } from "react";
import { createContext } from "react";

export type StartStreamContextType = {
  streamStart: Date | null;
  setStreamStart: React.Dispatch<React.SetStateAction<Date | null>>;
};

const StreamStartContext = createContext<StartStreamContextType | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

export const StreamStartProvider = ({ children }: Props) => {
  const [streamStart, setStreamStart] = useState<Date | null>(null);

  return <StreamStartContext.Provider value={{ streamStart, setStreamStart }}>{children}</StreamStartContext.Provider>;
};

export const useStartStream = (): StartStreamContextType => {
  const context = useContext(StreamStartContext);
  if (!context) throw new Error("useStartStream must be used within a UserProvider");
  return context;
};
