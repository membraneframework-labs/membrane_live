import { Presence } from "phoenix";
import { Participant } from "../components/ParticipantsList";
import type { NamePopupState, PresenterPopupState } from "../pages/Event";

export const createEventChannel = (
  eventChannel: any,
  namePopupState: NamePopupState,
  setPopupState: React.Dispatch<React.SetStateAction<NamePopupState>>,
  setEventChannel: React.Dispatch<React.SetStateAction<any>>
) => {
  eventChannel
    .join()
    .receive("ok", () => {
      setPopupState({ isOpen: false, channelConnErr: "" });
      setEventChannel(eventChannel);
    })
    .receive("error", (resp: { reason: string }) => {
      eventChannel.leave();
      if (resp.reason === "Viewer with this name already exists.")
        setPopupState({ ...namePopupState, channelConnErr: resp.reason });
      else alert(resp.reason);
    });
};

export const syncEventChannel = (
  eventChannel: any,
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>
) => {
  if (eventChannel) {
    const presence = new Presence(eventChannel);

    const updateStates = () => {
      const parts: Participant[] = [];
      presence.list((name: string, metas: any) => {
        const participant = metas.metas[0];
        parts.push({
          name: name,
          isPresenter: participant.is_presenter,
          isModerator: participant.is_moderator,
        });
      });
      parts.sort(compareParticipants);
      setParticipants(parts);
    };

    presence.onSync(() => {
      updateStates();
    });

    eventChannel.push("sync_presence", {});
  }
};

export const createPrivateChannel = (
  privateChannel: any,
  eventChannel: any,
  name: string,
  setPresenterPopupState: React.Dispatch<React.SetStateAction<PresenterPopupState>>,
  setPrivateChannel: React.Dispatch<React.SetStateAction<any>>
) => {
  privateChannel
    .join()
    .receive("ok", () => {
      privateChannel.on("presenter_prop", (message: { moderator: string }) => {
        setPresenterPopupState({ isOpen: true, moderator: message.moderator });
      });
      privateChannel.on("presenter_answer", (message: { name: string; answer: string }) => {
        alert(`User ${message.name} ${message.answer}ed your request.`);
      });
      privateChannel.on("presenter_remove", () => {
        alert("You are no longer presenter.");
        eventChannel.push("presenter_remove", { presenter: name });
      });
      setPrivateChannel(privateChannel);
    })
    .receive("error", (resp: { reason: string }) => {
      privateChannel.leave();
      alert(resp.reason);
    });
};

export const syncPresenters = (
  eventChannel: any,
  setPresenters: React.Dispatch<React.SetStateAction<string[]>>
) => {
  if (eventChannel) {
    const presence = new Presence(eventChannel);

    const updatePresenters = () => {
      const presenters: string[] = [];
      presence.list((name: string, metas: any) => {
        for (const item of metas.metas) {
          if (item.is_presenter) presenters.push(name);
        }
      });
      setPresenters(presenters);
    };

    presence.onSync(() => {
      updatePresenters();
    });

    eventChannel.push("sync_presence", {});
  }
};

export const getChannelId = (): string => window.location.pathname.split("/")[2];

const compareParticipants = (x: Participant, y: Participant): number => {
  if (x.isModerator != y.isModerator) return x.isModerator ? -1 : 1;
  if (x.isPresenter != y.isPresenter) return x.isPresenter ? -1 : 1;
  return 0;
};
