import axios from "axios";
import { Channel } from "phoenix";
import { axiosWithInterceptor } from "../services";
import { isUserAuthenticated } from "../services/jwtApi";
import { storageSetJwt, storageSetName, storageSetEmail, sessionStorageSetPicture } from "../utils/storageUtils";
import { CredentialResponse } from "google-one-tap";
import { getErrorToast } from "../utils/toastUtils";
import type { Toast } from "../types/types";

const fetchToken = async (googleResponse: CredentialResponse, toast: Toast) => {
  try {
    const response = await axios.post(window.location.origin + "/auth", googleResponse);
    if (!response.data.authToken || !response.data.refreshToken) throw "Token is empty";
    storageSetJwt(response.data);
  } catch (error) {
    console.log(error);
    getErrorToast(toast, "Couldn't get the token. Please try again in a moment.");
  }
};

export const fetchTokenAndRedirect = async (
  googleResponse: CredentialResponse,
  eventChannel: Channel | undefined,
  toast: Toast
) => {
  await fetchToken(googleResponse, toast);
  if (isUserAuthenticated()) {
    axiosWithInterceptor
      .get("/me")
      .then((response) => {
        if (!response.data.name || !response.data.email) throw "User information aren't correct";
        storageSetName(response.data.name);
        storageSetEmail(response.data.email);
        sessionStorageSetPicture(response.data.picture);
        if (eventChannel) eventChannel.leave();
        window.location.reload();
      })
      .catch((error) => {
        console.error(error);
        if (error.response.status === 403) {
          getErrorToast(toast, "Invalid access token. Please log in again.");
        } else {
          getErrorToast(toast, "Couldn't get the user information. Please try again in a moment.");
        }
      });
  }
};
