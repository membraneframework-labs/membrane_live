import React, {useEffect, useState} from "react";
import ModePanel from "./ModePanel";
import PresenterArea from "./PresenterArea";
import HlsPlayer from "./HlsPlayer";
import type {Mode, Client} from "../../types/types";
import {Channel} from "phoenix";
import useCheckScreenType from "../../utils/useCheckScreenType";
import "../../../css/event/streamarea.css";
import {MobileRightSidebar} from "./MobileRightSidebar";
import {MobileBottomPanel} from "./MobileBottomPanel";

type StreamAreaProps = {
  client: Client;
  eventChannel: Channel | undefined;
  privateChannel: Channel | undefined;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
};

const StreamArea = ({client, eventChannel, privateChannel, mode, setMode}: StreamAreaProps) => {
  const [hlsUrl, setHlsUrl] = useState<string>("");
  const [presenterName, setPresenterName] = useState<string>("");
  const screenType = useCheckScreenType();

  const addHlsUrl = (message: { name: string; playlist_idl: string }): void => {
    const link = window.location.href.split("event")[0] + "video/";
    if (message.playlist_idl) {
      setHlsUrl(`${link}${message.playlist_idl}/index.m3u8`);
      setPresenterName(message.name);
    } else {
      setHlsUrl("");
      setPresenterName("");
    }
  };

  useEffect(() => {
    if (eventChannel) {
      eventChannel.on("playlistPlayable", (message) => addHlsUrl(message));
      eventChannel.push("isPlaylistPlayable", {}).receive("ok", (message) => addHlsUrl(message));
    }
  }, [eventChannel]);

  useEffect(() => {
    if (privateChannel) {
      privateChannel.on("presenter_remove", () => setMode("hls"));
    }
  }, [privateChannel]);

  const [card, setCard] = useState<string | undefined>("undefined")

  return (
    <div className="StreamArea">
      {screenType.device == "desktop" && (
        <ModePanel
          mode={mode}
          setMode={setMode}
          presenterName={presenterName}
          eventChannel={eventChannel}
          client={client}
        />
      )}
      <div className="Stream">

        <MobileRightSidebar setCard={setCard}/>
        <MobileBottomPanel card={card} onBarClick={() => setCard(undefined)}/>

        {mode == "hls" && <HlsPlayer
          hlsUrl="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
          presenterName={presenterName}
          eventChannel={eventChannel}/>}
        <PresenterArea client={client} eventChannel={eventChannel} mode={mode} setMode={setMode}/>
      </div>
    </div>
  );
};

export default StreamArea;
