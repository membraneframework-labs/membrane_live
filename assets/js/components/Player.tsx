import React, { useEffect } from 'react';
import { useState } from "react";
import ReactHlsPlayer from "react-hls-player";


const HLSPlayer = ({eventChannel}: any) => {
  const [hlsUrl, setHlsUrl] = useState<string>("");

  useEffect(() => {
    if(eventChannel) {

      eventChannel.on("playlist_playable", (message) => {
        setHlsUrl("http://localhost:4000/video/" + message.playlist_idl + "/video.m3u8");
      });
      eventChannel.push("isPlaylistPlayable", {})
        .receive("ok", (message) => {
          if (message.is_playlist_playable)
          setHlsUrl("http://localhost:4000/video/" + message.playlist_idl + "/video.m3u8");
        })
    }
  }, [eventChannel]);

  return (
    <div className="row justify-content-center">
      {hlsUrl && 
        <ReactHlsPlayer
          src={hlsUrl}
          autoPlay={true}
          controls={true}
          width="60%"
          height="auto"
        />
      }
    </div>
  );
}

export default HLSPlayer;