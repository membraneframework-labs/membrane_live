import React from "react";
import ReactHlsPlayer from "react-hls-player";
import { RotateLeft } from "react-swm-icon-pack";
import "../../../css/event/hlsplayer.css";
import AnimationComponent from "./HeartAnimation";
import { Channel } from "phoenix";

type HlsPlayerProps = {
  hlsUrl: string;
  presenterName: string;
  eventChannel: Channel | undefined;
};

const HlsPlayer = ({ hlsUrl, presenterName, eventChannel }: HlsPlayerProps) => {
  return (
    <div className="HlsStream">
      {hlsUrl ? (
        <div className="HlsPlayerWrapper">
          <ReactHlsPlayer
            src={hlsUrl}
            hlsConfig={{ liveSyncDurationCount: 2 }}
            autoPlay
            muted
            controls
            className="HlsPlayer"
          />
          <div className="HlsTopBar">
            {presenterName && <div className="HlsPresenterName">{presenterName}</div>}
          </div>
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
