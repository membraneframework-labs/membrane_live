import HlsPlayer from "../components/event/HlsPlayer";
import Header from "../components/event/Header";
import { storageGetName, storageGetEmail, getIsAuthenticated } from "../utils/storageUtils";
import useCheckScreenType from "../utils/useCheckScreenType";
import { useHls } from "../utils/useHls";
import { useEffect } from "react";
import type { Client } from "../types/types";
import ChatBox from "../components/event/ChatBox";

const Recording = () => {
  const client: Client = {
    name: storageGetName(),
    email: storageGetEmail(),
    isModerator: false,
    isAuthenticated: getIsAuthenticated(),
  };
  const splitUrl = window.location.pathname.split("/");
  const screenType = useCheckScreenType();
  const { attachVideo, setSrc } = useHls(true, {
    liveSyncDurationCount: 2,
    initialLiveManifestSize: 2,
    backBufferLength: 30,
  });

  useEffect(() => {
    setSrc(`${splitUrl[0]}/video/${splitUrl[2]}/index.m3u8`);
  });

  return (
    <div className="EventPage">
      {(screenType.device == "desktop" || screenType.orientation == "portrait") && (
        <Header client={client} eventChannel={undefined} isRecording={true} />
      )}
      {(screenType.device == "desktop" || screenType.orientation == "landscape") && (
        <div className="MainGrid">
          <div className="Stream">
            <HlsPlayer attachVideo={attachVideo} presenterName="" eventChannel={undefined} />
          </div>
          {screenType.device == "desktop" && (
            <div className="Participants">
              <ChatBox
                client={client}
                eventChannel={undefined}
                messages={[]}
                isChatLoaded={false}
                isBannedFromChat={false}
                isRecording={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Recording;
