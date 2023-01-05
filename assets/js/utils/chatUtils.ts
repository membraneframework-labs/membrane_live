import { Presence } from "phoenix";
import { getByKey } from "./channelUtils";
import type { AwaitingMessage, ChatMessage, MetasUser } from "../types/types";

export const pushToShownMessages = (
  shownMessages: ChatMessage[],
  messagesToAdd: AwaitingMessage[],
  presence: Presence | undefined
) => {
  messagesToAdd.forEach(({ name, email, content, offset }: AwaitingMessage) => {
    const last = shownMessages[shownMessages.length - 1];
    if (last && last.email == email) last.contents.push({ content, offset });
    else {
      const data = getByKey(presence, email);
      const newChatMessage: ChatMessage = {
        id: last ? last.id + 1 : 0,
        email: email,
        name: name,
        title: getTitle(data),
        moderatedNo: 0, // number of hidden messages counting from the start
        contents: [{ content, offset }],
      };
      shownMessages.push(newChatMessage);
    }
  });

  return [...shownMessages];
};

export const popFromShownMessages = (
  shownMessages: ChatMessage[],
  chatMessagesStack: AwaitingMessage[],
  offset: number
) => {
  const messagesToRemove: AwaitingMessage[] = [];

  let message = shownMessages.pop();
  let content = message ? message.contents.pop() : undefined;
  while (message && content && content.offset > offset) {
    messagesToRemove.push({ ...content, name: message.name, email: message.email });
    if (message.contents.length === 0) message = shownMessages.pop();
    content = message ? message.contents.pop() : undefined;
  }
  if (content && message) message.contents.push(content);
  if (message) shownMessages.push(message);

  chatMessagesStack.push(...messagesToRemove);
  return [...shownMessages];
};

export const getTitle = (data: MetasUser | undefined) =>
  data ? (data.is_moderator ? "(moderator)" : data.is_presenter ? "(presenter)" : "") : "";
