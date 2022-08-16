import type { EventInfo } from "../components/Header";
import { Presence } from "phoenix";
import { getChannelId } from "../utils/channelUtils";
export const initEventInfo = () => {
  return {
    link: window.location.pathname.split("/")[2],
    title: "Mock",
    description: "",
    start_date: "",
    presenters: [],
  };
};

export const getEventInfo = (setEventInfo: React.Dispatch<React.SetStateAction<EventInfo>>) => {
  const csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute("content");
  const link = window.location.href.split("event")[0] + "webinars/";
  fetch(link + getChannelId(), {
    method: "get",
    headers: { "X-CSRF-TOKEN": csrfToken ? csrfToken : "" },
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      return Promise.reject(response.status);
    })
    .then((data) => {
      const start_date = data.webinar.start_date.replace("T", " ");
      setEventInfo({ ...data.webinar, start_date: start_date });
    })
    .catch(() => {
      alert("Couldn't get event information. Please reload this page.");
    });
};

export const syncParticipantsNumber = (eventChannel, setParticipantsNumber) => {
  if (eventChannel) {
    const presence = new Presence(eventChannel);

    const updateParticipantsNumber = () => {
      let counter = 0;
      presence.list((name: string, metas: any) => {
        counter += 1;
      });
      setParticipantsNumber(counter);
    };

    presence.onSync(() => {
      updateParticipantsNumber();
    });

    eventChannel.push("sync_presence", {});
  }
};
