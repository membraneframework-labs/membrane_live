import { useEffect, useState } from "react";
import { connectWebrtc, leaveWebrtc } from "../../utils/rtcUtils";
import { syncPresenters } from "../../utils/channelUtils";
import { useRerender } from "../../utils/reactUtils";
import { MembraneWebRTC } from "@jellyfish-dev/membrane-webrtc-js";
import RtcPlayer from "./RtcPlayer";
import ControlPanel from "./ControlPanel";
import { Channel } from "phoenix";
import type {
  User,
  Client,
  ClientStatus,
  PeersState,
  PresenterStream,
  PresenterPropositionServer,
} from "../../types/types";
import "../../../css/event/presenterarea.css";
import { sessionStorageGetIsPresenter } from "../../utils/storageUtils";
import HeartAnimation from "./animations/HeartAnimation";
import ConfettiAnimation from "./animations/ConfettiAnimation";

const initialPeersState: PeersState = {
  peers: {},
  cameraTrack: undefined,
  sourceIds: { audio: "", video: "" },
  isScreenSharing: false,
  isMainPresenter: false,
};

let webrtc: MembraneWebRTC | null = null;
let webrtcConnecting = false;

type PresenterAreaProps = {
  client: Client;
  privateChannel: Channel | undefined;
  eventChannel: Channel | undefined;
};

const PresenterArea = ({ client, privateChannel, eventChannel }: PresenterAreaProps) => {
  const [presenters, setPresenters] = useState<{ [key: string]: User }>({});
  const [clientStatus, setClientStatus] = useState<ClientStatus>("idle");
  const [peersState, setPeersState] = useState<PeersState>(initialPeersState);

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
    const tryToConnectPresenter = !webrtcConnecting && webrtc == null && clientStatus == "connected";
    const clientShouldDisconnect = (clientStatus == "idle" && webrtc != null) || clientStatus == "disconnected";

    if (tryToConnectPresenter) {
      webrtcConnecting = true;
      connectWebrtc(eventChannel, client, setPeersState).then((value) => {
        webrtc = value;
        webrtcConnecting = false;
      });
    } else if (clientShouldDisconnect) {
      leaveWebrtc(webrtc, client, eventChannel, setPeersState);
      webrtc = null;
    }
  }, [presenters, clientStatus, eventChannel, client, setPeersState]);

  useEffect(() => {
    syncPresenters(eventChannel, setPresenters);
  }, [eventChannel]);

  const getRtcPlayer = (presenterStream: PresenterStream) => {
    return (
      <RtcPlayer
        isMyself={client.email == presenterStream.email}
        presenterStream={presenterStream}
        key={presenterStream.email}
      />
    );
  };

  return (
    <div className="PresenterArea">
      {clientStatus === "connected" ? (
        <div className={`StreamsGrid Grid${Object.values(peersState.peers).length}`}>
          {eventChannel && <ConfettiAnimation eventChannel={eventChannel} />}
          {Object.values(peersState.peers).map((presenterStream) => {
            return getRtcPlayer(presenterStream);
          })}
          {eventChannel && <HeartAnimation eventChannel={eventChannel} />}
        </div>
      ) : clientStatus === "idle" ? (
        getRtcPlayer(getCurrentPresenterStream())
      ) : (
        <></>
      )}
      {clientStatus !== "disconnected" && (
        <ControlPanel
          client={client}
          webrtc={webrtc}
          eventChannel={eventChannel}
          peersState={peersState}
          setPeersState={setPeersState}
          setClientStatus={setClientStatus}
          rerender={rerender}
        />
      )}
      {clientStatus === "idle" && (
        <button className="StartPresentingButton" onClick={onPresenterReady}>
          Start presenting
        </button>
      )}
    </div>
  );
};

export default PresenterArea;
