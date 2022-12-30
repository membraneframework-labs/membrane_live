import { useContext, useEffect, useRef, useState } from "react";
import HlsPlayer from "../components/event/HlsPlayer";
import Header from "../components/event/Header";
import { storageGetName, storageGetEmail, getIsAuthenticated } from "../utils/storageUtils";
import { useHls } from "../utils/useHls";
import ChatBox from "../components/event/ChatBox";
import { useChatMessages } from "../utils/useChatMessages";
import { HlsConfig } from "hls.js";
import { StreamStartContext } from "../utils/StreamStartContext";
import { getEventInfo, initEventInfo } from "../utils/headerUtils";
import { useToast } from "@chakra-ui/react";
import { ScreenTypeContext } from "../utils/ScreenTypeContext";
import type { Client, EventInfo } from "../types/types";
import "../../css/recording/recording.css";

const Recording = () => {
  const toast = useToast();

  const client: Client = {
    name: storageGetName(),
    email: storageGetEmail(),
    isModerator: false,
    isAuthenticated: getIsAuthenticated(),
  };
  const screenType = useContext(ScreenTypeContext);
  const config = useRef<Partial<HlsConfig>>({
    liveSyncDurationCount: 2,
    initialLiveManifestSize: 2,
    backBufferLength: 30,
  });
  const { attachVideo, setSrc } = useHls(true, true, config.current);
  const [streamStart, setStreamStart] = useState<Date | null>(null);
  const { chatMessages, isChatLoaded } = useChatMessages(undefined, streamStart);

  useEffect(() => {
    const splitUrl = window.location.pathname.split("/");
    setSrc(`${splitUrl[0]}/video/${splitUrl[2]}/index.m3u8`);
  }, [setSrc]);

  const [eventInfo, setEventInfo] = useState<EventInfo>(initEventInfo());

  useEffect(() => getEventInfo(toast, setEventInfo, true), [toast]);

  return (
    <div className="EventPage">
      {(screenType.device == "desktop" || screenType.orientation == "portrait") && (
        <Header client={client} eventChannel={undefined} isRecording={true} eventInfo={eventInfo} />
      )}
      <div className="MainGrid">
        <div className="Stream">
          <div className="HlsDiv">
            <HlsPlayer attachVideo={attachVideo} presenterName="" eventChannel={undefined} />
            {screenType.device === "mobile" && screenType.orientation === "landscape" && (
              <div className="MobileHlsBar">
                <div className="Title"> {eventInfo.title} </div>
              </div>
            )}
          </div>
        </div>
        {screenType.device == "desktop" && (
          <div className="Participants">
            <StreamStartContext.Provider value={{ streamStart, setStreamStart }}>
              <ChatBox
                client={client}
                eventChannel={undefined}
                messages={chatMessages}
                isChatLoaded={isChatLoaded}
                isBannedFromChat={false}
                isRecording={true}
              />
            </StreamStartContext.Provider>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recording;
