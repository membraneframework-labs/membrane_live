import { useEffect, useRef, useState } from "react";
import { Channel, Presence } from "phoenix";
import { ChatMessage, MetasUser } from "../types";
import { getByKey } from "./channelUtils";

export const useChatMessages = (eventChannel: Channel | undefined): ChatMessage[] => {
  const presence = useRef<Presence>();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const getTitle = (data: MetasUser | undefined) =>
    data ? (data.is_moderator ? "(moderator)" : data.is_presenter ? "(presenter)" : "") : "";

  const appendToChatMessages = ({ email, message }: { email: string; message: string }) => {
    setChatMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.email == email) last.messages.push(message);
      else {
        const data = getByKey(presence.current, email);
        const newChatMessage: ChatMessage = {
          email: email,
          name: data ? data.name : "Unrecognized user",
          title: getTitle(data),
          messages: [message],
        };
        prev.push(newChatMessage);
      }

      return [...prev];
    });
  };

  const updateTitles = () => {
    setChatMessages((prev) => {
      let changed = false;
      prev.forEach((chatMessage) => {
        const data = getByKey(presence.current, chatMessage.email);
        const newTitle = getTitle(data);
        if (chatMessage.title != newTitle) {
          chatMessage.title = newTitle;
          changed = true;
        }
      });
      if (changed) return [...prev];
      else return prev;
    });
  };

  useEffect(() => {
    if (eventChannel) {
      presence.current = new Presence(eventChannel);
      eventChannel.push("sync_presence", {});
      eventChannel.on("chat_message", (data) => appendToChatMessages(data));
      presence.current.onSync(updateTitles);
    }

    return () => {
      if (eventChannel) eventChannel.off("chat_message");
      presence.current = undefined;
    };
  }, [eventChannel]);

  return chatMessages;
};
