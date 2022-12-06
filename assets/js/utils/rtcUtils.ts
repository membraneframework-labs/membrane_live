import {
  MembraneWebRTC,
  SerializedMediaEvent,
  TrackContext,
} from "@membraneframework/membrane-webrtc-js";
import { AUDIO_CONSTRAINTS, VIDEO_CONSTRAINTS } from "./const";
import { getMergedTracks } from "./canvasUtils";
import { User, Client, Presenter, SourceType } from "../types";
import { Channel } from "phoenix";

export type Sources = {
  audio: MediaDeviceInfo[];
  video: MediaDeviceInfo[];
};

export type MergedScreenRef = {
  screenTrack: MediaStreamTrack | undefined;
  cameraTrack: MediaStreamTrack | undefined;
  deviceName: string;
  refreshId: NodeJS.Timeout | undefined;
};

export const presenterStreams: { [key: string]: MediaStream } = {};
export const mergedScreenRef: MergedScreenRef = {
  screenTrack: undefined,
  cameraTrack: undefined,
  deviceName: "",
  refreshId: undefined,
};

const sourceIds: { audio: string; video: string } = { audio: "", video: "" };

export const findTrackByType = (client: User, sourceType: SourceType) => {
  return presenterStreams[client.email].getTracks().find((elem) => elem.kind == sourceType);
};

export const changeTrackIsEnabled = (
  webrtc: MembraneWebRTC | null,
  client: User,
  sourceType: SourceType,
  playerCallback: (sourceType: SourceType) => void
) => {
  const track = findTrackOrScreenshare(client, sourceType);
  if (track) {
    track.enabled = !track.enabled;
    webrtc && sendTrackEnabledMetadata(webrtc, track);
  }
  if (webrtc && sourceType == "video" && mergedScreenRef.cameraTrack) {
    shareScreen(webrtc, client, playerCallback);
  }
};

export const updateTrackEnabled = (
  webrtc: MembraneWebRTC,
  client: User,
  sourceType: SourceType
): void => {
  const track = findTrackOrScreenshare(client, sourceType);
  track && sendTrackEnabledMetadata(webrtc, track);
};

const sendTrackEnabledMetadata = (webrtc: MembraneWebRTC, track: MediaStreamTrack) => {
  webrtc.updateTrackMetadata(sourceIds[track.kind as SourceType], { enabled: track.enabled });
};

const findTrackOrScreenshare = (
  client: User,
  sourceType: SourceType
): MediaStreamTrack | undefined => {
  return sourceType === "video" && mergedScreenRef.cameraTrack
    ? mergedScreenRef.cameraTrack
    : findTrackByType(client, sourceType);
};

export const checkTrackIsEnabled = (client: User, sourceType: SourceType) => {
  if (!(client.email in presenterStreams)) {
    return false;
  }
  const track =
    sourceType == "video" && mergedScreenRef.cameraTrack
      ? mergedScreenRef.cameraTrack
      : findTrackByType(client, sourceType);
  return track?.enabled;
};

export const updatePresentersMicAndCamStatuses = (presenters: {
  [key: string]: Presenter;
}): { [key: string]: Presenter } => {
  const updatePresenterMicAndCamStatus = (presenter: Presenter): Presenter => {
    return {
      ...presenter,
      isMicOn: checkTrackIsEnabled(presenter, "audio"),
      isCamOn: checkTrackIsEnabled(presenter, "video"),
    };
  };

  const updatedPresenters = Object.keys(presenters).reduce((result, key) => {
    result[key] = updatePresenterMicAndCamStatus(presenters[key]);
    return result;
  }, {});
  return updatedPresenters;
};

export const getCurrentDeviceName = (client: Client, sourceType: SourceType) => {
  return mergedScreenRef.deviceName
    ? mergedScreenRef.deviceName
    : findTrackByType(client, sourceType)?.label;
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
  client: Client,
  deviceId: string,
  sourceType: SourceType,
  playerCallback: (sourceType: SourceType) => void
) => {
  let localStream: MediaStream;
  try {
    const constraint = sourceType == "audio" ? AUDIO_CONSTRAINTS : VIDEO_CONSTRAINTS;
    localStream = await navigator.mediaDevices.getUserMedia(getConstraint(constraint, deviceId));

    localStream.getTracks().forEach((track) => {
      addOrReplaceTrack(client, track, playerCallback);
    });
  } catch (error) {
    console.error("Couldn't get microphone permission:", error);
  }
};

