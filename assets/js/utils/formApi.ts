import type { EventForm, Links } from "../pages/Form";
import axiosWithInterceptor from "../services/index";

export const checkEventForm = (eventForm: EventForm): boolean => {
  return eventForm.start_date != "" && eventForm.title != "";
};

export const sendEventForm = async (
  eventForm: EventForm,
  setLinks: React.Dispatch<React.SetStateAction<Links | undefined>>
): Promise<void> => {
  axiosWithInterceptor
    .post("resources/webinars", { webinar: eventForm })
    .then((response) => {
      setLinks(response.data.webinar_links);
    })
    .catch((error) => {
      console.log(error);
      alert("Something went wrong. Please try again in a moment.");
    });
};
