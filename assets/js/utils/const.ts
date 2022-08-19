export const FRAME_RATE = 24;
export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;

export const AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: true,
  video: false,
};

export const VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: { width: 1280, height: 720, frameRate: FRAME_RATE },
};

export const SCREEN_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT, frameRate: FRAME_RATE },
};
