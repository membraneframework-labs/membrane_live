import React, { useEffect, useState } from "react";
import { connectWebrtc, leaveWebrtc, SourceType, SourcesInfo, presenterArea, askForPermissions, setSourceById} from "../../utils/rtcUtils";
import { syncPresenters } from "../../utils/channelUtils";
import { MembraneWebRTC } from "@membraneframework/membrane-webrtc-js";
import RtcPlayer from "./RtcPlayer";
import ControlPanel from "./ControlPanel";
import type { Presenter, Client, Mode } from "../../types";
import "../../../css/event/presenterarea.css";
import { Channel } from "phoenix";

const playerCallbacks: { [key: string]: (sourceType: SourceType) => void } = {};
let webrtc: MembraneWebRTC | null = null;
let webrtcConnecting = false;

const includesKey = (storage: Presenter[], key: string): boolean => {
  return storage.some((e) => e.email === key);
};

type PresenterAreaProps = {
  client: Client;
  eventChannel: Channel | undefined;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
};

const PresenterArea = ({ client, eventChannel, mode, setMode }: PresenterAreaProps) => {
  const [presenters, setPresenters] = useState<Presenter[]>([]);
  const [isControlPanelAvailable, setIsControlPanelAvailable] = useState(false);
  const [isClientPresenting, setIsClientPresenting] = useState(false);
  const [chosenSources, setChosenSources] = useState<SourcesInfo>(
    { audio: undefined, video: undefined, enabled: {video: true, audio: true}});

  useEffect(() => {
    const isClientPresenter = includesKey(presenters, client.email);
    if (isClientPresenter && !isClientPresenting) {
      setIsControlPanelAvailable(true);
    } else if (!webrtcConnecting && webrtc == null && isClientPresenter && isClientPresenting) {
      console.log("Connecting to presenter");
      webrtcConnecting = true;
      connectWebrtc(eventChannel, client, playerCallbacks, chosenSources).then((value) => {
        webrtc = value;
        setIsControlPanelAvailable(true);
        webrtcConnecting = false;
      });
    } else if (webrtc != null && !isClientPresenter) {
      leaveWebrtc(webrtc, client, eventChannel);
      webrtc = null;
      setIsControlPanelAvailable(false);
    }
  }, [presenters, isClientPresenting]);

  useEffect(() => {
    askForPermissions();
    presenterArea[client.email] = new MediaStream();
    
    console.log("sources", chosenSources);

    if (chosenSources.audio && chosenSources.enabled.audio)
      setSourceById(client, chosenSources.audio.deviceId, "audio", playerCallbacks[client.email]);

    if (chosenSources.video && chosenSources.enabled.video)
      setSourceById(client, chosenSources.video.deviceId, "video", playerCallbacks[client.email]);
  }, [chosenSources]);

  useEffect(() => {
    syncPresenters(eventChannel, setPresenters);
  }, [eventChannel]);

  const onPresenterReady = () => {
    setIsClientPresenting(true);
  
    console.log("presenter_ready push");
    eventChannel.push("presenter_ready", {
      email: client.email,
      // moderatorTopic: moderatorTopic,
    });
  };

  return includesKey(presenters, client.email) ? (
    <div className={`PresenterArea ${mode == "hls" ? "Hidden" : ""}`}>
      <div className={`StreamsGrid Grid${presenters.length}`}>
        {presenters.map((presenter) => {
          return (
            <RtcPlayer
              isMyself={client.email == presenter.email}
              presenter={presenter}
              playerCallbacks={playerCallbacks}
              key={presenter.email}
            />
          );
        })}
      </div>
      {isControlPanelAvailable && (
        <ControlPanel
          client={client}
          webrtc={webrtc}
          eventChannel={eventChannel}
          playerCallback={playerCallbacks[client.email]}
          setMode={setMode}
          chosenSources={chosenSources}
          setChosenSources={setChosenSources}
        />)}
      {!isClientPresenting && (
        <button className="StartPresentingButton" onClick={onPresenterReady}>
        Start presenting
    </button>
      )}
    </div>
  ) : (
    <></>
  );
};

export default PresenterArea;
