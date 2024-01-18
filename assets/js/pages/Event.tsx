import { useContext, useEffect, useRef, useState } from "react";
import { Channel, Socket } from "phoenix";
import { createEventChannel, createPrivateChannel, getChannelId, syncEventChannel } from "../utils/channelUtils";
import Header from "../components/event/Header";
import {
  getIsAuthenticated,
  sessionStorageGetIsPresenter,
  sessionStorageGetName,
  storageGetAuthToken,
  storageGetEmail,
  storageGetName,
  storageGetPresentingRequest,
} from "../utils/storageUtils";
import StreamArea from "../components/event/StreamArea";
import { useToast } from "@chakra-ui/react";
import { getErrorToast, lastPersonPopup, presenterPopup } from "../utils/toastUtils";
import { useNavigate } from "react-router-dom";
import NamePopup from "../components/event/NamePopup";
import { getEventInfo, initEventInfo, redirectToHomePage } from "../utils/headerUtils";
import { pageTitlePrefix } from "../utils/const";
import { axiosWithInterceptor } from "../services";
import Sidebar from "../components/event/Sidebar";
import { useChatMessages } from "../utils/useChatMessages";
import { ScreenTypeContext } from "../utils/ScreenTypeContext";
import type {
  Client,
  EventInfo,
  Participant,
  PresenterProposition,
  Toast,
} from "../types/types";
import "../../css/event/event.css";
import { syncAmIPresenter } from "../utils/modePanelUtils";

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

  const screenType = useContext(ScreenTypeContext);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isBannedFromChat, setIsBannedFromChat] = useState(false);

  const [amIPresenter, setAmIPresenter] = useState<boolean>(false);
  const [presenterToken, setPresenterToken] = useState<string>();

  const { chatMessages, isChatLoaded } = useChatMessages(eventChannel);

  const socket = useRef(new Socket("/socket", { heartbeatIntervalMs: 5000 }));
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

      promise
        .then((msg) => {
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
        })
        .catch((error) => {
          console.error("User info could not be obtained");
          if (error.response.status === 401) {
            getErrorToast(toast, "Invalid access token. Please log in again.");
          } else {
            console.log("Unknown problem with fetching the user info.");
          }
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
        (toast, message: PresenterProposition) => presenterPopup(toast, client, eventChannel, message, setPresenterToken),
        setPrivateChannel
      );
    }
  }, [client, eventChannel, privateChannel, socket, toast]);

  useEffect(() => {
    if (eventChannel) {
      syncEventChannel(eventChannel, setParticipants, setIsBannedFromChat, client.email);
    }
  }, [client.email, eventChannel]);

  useEffect(() => {
    if (eventChannel) {
      // eventChannel.on("playlistPlayable", (message) => addHlsUrl(message));
      // eventChannel.push("isPlaylistPlayable", {}).receive("ok", (message) => addHlsUrl(message));
      syncAmIPresenter(eventChannel, setAmIPresenter, client);
    }
  }, [client, eventChannel]);

  return (
    <div className="EventPage">
      {!client.name && <NamePopup client={client} setClient={setClient}></NamePopup>}
      {(screenType.device == "desktop" || screenType.orientation === "portrait") && (
        <Header client={client} eventChannel={eventChannel} isRecording={false} eventInfo={eventInfo} />
      )}
      <div className="MainGrid">
        <StreamArea
          client={client}
          amIPresenter={amIPresenter}
          eventChannel={eventChannel}
          eventInfo={eventInfo}
          chatMessages={chatMessages}
          isChatLoaded={isChatLoaded}
          isBannedFromChat={isBannedFromChat}
          presenterToken={presenterToken}
        />
        {screenType.device == "desktop" && (
          <Sidebar
            client={client}
            eventChannel={eventChannel}
            isChatLoaded={isChatLoaded}
            chatMessages={chatMessages}
            participants={participants}
            isBannedFromChat={isBannedFromChat}
          />
        )}
      </div>
    </div>
  );
};

export default Event;
