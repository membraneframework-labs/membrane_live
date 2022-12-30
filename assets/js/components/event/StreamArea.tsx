import React, { useCallback, useContext, useEffect, useState } from "react";
import ModePanel from "./ModePanel";
import PresenterArea from "./PresenterArea";
import HlsPlayer from "./HlsPlayer";
import { Channel } from "phoenix";
import { useHls } from "../../utils/useHls";
import { StreamStartContext } from "../../utils/StreamStartContext";
import { RotateLeft } from "react-swm-icon-pack";
import { syncAmIPresenter } from "../../utils/modePanelUtils";
import { switchAskingForBeingPresenter } from "../../utils/channelUtils";
import MobileHlsBar from "./MobileHlsBar";
import { ScreenTypeContext } from "../../utils/ScreenTypeContext";
import { MobileRightSidebar } from "./MobileRightSidebar";
import { MobileBottomPanel } from "./MobileBottomPanel";
import type { Mode, Client, PlaylistPlayableMessage, Product, ChatMessage, Card } from "../../types/types";
import "../../../css/event/streamarea.css";

const config = {
  liveSyncDurationCount: 2,
  initialLiveManifestSize: 2,
  backBufferLength: 30,
};

type StreamAreaProps = {
  client: Client;
  eventChannel: Channel | undefined;
  privateChannel: Channel | undefined;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  eventTitle: string;
  products: Product[];
  chatMessages: ChatMessage[];
  isChatLoaded: boolean;
  isBannedFromChat: boolean;
};

const StreamArea = (props: StreamAreaProps) => {
  const {
    client,
    eventChannel,
    privateChannel,
    mode,
    setMode,
    eventTitle,
    products,
    chatMessages,
    isChatLoaded,
    isBannedFromChat,
  } = props;
  const [amIPresenter, setAmIPresenter] = useState<boolean>(false);
  const [presenterName, setPresenterName] = useState<string>("");
  const { attachVideo, setSrc } = useHls(true, false, config);
  const screenType = useContext(ScreenTypeContext);
  const { setStreamStart } = useContext(StreamStartContext);
  const [card, setCard] = useState<Card>("hidden");

  const switchAsking = useCallback(
    (isAsking: boolean) => {
      switchAskingForBeingPresenter(eventChannel, client.email, isAsking);
    },
    [eventChannel, client]
  );

  const addHlsUrl = useCallback(
    (message: PlaylistPlayableMessage): void => {
      const link = window.location.href.split("event")[0] + "video/";
      if (message.playlist_idl) {
        setSrc(`${link}${message.playlist_idl}/index.m3u8`);
        setPresenterName(message.name);
      } else {
        setSrc("");
        setPresenterName("");
      }
      if (setStreamStart) setStreamStart(new Date(Date.parse(message.start_time)));
    },
    [setSrc, setStreamStart]
  );

  useEffect(() => {
    if (eventChannel) {
      eventChannel.on("playlistPlayable", (message) => addHlsUrl(message));
      eventChannel.push("isPlaylistPlayable", {}).receive("ok", (message) => addHlsUrl(message));
      syncAmIPresenter(eventChannel, setAmIPresenter, client);
    }
  }, [addHlsUrl, client, eventChannel]);

  useEffect(() => {
    if (privateChannel) {
      privateChannel.on("presenter_remove", () => setMode("hls"));
    }
  }, [privateChannel, setMode]);

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
        {mode == "hls" && (
          <div className="HlsDiv">
            {presenterName ? (
              <HlsPlayer attachVideo={attachVideo} presenterName={presenterName} eventChannel={eventChannel} />
            ) : (
              <div className="HlsStream">
                <div className="WaitText">
                  <RotateLeft className="RotateIcon" />
                  Waiting for the live stream to start...
                </div>
              </div>
            )}
            {screenType.device == "mobile" && (
              <>
                <MobileRightSidebar setCard={setCard} />
                <MobileHlsBar
                  client={client}
                  eventTitle={eventTitle}
                  amIPresenter={amIPresenter}
                  setMode={setMode}
                  switchAsking={switchAsking}
                />
              </>
            )}
          </div>
        )}
        <PresenterArea
          client={client}
          privateChannel={privateChannel}
          eventChannel={eventChannel}
          mode={mode}
          setMode={setMode}
        />

        {screenType.device == "mobile" && (
          <MobileBottomPanel
            eventChannel={eventChannel}
            isChatLoaded={isChatLoaded}
            isBannedFromChat={isBannedFromChat}
            client={client}
            products={products}
            chatMessages={chatMessages}
            card={card}
            onBarClick={() => setCard("hide")}
          />
        )}
      </div>
    </div>
  );
};

export default StreamArea;
