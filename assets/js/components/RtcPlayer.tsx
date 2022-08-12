import React, { useRef } from "react";
import { presenterStreams } from "../utils/rtcUtils";

type RtcPlayerProps = {
  isMyself: boolean;
  name: string;
  playerCallbacks: { [key: string]: () => void };
};

const RtcPlayer = ({ isMyself, name, playerCallbacks }: RtcPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const connectStreams = () => {
    if (!(name in presenterStreams)) return;

    if (videoRef.current)
      videoRef.current.srcObject = presenterStreams[name];
    if (audioRef.current)
      audioRef.current.srcObject = presenterStreams[name];
  };
  playerCallbacks[name] = connectStreams;

  return (
    <div>
      <video width={1000} height={700} autoPlay ref={videoRef} />
      {isMyself && <audio ref={audioRef} />}
      <h5>{isMyself ? name + " (Me)" : name}</h5>
    </div>
  );
};

export default RtcPlayer;
