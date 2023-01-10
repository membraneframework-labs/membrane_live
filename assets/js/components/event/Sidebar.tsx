import React, { useState } from "react";
import { Menu, MenuButton, MenuList, MenuItem, Tooltip } from "@chakra-ui/react";
import { getPrivateChannelLink, switchAskingForBeingPresenter } from "../../utils/channelUtils";
import { MenuVertical, User1, Crown1, Star1, QuestionCircle } from "react-swm-icon-pack";
import { Channel } from "phoenix";
import ChatBox from "./ChatBox";
import type { Participant, Client, Product, ChatMessage } from "../../types/types";
import "../../../css/event/participants.css";
import { sessionStorageSetPresentingRequest, sessionStorageUnsetIsPresenter } from "../../utils/storageUtils";
import { useAllProductsQuery, useIsProductMutating } from "../../utils/useWebinarProducts";
import { groupBy } from "../../utils/collectionUtils";
import ProductComponent, { ProductWithStatus } from "./ProductComponent";
import ProductsList from "./ProductsList";

type ModeratorMenuProps = {
  moderatorClient: Client;
  participant: Participant;
  eventChannel: Channel | undefined;
};

const ModeratorMenu = ({ moderatorClient, participant, eventChannel }: ModeratorMenuProps) => {
  const link = getPrivateChannelLink();
  const presenterText = {
    setBasic: "Set as a presenter",
    setMain: "Set as a main presenter",
    unset: "Set as a normal participant",
  };
  const banFromChatText = {
    ban: "Ban from the chat",
    unban: "Unban from the chat",
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const clickedValue = (e.target as HTMLTextAreaElement).value;
    switch (clickedValue) {
      case presenterText.setBasic:
      case presenterText.setMain:
        eventChannel?.push("presenter_prop", {
          moderatorTopic: link + moderatorClient.email,
          presenterTopic: link + participant.email,
          mainPresenter: clickedValue == presenterText.setMain,
        });
        break;
      case presenterText.unset:
        eventChannel?.push("presenter_remove", { presenterTopic: link + participant.email });
        sessionStorageUnsetIsPresenter();
        break;
      case banFromChatText.ban:
        eventChannel?.push("ban_from_chat", { email: participant.email });
        break;
      case banFromChatText.unban:
        eventChannel?.push("unban_from_chat", { email: participant.email });
        break;
    }
  };

  return (
    <Menu>
      <MenuButton ml={"auto"} area-label="Options">
        <MenuVertical className="OptionButton" />
      </MenuButton>
      <MenuList>
        {participant.isAuth && participant.isPresenter ? (
          <MenuItem onClick={handleClick} value={presenterText.unset} className="MenuOptionText">
            {presenterText.unset}
          </MenuItem>
        ) : (
          <>
            <MenuItem onClick={handleClick} value={presenterText.setBasic} className="MenuOptionText">
              {presenterText.setBasic}
            </MenuItem>
            <MenuItem onClick={handleClick} value={presenterText.setMain} className="MenuOptionText">
              {presenterText.setMain}
            </MenuItem>{" "}
          </>
        )}
        {!participant.isModerator && (
          <MenuItem
            onClick={handleClick}
            value={participant.isBannedFromChat ? banFromChatText.unban : banFromChatText.ban}
            className="MenuOptionText"
          >
            {participant.isBannedFromChat ? banFromChatText.unban : banFromChatText.ban}
          </MenuItem>
        )}
      </MenuList>
    </Menu>
  );
};

type ClientParticipantMenuProps = {
  participant: Participant;
  eventChannel: Channel | undefined;
};

