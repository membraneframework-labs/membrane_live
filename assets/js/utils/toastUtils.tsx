import { QuestionCircle, CrossSmall, WarningCircle, InfoCircle } from "react-swm-icon-pack";
import { deleteEvent } from "./dashboardUtils";
import { Channel } from "phoenix";
import { ToastId } from "@chakra-ui/react";
import type { Client, Toast, PresenterProposition } from "../types/types";
import "../../css/toast.css";
import { sessionStorageSetIsPresenter, sessionStorageSetPresentingRequest } from "./storageUtils";

const closeToast = (toast: Toast, toastName: ToastId) => {
  toast.close(toastName);
};

export const presenterPopup = (
  toast: Toast,
  client: Client,
  eventChannel: Channel,
  message: PresenterProposition,
  setPresenterToken: React.Dispatch<React.SetStateAction<string | undefined>>
) => {
  let answer = "reject";

  const thisToast = toast({
    duration: 15_000,
    onCloseComplete: () => {
      sendAnswer(toast, thisToast, eventChannel, answer, client.email, message, setPresenterToken);
    },
    render: () => (
      <div className="Popup">
        <QuestionCircle className="PopupIcon" />
        <div className="PopupText">Do you want to be a presenter?</div>
        <button
          className="PresenterPopupButton"
          onClick={() => {
            answer = "accept";
            sessionStorageSetIsPresenter();
            sessionStorageSetPresentingRequest(false);
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
  toast: Toast,
  toastName: ToastId,
  eventChannel: Channel,
  answer: string,
  email: string,
  message: PresenterProposition,
  setPresenterToken: React.Dispatch<React.SetStateAction<string | undefined>>
) => {
  eventChannel
    .push("presenter_answer", {
      email: email,
      moderatorTopic: message.moderatorTopic,
      answer: answer,
    })
    .receive("ok", (token) => setPresenterToken(token));
  if (toast) toast.close(toastName);
};

export const lastPersonPopup = (
  toast: Toast,
  eventChannel: Channel,
  timeout: number,
  redirectToHomePage: () => void
) => {
  let answer = "leave";

  const thisToast = toast({
    duration: timeout,
    onCloseComplete: () => {
      sendLastViewerAnswer(toast, thisToast, eventChannel, answer);
    },
    render: () => (
      <div className="Popup">
        <QuestionCircle className="PopupIcon" />
        <div className="PopupText">Do you want to stay at this Webinar?</div>
        <button
          className="PresenterPopupButton"
          onClick={() => {
            answer = "stay";
            closeToast(toast, thisToast);
          }}
        >
          STAY
        </button>
        <button
          className="PresenterPopupButton"
          onClick={() => {
            answer = "leave";
            redirectToHomePage();
            closeToast(toast, thisToast);
          }}
        >
          LEAVE
        </button>
      </div>
    ),
  });
};

const sendLastViewerAnswer = (toast: Toast, toastName: ToastId, eventChannel: Channel, answer: string) => {
  eventChannel.push("last_viewer_answer", {
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
