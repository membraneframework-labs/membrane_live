import React, { useEffect, useState } from "react";
import { Menu, MenuButton, MenuList, MenuItem, Tooltip } from "@chakra-ui/react";
import { syncEventChannel } from "../../utils/channelUtils";
import { MenuVertical, User1, Crown1, Star1, QuestionCircle } from "react-swm-icon-pack";
import type { Participant, Client, ChatMessage, Metas } from "../../types";
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
    if ((e.target as HTMLTextAreaElement).value === "Set as a presenter") {
      eventChannel?.push("presenter_prop", {
        moderatorTopic: link + moderatorClient.email,
        presenterTopic: link + participant.email,
      });
    } else {
      eventChannel?.push("presenter_remove", { presenterTopic: link + participant.email });
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
  let presence: Presence;

  const getByKey = (keyEmail: string): string => {
    let result = "Unrecognized user";
    presence.list((email: string, metas: Metas) => {
      const data = metas.metas[0];
      if (email == keyEmail) {
        const role = data.is_moderator ? " (moderator)" : data.is_presenter ? " (presenter)" : "";
        result = data.name + role;
      }
    });

    return result;
  };

  const appendToMessages = ({ email, message }: { email: string; message: string }) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.email == email) last.messages.push(message);
      else {
        const newChatMessage: ChatMessage = {
          email: email,
          name: getByKey(email),
          messages: [message],
        };
        prev.push(newChatMessage);
      }

      return [...prev];
    });
  };

  useEffect(() => {
    if (eventChannel) {
      presence = syncEventChannel(eventChannel, setParticipants, client.email);
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
        <ChatBox client={client} eventChannel={eventChannel} messages={messages} />
      )}
    </div>
  );
};

export default ParticipantsList;
