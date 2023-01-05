import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { pushToShownMessages, popFromShownMessages } from "./chatUtils";
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

  const addMessage = useCallback((offset: number) => {
    const messagesToAdd: AwaitingMessage[] = [];
    let lastOnStack = chatMessagesStack.current.pop();
    while (lastOnStack && offset >= lastOnStack.offset) {
      messagesToAdd.push(lastOnStack);
      lastOnStack = chatMessagesStack.current.pop();
    }
    if (lastOnStack) chatMessagesStack.current.push(lastOnStack);
    setChatMessages((prev) => pushToShownMessages(prev, messagesToAdd, undefined));

    if (messagesToAdd.length === 0) {
      setChatMessages((prev) => popFromShownMessages(prev, chatMessagesStack.current, offset));
    }
  }, []);

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
