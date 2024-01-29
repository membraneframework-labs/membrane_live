import { useCallback, useContext, useEffect, useState } from "react";
import ModePanel from "./ModePanel";
import PresenterArea, { JellyfishContextProvider } from "./PresenterArea";
import HlsPlayer from "./HlsPlayer";
import { Channel } from "phoenix";
import { ScreenTypeContext } from "../../utils/ScreenTypeContext";
import { RotateLeft } from "react-swm-icon-pack";
import { switchAskingForBeingPresenter } from "../../utils/channelUtils";
import MobileHlsBar from "./MobileHlsBar";
import { MobileBottomPanel } from "./MobileBottomPanel";
import { useAutoHideMobileBottomBar } from "../../utils/useAutoHideMobileBottomBar";
import type { Client, ChatMessage, CardStatus, EventInfo, PlaylistPlayableMessage } from "../../types/types";

import "../../../css/event/streamarea.css";
import { liveConfig } from "../../utils/const";
import { useStartStream } from "../../utils/StreamStartContext";
import { useHls } from "../../utils/useHls";

type StreamAreaProps = {
  client: Client;
  amIPresenter: boolean;
  eventChannel: Channel | undefined;
  eventInfo: EventInfo;
  chatMessages: ChatMessage[];
  isChatLoaded: boolean;
  isBannedFromChat: boolean;
  presenterToken: string | undefined;
};

const StreamArea = ({
  client,
  amIPresenter,
  eventChannel,
  eventInfo,
  chatMessages,
  isChatLoaded,
  isBannedFromChat,
  presenterToken,
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

  const [presenterName, setPresenterName] = useState<string>("");
  const { setStreamStart } = useStartStream();
  const { attachVideo, setSrc } = useHls(true, liveConfig);

  const addHlsUrl = useCallback(
    (message: PlaylistPlayableMessage): void => {
      if (message.playlist_ready && !amIPresenter) {
        setSrc(message.link);
        setPresenterName(message.name);
        if (setStreamStart) setStreamStart(new Date(Date.parse(message.start_time)));
      } else {
        setSrc("");
        setPresenterName("");
        if (setStreamStart) setStreamStart(new Date(Date.parse(message.start_time)));
      }
    },
    [setSrc, setStreamStart, amIPresenter]
  );

  useEffect(() => {
    if (eventChannel) {
      eventChannel.on("playlistPlayable", (message) => addHlsUrl(message));
      eventChannel.push("isPlaylistPlayable", {}).receive("ok", (message) => {
        addHlsUrl(message);
      });
    }
  }, [eventChannel, addHlsUrl]);

  return (
    <div className="StreamArea">
      {device === "desktop" && (
        <ModePanel presenterName={presenterName} eventChannel={eventChannel} amIPresenter={amIPresenter} />
      )}
      <div className="Stream">
        {amIPresenter && presenterToken ? (
          <JellyfishContextProvider>
            <PresenterArea client={client} eventChannel={eventChannel} presenterToken={presenterToken} />
          </JellyfishContextProvider>
        ) : (
          <div className="HlsDiv">
            {presenterName ? (
              <>
                <HlsPlayer
                  presenterName={presenterName}
                  eventChannel={eventChannel}
                  addMessage={undefined}
                  setCard={setCard}
                  attachVideo={attachVideo}
                />
                {device === "mobile" && (
                  <MobileHlsBar
                    client={client}
                    eventTitle={eventInfo.title}
                    amIPresenter={amIPresenter}
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

        {showMobileBottomBar && (
          <MobileBottomPanel
            eventChannel={eventChannel}
            isChatLoaded={isChatLoaded}
            isBannedFromChat={isBannedFromChat}
            client={client}
            chatMessages={chatMessages}
            card={card}
            eventTitle={eventInfo.title}
            onBarClick={() => setCard("hidden")}
          />
        )}
      </div>
    </div>
  );
};

export default StreamArea;
