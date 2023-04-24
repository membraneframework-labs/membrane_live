import { useToast } from "@chakra-ui/react";

export type Mode = "presenters" | "hls";

export type SourceType = "audio" | "video";

export type RtcStatus = "disconnected" | "connecting" | "rtc_player_ready";

export type ClientStatus = "idle" | "connected" | "disconnected";

export type CardStatus = "hidden" | "share" | "chat" | "products";

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

export interface PresenterStream extends User {
  isMicOn?: boolean;
  isCamOn?: boolean;
  stream: MediaStream;
}

export type PeersState = {
  peers: { [key: string]: PresenterStream };
  cameraTrack: MediaStreamTrack | undefined;
  sourceIds: { audio: string; video: string };
  isScreenSharing: boolean;
  isMainPresenter: boolean;
};

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
  is_private: boolean;
};

export type OriginalEventInfo = {
  title: string;
  description: string;
  presenters: string[];
  start_date?: string;
  is_private: boolean;
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
  isPrivate: boolean;
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
  contents: { content: string; offset: number }[];
};

export type AwaitingMessage = {
  email: string;
  name: string;
  content: string;
  offset: number;
};

export type PlaylistPlayableMessage = {
  name: string;
  playlist_idl: string;
  start_time: string;
};

export type PresenterProposition = {
  moderatorTopic: string;
  mainPresenter: boolean;
};

export type PresenterPropositionServer = {
  moderator_topic: string;
  main_presenter: boolean;
};

export type Product = {
  id: string;
  name: string;
  price: string;
  itemUrl: string;
  imageUrl: string;
};
