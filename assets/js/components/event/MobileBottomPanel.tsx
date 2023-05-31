import { Channel } from "phoenix";
import ProductsList from "./ProductsList";
import ChatBox from "./ChatBox";
import type { CardStatus, ChatMessage, Client, Product } from "../../types/types";
import { Slide } from "@chakra-ui/react";
import ShareList from "./ShareList";
import { areProductsEnabled } from "../../utils/const";

import "../../../css/event/mobilebottompanel.css";

type Props = {
  card: CardStatus;
  client: Client;
  eventChannel: Channel | undefined;
  onBarClick: () => void;
  products: Product[];
  chatMessages: ChatMessage[];
  isChatLoaded: boolean;
  isBannedFromChat: boolean;
  eventTitle: string;
  enablePictureInPicture: () => void;
};

export const MobileBottomPanel = ({
  onBarClick,
  card,
  client,
  products,
  chatMessages,
  eventChannel,
  isChatLoaded,
  isBannedFromChat,
  eventTitle,
  enablePictureInPicture,
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
          {areProductsEnabled && card === "products" && (
            <ProductsList products={products} enablePictureInPicture={enablePictureInPicture} />
          )}
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
