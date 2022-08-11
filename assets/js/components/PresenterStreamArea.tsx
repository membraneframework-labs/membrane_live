import React, { useEffect, useState } from "react";
import { connectWebrtc, leaveWebrtc } from "../utils/rtcUtils";
import { syncPresenters } from "../utils/channelUtils";
import { MembraneWebRTC } from "@membraneframework/membrane-webrtc-js";
import RtcPlayer from "./RtcPlayer";

type PresenterStreamAreaProps = {
  clientName: string;
  eventChannel: any;
};

const playerCallbacks: { [key: string]: () => void } = {};
let webrtc: MembraneWebRTC | null = null;

const PresenterStreamArea = ({ clientName, eventChannel }: PresenterStreamAreaProps) => {
  const [presenters, setPresenters] = useState<string[]>([]);

  useEffect(() => {
    if (webrtc == null && presenters.includes(clientName)) {
      connectWebrtc(eventChannel, clientName, playerCallbacks).then((value) => {
        webrtc = value;
      });
    } else if (webrtc != null && !presenters.includes(clientName)) {
      leaveWebrtc(webrtc, clientName, eventChannel);
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
            playerCallbacks={playerCallbacks}
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
