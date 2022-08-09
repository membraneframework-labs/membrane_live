import { Box, Button, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import { Camera, CameraDisabled, Microphone, MicrophoneDisabled } from "react-swm-icon-pack";
import { changeIsTrackEnabled, addClientMediaStream } from "./PresenterStreamArea";
export type SourceType = "audio" | "video";

type SourceInfo = {
  devices: MediaDeviceInfo[];
  selectedId: string;
  isActive: boolean;
};

type Sources = {
  audio: SourceInfo;
  video: SourceInfo;
};

type DropdownListProps = {
  sources: SourceInfo;
  itemSelectFunc: (id: string) => void;
};

const DropdownList = ({ sources, itemSelectFunc }: DropdownListProps) => {
  const devices: MediaDeviceInfo[] = sources.devices;
  const selectedDeviceId: String = sources.selectedId;

  const getDeviceLabel = (device: MediaDeviceInfo, selectedDeviceId: String) => {
    return device.deviceId === selectedDeviceId ? <b>{device.label}</b> : device.label;
  };

  const menuItems = devices.map((device) => (
    <MenuItem key={device.deviceId} onClick={() => itemSelectFunc(device.deviceId)}>
      {getDeviceLabel(device, selectedDeviceId)}
    </MenuItem>
  ));
  return <MenuList>{menuItems}</MenuList>;
};

type DropdownButtonProps = {
  sources: SourceInfo;
  mainText: string;
  onSelectSource: (id: string) => void;
};

const DropdownButton = ({ sources, mainText, onSelectSource }: DropdownButtonProps) => {
  return (
    <Menu>
      <MenuButton as={Button}>{mainText}</MenuButton>
      <DropdownList sources={sources} itemSelectFunc={onSelectSource} />
    </Menu>
  );
};

type PanelButtonProps = {
  onClick: () => void;
  sourceType: SourceType;
  disabled?: boolean;
  active: boolean;
};

const PanelButton = ({ onClick, sourceType, disabled, active }: PanelButtonProps) => {
  const icon =
    disabled || !active
      ? { audio: <Microphone />, video: <Camera /> }
      : { audio: <MicrophoneDisabled />, video: <CameraDisabled /> };
  return (
    <Button
      isDisabled={disabled}
      borderRadius="500px"
      backgroundColor={active ? "red.300" : "white"}
      border="1px"
      borderColor={active ? "red" : "#BFCCF8"}
      onClick={onClick}
    >
      {icon[sourceType]}
    </Button>
  );
};

type ControlPanelProps = {
  clientName: string;
  setLastSourceTypeChange: React.Dispatch<React.SetStateAction<SourceType | null>>;
};

const ControlPanel = ({ clientName, setLastSourceTypeChange }: ControlPanelProps) => {
  const initialSources: Sources = {
    audio: { devices: [], selectedId: "", isActive: false },
    video: { devices: [], selectedId: "", isActive: false },
  };
  const [sources, setSources] = useState(initialSources);

  const filterDevices = (allDevices: MediaDeviceInfo[], type: String) => {
    return allDevices.filter((device) => device.deviceId != "default" && device.kind == type);
  };

  const getSources = async () => {
    let mediaDevices: MediaDeviceInfo[];
    try {
      mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const audio: SourceInfo = {
        ...sources.audio,
        devices: filterDevices(mediaDevices, "audioinput"),
      };
      const video: SourceInfo = {
        ...sources.video,
        devices: filterDevices(mediaDevices, "videoinput"),
      };
      const newSources: Sources = { audio: audio, video: video };
      setSources(newSources);
    } catch (err) {
      console.log("Error during getting the media devices.");
    }
  };

  useEffect(() => {
    getSources();
  }, []);

  useEffect(() => {
    navigator.mediaDevices.ondevicechange = getSources;

    return () => {
      navigator.mediaDevices.ondevicechange = null;
    };
  }, [getSources]);

  const changeSelectedSourceHandler = (deviceId: string, sourceType: SourceType) => {
    const constraint = { [sourceType]: { deviceId } };
    navigator.mediaDevices
      .getUserMedia(constraint)
      .then((mediaStream) => {
        const newSourceInfo: SourceInfo = {
          ...sources[sourceType],
          selectedId: deviceId,
          isActive: true,
        };
        if (newSourceInfo.selectedId != sources[sourceType].selectedId) {
          const newSources: Sources = { ...sources, [sourceType]: newSourceInfo };
          setSources(newSources);
          addClientMediaStream(clientName, mediaStream, sourceType, setLastSourceTypeChange);
        }
      })
      .catch((err) => {
        alert(err.name + ": " + err.message);
      });
  };

  const toggleButton = (sourceType: SourceType) => {
    const newActiveValue: boolean = !sources[sourceType].isActive;
    const newSourceInfo: SourceInfo = { ...sources[sourceType], isActive: newActiveValue };
    const newSources: Sources = { ...sources, [sourceType]: newSourceInfo };
    changeIsTrackEnabled(clientName, sourceType, newActiveValue);
    setSources(newSources);
  };

  return (
    <Box borderWidth="1px" width="100%" min-height="40px" padding="10px">
      <DropdownButton
        mainText="audio source"
        sources={sources.audio}
        onSelectSource={(deviceId: string) => changeSelectedSourceHandler(deviceId, "audio")}
      />
      <DropdownButton
        mainText="video source"
        sources={sources.video}
        onSelectSource={(deviceId: string) => changeSelectedSourceHandler(deviceId, "video")}
      />
      <PanelButton
        sourceType="audio"
        onClick={() => toggleButton("audio")}
        disabled={!sources.audio.selectedId}
        active={sources.audio.isActive}
      />
      <PanelButton
        sourceType="video"
        onClick={() => toggleButton("video")}
        disabled={!sources.video.selectedId}
        active={sources.video.isActive}
      />
    </Box>
  );
};

export default ControlPanel;
