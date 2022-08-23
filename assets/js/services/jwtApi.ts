import { authTokenKey, refreshTokenKey } from "../utils/storageUtils";
import { storageGetRefreshToken, storageGetAuthToken } from "../utils/storageUtils";

export const addJwtToHeader = (config) => {
  config.headers.Authorization = getAuthBearer();
  config.headers.RefreshToken = storageGetRefreshToken();
  return config;
};

export const isUserAuthenticated = (): boolean => {
  return localStorage.getItem(authTokenKey) != null;
};

export const destroyTokens = (): void => {
  localStorage.removeItem(authTokenKey);
  localStorage.removeItem(refreshTokenKey);
};

export const getAuthBearer = (): string => {
  return `Bearer ${storageGetAuthToken()}`;
};
