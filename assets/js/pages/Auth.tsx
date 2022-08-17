import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import axios from "../services/index";
import { isUserAuthenticated } from "../services/index";

const Auth = () => {
  const navigate = useNavigate();
  const redirectToHomePage = () => navigate("/");

  const fetchToken = async (googleResponse) => {
    try {
      const response = await axios.post("auth", googleResponse);
      localStorage.setItem("jwt", response.data.token);
    } catch (error) {
      console.log(error);
      alert("Couldn't get the token. Please try again in a moment");
    }
  };

  const fetchTokenAndRedirect = async (response) => {
    await fetchToken(response);
    console.log(isUserAuthenticated());
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
