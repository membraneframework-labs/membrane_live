const axios = require("axios").default;

export type AuthResponseData = {
  authToken: string;
  refreshToken: string;
};

export const setJwt = ({ authToken, refreshToken }: AuthResponseData) => {
  localStorage.setItem("authJwt", authToken);
  localStorage.setItem("refreshJwt", refreshToken);
};

export const addJwtToHeader = (config) => {
  const bearer = `Bearer ${localStorage.getItem("authJwt")}`;
  config.headers.Authorization = bearer;
  config.headers.RefreshToken = localStorage.getItem("refreshJwt");
  return config;
};

export const isUserAuthenticated = (): boolean => {
  return localStorage.getItem("authJwt") != null;
};

export const destroyTokens = (): void => {
  localStorage.removeItem("authJwt");
  localStorage.removeItem("refreshJwt");
};

const redirect = (suffix: string) => {
  window.location.href = `${window.location.origin}${suffix}`;
};

const axiosWithInterceptor = axios.create();

axiosWithInterceptor.interceptors.request.use(
  (config) => {
    return addJwtToHeader(config);
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
      const refreshToken = localStorage.getItem("refreshJwt");
      try {
        const response = await axios.post("/auth/refresh", { refreshToken });
        setJwt(response.data);
        const updatedConfig = addJwtToHeader(error.response.config);
        return axiosWithInterceptor(updatedConfig);
      } catch (err) {
        destroyTokens();
        alert("Your refresh token has expired. Please log in again.");
        redirect("/auth");
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosWithInterceptor;
