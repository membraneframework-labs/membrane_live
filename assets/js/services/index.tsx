import * as JwtApi from "./jwtApi";

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
    if (status === 401) {
      const refreshToken = JwtApi.getRefreshToken();
      try {
        const response = await axios.post("/auth/refresh", { refreshToken });
        JwtApi.setJwt(response.data);
        const updatedConfig = JwtApi.addJwtToHeader(error.response.config);
        return axiosWithInterceptor(updatedConfig);
      } catch (err) {
        JwtApi.destroyTokens();
        alert("Your refresh token has expired. Please log in again.");
        redirect("/auth");
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosWithInterceptor;
