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

const HlsControlBar = () => {
  return (
    <MediaControlBar className="MediaControlBar">
      <div className="TopBar">
        <MediaTimeRange className="MediaTimeRange MediaBackground"></MediaTimeRange>
        <MediaTimeDisplay className="MediaTimeDisplay MediaBackground" showDuration></MediaTimeDisplay>
      </div>
      <div className="BottomBar">
        <div className="BottomBarLeft">
          <MediaMuteButton className="MediaBackground">
            <SpeakerCross className="ControlButtons" slot="off"></SpeakerCross>
            <Speaker0 className="ControlButtons" slot="low"></Speaker0>
            <Speaker1 className="ControlButtons" slot="medium"></Speaker1>
            <Speaker2 className="ControlButtons" slot="high"></Speaker2>
          </MediaMuteButton>
          <MediaVolumeRange className="MediaVolumeRange MediaBackground"></MediaVolumeRange>
        </div>

        <div className="BottomBarCenter">
          <MediaSeekBackwardButton className="MediaBackground" seekOffset={15}>
            <RotateLeft className="ControlButtons" slot="backward"></RotateLeft>
          </MediaSeekBackwardButton>
          <MediaPlayButton pause={Pause} play={Play} className="MediaBackground">
            <Pause className="ControlButtons" slot="pause"></Pause>
            <Play className="ControlButtons" slot="play"></Play>
          </MediaPlayButton>
          <MediaSeekForwardButton className="MediaBackground" seekOffset={15}>
            <RotateRight className="ControlButtons" slot="forward"></RotateRight>
          </MediaSeekForwardButton>
        </div>
        <div className="BottomBarRight">
          <MediaPipButton className="MediaBackground"></MediaPipButton>
          <MediaFullscreenButton className="MediaBackground">
            <Fullscreen className="ControlButtons" slot="enter"></Fullscreen>
            <Fullscreen className="ControlButtons" slot="exit"></Fullscreen>
          </MediaFullscreenButton>
        </div>
      </div>
    </MediaControlBar>
  );
};

export default HlsControlBar;
