import { GsiButtonConfiguration } from "google-one-tap";
import { HlsConfig } from "hls.js";

export const FRAME_RATE = 24;
export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;

export const MILLISECONDS_IN_MINUTE = 60_000;
export const DESCRIPTION_CHAR_LIMIT = 255;

export const AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: true,
  video: false,
};

export const VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    width: 1920,
    height: 1080,
    frameRate: FRAME_RATE,
  },
};

export const SCREEN_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    frameRate: FRAME_RATE,
  },
};

export const shortMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const pageTitlePrefix = "Membrane Live";

export const roundedGoogleButton: GsiButtonConfiguration = {
  theme: "outline",
  type: "icon",
  size: "large",
  logo_alignment: "left",
  shape: "circle",
};

export const rectangleGoogleButton: GsiButtonConfiguration = {
  theme: "outline",
  size: "large",
  logo_alignment: "left",
  shape: "pill",
  text: "signin_with",
};

export const liveConfig: Partial<HlsConfig> = {
  lowLatencyMode: true,
};

export const recordingConfig: Partial<HlsConfig> = {
  lowLatencyMode: false,
};
