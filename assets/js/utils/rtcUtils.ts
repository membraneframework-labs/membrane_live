import { MembraneWebRTC, SerializedMediaEvent } from "@membraneframework/membrane-webrtc-js";

export const presenterStreams: { [key: string]: MediaStream } = {};

const addOrReplaceTrack = (name: string, track: MediaStreamTrack, playerCallback: () => void) => {
  if (!presenterStreams[name]) presenterStreams[name] = new MediaStream();

  const curTrack = presenterStreams[name].getTracks().find((elem) => elem.kind == track.kind);
  if (curTrack) {
    curTrack.stop(); // not sure if that is necessary
    presenterStreams[name].removeTrack(curTrack);
  }
  presenterStreams[name].addTrack(track);
  playerCallback(); // to attach MediaStream to HTMLVideoElement object in DOM
};

const removeStream = (name: string) => {
  delete presenterStreams[name];
};

const AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: true,
  video: false,
};

const VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: { width: 1280, height: 720, frameRate: 24 },
};

const getConstraint = (constraint: MediaStreamConstraints, deviceId: string) => {
  const newConstraint: MediaStreamConstraints = { audio: {}, video: {} };
  let type: "audio" | "video";
  if (!constraint.audio) {
    newConstraint.audio = false;
    type = "video";
  } else {
    newConstraint.video = false;
    type = "audio";
  }
  const elem = constraint[type] === true ? {} : constraint[type];
  elem!["deviceId"] = { exact: deviceId };
  newConstraint[type] = elem;

  return newConstraint;
};

const filterDevices = (allDevices: MediaDeviceInfo[], type: String) => {
  return allDevices.filter((device) => device.deviceId != "default" && device.kind == type);
};

export const getSources = async () => {
  const sources: { audio: MediaDeviceInfo[]; video: MediaDeviceInfo[] } = { audio: [], video: [] };
  let mediaDevices: MediaDeviceInfo[];
  try {
    mediaDevices = await navigator.mediaDevices.enumerateDevices();
    sources.audio = filterDevices(mediaDevices, "audioinput");
    sources.video = filterDevices(mediaDevices, "videoinput");

    return sources;
  } catch (err) {
    console.log("Error during getting the media devices.");
  }
};

export const connectWebrtc = async (
  webrtcChannel: any,
  clientName: string,
  playerCallbacks: { [key: string]: () => void }
) => {
  let localAudioStream: MediaStream | null = null;
  let localVideoStream: MediaStream | null = null;
  presenterStreams[clientName] = new MediaStream();

  const sources = await getSources();
  const defaults: { audio: MediaDeviceInfo | undefined; video: MediaDeviceInfo | undefined } = {
    audio: sources?.audio[0],
    video: sources?.video[0],
  };

  if (defaults.audio) {
    try {
      localAudioStream = await navigator.mediaDevices.getUserMedia(
        getConstraint(AUDIO_CONSTRAINTS, defaults.audio.deviceId)
      );
      localAudioStream.getTracks().forEach((track) => {
        presenterStreams[clientName].addTrack(track);
      });
    } catch (error) {
      console.error("Couldn't get microphone permission:", error);
    }
  }

  if (defaults.video) {
    try {
      localVideoStream = await navigator.mediaDevices.getUserMedia(
        getConstraint(VIDEO_CONSTRAINTS, defaults.video.deviceId)
      );
      localVideoStream.getTracks().forEach((track) => {
        presenterStreams[clientName].addTrack(track);
      });
    } catch (error) {
      console.error("Couldn't get camera permission:", error);
    }
  }

  playerCallbacks[clientName]();

  const onError = (error: any) => {
    alert("ERROR " + error);
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
        presenterStreams[clientName]
          .getTracks()
          .forEach((track) => webrtc.addTrack(track, presenterStreams[clientName], {}));
      },
      onJoinError: () => {
        onError("Error while joining WebRTC connection");
      },
      onTrackReady: ({ track, peer }) => {
        if (track != null)
          addOrReplaceTrack(peer.metadata.name, track, playerCallbacks[peer.metadata.name]);
      },
      onTrackAdded: (_ctx) => {},
      onTrackRemoved: (_ctx) => {},
      onPeerJoined: (_peer) => {},
      onPeerLeft: (peer) => {
        removeStream(peer.metadata.name);
      },
      onPeerUpdated: (_ctx) => {},
      onRemoved: (_reason) => {
        onError("You were removed from WebRTC connection");
      },
    },
  });

  webrtc.join({
    name: clientName,
  });

  webrtcChannel.on("mediaEvent", (event: any) => {
    webrtc.receiveMediaEvent(event.data);
  });

  return webrtc;
};

export const leaveWebrtc = (webrtc: MembraneWebRTC, clientName: string, webrtcChannel: any) => {
  webrtcChannel.off("mediaEvent");
  presenterStreams[clientName].getTracks().forEach((track) => track.stop());
  removeStream(clientName);
  webrtc.leave();
};
