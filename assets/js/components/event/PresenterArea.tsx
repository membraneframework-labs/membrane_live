import React, { useEffect, useState } from "react";
import { connectWebrtc, leaveWebrtc, presenterArea, askForPermissions } from "../../utils/rtcUtils";
import { syncPresenters } from "../../utils/channelUtils";
import { MembraneWebRTC } from "@membraneframework/membrane-webrtc-js";
import RtcPlayer from "./RtcPlayer";
import ControlPanel from "./ControlPanel";
import type { Presenter, Client, Mode, SourceType } from "../../types";
import "../../../css/event/presenterarea.css";
import { Channel } from "phoenix";

const playerCallbacks: { [key: string]: (sourceType: SourceType) => void } = {};
let webrtc: MembraneWebRTC | null = null;
let webrtcConnecting = false;

type PresenterAreaProps = {
  client: Client;
  eventChannel: Channel | undefined;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
};

const PresenterArea = ({ client, eventChannel, mode, setMode }: PresenterAreaProps) => {
  const [presenters, setPresenters] = useState<{ [key: string]: Presenter }>({});
  const [isControlPanelAvailable, setIsControlPanelAvailable] = useState(false);
  const [isClientPresenting, setIsClientPresenting] = useState(false);

  useEffect(() => {
    const isClientPresenter = client.email in presenters;
    if (isClientPresenter && !isClientPresenting) {
      setIsControlPanelAvailable(true);
    } else if (!webrtcConnecting && webrtc == null && isClientPresenter && isClientPresenting) {
      webrtcConnecting = true;
      connectWebrtc(eventChannel, client, presenters, setPresenters).then((value) => {
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
  }, []);

  useEffect(() => {
    syncPresenters(eventChannel, setPresenters);
  }, [eventChannel]);

  const onPresenterReady = () => {
    setIsClientPresenting(true);

    eventChannel.push("presenter_ready", {
      email: client.email,
    });
  };

  useEffect(() => {
    Object.values(presenters).forEach((presenter) => {
      if (presenter.status == "connecting" && presenter.connectCallbacks.length > 0) {
        const playerCallback = playerCallbacks[presenter.email];
        presenter.connectCallbacks.forEach((callback) => callback(playerCallback));
        setPresenters({
          ...presenters,
          [presenter.email]: { ...presenter, connectCallbacks: [] },
        });
      }
    });
  }, [presenters]);

  const visiblePresenters = Object.values(presenters).filter(
    (presenter) => presenter.status != "idle" || presenter.email == client.email
  );

  return client.email in presenters ? (
    <div className={`PresenterArea ${mode == "hls" ? "Hidden" : ""}`}>
      {isClientPresenting ? (
        <div className={`StreamsGrid Grid${visiblePresenters.length}`}>
          {visiblePresenters.map((presenter) => {
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
      ) : (
        <RtcPlayer
          isMyself={true}
          presenter={
            Object.values(presenters).find((presenter) => presenter.email == client.email) || {
              name: client.name,
              email: client.email,
              status: "idle",
              connectCallbacks: [],
            }
          }
          playerCallbacks={playerCallbacks}
          key={client.email}
        />
      )}
      {isControlPanelAvailable && (
        <ControlPanel
          client={client}
          webrtc={webrtc}
          eventChannel={eventChannel}
          playerCallback={playerCallbacks[client.email]}
          setMode={setMode}
        />
      )}
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
