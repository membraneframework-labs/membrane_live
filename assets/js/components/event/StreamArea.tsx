import React, { useEffect, useState } from "react";
import ModePanel from "./ModePanel";
import PresenterStreams from "./PresenterStreams";
import HlsPlayer from "./HlsPlayer";
import { syncCurrentlyStreaming } from "../../utils/channelUtils";
import type { Mode, Client } from "../../types";
import "../../../css/event/streamarea.css";

type StreamAreaProps = {
  client: Client;
  eventChannel: any;
  privateChannel: any;
};

const StreamArea = ({ client, eventChannel, privateChannel }: StreamAreaProps) => {
  const [mode, setMode] = useState<Mode>("hls");
  const [hlsUrl, setHlsUrl] = useState<string>("");
  const [currentlyStreamingName, setCurrentlyStreamingName] = useState<string>("");

  const addHlsUrl = (message: { name: string; playlist_idl: string }): void => {
    const link = window.location.href.split("event")[0] + "video/";
    if (message.playlist_idl) {
      setHlsUrl(`${link}${message.playlist_idl}/index.m3u8`);
    } else {
      setHlsUrl("");
    }
    // message.name is ignored as it is not necessary in this implementation
  };

  useEffect(() => {
    syncCurrentlyStreaming(eventChannel, setCurrentlyStreamingName);
  }, [eventChannel]);

  useEffect(() => {
    if (eventChannel && privateChannel) {
      privateChannel.on("presenter_remove", () => setMode("hls"));
      eventChannel.on("playlist_playable", (message) => addHlsUrl(message));
      eventChannel.push("isPlaylistPlayable", {}).receive("ok", (message) => addHlsUrl(message));
    }
  }, [eventChannel, privateChannel]);

  return (
    <div className="StreamArea">
      <ModePanel
        mode={mode}
        setMode={setMode}
        currentlyStreamingName={currentlyStreamingName}
        eventChannel={eventChannel}
        client={client}
      />
      <div className="Stream">
        {mode == "hls" && (
          <HlsPlayer hlsUrl={hlsUrl} currentlyStreamingName={currentlyStreamingName} />
        )}
        <PresenterStreams
          client={client}
          eventChannel={eventChannel}
          mode={mode}
          setMode={setMode}
        />
      </div>
    </div>
  );
};

export default StreamArea;
