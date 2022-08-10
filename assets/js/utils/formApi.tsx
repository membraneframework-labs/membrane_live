import type { EventForm, Links } from "../pages/Form";
import axios from "../services/index";

export const checkEventForm = (eventForm: EventForm): boolean => {
  return eventForm.start_date != "" && eventForm.title != "";
};

export const sendEventForm = (
  eventForm: EventForm,
  setLinks: React.Dispatch<React.SetStateAction<Links | undefined>>
): void => {
  axios
    .post("/webinars", { webinar: eventForm })
    .then((response) => {
      setLinks(response.data.webinar_links);
    })
    .catch(() => {
      alert("Something went wrong. Please try again in a moment.");
    });
};
