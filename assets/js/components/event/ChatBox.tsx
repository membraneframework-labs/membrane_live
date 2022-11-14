import { Channel } from "phoenix";
import React, { useState } from "react";
import { EmoteSmile } from "react-swm-icon-pack";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { Popover, PopoverContent, PopoverTrigger } from "@chakra-ui/react";
import type { Client, ChatMessage } from "../../types";
import "../../../css/event/chatbox.css";

type EmojiPopoverProps = {
  setMessageInput: React.Dispatch<React.SetStateAction<string>>;
};

const EmojiPopover = ({ setMessageInput }: EmojiPopoverProps) => (
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
);

type ChatBoxProps = {
  client: Client;
  eventChannel: Channel | undefined;
  messages: ChatMessage[];
};

const ChatBox = ({ client, eventChannel, messages }: ChatBoxProps) => {
  const [messageInput, setMessageInput] = useState("");

  const sendChatMessage = (message: string) => {
    if (eventChannel) {
      eventChannel.push("chat_message", { email: client.email, message: message });
      setMessageInput("");
    }
  };

  // the messages array is reversed because of reversed flex-direction
  // thanks to that messages box is scrolled to the bottom by default
  return (
    <div className="ChatBox">
      <div className="MessageInputContainer">
        <EmojiPopover setMessageInput={setMessageInput} />
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
          .map((message: ChatMessage) => {
            const isMyself = message.email == client.email;
            return (
              <div className={`MessageBox ${isMyself ? "Own" : "Other"}`} key={message.messages[0]}>
                {!isMyself ? (
                  <p className="ChatterName">{message.name}</p>
                ) : (
                  <p className="YourName">You</p>
                )}
                <div className="MessageCluster">
                  {message.messages.map((messageString, index) => {
                    let cornerClass = "";
                    if (index == 0) cornerClass += "Top";
                    if (index == message.messages.length - 1) cornerClass += " Bottom";

                    return (
                      <p key={messageString} className={`SingleMessage ${cornerClass}`} lang="de">
                        {messageString}
                      </p>
                    );
                  })}
                </div>
              </div>
            );
          })
          .reverse()}
      </div>
    </div>
  );
};

export default ChatBox;
