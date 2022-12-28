import { Channel } from "phoenix";
import ProductsList from "./ProductsList";
import useCheckScreenType from "../../utils/useCheckScreenType";
import ChatBox from "./ChatBox";
import type { ChatMessage, Client, Product } from "../../types/types";
import "../../../css/event/mobilebottompanel.css";

type Props = {
  card: string;
  client: Client;
  eventChannel: Channel | undefined;
  onBarClick: () => void;
  products: Product[];
  chatMessages: ChatMessage[];
};

const selectAnimation = (card: string) => {
  if (card === "HIDDEN") return "";
  if (card === "HIDE") return "SlideOutAnimation";
  return "SlideInAnimation";
};

export const MobileBottomPanel = ({ onBarClick, card, client, products, chatMessages }: Props) => {
  const { device } = useCheckScreenType();
  const animation = selectAnimation(card);

  if (device !== "mobile") return null;
  return (
    // <div className={`MobileBottomPanel ${card ? "SlideInAnimation" : "SlideOutAnimation"}`}>
    // <div className={`MobileBottomPanel`}>
    <div className={`MobileBottomPanel ${animation}`}>
      <div className="MobileBottomPanel--TopBar">
        <div className="MobileBottomPanel--TopBar--Bar" onClick={onBarClick} />
      </div>

      <div className="MobileBottomPanel--Header"></div>

      <div className="MobileBottomPanel--Content">
        {card === "PRODUCTS" && <ProductsList products={products} />}
        {card === "CHAT" && (
          <ChatBox
            client={client}
            eventChannel={undefined}
            messages={chatMessages}
            isChatLoaded={true}
            isBannedFromChat={false}
            isRecording={false}
          />
        )}
      </div>
    </div>
  );
};