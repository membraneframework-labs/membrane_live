import { Presence } from "phoenix";
import { Participant } from "../components/ParticipantsList";
import type { NamePopupState, PresenterPopupState } from "../pages/Event";

export const createEventChannel = (
  eventChannel: any,
  namePopupState: NamePopupState,
  setPopupState: React.Dispatch<React.SetStateAction<NamePopupState>>
) => {
  eventChannel
    .join()
    .receive("ok", () => {
      setPopupState({ isOpen: false, channelConnErr: "" });
    })
    .receive("error", (resp: { reason: string }) => {
      if (resp.reason === "Viewer with this name already exists.")
        setPopupState({ ...namePopupState, channelConnErr: resp.reason });
      else alert(resp.reason);
    });
};

export const syncEventChannel = (
  eventChannel: any,
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>,
  setPresenters: React.Dispatch<React.SetStateAction<string[]>>
) => {
  if (eventChannel != undefined) {
    const presence = new Presence(eventChannel);

    const updateStates = () => {
      const parts: any[] = [];
      presence.list((name: string, metas: any) => {
        let isPresenter = false;
        for (const item of metas.metas) {
          if (item.is_presenter) isPresenter = true;
        }
        parts.push({ name: name, isPresenter: isPresenter });
      });
      setParticipants(parts);
      setPresenters(parts.filter((part) => part.isPresenter).map((part) => part.name));
    };

    updateStates();
    presence.onSync(() => {
      updateStates();
    });
  }
};

export const createPrivateChannel = (
  privateChannel: any,
  eventChannel: any,
  username: string,
  setPresenterPopupState: React.Dispatch<React.SetStateAction<PresenterPopupState>>
) => {
  privateChannel
    .join()
    .receive("ok", () => {
      privateChannel.on("presenter_prop", (message: { moderator: string }) => {
        setPresenterPopupState({ isOpen: true, moderator: message.moderator });
      });
      privateChannel.on("presenter_answer", (message: { name: string; answer: string }) => {
        alert("User " + message.name + " " + message.answer + "ed your request.");
      });
      privateChannel.on("presenter_remove", () => {
        alert("You are no longer presenter.");
        eventChannel.push("presenter_remove", { presenter: username });
      });
    })
    .receive("error", (resp: { reason: string }) => {
      alert(resp.reason);
    });
};
