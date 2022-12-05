import React from "react";
import { Channel, Presence } from "phoenix";
import type { Client, Metas } from "../components/types/types";

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

    const upadteAmIPresenter = () => {
      let newAmIPresenter = false;
      presence.list((email: string, metas: Metas) => {
        if (metas.metas[0].is_presenter && email == client.email) newAmIPresenter = true;
      });
      setAmIPresenter(newAmIPresenter);
    };

    presence.onSync(() => {
      updateParticipantsNumber();
      upadteAmIPresenter();
    });

    eventChannel.push("sync_presence", {});
  }
};
