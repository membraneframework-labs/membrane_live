import { useContext, useEffect, useRef, useState } from "react";
import { Channel, Presence } from "phoenix";
import { AwaitingMessage, ChatMessage, RecievedMessage, MetasUser } from "../types/types";
import { getByKey } from "./channelUtils";
import { StreamStartContext } from "./StreamStartContext";

export const useChatMessages = (
  eventChannel: Channel | undefined
): { chatMessages: ChatMessage[]; isChatLoaded: boolean } => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoaded, setIsChatLoaded] = useState(false);
  const wasPrevChatRequested = useRef(false);
  const { streamStart } = useContext(StreamStartContext);
  const presence = useRef<Presence>();
  const futureChatMessags = useRef<AwaitingMessage[]>([]);

  const getTitle = (data: MetasUser | undefined) =>
    data ? (data.is_moderator ? "(moderator)" : data.is_presenter ? "(presenter)" : "") : "";

  const appendToChatMessages = ({ email, name, content, offset }: RecievedMessage, startTime: Date | null) => {
    if (offset == 0 || (startTime && new Date(startTime.getTime() + offset) <= new Date())) {
      setChatMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.email == email) last.contents.push(content);
        else {
          const data = getByKey(presence.current, email);
          const newChatMessage: ChatMessage = {
            id: last ? last.id + 1 : 0,
            email: email,
            name: name,
            title: getTitle(data),
            moderatedNo: 0, // number of hiddend messages counting from the start
            contents: [content],
          };
          prev.push(newChatMessage);
        }

        return [...prev];
      });
    } else {
      futureChatMessags.current.push({
        email: email,
        name: name,
        content: content,
        offset: offset,
      });
    }
  };

  const updateMessages = () => {
    setChatMessages((prev) => {
      let changed = false;
      prev.forEach((chatMessage) => {
        const data = getByKey(presence.current, chatMessage.email);
        if (!data) return;

        const moderatedNo = data.is_banned_from_chat ? chatMessage.contents.length : chatMessage.moderatedNo;
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

    futureChatMessags.current.filter((chatMessage) => {
      const data = getByKey(presence.current, chatMessage.email);
      if (!data) return false;
      return !data.is_banned_from_chat;
    });
  };

  useEffect(() => {
    if (eventChannel) {
      presence.current = new Presence(eventChannel);
      eventChannel.push("sync_presence", {});
      if (!wasPrevChatRequested.current) {
        wasPrevChatRequested.current = true;
        eventChannel.push("sync_chat_messages", {}).receive("ok", (prevChatMessages: RecievedMessage[]) => {
          prevChatMessages.forEach((message) => appendToChatMessages(message, streamStart));
          setIsChatLoaded(true);
        });
      }
      eventChannel.on("chat_message", (data) => {
        appendToChatMessages(data, streamStart);
      });
      presence.current.onSync(updateMessages);
    }

    const interval = setInterval(() => {
      if (streamStart) {
        futureChatMessags.current = futureChatMessags.current.filter((message) => {
          if (new Date(streamStart.getTime() + message.offset) <= new Date()) {
            appendToChatMessages(
              { email: message.email, name: message.name, content: message.content, offset: 0 },
              streamStart
            );
            return false;
          }
          return true;
        });
      }
    }, 1000);

    return () => {
      if (eventChannel) eventChannel.off("chat_message");
      clearInterval(interval);
      presence.current = undefined;
    };
  }, [eventChannel, streamStart]);

  return { chatMessages, isChatLoaded };
};
