import type { EventInfo } from "../components/Header";
import { Presence } from "phoenix";
import { getChannelId } from "../utils/channelUtils";
import axios from "../services/index";

export const initEventInfo = (): EventInfo => {
  return {
    link: "",
    title: "",
    description: "",
    start_date: "",
    presenters: [],
  };
};

export const getEventInfo = (setEventInfo: React.Dispatch<React.SetStateAction<EventInfo>>) => {
  axios
    .get("/resources/webinars/" + getChannelId())
    .then((response) => {
      const start_date = response.data.webinar.start_date.replace("T", " ");
      setEventInfo({ ...response.data.webinar, start_date: start_date });
    })
    .catch((error) => {
      console.log(error);
    });
};

export const syncParticipantsNumber = (eventChannel, setParticipantsNumber) => {
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
