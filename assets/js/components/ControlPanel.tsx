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
  Settings,
  PhoneDown,
  ScreenShare,
  MenuHorizontal,
  UserPlus,
} from "react-swm-icon-pack";
import {
  shareScreen,
  changeSource,
  changeTrackIsEnabled,
  findTrackByType,
  getCurrentDeviceName,
  getSources,
  Sources,
  SourceType,
} from "../utils/rtcUtils";
import { Mode } from "./StreamArea";
import "../../css/controlpanel.css";

type DropdownListProps = {
  sources: MediaDeviceInfo[];
  currentSourceName?: string;
  itemSelectFunc: (id: string) => void;
};

const DropdownList = ({ sources, currentSourceName, itemSelectFunc }: DropdownListProps) => {
  const getDeviceLabel = (source: MediaDeviceInfo, currentSourceName: String | undefined) => {
    return source.label === currentSourceName ? <b>{source.label}</b> : source.label;
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

const DropdownButton = ({
  sources,
  currentSourceName,
  mainText,
  onSelectSource,
}: DropdownButtonProps) => {
  return (
    <Menu>
      <MenuButton as={Button}>{mainText}</MenuButton>
      <DropdownList
        sources={sources}
        currentSourceName={currentSourceName}
        itemSelectFunc={onSelectSource}
      />
    </Menu>
  );
};

type GenericButtonProps = {
  icon: any;
  onClick: () => void;
};

const GenericButton = ({ icon, onClick }: GenericButtonProps) => {
  return <button onClick={onClick}>{icon}</button>;
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
          <ModalHeader className="SettingsModalHeader">Settings</ModalHeader>
          <ModalCloseButton className="SettingsModalClose" />

          <ModalBody className="SettingsModalBody">{elements}</ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

const useRerender = () => {
  const [value, setValue] = useState(0);
  return () => setValue(value + 1);
};

type ControlPanelProps = {
  clientName: string;
  webrtc: MembraneWebRTC;
  eventChannel: any;
  playerCallback: (sourceType: SourceType) => void;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
};

const ControlPanel = ({
  clientName,
  webrtc,
  eventChannel,
  playerCallback,
  setMode,
}: ControlPanelProps) => {
  const [sources, setSources] = useState<Sources>({ audio: [], video: [] });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const rerender = useRerender();

  const style = getComputedStyle(document.body);

  const updateSources = async () => {
    const sources = await getSources();
    setSources(sources!);
  };

  useEffect(() => {
    updateSources();
  }, []);

  useEffect(() => {
    navigator.mediaDevices.ondevicechange = updateSources;

    return () => {
      navigator.mediaDevices.ondevicechange = null;
    };
  }, [getSources]);

  const getDropdownButton = (sourceType: SourceType) => {
    return (
      <DropdownButton
        key={sourceType}
        mainText={`${sourceType} source`}
        currentSourceName={getCurrentDeviceName(clientName, sourceType)}
        sources={sources[sourceType]}
        onSelectSource={(deviceId) => {
          changeSource(webrtc, clientName, deviceId, sourceType, playerCallback).then(() =>
            rerender()
          );
        }}
      />
    );
  };

  const getMuteButton = (sourceType: SourceType, IconEnabled: any, IconDisabled: any) => {
    return (
      <GenericButton
        icon={
          findTrackByType(clientName, sourceType)?.enabled ? (
            <IconEnabled className="PanelButton Enabled" />
          ) : (
            <IconDisabled className="PanelButton Disabled" />
          )
        }
        onClick={() => {
          changeTrackIsEnabled(clientName, sourceType);
          rerender();
        }}
      />
    );
  };

  return (
    <>
      <div className="ControlPanel">
        <GenericButton icon={<Settings className="PanelButton" />} onClick={onOpen} />
        <div className="CenterIcons">
          {getMuteButton("video", Cam, CamDisabled)}
          {getMuteButton("audio", Microphone, MicrophoneDisabled)}
          <GenericButton
            icon={
              <PhoneDown
                className="DisconnectButton"
                color={style.getPropertyValue("--bg-light-color-1")}
              />
            }
            onClick={() => {
              eventChannel.push("presenter_remove", { presenter: clientName });
              setMode("hls");
            }}
          />
          <GenericButton
            icon={<ScreenShare className="PanelButton" />}
            onClick={() => shareScreen(webrtc, clientName, playerCallback)}
          />
          <GenericButton icon={<MenuHorizontal className="PanelButton" />} onClick={() => {}} />
        </div>
        <GenericButton icon={<UserPlus className="PanelButton" />} onClick={() => {}} />
      </div>
      <SettingsModal
        isOpen={isOpen}
        onClose={onClose}
        elements={[getDropdownButton("audio"), getDropdownButton("video")]}
      />
    </>
  );
};

export default ControlPanel;