export const connectWebrtc = async (
  webrtcChannel: Channel | undefined,
  client: Client,
  setPresenters: React.Dispatch<React.SetStateAction<{ [key: string]: Presenter }>>,
  updateMicAndCamStatusCallback: () => void
) => {
  const onError = (error: string) => {
    console.log(error);
  };

  const webrtc = new MembraneWebRTC({
    callbacks: {
      onSendMediaEvent: (mediaEvent: SerializedMediaEvent) => {
        webrtcChannel?.push("mediaEvent", { data: mediaEvent });
      },
      onConnectionError: () => {
        onError("Error while connecting to WebRTC");
      },
      onJoinSuccess: () => {
        presenterStreams[client.email].getTracks().forEach((track) => {
          sourceIds[track.kind] = webrtc.addTrack(
            track,
            presenterStreams[client.email],
            {},
            undefined,
            1500
          );
        });
        updateTrackEnabled(webrtc, client, "audio");
        updateTrackEnabled(webrtc, client, "video");
      },
      onJoinError: () => {
        onError("Error while joining WebRTC connection");
      },
      onTrackReady: ({ track, peer, metadata }) => {
        if (track != null) {
          const callback = (playerCallback: (sourceType: SourceType) => void) => {
            addOrReplaceTrack(peer.metadata, track, playerCallback);
          };

          setPresenters((prev) => {
            return {
              ...prev,
              [peer.metadata.email]: {
                ...prev[peer.metadata.email],
                rtcStatus: "connecting",
                connectCallbacks: prev[peer.metadata.email].connectCallbacks.concat(callback),
              },
            };
          });

          if ("enabled" in metadata) track.enabled = metadata.enabled;
          updateMicAndCamStatusCallback();
        }
      },
      onTrackUpdated({ track, metadata }: TrackContext) {
        if (track != null) {
          if ("enabled" in metadata) track.enabled = metadata.enabled;
          updateMicAndCamStatusCallback();
        }
      },

      onTrackRemoved: () => {
        if (presenterStreams[client.email].getTracks().length == 0) {
          setPresenters((prev) => {
            return {
              ...prev,
              [client.email]: { ...prev[client.email], status: "idle" },
            };
          });
        }
      },
      onPeerJoined: () => {
        // do nothing
      },
      onPeerLeft: (peer) => {
        removeStream(peer.metadata.email);
      },
      onPeerUpdated: () => {
        // do nothing
      },
      onRemoved: () => {
        onError("You were removed from WebRTC connection");
      },
    },
  });

  webrtc.join(client);

  webrtcChannel?.on("mediaEvent", (event: { data: string }) => {
    webrtc.receiveMediaEvent(event.data);
  });
  return webrtc;
};

export const connectPresentersTracks = async (
  playerCallbacks: { [key: string]: (sourceType: SourceType) => void },
  setPresenters: React.Dispatch<React.SetStateAction<{ [key: string]: Presenter }>>
) => {
  setPresenters((presenters) => {
    Object.values(presenters)
      .filter(
        (presenter) =>
          presenter.rtcStatus == "rtc_player_ready" && presenter.connectCallbacks.length > 0
      )
      .forEach((presenter) => {
        const playerCallback = playerCallbacks[presenter.email];
        presenter.connectCallbacks.forEach((callback) => callback(playerCallback));
        presenters = { ...presenters, [presenter.email]: { ...presenter, connectCallbacks: [] } };
      });
    return presenters;
  });
};

