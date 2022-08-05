import React, { useEffect, useState } from "react";
import { connectWebrtc } from "../utils/rtcUtils";
import RtcPlayer from "./RtcPlayer";

type PresenterStreamAreaProps = {
  username: string;
  presenters: string[];
  eventChannel: any;
};

export const presenterStreams: { [key: string]: MediaStream } = {};
let isConnected = false;

const PresenterStreamArea = ({ username, presenters, eventChannel }: PresenterStreamAreaProps) => {
  const [streamsAvailable, setStreamsAvailable] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // TODO: self-view
    // implement changing audio/video source
    if (!isConnected && presenters.includes(username)) {
      connectWebrtc(eventChannel, username, streamsAvailable, setStreamsAvailable);
      isConnected = true;
    } else if (isConnected && !presenters.includes(username)) {
      // TODO: leave WebRTC connection
    }
  }, [presenters]);

  return (
    <div>
      {presenters.map((presenter) => {
        return (
          <RtcPlayer
            name={presenter}
            presenterStreams={presenterStreams}
            streamsAvailable={streamsAvailable}
            key={presenter}
          />
        );
      })}
    </div>
  );
};

export default PresenterStreamArea;
