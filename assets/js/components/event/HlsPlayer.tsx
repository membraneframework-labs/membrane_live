import { useEffect, useRef } from "react";
import AnimationComponent from "./HeartAnimation";
import HlsControlBar from "./HlsControlBar";
import { Channel } from "phoenix";
import { MediaController } from "media-chrome/dist/react";
import "../../../css/event/hlsplayer.css";

type HlsPlayerProps = {
  attachVideo: (videoElem: HTMLVideoElement | null) => void;
  presenterName: string | undefined;
  eventChannel?: Channel | undefined;
};

const HlsPlayer = ({ attachVideo, presenterName, eventChannel }: HlsPlayerProps) => {
  const playerRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    attachVideo(playerRef.current);
  }, [attachVideo, presenterName]);

  return (
    <div className="HlsStream">
      <div className="HlsPlayerWrapper">
        <MediaController className="HlsPlayerWrapper">
          <video ref={playerRef} slot="media" className="HlsPlayer" autoPlay={true} />
          <HlsControlBar></HlsControlBar>
        </MediaController>
        <div className="HlsTopBar">{presenterName && <div className="HlsPresenterName">{presenterName}</div>}</div>
        <div className="HlsBottomBar">{eventChannel && <AnimationComponent eventChannel={eventChannel} />}</div>
      </div>
    </div>
  );
};

export default HlsPlayer;
