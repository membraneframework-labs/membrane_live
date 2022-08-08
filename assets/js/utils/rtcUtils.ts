import { MembraneWebRTC, SerializedMediaEvent } from "@membraneframework/membrane-webrtc-js";
import { presenterStreams } from "../components/PresenterStreamArea";

export const AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: true,
  video: false,
};

export const VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: { width: 1280, height: 720, frameRate: 24 },
};

export const connectWebrtc = async (
  webrtcChannel: any,
  name: string,
  streamsAvailable: { [key: string]: boolean },
  setStreamsAvailable: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>
) => {
  let localAudioStream: MediaStream | null = null;
  let localVideoStream: MediaStream | null = null;
  let localStream: MediaStream = new MediaStream();

  try {
    localAudioStream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
    localAudioStream.getTracks().forEach((track) => localStream.addTrack(track));
  } catch (error) {
    console.error("Couldn't get microphone permission:", error);
  }

  try {
    localVideoStream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS);
    localVideoStream.getTracks().forEach((track) => {
      localStream.addTrack(track);
    });
  } catch (error) {
    console.error("Couldn't get camera permission:", error);
  }

  const addStream = (stream: MediaStream, name: string) => {
    presenterStreams[name] = stream;
    setStreamsAvailable({ ...streamsAvailable, ...{ [name]: true } });
  };

  const removeStream = (name: string) => {
    delete presenterStreams[name];
    setStreamsAvailable({ ...streamsAvailable, ...{ [name]: false } });
  };

  addStream(localStream, name);

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
      onJoinSuccess: (_peerId, _peersInRoom) => {
        localStream.getTracks().forEach((track) => webrtc.addTrack(track, localStream, {}));
      },
      onJoinError: () => {
        onError("Error while joining WebRTC connection");
      },
      onTrackReady: ({ stream, peer }) => {
        if (stream != null) addStream(stream, peer.metadata.displayName);
      },
      onTrackAdded: (_ctx) => {},
      onTrackRemoved: ({ stream, peer }) => {
        if (stream != null) removeStream(peer.metadata.displayName);
      },
      onPeerJoined: (peer) => {},
      onPeerLeft: (peer) => {
        removeStream(peer.metadata.displayName);
      },
      onPeerUpdated: (_ctx) => {},
      onRemoved: (_reason) => {
        removeStream(name);
        localStream.getTracks().forEach((track) => track.stop());
        onError("You were removed from WebRTC connection");
      },
    },
  });

  webrtc.join({
    displayName: name,
  });

  webrtcChannel.on("mediaEvent", (event) => {
    console.log("INCONING EVENT", event);
    webrtc.receiveMediaEvent(event.data);
  });

  return webrtc;
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
