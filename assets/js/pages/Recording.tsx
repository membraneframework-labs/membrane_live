import React from "react";
import HlsPlayer from "../components/event/HlsPlayer";
import Header from "../components/event/Header";
import { storageGetName, storageGetEmail } from "../utils/storageUtils";
import type { Client } from "../types";

const Recording = () => {
  const client: Client = {
    name: storageGetName(),
    email: storageGetEmail(),
    isModerator: false,
  };
  const splitUrl = window.location.pathname.split("/");
  // const hlsUrl = `${splitUrl[0]}/video/${splitUrl[2]}/index.m3u8`;
  const hlsUrl = `${splitUrl[0]}/video/5cbbe570-f119-45c7-95b5-49af6b385c7e/index.m3u8`; // TODO: temporary, should be as above

  return (
    <div className="EventPage">
      <Header client={client} eventChannel={null} isRecording={true} />
      <div className="Stream">
        <HlsPlayer hlsUrl={hlsUrl} presenterName={""} />
      </div>
    </div>
  );
};

export default Recording;
