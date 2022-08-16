import { Box, Button, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import { MembraneWebRTC } from "@membraneframework/membrane-webrtc-js";
import React, { useState, useEffect } from "react";
import { Camera, CameraDisabled, Microphone, MicrophoneDisabled } from "react-swm-icon-pack";
import {
  changeSource,
  changeTrackIsEnabled,
  findTrackByType,
  getCurrentDeviceName,
  getSources,
  Sources,
  SourceType,
} from "../utils/rtcUtils";

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

type MuteButtonProps = {
  sourceType: SourceType;
  disabled?: boolean;
  active?: boolean;
  onClick: () => void;
};

const MuteButton = ({ sourceType, disabled, active, onClick }: MuteButtonProps) => {
  const icon =
    disabled || !active
      ? { audio: <MicrophoneDisabled />, video: <CameraDisabled /> }
      : { audio: <Microphone />, video: <Camera /> };

  return (
    <Button
      isDisabled={disabled}
      borderRadius="500px"
      backgroundColor={active ? "white" : "red.300"}
      border="1px"
      borderColor={active ? "#BFCCF8" : "red"}
      onClick={() => onClick()}
    >
      {icon[sourceType]}
    </Button>
  );
};

const useRerender = () => {
  const [value, setValue] = useState(0);
  return () => setValue(value + 1);
};

type ControlPanelProps = {
  clientName: string;
  webrtc: MembraneWebRTC;
  playerCallback: (sourceType: SourceType) => void;
};

const ControlPanel = ({ clientName, webrtc, playerCallback }: ControlPanelProps) => {
  const [sources, setSources] = useState<Sources>({ audio: [], video: [] });
  const rerender = useRerender();

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

  const getMuteButton = (sourceType: SourceType) => {
    return (
      <MuteButton
        sourceType={sourceType}
        disabled={!findTrackByType(clientName, sourceType)}
        active={findTrackByType(clientName, sourceType)?.enabled}
        onClick={() => {
          changeTrackIsEnabled(clientName, sourceType);
          rerender();
        }}
      />
    );
  };

  return (
    <Box borderWidth="1px" width="100%" min-height="40px" padding="10px">
      {getDropdownButton("audio")}
      {getDropdownButton("video")}
      {getMuteButton("audio")}
      {getMuteButton("video")}
    </Box>
  );
};

export default ControlPanel;
