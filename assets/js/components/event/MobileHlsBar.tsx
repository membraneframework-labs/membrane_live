import { useToast } from "@chakra-ui/react";
import React, { useState } from "react";
import { Client, Mode } from "../../types/types";
import { UserPlus } from "react-swm-icon-pack";
import { getInfoToast } from "../../utils/toastUtils";
import useCheckScreenType from "../../utils/useCheckScreenType";
import GenericButton from "../helpers/GenericButton";
import MenuPopover from "../helpers/MenuPopover";
import { storageGetPresentingRequest, storageSetPresentingRequest } from "../../utils/storageUtils";

type MobileHlsBarProps = {
  client: Client;
  eventTitle: string;
  amIPresenter: boolean;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  switchAsking: (isAsking: boolean) => void;
};

const MobileHlsBar = ({ client, eventTitle, amIPresenter, mode, setMode, switchAsking }: MobileHlsBarProps) => {
  const toast = useToast();
  const screenType = useCheckScreenType();

  const [isAskingForPresenter, setIsAskingForPresenter] = useState<boolean>(storageGetPresentingRequest());

  const MobilePresenterButton = () => {
    const className = "MobileControlButton";
    const two_seconds = 2_000;
    const toastText = (isAsking: boolean) => {
      return isAsking ? "Asking for presenter..." : "Stopped asking.";
    };

    return amIPresenter ? (
      <MenuPopover mode={mode} setMode={setMode} className={className} />
    ) : (
      <GenericButton
        icon={<UserPlus className="PanelButton" />}
        onClick={() => {
          switchAsking(isAskingForPresenter);

          const newAskingState = !isAskingForPresenter;
          setIsAskingForPresenter(newAskingState);
          storageSetPresentingRequest(newAskingState);
          getInfoToast(toast, toastText(newAskingState), two_seconds);
        }}
        className={className}
      />
    );
  };

  return (
    <div className="MobileHlsBar">
      {screenType.orientation === "landscape" && <div className="Title"> {eventTitle} </div>}
      {client.isAuthenticated && <MobilePresenterButton />}
    </div>
  );
};

export default MobileHlsBar;
