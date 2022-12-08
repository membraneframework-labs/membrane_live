import React, { useContext, useEffect, useRef, useState } from "react";
import Hls, { HlsConfig } from "hls.js";
import { StreamStartContext } from "./StreamStartContext";

export const useHls = (
  autoPlay: boolean,
  hlsConfig?: Partial<HlsConfig>,
): {
  attachVideo: (videoElem: HTMLVideoElement | null) => void;
  setSrc: React.Dispatch<React.SetStateAction<string>>;
} => {
  const hls = useRef<Hls>(new Hls({ enableWorker: false, ...hlsConfig }));
  const playerRef = useRef<HTMLVideoElement>();
  const { setStreamStart } = useContext(StreamStartContext);
  const [src, setSrc] = useState<string>("");
  const totalDuration = useRef<number | null>(null);

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

      hls.current.on(Hls.Events.LEVEL_LOADED, (_event, data) => {
        // cos sie znowu zepsulo z ptsami
        console.log("TOTAL DURATION", data.details.totalduration);
        totalDuration.current = data.details.totalduration;
      })

      hls.current.once(Hls.Events.FRAG_LOADED, () => {
        if (totalDuration.current != null && setStreamStart) {
          console.log("START TIME", new Date(Date.now() - totalDuration.current * 1000))
          setStreamStart(new Date(Date.now() - totalDuration.current * 1000));
        }
      })
    };

    if (Hls.isSupported()) initHls();

    return () => {
      if (hls) hls.current.destroy();
    };
  }, [src]);

  return { attachVideo, setSrc };
};
