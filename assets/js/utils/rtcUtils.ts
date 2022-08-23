import { MembraneWebRTC, SerializedMediaEvent } from "@membraneframework/membrane-webrtc-js";
import { AUDIO_CONSTRAINTS, VIDEO_CONSTRAINTS } from "./const";
import { getMergedTracks } from "./canvasUtils";

export type Sources = {
  audio: MediaDeviceInfo[];
  video: MediaDeviceInfo[];
};
export type SourceType = "audio" | "video";

export type MergedScreenRef = {
  screenTrack: MediaStreamTrack | undefined;
  cameraTrack: MediaStreamTrack | undefined;
  refreshId: number | undefined;
};

export const presenterStreams: { [key: string]: MediaStream } = {};
export const mergedScreenRef: MergedScreenRef = {
  screenTrack: undefined,
  cameraTrack: undefined,
  refreshId: undefined,
};

const sourceIds: { audio: string; video: string } = { audio: "", video: "" };

export const findTrackByType = (name: string, sourceType: SourceType) => {
  return presenterStreams[name].getTracks().find((elem) => elem.kind == sourceType);
};

export const changeTrackIsEnabled = (name: string, sourceType: SourceType) => {
  const track = findTrackByType(name, sourceType);
  if (track) track.enabled = !track.enabled;
};

export const getCurrentDeviceName = (clientName: string, sourceType: SourceType) => {
  return findTrackByType(clientName, sourceType)?.label;
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
  clientName: string,
  deviceId: string,
  sourceType: SourceType,
  playerCallback: (sourceType: SourceType) => void
) => {
  let localStream: MediaStream;
  try {
    const constraint = sourceType == "audio" ? AUDIO_CONSTRAINTS : VIDEO_CONSTRAINTS;
    localStream = await navigator.mediaDevices.getUserMedia(getConstraint(constraint, deviceId));

    localStream.getTracks().forEach((track) => {
      addOrReplaceTrack(clientName, track, playerCallback);
    });
  } catch (error) {
    console.error("Couldn't get microphone permission:", error);
  }
};

export const connectWebrtc = async (
  webrtcChannel: any,
  clientName: string,
  playerCallbacks: { [key: string]: (sourceType: SourceType) => void }
) => {
  presenterStreams[clientName] = new MediaStream();

  const sources = await getSources();
  const defaults: { audio: MediaDeviceInfo | undefined; video: MediaDeviceInfo | undefined } = {
    audio: sources?.audio[0],
    video: sources?.video[0],
  };

  if (defaults.audio)
    await setSourceById(clientName, defaults.audio.deviceId, "audio", playerCallbacks[clientName]);

  if (defaults.video)
    await setSourceById(clientName, defaults.video.deviceId, "video", playerCallbacks[clientName]);

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
        presenterStreams[clientName].getTracks().forEach((track) => {
          sourceIds[track.kind] = webrtc.addTrack(track, presenterStreams[clientName], {});
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
    name: clientName,
  });

  webrtcChannel.on("mediaEvent", (event: any) => {
    webrtc.receiveMediaEvent(event.data);
  });

  return webrtc;
};

export const changeSource = async (
  webrtc: MembraneWebRTC,
  clientName: string,
  deviceId: string,
  sourceType: SourceType,
  playerCallback: (sourceType: SourceType) => void
) => {
  if (mergedScreenRef.refreshId && sourceType == "video") removeMergedStream();
  await setSourceById(clientName, deviceId, sourceType, playerCallback);
  const newTrack = findTrackByType(clientName, sourceType);
  if (!webrtc || !newTrack) return;
  if (sourceIds[sourceType]) webrtc.replaceTrack(sourceIds[sourceType], newTrack);
  else sourceIds[sourceType] = webrtc.addTrack(newTrack, presenterStreams[clientName]);
};

export const leaveWebrtc = (webrtc: MembraneWebRTC, clientName: string, webrtcChannel: any) => {
  webrtcChannel.off("mediaEvent");
  presenterStreams[clientName].getTracks().forEach((track) => track.stop());
  removeStream(clientName);
  webrtc.leave();
};

export const shareScreen = async (
  webrtc: MembraneWebRTC,
  clientName: string,
  playerCallback: (SourceType: SourceType) => void
) => {
  const mergedStream = await getMergedTracks(mergedScreenRef, presenterStreams[clientName]);

  mergedStream.getTracks().forEach((track) => {
    addOrReplaceTrack(clientName, track, playerCallback);
  });

  const newTrack = findTrackByType(clientName, "video");

  if (!webrtc || !newTrack) return;
  if (sourceIds["video"]) webrtc.replaceTrack(sourceIds["video"], newTrack);
  else sourceIds["video"] = webrtc.addTrack(newTrack, presenterStreams[clientName]);
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
};

const removeStream = (name: string) => {
  delete presenterStreams[name];
};
