import React, { useEffect, useState } from "react";
import { connectWebrtc, leaveWebrtc } from "../utils/rtcUtils";
import { syncPresenters } from "../utils/channelUtils";
import { MembraneWebRTC } from "@membraneframework/membrane-webrtc-js";
import RtcPlayer from "./RtcPlayer";
import ControlPanel from "./ControlPanel";

type PresenterStreamAreaProps = {
  clientName: string;
  eventChannel: any;
};

const playerCallbacks: { [key: string]: () => void } = {};
let webrtc: MembraneWebRTC | null = null;

const PresenterStreamArea = ({ clientName, eventChannel }: PresenterStreamAreaProps) => {
  const [presenters, setPresenters] = useState<string[]>([]);
  const [isControlPanelAvailable, setIsControlPanelAvailable] = useState(false);

  useEffect(() => {
    if (webrtc == null && presenters.includes(clientName)) {
      connectWebrtc(eventChannel, clientName, playerCallbacks).then((value) => {
        webrtc = value;
        setIsControlPanelAvailable(true);
      });
    } else if (webrtc != null && !presenters.includes(clientName)) {
      leaveWebrtc(webrtc, clientName, eventChannel);
      webrtc = null;
      setIsControlPanelAvailable(false);
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
      {isControlPanelAvailable && (
        <ControlPanel
          clientName={clientName}
          webrtc={webrtc!}
          playerCallback={playerCallbacks[clientName]}
        />
      )}
    </>
  ) : (
    <></>
  );
};

export default PresenterStreamArea;
