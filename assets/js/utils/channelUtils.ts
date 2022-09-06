import { Presence } from "phoenix";
import { Participant } from "../components/ParticipantsList";
import type { Client } from "../pages/Event";
import type { Presenter } from "../components/PresenterStreams";
import { getErrorToast, getInfoToast } from "./popupUtils";

export const createEventChannel = (
  toast: any,
  client: Client,
  eventChannel: any,
  setEventChannel: React.Dispatch<React.SetStateAction<any>>,
  setClient: React.Dispatch<React.SetStateAction<Client>>
) => {
  eventChannel
    .join()
    .receive("ok", (resp: { is_moderator: boolean }) => {
      setEventChannel(eventChannel);
      setClient({ ...client, isModerator: resp.is_moderator });
    })
    .receive("error", (resp: { reason: string }) => {
      eventChannel.leave();
      getErrorToast(toast, "Error while joining the event.");
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
  toast: any,
  privateChannel: any,
  eventChannel: any,
  client: Client,
  presenterPopup: (toast: any, moderatorTopic: string) => void,
  setPrivateChannel: React.Dispatch<React.SetStateAction<any>>
) => {
  privateChannel
    .join()
    .receive("ok", () => {
      privateChannel.on("presenter_prop", (message: { moderator_topic: string }) => {
        presenterPopup(toast, message.moderator_topic);
      });
      privateChannel.on("presenter_answer", (message: { name: string; answer: string }) => {
        getInfoToast(toast, `User ${message.name} ${message.answer}ed your request.`);
      });
      privateChannel.on("presenter_remove", () => {
        getInfoToast(toast, "You are no longer a presenter.");
        eventChannel.push("presenter_remove", { email: client.email });
      });
      setPrivateChannel(privateChannel);
    })
    .receive("error", (resp: { reason: string }) => {
      privateChannel.leave();
      getErrorToast(toast, "Error while joining the event.");
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
        metas.metas[0].is_presenter && presenters.push({ name: metas.metas[0].name, email: email });
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
