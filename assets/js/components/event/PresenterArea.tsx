import React, { useEffect, useState } from "react";
import {
  connectWebrtc,
  connectPresentersTracks,
  leaveWebrtc,
  presenterStreams,
  askForPermissions,
} from "../../utils/rtcUtils";
import { syncPresenters } from "../../utils/channelUtils";
import { MembraneWebRTC } from "@membraneframework/membrane-webrtc-js";
import RtcPlayer from "./RtcPlayer";
import ControlPanel from "./ControlPanel";
import type { Presenter, Client, Mode, SourceType, ClientStatus } from "../../types";
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
  const [clientStatus, setClientStatus] = useState<ClientStatus>("not_presenter");

  const disconnectedPresenter = {
    name: client.name,
    email: client.email,
    status: "disconnected",
    connectCallbacks: [],
  };

  const onPresenterReady = () => {
    setClientStatus("connected");

    eventChannel?.push("presenter_ready", {
      email: client.email,
    });
  };

  const getCurrentPresenter = () => {
    return (
      Object.values(presenters).find((presenter) => presenter.email == client.email) ||
      disconnectedPresenter
    );
  };

  useEffect(() => {
    if (client.email in presenters === false) {
      setClientStatus("not_presenter");
    } else if (client.email in presenters && clientStatus == "not_presenter") {
      setClientStatus("idle");
    }
  }, [presenters]);

  useEffect(() => {
    connectPresentersTracks(playerCallbacks, setPresenters);

    if (clientStatus != "not_presenter")
      setMode("presenters");

    const clientIsPresenterWithNoMediaStream =
      clientStatus === "idle" && presenterStreams[client.email] === undefined;
    if (clientIsPresenterWithNoMediaStream) {
      askForPermissions();
      presenterStreams[client.email] = new MediaStream();
    }

    const tryToConnectPresenter =
      !webrtcConnecting && webrtc == null && clientStatus == "connected";
    const clientShouldDisconnect =
      webrtc != null && ["idle", "not_presenter"].includes(clientStatus);

    if (clientStatus === "idle") {
      setIsControlPanelAvailable(true);
    } else if (tryToConnectPresenter) {
      setIsControlPanelAvailable(true);
      webrtcConnecting = true;
      connectWebrtc(eventChannel, client, setPresenters).then((value) => {
        webrtc = value;
        webrtcConnecting = false;
      });
    } else if (webrtc != null && clientShouldDisconnect) {
      setIsControlPanelAvailable(false);
      leaveWebrtc(webrtc, client, eventChannel);
      webrtc = null;
    } else if (webrtc != null) {
      setIsControlPanelAvailable(true);
    }
  }, [presenters, clientStatus]);

  useEffect(() => {
    syncPresenters(eventChannel, setPresenters);
  }, [eventChannel]);

  const visiblePresenters = Object.values(presenters).filter(
    (presenter) =>
      ["connecting", "rtc_player_ready"].includes(presenter.rtcStatus) ||
      presenter.email == client.email
  );

  const getRtcPlayer = (presenter: Presenter) => {
    return (
      <RtcPlayer
        isMyself={client.email == presenter.email}
        presenter={presenter}
        playerCallbacks={playerCallbacks}
        key={presenter.email}
        setPresenters={setPresenters}
      />
    );
  };

  return clientStatus != "not_presenter" ? (
    <div className={`PresenterArea ${mode == "hls" ? "Hidden" : ""}`}>
      {clientStatus === "connected" ? (
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
        />
      )}
      {clientStatus === "idle" && (
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
