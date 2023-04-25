import { MembraneWebRTC, SerializedMediaEvent, TrackContext } from "@jellyfish-dev/membrane-webrtc-js";
import { AUDIO_CONSTRAINTS, VIDEO_CONSTRAINTS, SCREEN_CONSTRAINTS } from "./const";
import { Channel } from "phoenix";
import type { User, Client, SourceType, PeersState } from "../types/types";
import React from "react";

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
  peersState: PeersState
) => {
  const track = findTrackByType(user, sourceType, peersState);

  if (track) {
    track.enabled = !track.enabled;
    webrtc && updateTrackMetadata(webrtc, track, peersState);
  }
};

export const sendTrackStatusUpdate = (
  webrtc: MembraneWebRTC,
  user: User,
  sourceType: SourceType,
  peersState: PeersState
): void => {
  const track = findTrackByType(user, sourceType, peersState);
  track && updateTrackMetadata(webrtc, track, peersState);
};

export const checkTrackIsEnabled = (user: User, sourceType: SourceType, peersState: PeersState) => {
  const track = findTrackByType(user, sourceType, peersState);
  return track?.enabled;
};

export const getCurrentDeviceName = (client: Client, sourceType: SourceType, peersState: PeersState) => {
  return findTrackByType(client, sourceType, peersState)?.label;
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
              { mainPresenter: prev.isMainPresenter, isScreenSharing: prev.isScreenSharing },
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

export const shareScreen = async (
  webrtc: MembraneWebRTC | null,
  client: Client,
  setPeersState: React.Dispatch<React.SetStateAction<PeersState>>
): Promise<void> => {
  const screenStream: MediaStream = await navigator.mediaDevices.getDisplayMedia(SCREEN_CONSTRAINTS);

  setPeersState((prev: PeersState) => {
    let peersState: PeersState = { ...prev };
    peersState.isScreenSharing = true;

    screenStream.getTracks().forEach((track) => {
      peersState = addOrReplaceTrack(client, track, peersState);
    });

    if (!webrtc) return peersState; // If webrtc is null, we only add media source locally

    const newTrack = findTrackByType(client, "video", peersState);
    if (!newTrack) return peersState;

    peersState = addOrReplaceWebrtcTrack(webrtc, client, newTrack, peersState, "video");

    if (peersState.cameraTrack) peersState.cameraTrack.enabled = false;

    return peersState;
  });
};

export const stopShareScreen = async (
  webrtc: MembraneWebRTC | null,
  client: Client,
  setPeersState: React.Dispatch<React.SetStateAction<PeersState>>
): Promise<void> => {
  setPeersState((prev: PeersState) => {
    let peersState: PeersState = { ...prev };
    peersState.isScreenSharing = false;

    if (!peersState.cameraTrack) {
      return peersState;
    }

    peersState.cameraTrack.enabled = true;
    peersState = addOrReplaceTrack(client, peersState.cameraTrack, peersState);

    if (!webrtc) return peersState; // If webrtc is null, we only add media source locally

    const newTrack = findTrackByType(client, "video", peersState);
    if (!newTrack) return peersState;

    peersState = addOrReplaceWebrtcTrack(webrtc, client, newTrack, peersState, "video");

    return peersState;
  });
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

    const newTrack = findTrackByType(client, sourceType, peersState);
    if (!newTrack) return peersState;

    peersState = addOrReplaceWebrtcTrack(webrtc, client, newTrack, peersState, sourceType);

    return peersState;
  });
};

export const leaveWebrtc = (
  webrtc: MembraneWebRTC | null,
  client: Client,
  webrtcChannel: Channel | undefined,
  setPeersState: React.Dispatch<React.SetStateAction<PeersState>>
) => {
  webrtcChannel?.off("mediaEvent");

  setPeersState((prev) => {
    prev.peers[client.email]?.stream.getTracks().forEach((track) => track.stop());
    return removeStream(client, prev);
  });

  webrtc?.leave();
};

export const addOrReplaceTrack = (user: User, track: MediaStreamTrack, peersState: PeersState): PeersState => {
  const presenterStream = peersState.peers[user.email] || { ...user, stream: new MediaStream() };

  const curTrack = findTrackByType(user, track.kind as SourceType, peersState);
  if (curTrack && curTrack.id !== track.id && !peersState.isScreenSharing) {
    curTrack.stop();
  }

  if (curTrack && peersState.isScreenSharing) {
    peersState.cameraTrack = curTrack;
  }

  curTrack && presenterStream.stream.removeTrack(curTrack);

  presenterStream.stream.addTrack(track);

  return { ...peersState, peers: { ...peersState.peers, [user.email]: presenterStream } };
};

export const removeStream = (user: User, peersState: PeersState) => {
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

const updateTrackMetadata = (webrtc: MembraneWebRTC, track: MediaStreamTrack, peersState: PeersState) => {
  const metadata = getTrackMetadata(track, peersState);
  webrtc.updateTrackMetadata(peersState.sourceIds[track.kind as SourceType], metadata);
};

const getTrackMetadata = (track: MediaStreamTrack, peersState: PeersState) => {
  return {
    mainPresenter: peersState.isMainPresenter,
    isScreenSharing: peersState.isScreenSharing,
    enabled: track.enabled,
  };
};

const addOrReplaceWebrtcTrack = (
  webrtc: MembraneWebRTC,
  client: Client,
  track: MediaStreamTrack,
  peersState: PeersState,
  sourceType: SourceType
): PeersState => {
  if (peersState.sourceIds[sourceType]) webrtcReplaceTrack(webrtc, track, peersState, sourceType);
  else peersState.sourceIds[sourceType] = webrtcAddTrack(webrtc, track, peersState, client);

  return peersState;
};

const webrtcAddTrack = (
  webrtc: MembraneWebRTC,
  track: MediaStreamTrack,
  peersState: PeersState,
  client: Client
): string => {
  const metadata = getTrackMetadata(track, peersState);
  return webrtc.addTrack(track, peersState.peers[client.email].stream, metadata);
};

const webrtcReplaceTrack = (
  webrtc: MembraneWebRTC,
  track: MediaStreamTrack,
  peersState: PeersState,
  sourceType: SourceType
): Promise<boolean> => {
  const metadata = getTrackMetadata(track, peersState);
  return webrtc.replaceTrack(peersState.sourceIds[sourceType], track, metadata);
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

const getLocalStream = async (sourceType: SourceType, deviceId: string): Promise<MediaStream | undefined> => {
  try {
    const constraint = sourceType == "audio" ? AUDIO_CONSTRAINTS : VIDEO_CONSTRAINTS;
    return await navigator.mediaDevices.getUserMedia(getConstraint(constraint, deviceId));
  } catch (error) {
    console.error("Couldn't get microphone permission:", error);
    return undefined;
  }
};
