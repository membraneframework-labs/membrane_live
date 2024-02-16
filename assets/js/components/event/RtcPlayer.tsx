import { useCallback } from "react";
import { User1, CamDisabled, MicrophoneDisabled } from "react-swm-icon-pack";
import type { User } from "../../types/types";
import "../../../css/event/rtcplayer.css";

type RtcPlayerProps = {
  metadata: User | undefined;
  audioStream: MediaStream | null;
  videoStream: MediaStream | null;
  isMyself: boolean;
  isMuted: boolean;
  isCamDisabled: boolean;
};

const RtcPlayer = ({ isMyself, audioStream, videoStream, metadata, isMuted, isCamDisabled }: RtcPlayerProps) => {
  const loadVideo = useCallback(
    (media: HTMLAudioElement | null) => {
      if (!media) return;
      media.srcObject = videoStream || null;
    },
    [videoStream]
  );

  const loadAudio = useCallback(
    (media: HTMLAudioElement | null) => {
      if (!media) return;
      media.srcObject = audioStream || null;
    },
    [audioStream]
  );

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
        ref={loadVideo}
        className="PresenterVideo"
      />
      <div className="BottomBarPresenter">
        <div className="PresenterName">
          {isMyself && <User1 className="YouIcon" />}
          {isMyself ? "You" : metadata?.name}
        </div>
      </div>
      <div className="AudioBar"></div>
      <audio autoPlay ref={loadAudio} muted={isMyself} />
    </div>
  );
};

export default RtcPlayer;
