import {
  MembraneWebRTC,
  SerializedMediaEvent,
} from "@membraneframework/membrane-webrtc-js";

export const AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: true,
  video: false,
};

export const VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: { width: 1280, height: 720, frameRate: 24 },
};

export const connectWebrtc = async (webrtcChannel, name) => {
  let localAudioStream: MediaStream | null = null;
  let localVideoStream: MediaStream | null = null;
  let localStream: MediaStream = new MediaStream();

  try {
    localAudioStream = await navigator.mediaDevices.getUserMedia(
      AUDIO_CONSTRAINTS
    );
    localAudioStream
      .getTracks()
      .forEach((track) => localStream.addTrack(track));
  } catch (error) {
    console.error("Couldn't get microphone permission:", error);
  }

  try {
    localVideoStream = await navigator.mediaDevices.getUserMedia(
      VIDEO_CONSTRAINTS
    );
    localVideoStream.getTracks().forEach((track) => {
      localStream.addTrack(track);
      console.log(track);
    });
  } catch (error) {
    console.error("Couldn't get camera permission:", error);
  }

  const onError = (error: any) => {
    // setErrorMessage(error);
    alert("ERROR");
    webrtc.leave();
  };
  
  webrtcChannel.onError(onError);

  const webrtc = new MembraneWebRTC({
    callbacks: {
      onSendMediaEvent: (mediaEvent: SerializedMediaEvent) => {
        
        webrtcChannel.push("mediaEvent", { data: mediaEvent });
      },
      onJoinSuccess: (peerId, peersInRoom) => {
        localStream
          .getTracks()
          .forEach((track) => webrtc.addTrack(track, localStream, {}));
      },
      onPeerJoined: (peer) => {
        console.log("PEER JOINED", peer.id, peer.metadata.displayName)
      },
      onTrackReady: ({ stream, peer, metadata }) => {
        let video = document.getElementById("123123123123") as HTMLVideoElement;
        console.log(video, peer.metadata.displayName)
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;

        video.srcObject = stream;
      }
    },
  });

  webrtc.join({
    displayName: name,
  });

  webrtcChannel.on("mediaEvent", (event) =>
    webrtc.receiveMediaEvent(event.data)
  );
  
  webrtcChannel.on("playlistPlayable", ({ playlistId }) => {
    // setPlayerInfo(playlistId);
    alert("playlistPlayable");
  });
};