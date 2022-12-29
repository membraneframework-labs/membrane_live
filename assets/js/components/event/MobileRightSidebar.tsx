import type { Card } from "../../types/types";
import "../../../css/event/mobilesidebars.css";

type Button = { id: string; icon: string; text: string; onClick?: () => void };

type Props = {
  setCard: (name: Card) => void;
};

export const MobileRightSidebar = ({ setCard }: Props) => {
  const buttons: Button[] = [
    {
      id: "share",
      icon: "/icons/share-nodes-regular.svg",
      text: "SHARE",
      onClick: () => setCard("share"),
    },
    {
      id: "chat",
      icon: "/icons/comments-regular.svg",
      text: "CHAT",
      onClick: () => setCard("chat"),
    },
    {
      id: "products",
      icon: "/icons/gifts-regular.svg",
      text: "PRODUCTS",
      onClick: () => setCard("products"),
    },
  ];

  return (
    <div className="MobileRightSidebar">
      {buttons.map(({ id, icon, text, onClick }) => (
        <div key={id} className="MobileRightSidebarButton" onClick={onClick}>
          <img className={`SocialMediaButtonLayerIcon`} src={icon} alt={" button"} />
          <span>{text}</span>
        </div>
      ))}
    </div>
  );
};
