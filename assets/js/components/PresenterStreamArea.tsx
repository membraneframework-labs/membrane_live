import React, { useEffect, useState } from "react";
import { connectWebrtc, leaveWebrtc, replaceTrack } from "../utils/rtcUtils";
import { MembraneWebRTC } from "@membraneframework/membrane-webrtc-js";
import { RtcPlayer, RtcClientPlayer } from "./RtcPlayer";
import type { SourceType } from "./ControlPanel";
import ControlPanel from "./ControlPanel";

type PresenterStreamAreaProps = {
  clientName: string;
  presenters: string[];
  eventChannel: any;
};

export const presenterStreams: { [key: string]: MediaStream } = {};
let webrtc: MembraneWebRTC | null = null;

export const findTrackBySource = (clientName: string, sourceType: SourceType) => {
  return presenterStreams[clientName].getTracks().find((track) => track.kind == sourceType);
};

export const changeIsTrackEnabled = (clientName: string, sourceType: SourceType, mode: boolean) => {
  const track = findTrackBySource(clientName, sourceType);
  if (track != undefined) {
    track.enabled = mode;
  }
};

const addMediaStreamTrack = (
  clientName: string,
  mediaStream: MediaStream,
  sourceType: SourceType
) => {
  if (presenterStreams[clientName] == undefined) presenterStreams[clientName] = new MediaStream();
  else {
    const curTrack = findTrackBySource(clientName, sourceType);
    curTrack?.stop();
    curTrack && presenterStreams[clientName].removeTrack(curTrack);
  }
  mediaStream.getTracks().forEach((track) => presenterStreams[clientName].addTrack(track));
};

export const addClientMediaStream = (
  clientName: string,
  mediaStream: MediaStream,
  sourceType: SourceType,
  setLastSourceTypeChange: React.Dispatch<React.SetStateAction<SourceType | null>>
) => {
  addMediaStreamTrack(clientName, mediaStream, sourceType);
  setLastSourceTypeChange(sourceType);
};

export const addPresenterMediaStream = (
  clientName: string,
  mediaStream: MediaStream,
  sourceType: SourceType,
  streamsAvailable: { [key: string]: boolean },
  setStreamsAvailable: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>
) => {
  addMediaStreamTrack(clientName, mediaStream, sourceType);
  setStreamsAvailable({ ...streamsAvailable, ...{ [clientName]: true } });
};

const PresenterStreamArea = ({
  clientName,
  presenters,
  eventChannel,
}: PresenterStreamAreaProps) => {
  const [streamsAvailable, setStreamsAvailable] = useState<{ [key: string]: boolean }>({});
  const [lastSourceTypeChange, setLastSourceTypeChange] = useState<SourceType | null>(null);

  useEffect(() => {
    if (webrtc == null && presenters.includes(clientName)) {
      connectWebrtc(eventChannel, clientName, streamsAvailable, setStreamsAvailable).then(
        (value) => {
          webrtc = value;
        }
      );
    } else if (webrtc != null && !presenters.includes(clientName)) {
      leaveWebrtc(webrtc, clientName, streamsAvailable, setStreamsAvailable, eventChannel);
      webrtc = null;
    }
  }, [presenters]);

  useEffect(() => {
    if (lastSourceTypeChange != null)
      replaceTrack(webrtc, clientName, presenterStreams[clientName], lastSourceTypeChange);
  }, [lastSourceTypeChange]);

  return presenters.includes(clientName) ? (
    <>
      <RtcClientPlayer name={clientName} clientStreamAvailable={lastSourceTypeChange!} />
      {presenters
        .filter((presenter) => presenter != clientName)
        .map((presenter) => {
          return (
            <RtcPlayer
              isMyself={clientName == presenter}
              name={presenter}
              streamsAvailable={streamsAvailable}
              key={presenter}
            />
          );
        })}
      <ControlPanel clientName={clientName} setLastSourceTypeChange={setLastSourceTypeChange} />
    </>
  ) : (
    <></>
  );
};

export default PresenterStreamArea;
