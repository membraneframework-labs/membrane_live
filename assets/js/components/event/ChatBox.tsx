import { Channel } from "phoenix";
import React, { useState, useRef } from "react";
import { EmoteSmile, CrossCircle, RotateLeft } from "react-swm-icon-pack";
import Picker from "@emoji-mart/react";
import { Popover, PopoverContent, PopoverTrigger, useDisclosure } from "@chakra-ui/react";
import type { Client, ChatMessage } from "../../types/types";
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
    if (index == message.contents.length - 1) cornerClass += " Bottom";

    return (
      <p key={index} className={`SingleMessage ${cornerClass}`} lang="de">
        {index < message.moderatedNo ? <i>Moderated</i> : messageString}
      </p>
    );
  };

  return (
    <div className={`MessageBox ${isMyself ? "Own" : "Other"}`} key={message.contents[0]}>
      {!isMyself ? (
        <p className="ChatterName">{`${message.name} ${message.title}`}</p>
      ) : (
        <p className="YourName">You</p>
      )}
      <div className="MessageCluster">
        {message.contents.map((messageString, index) => getSingleMessage(messageString, index))}
      </div>
    </div>
  );
};

type ChatBoxProps = {
  client: Client;
  eventChannel: Channel | undefined;
  messages: ChatMessage[];
  isChatLoaded: boolean;
  isBannedFromChat: boolean;
  isRecording: boolean;
};

const ChatBox = ({ client, eventChannel, messages, isChatLoaded, isBannedFromChat, isRecording }: ChatBoxProps) => {
  const [messageInput, setMessageInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const sendChatMessage = (content: string) => {
    if (eventChannel) {
      eventChannel.push("chat_message", {
        content: content,
      });
      setMessageInput("");
    }
  };

  // the messages array is reversed because of reversed flex-direction
  // thanks to that messages box is scrolled to the bottom by default
  // TODO some of the messages are not properly rendered
  return (
    <div className="ChatBox">
      {!isRecording && (
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
            placeholder={isBannedFromChat ? "You have been banned from the chat" : "Type your message here..."}
            disabled={isBannedFromChat}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => {
              e.key == "Enter" && messageInput.length > 0 && sendChatMessage(messageInput);
            }}
          />
        </div>
      )}
      {isChatLoaded ? (
        <div className="Messages">
          {messages
            .map((message: ChatMessage) => (
              <MessageBox message={message} isMyself={message.email == client.email} key={message.id} />
            ))
            .reverse()}
        </div>
      ) : (
        <div className="ChatLoadingMessage">
          <RotateLeft className="LoadingIcon" />
          <i>Chat is loading...</i>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
