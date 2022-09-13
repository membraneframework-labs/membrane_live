import { Presence } from "phoenix";
import type { Client } from "../types";

export const syncPresentersNumber = (
  eventChannel: any,
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
      presence.list((email: string, metas: any) => {
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
