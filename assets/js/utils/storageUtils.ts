import type { AuthTokenKey, RefreshTokenKey, AuthResponseData } from "../types";

const NAME = "name";
const EMAIL = "email";
const REQUEST_PRESENTING = "isRequestPresenting";
const PICTURE = "picture";
const RELOAD = "reloaded";

export const authTokenKey: AuthTokenKey = "authJwt";
export const refreshTokenKey: RefreshTokenKey = "refreshJwt";

export const storageGetAuthToken = (): string | null => {
  return localStorage.getItem(authTokenKey);
};

export const storageGetRefreshToken = (): string | null => {
  return localStorage.getItem(refreshTokenKey);
};

export const storageSetJwt = ({ authToken, refreshToken }: AuthResponseData) => {
  authToken && localStorage.setItem(authTokenKey, authToken);
  refreshToken && localStorage.setItem(refreshTokenKey, refreshToken);
};

export const storageGetName = (): string => {
  const name: string | null = localStorage.getItem(NAME);
  return name ? name : "";
};

export const storageGetEmail = (): string => {
  const email: string | null = localStorage.getItem(EMAIL);
  return email ? email : "";
};

export const storageGetPresentingRequest = (): boolean => {
  return localStorage.getItem(REQUEST_PRESENTING) === "true";
};
export const storageGetPicture = (): string => {
  const picture: string | null = localStorage.getItem(PICTURE);
  return picture ? picture : "";
};

export const storageSetName = (name: string): void => {
  localStorage.setItem(NAME, name);
};

export const storageSetEmail = (email: string): void => {
  localStorage.setItem(EMAIL, email);
};

export const storageSetPresentingRequest = (requestedPresenting: boolean): void => {
  localStorage.setItem(REQUEST_PRESENTING, requestedPresenting ? "true" : "false");
};

export const storageSetPicture = (picture: string): void => {
  localStorage.setItem(PICTURE, picture);
};

export const storageSetReloaded = (): void => {
  sessionStorage.setItem(RELOAD, "true");
};
export const storageGetReloaded = (): boolean => {
  return !!sessionStorage.getItem(RELOAD);
};

export const sessionStorageSetName = (name: string): void => {
  sessionStorage.setItem(NAME, name);
};

export const sessionStorageGetName = (): string => {
  const name: string | null = sessionStorage.getItem(NAME);
  return name ? name : "";
};

export const getIsAuthenticated = (): boolean => {
  return storageGetAuthToken() != null;
};

export const clearSessionStorageName = (): void => {
  sessionStorage.removeItem(NAME);
};

export const logOut = () => {
  ["name", "picture", "email", "authJwt", "refreshJwt"].forEach((key) => {
    localStorage.removeItem(key);
  });
  window.location.reload();
};
