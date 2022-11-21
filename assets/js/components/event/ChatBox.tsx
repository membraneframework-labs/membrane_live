import { Channel } from "phoenix";
import React, { useState, useRef } from "react";
import { EmoteSmile, CrossCircle } from "react-swm-icon-pack";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { Popover, PopoverContent, PopoverTrigger, useDisclosure } from "@chakra-ui/react";
import type { Client, ChatMessage } from "../../types";
import "../../../css/event/chatbox.css";

type EmojiPopoverProps = {
  setMessageInput: React.Dispatch<React.SetStateAction<string>>;
  inputRef: React.RefObject<HTMLInputElement>;
};

const EmojiPopover = ({ setMessageInput, inputRef }: EmojiPopoverProps) => {
  const { isOpen, onToggle, onClose } = useDisclosure();

  return (
    <Popover isOpen={isOpen} onClose={onClose}>
      <PopoverTrigger>
        <button className="EmojiPickerIcon" onClick={onToggle}>
          <EmoteSmile className="EmojiIcon" />
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <Picker
          data={data}
          theme="light"
          onEmojiSelect={(emoji: { native: string }) => {
            setMessageInput((prev) => prev + emoji.native);
            onToggle();
            inputRef.current?.focus();
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

type MessageBoxProps = {
  message: ChatMessage;
  isMyself: boolean;
};

const MessageBox = ({ message, isMyself }: MessageBoxProps) => {
  const getSingleMessage = (messageString: string, index: number) => {
    let cornerClass = "";
    if (index == 0) cornerClass += "Top";
    if (index == message.messages.length - 1) cornerClass += " Bottom";

    return (
      <p key={messageString} className={`SingleMessage ${cornerClass}`} lang="de">
        {index < message.moderatedNo ? <i>Moderated</i> : messageString}
      </p>
    );
  };

  return (
    <div className={`MessageBox ${isMyself ? "Own" : "Other"}`} key={message.messages[0]}>
      {!isMyself ? (
        <p className="ChatterName">{`${message.name} ${message.title}`}</p>
      ) : (
        <p className="YourName">You</p>
      )}
      <div className="MessageCluster">
        {message.messages.map((messageString, index) => getSingleMessage(messageString, index))}
      </div>
    </div>
  );
};

type ChatBoxProps = {
  client: Client;
  eventChannel: Channel | undefined;
  messages: ChatMessage[];
  isBannedFromChat: boolean;
};

const ChatBox = ({ client, eventChannel, messages, isBannedFromChat }: ChatBoxProps) => {
  const [messageInput, setMessageInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const sendChatMessage = (message: string) => {
    if (eventChannel) {
      eventChannel.push("chat_message", { message: message });
      setMessageInput("");
    }
  };

  // the messages array is reversed because of reversed flex-direction
  // thanks to that messages box is scrolled to the bottom by default
  return (
    <div className="ChatBox">
      <div className="MessageInputContainer">
        {isBannedFromChat ? (
          <CrossCircle className="EmojiIcon" />
        ) : (
          <EmojiPopover setMessageInput={setMessageInput} inputRef={inputRef} />
        )}
        <input
          ref={inputRef}
          className="MessageInput"
          type="text"
          value={isBannedFromChat ? "" : messageInput}
          placeholder={
            isBannedFromChat ? "You have been banned from the chat" : "Type your message here..."
          }
          disabled={isBannedFromChat}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={(e) => {
            e.key == "Enter" && messageInput.length > 0 && sendChatMessage(messageInput);
          }}
        />
      </div>
      <div className="Messages">
        {messages
          .map((message: ChatMessage) => (
            <MessageBox
              message={message}
              isMyself={message.email == client.email}
              key={message.id}
            />
          ))
          .reverse()}
      </div>
    </div>
  );
};

export default ChatBox;
