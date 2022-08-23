const NAME = "name";
const TOKEN = "jwt";
const EMAIL = "email";
const PICTURE = "picture";

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

export const storageSetName = (name: string): void => {
  localStorage.setItem(NAME, name);
};

export const storageSetEmail = (email: string): void => {
  localStorage.setItem(EMAIL, email);
};

export const storageSetPicture = (picture: string): void => {
  localStorage.setItem(PICTURE, picture);
};
