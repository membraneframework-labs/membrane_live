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
  start_date: string;
  uuid: string;
};

export type EventInfo = {
  title: string;
  description: string;
  presenters: string[];
  startDate: Date;
  uuid: string;
};

export type ModalForm = "create" | "update";

export type AuthTokenKey = "authJwt";

export type RefreshTokenKey = "refreshJwt";

export type AuthResponseData = {
  authToken: AuthTokenKey;
  refreshToken: RefreshTokenKey;
};
