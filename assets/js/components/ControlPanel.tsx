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
      isDisabled={false}
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

  return (
    <Box borderWidth="1px" width="100%" min-height="40px" padding="10px">
      <DropdownButton
        mainText="audio source"
        currentSourceName={getCurrentDeviceName(clientName, "audio")}
        sources={sources.audio}
        onSelectSource={(deviceId) => {
          changeSource(webrtc, clientName, deviceId, "audio", playerCallback).then(() =>
            rerender()
          );
        }}
      />
      <DropdownButton
        mainText="video source"
        currentSourceName={getCurrentDeviceName(clientName, "video")}
        sources={sources.video}
        onSelectSource={(deviceId) => {
          changeSource(webrtc, clientName, deviceId, "video", playerCallback).then(() =>
            rerender()
          );
        }}
      />
      <MuteButton
        sourceType="audio"
        disabled={!findTrackByType(clientName, "audio")}
        active={findTrackByType(clientName, "audio")?.enabled}
        onClick={() => {
          changeTrackIsEnabled(clientName, "audio");
          rerender();
        }}
      />
      <MuteButton
        sourceType="video"
        disabled={!findTrackByType(clientName, "video")}
        active={findTrackByType(clientName, "video")?.enabled}
        onClick={() => {
          changeTrackIsEnabled(clientName, "video");
          rerender();
        }}
      />
    </Box>
  );
};

export default ControlPanel;
