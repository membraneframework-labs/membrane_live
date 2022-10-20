import React, { useEffect } from "react";
import { useToast } from "@chakra-ui/react";
import { pageTitlePrefix } from "../../utils/const";
import { fetchTokenAndRedirect } from "../../utils/googleAuthUtils";
import "../../../css/authpage.css";

type GoogleButtonProps = {
  eventChannel?: any;
  options: any;
};

const GoogleButton = ({ eventChannel, options }: GoogleButtonProps) => {
  const toast = useToast();
  const buttonId = Math.random().toString();

  useEffect(() => {
    document.title = `${pageTitlePrefix} | Login`;

    google.accounts.id.initialize({
      client_id: "1003639280735-i6pl1d6m7f70m4ml66hgbno54qdj4a7o.apps.googleusercontent.com",
      ux_mode: "popup",
      callback: (response) => fetchTokenAndRedirect(response, eventChannel, toast),
    });

    google.accounts.id.renderButton(document.getElementById(buttonId), options);
  }, []);

  return <div id={buttonId} />;
};

export default GoogleButton;
