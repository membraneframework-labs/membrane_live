type AuthTokenKey = "authJwt";
type RefreshTokenKey = "refreshJwt";

const authTokenKey: AuthTokenKey = "authJwt";
const refreshTokenKey: RefreshTokenKey = "refreshJwt";

export type AuthResponseData = {
  authToken: AuthTokenKey;
  refreshToken: RefreshTokenKey;
};

export const setJwt = ({ authToken, refreshToken }: AuthResponseData) => {
  authToken && localStorage.setItem(authTokenKey, authToken);
  refreshToken && localStorage.setItem(refreshTokenKey, refreshToken);
};

export const addJwtToHeader = (config) => {
  config.headers.Authorization = getAuthBearer();
  config.headers.RefreshToken = getRefreshToken();
  return config;
};

export const isUserAuthenticated = (): boolean => {
  return localStorage.getItem(authTokenKey) != null;
};

export const destroyTokens = (): void => {
  localStorage.removeItem(authTokenKey);
  localStorage.removeItem(refreshTokenKey);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem(authTokenKey);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(refreshTokenKey);
};

export const getAuthBearer = (): string => {
  return `Bearer ${getAuthToken()}`;
};
