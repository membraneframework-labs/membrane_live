import React, {useCallback, useEffect, useState} from "react";
import ModePanel from "./ModePanel";
import PresenterArea from "./PresenterArea";
import HlsPlayer from "./HlsPlayer";
import type {Client, Mode} from "../../types/types";
import {Channel} from "phoenix";
import useCheckScreenType from "../../utils/useCheckScreenType";
import "../../../css/event/streamarea.css";
import {syncAmIPresenter} from "../../utils/modePanelUtils";

import {switchAskingForBeingPresenter} from "../../utils/channelUtils";
import MobileHlsBar from "./MobileHlsBar";
import {MobileRightSidebar} from "./MobileRightSidebar";
import {MobileBottomPanel} from "./MobileBottomPanel";

type StreamAreaProps = {
  client: Client;
  eventChannel: Channel | undefined;
  privateChannel: Channel | undefined;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  eventTitle: string;
};

const StreamArea = (props: StreamAreaProps) => {
  const {
    client,
    eventChannel,
    privateChannel,
    mode,
    setMode,
    eventTitle
  } = props;
  const [hlsUrl, setHlsUrl] = useState<string>("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");
  const [amIPresenter, setAmIPresenter] = useState<boolean>(false);
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
      // eventChannel.on("playlistPlayable", (message) => addHlsUrl(message));
      // eventChannel.push("isPlaylistPlayable", {}).receive("ok", (message) => addHlsUrl(message));
      syncAmIPresenter(eventChannel, setAmIPresenter, client);
    }
  }, [eventChannel, client]);

  useEffect(() => {
    if (privateChannel) {
      privateChannel.on("presenter_remove", () => setMode("hls"));
    }
  }, [privateChannel, setMode]);

  const [card, setCard] = useState<string>("HIDDEN")

  const switchAsking = useCallback((isAsking: boolean) => {
    switchAskingForBeingPresenter(eventChannel, client.email, isAsking);
  }, [eventChannel, client])

  useEffect(() => {
    let counter = 0
    const id = setInterval(() => {
      // setCard("elloo" + counter++)
    }, 3000)
    return () => {
      clearInterval(id)
    }
  }, [])

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
        {mode === "hls" && (
          <div className="HlsDiv">
            <HlsPlayer hlsUrl={hlsUrl} presenterName={presenterName} eventChannel={eventChannel}/>
            {screenType.device == "mobile" && (
              <MobileHlsBar
                client={client}
                eventTitle={eventTitle}
                amIPresenter={amIPresenter}
                setMode={setMode}
                switchAsking={switchAsking}
              />
            )}
          </div>
        )}
        <PresenterArea client={client} eventChannel={eventChannel} mode={mode} setMode={setMode}/>

        <MobileRightSidebar setCard={setCard}/>
        <MobileBottomPanel card={card} onBarClick={() => setCard("HIDE")}/>
      </div>
    </div>
  );
};

export default StreamArea;
