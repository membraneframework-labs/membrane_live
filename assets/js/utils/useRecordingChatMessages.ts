import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { appendToMessages } from "./chatUtils";
import type { AwaitingMessage, ChatMessage } from "../types/types";

export const useRecordingChatMessages = (): {
  chatMessages: ChatMessage[];
  isChatLoaded: boolean;
  addMessage: (offset: number) => void;
} => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoaded, setIsChatLoaded] = useState(false);
  const chatMessagesStack = useRef<AwaitingMessage[]>([]);
  const requestedPreviousMessages = useRef(false);

  const removeFromMessages = useCallback((prev: ChatMessage[], offset: number) => {
    const messagesToRemove: AwaitingMessage[] = [];

    let message = prev.pop();
    let content = message ? message.contents.pop() : undefined;
    while (message && content && content.offset > offset) {
      messagesToRemove.push({ ...content, name: message.name, email: message.email });
      if (message.contents.length === 0) message = prev.pop();
      content = content = message ? message.contents.pop() : undefined;
    }
    if (content && message) message.contents.push(content);
    if (message) prev.push(message);

    chatMessagesStack.current.push(...messagesToRemove);
    return [...prev];
  }, []);

  const addMessage = useCallback(
    (offset: number) => {
      const messagesToAdd: AwaitingMessage[] = [];
      let lastOnStack = chatMessagesStack.current.pop();
      while (lastOnStack && offset >= lastOnStack.offset) {
        messagesToAdd.push(lastOnStack);
        lastOnStack = chatMessagesStack.current.pop();
      }
      if (lastOnStack) chatMessagesStack.current.push(lastOnStack);
      setChatMessages((prev) => appendToMessages(prev, messagesToAdd, undefined));

      if (messagesToAdd.length === 0) {
        setChatMessages((prev) => removeFromMessages(prev, offset));
      }
    },
    [removeFromMessages]
  );

  useEffect(() => {
    if (!requestedPreviousMessages.current) {
      requestedPreviousMessages.current = true;
      const id = window.location.href.split("/").slice(-1)[0];
      axios
        .get(`${window.location.origin}/resources/chat/${id}`)
        .then(({ data: { chats: prevChatMessages } }: { data: { chats: AwaitingMessage[] } }) => {
          chatMessagesStack.current = prevChatMessages.reverse();
          setIsChatLoaded(true);
        })
        .catch((error) => console.error("Fetching previous chat messages failed: ", error));
    }
  }, []);

  return { chatMessages, isChatLoaded, addMessage };
};
