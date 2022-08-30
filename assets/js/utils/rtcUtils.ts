import { MembraneWebRTC, SerializedMediaEvent } from "@membraneframework/membrane-webrtc-js";
import { AUDIO_CONSTRAINTS, VIDEO_CONSTRAINTS } from "./const";
import { getMergedTracks } from "./canvasUtils";
import { Client } from "../pages/Event";

export type Sources = {
  audio: MediaDeviceInfo[];
  video: MediaDeviceInfo[];
};
export type SourceType = "audio" | "video";

export type MergedScreenRef = {
  screenTrack: MediaStreamTrack | undefined;
  cameraTrack: MediaStreamTrack | undefined;
  deviceName: string;
  refreshId: number | undefined;
};

export const presenterStreams: { [key: string]: MediaStream } = {};
export const mergedScreenRef: MergedScreenRef = {
  screenTrack: undefined,
  cameraTrack: undefined,
  deviceName: "",
  refreshId: undefined,
};

const sourceIds: { audio: string; video: string } = { audio: "", video: "" };

export const findTrackByType = (name: string, sourceType: SourceType) => {
  return presenterStreams[name].getTracks().find((elem) => elem.kind == sourceType);
};

export const changeTrackIsEnabled = (name: string, sourceType: SourceType) => {
  const track =
    sourceType == "video" && mergedScreenRef.cameraTrack
      ? mergedScreenRef.cameraTrack
      : findTrackByType(name, sourceType);
  if (track) track.enabled = !track.enabled;
};

export const checkTrackIsEnabled = (name: string, sourceType: SourceType) => {
  const track =
    sourceType == "video" && mergedScreenRef.cameraTrack
      ? mergedScreenRef.cameraTrack
      : findTrackByType(name, sourceType);
  return track?.enabled;
};

export const getCurrentDeviceName = (clientEmail: string, sourceType: SourceType) => {
  return mergedScreenRef.deviceName
    ? mergedScreenRef.deviceName
    : findTrackByType(clientEmail, sourceType)?.label;
};

export const getSources = async () => {
  const sources: Sources = { audio: [], video: [] };
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

export const setSourceById = async (
  clientEmail: string,
  deviceId: string,
  sourceType: SourceType,
  playerCallback: (sourceType: SourceType) => void
) => {
  let localStream: MediaStream;
  try {
    const constraint = sourceType == "audio" ? AUDIO_CONSTRAINTS : VIDEO_CONSTRAINTS;
    localStream = await navigator.mediaDevices.getUserMedia(getConstraint(constraint, deviceId));

    localStream.getTracks().forEach((track) => {
      addOrReplaceTrack(clientEmail, track, playerCallback);
    });
  } catch (error) {
    console.error("Couldn't get microphone permission:", error);
  }
};

export const connectWebrtc = async (
  webrtcChannel: any,
  client: Client,
  playerCallbacks: { [key: string]: (sourceType: SourceType) => void }
) => {
  await askForPermissions();
  presenterStreams[client.email] = new MediaStream();

  const sources = await getSources();
  const defaults: { audio: MediaDeviceInfo | undefined; video: MediaDeviceInfo | undefined } = {
    audio: sources?.audio[0],
    video: sources?.video[0],
  };

  if (defaults.audio)
    await setSourceById(
      client.email,
      defaults.audio.deviceId,
      "audio",
      playerCallbacks[client.email]
    );

  if (defaults.video)
    await setSourceById(
      client.email,
      defaults.video.deviceId,
      "video",
      playerCallbacks[client.email]
    );

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
        presenterStreams[client.email].getTracks().forEach((track) => {
          sourceIds[track.kind] = webrtc.addTrack(track, presenterStreams[client.email], {});
        });
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
    name: client.name,
  });

  webrtcChannel.on("mediaEvent", (event: any) => {
    webrtc.receiveMediaEvent(event.data);
  });
  return webrtc;
};

export const changeSource = async (
  webrtc: MembraneWebRTC,
  clientEmail: string,
  deviceId: string,
  sourceType: SourceType,
  playerCallback: (sourceType: SourceType) => void
) => {
  await setSourceById(clientEmail, deviceId, sourceType, playerCallback);
  if (!webrtc) return;
  if (mergedScreenRef.refreshId && sourceType == "video") {
    shareScreen(webrtc, clientEmail, playerCallback);
  } else {
    const newTrack = findTrackByType(clientEmail, sourceType);
    if (!newTrack) return;
    if (sourceIds[sourceType]) webrtc.replaceTrack(sourceIds[sourceType], newTrack);
    else sourceIds[sourceType] = webrtc.addTrack(newTrack, presenterStreams[clientEmail]);
  }
};

