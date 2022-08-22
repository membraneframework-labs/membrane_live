import React, { useEffect } from "react";
import { useState } from "react";
import ReactHlsPlayer from "react-hls-player";

const HlsPlayer = ({ eventChannel }: any) => {
  const [hlsUrl, setHlsUrl] = useState<string>("");
  const [name, setName] = useState<string>("");

  const addHlsUrl = (message: { name: string; playlist_idl: string }): void => {
    const link = window.location.href.split("event")[0] + "video/";
    if (message.playlist_idl) {
      setHlsUrl(link + message.playlist_idl + "/video.m3u8");
      setName(message.name);
    } else {
      setHlsUrl("");
      setName("");
    }
  };

  useEffect(() => {
    if (eventChannel) {
      eventChannel.on("playlist_playable", (message) => addHlsUrl(message));
      eventChannel.push("isPlaylistPlayable", {}).receive("ok", (message) => addHlsUrl(message));
    }
  }, [eventChannel]);

  return (
    <div className="HlsStream">
      {hlsUrl && (
        <>
          <ReactHlsPlayer src={hlsUrl} autoPlay={true} controls={true} width="60%" height="auto" />
          <h5>{name}</h5>
        </>
      )}
    </div>
  );
};

export default HlsPlayer;
