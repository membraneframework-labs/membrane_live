import axiosWithInterceptor from "../services/index";

export type EventForm = {
  title: string;
  description: string;
  start_date: string;
  presenters: string[];
};

export type WebinarInfo = {
  title: string;
  description: string;
  presenters: string[];
  start_date: Date;
  uuid: string;
};

type OriginalWebinarInfo = {
  title: string;
  description: string;
  presenters: string[];
  start_date: string;
  uuid: string;
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

export const getWebinarInfo = async (
  setWebinars: React.Dispatch<React.SetStateAction<WebinarInfo[]>>
) => {
  axiosWithInterceptor
    .get("resources/webinars")
    .then((response) => {
      setWebinars(
        (response.data.webinars as OriginalWebinarInfo[]).map((elem) => {
          const newDate = new Date();
          newDate.setTime(Date.parse(elem.start_date));
          return { ...elem, start_date: newDate };
        })
      );
    })
    .catch((error) => {
      console.log(error);
    });
};
