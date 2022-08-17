const axios = require("axios").default;

axios.interceptors.request.use(
  (config) => {
    const bearer = `Bearer ${localStorage.getItem("authJwt")}`;
    config.headers.Authorization = bearer;
    config.headers.RefreshToken = localStorage.getItem("refreshJwt");
    return config;
  },
  (error) => {
    Promise.reject(error);
  }
);

axios.interceptors.response.use(undefined, (error) => {
  if ([401, 403].includes(error.response.status)) {
    localStorage.removeItem("authJwt");
  }
  return Promise.reject(error);
});

export const isUserAuthenticated = (): boolean => {
  return localStorage.getItem("authJwt") != null;
};

export default axios;
