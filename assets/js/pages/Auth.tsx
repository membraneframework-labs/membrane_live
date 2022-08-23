import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosWithInterceptor from "../services/index";
import { isUserAuthenticated } from "../services/jwtApi";
import {
  storageSetJwt,
  storageSetName,
  storageSetEmail,
  storageSetPicture,
} from "../utils/storageUtils";

const Auth = () => {
  const navigate = useNavigate();
  const redirectToHomePage = () => navigate("/");

  const fetchToken = async (googleResponse) => {
    try {
      const response = await axiosWithInterceptor.post("auth", googleResponse);
      if (!response.data.authToken || !response.data.refreshToken) throw "Token is empty";
      storageSetJwt(response.data);
    } catch (error) {
      console.log(error);
      alert("Couldn't get the token. Please try again in a moment");
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
          redirectToHomePage();
        })
        .catch((error) => {
          console.error(error);
          alert("Couldn't get the user information. Please try again in a moment");
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

  return <div id="google-sign-in-button" />;
};

export default Auth;
