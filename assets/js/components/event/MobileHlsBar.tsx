import { useToast } from "@chakra-ui/react";
import React, { useContext, useState } from "react";
import { UserPlus } from "react-swm-icon-pack";
import { getInfoToast } from "../../utils/toastUtils";
import GenericButton from "../helpers/GenericButton";
import MenuPopover from "../helpers/MenuPopover";
import { storageGetPresentingRequest, sessionStorageSetPresentingRequest } from "../../utils/storageUtils";
import { ScreenTypeContext } from "../../utils/ScreenTypeContext";
import type { Client, Mode } from "../../types/types";

type MobileHlsBarProps = {
  client: Client;
  eventTitle: string;
  amIPresenter: boolean;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  switchAsking: (isAsking: boolean) => void;
};

const MobileHlsBar = (props: MobileHlsBarProps) => {
  const { client, eventTitle, amIPresenter, setMode, switchAsking } = props;
  const toast = useToast();
  const screenType = useContext(ScreenTypeContext);

  const [isAskingForPresenter, setIsAskingForPresenter] = useState<boolean>(storageGetPresentingRequest());

  const MobilePresenterButton = () => {
    const className = "MobileControlButton";
    const two_seconds = 2_000;
    const toastText = (isAsking: boolean) => {
      return isAsking ? "Asking for presenter..." : "Stopped asking.";
    };

    return amIPresenter ? (
      <MenuPopover setMode={setMode} className={className} />
    ) : (
      <GenericButton
        icon={<UserPlus className="PanelButton" />}
        onClick={() => {
          switchAsking(isAskingForPresenter);

          const newAskingState = !isAskingForPresenter;
          setIsAskingForPresenter(newAskingState);
          sessionStorageSetPresentingRequest(newAskingState);
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
