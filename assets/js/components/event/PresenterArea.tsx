import { useState } from "react";
import RtcPlayer from "./RtcPlayer";
import ControlPanel from "./ControlPanel";
import { Channel } from "phoenix";
import type {
  Client,
  ClientStatus,
  SourceType,
  User,
} from "../../types/types";
import "../../../css/event/presenterarea.css";
import HeartAnimation from "./animations/HeartAnimation";
import ConfettiAnimation from "./animations/ConfettiAnimation";
import { create } from "@jellyfish-dev/react-client-sdk";
import { AUDIO_CONSTRAINTS, SCREEN_CONSTRAINTS, VIDEO_CONSTRAINTS } from "../../utils/const";

type PresenterAreaProps = {
  client: Client;
  presenterToken: string;
  eventChannel: Channel | undefined;
};

export type TrackMetadata = { enabled: boolean, type: string };

export const { useApi, useSelector, useStatus, useDisconnect, useConnect, useCamera, useSetupMedia, useMicrophone, useScreenshare, JellyfishContextProvider } = create<
  User,
  TrackMetadata
>();

const PresenterArea = ({ client, presenterToken, eventChannel}: PresenterAreaProps) => {
  const [clientStatus, setClientStatus] = useState<ClientStatus>("idle");

  useSetupMedia({ 
    camera: { trackConstraints: VIDEO_CONSTRAINTS, defaultTrackMetadata: { type: "video", enabled: true }, autoStreaming: true}, 
    microphone: { trackConstraints: AUDIO_CONSTRAINTS, defaultTrackMetadata: { type: "audio", enabled: true }, autoStreaming: true},
    screenshare: { trackConstraints: SCREEN_CONSTRAINTS, defaultTrackMetadata: { type: "screenshare", enabled: true }},
    startOnMount: true,
  });

  const camera = useCamera();
  const microphone = useMicrophone();
  const peers = useSelector((state) => Object.values(state.remote));

  const connect = useConnect();

  const onPresenterReady = () => {
    setClientStatus("connected");
    connect({ peerMetadata: client, token: presenterToken });
  }

  return (
    <div className="PresenterArea">
      {clientStatus === "connected" ? (
        <div className={`StreamsGrid Grid${Object.values(peers).length}`}>
          {eventChannel && <ConfettiAnimation eventChannel={eventChannel} />}
          {Object.values(peers).map((peer) => {
            const isSourceDisabled = (sourceType: SourceType) => {
              const track = Object.values(peer.tracks).find((track) => track.metadata?.type == sourceType);;
              const isEnabled = track?.metadata?.enabled;

              return isEnabled === false;
            };

            const tracks = Object.values(peer.tracks);
            const videoStream = tracks.find((track) => track.metadata?.type == "video")?.stream;
            const audioStream = tracks.find((track) => track.metadata?.type == "audio")?.stream;

            const isMuted = isSourceDisabled("audio");
            const isCamDisabled = isSourceDisabled("video");

            return <RtcPlayer
              isMyself={false}
              metadata={peer.metadata}
              videoStream={videoStream || null}
              audioStream={audioStream || null}
              isMuted={isMuted}
              isCamDisabled={isCamDisabled}
              key={peer.id}
            />
          }
          )}
          <RtcPlayer
            isMyself={true}
            metadata={client}
            videoStream={camera.stream}
            audioStream={microphone.stream}
            isMuted={!microphone.enabled}
            isCamDisabled={!camera.enabled}
          />
          {eventChannel && <HeartAnimation eventChannel={eventChannel} />}
        </div>
      ) : clientStatus === "idle" ? (
        <RtcPlayer
          isMyself={true}
          metadata={client}
          videoStream={camera.stream}
          audioStream={microphone.stream}
          isMuted={!microphone.enabled}
          isCamDisabled={!camera.enabled}
        />
      ) : (
        <></>
      )}
      {clientStatus !== "disconnected" && (
        <ControlPanel
          client={client}
          eventChannel={eventChannel}
          setClientStatus={setClientStatus}
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
