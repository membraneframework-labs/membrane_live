import React, { useEffect, useRef } from "react";
import { presenterStreams, SourceType } from "../../utils/rtcUtils";
import { User1 } from "react-swm-icon-pack";
import type { Presenter } from "../../types";
import "../../../css/event/rtcplayer.css";

type RtcPlayerProps = {
  isMyself: boolean;
  presenter: Presenter;
  playerCallbacks: { [key: string]: (sourceType: SourceType) => void };
};

const RtcPlayer = ({ isMyself, presenter, playerCallbacks }: RtcPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const style = getComputedStyle(document.body);
  const font = style.getPropertyValue("--font-light-color");

  const connectStreams = (sourceType: SourceType) => {
    if (!presenterStreams[presenter.email]) return;
    if (videoRef.current && sourceType == "video")
      videoRef.current.srcObject = presenterStreams[presenter.email];
    if (audioRef.current && sourceType == "audio")
      audioRef.current.srcObject = presenterStreams[presenter.email];
  };
  playerCallbacks[presenter.email] = connectStreams;

  useEffect(() => {
    connectStreams("audio");
    connectStreams("video");
  }, []);

  return (
    <div className="RtcPlayer">
      <video autoPlay muted={true} ref={videoRef} className="PresenterVideo" />
      <div className="BottomBar">
        <div className="PresenterName">
          {isMyself && <User1 color={font} />}
          {isMyself ? "You" : presenter.name}
        </div>
      </div>
      <div className="TopBar"></div>
      {!isMyself && <audio autoPlay ref={audioRef} />}
    </div>
  );
};

export default RtcPlayer;
