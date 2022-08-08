import React, { useEffect } from "react";
import { useState } from "react";
import ReactHlsPlayer from "react-hls-player";

const HlsPlayer = ({ eventChannel }: any) => {
  const [hlsUrl, setHlsUrl] = useState<string>("");

  useEffect(() => {
    if (eventChannel) {
      const link = window.location.href.split("event")[0] + "video/";
      eventChannel.on("playlist_playable", (message) => {
        setHlsUrl(link + message.playlist_idl + "/video.m3u8");
      });
      eventChannel.push("isPlaylistPlayable", {}).receive("ok", (message) => {
        if (message.is_playlist_playable) setHlsUrl(link + message.playlist_idl + "/video.m3u8");
      });
    }
  }, [eventChannel]);

  return (
    <div className="row justify-content-center">
      {hlsUrl && (
        <ReactHlsPlayer src={hlsUrl} autoPlay={true} controls={true} width="60%" height="auto" />
      )}
    </div>
  );
};

export default HlsPlayer;
