export type Participant = {
    email: string;
    name: string;
    isPresenter: boolean;
    isModerator: boolean;
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
};

export type LocationState = {
    pathToReturnTo: string;
};

export type EventForm = {
    title: string;
    description: string;
    start_date: string;
    presenters: string[];
};

export type WebinarInfo = {
    title: string;
    description: string;
    presenters: string[];
    start_date: Date;
    uuid: string;
};

export type OriginalWebinarInfo = {
    title: string;
    description: string;
    presenters: string[];
    start_date: string;
    uuid: string;
};

export type EventInfo = {
    link: string;
    title: string;
    description: string;
    start_date: string;
    presenters: string[];
};

export type AuthTokenKey = "authJwt";

export type RefreshTokenKey = "refreshJwt";

export type AuthResponseData = {
    authToken: AuthTokenKey;
    refreshToken: RefreshTokenKey;
};
