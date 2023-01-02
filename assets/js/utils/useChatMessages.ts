import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Channel, Presence } from "phoenix";
import { getByKey } from "./channelUtils";
import { StreamStartContext } from "./StreamStartContext";
import axios from "axios";
import type { AwaitingMessage, ChatMessage } from "../types/types";
import { appendToMessages, getTitle } from "./chatUtils";

export const useChatMessages = (
  eventChannel: Channel | undefined
): { chatMessages: ChatMessage[]; isChatLoaded: boolean } => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoaded, setIsChatLoaded] = useState(false);
  const wasPrevChatRequested = useRef(false);
  const { streamStart } = useContext(StreamStartContext);
  const presence = useRef<Presence>();
  const futureChatMessags = useRef<AwaitingMessage[]>([]);

  const addMessage = useCallback(
    (message: AwaitingMessage) => {
      if (message.offset == 0 || (streamStart && new Date(streamStart.getTime() + message.offset) <= new Date())) {
        setChatMessages((prev) => appendToMessages(prev, [message], presence.current));
      } else {
        futureChatMessags.current.push(message);
      }
    },
    [streamStart]
  );

  const updateMessages = useCallback(() => {
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
      return data && !data.is_banned_from_chat;
    });
  }, []);

  useEffect(() => {
    if (!wasPrevChatRequested.current) {
      wasPrevChatRequested.current = true;
      const id = window.location.href.split("/").slice(-1)[0];
      axios
        .get(`${window.location.origin}/resources/chat/${id}`)
        .then(({ data: { chats: prevChatMessages } }: { data: { chats: AwaitingMessage[] } }) => {
          prevChatMessages.forEach((message) => addMessage(message));
          setIsChatLoaded(true);
        })
        .catch((error) => console.log("Fetching previous chat messages failed: ", error));
    }
  }, [addMessage]);

  useEffect(() => {
    if (eventChannel) {
      presence.current = new Presence(eventChannel);
      eventChannel.push("sync_presence", {});
      eventChannel.on("chat_message", (data) => {
        addMessage(data);
      });
      presence.current.onSync(updateMessages);
    }

    const interval = setInterval(() => {
      if (streamStart) {
        const curDate = new Date();
        futureChatMessags.current = futureChatMessags.current.filter((message) => {
          if (new Date(streamStart.getTime() + message.offset) <= curDate) {
            addMessage({ email: message.email, name: message.name, content: message.content, offset: 0 });
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
  }, [addMessage, eventChannel, streamStart, updateMessages]);

  return { chatMessages, isChatLoaded };
};
