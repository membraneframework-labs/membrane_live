import { useEffect, useRef } from "react";
import AnimationComponent from "./HeartAnimation";
import HlsControlBar from "./HlsControlBar";
import {Channel} from "phoenix";
import {MediaController} from "media-chrome/dist/react";
import useCheckScreenType from "../../utils/useCheckScreenType";
import "../../../css/event/hlsplayer.css";

type HlsPlayerProps = {
  attachVideo: (videoElem: HTMLVideoElement | null) => void;
  presenterName: string | undefined;
  eventChannel?: Channel | undefined;
};

const HlsPlayer = ({ attachVideo, presenterName, eventChannel }: HlsPlayerProps) => {
  const screenType = useCheckScreenType();
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
        {screenType.device === "desktop" && presenterName && (
          <div className="HlsTopBar">
            <div className="HlsPresenterName">{presenterName}</div>
          </div>
        )}
        {eventChannel && (
          <div className="HlsBottomBar">
            <AnimationComponent eventChannel={eventChannel}/>
          </div>
        )}
      </div>
    </div>
  );
};

export default HlsPlayer;
