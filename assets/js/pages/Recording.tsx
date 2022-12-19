import HlsPlayer from "../components/event/HlsPlayer";
import Header from "../components/event/Header";
import { storageGetName, storageGetEmail, getIsAuthenticated } from "../utils/storageUtils";
import type { Client } from "../types/types";
import useCheckScreenType from "../utils/useCheckScreenType";

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

  return (
    <div className="EventPage">
      {(screenType.device == "desktop" || screenType.orientation == "portrait") && (
        <Header client={client} eventChannel={undefined} isRecording={true} />
      )}
      {(screenType.device == "desktop" || screenType.orientation == "landscape") && (
        <div className="Stream">
          <HlsPlayer hlsUrl={hlsUrl} presenterName={""} />
        </div>
      )}
    </div>
  );
};

export default Recording;
