import { useEffect, useRef, useState } from "react";
import { Channel, Socket } from "phoenix";
import { createPrivateChannel, createEventChannel, getChannelId, syncEventChannel } from "../utils/channelUtils";
import Header from "../components/event/Header";
import {
  storageGetName,
  storageGetAuthToken,
  sessionStorageGetIsPresenter,
  storageGetEmail,
  sessionStorageGetName,
  getIsAuthenticated,
  storageGetPresentingRequest,
} from "../utils/storageUtils";
import StreamArea from "../components/event/StreamArea";
import { useToast } from "@chakra-ui/react";
import { lastPersonPopup, presenterPopup } from "../utils/toastUtils";
import { useNavigate } from "react-router-dom";
import NamePopup from "../components/event/NamePopup";
import useCheckScreenType from "../utils/useCheckScreenType";
import { getEventInfo, initEventInfo } from "../utils/headerUtils";
import { pageTitlePrefix } from "../utils/const";
import axiosWithInterceptor from "../services";
import { StreamStartContext } from "../utils/StreamStartContext";
import { redirectToHomePage } from "../utils/headerUtils";
import Sidebar from "../components/event/Sidebar";
import { useChatMessages } from "../utils/useChatMessages";
import { useProducts } from "../utils/useProducts";
import type { Client, EventInfo, Mode, Toast, PresenterProposition, Participant } from "../types/types";
import "../../css/event/event.css";

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
  const products = useProducts(eventInfo.uuid);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isBannedFromChat, setIsBannedFromChat] = useState(false);

  const screenType = useCheckScreenType();
  const [mode, setMode] = useState<Mode>("hls");
  const [streamStart, setStreamStart] = useState<Date | null>(null);
  const { chatMessages, isChatLoaded } = useChatMessages(eventChannel, streamStart);

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
              presenter: sessionStorageGetIsPresenter(),
              requestPresenting: storageGetPresentingRequest(),
            };
          })
        : Promise.resolve({ username: client.name });

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
        (toast, message: PresenterProposition) => presenterPopup(toast, client, eventChannel, message, setMode),
        setPrivateChannel
      );
    }
  }, [client, eventChannel, privateChannel, socket, toast]);

  useEffect(() => {
    if (eventChannel) {
      syncEventChannel(eventChannel, setParticipants, setIsBannedFromChat, client.email);
    }
  }, [client.email, eventChannel]);

  return (
    <div className="EventPage">
      {!client.name && <NamePopup client={client} setClient={setClient}></NamePopup>}
      {(screenType.device == "desktop" || screenType.orientation === "portrait") && (
        <Header client={client} eventChannel={eventChannel} isRecording={false} eventInfo={eventInfo} />
      )}
      <StreamStartContext.Provider value={{ streamStart, setStreamStart }}>
        <div className="MainGrid">
          <StreamArea
            client={client}
            eventChannel={eventChannel}
            privateChannel={privateChannel}
            mode={mode}
            setMode={setMode}
            eventTitle={eventInfo.title}
            products={products}
            chatMessages={chatMessages}
            isChatLoaded={isChatLoaded}
            isBannedFromChat={isBannedFromChat}
          />
          {screenType.device == "desktop" && (
            <Sidebar
              client={client}
              eventChannel={eventChannel}
              isChatLoaded={isChatLoaded}
              chatMessages={chatMessages}
              products={products}
              participants={participants}
              isBannedFromChat={isBannedFromChat}
            />
          )}
        </div>
      </StreamStartContext.Provider>
    </div>
  );
};

export default Event;
