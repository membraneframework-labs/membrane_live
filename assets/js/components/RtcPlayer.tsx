import React, { useEffect, useRef } from "react";

type RtcPlayerProps = {
  name: string;
  presenterStreams: { [key: string]: MediaStream };
  streamsAvailable: { [key: string]: boolean };
};

const RtcPlayer = ({ name, presenterStreams, streamsAvailable }: RtcPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (
      name in presenterStreams &&
      streamsAvailable[name] &&
      videoRef.current != null &&
      audioRef.current != null
    ) {
      videoRef.current.srcObject = presenterStreams[name];
      audioRef.current.srcObject = presenterStreams[name];
    }
  }, [streamsAvailable]);

  return (
    <div>
      <video width={1000} height={700} autoPlay ref={videoRef} />
      <audio ref={audioRef} />
      <h5>{name}</h5>
    </div>
  );
};

export default RtcPlayer;
