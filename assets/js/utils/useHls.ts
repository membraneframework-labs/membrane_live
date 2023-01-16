import React, { useCallback, useEffect, useRef, useState } from "react";
import Hls, { HlsConfig } from "hls.js";
import { useStartStream } from "./StreamStartContext";

export const useHls = (
  autoPlay: boolean,
  hlsConfig?: Partial<HlsConfig>
): {
  attachVideo: (videoElem: HTMLVideoElement | null) => void;
  setSrc: React.Dispatch<React.SetStateAction<string>>;
  enablePictureInPicture: () => void;
} => {
  const [src, setSrc] = useState<string>("");
  const hls = useRef<Hls>(new Hls({ enableWorker: false, ...hlsConfig }));
  const playerRef = useRef<HTMLVideoElement>();
  const { setStreamStart } = useStartStream();

  const attachVideo = useCallback(
    (video_ref: HTMLVideoElement | null) => {
      if (hls && video_ref) {
        playerRef.current = video_ref;
        hls.current.attachMedia(video_ref);
      }
    },
    [hls, playerRef]
  );

  const enablePictureInPicture = useCallback(() => {
    const video = playerRef.current;
    if (video && document.pictureInPictureEnabled) {
      video.requestPictureInPicture().catch((e) => {
        console.log("Picture in picture could not be opened when clicking the product link. Reason: ", e);
      });
    }
  }, [playerRef]);

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
            .catch(() => console.log("Unable to autoplay, HTMLVideoElement probably does not exist"));
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
  }, [attachVideo, autoPlay, hlsConfig, setStreamStart, src]);

  useEffect(() => {
    const video: HTMLVideoElement | null = document.getElementById("hlsVideo") as HTMLVideoElement;
    if (!Hls.isSupported() && video && video.canPlayType("application/vnd.apple.mpegurl")) video.src = src;
  }),
    [src];

  return { attachVideo, setSrc, enablePictureInPicture };
};
