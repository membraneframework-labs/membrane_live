import { Presence } from "phoenix";

export const syncPresentersNumber = (eventChannel, setPresentersNumber) => {
    if (eventChannel) {
      const presence = new Presence(eventChannel);
  
      const updateParticipantsNumber = () => {
        setPresentersNumber(presence.list().filter(elem => elem.metas[0].is_presenter).length);
      };
  
      presence.onSync(() => {
        updateParticipantsNumber();
      });
  
      eventChannel.push("sync_presence", {});
    }
  }