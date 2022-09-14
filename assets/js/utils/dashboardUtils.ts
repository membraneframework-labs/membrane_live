import axiosWithInterceptor from "../services/index";
import { getErrorToast } from "./toastUtils";
import type { EventForm, EventInfo, OriginalEventInfo } from "../types";

export const checkEventForm = (eventForm: EventForm): boolean => {
  return eventForm.start_date != "" && eventForm.title != "";
};

export const sendEventForm = async (
  toast: any,
  eventForm: EventForm,
  setLink: React.Dispatch<React.SetStateAction<string>>
): Promise<void> => {
  axiosWithInterceptor
    .post("resources/webinars", { webinar: eventForm })
    .then((response: { data: { link: string } }) => {
      setLink(response.data.link);
    })
    .catch((error) => {
      console.log(error);
      getErrorToast(toast, "Webinar form could not be submitted...");
    });
};

export const getWebinarsInfo = async (
  toast: any,
  setWebinars: React.Dispatch<React.SetStateAction<EventInfo[]>>
) => {
  axiosWithInterceptor
    .get("resources/webinars")
    .then((response: { data: { webinars: OriginalEventInfo[] } }) => {
      setWebinars(
        (response.data.webinars as OriginalEventInfo[]).map((elem) => {
          const newDate = new Date();
          newDate.setTime(Date.parse(elem.start_date));
          const newElem: any = { ...elem, startDate: newDate };
          delete newElem.start_date;
          return newElem as EventInfo;
        })
      );
    })
    .catch((error) => {
      console.log(error);
      getErrorToast(toast, "Webinar informations could not be obtained...");
    });
};
