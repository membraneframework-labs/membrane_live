import React, { useEffect, useState } from "react";
import { connectWebrtc, leaveWebrtc, SourceType } from "../utils/rtcUtils";
import { syncPresenters } from "../utils/channelUtils";
import { MembraneWebRTC } from "@membraneframework/membrane-webrtc-js";
import RtcPlayer from "./RtcPlayer";
import ControlPanel from "./ControlPanel";
import "../../css/presenterstreams.css";

type PresenterStreamAreaProps = {
  clientName: string;
  eventChannel: any;
};

const playerCallbacks: { [key: string]: (sourceType: SourceType) => void } = {};
let webrtc: MembraneWebRTC | null = null;

const PresenterStreams = ({ clientName, eventChannel }: PresenterStreamAreaProps) => {
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
      <div className="PresenterStreams">
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
      </div>
      <div className="ControlPanel">
        {isControlPanelAvailable && (
          <ControlPanel
            clientName={clientName}
            webrtc={webrtc!}
            playerCallback={playerCallbacks[clientName]}
          />
        )}
      </div>
    </>
  ) : (
    <></>
  );
};

export default PresenterStreams;
