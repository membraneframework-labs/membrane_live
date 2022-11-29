import React, { useEffect, useRef } from "react";
import { User1, CamDisabled, MicrophoneDisabled } from "react-swm-icon-pack";
import type { PresenterStream, SourceType } from "../../types/types";
import "../../../css/event/rtcplayer.css";

type RtcPlayerProps = {
  isMyself: boolean;
  presenterStream: PresenterStream;
};

const RtcPlayer = ({ isMyself, presenterStream }: RtcPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const connectStreams = (sourceType: SourceType) => {
    if (!presenterStream) return;
    if (videoRef.current && sourceType == "video") videoRef.current.srcObject = presenterStream.stream;
    if (audioRef.current && sourceType == "audio") audioRef.current.srcObject = presenterStream.stream;
  };

  const isSourceDisabled = (sourceType: SourceType) => {
    const isEnabled = presenterStream?.stream.getTracks().find((elem) => elem.kind == sourceType)?.enabled;
    return isEnabled === false;
  };

  const isMuted = isSourceDisabled("audio");
  const isCamDisabled = isSourceDisabled("video");

  useEffect(() => {
    connectStreams("audio");
    connectStreams("video");
  }, [presenterStream]);

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
      <video
        key={presenterStream.email}
        autoPlay
        playsInline
        disablePictureInPicture
        muted={true}
        ref={videoRef}
        className="PresenterVideo"
      />
      <div className="BottomBarPresenter">
        <div className="PresenterName">
          {isMyself && <User1 className="YouIcon" />}
          {isMyself ? "You" : presenterStream.name}
        </div>
      </div>
      <div className="AudioBar"></div>
      {!isMyself && <audio autoPlay ref={audioRef} />}
    </div>
  );
};

export default RtcPlayer;
