import { Presence } from "phoenix";
import { Participant } from "../components/ParticipantsList";
import type { PresenterPopupState } from "../pages/Event";

export const createEventChannel = (
  eventChannel: any,
  setEventChannel: React.Dispatch<React.SetStateAction<any>>,
  setIsModerator: React.Dispatch<React.SetStateAction<boolean>>
) => {
  eventChannel
    .join()
    .receive("ok", (resp: { is_moderator: boolean }) => {
      setEventChannel(eventChannel);
      setIsModerator(resp.is_moderator);
    })
    .receive("error", (resp: { reason: string }) => {
      eventChannel.leave();
      alert(resp.reason);
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
        // sometimes presence create two object in metas, for example if you open two windows with the same user.
        metas.metas.pop().is_presenter && presenters.push(name);
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
  return participantToNumber(x) - participantToNumber(y);
};

const participantToNumber = (participant: Participant): number => {
  return participant.isModerator ? 1 : participant.isPresenter ? 2 : 3;
};
