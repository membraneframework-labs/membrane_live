import { useRef } from "react";
import { User1, CamDisabled, MicrophoneDisabled } from "react-swm-icon-pack";
import type { User } from "../../types/types";
import "../../../css/event/rtcplayer.css";

type RtcPlayerProps = {
  metadata: User | null;
  audioStream: MediaStream | null;
  videoStream: MediaStream | null;
  isMyself: boolean;
  isMuted: boolean;
  isCamDisabled: boolean;
};

const RtcPlayer = ({ isMyself, audioStream, videoStream, metadata, isMuted, isCamDisabled}: RtcPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  if (videoRef.current) videoRef.current.srcObject = videoStream;
  if (audioRef.current) audioRef.current.srcObject = audioStream;
  
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
        key={metadata?.email}
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
          {isMyself ? "You" : metadata?.name}
        </div>
      </div>
      <div className="AudioBar"></div>
      {!isMyself && <audio autoPlay ref={audioRef} />}
    </div>
  );
};

export default RtcPlayer;