const ClientParticipantMenu = ({ participant, eventChannel }: ClientParticipantMenuProps) => {
  const askText = "Ask to become a presenter";

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const shouldAskForBeingPresenter = (e.target as HTMLTextAreaElement).value === askText;

    switchAskingForBeingPresenter(eventChannel, participant.email, !shouldAskForBeingPresenter);
    sessionStorageSetPresentingRequest(!shouldAskForBeingPresenter);
  };

  const text = participant.isRequestPresenting ? "Stop asking to become a presenter" : askText;

  return (
    <Menu>
      <MenuButton ml={"auto"} area-label="Options">
        <MenuVertical className="OptionButton" />
      </MenuButton>
      <MenuList>
        <MenuItem onClick={handleClick} value={text} className="MenuOptionText">
          {text}
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

type ParticipantProps = {
  client: Client;
  participant: Participant;
  eventChannel: Channel | undefined;
};

const Participant = ({ client, participant, eventChannel }: ParticipantProps) => {
  const icon = participant.isModerator ? (
    <Crown1 className="ParticipantIcon" />
  ) : participant.isPresenter ? (
    <Star1 className="ParticipantIcon" />
  ) : (
    <User1 className="ParticipantIcon" />
  );
  const role = participant.isModerator ? "Moderator" : participant.isPresenter ? "Presenter" : "Participant";

  const isMyself: boolean = client.email == participant.email;
  const isMyselfParticipant = client.isAuthenticated && role == "Participant" && isMyself;

  return (
    <div className="Participant">
      <Tooltip label={`${role}${isMyself ? " (You)" : ""}`} className="InfoTooltip">
        {icon}
      </Tooltip>
      <p className="ParticipantText">{participant.name}</p>
      {participant.isRequestPresenting && (client.isModerator || isMyself) && (
        <Tooltip label={"This user is asking to become a presenter"} className="InfoTooltip">
          <QuestionCircle className="ParticipantIcon" />
        </Tooltip>
      )}
      {client.isModerator && (
        <ModeratorMenu moderatorClient={client} eventChannel={eventChannel} participant={participant} />
      )}
      {isMyselfParticipant && <ClientParticipantMenu eventChannel={eventChannel} participant={participant} />}
    </div>
  );
};

type SidebarMode = "participants" | "products" | "chat" | "select-products";

type ParticipantsListProps = {
  client: Client;
  eventChannel: Channel | undefined;
  isChatLoaded: boolean;
  chatMessages: ChatMessage[];
  addProduct: (id: string) => void;
  removeProduct: (id: string) => void;
  products: Product[];
  participants: Participant[];
  isBannedFromChat: boolean;
};

export const addStatus = (all: Product[], productsMap: Record<string, Product[]>): ProductWithStatus[] =>
  all.map((product) => ({
    ...product,
    status: productsMap[product.id] ? "SELECTED" : "NOT-SELECTED",
  }));

const Sidebar = ({
  client,
  eventChannel,
  isChatLoaded,
  chatMessages,
  products,
  addProduct,
  removeProduct,
  participants,
  isBannedFromChat,
}: ParticipantsListProps) => {
  const [listMode, setListMode] = useState<SidebarMode>("chat");
  const isMutating = useIsProductMutating();

  const productsMap: Record<string, Product[]> = groupBy(products, (product) => product.id);

  const allProductsQuery = useAllProductsQuery(client.isModerator);
  const allProducts: Product[] = allProductsQuery?.data?.data?.products || [];
  const productsWithStatus: ProductWithStatus[] = addStatus(allProducts, productsMap);

  return (
    <div className="Participants">
      <div className="ParticipantsButtons">
        <button
          className={`ParticipantsButton ${listMode === "chat" && "Clicked"}`}
          onClick={() => setListMode("chat")}
          name="chat"
        >
          Group Chat
        </button>
        <button
          className={`ParticipantsButton ${listMode == "participants" && "Clicked"}`}
          name="list"
          onClick={() => setListMode("participants")}
        >
          Participants
        </button>
        <button
          className={`ParticipantsButton ${listMode === "products" && "Clicked"}`}
          name="list"
          onClick={() => setListMode("products")}
        >
          Products
        </button>
        {client.isModerator && (
          <button
            className={`ParticipantsButton ${listMode === "select-products" && "Clicked"}`}
            name="list"
            onClick={() => setListMode("select-products")}
          >
            Select products
          </button>
        )}
      </div>
      {listMode === "participants" && (
        <div className="ParticipantsList">
          {participants.map((participant) => (
            <Participant
              client={client}
              key={participant.email}
              participant={participant}
              eventChannel={eventChannel}
            />
          ))}
        </div>
      )}
      {listMode === "chat" && (
        <ChatBox
          client={client}
          eventChannel={eventChannel}
          messages={chatMessages}
          isChatLoaded={isChatLoaded}
          isBannedFromChat={isBannedFromChat}
          isRecording={false}
        />
      )}
      {listMode === "products" && <ProductsList products={products} />}
      {listMode === "select-products" && client.isModerator && (
        <div className="ProductList">
          {productsWithStatus.map((product) => (
            <ProductComponent
              key={product.id}
              product={product}
              add={addProduct}
              remove={removeProduct}
              isLoading={isMutating}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
