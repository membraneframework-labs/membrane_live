import React, { useCallback, useContext, useEffect, useState } from "react";
import ModePanel from "./ModePanel";
import PresenterArea from "./PresenterArea";
import HlsPlayer from "./HlsPlayer";
import { Channel } from "phoenix";
import { useHls } from "../../utils/useHls";
import { ScreenTypeContext } from "../../utils/ScreenTypeContext";
import { RotateLeft } from "react-swm-icon-pack";
import { syncAmIPresenter } from "../../utils/modePanelUtils";
import { switchAskingForBeingPresenter } from "../../utils/channelUtils";
import MobileHlsBar from "./MobileHlsBar";
import type { Mode, Client, PlaylistPlayableMessage, Product, ChatMessage, CardStatus } from "../../types/types";
import { MobileRightSidebar } from "./MobileRightSidebar";
import { MobileBottomPanel } from "./MobileBottomPanel";
import "../../../css/event/streamarea.css";
import { useStartStream } from "../../utils/StreamStartContext";
import { config } from "../../utils/const";
import { useAutoHideMobileBottomBar } from "./useAutoHideMobileBottomBar";

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

const StreamArea = ({
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
}: StreamAreaProps) => {
  const [amIPresenter, setAmIPresenter] = useState<boolean>(false);
  const [presenterName, setPresenterName] = useState<string>("");
  const { attachVideo, setSrc } = useHls(true, config);
  const { device, orientation } = useContext(ScreenTypeContext);
  const { setStreamStart } = useStartStream();
  const [card, setCard] = useState<CardStatus>("hidden");
  const showMobileBottomBar = device === "mobile" || orientation === "portrait";

  useAutoHideMobileBottomBar(setCard);

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
        if (setStreamStart) setStreamStart(new Date(Date.parse(message.start_time)));
      } else {
        setSrc("");
        setPresenterName("");
        if (setStreamStart) setStreamStart(new Date(Date.parse(message.start_time)));
      }
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
      {device === "desktop" && (
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
            {presenterName ? (
              <>
                <HlsPlayer
                  attachVideo={attachVideo}
                  presenterName={presenterName}
                  eventChannel={eventChannel}
                  addMessage={undefined}
                />
                {device === "mobile" && (
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
              </>
            ) : (
              <div className="HlsStream">
                <div className="WaitText">
                  <RotateLeft className="RotateIcon" />
                  Waiting for the live stream to start...
                </div>
              </div>
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

        {showMobileBottomBar && (
          <MobileBottomPanel
            eventChannel={eventChannel}
            isChatLoaded={isChatLoaded}
            isBannedFromChat={isBannedFromChat}
            client={client}
            products={products}
            chatMessages={chatMessages}
            card={card}
            eventTitle={eventTitle}
            onBarClick={() => setCard("hidden")}
          />
        )}
      </div>
    </div>
  );
};

export default StreamArea;