export const leaveWebrtc = (webrtc: MembraneWebRTC, clientEmail: string, webrtcChannel: any) => {
  webrtcChannel.off("mediaEvent");
  presenterStreams[clientEmail].getTracks().forEach((track) => track.stop());
  mergedScreenRef.cameraTrack?.stop();
  removeMergedStream();
  removeStream(clientEmail);
  webrtc.leave();
};

export const shareScreen = async (
  webrtc: MembraneWebRTC,
  clientEmail: string,
  playerCallback: (SourceType: SourceType) => void
): Promise<boolean> => {
  let mergedStream: MediaStream;
  mergedScreenRef.deviceName = presenterStreams[clientEmail].getVideoTracks().pop()!.label;

  try {
    mergedStream = await getMergedTracks(mergedScreenRef, presenterStreams[clientEmail]);
  } catch (err) {
    console.log(err, "(Propably clicked cancel on the screen sharing window)");
    removeMergedStream();
    return false;
  }

  mergedStream!.getTracks().forEach((track) => {
    addOrReplaceTrack(clientEmail, track, playerCallback);
  });

  const newTrack = findTrackByType(clientEmail, "video");

  if (!webrtc || !newTrack) {
    removeMergedStream();
    return false;
  }
  if (sourceIds["video"]) webrtc.replaceTrack(sourceIds["video"], newTrack);
  else sourceIds["video"] = webrtc.addTrack(newTrack, presenterStreams[clientEmail]);
  return true;
};

export const stopShareScreen = (
  webrtc: MembraneWebRTC,
  clientEmail: string,
  playerCallback: (sourceType: SourceType) => void
) => {
  if (mergedScreenRef.cameraTrack) {
    const newCameraStream: MediaStream = new MediaStream([mergedScreenRef.cameraTrack]).clone();
    addOrReplaceTrack(clientEmail, newCameraStream.getTracks()[0], playerCallback);
    removeMergedStream();
    const newTrack = findTrackByType(clientEmail, "video");
    if (!webrtc || !newTrack) return;
    if (sourceIds["video"]) webrtc.replaceTrack(sourceIds["video"], newTrack);
    else sourceIds["video"] = webrtc.addTrack(newTrack, presenterStreams[clientEmail]);
  }
};

const getConstraint = (constraint: MediaStreamConstraints, deviceId: string) => {
  const newConstraint: MediaStreamConstraints = { audio: false, video: false };
  const type: SourceType = !constraint.audio ? "video" : "audio";
  newConstraint[type] = { ...(constraint[type] as Object), deviceId: { exact: deviceId } };
  return newConstraint;
};

const filterDevices = (allDevices: MediaDeviceInfo[], type: String) => {
  return allDevices.filter((device) => device.deviceId != "default" && device.kind == type);
};

const addOrReplaceTrack = (
  name: string,
  track: MediaStreamTrack,
  playerCallback: (sourceType: SourceType) => void
) => {
  if (!presenterStreams[name]) presenterStreams[name] = new MediaStream();
  const curTrack = findTrackByType(name, track.kind as SourceType);
  if (curTrack) {
    curTrack.stop();
    presenterStreams[name].removeTrack(curTrack);
  }
  presenterStreams[name].addTrack(track);
  playerCallback(track.kind as SourceType); // to attach MediaStream to HTMLVideoElement object in DOM
};

const removeMergedStream = () => {
  mergedScreenRef.screenTrack?.stop();
  mergedScreenRef.cameraTrack?.stop();
  mergedScreenRef.screenTrack = undefined;
  mergedScreenRef.cameraTrack = undefined;

  clearTimeout(mergedScreenRef.refreshId);
  mergedScreenRef.refreshId = undefined;

  mergedScreenRef.deviceName = "";
};

const removeStream = (name: string) => {
  delete presenterStreams[name];
};

const askForPermissions = async (): Promise<void> => {
  const hasVideoInput: boolean = (await navigator.mediaDevices.enumerateDevices()).some(
    (device) => device.kind === "videoinput"
  );

  const tmpVideoStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: hasVideoInput,
  });

  // stop tracks
  // in other case, next call to getUserMedia may fail
  // or won't respect media constraints
  tmpVideoStream.getTracks().forEach((track) => track.stop());
};
