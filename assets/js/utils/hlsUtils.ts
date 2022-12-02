import React, { useEffect, useRef, useState } from "react";
import Hls, { HlsConfig } from "hls.js";

export const useHls = (
  autoPlay: boolean,
  hlsConfig?: Partial<HlsConfig>
): {
  attachVideo: (videoElem: HTMLVideoElement | null) => void;
  setSrc: React.Dispatch<React.SetStateAction<string>>;
} => {
  const hls = useRef<Hls>(new Hls({ enableWorker: false, ...hlsConfig }));
  const playerRef = useRef<HTMLVideoElement>();
  const [src, setSrc] = useState<string>("");

  const attachVideo = (video_ref: HTMLVideoElement | null) => {
    if (hls && video_ref) {
      playerRef.current = video_ref;
      hls.current.attachMedia(video_ref);
    }
  };

  useEffect(() => {
    const initHls = () => {
      if (hls) {
        hls.current.destroy();
      }

      hls.current = new Hls({ enableWorker: false, ...hlsConfig });

      hls.current.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.current.loadSource(src);
      });

      hls.current.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) {
          playerRef?.current
            ?.play()
            .catch(() =>
              console.log("Unable to autoplay, HTMLVideoElement propably does not exist")
            );
        }
      });

      if (playerRef.current) attachVideo(playerRef.current);

      hls.current.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.current.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.current.recoverMediaError();
              break;
            default:
              initHls();
              break;
          }
        }
      });
    };

    if (Hls.isSupported()) initHls();

    return () => {
      if (hls) hls.current.destroy();
    };
  }, [src]);

  return { attachVideo, setSrc };
};
