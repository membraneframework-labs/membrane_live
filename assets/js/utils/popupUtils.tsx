import { UseToastOptions, ToastId } from "@chakra-ui/react";
import React from "react";
import "../../css/event.css";

export const presenterPopup = (
  toast: (options?: UseToastOptions | undefined) => ToastId,
  client: Client,
  eventChannel: any,
  moderatorTopic: string
) => {
  toast({
    duration: 15000,
    render: () => (
      <div className="PresenterPopup">
        <div className="PresenterPopupText">Do you want to be a presenter</div>
        <button
          className="PresenterPopupButton"
          onClick={() => sendAnswer(eventChannel, "accept", client.email, moderatorTopic)}
        >
          {" "}
          YES{" "}
        </button>
        <button
          className="PresenterPopupButton"
          onClick={() => sendAnswer(eventChannel, "reject", client.email, moderatorTopic)}
        >
          {" "}
          NO{" "}
        </button>
      </div>
    ),
  });
};

export const infoPopup = (
  toast: (options?: UseToastOptions | undefined) => ToastId,
  title: string,
  position: string,
) => {
  toast({
    duration: 3000,
    render: () => (
      <div className="PresenterPopup">
        <div className="PresenterPopupText">{title}</div>
      </div>
    ),
  });
};

const sendAnswer = (eventChannel: any, answer: string, email: string, moderatorTopic: string) => {
  eventChannel.push("presenter_answer", {
    email: email,
    moderatorTopic: moderatorTopic,
    answer: answer,
  });
};
