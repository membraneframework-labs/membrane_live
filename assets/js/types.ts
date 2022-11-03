import { useToast } from "@chakra-ui/react";

export type Participant = {
  email: string;
  name: string;
  isPresenter: boolean;
  isModerator: boolean;
  isAuth: boolean;
  isRequestPresenting: boolean;
};

export type Presenter = {
  name: string;
  email: string;
};

export type Mode = "presenters" | "hls";

export type Client = {
  name: string;
  email: string;
  isModerator: boolean;
  isAuthenticated: boolean;
};

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

type MetasUser = {
  is_moderator: boolean;
  is_presenter: boolean;
  name: string;
  phx_ref: string;
  is_auth: boolean;
  is_request_presenting: boolean;
};

export type Metas = {
  metas: [MetasUser];
};

export type GoogleResponse = {
  clientId: string;
  credential: string;
  select_by: string;
};

export type GoogleButtonOptions = {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: string;
  locale?: string;
};

export type ScreenType = {
  orientation: "landscape" | "portrait";
  device: "desktop" | "mobile";
};

export type CurrentEvents = "All events" | "Recorded events";

export type ChatMessage = {
  email: string;
  name: string;
  messages: string[];
};
