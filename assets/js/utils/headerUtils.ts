import { Presence } from "phoenix";
import axios from "../services/index";
import { getChannelId } from "../utils/channelUtils";
import type { EventInfo, OriginalEventInfo } from "../types";
import { getErrorToast } from "./toastUtils";
import { getEventResourcesType } from "./dashboardUtils";
import { useNavigate } from "react-router-dom";

export const initEventInfo = (): EventInfo => {
  return {
    uuid: "",
    title: "",
    description: "",
    startDate: new Date(),
    presenters: [],
  };
};

export const mapToEventInfo = (originalEventInfo: OriginalEventInfo) => {
  const newDate = new Date();
  newDate.setTime(Date.parse(originalEventInfo.start_date));
  const newEventInfo: any = { ...originalEventInfo, startDate: newDate };
  delete newEventInfo.start_date;
  return newEventInfo as EventInfo;
};

export const getEventInfo = (
  toast: any,
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

export const redirectToHomePage = () => {
  const navigate = useNavigate();
  navigate("/");
  // the line above does not break the socket connection
  // which is desired in this case, so the page is reloaded manually
  window.location.reload();
};
