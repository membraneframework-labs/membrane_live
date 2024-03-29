import React, { useContext } from "react";
import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  Modal,
  ModalBody,
} from "@chakra-ui/react";
import {
  Cam,
  CamDisabled,
  Microphone,
  MicrophoneDisabled,
  PhoneDown,
  ScreenShare,
  ScreenDisabled,
  Icon,
} from "react-swm-icon-pack";
import { Channel } from "phoenix";
import GenericButton from "../helpers/GenericButton";
import type { Client, ClientStatus } from "../../types/types";
import "../../../css/event/controlpanel.css";
import MenuPopover from "../helpers/MenuPopover";
import { ScreenTypeContext } from "../../utils/ScreenTypeContext";
import { ModeButton } from "./ModePanel";
import { sessionStorageUnsetIsPresenter } from "../../utils/storageUtils";
import { useDisconnect, useCamera, useMicrophone, useScreenshare, TrackMetadata } from "./PresenterArea";
import type { UseCameraResult, UseMicrophoneResult } from "@jellyfish-dev/react-client-sdk";

type DropdownListProps = {
  sources: MediaDeviceInfo[];
  currentSourceName?: string;
  itemSelectFunc: (id: string) => void;
};

const DropdownList = ({ sources, currentSourceName, itemSelectFunc }: DropdownListProps) => {
  const getDeviceLabel = (source: MediaDeviceInfo, currentSourceName: string | undefined) => {
    return source.label === currentSourceName ? (
      <b className="SettingsMenuItem">{source.label}</b>
    ) : (
      <p className="SettingsMenuItem">{source.label}</p>
    );
  };

  const menuItems = sources.map((source) => (
    <MenuItem key={source.deviceId} onClick={() => itemSelectFunc(source.deviceId)}>
      {getDeviceLabel(source, currentSourceName)}
    </MenuItem>
  ));
  return <MenuList>{menuItems}</MenuList>;
};

type DropdownButtonProps = {
  sources: MediaDeviceInfo[];
  currentSourceName?: string;
  mainText: string;
  onSelectSource: (id: string) => void;
};

const DropdownButton = ({ sources, currentSourceName, mainText, onSelectSource }: DropdownButtonProps) => {
  return (
    <Menu>
      <MenuButton as={Button} className="MenuButton">
        <p className="MenuButtonText">{mainText}</p>
      </MenuButton>
      <DropdownList sources={sources} currentSourceName={currentSourceName} itemSelectFunc={onSelectSource} />
    </Menu>
  );
};

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  elements: JSX.Element[];
};

const SettingsModal = ({ isOpen, onClose, elements }: SettingsModalProps) => {
  return (
    <div className="SettingsModal">
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <p className="SettingsModalHeader">Settings</p>
          </ModalHeader>
          <ModalCloseButton className="SettingsModalClose" />

          <ModalBody className="SettingsModalBody">{elements}</ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

const DeviceButton = ({
  key,
  device,
}: {
  key: string;
  device: UseMicrophoneResult<TrackMetadata> | UseCameraResult<TrackMetadata>;
}) => (
  <DropdownButton
    key={key}
    mainText={`${device.deviceInfo?.kind} source`}
    currentSourceName={device.deviceInfo?.label}
    sources={device.devices || []}
    onSelectSource={(deviceId) => {
      device.start(deviceId);
    }}
  />
);

const MuteButton = ({
  device,
  IconEnabled,
  IconDisabled,
}: {
  device: UseMicrophoneResult<TrackMetadata> | UseCameraResult<TrackMetadata>;
  IconEnabled: Icon;
  IconDisabled: Icon;
}) => (
  <GenericButton
    icon={
      device.enabled ? (
        <IconEnabled className="PanelButton Enabled" />
      ) : (
        <IconDisabled className="PanelButton Disabled" />
      )
    }
    onClick={() => {
      device.setEnable(!device.enabled);
    }}
  />
);

type ControlPanelProps = {
  client: Client;
  eventChannel: Channel | undefined;
  setClientStatus: React.Dispatch<React.SetStateAction<ClientStatus>>;
};

const ControlPanel = ({ client, eventChannel, setClientStatus }: ControlPanelProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const screenType = useContext(ScreenTypeContext);

  const disconnect = useDisconnect();
  const camera = useCamera();
  const microphone = useMicrophone();
  const screenShare = useScreenshare();

  const stopBeingPresenter = () => {
    setClientStatus("disconnected");
    eventChannel?.push("presenter_remove", { email: client.email });
    disconnect();
    sessionStorageUnsetIsPresenter();
  };

  return (
    <>
      <div className="ControlPanel">
        <div className="CenterIcons">
          <MuteButton device={camera} IconEnabled={Cam} IconDisabled={CamDisabled} />
          <MuteButton device={microphone} IconEnabled={Microphone} IconDisabled={MicrophoneDisabled} />
          <GenericButton icon={<PhoneDown className="DisconnectButton" />} onClick={stopBeingPresenter} />
          <GenericButton
            icon={
              !screenShare.stream && screenType.device !== "mobile" ? (
                <ScreenShare className="PanelButton" />
              ) : (
                <ScreenDisabled className="PanelButton" />
              )
            }
            onClick={() => {
              screenShare.stream ? screenShare.stop() : screenShare.start();
            }}
            disabled={screenType.device === "mobile"}
          />
          <MenuPopover>
            <ModeButton name="Options" onClick={onOpen} />
            <SettingsModal
              isOpen={isOpen}
              onClose={onClose}
              elements={[<DeviceButton key={"1"} device={microphone} />, <DeviceButton key={"2"} device={camera} />]}
            />
          </MenuPopover>
        </div>
      </div>
    </>
  );
};

export default ControlPanel;
