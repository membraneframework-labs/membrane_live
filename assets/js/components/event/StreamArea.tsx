import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import ModePanel from "./ModePanel";
import PresenterArea from "./PresenterArea";
import HlsPlayer from "./HlsPlayer";
import { Channel } from "phoenix";
import { useHls } from "../../utils/useHls";
import useCheckScreenType from "../../utils/useCheckScreenType";
import { StreamStartContext } from "../../utils/StreamStartContext";
import { RotateLeft } from "react-swm-icon-pack";
import { HlsConfig } from "hls.js";
import { syncAmIPresenter } from "../../utils/modePanelUtils";
import { switchAskingForBeingPresenter } from "../../utils/channelUtils";
import MobileHlsBar from "./MobileHlsBar";
import type { Mode, Client, PlaylistPlayableMessage } from "../../types/types";
import "../../../css/event/streamarea.css";

type StreamAreaProps = {
  client: Client;
  eventChannel: Channel | undefined;
  privateChannel: Channel | undefined;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  eventTitle: string;
};

const StreamArea = ({ client, eventChannel, privateChannel, mode, setMode, eventTitle }: StreamAreaProps) => {
  const [amIPresenter, setAmIPresenter] = useState<boolean>(false);
  const [presenterName, setPresenterName] = useState<string>("");
  const config = useRef<Partial<HlsConfig>>({
    liveSyncDurationCount: 2,
    initialLiveManifestSize: 2,
    backBufferLength: 30,
  });
  const { attachVideo, setSrc } = useHls(true, false, config.current);
  const screenType = useCheckScreenType();
  const { setStreamStart } = useContext(StreamStartContext);

  const addHlsUrl = useCallback(
    (message: PlaylistPlayableMessage): void => {
      const link = window.location.href.split("event")[0] + "video/";
      if (message.playlist_idl) {
        setSrc(`${link}${message.playlist_idl}/index.m3u8`);
        setPresenterName(message.name);
        if (setStreamStart) setStreamStart(new Date(Date.parse(message.start_time)));
      } else {
        setSrc("");
        setPresenterName("");
        if (setStreamStart) setStreamStart(null);
      }
    },
    [setSrc, setStreamStart]
  );

  useEffect(() => {
    if (eventChannel) {
      eventChannel.on("playlistPlayable", (message) => addHlsUrl(message));
      eventChannel.push("isPlaylistPlayable", {}).receive("ok", (message) => addHlsUrl(message));
      syncAmIPresenter(eventChannel, setAmIPresenter, client);
    }
  }, [addHlsUrl, client, eventChannel]);

  useEffect(() => {
    if (privateChannel) {
      privateChannel.on("presenter_remove", () => setMode("hls"));
    }
  }, [privateChannel, setMode]);

  return (
    <div className="StreamArea">
      {screenType.device == "desktop" && (
        <ModePanel
          mode={mode}
          setMode={setMode}
          presenterName={presenterName}
          eventChannel={eventChannel}
          client={client}
        />
      )}
      <div className="Stream">
        {mode == "hls" &&
          <div className="HlsDiv">
            {presenterName ? (
              <HlsPlayer attachVideo={attachVideo} presenterName={presenterName} eventChannel={eventChannel} />
            ) : (
              <div className="HlsStream">
                <div className="WaitText">
                  <RotateLeft className="RotateIcon" />
                  Waiting for the live stream to start...
                </div>
              </div>
            )}
            {screenType.device == "mobile" && (
              <MobileHlsBar
                client={client}
                eventTitle={eventTitle}
                amIPresenter={amIPresenter}
                setMode={setMode}
                switchAsking={(isAsking) => {
                  switchAskingForBeingPresenter(eventChannel, client.email, isAsking);
                }}
              />
            )}
          </div>
        }
        <PresenterArea client={client} eventChannel={eventChannel} mode={mode} setMode={setMode} />
      </div>
    </div>
  );
};

export default StreamArea;
