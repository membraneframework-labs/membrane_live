import React, { useEffect, useState } from "react";
import { Button, Heading, Center, Flex, Box, Spacer } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { Socket, Presence } from "phoenix";
import Popup from "../components/Popup";
import PresenterPopup from "../components/PresenterPopup";
import ParticipantsList from "../components/ParticipantsList";

export type EventInfo = {
  username: string;
  link: string;
  title: string;
  description: string;
  start_date: string;
  presenters: string[];
  is_moderator: boolean;
};

type PopupState = {
  isOpen: boolean;
  channelConnErr: string;
}

type PresenterPopupState = {
  isOpen: boolean;
  moderator: string;
}

const initEventInfo = () => {
  return {
    username: "",
    link: window.location.pathname.split("/")[2],
    title: "",
    description: "",
    start_date: "",
    presenters: [],
    is_moderator: window.location.pathname.split("/")[3] != undefined,
  };
};

const Event = () => {
  const [eventInfo, setEventInfo] = useState<EventInfo>(initEventInfo());
  const [presenterPopupState, setPresenterPopupState] = useState<PresenterPopupState>({isOpen: false, moderator: ""}); // will be triggered with call from server
  const [participants, setParticipants] = useState<any[]>([]);
  const [eventChannel, setEventChannel] = useState();
  const [privateChannel, setPrivateChannel] = useState();
  const [popupState, setPopupState] = useState<PopupState>({isOpen: true, channelConnErr: ""});
  const navigate = useNavigate();
  const csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute("content");
  const socket = new Socket("/socket");
  socket.connect();

  useEffect(() => {
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
      .catch((e) => {
        alert("Couldn't get event information. Please reload this page.");
      });
  }, []);

  useEffect(() => {
    if (eventChannel) {
      eventChannel
      .join()
      .receive("ok", (resp) => {
        const presence = new Presence(eventChannel);
        presence
          .onSync(() => {
            const parts: any[]= [];
            presence.list((name, metas) => {
              let isPresenter = false;
              for(const item of metas.metas) {
                if(item.is_presenter) isPresenter = true;
              }
              parts.push({name: name, isPresenter: isPresenter});
            });
            setParticipants(parts);
          });
        setPopupState({isOpen: false, channelConnErr: ""});
      })
      .receive("error", (resp) => {
        if (resp.reason === "Viewer with this name already exists.") setPopupState({...popupState, channelConnErr: resp.reason});
        else alert(resp.reason);
      });
    }
  }, [eventChannel]);

  useEffect(() => {
    if (privateChannel) {
      privateChannel.join()
      .receive("ok", (resp) => {
        privateChannel.on("presenter_prop", (message) => {
          setPresenterPopupState({isOpen: true, moderator: message.moderator});
        });
        privateChannel.on("presenter_answer", (message) => {
          alert("User " + message.name + " " + message.answer + " your request.")
        });
        privateChannel.on("presenter_remove", (message) => {
          alert("You are no longer presenter.");
          eventChannel.push("presenter_remove", {presenter: eventInfo.username});
        });
      })
      .receive("error", (resp) => {
        alert(resp.reason);
      });
    }
  }, [privateChannel]);

  const connectToChannels = (name: string) => {
    if (eventChannel) eventChannel.leave();
    setEventChannel(socket.channel("event:" + eventInfo.link, { name: name }));
    if (privateChannel) privateChannel.leave();
    setPrivateChannel(socket.channel("private:" + eventInfo.link + ":" + name, {}));
  }

  const handleExitButton = () => {
    navigate("/");
  };

  return (
    <>
      <Flex w="100vh">
        <Box w="50%">
          <Heading>{eventInfo.title}</Heading>
          <Center alignContent="center" bg="black" w="100%" height="50%" p={4} color="white">
            Please wait for the moderator to select a presenter
          </Center>
          <Button marginLeft="90%" colorScheme="red" size="lg" onClick={handleExitButton}>
            {" "}
            EXIT{" "}
          </Button>
        </Box>
        <Spacer />
        <ParticipantsList yourName={eventInfo.username} eventChannel={eventChannel} participants={participants} isModerator={eventInfo.is_moderator} />
      </Flex>
      <Popup eventInfo={eventInfo} setEventInfo={setEventInfo} isOpen={popupState.isOpen} channelConnErr={popupState.channelConnErr} connectToChannels={connectToChannels} />
      {presenterPopupState.isOpen ? <PresenterPopup moderator={presenterPopupState.moderator} name={eventInfo.username} setPopupState={setPresenterPopupState} eventChannel={eventChannel} /> : null}
    </>
  );
};

export default Event;
