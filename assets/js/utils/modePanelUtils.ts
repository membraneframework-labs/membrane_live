import React from "react";
import { Channel, Presence } from "phoenix";
import type { Client, Metas } from "../types/types";

export const syncPresentersNumber = (
  eventChannel: Channel | undefined,
  setPresentersNumber: React.Dispatch<React.SetStateAction<number>>,
  setAmIPresenter: React.Dispatch<React.SetStateAction<boolean>>,
  client: Client
): void => {
  if (eventChannel) {
    const presence = new Presence(eventChannel);

    const updateParticipantsNumber = () => {
      setPresentersNumber(presence.list().filter((elem) => elem.metas[0].is_presenter).length);
    };

    presence.onSync(() => {
      updateParticipantsNumber();
      updateAmIPresenter(presence, setAmIPresenter, client);
    });

    eventChannel.push("sync_presence", {});
  }
};

export const syncAmIPresenter = (
  eventChannel: Channel | undefined,
  setAmIPresenter: React.Dispatch<React.SetStateAction<boolean>>,
  client: Client
) => {
  if (eventChannel) {
    const presence = new Presence(eventChannel);

    presence.onSync(() => {
      updateAmIPresenter(presence, setAmIPresenter, client);
    });

    eventChannel.push("sync_presence", {});
  }
};

const updateAmIPresenter = (
  presence: Presence,
  setIsPresenter: React.Dispatch<React.SetStateAction<boolean>>,
  client: Client
) => {
  const newAmIPresenter = presence
    .list((email: string, metas: Metas) => ({ email, metas }))
    .some(({ email, metas }) => metas.metas[0].is_presenter && email === client.email);

  setIsPresenter(newAmIPresenter);
};
