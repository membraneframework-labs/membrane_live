import { useEffect, useRef, useState } from "react";
import HlsPlayer from "../components/event/HlsPlayer";
import Header from "../components/event/Header";
import { storageGetName, storageGetEmail, getIsAuthenticated } from "../utils/storageUtils";
import { useHls } from "../utils/useHls";
import ChatBox from "../components/event/ChatBox";
import { useChatMessages } from "../utils/useChatMessages";
import { HlsConfig } from "hls.js";
import { StreamStartContext } from "../utils/StreamStartContext";
import useCheckScreenType from "../utils/useCheckScreenType";
import { getEventInfo, initEventInfo } from "../utils/headerUtils";
import { useToast } from "@chakra-ui/react";
import type { Client, EventInfo } from "../types/types";
import "../../css/recording/recording.css";

const RecordingDummy = () => {
  const toast = useToast();

  const client: Client = {
    name: storageGetName(),
    email: storageGetEmail(),
    isModerator: false,
    isAuthenticated: getIsAuthenticated(),
  };
  const screenType = useCheckScreenType();
  const config = useRef<Partial<HlsConfig>>({
    liveSyncDurationCount: 2,
    initialLiveManifestSize: 2,
    backBufferLength: 30,
  });
  const { attachVideo, setSrc } = useHls(true, true, config.current);
  const { chatMessages, isChatLoaded } = useChatMessages(undefined);

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
            <ChatBox
              client={client}
              eventChannel={undefined}
              messages={chatMessages}
              isChatLoaded={isChatLoaded}
              isBannedFromChat={false}
              isRecording={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const Recording = () => {
  const [streamStart, setStreamStart] = useState<Date | null>(null);

  return (
    <StreamStartContext.Provider value={{ streamStart, setStreamStart }}>
      <RecordingDummy />
    </StreamStartContext.Provider>
  );
};

export default Recording;
