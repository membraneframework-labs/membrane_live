import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosWithInterceptor from "../services/index";
import { isUserAuthenticated } from "../services/jwtApi";
import {
  storageSetJwt,
  storageSetName,
  storageSetEmail,
  storageSetPicture,
} from "../utils/storageUtils";
import type { LocationState } from "../services/GuardedRoute";
import { useToast } from "@chakra-ui/react";
import { getErrorToast } from "../utils/toastUtils";
import "../../css/authpage.css";

const Auth = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const state = useLocation().state;
  const { pathToReturnTo } = state ? (state as LocationState) : { pathToReturnTo: "/" };

  const redirectToPreviousPage = () => navigate(pathToReturnTo, { replace: true });

  const fetchToken = async (googleResponse) => {
    try {
      const response = await axiosWithInterceptor.post("auth", googleResponse);
      if (!response.data.authToken || !response.data.refreshToken) throw "Token is empty";
      storageSetJwt(response.data);
    } catch (error) {
      console.log(error);
      getErrorToast(toast, "Couldn't get the token. Please try again in a moment.");
    }
  };

  const fetchTokenAndRedirect = async (response) => {
    await fetchToken(response);
    if (isUserAuthenticated()) {
      axiosWithInterceptor
        .get("/me")
        .then((response) => {
          if (!response.data.name || !response.data.email) throw "User information aren't correct";
          storageSetName(response.data.name);
          storageSetEmail(response.data.email);
          storageSetPicture(response.data.picture);
          redirectToPreviousPage();
        })
        .catch((error) => {
          console.error(error);
          getErrorToast(toast, "Couldn't get the user information. Please try again in a moment.");
        });
    }
  };

  useEffect(() => {
    google.accounts.id.initialize({
      client_id: "1003639280735-i6pl1d6m7f70m4ml66hgbno54qdj4a7o.apps.googleusercontent.com",
      ux_mode: "popup",
      callback: fetchTokenAndRedirect,
    });

    google.accounts.id.renderButton(document.getElementById("google-sign-in-button"), {
      theme: "outline",
      size: "large",
    });

    google.accounts.id.prompt();
  }, []);

  return (
    <div className="AuthPage">
      <div id="google-sign-in-button" />
    </div>
  );
};

export default Auth;
