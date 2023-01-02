import { Presence } from "phoenix";
import { getByKey } from "./channelUtils";
import type { AwaitingMessage, ChatMessage, MetasUser } from "../types/types";

export const appendToMessages = (prev: ChatMessage[], messages: AwaitingMessage[], presence: Presence | undefined) => {
  messages.forEach(({name, email, content, offset}: AwaitingMessage) => {
    const last = prev[prev.length - 1];
    if (last && last.email == email) last.contents.push({content, offset});
    else {
      const data = getByKey(presence, email);
      const newChatMessage: ChatMessage = {
        id: last ? last.id + 1 : 0,
        email: email,
        name: name,
        title: getTitle(data),
        moderatedNo: 0, // number of hidden messages counting from the start
        contents: [{content, offset}],
      };
      prev.push(newChatMessage);
    }
  })

  return [...prev];
}

export const getTitle = (data: MetasUser | undefined) =>
  data ? (data.is_moderator ? "(moderator)" : data.is_presenter ? "(presenter)" : "") : "";