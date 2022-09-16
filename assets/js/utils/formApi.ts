import type { EventFormType, ModalFormType } from "../types";
import axiosWithInterceptor from "../services/index";

export const checkEventForm = (eventForm: EventFormType): boolean => {
  return eventForm.start_date != "" && eventForm.title != "";
};

const methodMap = {
  create: axiosWithInterceptor.post,
  update: axiosWithInterceptor.put,
};

export const sendEventForm = async (
  modalType: ModalFormType,
  eventForm: EventFormType,
  uuid: string = ""
): Promise<any> => {
  const endpoint = "resources/webinars/" + uuid;
  const method = methodMap[modalType];

  return method(endpoint, { webinar: eventForm });
};
