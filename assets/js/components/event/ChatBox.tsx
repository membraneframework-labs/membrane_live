import { Channel, Presence } from "phoenix";
import React, { useEffect, useState } from "react";
import type { Client, ChatMessage, Metas } from "../../types";
import "../../../css/event/chatbox.css";

type ChatBoxProps = {
  client: Client;
  eventChannel: Channel | undefined;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
};
const ChatBox = ({ client, eventChannel, messages, setMessages }: ChatBoxProps) => {
  const [messageInput, setMessageInput] = useState("");
  let presence: Presence;

  const getByKey = (presence: Presence, keyEmail: string): string => {
    let result = "Undefined";
    presence.list((email: string, metas: Metas) => {
      if (email == keyEmail) result = metas.metas[0].name;
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
          name: getByKey(presence, email),
          messages: [message],
        };
        prev.push(newChatMessage);
      }
      console.log(prev);
      return [...prev];
    });
  };

  const sendChatMessage = (message: string) => {
    if (eventChannel) eventChannel.push("chat_message", { email: client.email, message: message });
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

  return (
    <div className="ChatBox">
      <div className="Messages">
        {messages.map((message: ChatMessage) => (
          <div className="MessageCluster" key={message.messages[0]}>
            <p>{message.name}</p>
            {/* TODO */}
          </div>
        ))}
      </div>
      <input
        className="MessageInput"
        type="text"
        placeholder="Type message here..."
        onChange={(e) => setMessageInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key == "Enter" && messageInput.length > 0) sendChatMessage(messageInput);
        }}
      />
    </div>
  );
};

export default ChatBox;
