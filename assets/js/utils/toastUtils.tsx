import React from "react";
import type { Client } from "../types";
import { QuestionCircle, CrossSmall, WarningCircle, InfoCircle } from "react-swm-icon-pack";
import "../../css/toast.css";

const closeToast = (toast: any, toastName: string) => {
  toast.close(toastName);
};

export const presenterPopup = (
  toast: any,
  client: Client,
  eventChannel: any,
  moderatorTopic: string
) => {
  let answer = "reject";

  const thisToast = toast({
    duration: 15_000,
    onCloseComplete: () => {
      sendAnswer(toast, thisToast, eventChannel, answer, client.email, moderatorTopic);
    },
    render: () => (
      <div className="Popup">
        <QuestionCircle className="PopupIcon" />
        <div className="PopupText">Do you want to be a presenter?</div>
        <button
          className="PresenterPopupButton"
          onClick={() => {
            answer = "accept";
            closeToast(toast, thisToast);
          }}
        >
          YES
        </button>
        <button
          className="PresenterPopupButton"
          onClick={() => {
            answer = "reject";
            closeToast(toast, thisToast);
          }}
        >
          NO
        </button>
      </div>
    ),
  });
};

const sendAnswer = (
  toast: any,
  toastName: string,
  eventChannel: any,
  answer: string,
  email: string,
  moderatorTopic: string
) => {
  eventChannel.push("presenter_answer", {
    email: email,
    moderatorTopic: moderatorTopic,
    answer: answer,
  });
  if (toast) toast.close(toastName);
};

const getToast = (toast: any, icon: any, text: string, duration: number) => {
  const thisToast = toast({
    duration: duration,
    position: "top",
    render: () => (
      <div className="Popup NormalPopup">
        {icon}
        <div className="PopupText">{text}</div>
        <div className="CrossBox">
          <button onClick={() => closeToast(toast, thisToast)}>
            <CrossSmall className="CrossIcon" />
          </button>
        </div>
      </div>
    ),
  });
};

export const getErrorToast = (toast: any, text: string, duration: number = 10_000) => {
  getToast(toast, <WarningCircle className="PopupIcon" />, text, duration);
};

export const getInfoToast = (toast: any, text: string, duration: number = 10_000) => {
  getToast(toast, <InfoCircle className="PopupIcon" />, text, duration);
};
