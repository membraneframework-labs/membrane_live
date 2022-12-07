import React, { useEffect, useRef } from "react";
import { checkTrackIsEnabled, presenterStreams } from "../../utils/rtcUtils";
import { User1, CamDisabled, MicrophoneDisabled } from "react-swm-icon-pack";
import type { Presenter, SourceType } from "../../types";
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
    if (videoRef.current && sourceType == "video")
      videoRef.current.srcObject = presenterStreams[presenter.email];
    if (audioRef.current && sourceType == "audio")
      audioRef.current.srcObject = presenterStreams[presenter.email];
  };
  playerCallbacks[presenter.email] = connectStreams;

  const isSourceDisabled = (sourceType: SourceType) => {
    const isEnabled = checkTrackIsEnabled(presenter, sourceType);
    return isEnabled === false;
  };

  const isMuted = isSourceDisabled("audio");
  const isCamDisabled = isSourceDisabled("video");

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
      <div className="UpperBarPresenter">
        {isMuted && (
          <div className="IconDisabled">
            <MicrophoneDisabled className="PresenterDisabledSource" />
          </div>
        )}
        {isCamDisabled && (
          <div className="IconDisabled">
            <CamDisabled className="PresenterDisabledSource" />
          </div>
        )}
      </div>
      <video autoPlay muted={true} ref={videoRef} className="PresenterVideo" />
      <div className="BottomBarPresenter">
        <div className="PresenterName">
          {isMyself && <User1 className="YouIcon" />}
          {isMyself ? "You" : presenter.name}
        </div>
      </div>
      <div className="AudioBar"></div>
      {!isMyself && <audio autoPlay ref={audioRef} />}
    </div>
  );
};

export default RtcPlayer;
