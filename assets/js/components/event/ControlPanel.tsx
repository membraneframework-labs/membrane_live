import React, { useState, useEffect } from "react";
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
import { MembraneWebRTC } from "@membraneframework/membrane-webrtc-js";
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
  stopShareScreen,
  checkTrackIsEnabled,
  setSourceById,
  getCurrentDeviceName,
} from "../../utils/rtcUtils";
import { Channel } from "phoenix";
import GenericButton from "../helpers/GenericButton";
import type { Mode, Client, SourceType } from "../../types/types";
import "../../../css/event/controlpanel.css";
import MenuPopover from "../helpers/MenuPopover";
import useCheckScreenType from "../../utils/useCheckScreenType";
import { ModeButton } from "./ModePanel";
import { storageUnsetIsPresenter } from "../../utils/storageUtils";

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
  setMode: React.Dispatch<React.SetStateAction<Mode>>
) => {
  eventChannel?.push("presenter_remove", { email: client.email });
  storageUnsetIsPresenter();
  setMode("hls");
};

type ControlPanelProps = {
  client: Client;
  webrtc: MembraneWebRTC | null;
  eventChannel: Channel | undefined;
  playerCallback: (sourceType: SourceType) => void;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  rerender: () => void;
};

const ControlPanel = ({ client, webrtc, eventChannel, playerCallback, mode, setMode, rerender }: ControlPanelProps) => {
  const [sources, setSources] = useState<Sources>({ audio: [], video: [] });
  const [sharingScreen, setSharingScreen] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const screenType = useCheckScreenType();

  const updateAvailableSources = async () => {
    const sources = await getSources();
    if (sources != null) {
      setSources(sources);

      const prepareDevice = (kind: "audio" | "video") => {
        const deviceName = getCurrentDeviceName(client, kind);
        if (deviceName === undefined) setSourceById(client, sources[kind][0].deviceId, kind, playerCallback);
      };

      prepareDevice("audio");
      prepareDevice("video");
    }
  };

  useEffect(() => {
    updateAvailableSources();
  }, []);

  useEffect(() => {
    navigator.mediaDevices.ondevicechange = updateAvailableSources;

    return () => {
      navigator.mediaDevices.ondevicechange = null;
    };
  }, [getSources]);

  const getDropdownButton = (sourceType: SourceType) => {
    return (
      <DropdownButton
        key={sourceType}
        mainText={`${sourceType} source`}
        currentSourceName={getCurrentDeviceName(client, sourceType)}
        sources={sources[sourceType]}
        onSelectSource={(deviceId) => {
          changeSource(webrtc, client, deviceId, sourceType, playerCallback).then(() => {
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
          checkTrackIsEnabled(client, sourceType) !== false ? (
            <IconEnabled className="PanelButton Enabled" />
          ) : (
            <IconDisabled className="PanelButton Disabled" />
          )
        }
        onClick={() => {
          changeTrackIsEnabled(webrtc, client, sourceType, playerCallback);
          rerender();
        }}
      />
    );
  };

  return (
    <>
      <div className="ControlPanel">
        <div className="CenterIcons">
          {getMuteButton("video", Cam, CamDisabled)}
          {getMuteButton("audio", Microphone, MicrophoneDisabled)}
          <GenericButton
            icon={<PhoneDown className="DisconnectButton" />}
            onClick={() => stopBeingPresenter(eventChannel, client, setMode)}
          />
          <GenericButton
            icon={
              !sharingScreen && screenType.device !== "mobile" ? (
                <ScreenShare className="PanelButton" />
              ) : (
                <ScreenDisabled className="PanelButton" />
              )
            }
            disabled={screenType.device === "mobile"}
            onClick={() => {
              if (!sharingScreen) shareScreen(webrtc, client, playerCallback).then((value) => setSharingScreen(value));
              else stopShareScreen(webrtc, client, playerCallback);
              setSharingScreen(false);
            }}
          />
          <MenuPopover mode={mode} setMode={setMode}>
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
