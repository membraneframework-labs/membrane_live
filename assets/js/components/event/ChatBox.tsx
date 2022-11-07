import { Channel, Presence } from "phoenix";
import React, { useEffect, useState } from "react";
import { EmoteSmile } from "react-swm-icon-pack";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { Popover, PopoverContent, PopoverTrigger } from "@chakra-ui/react";
import type { Client, ChatMessage, Metas } from "../../types";
import "../../../css/event/chatbox.css";

const getByKey = (presence: Presence, keyEmail: string): string => {
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

type ChatBoxProps = {
  client: Client;
  eventChannel: Channel | undefined;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
};

const ChatBox = ({ client, eventChannel, messages, setMessages }: ChatBoxProps) => {
  const [messageInput, setMessageInput] = useState("");
  let presence: Presence;

  const appendToMessages = ({ email, message }: { email: string; message: string }) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.email == email) last.messages.push(message);
      else {
        const newChatMessage: ChatMessage = {
          email: email,
          name: getByKey(presence, email),
          messages: [message],
        };
        prev.push(newChatMessage);
      }

      return [...prev];
    });
  };

  const sendChatMessage = (message: string) => {
    if (eventChannel) {
      eventChannel.push("chat_message", { email: client.email, message: message });
      setMessageInput("");
    }
  };

  useEffect(() => {
    if (eventChannel) {
      presence = new Presence(eventChannel);
      eventChannel.push("sync_presence", {});
      eventChannel.on("chat_message", (data) => appendToMessages(data));
    }

    return () => {
      if (eventChannel) eventChannel.off("chat_message");
    };
  }, [eventChannel]);

  // the messages array is reversed because of reversed flex-direction
  // thanks to that messages box is scrolled to the bottom by default
  return (
    <div className="ChatBox">
      <div className="MessageInputContainer">
        <Popover>
          <PopoverTrigger>
            <button className="EmojiPickerIcon">
              <EmoteSmile className="EmojiIcon" />
            </button>
          </PopoverTrigger>
          <PopoverContent>
            <Picker
              data={data}
              theme="light"
              onEmojiSelect={(emoji: { native: string }) => {
                setMessageInput((prev) => prev + emoji.native);
              }}
            />
          </PopoverContent>
        </Popover>
        <input
          className="MessageInput"
          type="text"
          value={messageInput}
          placeholder="Type your message here..."
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={(e) => {
            e.key == "Enter" && messageInput.length > 0 && sendChatMessage(messageInput);
          }}
        />
      </div>
      <div className="Messages">
        {messages
          .map((message: ChatMessage) => (
            <div
              className={`MessageBox ${message.email == client.email ? "Own" : "Other"}`}
              key={message.messages[0]}
            >
              {message.email != client.email && <p className="ChatterName">{message.name}</p>}
              <div className="MessageCluster">
                {message.messages.map((messageString, index) => {
                  let cornerClass = "";
                  if (index == 0) cornerClass += "Top";
                  if (index == message.messages.length - 1) cornerClass += " Bottom";

                  return (
                    <p key={messageString} className={`SingleMessage ${cornerClass}`}>
                      {messageString}
                    </p>
                  );
                })}
              </div>
            </div>
          ))
          .reverse()}
      </div>
    </div>
  );
};

export default ChatBox;
