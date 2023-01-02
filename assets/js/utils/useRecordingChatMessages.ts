import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { appendToMessages } from "./chatUtils";
import { AwaitingMessage, ChatMessage } from "../types/types";

export const useRecordingChatMessages = (): {recordingChatMessages: ChatMessage[], addMessage: (offset: number) => void} => {
  const [recordingChatMessages, setRecordingChatMessages] = useState<ChatMessage[]>([]);
  const chatMessagesStack = useRef<AwaitingMessage[]>([]);

  const addMessage = useCallback((offset: number) => {
    const messagesToAdd: AwaitingMessage[] = []
    let lastOnStack = chatMessagesStack.current.pop();
    while (lastOnStack && offset >= lastOnStack.offset) {
      messagesToAdd.push(lastOnStack);
      lastOnStack = chatMessagesStack.current.pop();
    }
    if (lastOnStack) chatMessagesStack.current.push(lastOnStack);
    setRecordingChatMessages(prev => appendToMessages(prev, messagesToAdd, undefined))

    if (messagesToAdd.length === 0) {
      setRecordingChatMessages(prev => {
        const messagesToRemove: AwaitingMessage[] = [];

        let message = prev.pop();
        let content = message ? message.contents.pop() : undefined;
        while (message && content && content.offset > offset) {
          messagesToRemove.push({...content, name: message.name, email: message.email});
          if (message.contents.length === 0) message = prev.pop();
          content = content = message ? message.contents.pop() : undefined;
        }
        if (content && message) message.contents.push(content);
        if (message) prev.push(message);

        chatMessagesStack.current.push(...messagesToRemove);
        return [...prev];
      })
    }
  }, [])

  useEffect(() => {
    const id = window.location.href.split("/").slice(-1)[0];
    axios
      .get(`${window.location.origin}/resources/chat/${id}`)
      .then(({ data: { chats: prevChatMessages } }: { data: { chats: AwaitingMessage[] } }) => {
        chatMessagesStack.current = prevChatMessages.reverse();
      })
      .catch((error) => console.log("Fetching previous chat messages failed: ", error));
  }, []);

  return {recordingChatMessages, addMessage}
}