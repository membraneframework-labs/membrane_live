import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const navigate = useNavigate();
  const redirectToHomePage = () => navigate("/");

  const fetchToken = (google_response) => {
    const request = {
      // MAG: it seems like a common type - can I import it from somewhere?
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(google_response),
    };

    fetch("http://localhost:4000/auth/login", request) //MAG: how should I store this endpoint uri?
      .then((resp) => resp.json()) // MAG is `then` readable enough or should I use `await`?
      .then((data) => localStorage.setItem("jwt", data["token"]));
  };

  const fetchTokenAndRedirect = (response) => {
    fetchToken(response);
    redirectToHomePage();
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
