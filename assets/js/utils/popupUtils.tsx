import React from "react";
import type { Client } from "../pages/Event";
import { QuestionCircle, CrossSmall, WarningCircle, InfoCircle } from "react-swm-icon-pack";
import { getFontColor } from "./styleUtils";
import "../../css/popups.css";

const closeToast = (toast: any, toastName: string) => {
  toast.close(toastName);
};

export const presenterPopup = (
  toast: any,
  client: Client,
  eventChannel: any,
  moderatorTopic: string
) => {
  const fontColor = getFontColor("--bg-light-color-1");
  let answer = "reject";

  const thisToast = toast({
    duration: 15_000,
    onCloseComplete: () => {
      sendAnswer(toast, thisToast, eventChannel, answer, client.email, moderatorTopic);
    },
    render: () => (
      <div className="Popup">
        <QuestionCircle className="PopupIcon" color={fontColor} />
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

const getToast = (toast: any, icon: any, text: string, fontColor: string) => {
  const thisToast = toast({
    duration: 10_000,
    position: "top",
    render: () => (
      <div className="Popup NormalPopup">
        {icon}
        <div className="PopupText">{text}</div>
        <div className="CrossBox">
          <button onClick={() => closeToast(toast, thisToast)}>
            <CrossSmall className="CrossIcon" color={fontColor} />
          </button>
        </div>
      </div>
    ),
  });
};

export const getErrorToast = (toast: any, text: string) => {
  const fontColor = getFontColor("--bg-light-color-1");
  getToast(toast, <WarningCircle className="PopupIcon" color={fontColor} />, text, fontColor);
};

export const getInfoToast = (toast: any, text: string) => {
  const fontColor = getFontColor("--bg-light-color-1");
  getToast(toast, <InfoCircle className="PopupIcon" color={fontColor} />, text, fontColor);
};
