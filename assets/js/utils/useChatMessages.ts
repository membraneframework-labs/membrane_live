import { useCallback, useEffect, useRef, useState } from "react";
import { Channel, Presence } from "phoenix";
import { getByKey } from "./channelUtils";
import { useStartStream } from "./StreamStartContext";
import axios from "axios";
import { pushToShownMessages, getTitle } from "./chatUtils";
import type { AwaitingMessage, ChatMessage } from "../types/types";

const MESSAGE_INTERVAL = 1000;

export const useChatMessages = (
  eventChannel: Channel | undefined
): { chatMessages: ChatMessage[]; isChatLoaded: boolean } => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoaded, setIsChatLoaded] = useState(false);
  const { streamStart } = useStartStream();
  const presence = useRef<Presence>();
  const futureChatMessages = useRef<AwaitingMessage[]>([]);
  const requestedPreviousMessages = useRef(false);

  const addMessage = useCallback(
    (message: AwaitingMessage) => {
      if (message.offset == 0 || (streamStart && new Date(streamStart.getTime() + message.offset) <= new Date())) {
        setChatMessages((prev) => pushToShownMessages(prev, [message], presence.current));
      } else {
        futureChatMessages.current.push(message);
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

    futureChatMessages.current.filter((chatMessage) => {
      const data = getByKey(presence.current, chatMessage.email);
      return data && !data.is_banned_from_chat;
    });
  }, []);

  useEffect(() => {
    if (!requestedPreviousMessages.current) {
      requestedPreviousMessages.current = true;
      const id = window.location.href.split("/").slice(-1)[0];
      axios
        .get(`${window.location.origin}/resources/chat/${id}`)
        .then(({ data: { chats: prevChatMessages } }: { data: { chats: AwaitingMessage[] } }) => {
          prevChatMessages.forEach((message) => addMessage(message));
          setIsChatLoaded(true);
        })
        .catch((error) => console.error("Fetching previous chat messages failed: ", error));
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
        futureChatMessages.current = futureChatMessages.current.filter((message) => {
          if (new Date(streamStart.getTime() + message.offset) <= curDate) {
            addMessage({ email: message.email, name: message.name, content: message.content, offset: 0 });
            return false;
          }
          return true;
        });
      }
    }, MESSAGE_INTERVAL);

    return () => {
      if (eventChannel) eventChannel.off("chat_message");
      clearInterval(interval);
      presence.current = undefined;
    };
  }, [addMessage, eventChannel, streamStart, updateMessages]);

  return { chatMessages, isChatLoaded };
};
