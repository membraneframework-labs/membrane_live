import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import axiosWithInterceptor from "../services/index";
import { isUserAuthenticated, setJwt} from "../services/index";



const Auth = () => {
  const navigate = useNavigate();
  const redirectToHomePage = () => navigate("/");

  const fetchToken = async (googleResponse) => {
    try {
      const response = await axiosWithInterceptor.post("auth", googleResponse);
      setJwt(response.data);
    } catch (error) {
      console.log(error);
      alert("Couldn't get the token. Please try again in a moment");
    }
  };

  const fetchTokenAndRedirect = async (response) => {
    await fetchToken(response);
    if (isUserAuthenticated()) {
      redirectToHomePage();
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
