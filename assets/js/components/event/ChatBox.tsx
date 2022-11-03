import { Channel } from "phoenix";
import React, { useEffect, useState } from "react";
import type { Client } from "../../types";
import "../../../css/event/chatbox.css";

type ChatBoxProps = {
  client: Client;
  eventChannel: Channel | undefined;
}
const ChatBox = ({client, eventChannel}: ChatBoxProps) => {
  const [messageInput, setMessageInput] = useState("");

  const sendChatMessage = (message: string) => {
    if (eventChannel)
      eventChannel.push("chatMessage", {email: client.email, message: message});
    // response handling ?
  }

  useEffect(() => {
    if (eventChannel)
      eventChannel.on("chatMessage", (message) => {console.log(message)});

    return () => {
      if (eventChannel)
        eventChannel.off("chatMessage");
    };
  }, [eventChannel]);

  return (
    <div className="ChatBox">
      <input
        className="MessageInput"
        type="text"
        placeholder="Type message here..."
        onChange={(e) => setMessageInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key == "Enter" && messageInput.length > 0)
          sendChatMessage(messageInput);
        }}
        required
      />
    </div>
  );
}

export default ChatBox;
