import React, { useEffect, useState } from "react";
import { connectWebrtc, leaveWebrtc, SourceType } from "../../utils/rtcUtils";
import { syncPresenters } from "../../utils/channelUtils";
import { MembraneWebRTC } from "@membraneframework/membrane-webrtc-js";
import RtcPlayer from "./RtcPlayer";
import ControlPanel from "./ControlPanel";
import type { Presenter, Client, Mode } from "../../types";
import "../../../css/event/presenterarea.css";
import { Channel } from "phoenix";

const playerCallbacks: { [key: string]: (sourceType: SourceType) => void } = {};
let webrtc: MembraneWebRTC | null = null;
let webrtcConnecting = false;

const includesKey = (storage: Presenter[], key: string): boolean => {
  return storage.some((e) => e.email === key);
};

type PresenterAreaProps = {
  client: Client;
  eventChannel: Channel | undefined;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
};

const PresenterArea = ({ client, eventChannel, mode, setMode }: PresenterAreaProps) => {
  const [presenters, setPresenters] = useState<Presenter[]>([]);
  const [isControlPanelAvailable, setIsControlPanelAvailable] = useState(false);

  useEffect(() => {
    const clientIsPresenter = includesKey(presenters, client.email);
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

  return includesKey(presenters, client.email) ? (
    <div className={`PresenterArea ${mode == "hls" ? "Hidden" : ""}`}>
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
      {isControlPanelAvailable && webrtc && (
        <ControlPanel
          client={client}
          webrtc={webrtc}
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

export default PresenterArea;
