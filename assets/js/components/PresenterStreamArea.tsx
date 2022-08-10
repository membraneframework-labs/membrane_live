import React, { useEffect, useState } from "react";
import { connectWebrtc, leaveWebrtc } from "../utils/rtcUtils";
import { syncPresenters } from "../utils/channelUtils";
import { MembraneWebRTC } from "@membraneframework/membrane-webrtc-js";
import RtcPlayer from "./RtcPlayer";

type PresenterStreamAreaProps = {
  clientName: string;
  eventChannel: any;
};

export const presenterStreams: { [key: string]: MediaStream } = {};
let webrtc: MembraneWebRTC | null = null;

const PresenterStreamArea = ({ clientName, eventChannel }: PresenterStreamAreaProps) => {
  const [streamsAvailable, setStreamsAvailable] = useState<{ [key: string]: boolean }>({});
  const [presenters, setPresenters] = useState<string[]>([]);

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
    syncPresenters(eventChannel, setPresenters);
  }, [eventChannel]);

  return presenters.includes(clientName) ? (
    <>
      {presenters.map((presenter) => {
        return (
          <RtcPlayer
            isMyself={clientName == presenter}
            name={presenter}
            presenterStreams={presenterStreams}
            streamsAvailable={streamsAvailable}
            key={presenter}
          />
        );
      })}
    </>
  ) : (
    <></>
  );
};

export default PresenterStreamArea;
