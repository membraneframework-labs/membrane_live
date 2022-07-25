import React, { useEffect, useState } from "react";
import { Button, Heading, Center, Flex, Box, Spacer } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { Socket, Presence } from "phoenix";
import Popup from "../components/Popup";
import PresenterPopup from "../components/PresenterPopup";
import ParticipantsList from "../components/ParticipantsList";

type EventInfo = {
  username: string;
  link: string;
  title: string;
  description: string;
  start_date: string;
  presenters: string[];
  is_moderator: boolean;
};

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
  const csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute("content");
  const navigate = useNavigate();
  const [eventInfo, setEventInfo] = useState<EventInfo>(initEventInfo());
  const [isPresenterPopupOpen, setIsPresenterPopupOpen] = useState<boolean>(false); // will be triggered with call from server
  const [participants, setParticipants] = useState<string[]>([]);
  const socket = new Socket("/socket");
  socket.connect();
  let channel;
  let presence;
  let userChannel;

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

  const handleExitButton = () => {
    navigate("/");
  };

  const connectToChannel = (
    name: string,
    onClose: () => void,
    setChannelConnErr: (value: any) => void
  ): void => {
    setEventInfo({...eventInfo, username: name});
    channel = socket.channel("event:" + eventInfo.link, { name: name });
    presence = new Presence(channel);
    channel
      .join()
      .receive("ok", (resp) => {
        presence.onSync(() => {
          const parts: string[] = [];
          presence.list((name, { metas: [first, ...rest] }) => {
            parts.push(name);
          });
          setParticipants(parts);
        });
        setChannelConnErr("");
        onClose();
      })
      .receive("error", (resp) => {
        if (resp.reason === "Viewer with this name already exists.") setChannelConnErr(resp.reason);
        else alert(resp.reason);
      });
    userChannel = socket.channel("private:" + eventInfo.link + ":" + name, {});
    userChannel.join()
    .receive("ok", (resp) => {
      channel.on("presenter_prop", (message) => {
        console.log(message); // TODO: implement
      });
      channel.on("presenter_answer", (message) => {
        console.log(message); // TODO: implement
      });
    })
    .receive("error", (resp) => {
      alert(resp.reason);
    });
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
        <ParticipantsList participants={participants} isModerator={eventInfo.is_moderator} />
      </Flex>
      <Popup connectToChannel={connectToChannel} />
      {isPresenterPopupOpen ? <PresenterPopup onAccept={() => {}} onReject={() => {}} /> : null}
    </>
  );
};

export default Event;
