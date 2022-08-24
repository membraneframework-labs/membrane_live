import React from "react";
import ReactHlsPlayer from "react-hls-player";
import { RotateLeft } from "react-swm-icon-pack";
import "../../css/hlsplayer.css";

type HlsPlayerProps = {
  hlsUrl: string;
  presenterName: string;
};

const HlsPlayer = ({ hlsUrl, presenterName }: HlsPlayerProps) => {
  return (
    <div className="HlsStream">
      {hlsUrl ? (
        <div className="HlsPlayerWrapper">
          <ReactHlsPlayer src={hlsUrl} autoPlay controls className="HlsPlayer" />
          <div className="HlsTopBar">
            <div className="HlsPresenterName">{presenterName}</div>
          </div>
        </div>
      ) : (
        <div className="WaitText">
          <RotateLeft />
          Waiting for the live stream to start...
        </div>
      )}
    </div>
  );
};

export default HlsPlayer;
