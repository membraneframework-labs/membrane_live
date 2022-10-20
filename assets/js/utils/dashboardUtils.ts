import axios from "../services";
import { getErrorToast, getInfoToast } from "./toastUtils";
import { mapToEventInfo } from "./headerUtils";
import type { EventFormInput, EventInfo, ModalForm, OriginalEventInfo, Toast } from "../types";
import axiosWithInterceptor from "../services";

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
  uuid = ""
): Promise<void> => {
  const endpoint = "resources/webinars/" + uuid;
  const method = methodMap[modalType];

  return method(endpoint, { webinar: eventForm });
};

export const deleteEvent = (uuid: string, toast: Toast): void => {
  axiosWithInterceptor
    .delete("resources/webinars/" + uuid)
    .then(() => {
      window.location.reload();
      getInfoToast(toast, "The webinar has been deleted.");
    })
    .catch((error) => {
      console.log(error);
      if (error.response.status === 403) {
        getErrorToast(toast, "You are not permitted to delete this webinar");
      } else {
        getErrorToast(toast, "The webinar could not be deleted.");
      }
    });
};

export const getWebinarsInfo = async (
  toast: Toast,
  setWebinars: React.Dispatch<React.SetStateAction<EventInfo[]>>
) => {
  axios
    .get("resources/webinars/")
    .then((response: { data: { webinars: OriginalEventInfo[] } }) => {
      setWebinars(response.data.webinars.map((elem) => mapToEventInfo(elem)));
    })
    .catch((error) => {
      console.log(error);
      getErrorToast(toast, "The webinar information could not be obtained.");
    });
};
