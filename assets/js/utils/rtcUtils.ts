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

  const updateStream = (toAdd: boolean, stream: MediaStream | null, name: string) => {
    // adds new stream when toAdd is true, else removes the stream
    if (toAdd && stream != null)
      presenterStreams[name] = stream;
    let new_elem = {};
    new_elem[name] = true;
    setStreamsAvailable({ ...streamsAvailable, ...new_elem });
  }

  updateStream(true, localStream, name);

  const onError = (error: any) => {
    alert("ERROR", error);
    webrtc.leave();
  };

  webrtcChannel.onError(onError);

  const webrtc = new MembraneWebRTC({
    callbacks: {
      onSendMediaEvent: (mediaEvent: SerializedMediaEvent) => {
        webrtcChannel.push("mediaEvent", { data: mediaEvent });
      },
      onConnectionError: () => {
        onError("Error while connecting to WebRTC")
      },
      onJoinSuccess: (_peerId, _peersInRoom) => {
        localStream.getTracks().forEach((track) => webrtc.addTrack(track, localStream, {}));
      },
      onJoinError: () => {
        onError("Error while joining WebRTC connection")
      },
      onTrackReady: ({ stream, peer }) => {
        if (stream != null)
          updateStream(true, stream, peer.metadata.displayName);
      },
      onTrackAdded: (_ctx) => {},
      onTrackRemoved: ({ stream, peer}) => {
        if (stream != null)
          updateStream(false, stream, peer.metadata.displayName);
      },
      onPeerJoined: (peer) => {},
      onPeerLeft: (peer) => {
        updateStream(false, null, peer.metadata.displayName);
      },
      onPeerUpdated: (_ctx) => {},
      onRemoved: (_reason) => {
        updateStream(false, null, name);
        localStream.getTracks().forEach(track => track.stop())
        onError("You were removed from WebRTC connection");
      },
    },
  });

  webrtc.join({
    displayName: name,
  });

  webrtcChannel.on("mediaEvent", (event) => webrtc.receiveMediaEvent(event.data));

  return webrtc;
};

export const leaveWebrtc = async (
  webrtc: any, 
  name: string,  
  streamsAvailable: { [key: string]: boolean },
  setStreamsAvailable: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>
) => {
  let new_elem = {};
  new_elem[name] = false;
  setStreamsAvailable({ ...streamsAvailable, ...new_elem });
  presenterStreams[name].getTracks().forEach(track => track.stop());
  delete presenterStreams[name];
  const result = await webrtc;
  result.leave()
}
