import { Channel } from "phoenix";
import ProductsList from "./ProductsList";
import ChatBox from "./ChatBox";
import { ScreenTypeContext } from "../../utils/ScreenTypeContext";
import { useContext } from "react";
import type { ChatMessage, Client, Product } from "../../types/types";
import "../../../css/event/mobilebottompanel.css";

type Props = {
  card: string;
  client: Client;
  eventChannel: Channel | undefined;
  onBarClick: () => void;
  products: Product[];
  chatMessages: ChatMessage[];
  isChatLoaded: boolean;
  isBannedFromChat: boolean;
};

const selectAnimation = (card: string) => {
  if (card === "hidden") return "";
  if (card === "hide") return "SlideOutAnimation";
  return "SlideInAnimation";
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
}: Props) => {
  const { device } = useContext(ScreenTypeContext);
  const animation = selectAnimation(card);

  if (device !== "mobile") return null;
  return (
    <div className={`MobileBottomPanel ${animation}`}>
      <div className="MobileBottomPanelTopBar" onClick={onBarClick}>
        <div className="MobileBottomPanelTopBarBar" />
      </div>

      <div className="MobileBottomPanelHeader"></div>

      <div className="MobileBottomPanelContent">
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
  );
};
