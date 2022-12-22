import React, { useEffect, useState } from "react";
import { connectWebrtc, leaveWebrtc } from "../../utils/rtcUtils";
import { syncPresenters } from "../../utils/channelUtils";
import { useRerender } from "../../utils/reactUtils";
import { MembraneWebRTC } from "@membraneframework/membrane-webrtc-js";
import RtcPlayer from "./RtcPlayer";
import ControlPanel from "./ControlPanel";
import { Channel } from "phoenix";
import type {
  User,
  Client,
  Mode,
  ClientStatus,
  PeersState,
  PresenterStream,
  PresenterPropositionServer,
} from "../../types/types";
import "../../../css/event/presenterarea.css";
import { sessionStorageGetIsPresenter } from "../../utils/storageUtils";

let webrtc: MembraneWebRTC | null = null;
let webrtcConnecting = false;

const initialPeersState: PeersState = {
  mergedScreenRef: {
    screenTrack: undefined,
    cameraTrack: undefined,
    deviceName: "",
    refreshId: undefined,
  },
  peers: {},
  sourceIds: { audio: "", video: "" },
  isMainPresenter: false,
};

type PresenterAreaProps = {
  client: Client;
  privateChannel: Channel | undefined;
  eventChannel: Channel | undefined;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
};

const PresenterArea = ({ client, privateChannel, eventChannel, mode, setMode }: PresenterAreaProps) => {
  const [presenters, setPresenters] = useState<{ [key: string]: User }>({});
  const [peersState, setPeersState] = useState<PeersState>(initialPeersState);
  const [isControlPanelAvailable, setIsControlPanelAvailable] = useState(false);
  const [clientStatus, setClientStatus] = useState<ClientStatus>("not_presenter");
  const rerender = useRerender();

  const disconnectedPresenterStream: PresenterStream = { ...client, stream: new MediaStream() };

  const getCurrentPresenterStream = () => {
    return (
      Object.values(peersState.peers).find(
        (presenterStream: PresenterStream) => presenterStream.email == client.email
      ) || disconnectedPresenterStream
    );
  };

  const onPresenterReady = () => {
    setClientStatus("connected");

    eventChannel?.push("presenter_ready", {
      email: client.email,
    });
  };

  useEffect(() => {
    if (privateChannel) {
      const ref = privateChannel.on("presenter_prop", (message: PresenterPropositionServer) =>
        setPeersState((prev) => {
          return { ...prev, isMainPresenter: message.main_presenter };
        })
      );
      privateChannel
        .push("am_i_main_presenter", { is_presenter: sessionStorageGetIsPresenter() })
        .receive("ok", (message: { main_presenter: boolean }) =>
          setPeersState((prev) => {
            return { ...prev, isMainPresenter: message.main_presenter };
          })
        );

      return () => privateChannel?.off("presenter_prop", ref);
    }
  }, [privateChannel]);

  useEffect(() => {
    if (client.email in presenters === false) {
      setClientStatus("not_presenter");
    } else if (client.email in presenters && clientStatus == "not_presenter") {
      setClientStatus("idle");
    }
  }, [client.email, clientStatus, presenters]);

  useEffect(() => {
    const tryToConnectPresenter = !webrtcConnecting && webrtc == null && clientStatus == "connected";
    const clientShouldDisconnect = webrtc != null && ["idle", "not_presenter"].includes(clientStatus);

    if (clientStatus === "idle") {
      setIsControlPanelAvailable(true);
    } else if (tryToConnectPresenter) {
      setIsControlPanelAvailable(true);
      webrtcConnecting = true;
      connectWebrtc(eventChannel, client, setPeersState).then((value) => {
        webrtc = value;
        webrtcConnecting = false;
      });
    } else if (webrtc != null && clientShouldDisconnect) {
      setIsControlPanelAvailable(false);
      leaveWebrtc(webrtc, client, eventChannel, setPeersState);
      webrtc = null;
    } else if (webrtc != null) {
      setIsControlPanelAvailable(true);
    }
  }, [presenters, clientStatus, peersState, eventChannel, client]);

  useEffect(() => {
    syncPresenters(eventChannel, setPresenters);
  }, [eventChannel]);

  useEffect(() => {
    if (clientStatus != "not_presenter") setMode("presenters");
  }, [clientStatus, setMode]);

  const getRtcPlayer = (presenterStream: PresenterStream) => {
    return (
      <RtcPlayer
        isMyself={client.email == presenterStream.email}
        presenterStream={presenterStream}
        key={presenterStream.email}
      />
    );
  };

  return clientStatus != "not_presenter" ? (
    <div className={`PresenterArea ${mode == "hls" ? "Hidden" : ""}`}>
      {clientStatus === "connected" ? (
        <div className={`StreamsGrid Grid${Object.values(peersState.peers).length}`}>
          {Object.values(peersState.peers).map((presenterStream) => {
            return getRtcPlayer(presenterStream);
          })}
        </div>
      ) : client.email in peersState.peers ? (
        getRtcPlayer(getCurrentPresenterStream())
      ) : (
        <></>
      )}
      {isControlPanelAvailable && (
        <ControlPanel
          client={client}
          webrtc={webrtc}
          eventChannel={eventChannel}
          setMode={setMode}
          peersState={peersState}
          setPeersState={setPeersState}
          canShareScreen={clientStatus === "connected"}
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
