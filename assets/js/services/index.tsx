import * as JwtApi from "./jwtApi";
import { storageGetRefreshToken, storageSetJwt } from "../utils/storageUtils";

const axios = require("axios").default;

const redirect = (suffix: string) => {
  window.location.href = `${window.location.origin}${suffix}`;
};

const axiosWithInterceptor = axios.create();

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
      JwtApi.destroyTokens();
      alert("Your refresh token has expired. Please log in again.");
      redirect("/auth");
      return Promise.reject(err);
    }
  }
);

export default axiosWithInterceptor;
