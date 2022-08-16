import React, { useEffect, useRef } from "react";
import { presenterStreams } from "../utils/rtcUtils";

type RtcPlayerProps = {
  isMyself: boolean;
  name: string;
  playerCallbacks: { [key: string]: () => void };
};

const RtcPlayer = ({ isMyself, name, playerCallbacks }: RtcPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const connectStreams = () => {
    if (!(name in presenterStreams)) return;
    if (videoRef.current) videoRef.current.srcObject = presenterStreams[name];
  };
  playerCallbacks[name] = connectStreams;

  useEffect(() => {
    connectStreams();
  }, []);

  return (
    <div>
      <video width={1000} height={700} autoPlay muted={isMyself} ref={videoRef} />
      <h5>{isMyself ? name + " (Me)" : name}</h5>
    </div>
  );
};

export default RtcPlayer;
