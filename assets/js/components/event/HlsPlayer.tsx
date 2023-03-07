import { useContext, useEffect, useRef, useState } from "react";
import HeartAnimation from "./animations/HeartAnimation";
import ConfettiAnimation from "./animations/ConfettiAnimation";
import HlsControlBar from "./HlsControlBar";
import { doOCR } from "../../utils/hlsLatancy";
import { Channel } from "phoenix";
import { MediaController } from "media-chrome/dist/react";
import { ScreenTypeContext } from "../../utils/ScreenTypeContext";
import { MobileRightSidebar } from "./MobileRightSidebar";
import { CardStatus } from "../../types/types";

import "../../../css/event/hlsplayer.css";

type HlsPlayerProps = {
  attachVideo: (videoElem: HTMLVideoElement | null) => void;
  addMessage: ((offset: number) => void) | undefined;
  presenterName: string | undefined;
  eventChannel?: Channel | undefined;
  setCard?: React.Dispatch<React.SetStateAction<CardStatus>>;
};

const HlsPlayer = ({ attachVideo, addMessage, presenterName, eventChannel, setCard }: HlsPlayerProps) => {
  const screenType = useContext(ScreenTypeContext);
  const playerRef = useRef<HTMLVideoElement>(null);

  const showMobileSideBar = screenType.device === "mobile" && setCard;

  useEffect(() => {
    attachVideo(playerRef.current);
  }, [attachVideo, presenterName]);

  useEffect(() => {
    const playerRefCopy = playerRef;
    let onTimeUpdate: () => void;

    if (addMessage) {
      onTimeUpdate = () => addMessage(playerRef.current ? playerRef.current.currentTime * 1000 : 0);
      playerRefCopy.current?.addEventListener("timeupdate", onTimeUpdate);
    }

    return () => {
      playerRefCopy.current?.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [addMessage]);

  const [measureHlsLatency, setMeasureHlsLatency] = useState<boolean>(false);
  (window as any).toggleHlsLatency = () => setMeasureHlsLatency((prev) => !prev);

  useEffect(() => {
    if (!playerRef.current || !measureHlsLatency) return;
    const interval = setInterval(() => doOCR(playerRef), 1000);
    return () => clearInterval(interval);
  }, [presenterName, attachVideo, measureHlsLatency]);

  return (
    <div className="HlsStream">
      <div className="HlsPlayerWrapper">
        {eventChannel && <ConfettiAnimation eventChannel={eventChannel} />}
        <MediaController className="HlsPlayerWrapper">
          <video
            id="hlsVideo"
            ref={playerRef}
            slot="media"
            className="HlsPlayer"
            autoPlay={true}
            playsInline
            controls={false}
          />
          <HlsControlBar />
        </MediaController>
        {screenType.device === "desktop" && presenterName && (
          <div className="HlsTopBar">
            <div className="HlsPresenterName">{presenterName}</div>
          </div>
        )}
        {eventChannel && <HeartAnimation eventChannel={eventChannel} />}
        {showMobileSideBar && <MobileRightSidebar setCard={setCard} />}
      </div>
    </div>
  );
};

export default HlsPlayer;
