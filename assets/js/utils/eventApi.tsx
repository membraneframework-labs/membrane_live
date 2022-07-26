import { Presence } from "phoenix";
import type { EventInfo, Participant, PresenterPopupState, PopupState } from "../pages/Event";

export const createPrivateChannel = (
  privateChannel: any,
  eventChannel: any,
  username: string,
  setPresenterPopupState: React.Dispatch<React.SetStateAction<PresenterPopupState>>
) => {
  privateChannel
    .join()
    .receive("ok", () => {
      privateChannel.on("presenter_prop", (message) => {
        setPresenterPopupState({ isOpen: true, moderator: message.moderator });
      });
      privateChannel.on("presenter_answer", (message) => {
        alert("User " + message.name + " " + message.answer + " your request.");
      });
      privateChannel.on("presenter_remove", () => {
        alert("You are no longer presenter.");
        eventChannel.push("presenter_remove", { presenter: username });
      });
    })
    .receive("error", (resp) => {
      alert(resp.reason);
    });
};

export const createEventChannel = (
  eventChannel: any,
  popupState: PopupState,
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>,
  setPopupState: React.Dispatch<React.SetStateAction<PopupState>>
) => {
  eventChannel
    .join()
    .receive("ok", () => {
      const presence = new Presence(eventChannel);
      presence.onSync(() => {
        const parts: any[] = [];
        presence.list((name: string, metas: any) => {
          let isPresenter = false;
          for (const item of metas.metas) {
            if (item.is_presenter) isPresenter = true;
          }
          parts.push({ name: name, isPresenter: isPresenter });
        });
        setParticipants(parts);
      });
      setPopupState({ isOpen: false, channelConnErr: "" });
    })
    .receive("error", (resp: { reason: string }) => {
      if (resp.reason === "Viewer with this name already exists.")
        setPopupState({ ...popupState, channelConnErr: resp.reason });
      else alert(resp.reason);
    });
};

export const getEventInfo = (
  eventInfo: EventInfo,
  setEventInfo: React.Dispatch<React.SetStateAction<EventInfo>>
) => {
  const csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute("content");

  fetch("http://localhost:4000/webinars/" + eventInfo.link, {
    method: "get",
    headers: { "X-CSRF-TOKEN": csrfToken ? csrfToken : "" },
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      return Promise.reject(response.status);
    })
    .then((data) => {
      setEventInfo({ ...eventInfo, ...data.webinar });
    })
    .catch(() => {
      alert("Couldn't get event information. Please reload this page.");
    });
};
