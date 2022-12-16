import { MembraneWebRTC, SerializedMediaEvent, TrackContext } from "@membraneframework/membrane-webrtc-js";
import { AUDIO_CONSTRAINTS, VIDEO_CONSTRAINTS } from "./const";
import { getMergedTracks } from "./canvasUtils";
import { Channel } from "phoenix";
import type { User, Client, SourceType, PeersState } from "../types/types";

export type Sources = {
  audio: MediaDeviceInfo[];
  video: MediaDeviceInfo[];
};

export const findTrackByType = (
  user: User,
  sourceType: SourceType,
  peersState: PeersState
): MediaStreamTrack | undefined => {
  return peersState.peers[user.email]?.stream.getTracks().find((elem) => elem.kind == sourceType);
};

export const changeTrackIsEnabled = (
  webrtc: MembraneWebRTC | null,
  user: User,
  sourceType: SourceType,
  peersState: PeersState,
  setPeersState: React.Dispatch<React.SetStateAction<PeersState>>
) => {
  const track = findTrackOrScreenshare(user, sourceType, peersState);

  if (track) {
    const turningOffCameraDuringScreenShare: boolean =
      track === peersState.mergedScreenRef.cameraTrack && track.enabled;
    track.enabled = !track.enabled;
    webrtc && !turningOffCameraDuringScreenShare && sendTrackEnabledMetadata(webrtc, track, peersState);
  }

  if (webrtc && sourceType == "video" && peersState.mergedScreenRef.cameraTrack) {
    shareScreen(webrtc, user, peersState, setPeersState);
  }
};

export const sendTrackStatusUpdate = (
  webrtc: MembraneWebRTC,
  user: User,
  sourceType: SourceType,
  peersState: PeersState
): void => {
  const track = findTrackOrScreenshare(user, sourceType, peersState);
  track && sendTrackEnabledMetadata(webrtc, track, peersState);
};

const sendTrackEnabledMetadata = (webrtc: MembraneWebRTC, track: MediaStreamTrack, peersState: PeersState) => {
  webrtc.updateTrackMetadata(peersState.sourceIds[track.kind as SourceType], { enabled: track.enabled });
};

const findTrackOrScreenshare = (
  user: User,
  sourceType: SourceType,
  peersState: PeersState
): MediaStreamTrack | undefined => {
  return sourceType === "video" && peersState.mergedScreenRef.cameraTrack
    ? peersState.mergedScreenRef.cameraTrack
    : findTrackByType(user, sourceType, peersState);
};

export const checkTrackIsEnabled = (user: User, sourceType: SourceType, peersState: PeersState, isMyself = true) => {
  const track =
    isMyself && sourceType == "video" && peersState.mergedScreenRef.cameraTrack
      ? peersState.mergedScreenRef.cameraTrack
      : findTrackByType(user, sourceType, peersState);
  return track?.enabled;
};

