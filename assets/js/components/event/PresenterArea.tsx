import { Fragment, useEffect, useState } from "react";
import RtcPlayer from "./RtcPlayer";
import ControlPanel from "./ControlPanel";
import { Channel } from "phoenix";
import { Client, ClientStatus, User, userSchema } from "../../types/types";
import "../../../css/event/presenterarea.css";
import HeartAnimation from "./animations/HeartAnimation";
import ConfettiAnimation from "./animations/ConfettiAnimation";
import { create, Track, TrackId } from "@jellyfish-dev/react-client-sdk";
import { AUDIO_CONSTRAINTS, SCREEN_CONSTRAINTS, VIDEO_CONSTRAINTS } from "../../utils/const";
import { z } from "zod";

const getTrack = (
  sourceType: SourceType,
  tracks: Record<TrackId, Track<TrackMetadata>>
): {
  isDisabled: boolean;
  stream: MediaStream | null;
} => {
  const track = Object.values(tracks).find((track) => track.metadata?.type == sourceType);
  return { isDisabled: !track?.metadata?.enabled, stream: track?.stream || null };
};

type PresenterAreaProps = {
  client: Client;
  presenterToken: string;
  eventChannel: Channel | undefined;
};

const sourceTypeSchema = z.union([z.literal("screenshare"), z.union([z.literal("audio"), z.literal("video")])]);
export type SourceType = z.infer<typeof sourceTypeSchema>;

const trackMetadataSchema = z.object({
  enabled: z.boolean(),
  type: sourceTypeSchema,
});

export type TrackMetadata = z.infer<typeof trackMetadataSchema>;

export const {
  useSelector,
  useDisconnect,
  useConnect,
  useCamera,
  useSetupMedia,
  useMicrophone,
  useScreenshare,
  JellyfishContextProvider,
} = create<User, TrackMetadata>({
  peerMetadataParser: (obj) => userSchema.parse(obj),
  trackMetadataParser: (obj) => trackMetadataSchema.parse(obj),
});

const PresenterArea = ({ client, presenterToken, eventChannel }: PresenterAreaProps) => {
  const [clientStatus, setClientStatus] = useState<ClientStatus>("idle");

  useSetupMedia({
    camera: {
      trackConstraints: VIDEO_CONSTRAINTS,
      defaultTrackMetadata: { type: "video", enabled: true },
      autoStreaming: true,
      preview: false,
    },
    microphone: {
      trackConstraints: AUDIO_CONSTRAINTS,
      defaultTrackMetadata: { type: "audio", enabled: true },
      autoStreaming: true,
      preview: false,
    },
    screenshare: {
      trackConstraints: SCREEN_CONSTRAINTS,
      defaultTrackMetadata: { type: "screenshare", enabled: true },
      autoStreaming: true,
      preview: false,
    },
    startOnMount: true,
  });

  const camera = useCamera();
  const microphone = useMicrophone();
  const screenshare = useScreenshare();
  const peers = useSelector((state) => Object.values(state.remote));
  const rawClient = useSelector((state) => state.connectivity.client);

  useEffect(() => {
    const cb = () => setClientStatus("connected");
    rawClient?.on("joined", cb);

    return () => {
      rawClient?.removeListener("joined", cb);
    };
  }, [setClientStatus, rawClient]);

  const connect = useConnect();

  return (
    <div className="PresenterArea">
      {clientStatus === "connected" ? (
        <div className={`StreamsGrid Grid${Object.values(peers).length}`}>
          {eventChannel && <ConfettiAnimation eventChannel={eventChannel} />}
          {Object.values(peers).map((peer) => {
            const audio = getTrack("audio", peer.tracks);
            const video = getTrack("video", peer.tracks);
            const screenshare = getTrack("screenshare", peer.tracks);

            return (
              <Fragment key={peer.id}>
                {screenshare.stream && (
                  <RtcPlayer
                    isMyself={false}
                    metadata={peer.metadata}
                    videoStream={screenshare.stream || null}
                    audioStream={null}
                    isMuted={false}
                    isCamDisabled={screenshare.isDisabled}
                  />
                )}
                <RtcPlayer
                  isMyself={false}
                  metadata={peer.metadata}
                  videoStream={video?.stream || null}
                  audioStream={audio.stream || null}
                  isMuted={audio.isDisabled}
                  isCamDisabled={video.isDisabled}
                />
              </Fragment>
            );
          })}
          <RtcPlayer
            isMyself={true}
            metadata={client}
            videoStream={camera.stream}
            audioStream={microphone.stream}
            isMuted={!microphone.enabled}
            isCamDisabled={!camera.enabled}
          />
          {screenshare.stream && (
            <RtcPlayer
              isMyself={true}
              metadata={client}
              videoStream={screenshare.stream}
              audioStream={null}
              isMuted={false}
              isCamDisabled={!screenshare.enabled}
            />
          )}
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
        <ControlPanel client={client} eventChannel={eventChannel} setClientStatus={setClientStatus} />
      )}
      {clientStatus === "idle" && (
        <button
          className="StartPresentingButton"
          onClick={() => connect({ peerMetadata: client, token: presenterToken })}
        >
          Start presenting
        </button>
      )}
    </div>
  );
};

export default PresenterArea;
