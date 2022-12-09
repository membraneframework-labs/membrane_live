import { useContext, useEffect, useRef, useState } from "react";
import { Channel, Presence } from "phoenix";
import { AwaitingMessage, ChatMessage, MetasUser } from "../types/types";
import { getByKey } from "./channelUtils";
import { StreamStartContext } from "./StreamStartContext";

export const useChatMessages = (eventChannel: Channel | undefined): ChatMessage[] => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const { streamStart } = useContext(StreamStartContext);
  const presence = useRef<Presence>();
  const futureChatMessags = useRef<AwaitingMessage[]>([]);

  const getTitle = (data: MetasUser | undefined) =>
    data ? (data.is_moderator ? "(moderator)" : data.is_presenter ? "(presenter)" : "") : "";

  const appendToChatMessages = ({ email, message, offset }: { email: string; message: string, offset: number }, startTime: Date | null) => {
    if (offset == 0 || !startTime) {
      setChatMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.email == email) last.messages.push(message);
        else {
          const data = getByKey(presence.current, email);
          const newChatMessage: ChatMessage = {
            id: last ? last.id + 1 : 0,
            email: email,
            name: data ? data.name : "Unrecognized user",
            title: getTitle(data),
            moderatedNo: 0, // number of hiddend messages counting from the start
            messages: [message],
          };
          prev.push(newChatMessage);
        }
  
        return [...prev];
      });
    } else {
      futureChatMessags.current.push({
        email: email,
        message: message,
        time: startTime ? new Date(startTime.getTime() + offset) : new Date(),
      })
    }
  };

  const updateMessages = () => {
    setChatMessages((prev) => {
      let changed = false;
      prev.forEach(chatMessage => {
        const data = getByKey(presence.current, chatMessage.email);
        if (!data) return;

        const moderatedNo = data.is_banned_from_chat ? chatMessage.messages.length : chatMessage.moderatedNo;
        if (moderatedNo != chatMessage.moderatedNo) {
          chatMessage.moderatedNo = moderatedNo;
          changed = true;
        }

        const newTitle = getTitle(data);
        if (chatMessage.title != newTitle) {
          chatMessage.title = newTitle;
          changed = true;
        }
      });
      return changed ? [...prev] : prev;
    });

    futureChatMessags.current.filter(chatMessage => {
      const data = getByKey(presence.current, chatMessage.email);
      if (!data) return false;
      return !data.is_banned_from_chat;
    })
  };

  useEffect(() => {
    let interval: number;
    if (eventChannel) {
      presence.current = new Presence(eventChannel);
      eventChannel.push("sync_presence", {});
      eventChannel.on("chat_message", (data) => appendToChatMessages(data, streamStart));
      presence.current.onSync(updateMessages);
      interval = setInterval(() => {
        futureChatMessags.current = futureChatMessags.current.filter(message => {
          if (message.time <= new Date()) {
            appendToChatMessages({email: message.email, message: message.message, offset: 0}, streamStart);
            return false;
          }
          return true;
        })
      }, 1000);
    }

    return () => {
      if (eventChannel) eventChannel.off("chat_message");
      clearInterval(interval);
      presence.current = undefined;
    };
  }, [eventChannel, streamStart]);

  return chatMessages;
};
