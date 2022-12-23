import {useEffect, useRef, useState} from "react";
import {Channel, Socket} from "phoenix";
import {createPrivateChannel, createEventChannel, getChannelId} from "../utils/channelUtils";
import Header from "../components/event/Header";
import {
  storageGetName,
  storageGetAuthToken,
  storageGetIsPresenter,
  storageGetEmail,
  sessionStorageGetName,
  getIsAuthenticated,
  storageGetPresentingRequest,
} from "../utils/storageUtils";
import StreamArea from "../components/event/StreamArea";
import {useToast} from "@chakra-ui/react";
import {lastPersonPopup, presenterPopup} from "../utils/toastUtils";
import {useNavigate} from "react-router-dom";
import type {Client, EventInfo, Mode, Toast} from "../types/types";
import NamePopup from "../components/event/NamePopup";
import useCheckScreenType from "../utils/useCheckScreenType";
import {getEventInfo, initEventInfo} from "../utils/headerUtils";
import {pageTitlePrefix} from "../utils/const";
import axiosWithInterceptor from "../services";
import {redirectToHomePage} from "../utils/headerUtils";
import "../../css/event/event.css";
import SidebarList from "../components/event/SidebarList";

const Event = () => {
  const toast: Toast = useToast();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client>({
    name: storageGetName() || sessionStorageGetName(),
    email: storageGetEmail(),
    isModerator: false,
    isAuthenticated: getIsAuthenticated(),
  });
  const [eventChannel, setEventChannel] = useState<Channel>();
  const [privateChannel, setPrivateChannel] = useState<Channel>();
  const [eventInfo, setEventInfo] = useState<EventInfo>(initEventInfo());

  const screenType = useCheckScreenType();
  const [mode, setMode] = useState<Mode>("hls");

  const socket = useRef(new Socket("/socket"));
  socket.current.connect();

  useEffect(() => getEventInfo(toast, setEventInfo, false), [toast]);
  useEffect(() => {
    if (eventInfo.title != "") document.title = `${pageTitlePrefix} | ${eventInfo.title}`;
  }, [eventInfo]);

  useEffect(() => {
    const alreadyJoined = eventChannel?.state === "joined";

    if (!alreadyJoined && client.name) {
      const promise = client.isAuthenticated
        ? axiosWithInterceptor.get("/me").then(() => {
          return {
            token: storageGetAuthToken(),
            presenter: storageGetIsPresenter(),
            requestPresenting: storageGetPresentingRequest(),
          };
        })
        : Promise.resolve({username: client.name});

      promise.then((msg) => {
        const channel = socket.current.channel(`event:${getChannelId()}`, msg);
        createEventChannel(
          toast,
          client,
          channel,
          setEventChannel,
          setClient,
          navigate,
          (toast: Toast, timeout: number) =>
            lastPersonPopup(toast, channel, timeout, () => redirectToHomePage(navigate))
        );
      });
    }
  }, [eventChannel, client.name, client, socket, toast, navigate]);

  useEffect(() => {
    const privateAlreadyJoined = privateChannel?.state === "joined";
    const eventAlreadyJoined = eventChannel?.state === "joined";
    if (!privateAlreadyJoined && eventAlreadyJoined) {
      const channel = socket.current.channel(`private:${getChannelId()}:${client.email}`, {});
      createPrivateChannel(
        toast,
        channel,
        eventChannel,
        client,
        (toast, moderatorTopic: string) => presenterPopup(toast, client, eventChannel, moderatorTopic, setMode),
        setPrivateChannel
      );
    }
  }, [client, eventChannel, privateChannel, socket, toast]);

  return (
    <div className="EventPage">
      {!client.name && <NamePopup client={client} setClient={setClient}></NamePopup>}
      {(screenType.device == "desktop" || screenType.orientation === "portrait") && (
        <Header client={client} eventChannel={eventChannel} isRecording={false}
                eventInfo={eventInfo}/>
      )}
      <div className="MainGrid">
        <StreamArea
          client={client}
          eventChannel={eventChannel}
          privateChannel={privateChannel}
          mode={mode}
          setMode={setMode}
          eventTitle={eventInfo.title}
        />
        {screenType.device == "desktop" &&
          <SidebarList client={client} eventChannel={eventChannel}/>}
      </div>
    </div>
  );
};

export default Event;
