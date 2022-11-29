import React from "react";
import AnimationComponent from "./HeartAnimation";
import ReactHlsPlayer from "../../utils/ReactHlsPlayer";
import HlsControlBar from "./HlsControlBar";
import { Channel } from "phoenix";
import { MediaController } from "media-chrome/dist/react";
import { RotateLeft } from "react-swm-icon-pack";
import "../../../css/event/hlsplayer.css";
import useCheckScreenType from "../../utils/useCheckScreenType";

type HlsPlayerProps = {
  hlsUrl: string;
  presenterName: string;
  eventChannel?: Channel | undefined;
};

const HlsPlayer = ({ hlsUrl, presenterName, eventChannel }: HlsPlayerProps) => {
  const screenType = useCheckScreenType();

  return (
    <div className="HlsStream">
      {hlsUrl ? (
        <div className="HlsPlayerWrapper">
          <MediaController className="HlsPlayerWrapper">
            <ReactHlsPlayer
              hlsConfig={{
                liveSyncDurationCount: 2,
                initialLiveManifestSize: 2,
                backBufferLength: 30,
              }}
              autoPlay={true}
              playsInline
              controls={false}
              muted={true}
              className="HlsPlayer"
              slot="media"
              src={hlsUrl}
            ></ReactHlsPlayer>
            <HlsControlBar></HlsControlBar>
          </MediaController>
          {screenType.device === "desktop" && presenterName && (
            <div className="HlsTopBar">
              <div className="HlsPresenterName">{presenterName}</div>
            </div>
          )}
          <div className="HlsBottomBar">
            <AnimationComponent eventChannel={eventChannel} />
          </div>
        </div>
      ) : (
        <div className="WaitText">
          <RotateLeft className="RotateIcon" />
          Waiting for the live stream to start...
        </div>
      )}
    </div>
  );
};

export default HlsPlayer;