export const changeSource = async (
  webrtc: MembraneWebRTC | null,
  client: Client,
  deviceId: string,
  sourceType: SourceType,
  playerCallback: (sourceType: SourceType) => void
) => {
  await setSourceById(client, deviceId, sourceType, playerCallback);
  if (!webrtc) return;
  if (mergedScreenRef.refreshId && sourceType == "video") {
    shareScreen(webrtc, client, playerCallback);
  } else {
    const newTrack = findTrackByType(client, sourceType);
    if (!newTrack) return;
    if (sourceIds[sourceType]) webrtc.replaceTrack(sourceIds[sourceType], newTrack);
    else sourceIds[sourceType] = webrtc.addTrack(newTrack, presenterStreams[client.email]);
  }
};

export const leaveWebrtc = (
  webrtc: MembraneWebRTC,
  client: Client,
  webrtcChannel: Channel | undefined
) => {
  webrtcChannel?.off("mediaEvent");
  presenterStreams[client.email].getTracks().forEach((track) => track.stop());
  mergedScreenRef.cameraTrack?.stop();
  removeMergedStream();
  removeStream(client);
  webrtc.leave();
};

export const shareScreen = async (
  webrtc: MembraneWebRTC | null,
  client: User,
  playerCallback: (SourceType: SourceType) => void
): Promise<boolean> => {
  let mergedStream: MediaStream;

  const videoTrackLabel = presenterStreams[client.email].getVideoTracks()[0].label;
  if (videoTrackLabel != null) mergedScreenRef.deviceName = videoTrackLabel;

  try {
    mergedStream = await getMergedTracks(mergedScreenRef, presenterStreams[client.email]);
  } catch (err) {
    console.log(err, "(Probably clicked cancel on the screen sharing window)");
    removeMergedStream();
    return false;
  }

  mergedStream.getTracks().forEach((track) => {
    addOrReplaceTrack(client, track, playerCallback);
  });

  const newTrack = findTrackByType(client, "video");

  if (!newTrack) {
    removeMergedStream();
    return false;
  }
  if (!webrtc) return true;

  if (sourceIds["video"]) webrtc.replaceTrack(sourceIds["video"], newTrack);
  else sourceIds["video"] = webrtc.addTrack(newTrack, presenterStreams[client.email]);
  return true;
};

export const stopShareScreen = (
  webrtc: MembraneWebRTC | null,
  client: Client,
  playerCallback: (sourceType: SourceType) => void
) => {
  if (mergedScreenRef.cameraTrack) {
    const newCameraStream: MediaStream = new MediaStream([mergedScreenRef.cameraTrack]).clone();
    addOrReplaceTrack(client, newCameraStream.getTracks()[0], playerCallback);
    removeMergedStream();
    const newTrack = findTrackByType(client, "video");
    if (!webrtc || !newTrack) return;
    if (sourceIds["video"]) webrtc.replaceTrack(sourceIds["video"], newTrack);
    else sourceIds["video"] = webrtc.addTrack(newTrack, presenterStreams[client.email]);
  }
};

const getConstraint = (constraint: MediaStreamConstraints, deviceId: string) => {
  const newConstraint: MediaStreamConstraints = { audio: false, video: false };
  const type: SourceType = !constraint.audio ? "video" : "audio";
  newConstraint[type] = {
    ...(constraint[type] as MediaTrackConstraints),
    deviceId: { exact: deviceId },
  };
  return newConstraint;
};

const filterDevices = (allDevices: MediaDeviceInfo[], type: string) => {
  return allDevices.filter((device) => device.deviceId != "default" && device.kind == type);
};

const addOrReplaceTrack = (
  client: User,
  track: MediaStreamTrack,
  playerCallback: (sourceType: SourceType) => void
) => {
  if (!presenterStreams[client.email]) presenterStreams[client.email] = new MediaStream();
  const curTrack = findTrackByType(client, track.kind as SourceType);

  if (curTrack && curTrack.id !== track.id && curTrack.id !== mergedScreenRef.screenTrack?.id) {
    curTrack.stop();
  }

  curTrack && presenterStreams[client.email].removeTrack(curTrack);
  presenterStreams[client.email].addTrack(track);

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

const removeStream = (client: User) => {
  delete presenterStreams[client.email];
};

export const askForPermissions = async (): Promise<void> => {
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
