import { Presence } from "phoenix";
import { Participant } from "../components/ParticipantsList";
import type { Client, PresenterPopupState } from "../pages/Event";
import type { Presenter } from "../components/PresenterStreams";

export const createEventChannel = (
  client: Client,
  eventChannel: any,
  setEventChannel: React.Dispatch<React.SetStateAction<any>>,
  setClient: React.Dispatch<React.SetStateAction<Client>>
) => {
  eventChannel
    .join()
    .receive("ok", (resp: { is_moderator: boolean }) => {
      setEventChannel(eventChannel);
      setClient({...client, isModerator: resp.is_moderator});
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
      presence.list((email: string, metas: any) => {
        const participant = metas.metas[0];
        parts.push({
          email: email,
          name: participant.name,
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
  email: string,
  setPresenterPopupState: React.Dispatch<React.SetStateAction<PresenterPopupState>>,
  setPrivateChannel: React.Dispatch<React.SetStateAction<any>>
) => {
  privateChannel
    .join()
    .receive("ok", () => {
      privateChannel.on("presenter_prop", (message: { moderator_topic: string }) => {
        setPresenterPopupState({ isOpen: true, moderatorTopic: message.moderator_topic });
      });
      privateChannel.on("presenter_answer", (message: { name: string; answer: string }) => {
        alert(`User ${message.name} ${message.answer}ed your request.`);
      });
      privateChannel.on("presenter_remove", () => {
        alert("You are no longer presenter.");
        eventChannel.push("presenter_remove", { email: email });
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
  setPresenters: React.Dispatch<React.SetStateAction<Presenter[]>>
) => {
  if (eventChannel) {
    const presence = new Presence(eventChannel);

    const updatePresenters = () => {
      const presenters: Presenter[] = [];

      presence.list((email: string, metas: any) => {
        // sometimes presence create two object in metas, for example if you open two windows with the same user.
        metas.metas[0].is_presenter && presenters.push({name: metas.metas[0].name, email: email});
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
