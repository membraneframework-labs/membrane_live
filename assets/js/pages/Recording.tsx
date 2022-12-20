import { useEffect, useState } from "react";
import HlsPlayer from "../components/event/HlsPlayer";
import Header from "../components/event/Header";
import { storageGetName, storageGetEmail, getIsAuthenticated } from "../utils/storageUtils";
import type { Client, EventInfo } from "../types/types";
import useCheckScreenType from "../utils/useCheckScreenType";
import { getEventInfo, initEventInfo } from "../utils/headerUtils";
import { useToast } from "@chakra-ui/react";

import "../../css/recording/recording.css";

const Recording = () => {
  const toast = useToast();

  const client: Client = {
    name: storageGetName(),
    email: storageGetEmail(),
    isModerator: false,
    isAuthenticated: getIsAuthenticated(),
  };
  const splitUrl = window.location.pathname.split("/");
  const hlsUrl = `${splitUrl[0]}/video/${splitUrl[2]}/index.m3u8`;
  const screenType = useCheckScreenType();

  const [eventInfo, setEventInfo] = useState<EventInfo>(initEventInfo());

  useEffect(() => getEventInfo(toast, setEventInfo, true), [toast]);

  return (
    <div className="EventPage">
      {(screenType.device == "desktop" || screenType.orientation == "portrait") && (
        <Header client={client} eventChannel={undefined} isRecording={true} eventInfo={eventInfo} />
      )}
      <div className="Stream">
        <div className="HlsDiv">
          <HlsPlayer hlsUrl={hlsUrl} presenterName={""} />
          {screenType.device === "mobile" && screenType.orientation === "landscape" && (
            <div className="MobileHlsBar">
              <div className="Title"> {eventInfo.title} </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recording;
