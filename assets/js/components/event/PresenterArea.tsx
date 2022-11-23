import React, { useEffect, useState } from "react";
import {
  connectWebrtc,
  connectPresentersTracks,
  leaveWebrtc,
  presenterArea,
  askForPermissions,
} from "../../utils/rtcUtils";
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

  const idleClient = {
    name: client.name,
    email: client.email,
    status: "idle",
    connectCallbacks: [],
  };

  const onPresenterReady = () => {
    setIsClientPresenting(true);

    eventChannel?.push("presenter_ready", {
      email: client.email,
    });
  };

  const getCurrentPresenter = () => {
    return (
      Object.values(presenters).find((presenter) => presenter.email == client.email) || idleClient
    );
  };

  useEffect(() => {
    const isClientPresenter = client.email in presenters;
    const clientWantsToConnect =
      !webrtcConnecting && webrtc == null && isClientPresenter && isClientPresenting;
    const clientShouldDisconnect = webrtc != null && !isClientPresenter;

    if (isClientPresenter && !isClientPresenting) {
      setIsControlPanelAvailable(true);
    } else if (clientWantsToConnect) {
      webrtcConnecting = true;
      connectWebrtc(eventChannel, client, setPresenters).then((value) => {
        webrtc = value;
        setIsControlPanelAvailable(true);
        webrtcConnecting = false;
      });
    } else if (webrtc != null && clientShouldDisconnect) {
      leaveWebrtc(webrtc, client, eventChannel);
      webrtc = null;
      setIsControlPanelAvailable(false);
    }
  }, [presenters, isClientPresenting]);

  useEffect(() => {
    syncPresenters(eventChannel, setPresenters);
  }, [eventChannel]);

  useEffect(() => {
    connectPresentersTracks(playerCallbacks, setPresenters);
    if (client.email in presenters && presenterArea[client.email] == undefined) {
      askForPermissions();
      presenterArea[client.email] = new MediaStream();
    }
  }, [presenters]);

  const visiblePresenters = Object.values(presenters).filter(
    (presenter) => presenter.status != "idle" || presenter.email == client.email
  );

  const getRtcPlayer = (presenter: Presenter) => {
    return (
      <RtcPlayer
        isMyself={client.email == presenter.email}
        presenter={presenter}
        playerCallbacks={playerCallbacks}
        key={presenter.email}
      />
    );
  };

  return client.email in presenters ? (
    <div className={`PresenterArea ${mode == "hls" ? "Hidden" : ""}`}>
      {isClientPresenting ? (
        <div className={`StreamsGrid Grid${visiblePresenters.length}`}>
          {visiblePresenters.map((presenter) => {
            return getRtcPlayer(presenter);
          })}
        </div>
      ) : (
        getRtcPlayer(getCurrentPresenter())
      )}
      {isControlPanelAvailable && (
        <ControlPanel
          client={client}
          webrtc={webrtc}
          eventChannel={eventChannel}
          playerCallback={playerCallbacks[client.email]}
          setMode={setMode}
          setIsClientPresenting={setIsClientPresenting}
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
