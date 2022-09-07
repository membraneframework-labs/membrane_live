import axiosWithInterceptor from "../services/index";

export type EventForm = {
  title: string;
  description: string;
  start_date: string;
  presenters: string[];
};

export const checkEventForm = (eventForm: EventForm): boolean => {
  return eventForm.start_date != "" && eventForm.title != "";
};

export const sendEventForm = async (
  eventForm: EventForm,
  setLink: React.Dispatch<React.SetStateAction<string>>
): Promise<void> => {
  axiosWithInterceptor
    .post("resources/webinars", { webinar: eventForm })
    .then((response) => {
      setLink(response.data.link);
    })
    .catch((error) => {
      console.log(error);
    });
};
