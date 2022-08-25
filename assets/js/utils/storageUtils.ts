const NAME = "name";
const TOKEN = "jwt";
const EMAIL = "email";
const PICTURE = "picture";
const RELOAD = "reloaded";

type AuthTokenKey = "authJwt";
type RefreshTokenKey = "refreshJwt";

export const authTokenKey: AuthTokenKey = "authJwt";
export const refreshTokenKey: RefreshTokenKey = "refreshJwt";
export type AuthResponseData = {
  authToken: AuthTokenKey;
  refreshToken: RefreshTokenKey;
};

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

export const storageSetPicture = (picture: string): void => {
  localStorage.setItem(PICTURE, picture);
};

export const storageSetReloaded = (): void => {
  sessionStorage.setItem(RELOAD, "true");
};
export const storageGetReloaded = (): boolean => {
  return !!sessionStorage.getItem(RELOAD);
};
