import React, { useCallback, useContext, useEffect, useState } from "react";
import ModePanel from "./ModePanel";
import PresenterArea from "./PresenterArea";
import HlsPlayer from "./HlsPlayer";
import { Channel } from "phoenix";
import { ScreenTypeContext } from "../../utils/ScreenTypeContext";
import { RotateLeft } from "react-swm-icon-pack";
import { switchAskingForBeingPresenter } from "../../utils/channelUtils";
import MobileHlsBar from "./MobileHlsBar";
import { MobileRightSidebar } from "./MobileRightSidebar";
import { MobileBottomPanel } from "./MobileBottomPanel";
import { useAutoHideMobileBottomBar } from "../../utils/useAutoHideMobileBottomBar";
import type { Mode, Client, PlaylistPlayableMessage, Product, ChatMessage, CardStatus } from "../../types/types";
import { useStartStream } from "../../utils/StreamStartContext";
import { config } from "../../utils/const";
import { useAutoHideMobileBottomBar } from "./useAutoHideMobileBottomBar";

import "../../../css/event/streamarea.css";

type StreamAreaProps = {
  client: Client;
  amIPresenter: boolean;
  presenterName: string;
  eventChannel: Channel | undefined;
  privateChannel: Channel | undefined;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  eventTitle: string;
  products: Product[];
  chatMessages: ChatMessage[];
  isChatLoaded: boolean;
  isBannedFromChat: boolean;
  attachVideo: (videoElem: HTMLVideoElement | null) => void;
  enablePictureInPicture: () => void;
};

const StreamArea = ({
  client,
  amIPresenter,
  presenterName,
  eventChannel,
  privateChannel,
  mode,
  setMode,
  eventTitle,
  products,
  chatMessages,
  isChatLoaded,
  isBannedFromChat,
  attachVideo,
  enablePictureInPicture,
}: StreamAreaProps) => {
  const { device, orientation } = useContext(ScreenTypeContext);
  const [card, setCard] = useState<CardStatus>("hidden");
  const showMobileBottomBar = device === "mobile" || orientation === "portrait";

  useAutoHideMobileBottomBar(setCard);

  const switchAsking = useCallback(
    (isAsking: boolean) => {
      switchAskingForBeingPresenter(eventChannel, client.email, isAsking);
    },
    [eventChannel, client]
  );

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
                  setCard={setCard}
                />
                {device == "mobile" && (
                  <MobileHlsBar
                    client={client}
                    eventTitle={eventTitle}
                    amIPresenter={amIPresenter}
                    setMode={setMode}
                    switchAsking={switchAsking}
                  />
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
            enablePictureInPicture={enablePictureInPicture}
          />
        )}
      </div>
    </div>
  );
};

export default StreamArea;
