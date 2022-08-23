import React, { useEffect, useState } from "react";
import ModePanel from "./ModePanel";
import PresenterStreams from "./PresenterStreams";
import HlsPlayer from "./HlsPlayer";
import "../../css/streamarea.css";

export type Mode = "presenters" | "hls";

type StreamAreaProps = {
  clientName: string;
  eventChannel: any;
};

const StreamArea = ({ clientName, eventChannel }: StreamAreaProps) => {
  const [mode, setMode] = useState<Mode>("hls");
  const [hlsUrl, setHlsUrl] = useState<string>("");
  const [presenterName, setPresenterName] = useState<string>("");

  const addHlsUrl = (message: { name: string; playlist_idl: string }): void => {
    const link = window.location.href.split("event")[0] + "video/";
    if (message.playlist_idl) {
      setHlsUrl(link + message.playlist_idl + "/video.m3u8");
      setPresenterName(message.name);
    } else {
      setHlsUrl("");
      setPresenterName("");
    }
  };

  useEffect(() => {
    if (eventChannel) {
      eventChannel.on("playlist_playable", (message) => addHlsUrl(message));
      eventChannel.push("isPlaylistPlayable", {}).receive("ok", (message) => addHlsUrl(message));
    }
  }, [eventChannel]);

  return (
    <div className="StreamArea">
      <ModePanel
        mode={mode}
        setMode={setMode}
        presenterName={presenterName}
        eventChannel={eventChannel}
        clientName={clientName}
      />
      <div className="Stream">
        {mode == "hls" && <HlsPlayer hlsUrl={hlsUrl} presenterName={presenterName} />}
        <div className={mode == "hls" ? "Hidden" : ""}>
          <PresenterStreams clientName={clientName} eventChannel={eventChannel} setMode={setMode} />
        </div>
      </div>
    </div>
  );
};

export default StreamArea;