export const getCurrentDeviceName = (client: Client, sourceType: SourceType, peersState: PeersState) => {
  return peersState.mergedScreenRef.deviceName
    ? peersState.mergedScreenRef.deviceName
    : findTrackByType(client, sourceType, peersState)?.label;
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

export const connectWebrtc = async (
  webrtcChannel: Channel | undefined,
  client: Client,
  setPeersState: React.Dispatch<React.SetStateAction<PeersState>>
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
        setPeersState((prev) => {
          const presenterStream = prev.peers[client.email] || {
            name: client.name,
            email: client.email,
            stream: new MediaStream(),
          };

          presenterStream.stream.getTracks().forEach((track) => {
            prev.sourceIds[track.kind as SourceType] = webrtc.addTrack(
              track,
              presenterStream.stream,
              {},
              undefined,
              1500
            );
          });

          const peersState = { ...prev, peers: { ...prev.peers, [client.email]: presenterStream } };

          sendTrackStatusUpdate(webrtc, client, "audio", peersState);
          sendTrackStatusUpdate(webrtc, client, "video", peersState);

          return peersState;
        });
      },
      onJoinError: () => {
        onError("Error while joining WebRTC connection");
      },
      onTrackReady: ({ track, peer, metadata }) => {
        if (!(peer && track)) return;

        setPeersState((prev) => addOrReplaceTrack(peer.metadata, track, prev));

        if ("enabled" in metadata) {
          track.enabled = metadata.enabled;
          setPeersState((prev) => {
            return { ...prev };
          });
        }
      },
      onTrackUpdated({ track, metadata }: TrackContext) {
        if (!(track && "enabled" in metadata)) return;

        track.enabled = metadata.enabled;
        setPeersState((prev) => {
          return { ...prev };
        });
      },
      onTrackRemoved: () => {
        // do nothing (We only update state, when peer leaves and do nothing when a single track is removed)
      },
      onPeerJoined: () => {
        // do nothing
      },
      onPeerLeft: (peer) => {
        setPeersState((prev) => removeStream(peer.metadata, prev));
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

export const changeSource = async (
  webrtc: MembraneWebRTC | null,
  client: Client,
  deviceId: string,
  sourceType: SourceType,
  setPeersState: React.Dispatch<React.SetStateAction<PeersState>>
): Promise<void> => {
  const localStream: MediaStream | undefined = await getLocalStream(sourceType, deviceId);
  if (!localStream) return;

  setPeersState((prev: PeersState) => {
    let peersState: PeersState = { ...prev };

    localStream.getTracks().forEach((track) => {
      peersState = addOrReplaceTrack(client, track, peersState);
    });

    if (!webrtc) return peersState; // If webrtc is null, we only add media source locally
    if (peersState.mergedScreenRef.refreshId && sourceType == "video") {
      // Rebuild the canvas if camera source changed during screenShare
      shareScreen(webrtc, client, peersState, setPeersState);
      return peersState;
    }

    const newTrack = findTrackByType(client, sourceType, peersState);
    if (!newTrack) return peersState;
    if (peersState.sourceIds[sourceType]) webrtc.replaceTrack(peersState.sourceIds[sourceType], newTrack);
    else peersState.sourceIds[sourceType] = webrtc.addTrack(newTrack, peersState.peers[client.email].stream);

    return peersState;
  });
};

const getLocalStream = async (sourceType: SourceType, deviceId: string): Promise<MediaStream | undefined> => {
  try {
    const constraint = sourceType == "audio" ? AUDIO_CONSTRAINTS : VIDEO_CONSTRAINTS;
    return await navigator.mediaDevices.getUserMedia(getConstraint(constraint, deviceId));
  } catch (error) {
    console.error("Couldn't get microphone permission:", error);
    return undefined;
  }
};

export const leaveWebrtc = (
  webrtc: MembraneWebRTC,
  client: Client,
  webrtcChannel: Channel | undefined,
  setPeersState: React.Dispatch<React.SetStateAction<PeersState>>
) => {
  webrtcChannel?.off("mediaEvent");

  setPeersState((prev) => {
    prev.peers[client.email].stream.getTracks().forEach((track) => track.stop());
    prev = removeMergedStream(prev);
    return removeStream(client, prev);
  });

  webrtc.leave();
};

export const shareScreen = async (
  webrtc: MembraneWebRTC | null,
  user: User,
  peersState: PeersState,
  setPeersState: React.Dispatch<React.SetStateAction<PeersState>>
): Promise<void> => {
  if (!webrtc) return;

  let mergedStream: MediaStream;

  const videoTrackLabel = peersState.peers[user.email].stream.getVideoTracks()[0]?.label;
  if (videoTrackLabel != null) peersState.mergedScreenRef.deviceName = videoTrackLabel;

  try {
    mergedStream = await getMergedTracks(peersState.mergedScreenRef, peersState.peers[user.email].stream);
  } catch (err) {
    console.log(err, "(Probably clicked cancel on the screen sharing window)");
    setPeersState((prev) => removeMergedStream(prev));
    return;
  }

  setPeersState((prev) => {
    let peersState = prev;

    mergedStream.getTracks().forEach((track) => {
      peersState = addOrReplaceTrack(user, track, peersState);

      // When peer's video is muted we want to enable it, so other peers see the screenshare
      sendTrackEnabledMetadata(webrtc, track, peersState);
    });

    const newTrack = findTrackByType(user, "video", peersState);

    if (!newTrack) {
      peersState = removeMergedStream(peersState);
      return peersState;
    }

    if (peersState.sourceIds["video"]) webrtc.replaceTrack(peersState.sourceIds["video"], newTrack);
    else
      peersState = {
        ...peersState,
        sourceIds: {
          ...peersState.sourceIds,
          ["video"]: webrtc.addTrack(newTrack, peersState.peers[user.email].stream),
        },
      };

    return peersState;
  });
};

export const stopShareScreen = (
  webrtc: MembraneWebRTC | null,
  user: User,
  setPeersState: React.Dispatch<React.SetStateAction<PeersState>>
) => {
  setPeersState((peersState: PeersState) => {
    if (peersState.mergedScreenRef.cameraTrack) {
      const newCameraStream: MediaStream = new MediaStream([peersState.mergedScreenRef.cameraTrack]).clone();
      peersState = addOrReplaceTrack(user, newCameraStream.getTracks()[0], peersState);
      peersState = removeMergedStream(peersState);
      const videoTrack = findTrackByType(user, "video", peersState);
      if (!(webrtc && videoTrack)) return peersState;
      if (peersState.sourceIds["video"]) webrtc.replaceTrack(peersState.sourceIds["video"], videoTrack);
      else peersState.sourceIds["video"] = webrtc.addTrack(videoTrack, peersState.peers[user.email].stream);
      sendTrackEnabledMetadata(webrtc, videoTrack, peersState);
    }

    return { ...peersState };
  });
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

export const addOrReplaceTrack = (user: User, track: MediaStreamTrack, peersState: PeersState): PeersState => {
  const presenterStream = peersState.peers[user.email] || { ...user, stream: new MediaStream() };

  const curTrack = findTrackByType(user, track.kind as SourceType, peersState);
  if (curTrack && curTrack.id !== track.id && curTrack.id !== peersState.mergedScreenRef.screenTrack?.id) {
    curTrack.stop();
  }
  curTrack && presenterStream.stream.removeTrack(curTrack);

  presenterStream.stream.addTrack(track);

  return { ...peersState, peers: { ...peersState.peers, [user.email]: presenterStream } };
};

const removeMergedStream = (peersState: PeersState) => {
  const mergedScreenRef = peersState.mergedScreenRef;
  mergedScreenRef.screenTrack?.stop();
  mergedScreenRef.cameraTrack?.stop();
  mergedScreenRef.screenTrack = undefined;
  mergedScreenRef.cameraTrack = undefined;

  clearTimeout(mergedScreenRef.refreshId);
  mergedScreenRef.refreshId = undefined;

  mergedScreenRef.deviceName = "";

  return { ...peersState, mergedScreenRef: mergedScreenRef };
};

const removeStream = (user: User, peersState: PeersState) => {
  const updatedPeers = peersState.peers;
  delete updatedPeers[user.email];
  return { ...peersState, peers: updatedPeers };
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
