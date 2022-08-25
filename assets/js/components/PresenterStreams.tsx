import React, { useEffect, useState } from "react";
import { connectWebrtc, leaveWebrtc, SourceType } from "../utils/rtcUtils";
import { syncPresenters } from "../utils/channelUtils";
import { MembraneWebRTC } from "@membraneframework/membrane-webrtc-js";
import RtcPlayer from "./RtcPlayer";
import ControlPanel from "./ControlPanel";
import { Mode } from "./StreamArea";
import "../../css/presenterstreams.css";

type PresenterStreamAreaProps = {
  clientName: string;
  eventChannel: any;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
};

const playerCallbacks: { [key: string]: (sourceType: SourceType) => void } = {};
let webrtc: MembraneWebRTC | null = null;
let webrtcConnecting: boolean = false;

const PresenterStreams = ({
  clientName,
  eventChannel,
  mode,
  setMode,
}: PresenterStreamAreaProps) => {
  const [presenters, setPresenters] = useState<string[]>([]);
  const [isControlPanelAvailable, setIsControlPanelAvailable] = useState(false);

  useEffect(() => {
    if (!webrtcConnecting && webrtc == null && presenters.includes(clientName)) {
      webrtcConnecting = true;
      connectWebrtc(eventChannel, clientName, playerCallbacks).then((value) => {
        webrtc = value;
        setIsControlPanelAvailable(true);
        webrtcConnecting = false;
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
    <div className={`PresenterStreams ${mode == "hls" ? "Hidden" : ""}`}>
      <div className={`StreamsGrid Grid${presenters.length}`}>
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
      {isControlPanelAvailable && (
        <ControlPanel
          clientName={clientName}
          webrtc={webrtc!}
          eventChannel={eventChannel}
          playerCallback={playerCallbacks[clientName]}
          setMode={setMode}
        />
      )}
    </div>
  ) : (
    <></>
  );
};

export default PresenterStreams;
