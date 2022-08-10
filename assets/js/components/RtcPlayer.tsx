import React, { useEffect, useRef } from "react";
import { SourceType } from "./ControlPanel";
import { presenterStreams } from "./PresenterStreamArea";

type RtcPlayerProps = {
  isMyself: boolean;
  name: string;
  streamsAvailable: { [key: string]: boolean };
};

export const RtcPlayer = ({ isMyself, name, streamsAvailable }: RtcPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const isPresenterAndStreamAvailable = () => {
    return (
      name in presenterStreams &&
      streamsAvailable[name] &&
      videoRef.current != null &&
      audioRef.current != null
    );
  };

  useEffect(() => {
    if (isPresenterAndStreamAvailable()) {
      videoRef.current!.srcObject = presenterStreams[name];
      audioRef.current!.srcObject = presenterStreams[name];
    }
  }, [streamsAvailable]);

  return (
    <div>
      <video width={1000} height={700} autoPlay ref={videoRef} />
      {!isMyself && <audio ref={audioRef} />}
      <h5>{isMyself ? name + " (Me)" : name}</h5>
    </div>
  );
};

type RtcClientPlayerProps = {
  name: string;
  clientStreamAvailable: SourceType;
};

export const RtcClientPlayer = ({ name, clientStreamAvailable }: RtcClientPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const isPresenterAndStreamAvailable = () => {
    return name in presenterStreams && clientStreamAvailable && videoRef.current != null;
  };

  useEffect(() => {
    if (isPresenterAndStreamAvailable()) {
      videoRef.current!.srcObject = presenterStreams[name];
    }
  }, [clientStreamAvailable]);

  return (
    <div>
      <video width={1000} height={700} autoPlay ref={videoRef} />
      <h5>{`${name} (Me)`}</h5>
    </div>
  );
};

export default RtcPlayer;
