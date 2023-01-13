import { ScreenTypeContext } from "../../utils/ScreenTypeContext";
import { useCallback, useContext } from "react";
import { useToast } from "@chakra-ui/react";
import { getInfoToast } from "../../utils/toastUtils";
import type { CardStatus } from "../../types/types";
import "../../../css/event/mobilesidebars.css";

type Button = { id: string; icon: string; text: string; onClick?: () => void };

type Props = {
  setCard: (name: CardStatus) => void;
};

export const MobileRightSidebar = ({ setCard }: Props) => {
  const { orientation } = useContext(ScreenTypeContext);
  const toast = useToast();

  const onButtonClick = useCallback(
    (card: CardStatus) => {
      if (orientation === "portrait") {
        setCard(card);
      } else {
        getInfoToast(toast, `Change your screen orientation to see ${card} panel`);
      }
    },
    [orientation, setCard, toast]
  );

  const buttons: Button[] = [
    {
      id: "share",
      icon: "/icons/share-nodes-regular.svg",
      text: "SHARE",
      onClick: () => onButtonClick("share"),
    },
    {
      id: "chat",
      icon: "/icons/comments-regular.svg",
      text: "CHAT",
      onClick: () => onButtonClick("chat"),
    },
    {
      id: "products",
      icon: "/icons/gifts-regular.svg",
      text: "PRODUCTS",
      onClick: () => onButtonClick("products"),
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
