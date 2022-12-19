import React, { useContext, useEffect, useState } from "react";
import ModePanel from "./ModePanel";
import PresenterArea from "./PresenterArea";
import HlsPlayer from "./HlsPlayer";
import type { Mode, Client, PlaylistPlayableMessage } from "../../types/types";
import { Channel } from "phoenix";
import { useHls } from "../../utils/useHls";
import useCheckScreenType from "../../utils/useCheckScreenType";
import "../../../css/event/streamarea.css";
import { StreamStartContext } from "../../utils/StreamStartContext";

type StreamAreaProps = {
  client: Client;
  eventChannel: Channel | undefined;
  privateChannel: Channel | undefined;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
};

const StreamArea = ({ client, eventChannel, privateChannel, mode, setMode }: StreamAreaProps) => {
  const [presenterName, setPresenterName] = useState<string>("");
  const { attachVideo, setSrc } = useHls(true, {
    liveSyncDurationCount: 2,
    initialLiveManifestSize: 2,
    backBufferLength: 30,
  });
  const screenType = useCheckScreenType();
  const { setStreamStart } = useContext(StreamStartContext);

  const addHlsUrl = (message: PlaylistPlayableMessage): void => {
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
  };

  useEffect(() => {
    if (eventChannel) {
      eventChannel.on("playlistPlayable", (message) => addHlsUrl(message));
      eventChannel.push("isPlaylistPlayable", {}).receive("ok", (message) => addHlsUrl(message));
    }
  }, [eventChannel]);

  useEffect(() => {
    if (privateChannel) {
      privateChannel.on("presenter_remove", () => setMode("hls"));
    }
  }, [privateChannel]);

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
        {mode == "hls" && (
          <HlsPlayer attachVideo={attachVideo} presenterName={presenterName} eventChannel={eventChannel} />
        )}
        <PresenterArea client={client} eventChannel={eventChannel} mode={mode} setMode={setMode} />
      </div>
    </div>
  );
};

export default StreamArea;
