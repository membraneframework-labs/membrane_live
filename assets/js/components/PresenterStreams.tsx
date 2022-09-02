import React, { useEffect, useState } from "react";
import { connectWebrtc, leaveWebrtc, SourceType } from "../utils/rtcUtils";
import { syncPresenters } from "../utils/channelUtils";
import { MembraneWebRTC } from "@membraneframework/membrane-webrtc-js";
import RtcPlayer from "./RtcPlayer";
import ControlPanel from "./ControlPanel";
import { Mode } from "./StreamArea";
import type { Client } from "../pages/Event";
import "../../css/presenterstreams.css";

export type Presenter = {
  name: string;
  email: string;
};

type PresenterStreamAreaProps = {
  client: Client;
  eventChannel: any;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
};

const playerCallbacks: { [key: string]: (sourceType: SourceType) => void } = {};
let webrtc: MembraneWebRTC | null = null;
let webrtcConnecting: boolean = false;

const includeKey = (storage: Presenter[], key: string): boolean => {
  return storage.some((e) => e.email === key);
};

const PresenterStreams = ({ client, eventChannel, mode, setMode }: PresenterStreamAreaProps) => {
  const [presenters, setPresenters] = useState<Presenter[]>([]);
  const [isControlPanelAvailable, setIsControlPanelAvailable] = useState(false);

  useEffect(() => {
    const clientIsPresenter = includeKey(presenters, client.email);
    if (!webrtcConnecting && webrtc == null && clientIsPresenter) {
      webrtcConnecting = true;
      connectWebrtc(eventChannel, client, playerCallbacks).then((value) => {
        webrtc = value;
        setIsControlPanelAvailable(true);
        webrtcConnecting = false;
      });
    } else if (webrtc != null && !clientIsPresenter) {
      leaveWebrtc(webrtc, client, eventChannel);
      webrtc = null;
      setIsControlPanelAvailable(false);
    }
  }, [presenters]);

  useEffect(() => {
    syncPresenters(eventChannel, setPresenters);
  }, [eventChannel]);

  return includeKey(presenters, client.email) ? (
    <div className={`PresenterStreams ${mode == "hls" ? "Hidden" : ""}`}>
      <div className={`StreamsGrid Grid${presenters.length}`}>
        {presenters.map((presenter) => {
          return (
            <RtcPlayer
              isMyself={client.email == presenter.email}
              presenter={presenter}
              playerCallbacks={playerCallbacks}
              key={presenter.email}
            />
          );
        })}
      </div>
      {isControlPanelAvailable && (
        <ControlPanel
          client={client}
          webrtc={webrtc!}
          eventChannel={eventChannel}
          playerCallback={playerCallbacks[client.email]}
          setMode={setMode}
        />
      )}
    </div>
  ) : (
    <></>
  );
};

export default PresenterStreams;
