import { useEffect, useRef, useState } from "react";
import { Channel, Presence } from "phoenix";
import { ChatMessage, Metas } from "../types";

export const useChatMessages = (eventChannel: Channel | undefined): ChatMessage[] => {
  const presence = useRef<Presence>();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const getByKey = (keyEmail: string): string => {
    let result = "Unrecognized user";
    presence.current?.list((email: string, metas: Metas) => {
      const data = metas.metas[0];
      if (email == keyEmail) {
        const role = data.is_moderator ? " (moderator)" : data.is_presenter ? " (presenter)" : "";
        result = data.name + role;
      }
    });

    return result;
  };

  const appendToChatMessages = ({ email, message }: { email: string; message: string }) => {
    setChatMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.email == email) last.messages.push(message);
      else {
        const newChatMessage: ChatMessage = {
          id: last ? last.id + 1 : 0,
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
      presence.current = new Presence(eventChannel);
      eventChannel.push("sync_presence", {});
      eventChannel.on("chat_message", (data) => appendToChatMessages(data));
    }

    return () => {
      if (eventChannel) eventChannel.off("chat_message");
    };
  }, [eventChannel]);

  return chatMessages;
};
