import React, { useEffect, useRef } from "react";
import { presenterStreams } from "../../utils/rtcUtils";
import { User1 } from "react-swm-icon-pack";
import type { Presenter, SourceType } from "../types/types";
import "../../../css/event/rtcplayer.css";

type RtcPlayerProps = {
  isMyself: boolean;
  presenter: Presenter;
  playerCallbacks: { [key: string]: (sourceType: SourceType) => void };
  setPresenters: React.Dispatch<React.SetStateAction<{ [key: string]: Presenter }>>;
};

const RtcPlayer = ({ isMyself, presenter, playerCallbacks, setPresenters }: RtcPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const connectStreams = (sourceType: SourceType) => {
    if (!presenterStreams[presenter.email]) return;
    if (videoRef.current && sourceType == "video") videoRef.current.srcObject = presenterStreams[presenter.email];
    if (audioRef.current && sourceType == "audio") audioRef.current.srcObject = presenterStreams[presenter.email];
  };
  playerCallbacks[presenter.email] = connectStreams;

  useEffect(() => {
    connectStreams("audio");
    connectStreams("video");

    setPresenters((prev) => {
      return {
        ...prev,
        [presenter.email]: { ...prev[presenter.email], rtcStatus: "rtc_player_ready" },
      };
    });
  }, []);

  return (
    <div className="RtcPlayer">
      <video autoPlay muted={true} ref={videoRef} className="PresenterVideo" />
      <div className="BottomBar">
        <div className="PresenterName">
          {isMyself && <User1 className="YouIcon" />}
          {isMyself ? "You" : presenter.name}
        </div>
      </div>
      <div className="TopBar"></div>
      {!isMyself && <audio autoPlay ref={audioRef} />}
    </div>
  );
};

export default RtcPlayer;
