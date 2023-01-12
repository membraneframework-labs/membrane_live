import { useToast } from "@chakra-ui/react";
import { Copy } from "react-swm-icon-pack";
import { getInfoToast } from "../../utils/toastUtils";
import GenericButton from "../helpers/GenericButton";
import FacebookIcon from "../helpers/svg/FacebookIcon";
import MessengerIcon from "../helpers/svg/MessengerIcon";
import TwitterIcon from "../helpers/svg/TwitterIcon";

import "../../../css/event/shareButton.css";

type ListElementType = {
  name: string;
  icon: JSX.Element;
  logoClass?: string;
  buttonHandler?: () => void;
};

const ListElement = ({ name, icon, logoClass, buttonHandler }: ListElementType) => (
  <div className="ListShareElement">
    <GenericButton icon={icon} onClick={buttonHandler} className={`ShareElementLogo ${logoClass}`} />
    <button className="ShareElementText" onClick={buttonHandler}>
      {name}
    </button>
  </div>
);

const CopyLinkListElement = () => {
  const toast = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    getInfoToast(toast, "Link copied!");
  };

  return <ListElement name="Copy Link" icon={<Copy />} buttonHandler={handleCopy} />;
};

//TODO Make LinkElement and change the 3 components below

type LinkElementType = {
  url: string;
  name: string;
  icon: JSX.Element;
  logoClass?: string;
};

const LinkElement = ({ url, name, icon, logoClass }: LinkElementType) => (
  <a href={url} target="_blank">
    <ListElement name={name} icon={icon} logoClass={logoClass} />
  </a>
);

const FacebookListElement = () => (
  <LinkElement name="Facebook" icon={<FacebookIcon />} url="https://www.facebook.com" logoClass="FacebookLogo" />
);

const TwitterListElement = () => (
  <LinkElement name="Twitter" icon={<TwitterIcon />} url="https://www.twitter.com" logoClass="TwitterLogo" />
);

const MessengerListElement = () => (
  <LinkElement name="Messenger" icon={<MessengerIcon />} url="https://www.messenger.com" logoClass="MessengerLogo" />
);

type ShareListProps = {
  eventTitle: string;
};

export const ShareTitle = ({ eventTitle }: ShareListProps) => (
  <div className="ShareTitleWrapper">
    <p className="ShareTitle">Share ({eventTitle})</p>
  </div>
);

export const ShareListElements = () => (
  <div className="ShareListElementsWrapper">
    <CopyLinkListElement />
    <FacebookListElement />
    <TwitterListElement />
    <MessengerListElement />
  </div>
);

const ShareList = ({ eventTitle }: ShareListProps) => {
  return (
    <div>
      <ShareTitle eventTitle={eventTitle} />
      <ShareListElements />
    </div>
  );
};

export default ShareList;
