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

  const onError = (error: any) => {
    alert("ERROR");
    webrtc.leave();
  };

  webrtcChannel.onError(onError);

  const webrtc = new MembraneWebRTC({
    callbacks: {
      onSendMediaEvent: (mediaEvent: SerializedMediaEvent) => {
        webrtcChannel.push("mediaEvent", { data: mediaEvent });
      },
      onJoinSuccess: (_peerId, _peersInRoom) => {
        localStream.getTracks().forEach((track) => webrtc.addTrack(track, localStream, {}));
      },
      onPeerJoined: (peer) => {
        console.log("PEER JOINED", peer.id, peer.metadata.displayName);
      },
      onTrackReady: ({ stream, peer }) => {
        if (stream != null) {
          presenterStreams[peer.metadata.displayName] = stream;
          let new_elem = {};
          new_elem[peer.metadata.displayName] = true;
          setStreamsAvailable({ ...streamsAvailable, ...new_elem });
        }
      },
    },
  });

  webrtc.join({
    displayName: name,
  });

  webrtcChannel.on("mediaEvent", (event) => webrtc.receiveMediaEvent(event.data));
};
