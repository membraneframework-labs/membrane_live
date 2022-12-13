import { useToast } from "@chakra-ui/react";

export type Mode = "presenters" | "hls";

export type SourceType = "audio" | "video";

export type RtcStatus = "disconnected" | "connecting" | "rtc_player_ready";

export type ClientStatus = "not_presenter" | "idle" | "connected";

export interface User {
  name: string;
  email: string;
}

export interface Participant extends User {
  isPresenter: boolean;
  isModerator: boolean;
  isAuth: boolean;
  isRequestPresenting: boolean;
  isBannedFromChat: boolean;
}
export interface Presenter extends User {
  rtcStatus: RtcStatus;
  status: ClientStatus;
  connectCallbacks: ((callback: (sourceType: SourceType) => void) => void)[];
  isMicOn?: boolean;
  isCamOn?: boolean;
}

export interface Client extends User {
  isModerator: boolean;
  isAuthenticated: boolean;
}

export type LocationState = {
  pathToReturnTo: string;
};

export type EventFormInput = {
  title: string;
  description: string;
  start_date: string;
  presenters: string[];
};

export type OriginalEventInfo = {
  title: string;
  description: string;
  presenters: string[];
  start_date?: string;
  uuid: string;
  moderator_email?: string;
};

export type EventInfo = {
  title: string;
  description: string;
  presenters: string[];
  startDate: Date;
  uuid: string;
  moderatorEmail: string;
};

export type ModalForm = "create" | "update";

export type AuthTokenKey = "authJwt";

export type RefreshTokenKey = "refreshJwt";

export type AuthResponseData = {
  authToken: AuthTokenKey;
  refreshToken: RefreshTokenKey;
};

export type Toast = ReturnType<typeof useToast>;

export type MetasUser = {
  is_moderator: boolean;
  is_presenter: boolean;
  name: string;
  phx_ref: string;
  is_auth: boolean;
  is_request_presenting: boolean;
  is_banned_from_chat: boolean;
};

export type Metas = {
  metas: [MetasUser];
};

export type ScreenType = {
  orientation: "landscape" | "portrait";
  device: "desktop" | "mobile";
};

export type CurrentEvents = "All events" | "Recorded events";

export type ChatMessage = {
  id: number;
  email: string;
  name: string;
  title: string;
  moderatedNo: number;
  contents: string[];
};

export type AwaitingMessage = {
  email: string;
  name: string;
  content: string;
  time: Date;
};

export type RecievedMessage = {
  email: string;
  name: string;
  content: string;
  offset: number;
};
