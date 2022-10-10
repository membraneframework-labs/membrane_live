import React from "react";
import ReactHlsPlayer from "react-hls-player";
import { RotateLeft } from "react-swm-icon-pack";
import "../../../css/event/hlsplayer.css";

type HlsPlayerProps = {
  hlsUrl: string;
  currentlyStreamingName: string;
};

const HlsPlayer = ({ hlsUrl, currentlyStreamingName }: HlsPlayerProps) => {
  return (
    <div className="HlsStream">
      {hlsUrl ? (
        <div className="HlsPlayerWrapper">
          <ReactHlsPlayer src={hlsUrl} autoPlay controls className="HlsPlayer" />
          <div className="HlsTopBar">
            <div className="HlsPresenterName">{currentlyStreamingName}</div>
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
