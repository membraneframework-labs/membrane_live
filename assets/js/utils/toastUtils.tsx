import React from "react";
import type { Client, Mode, Toast } from "../components/types/types";
import { QuestionCircle, CrossSmall, WarningCircle, InfoCircle } from "react-swm-icon-pack";
import { deleteEvent } from "./dashboardUtils";
import "../../css/toast.css";
import { Channel } from "phoenix";
import { ToastId } from "@chakra-ui/react";

const closeToast = (toast: Toast, toastName: ToastId) => {
  toast.close(toastName);
};

export const presenterPopup = (
  toast: Toast,
  client: Client,
  eventChannel: Channel,
  moderatorTopic: string,
  setMode: React.Dispatch<React.SetStateAction<Mode>>
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
            setMode("presenters");
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
  toast: Toast,
  toastName: ToastId,
  eventChannel: Channel,
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

export const deleteEventPopup = (toast: Toast, uuid: string) => {
  let answer = "reject";

  const thisToast = toast({
    duration: 15_000,
    onCloseComplete: () => {
      if (answer === "accept") deleteEvent(uuid, toast, false);
    },
    render: () => (
      <div className="Popup">
        <QuestionCircle className="PopupIcon" />
        <div className="PopupText">Do you want to remove this webinar?</div>
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

const getToast = (toast: Toast, icon: JSX.Element, text: string, duration: number) => {
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

export const getErrorToast = (toast: Toast, text: string, duration = 10_000) => {
  getToast(toast, <WarningCircle className="PopupIcon" />, text, duration);
};

export const getInfoToast = (toast: Toast, text: string, duration = 10_000) => {
  getToast(toast, <InfoCircle className="PopupIcon" />, text, duration);
};
