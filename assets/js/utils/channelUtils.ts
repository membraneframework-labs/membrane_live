import { Channel, Presence } from "phoenix";
import type { Participant, Client, Presenter, Toast, Metas } from "../types";
import { getErrorToast, getInfoToast } from "./toastUtils";

export const createEventChannel = (
  toast: Toast,
  client: Client,
  eventChannel: Channel,
  setEventChannel: React.Dispatch<React.SetStateAction<Channel | undefined>>,
  setClient: React.Dispatch<React.SetStateAction<Client>>
) => {
  eventChannel
    .join()
    .receive("ok", (resp: any) => {
      setEventChannel(eventChannel);
      const isModerator = resp?.is_moderator ? true : false;
      const email = resp?.generated_key || client.email;
      setClient({ ...client, isModerator: isModerator, email: email });
    })
    .receive("error", (resp: { reason: string }) => {
      eventChannel.leave();
      getErrorToast(toast, `Error while joining the event: ${resp.reason}`);
    });
};

export const syncEventChannel = (
  eventChannel: Channel | undefined,
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>,
  clientEmail: String
) => {
  if (eventChannel) {
    const presence = new Presence(eventChannel);

    const updateStates = () => {
      const parts: Participant[] = [];
      presence.list((email: string, metas: Metas) => {
        const participant = metas.metas[0];
        parts.push({
          email: email,
          name: participant.name,
          isPresenter: participant.is_presenter,
          isModerator: participant.is_moderator,
          isAuth: participant.is_auth,
          isRequestPresenting: participant.is_request_presenting,
        });
      });
      parts.sort(compareParticipants(clientEmail));
      setParticipants(parts);
    };

    presence.onSync(() => {
      updateStates();
    });

    eventChannel.push("sync_presence", {});
  }
};

export const createPrivateChannel = (
  toast: Toast,
  privateChannel: Channel,
  eventChannel: Channel,
  client: Client,
  presenterPopup: (toast: Toast, moderatorTopic: string) => void,
  setPrivateChannel: React.Dispatch<React.SetStateAction<Channel | undefined>>
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
      getErrorToast(toast, `Error while joining the event: ${resp.reason}`);
    });
};

export const syncPresenters = (
  eventChannel: Channel | undefined,
  setPresenters: React.Dispatch<React.SetStateAction<Presenter[]>>
) => {
  if (eventChannel) {
    const presence = new Presence(eventChannel);

    const updatePresenters = () => {
      const presenters: Presenter[] = [];

      presence.list((email: string, metas: Metas) => {
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

const compareParticipants =
  (clientEmail: String) =>
  (x: Participant, y: Participant): number => {
    return x.email == clientEmail
      ? -1
      : y.email == clientEmail
      ? 1
      : participantToNumber(x) - participantToNumber(y);
  };

const participantToNumber = (participant: Participant): number => {
  return participant.isModerator
    ? 1
    : participant.isPresenter
    ? 2
    : participant.isRequestPresenting
    ? 3
    : 4;
};
