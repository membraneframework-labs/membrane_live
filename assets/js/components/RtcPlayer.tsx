import React, { useEffect, useRef } from "react";
import { presenterStreams, SourceType } from "../utils/rtcUtils";
import "../../css/rtcplayer.css";

type RtcPlayerProps = {
  isMyself: boolean;
  name: string;
  playerCallbacks: { [key: string]: (sourceType: SourceType) => void };
};

const RtcPlayer = ({ isMyself, name, playerCallbacks }: RtcPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const connectStreams = (sourceType: SourceType) => {
    if (!(name in presenterStreams)) return;
    if (videoRef.current && sourceType == "video")
      videoRef.current.srcObject = presenterStreams[name];
    if (audioRef.current && sourceType == "audio")
      audioRef.current.srcObject = presenterStreams[name];
  };
  playerCallbacks[name] = connectStreams;

  useEffect(() => {
    connectStreams("audio");
    connectStreams("video");
  }, []);

  return (
    <div className="RtcPlayer">
      <video autoPlay muted={true} ref={videoRef} className="PresenterVideo"/>
      <div className="BottomBar">
        <div className="PresenterName">
          {isMyself ? name + " (Me)" : name}
        </div>
      </div>
      <div className="TopBar">

      </div>
      {!isMyself && <audio autoPlay ref={audioRef} />}
    </div>
  );
};

export default RtcPlayer;
