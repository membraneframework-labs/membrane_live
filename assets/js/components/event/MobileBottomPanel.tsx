import { Channel } from "phoenix";
import ChatBox from "./ChatBox";
import type { CardStatus, ChatMessage, Client } from "../../types/types";
import { Slide } from "@chakra-ui/react";
import ShareList from "./ShareList";

import "../../../css/event/mobilebottompanel.css";

type Props = {
  onBarClick: () => void;
  card: CardStatus;
  client: Client;
  eventChannel: Channel | undefined;
  chatMessages: ChatMessage[];
  isChatLoaded: boolean;
  isBannedFromChat: boolean;
  eventTitle: string;
};

export const MobileBottomPanel = ({
  onBarClick,
  card,
  client,
  chatMessages,
  eventChannel,
  isChatLoaded,
  isBannedFromChat,
  eventTitle,
}: Props) => {
  const isOpen = card !== "hidden";

  return (
    <Slide direction="bottom" in={isOpen}>
      <div className={`MobileBottomPanel ${isOpen ? "MobileBottomPanelShadow" : ""}`}>
        <div className="MobileBottomPanelTopBar" onClick={onBarClick}>
          <div className="MobileBottomPanelTopBarBar" />
        </div>

        <div className="MobileBottomPanelHeader"></div>
        <div className="MobileBottomPanelContent">
          {card === "share" && <ShareList eventTitle={eventTitle} />}
          {card === "chat" && (
            <ChatBox
              client={client}
              eventChannel={eventChannel}
              messages={chatMessages}
              isChatLoaded={isChatLoaded}
              isBannedFromChat={isBannedFromChat}
              isRecording={false}
            />
          )}
        </div>
      </div>
    </Slide>
  );
};
