import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Channel, Presence } from "phoenix";
import { getByKey } from "./channelUtils";
import { StreamStartContext } from "./StreamStartContext";
import axios from "axios";
import type { AwaitingMessage, ChatMessage, RecievedMessage, MetasUser } from "../types/types";

const getTitle = (data: MetasUser | undefined) =>
  data ? (data.is_moderator ? "(moderator)" : data.is_presenter ? "(presenter)" : "") : "";

export const useChatMessages = (
  eventChannel: Channel | undefined
): { chatMessages: ChatMessage[]; isChatLoaded: boolean } => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoaded, setIsChatLoaded] = useState(false);
  const wasPrevChatRequested = useRef(false);
  const { streamStart } = useContext(StreamStartContext);
  const presence = useRef<Presence>();
  const futureChatMessags = useRef<AwaitingMessage[]>([]);

  const appentToChatMessages = useCallback((email: string, name: string, content: string) => {
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
  }, []);

  const addMessage = useCallback(
    ({ email, name, content, offset }: RecievedMessage) => {
      if (offset == 0 || (streamStart && new Date(streamStart.getTime() + offset) <= new Date())) {
        appentToChatMessages(email, name, content);
      } else {
        futureChatMessags.current.push({
          email: email,
          name: name,
          content: content,
          offset: offset,
        });
      }
    },
    [appentToChatMessages, streamStart]
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
        .then(({ data: { chats: prevChatMessages } }: { data: { chats: RecievedMessage[] } }) => {
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
