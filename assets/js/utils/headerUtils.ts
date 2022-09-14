import { Presence } from "phoenix";
import axios from "../services/index";
import { getChannelId } from "../utils/channelUtils";
import type { EventInfo, OriginalEventInfo } from "../types";
import { getErrorToast } from "./toastUtils";

export const initEventInfo = (): EventInfo => {
  return {
    uuid: "",
    title: "",
    description: "",
    startDate: new Date(),
    presenters: [],
  };
};

export const getEventInfo = (
  toast: any,
  setEventInfo: React.Dispatch<React.SetStateAction<EventInfo>>,
) => {
  axios
    .get("/resources/webinars/" + getChannelId())
    .then((response: { data: { webinar: OriginalEventInfo } }) => {
      const newDate = new Date();
      newDate.setTime(Date.parse(response.data.webinar.start_date));
      const newElem: any = { ...response.data.webinar, startDate: newDate };
      delete newElem.start_date;
      setEventInfo(newElem as EventInfo);
    })
    .catch((error) => {
      console.log(error);
      getErrorToast(toast, "Event information could not be obtained...");
    });
};

export const syncParticipantsNumber = (
  eventChannel: any,
  setParticipantsNumber: React.Dispatch<React.SetStateAction<number>>
) => {
  if (eventChannel) {
    const presence = new Presence(eventChannel);

    const updateParticipantsNumber = () => {
      setParticipantsNumber(presence.list().length);
    };

    presence.onSync(() => {
      updateParticipantsNumber();
    });

    eventChannel.push("sync_presence", {});
  }
};
