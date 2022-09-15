import type { EventFormType } from "../types";
import axiosWithInterceptor from "../services/index";

export const checkEventForm = (eventForm: EventFormType): boolean => {
  return eventForm.start_date != "" && eventForm.title != "";
};

export const sendEventForm = async (eventForm: EventFormType): Promise<void> => {
  //TODO change it to an async request and remove the happy path console log
  axiosWithInterceptor
    .post("resources/webinars", { webinar: eventForm })
    .then((response) => {
      console.log(response.data.link);
    })
    .catch((error) => {
      console.log(error);
    });
};
