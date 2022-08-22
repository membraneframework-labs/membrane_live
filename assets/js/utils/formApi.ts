import type { EventForm } from "../pages/Form";
import axiosWithInterceptor from "../services/index";

export const checkEventForm = (eventForm: EventForm): boolean => {
  return eventForm.start_date != "" && eventForm.title != "";
};

export const sendEventForm = async (
  eventForm: EventForm,
  setLink: React.Dispatch<React.SetStateAction<string>>
): Promise<void> => {
  axiosWithInterceptor
    .post(`${window.location.origin}/resources/webinars`, { webinar: eventForm })
    .then((response) => {
      setLink(response.data.link);
    })
    .catch((error) => {
      console.log(error);
    });
};
