import { FRAME_RATE, SCREEN_CONSTRAINTS, CANVAS_HEIGHT, CANVAS_WIDTH } from "./const";
import type { MergedScreenRef } from "./rtcUtils";

export const getMergedTracks = async (
  mergedScreenRef: MergedScreenRef,
  presenterStream: MediaStream
) => {
  mergedScreenRef.refreshId && stopRefreshingAndRemovePreviousScreen(mergedScreenRef);

  const screenStream: MediaStream = mergedScreenRef.screenTrack
    ? new MediaStream([mergedScreenRef.screenTrack])
    : await navigator.mediaDevices.getDisplayMedia(SCREEN_CONSTRAINTS);

  const cameraStream: MediaStream = mergedScreenRef.cameraTrack
    ? new MediaStream([mergedScreenRef.cameraTrack])
    : new MediaStream(presenterStream.getVideoTracks()).clone();

  mergedScreenRef.screenTrack = screenStream.getVideoTracks()[0];
  mergedScreenRef.cameraTrack = cameraStream.getVideoTracks()[0];

  if (!mergedScreenRef.cameraTrack.enabled) return screenStream;

  const camera = await attachToDOM("justCamera", cameraStream);
  const screen = await attachToDOM("justScreenShare", screenStream);

  let canvasElement = document.createElement("canvas");
  let canvasCtx = canvasElement.getContext("2d");

  canvasCtx
    ? await makeComposite(canvasElement, canvasCtx, camera, screen, mergedScreenRef)
    : console.error("CanvasCtx is null", canvasCtx);

  return canvasElement.captureStream(FRAME_RATE);
};

const attachToDOM = async (id: string, stream: MediaStream) => {
  let videoElem = document.createElement("video");
  videoElem.id = id;
  videoElem.width = CANVAS_WIDTH;
  videoElem.height = CANVAS_HEIGHT;
  videoElem.autoplay = true;
  videoElem.setAttribute("playsinline", "true");
  videoElem.srcObject = stream;
  return videoElem;
};

const makeComposite = async (
  canvasElement: HTMLCanvasElement,
  canvasCtx: CanvasRenderingContext2D,
  camera: HTMLVideoElement,
  screen: HTMLVideoElement,
  mergedScreenRef: MergedScreenRef
) => {
  canvasCtx.save();
  canvasElement.setAttribute("width", `${screen.width}px`);
  canvasElement.setAttribute("height", `${screen.height}px`);
  canvasCtx.clearRect(0, 0, screen.width, screen.height);
  canvasCtx.drawImage(screen, 0, 0, screen.width, screen.height);
  canvasCtx.drawImage(
    camera,
    0,
    Math.floor(screen.height - screen.height / 4),
    Math.floor(screen.width / 4),
    Math.floor(screen.height / 4)
  );

  let imageData = canvasCtx.getImageData(0, 0, screen.width, screen.height);
  canvasCtx.putImageData(imageData, 0, 0);
  canvasCtx.restore();

  mergedScreenRef.refreshId = requestVideoFrame(() =>
    makeComposite(canvasElement, canvasCtx, camera, screen, mergedScreenRef)
  );
};

const stopRefreshingAndRemovePreviousScreen = (mergedScreenRef: MergedScreenRef): void => {
  clearTimeout(mergedScreenRef.refreshId);
  mergedScreenRef.refreshId = undefined;
};

const requestVideoFrame = (callback: Function) => {
  return setTimeout(() => {
    callback();
  }, 1000 / FRAME_RATE);
};
