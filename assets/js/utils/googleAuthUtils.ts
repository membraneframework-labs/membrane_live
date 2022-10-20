import axios from "axios";
import axiosWithInterceptor from "../services/index";
import { isUserAuthenticated } from "../services/jwtApi";
import {
  storageSetJwt,
  storageSetName,
  storageSetEmail,
  storageSetPicture,
} from "../utils/storageUtils";
import { getErrorToast } from "../utils/toastUtils";

const fetchToken = async (googleResponse: any, toast: any) => {
  try {
    const response = await axios.post(window.location.origin + "/auth", googleResponse);
    if (!response.data.authToken || !response.data.refreshToken) throw "Token is empty";
    storageSetJwt(response.data);
  } catch (error) {
    console.log(error);
    getErrorToast(toast, "Couldn't get the token. Please try again in a moment.");
  }
};

export const fetchTokenAndRedirect = async (response: any, eventChannel: any, toast: any) => {
  await fetchToken(response, toast);
  if (isUserAuthenticated()) {
    axiosWithInterceptor
      .get("/me")
      .then((response) => {
        if (!response.data.name || !response.data.email) throw "User information aren't correct";
        storageSetName(response.data.name);
        storageSetEmail(response.data.email);
        storageSetPicture(response.data.picture);
        if (eventChannel) eventChannel.leave();
        window.location.reload();
      })
      .catch((error) => {
        console.error(error);
        getErrorToast(toast, "Couldn't get the user information. Please try again in a moment.");
      });
  }
};
