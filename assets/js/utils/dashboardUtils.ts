import axiosWithInterceptor from "../services/index";
import { getErrorToast, getInfoToast } from "./toastUtils";
import { mapToEventInfo } from "./headerUtils";
import type { EventFormInput, EventInfo, ModalForm, OriginalEventInfo } from "../types";

export const checkEventForm = (eventForm: EventFormInput): boolean => {
  return eventForm.start_date != "" && eventForm.title != "";
};

const methodMap = {
  create: axiosWithInterceptor.post,
  update: axiosWithInterceptor.put,
};

export const sendEventForm = async (
  modalType: ModalForm,
  eventForm: EventFormInput,
  uuid: string = ""
): Promise<any> => {
  const endpoint = "resources/webinars/" + uuid;
  const method = methodMap[modalType];

  return method(endpoint, { webinar: eventForm });
};

export const deleteEvent = async (uuid: string, toast: any): Promise<void> => {
  axiosWithInterceptor
    .delete("resources/webinars/" + uuid)
    .then((_response: Response) => {
      window.location.reload();
      getInfoToast(toast, "The webinar has been deleted.");
    })
    .catch((error) => {
      console.log(error);
      getErrorToast(toast, "The webinar could not be deleted.");
    });
};

export const getWebinarsInfo = async (
  toast: any,
  setWebinars: React.Dispatch<React.SetStateAction<EventInfo[]>>
) => {
  axiosWithInterceptor
    .get("resources/webinars/")
    .then((response: { data: { webinars: OriginalEventInfo[] } }) => {
      setWebinars(response.data.webinars.map((elem) => mapToEventInfo(elem)));
    })
    .catch((error) => {
      console.log(error);
      getErrorToast(toast, "The webinar information could not be obtained.");
    });
};

const convertDateToString = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60 * 1000;
  const dateWithOffset = new Date(date.getTime() - offset);
  return dateWithOffset.toISOString().replace("Z", "");
};
