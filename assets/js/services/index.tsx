const axios = require("axios").default;

axios.interceptors.request.use(
  (config) => {
    const bearer = `Bearer ${localStorage.getItem("jwt")}`;
    config.headers.Authorization = bearer;
    return config;
  },
  (error) => {
    Promise.reject(error);
  }
);

axios.interceptors.response.use(undefined, (error) => {
  if ([401, 403].includes(error.response.status)) {
    localStorage.removeItem("jwt");
  }
  return Promise.reject(error);
});

export const isUserAuthenticated =  (): boolean => {
  return localStorage.getItem("jwt") != null;
};

export default axios;
