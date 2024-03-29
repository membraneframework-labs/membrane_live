import { useEffect } from "react";
import { useToast } from "@chakra-ui/react";
import { pageTitlePrefix } from "../../utils/const";
import { fetchTokenAndRedirect } from "../../utils/googleAuthUtils";
import { CredentialResponse, GsiButtonConfiguration } from "google-one-tap";
import { googleClientId } from "../../utils/const";
import { Channel } from "phoenix";

// currently GSI library is available only via script
// this is a hacky way to get rid of the error
// see membrane_live/lib/membrane_live_web/templates/layout/root.html.heex
declare global {
  const google: typeof import("google-one-tap");
}

type GoogleButtonProps = {
  eventChannel?: Channel;
  options: GsiButtonConfiguration;
  buttonId: string;
  className?: string;
};

const GoogleButton = ({ eventChannel, buttonId, options, className }: GoogleButtonProps) => {
  const toast = useToast();

  useEffect(() => {
    document.title = `${pageTitlePrefix} | Login`;

    google.accounts.id.initialize({
      client_id: googleClientId,
      ux_mode: "popup",
      callback: (response: CredentialResponse) => fetchTokenAndRedirect(response, eventChannel, toast),
    });

    const buttonElement = document.getElementById(buttonId);
    if (buttonElement) google.accounts.id.renderButton(buttonElement, options);
  }, [buttonId, eventChannel, options, toast]);

  return <div id={buttonId} className={className} />;
};

export default GoogleButton;
