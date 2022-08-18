import { MembraneWebRTC, SerializedMediaEvent } from "@membraneframework/membrane-webrtc-js";

export type Sources = {
  audio: MediaDeviceInfo[];
  video: MediaDeviceInfo[];
};

export type SourceType = "audio" | "video";
export const presenterStreams: { [key: string]: MediaStream } = {};

const FRAME_RATE = 24;
const AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: true,
  video: false,
};

const VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: { width: 1280, height: 720, frameRate: FRAME_RATE },
};

const sourceIds: { audio: string; video: string } = { audio: "", video: "" };
const mergedScreenRef: { tracks: MediaStreamTrack[]; refreshId: number | undefined } = {
  tracks: [],
  refreshId: undefined,
};

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
  mergedScreenRef.refreshId && removeMergedStream();
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
  mergedScreenRef.refreshId && removeMergedStream();
  const mergedStream = await getMergedTracks(clientName);

  mergedStream.getTracks().forEach((track) => {
    addOrReplaceTrack(clientName, track, playerCallback);
  });

  const newTrack = findTrackByType(clientName, "video");

  if (!webrtc || !newTrack) return;
  if (sourceIds["video"]) webrtc.replaceTrack(sourceIds["video"], newTrack);
  else sourceIds["video"] = webrtc.addTrack(newTrack, presenterStreams[clientName]);
};

const getMergedTracks = async (clientName: string) => {
  const screenStream: MediaStream = await navigator.mediaDevices.getDisplayMedia(VIDEO_CONSTRAINTS);
  const cameraStream = new MediaStream(presenterStreams[clientName].getVideoTracks()).clone();

  mergedScreenRef.tracks.push(...screenStream.getTracks(), ...cameraStream.getTracks());

  const camera = await attachToDOM("justCamera", cameraStream);
  const screen = await attachToDOM("justScreenShare", screenStream);

  let canvasElement = document.createElement("canvas");
  let canvasCtx = canvasElement.getContext("2d");

  canvasCtx
    ? await makeComposite(canvasElement, canvasCtx, camera, screen)
    : console.error("CanvasCtx is null", canvasCtx);

  return canvasElement.captureStream(FRAME_RATE);
};

const attachToDOM = async (id: string, stream: MediaStream) => {
  let videoElem = document.createElement("video");
  videoElem.id = id;
  videoElem.width = 1280;
  videoElem.height = 720;
  videoElem.autoplay = true;
  videoElem.setAttribute("playsinline", "true");
  videoElem.srcObject = stream;
  return videoElem;
};

const makeComposite = async (
  canvasElement: HTMLCanvasElement,
  canvasCtx: CanvasRenderingContext2D,
  camera: HTMLVideoElement,
  screen: HTMLVideoElement
) => {
  canvasCtx.save();
  canvasElement.setAttribute("width", `${screen.width}px`);
  canvasElement.setAttribute("height", `${screen.height}px`);
  canvasCtx.clearRect(0, 0, screen.width, screen.height);
  canvasCtx.drawImage(screen, 0, 0, screen.width, screen.height);
  canvasCtx.drawImage(
    camera,
    0,
    Math.floor(screen.height - screen.height / 4),
    Math.floor(screen.width / 4),
    Math.floor(screen.height / 4)
  );

  let imageData = canvasCtx.getImageData(0, 0, screen.width, screen.height);
  canvasCtx.putImageData(imageData, 0, 0);
  canvasCtx.restore();

  mergedScreenRef.refreshId = requestVideoFrame(() =>
    makeComposite(canvasElement, canvasCtx, camera, screen)
  );
};

const requestVideoFrame = (callback: Function) => {
  return setTimeout(() => {
    callback();
  }, 1000 / FRAME_RATE);
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
  mergedScreenRef.tracks.forEach((track) => track.stop());
  mergedScreenRef.tracks = [];

  clearTimeout(mergedScreenRef.refreshId);
  mergedScreenRef.refreshId = undefined;
};

const removeStream = (name: string) => {
  delete presenterStreams[name];
};
