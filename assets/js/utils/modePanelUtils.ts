import { Presence } from "phoenix";

export const syncPresentersNumber = (eventChannel, setPresentersNumber, setAmIPresenter, clientName) => {
    if (eventChannel) {
      const presence = new Presence(eventChannel);

      const updateParticipantsNumber = () => {
        setPresentersNumber(presence.list().filter(elem => elem.metas[0].is_presenter).length);
      };

      const upadteAmIPresenter = () => {
        let newAmIPresenter = false;
        presence.list((name: string, metas: any) => {
          if (metas.metas[0].is_presenter && name == clientName)
          newAmIPresenter = true;
        });
        setAmIPresenter(newAmIPresenter);
      }
  
      presence.onSync(() => {
        updateParticipantsNumber();
        upadteAmIPresenter();
      });
  
      eventChannel.push("sync_presence", {});
    }
  }