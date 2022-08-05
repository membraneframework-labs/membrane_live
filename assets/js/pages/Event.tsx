import React, { useEffect, useState } from "react";
import PresenterStreamArea from "../components/PresenterStreamArea";
import ParticipantsList from "../components/ParticipantsList";
import NamePopup from "../components/NamePopup";
import { Socket } from "phoenix";
import { createPrivateChannel, createEventChannel } from "../utils/channelUtils";
import PresenterPopup from "../components/PresenterPopup";
import HLSPlayer from "../components/Player";

export type EventInfo = {
  link: string;
  title: string;
  description: string;
  start_date: string;
  presenters: string[];
  isModerator: boolean;
};

export type NamePopupState = {
  isOpen: boolean;
  channelConnErr: string;
};

export type PresenterPopupState = {
  isOpen: boolean;
  moderator: string;
};

const initEventInfo = () => {
  return {
    link: window.location.pathname.split("/")[2],
    title: "",
    description: "",
    start_date: "",
    presenters: [],
    isModerator: window.location.pathname.split("/")[3] != undefined,
  };
};

const getEventInfo = (
  eventInfo: EventInfo,
  setEventInfo: React.Dispatch<React.SetStateAction<EventInfo>>
) => {
  const csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute("content");

  fetch("http://localhost:4000/webinars/" + eventInfo.link, {
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
      setEventInfo({ ...eventInfo, ...data.webinar });
    })
    .catch(() => {
      alert("Couldn't get event information. Please reload this page.");
    });
};

const Event = () => {
  const [eventInfo, setEventInfo] = useState<EventInfo>(initEventInfo());
  const [namePopupState, setNamePopupState] = useState<NamePopupState>({
    isOpen: true,
    channelConnErr: "",
  });
  const [presenterPopupState, setPresenterPopupState] = useState<PresenterPopupState>({
    isOpen: false,
    moderator: "",
  });
  const [name, setName] = useState<string>("");

  const [eventChannel, setEventChannel] = useState<any>();
  const [privateChannel, setPrivateChannel] = useState<any>();

  const [presenters, setPresenters] = useState<string[]>([]);

  const socket = new Socket("/socket");
  socket.connect();

  useEffect(() => {
    getEventInfo(eventInfo, setEventInfo);
  }, []);

  useEffect(() => {
    const alreadyJoined = eventChannel?.state === "joined";
    if (name && !alreadyJoined) {
      const channel = socket.channel("event:" + eventInfo.link, { name: name });
      createEventChannel(channel, namePopupState, setNamePopupState, setEventChannel);
    }
  }, [name, eventChannel]);

  useEffect(() => {
    const privateAlreadyJoined = privateChannel?.state === "joined";
    const eventAlreadyJoined = eventChannel?.state === "joined";
    if (name && !privateAlreadyJoined && eventAlreadyJoined) {
      const channel = socket.channel("private:" + eventInfo.link + ":" + name, {});
      createPrivateChannel(channel, eventChannel, name, setPresenterPopupState, setPrivateChannel);
    }
  }, [name, eventChannel, privateChannel]);

  return (
    <>
      <PresenterStreamArea username={name} presenters={presenters} eventChannel={eventChannel} />
      <ParticipantsList
        username={name}
        isModerator={eventInfo.isModerator}
        eventChannel={eventChannel}
        setPresenters={setPresenters}
      />
      <NamePopup
        setName={setName}
        isOpen={namePopupState.isOpen}
        channelConnErr={namePopupState.channelConnErr}
      />
      {presenterPopupState.isOpen && (
        <PresenterPopup
          username={name}
          moderator={presenterPopupState.moderator}
          eventChannel={eventChannel}
          setPopupState={setPresenterPopupState}
        />
      )}
      <HLSPlayer eventChannel={eventChannel} />
    </>
  );
};

export default Event;
