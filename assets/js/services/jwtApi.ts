import { AxiosRequestConfig } from "axios";
import { authTokenKey, refreshTokenKey } from "../utils/storageUtils";
import { storageGetRefreshToken, storageGetAuthToken } from "../utils/storageUtils";

export const addJwtToHeader = (config: AxiosRequestConfig<unknown>) => {
  if (config.headers) {
    config.headers.Authorization = getAuthBearer();
    const refreshToken = storageGetRefreshToken();
    if (refreshToken) config.headers.RefreshToken = refreshToken;
    else console.error("Jwt refresh token is not defined");
  }
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
