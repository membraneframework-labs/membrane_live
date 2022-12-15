import { Channel, Presence } from "phoenix";
import type { Participant, Client, Presenter, Toast, Metas, MetasUser, PresenterProposition } from "../types/types";
import { NavigateFunction } from "react-router-dom";
import { redirectToHomePage } from "./headerUtils";
import { getErrorToast, getInfoToast } from "./toastUtils";
import { updatePresentersMicAndCamStatuses } from "./rtcUtils";

type EventChannelJoinResponse = {
  is_moderator?: boolean;
  generated_key?: string;
};

export const createEventChannel = (
  toast: Toast,
  client: Client,
  eventChannel: Channel,
  setEventChannel: React.Dispatch<React.SetStateAction<Channel | undefined>>,
  setClient: React.Dispatch<React.SetStateAction<Client>>,
  navigate: NavigateFunction
) => {
  eventChannel
    .join()
    .receive("ok", (response: EventChannelJoinResponse) => {
      eventChannel.on("finish_event", () => {
        redirectToHomePage(navigate);
        getInfoToast(toast, "The event has finished.");
      });
      setEventChannel(eventChannel);
      const isModerator = response?.is_moderator ? true : false;
      const email = response?.generated_key || client.email;
      setClient({ ...client, isModerator: isModerator, email: email });
    })
    .receive("error", (response: { reason: string }) => {
      eventChannel.leave();
      getErrorToast(toast, `Error while joining the event: ${response.reason}`);
    });
};

export const syncEventChannel = (
  eventChannel: Channel,
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>,
  setIsBannedFromChat: React.Dispatch<React.SetStateAction<boolean>>,
  clientEmail: string
) => {
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
        isBannedFromChat: participant.is_banned_from_chat,
      });
    });
    parts.sort(compareParticipants(clientEmail));
    setParticipants(parts);
  };

  presence.onSync(() => {
    updateStates();
    const isBanned = getByKey(presence, clientEmail)?.is_banned_from_chat;
    isBanned != undefined && setIsBannedFromChat(isBanned);
  });

  eventChannel.push("sync_presence", {});
};

export const getByKey = (presence: Presence | undefined, keyEmail: string): MetasUser | undefined => {
  let result: MetasUser | undefined;
  presence?.list((email: string, metas: Metas) => {
    const data = metas.metas[0];
    if (email == keyEmail) result = data;
  });
  return result;
};

export const createPrivateChannel = (
  toast: Toast,
  privateChannel: Channel,
  eventChannel: Channel,
  client: Client,
  presenterPopup: (toast: Toast, moderatorTopic: PresenterProposition) => void,
  setPrivateChannel: React.Dispatch<React.SetStateAction<Channel | undefined>>
) => {
  privateChannel
    .join()
    .receive("ok", () => {
      privateChannel.on("presenter_prop", (message: { moderator_topic: string; main_presenter: boolean }) => {
        presenterPopup(toast, { moderatorTopic: message.moderator_topic, mainPresenter: message.main_presenter });
      });
      privateChannel.on("presenter_answer", (message: { name: string; answer: string }) => {
        getInfoToast(toast, `User ${message.name} ${message.answer}ed your request.`);
      });
      privateChannel.on("error", (message: { message: string }) => {
        getInfoToast(toast, message.message);
      });
      privateChannel.on("presenter_remove", () => {
        getInfoToast(toast, "You are no longer a presenter.");
        eventChannel.push("presenter_remove", { email: client.email });
      });
      privateChannel.on("ban_from_chat", () => {
        getInfoToast(toast, "You have been banned from participating in the chat.");
        eventChannel.push("ban_from_chat", { email: client.email, response: true });
      });
      privateChannel.on("unban_from_chat", () => {
        getInfoToast(toast, "You have been unbanned from participating in the chat.");
        eventChannel.push("unban_from_chat", { email: client.email, response: true });
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
  setPresenters: React.Dispatch<React.SetStateAction<{ [key: string]: Presenter }>>
) => {
  if (eventChannel) {
    const presence = new Presence(eventChannel);

    const updatePresenters = () => {
      const presenters: { [key: string]: Presenter } = {};

      presence.list((email: string, metas: Metas) => {
        // sometimes presence create two object in metas, for example if you open two windows with the same user.
        if (metas.metas[0].is_presenter)
          presenters[email] = {
            name: metas.metas[0].name,
            email: email,
            rtcStatus: "disconnected",
            status: "idle",
            connectCallbacks: [],
            isMainPresenter: metas.metas[0].is_main_presenter,
          };
      });
      setPresenters(updatePresentersMicAndCamStatuses(presenters));
    };

    presence.onSync(() => {
      updatePresenters();
    });

    eventChannel.push("sync_presence", {});
  }
};

export const getChannelId = (): string => window.location.pathname.split("/")[2];

const compareParticipants =
  (clientEmail: string) =>
  (x: Participant, y: Participant): number => {
    return x.email == clientEmail ? -1 : y.email == clientEmail ? 1 : participantToNumber(x) - participantToNumber(y);
  };

const participantToNumber = (participant: Participant): number => {
  return participant.isModerator ? 1 : participant.isPresenter ? 2 : participant.isRequestPresenting ? 3 : 4;
};
