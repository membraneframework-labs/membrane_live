import { useContext, useEffect, useState } from "react";
import HlsPlayer from "../components/event/HlsPlayer";
import Header from "../components/event/Header";
import { storageGetName, storageGetEmail, getIsAuthenticated } from "../utils/storageUtils";
import { useHls } from "../utils/useHls";
import ChatBox from "../components/event/ChatBox";
import { StreamStartProvider } from "../utils/StreamStartContext";
import { ScreenTypeContext } from "../utils/ScreenTypeContext";
import { getEventInfo, initEventInfo } from "../utils/headerUtils";
import { useToast } from "@chakra-ui/react";
import { useRecordingChatMessages } from "../utils/useRecordingChatMessages";
import type { Client, EventInfo } from "../types/types";
import "../../css/recording/recording.css";
import { config } from "../utils/const";

const Recording = () => {
  const toast = useToast();

  const client: Client = {
    name: storageGetName(),
    email: storageGetEmail(),
    isModerator: false,
    isAuthenticated: getIsAuthenticated(),
  };
  const screenType = useContext(ScreenTypeContext);
  const { chatMessages, isChatLoaded, addMessage } = useRecordingChatMessages();
  const { attachVideo, setSrc } = useHls(true, config);

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
            <HlsPlayer attachVideo={attachVideo} addMessage={addMessage} presenterName="" eventChannel={undefined} />
            {screenType.device === "mobile" && screenType.orientation === "landscape" && (
              <div className="MobileHlsBar">
                <div className="Title"> {eventInfo.title} </div>
              </div>
            )}
          </div>
        </div>
        {screenType.device == "desktop" && (
          <div className="Participants">
            <StreamStartProvider>
              <ChatBox
                client={client}
                eventChannel={undefined}
                messages={chatMessages}
                isChatLoaded={isChatLoaded}
                isBannedFromChat={false}
                isRecording={true}
              />
            </StreamStartProvider>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recording;
