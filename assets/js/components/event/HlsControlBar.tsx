import {
  MediaControlBar,
  MediaTimeRange,
  MediaTimeDisplay,
  MediaVolumeRange,
  MediaPlayButton,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaMuteButton,
  MediaFullscreenButton,
  MediaPipButton,
} from "media-chrome/dist/react";
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
import "../../../css/event/hlscontrolbar.css";
import {MobileRightSidebar} from "./MobileRightSidebar";

const HlsControlBar = () => {
  return (
    <MediaControlBar className="MediaControlBar">
      <div className="TopBar">
        <MediaTimeRange className="MediaTimeRange MediaBackground"/>
        <MediaTimeDisplay
          className="MediaTimeDisplay MediaBackground"
          showDuration/>
      </div>
      <div className="BottomBar">
        <div className="BottomBarLeft">
          <MediaMuteButton className="MediaBackground">
            <SpeakerCross className="ControlButtons" slot="off"/>
            <Speaker0 className="ControlButtons" slot="low"/>
            <Speaker1 className="ControlButtons" slot="medium"/>
            <Speaker2 className="ControlButtons" slot="high"/>
          </MediaMuteButton>
          <MediaVolumeRange className="MediaVolumeRange MediaBackground"/>
        </div>

        <div className="BottomBarCenter">
          <MediaSeekBackwardButton className="MediaBackground" seekOffset={15}>
            <RotateLeft className="ControlButtons" slot="backward"/>
          </MediaSeekBackwardButton>
          <MediaPlayButton pause={Pause} play={Play} className="MediaBackground">
            <Pause className="ControlButtons" slot="pause"/>
            <Play className="ControlButtons" slot="play"/>
          </MediaPlayButton>
          <MediaSeekForwardButton className="MediaBackground" seekOffset={15}>
            <RotateRight className="ControlButtons" slot="forward"/>
          </MediaSeekForwardButton>
        </div>
        <div className="BottomBarRight">
          <MediaPipButton className="MediaBackground"/>
          <MediaFullscreenButton className="MediaBackground">
            <Fullscreen className="ControlButtons" slot="enter"/>
            <Fullscreen className="ControlButtons" slot="exit"/>
          </MediaFullscreenButton>
        </div>
      </div>
    </MediaControlBar>
  );
};

export default HlsControlBar;
