import { MembraneWebRTC, SerializedMediaEvent } from "@membraneframework/membrane-webrtc-js";
import { SourceType } from "../components/ControlPanel";
import {
  addPresenterMediaStream,
  findTrackBySource,
  presenterStreams,
} from "../components/PresenterStreamArea";

export const AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: true,
  video: false,
};

export const VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: { width: 1280, height: 720, frameRate: 24 },
};

const currentTracks: { audio: string | null; video: string | null } = { audio: null, video: null };

export const connectWebrtc = async (
  webrtcChannel: any,
  clientName: string,
  streamsAvailable: { [key: string]: boolean },
  setStreamsAvailable: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>
) => {
  const removeStream = (name: string) => {
    delete presenterStreams[name];
    setStreamsAvailable({ ...streamsAvailable, ...{ [name]: false } });
  };

  const onError = (error: any) => {
    alert("ERROR " + error);
    webrtc.leave();
  };

  const webrtc = new MembraneWebRTC({
    callbacks: {
      onSendMediaEvent: (mediaEvent: SerializedMediaEvent) => {
        webrtcChannel.push("mediaEvent", { data: mediaEvent });
      },
      onConnectionError: () => {
        onError("Error while connecting to WebRTC");
      },
      onJoinSuccess: (_peerId, _peersInRoom) => {},
      onJoinError: () => {
        onError("Error while joining WebRTC connection");
      },
      onTrackReady: ({ track, stream, peer }) => {
        addPresenterMediaStream(
          peer.metadata.displayName,
          stream!,
          track!.kind as SourceType,
          streamsAvailable,
          setStreamsAvailable
        );
      },
      onTrackAdded: (_ctx) => {},
      onTrackRemoved: ({ stream, peer }) => {
        if (stream != null) removeStream(peer.metadata.displayName);
      },
      onPeerJoined: (_peer) => {},
      onPeerLeft: (peer) => {
        removeStream(peer.metadata.displayName);
      },
      onPeerUpdated: (_ctx) => {},
      onRemoved: (_reason) => {
        removeStream(clientName);
        presenterStreams[clientName].getTracks().forEach((track) => track.stop());
        onError("You were removed from WebRTC connection");
      },
    },
  });

  webrtc.join({
    displayName: clientName,
  });

  webrtcChannel.on("mediaEvent", (event) => {
    webrtc.receiveMediaEvent(event.data);
  });

  return webrtc;
};

export const replaceTrack = (
  webrtc: MembraneWebRTC | null,
  clientName: string,
  mediaStream: MediaStream,
  sourceType: SourceType
) => {
  const track = findTrackBySource(clientName, sourceType);
  if (!(webrtc != null && track != undefined)) return;
  if (currentTracks[sourceType] == null)
    currentTracks[sourceType] = webrtc.addTrack(track, presenterStreams[clientName], {});
  else webrtc.replaceTrack(currentTracks[sourceType]!, track);
};

export const leaveWebrtc = (
  webrtc: MembraneWebRTC,
  name: string,
  streamsAvailable: { [key: string]: boolean },
  setStreamsAvailable: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>,
  webrtcChannel: any
) => {
  webrtcChannel.off("mediaEvent");
  let new_elem = {};
  new_elem[name] = false;
  setStreamsAvailable({ ...streamsAvailable, ...new_elem });
  presenterStreams[name].getTracks().forEach((track) => track.stop());
  delete presenterStreams[name];
  webrtc.leave();
};
