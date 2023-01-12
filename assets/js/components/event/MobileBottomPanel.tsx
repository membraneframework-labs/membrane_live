import { Channel } from "phoenix";
import ProductsList from "./ProductsList";
import ChatBox from "./ChatBox";
import { ScreenTypeContext } from "../../utils/ScreenTypeContext";
import { useContext } from "react";
import type { Card, ChatMessage, Client, Product } from "../../types/types";
import "../../../css/event/mobilebottompanel.css";
import { Slide } from "@chakra-ui/react";
import ShareList from "./ShareList";

type Props = {
  card: Card;
  client: Client;
  eventChannel: Channel | undefined;
  onBarClick: () => void;
  products: Product[];
  chatMessages: ChatMessage[];
  isChatLoaded: boolean;
  isBannedFromChat: boolean;
  eventTitle: string;
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
}: Props) => {
  const { device } = useContext(ScreenTypeContext);
  const isOpen = card !== "hidden";

  if (device !== "mobile") return null;
  return (
    <Slide direction="bottom" in={isOpen}>
      <div className={`MobileBottomPanel ${isOpen ? "MobileBottomPanelShadow" : ""}`}>
        <div className="MobileBottomPanelTopBar" onClick={onBarClick}>
          <div className="MobileBottomPanelTopBarBar" />
        </div>

        <div className="MobileBottomPanelHeader"></div>

        <div className="MobileBottomPanelContent">
          {card === "share" && <ShareList eventTitle={eventTitle} />}
          {card === "products" && <ProductsList products={products} />}
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
