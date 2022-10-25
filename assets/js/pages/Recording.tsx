import React, { useEffect } from "react";
import HlsPlayer from "../components/event/HlsPlayer";
import Header from "../components/event/Header";
import { storageGetName, storageGetEmail, getIsAuthenticated } from "../utils/storageUtils";
import type { Client } from "../types";
import { logOut } from "../utils/dashboardUtils";
import useCheckScreenType from "../utils/hooks";

const Recording = () => {
  const client: Client = {
    name: storageGetName(),
    email: storageGetEmail(),
    isModerator: false,
    isAuthenticated: getIsAuthenticated(),
  };
  const splitUrl = window.location.pathname.split("/");
  const hlsUrl = `${splitUrl[0]}/video/${splitUrl[2]}/index.m3u8`;
  const screenType = useCheckScreenType();

  useEffect(() => {
    if (screenType.device == "mobile" && localStorage.getItem("email")) {
      logOut();
    }
  }, [screenType]);

  return (
    <div className="EventPage">
      {(screenType.device == "normal" || screenType.orientation == "portrait") && (
        <Header client={client} eventChannel={undefined} isRecording={true} />
      )}
      {(screenType.device == "normal" || screenType.orientation == "landscape") && 
      <div className="Stream">
        <HlsPlayer hlsUrl={hlsUrl} presenterName={""} />
      </div>
      }     
    </div>
  );
};

export default Recording;
