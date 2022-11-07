import React, { useEffect, useState } from "react";
import { Menu, MenuButton, MenuList, MenuItem, Tooltip } from "@chakra-ui/react";
import { getByKey, syncEventChannel } from "../../utils/channelUtils";
import { MenuVertical, User1, Crown1, Star1, QuestionCircle } from "react-swm-icon-pack";
import type { Participant, Client, ChatMessage, MetasUser } from "../../types";
import { Channel, Presence } from "phoenix";
import ChatBox from "./ChatBox";
import "../../../css/event/participants.css";

type ModeratorMenuProps = {
  moderatorClient: Client;
  participant: Participant;
  eventChannel: Channel | undefined;
};

const ModeratorMenu = ({ moderatorClient, participant, eventChannel }: ModeratorMenuProps) => {
  const link = "private:" + window.location.pathname.split("/")[2] + ":";

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    switch ((e.target as HTMLTextAreaElement).value) {
      case "Set as a presenter":
        eventChannel?.push("presenter_prop", {
          moderatorTopic: link + moderatorClient.email,
          presenterTopic: link + participant.email,
        });
        break;
      case "Set as a normal participant":
        eventChannel?.push("presenter_remove", { presenterTopic: link + participant.email });
        break;
      case "Ban from the chat":
        eventChannel?.push("ban_from_chat", {email: participant.email});
        break;
      case "Unban from the chat":
        eventChannel?.push("unban_from_chat", {email: participant.email});
        break;
    }
  };

  return (
    <Menu>
      <MenuButton ml={"auto"} area-label="Options">
        <MenuVertical className="OptionButton" />
      </MenuButton>
      <MenuList>
        <MenuItem
          onClick={handleClick}
          value={participant.isPresenter ? "Set as a normal participant" : "Set as a presenter"}
          className="MenuOptionText"
        >
          {participant.isPresenter ? "Set as a normal participant" : "Set as a presenter"}
        </MenuItem>
        <MenuItem
          onClick={handleClick}
          value={participant.isBannedFromChat ? "Unban from the chat" : "Ban from the chat"}
          className="MenuOptionText"
        >
          {participant.isBannedFromChat ? "Unban from the chat" : "Ban from the chat"}
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

type ClientParticipantMenuProps = {
  participant: Participant;
  eventChannel: Channel | undefined;
};

const ClientParticipantMenu = ({ participant, eventChannel }: ClientParticipantMenuProps) => {
  const askText = "Ask to become a presenter";

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if ((e.target as HTMLTextAreaElement).value === askText) {
      eventChannel?.push("presenting_request", {
        email: participant.email,
      });
    } else {
      eventChannel?.push("cancel_presenting_request", { email: participant.email });
    }
  };

  const text = participant.isRequestPresenting ? "Stop asking to become a presenter" : askText;

  return (
    <Menu>
      <MenuButton ml={"auto"} area-label="Options">
        <MenuVertical className="OptionButton" />
      </MenuButton>
      <MenuList>
        <MenuItem onClick={handleClick} value={text} className="MenuOptionText">
          {text}
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

type ParticipantProps = {
  client: Client;
  participant: Participant;
  eventChannel: Channel | undefined;
};

const Participant = ({ client, participant, eventChannel }: ParticipantProps) => {
  const icon = participant.isModerator ? (
    <Crown1 className="ParticipantIcon" />
  ) : participant.isPresenter ? (
    <Star1 className="ParticipantIcon" />
  ) : (
    <User1 className="ParticipantIcon" />
  );
  const role = participant.isModerator
    ? "Moderator"
    : participant.isPresenter
    ? "Presenter"
    : "Participant";

  const isMyself: boolean = client.email == participant.email;
  const isMyselfParticipant = client.isAuthenticated && role == "Participant" && isMyself;

  return (
    <div className="Participant">
      <Tooltip label={`${role}${isMyself ? " (You)" : ""}`} className="InfoTooltip">
        {icon}
      </Tooltip>
      <p className="ParticipantText">{participant.name}</p>
      {participant.isRequestPresenting && (client.isModerator || isMyself) && (
        <Tooltip label={"This user is asking to become a presenter"} className="InfoTooltip">
          <QuestionCircle className="ParticipantIcon" />
        </Tooltip>
      )}
      {client.isModerator && participant.isAuth && (
        <ModeratorMenu
          moderatorClient={client}
          eventChannel={eventChannel}
          participant={participant}
        />
      )}
      {isMyselfParticipant && (
        <ClientParticipantMenu eventChannel={eventChannel} participant={participant} />
      )}
    </div>
  );
};

type ParticipantsListProps = {
  client: Client;
  eventChannel: Channel | undefined;
};

const ParticipantsList = ({ client, eventChannel }: ParticipantsListProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [listMode, setListMode] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isBannedFromChat, setIsBannedFromChat] = useState(false);
  let presence: Presence;

  const appendToMessages = ({ email, message }: { email: string; message: string }) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.email == email) last.messages.push(message);
      else {
        const data: MetasUser | undefined = getByKey(presence, email)
        const role = data ? (data.is_moderator ? " (moderator)" : data.is_presenter ? " (presenter)" : "") : "";
        const newChatMessage: ChatMessage = {
          email: email,
          name: data ? data.name + role : "Unrecognized user",
          messages: [message],
        };
        prev.push(newChatMessage);
      }

      return [...prev];
    });
  };

  useEffect(() => {
    if (eventChannel) {
      presence = syncEventChannel(eventChannel, setParticipants, setIsBannedFromChat, client.email);
      eventChannel.on("chat_message", (data) => appendToMessages(data));
    }

    return () => {
      if (eventChannel) eventChannel.off("chat_message");
    };
  }, [eventChannel]);

  const parts: JSX.Element[] = [];
  participants.map((participant) =>
    parts.push(
      <Participant
        client={client}
        key={participant.email}
        participant={participant}
        eventChannel={eventChannel}
      />
    )
  );

  return (
    <div className="Participants">
      <div className="ParticipantsButtons">
        <button
          className={`ParticipantsButton ${!listMode && "Clicked"}`}
          onClick={() => setListMode(false)}
          name="chat"
        >
          Group Chat
        </button>
        <button
          className={`ParticipantsButton ${listMode && "Clicked"}`}
          name="list"
          onClick={() => setListMode(true)}
        >
          Participants
        </button>
      </div>
      {listMode ? (
        <div className="ParticipantsList">{parts}</div>
      ) : (
        <ChatBox client={client} eventChannel={eventChannel} messages={messages} isBannedFromChat={isBannedFromChat}/>
      )}
    </div>
  );
};

export default ParticipantsList;
