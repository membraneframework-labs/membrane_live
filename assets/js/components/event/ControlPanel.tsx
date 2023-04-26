import React, { useState, useEffect, useCallback, useContext } from "react";
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
import { MembraneWebRTC } from "@jellyfish-dev/membrane-webrtc-js";
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
import {
  shareScreen,
  changeSource,
  changeTrackIsEnabled,
  getSources,
  Sources,
  checkTrackIsEnabled,
  getCurrentDeviceName,
  askForPermissions,
  stopShareScreen,
} from "../../utils/rtcUtils";
import { Channel } from "phoenix";
import GenericButton from "../helpers/GenericButton";
import type { Client, SourceType, PeersState, ClientStatus } from "../../types/types";
import "../../../css/event/controlpanel.css";
import MenuPopover from "../helpers/MenuPopover";
import { ScreenTypeContext } from "../../utils/ScreenTypeContext";
import { ModeButton } from "./ModePanel";
import { sessionStorageUnsetIsPresenter } from "../../utils/storageUtils";

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

const stopBeingPresenter = (
  eventChannel: Channel | undefined,
  client: Client,
  setClientStatus: React.Dispatch<React.SetStateAction<ClientStatus>>
) => {
  setClientStatus("disconnected");
  eventChannel?.push("presenter_remove", { email: client.email });
  sessionStorageUnsetIsPresenter();
};

type ControlPanelProps = {
  client: Client;
  webrtc: MembraneWebRTC | null;
  eventChannel: Channel | undefined;
  rerender: () => void;
  peersState: PeersState;
  setPeersState: React.Dispatch<React.SetStateAction<PeersState>>;
  setClientStatus: React.Dispatch<React.SetStateAction<ClientStatus>>;
};

const ControlPanel = ({
  client,
  webrtc,
  eventChannel,
  rerender,
  peersState,
  setPeersState,
  setClientStatus,
}: ControlPanelProps) => {
  const [sources, setSources] = useState<Sources>({ audio: [], video: [] });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const screenType = useContext(ScreenTypeContext);

  const updateAvailableSources = useCallback(async () => {
    await askForPermissions();
    const sources = await getSources();
    if (sources != null) {
      setSources(sources);

      const prepareDevice = (kind: SourceType) => {
        const deviceName = getCurrentDeviceName(client, kind, peersState);
        if (deviceName === undefined) {
          changeSource(webrtc, client, sources[kind][0].deviceId, kind, setPeersState);
        }
      };

      prepareDevice("audio");
      prepareDevice("video");
    }
  }, [client, peersState, setPeersState, webrtc]);

  useEffect(() => {
    updateAvailableSources();
  }, [updateAvailableSources]);

  useEffect(() => {
    navigator.mediaDevices.ondevicechange = updateAvailableSources;

    return () => {
      navigator.mediaDevices.ondevicechange = null;
    };
  }, [peersState, updateAvailableSources]);

  const getDropdownButton = (sourceType: SourceType) => {
    return (
      <DropdownButton
        key={sourceType}
        mainText={`${sourceType} source`}
        currentSourceName={getCurrentDeviceName(client, sourceType, peersState)}
        sources={sources[sourceType]}
        onSelectSource={(deviceId) => {
          changeSource(webrtc, client, deviceId, sourceType, setPeersState).then(() => {
            rerender();
          });
        }}
      />
    );
  };

  const getMuteButton = (sourceType: SourceType, IconEnabled: Icon, IconDisabled: Icon) => {
    return (
      <GenericButton
        icon={
          checkTrackIsEnabled(client, sourceType, peersState) !== false ? (
            <IconEnabled className="PanelButton Enabled" />
          ) : (
            <IconDisabled className="PanelButton Disabled" />
          )
        }
        onClick={() => {
          changeTrackIsEnabled(webrtc, client, sourceType, peersState);
          rerender();
        }}
      />
    );
  };

  const isSharingScreen: boolean = peersState.isScreenSharing;

  return (
    <>
      <div className="ControlPanel">
        <div className="CenterIcons">
          {getMuteButton("video", Cam, CamDisabled)}
          {getMuteButton("audio", Microphone, MicrophoneDisabled)}
          <GenericButton
            icon={<PhoneDown className="DisconnectButton" />}
            onClick={() => stopBeingPresenter(eventChannel, client, setClientStatus)}
          />
          <GenericButton
            icon={
              !isSharingScreen && screenType.device !== "mobile" ? (
                <ScreenShare className="PanelButton" />
              ) : (
                <ScreenDisabled className="PanelButton" />
              )
            }
            onClick={() => {
              isSharingScreen
                ? stopShareScreen(webrtc, client, setPeersState)
                : shareScreen(webrtc, client, setPeersState);
            }}
            disabled={screenType.device === "mobile"}
          />
          <MenuPopover>
            <ModeButton name="Options" onClick={onOpen} />
            <SettingsModal
              isOpen={isOpen}
              onClose={onClose}
              elements={[getDropdownButton("audio"), getDropdownButton("video")]}
            />
          </MenuPopover>
        </div>
      </div>
    </>
  );
};

export default ControlPanel;
