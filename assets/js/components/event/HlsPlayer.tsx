import React, { useEffect } from "react";
import {
  MediaController,
  MediaControlBar,
  MediaTimeRange,
  MediaTimeDisplay,
  MediaVolumeRange,
  MediaPlayButton,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaMuteButton,
  MediaFullscreenButton,
} from "media-chrome/dist/react";
import "hls-video-element";
import {
  Speaker2,
  Speaker1,
  Speaker0,
  SpeakerCross,
  Play,
  Pause,
  RotateLeft,
  RotateRight,
  Fullscreen,
} from "react-swm-icon-pack";
import "../../../css/event/hlsplayer.css";
import AnimationComponent from "./HeartAnimation";
import { Channel } from "phoenix";
import ReactHlsPlayer from "react-hls-player";

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
          <MediaController className="HlsPlayerWrapper">
            <ReactHlsPlayer
              hlsConfig={{liveSyncDuration: 10 }}
              className="HlsPlayer"
              autoPlay={true}
              slot="media"
              src={hlsUrl}
              muted={true}
            ></ReactHlsPlayer>
            <MediaControlBar className="MediaControlBar">
              <div className="TopBar">
                <MediaTimeRange className="MediaTimeRange"></MediaTimeRange>
                <MediaTimeDisplay className="MediaTimeDisplay" showDuration></MediaTimeDisplay>
              </div>
              <div className="BottomBar">
                <div className="BottomBarLeft">
                  <MediaMuteButton className="MediaMuteButton">
                    <SpeakerCross color="white" slot="off"></SpeakerCross>
                    <Speaker0 color="white" slot="low"></Speaker0>
                    <Speaker1 color="white" slot="medium"></Speaker1>
                    <Speaker2 color="white" slot="high"></Speaker2>
                  </MediaMuteButton>
                  <MediaVolumeRange className="MediaVolumeRange"></MediaVolumeRange>
                </div>

                <div className="BottomBarCenter">
                  <MediaSeekBackwardButton className="MediaSeekBackwardButton" seekOffset={15}>
                    <RotateLeft className="RewindButtons" slot="backward"></RotateLeft>
                  </MediaSeekBackwardButton>
                  <MediaPlayButton pause={Pause} play={Play} className="MediaPlayButton">
                    <Pause color="white" slot="pause"></Pause>
                    <Play color="white" slot="play"></Play>
                  </MediaPlayButton>
                  <MediaSeekForwardButton className="MediaSeekForwardButton" seekOffset={15}>
                    <RotateRight
                      className="RewindButtons"
                      color="white"
                      slot="forward"
                    ></RotateRight>
                  </MediaSeekForwardButton>
                </div>
                <div className="BottomBarRight">
                  <MediaFullscreenButton className="MediaFullScreenButton">
                    <Fullscreen
                      className="FullScreenButton"
                      color="white"
                      slot="enter"
                    ></Fullscreen>
                    <Fullscreen className="FullScreenButton" color="white" slot="exit"></Fullscreen>
                  </MediaFullscreenButton>
                </div>
              </div>
            </MediaControlBar>
          </MediaController>
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
