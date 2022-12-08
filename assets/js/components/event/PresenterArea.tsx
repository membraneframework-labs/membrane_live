import React, { useEffect, useState } from "react";
import {
  connectWebrtc,
  connectPresentersTracks,
  leaveWebrtc,
  presenterStreams,
  askForPermissions,
  updatePresentersMicAndCamStatuses,
} from "../../utils/rtcUtils";
import { syncPresenters } from "../../utils/channelUtils";
import { useRerender } from "../../utils/reactUtils";
import { MembraneWebRTC } from "@membraneframework/membrane-webrtc-js";
import RtcPlayer from "./RtcPlayer";
import ControlPanel from "./ControlPanel";
import type { Presenter, Client, Mode, SourceType, ClientStatus } from "../../types/types";
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
  const rerender = useRerender();

  const disconnectedPresenter: Presenter = {
    name: client.name,
    email: client.email,
    rtcStatus: "disconnected",
    status: "idle",
    connectCallbacks: [],
  };

  const onPresenterReady = () => {
    setClientStatus("connected");

    eventChannel?.push("presenter_ready", {
      email: client.email,
    });
  };

  const refreshPresentersMicAndCamStatus = () => {
    setPresenters((presenters) => {
      return updatePresentersMicAndCamStatuses(presenters);
    });
  };

  const getCurrentPresenter = () => {
    return (
      Object.values(presenters).find((presenter: Presenter) => presenter.email == client.email) || disconnectedPresenter
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
    const clientIsPresenterWithNoMediaStream = clientStatus === "idle" && presenterStreams[client.email] === undefined;
    if (clientIsPresenterWithNoMediaStream) {
      askForPermissions();
      presenterStreams[client.email] = new MediaStream();
    }

    const tryToConnectPresenter = !webrtcConnecting && webrtc == null && clientStatus == "connected";
    const clientShouldDisconnect = webrtc != null && ["idle", "not_presenter"].includes(clientStatus);

    if (clientStatus === "idle") {
      setIsControlPanelAvailable(true);
    } else if (tryToConnectPresenter) {
      setIsControlPanelAvailable(true);
      webrtcConnecting = true;
      connectWebrtc(eventChannel, client, setPresenters, refreshPresentersMicAndCamStatus).then((value) => {
        webrtc = value;
        webrtcConnecting = false;
        refreshPresentersMicAndCamStatus();
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
    (presenter: Presenter) =>
      ["connecting", "rtc_player_ready"].includes(presenter.rtcStatus) || presenter.email == client.email
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
          {visiblePresenters.map((presenter: Presenter) => {
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
          rerender={rerender}
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
