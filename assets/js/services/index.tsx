import * as JwtApi from "./jwtApi";
import { logOut, storageGetRefreshToken, storageSetJwt } from "../utils/storageUtils";
import axios from "axios";

export const axiosWithInterceptor = axios.create();
export const axiosWithoutInterceptor = axios.create();

axiosWithInterceptor.interceptors.request.use(
  (config) => {
    return JwtApi.addJwtToHeader(config);
  },
  (error) => {
    Promise.reject(error);
  }
);

axiosWithInterceptor.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response ? error.response.status : null;
    if (status != 401) {
      return Promise.reject(error);
    }

    const refreshToken = storageGetRefreshToken();
    try {
      const response = await axios.post("/auth/refresh", { refreshToken });
      storageSetJwt(response.data);
      const updatedConfig = JwtApi.addJwtToHeader(error.response.config);
      return axiosWithInterceptor(updatedConfig);
    } catch (err) {
      logOut();
    }
  }
);
