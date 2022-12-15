import { Channel, Presence } from "phoenix";
import axios from "../services/index";
import { getChannelId } from "../utils/channelUtils";
import { getErrorToast } from "./toastUtils";
import { getEventResourcesType } from "./dashboardUtils";
import { NavigateFunction } from "react-router-dom";
import type { EventInfo, OriginalEventInfo, Toast } from "../types/types";

export const initEventInfo = (): EventInfo => {
  return {
    uuid: "",
    title: "",
    description: "",
    startDate: new Date(),
    presenters: [],
    moderatorEmail: "",
  };
};

export const mapToEventInfo = (originalEventInfo: OriginalEventInfo) => {
  const newDate = new Date();
  if (originalEventInfo.start_date) newDate.setTime(Date.parse(originalEventInfo.start_date));
  const email = originalEventInfo.moderator_email;
  delete originalEventInfo.start_date;
  delete originalEventInfo.moderator_email;
  const newEventInfo: EventInfo = {
    ...originalEventInfo,
    startDate: newDate,
    moderatorEmail: email || "",
  };
  return newEventInfo;
};

export const getEventInfo = (
  toast: Toast,
  setEventInfo: React.Dispatch<React.SetStateAction<EventInfo>>,
  isRecording: boolean
) => {
  const eventResourcesType = getEventResourcesType(isRecording);

  axios
    .get(`/resources/${eventResourcesType}/` + getChannelId())
    .then((response: { data: { webinar: OriginalEventInfo } }) => {
      setEventInfo(mapToEventInfo(response.data.webinar));
    })
    .catch((error) => {
      console.log(error);
      getErrorToast(toast, "Event information could not be obtained...");
    });
};

export const syncParticipantsNumber = (
  eventChannel: Channel | undefined,
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

export const redirectToHomePage = (navigate: NavigateFunction) => {
  navigate("/");
  // the line above does not break the socket connection
  // which is desired in this case, so the page is reloaded manually
  window.location.reload();
};
