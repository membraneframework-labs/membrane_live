import React, { useEffect, useState } from "react";
import { connectWebrtc, leaveWebrtc } from "../utils/rtcUtils";
import { MembraneWebRTC } from "@membraneframework/membrane-webrtc-js";
import RtcPlayer from "./RtcPlayer";

type PresenterStreamAreaProps = {
  clientName: string;
  presenters: string[];
  eventChannel: any;
};

export const presenterStreams: { [key: string]: MediaStream } = {};
let webrtc: Promise<MembraneWebRTC> | null = null;

const PresenterStreamArea = ({
  clientName,
  presenters,
  eventChannel,
}: PresenterStreamAreaProps) => {
  const [streamsAvailable, setStreamsAvailable] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (webrtc == null && presenters.includes(clientName)) {
      webrtc = connectWebrtc(eventChannel, clientName, streamsAvailable, setStreamsAvailable);
    } else if (webrtc != null && !presenters.includes(clientName)) {
      leaveWebrtc(webrtc, clientName, streamsAvailable, setStreamsAvailable, eventChannel);
      webrtc = null;
    }
  }, [presenters]);

  return presenters.includes(clientName) ? (
    <>
      {presenters.map((presenter) => {
        return (
          <RtcPlayer
            clientName={clientName}
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
