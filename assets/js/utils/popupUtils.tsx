import { UseToastOptions, ToastId } from "@chakra-ui/react";
import React from "react";
import type { Client } from "../pages/Event"
import "../../css/event.css";

let presenterToast;

export const presenterPopup = (
  toast: (options?: UseToastOptions | undefined) => ToastId,
  client: Client,
  eventChannel: any,
  moderatorTopic: string
) => {
  presenterToast = toast({
    duration: 15000,
    render: () => (
      <div className="PresenterPopup">
        <div className="PresenterPopupText">Do you want to be a presenter</div>
        <button
          className="PresenterPopupButton"
          onClick={() => sendAnswer(toast, eventChannel, "accept", client.email, moderatorTopic)}
        >
          {" "}
          YES{" "}
        </button>
        <button
          className="PresenterPopupButton"
          onClick={() => sendAnswer(toast, eventChannel, "reject", client.email, moderatorTopic)}
        >
          {" "}
          NO{" "}
        </button>
      </div>
    ),
  });
};

const sendAnswer = (toast: any, eventChannel: any, answer: string, email: string, moderatorTopic: string) => {
  eventChannel.push("presenter_answer", {
    email: email,
    moderatorTopic: moderatorTopic,
    answer: answer,
  });
  if (presenterToast) {
    console.log("siema")
    toast.close(presenterToast)
  }
};
