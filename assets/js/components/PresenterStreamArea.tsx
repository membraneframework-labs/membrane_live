import React, { useEffect, useState } from "react";
import { connectWebrtc, leaveWebrtc } from "../utils/rtcUtils";
import RtcPlayer from "./RtcPlayer";

type PresenterStreamAreaProps = {
  username: string;
  presenters: string[];
  eventChannel: any;
};

export const presenterStreams: { [key: string]: MediaStream } = {};
let webrtc: any = null;

const PresenterStreamArea = ({ username, presenters, eventChannel }: PresenterStreamAreaProps) => {
  const [streamsAvailable, setStreamsAvailable] = useState<{ [key: string]: boolean }>({});

useEffect(() => {
    if (webrtc == null && presenters.includes(username)) {
      webrtc = connectWebrtc(eventChannel, username, streamsAvailable, setStreamsAvailable);
    } else if (webrtc != null && !presenters.includes(username)) {
      leaveWebrtc(webrtc, username, streamsAvailable, setStreamsAvailable, eventChannel);
      webrtc = null;
    }
  }, [presenters]);

  return (
    presenters.includes(username) ?
      (<>
        {presenters.map((presenter) => {
          return (
            <RtcPlayer
              username={username}
              name={presenter}
              presenterStreams={presenterStreams}
              streamsAvailable={streamsAvailable}
              key={presenter}
            />
          );
        })}
      </>)
     : <></>
  );
};

export default PresenterStreamArea;
