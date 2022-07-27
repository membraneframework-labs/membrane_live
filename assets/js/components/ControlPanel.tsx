import { Box, Button, Menu, MenuButton, MenuList, MenuItem, useBoolean } from "@chakra-ui/react";
import React, { useState, useEffect, ReactNode } from "react";
import {Camera, CameraDisabled, Microphone, MicrophoneDisabled} from 'react-swm-icon-pack'

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

const DropdownList = ({sources, itemSelectFunc}:DropdownListProps) => {
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
}

const DropdownButton = ({sources, mainText, onSelectSource}: DropdownButtonProps) => {
  return (
    <Menu>
      <MenuButton as={Button}>{mainText}</MenuButton>
      <DropdownList sources={sources} itemSelectFunc={onSelectSource} />
    </Menu>
  );
};

type PanelButtonProps = {
    onClick: () => void;
    type: "disabled" | "on" | "off";
    sourceType: "audio" | "video";
}

const PanelButton = ({onClick, sourceType, type}:PanelButtonProps) => {
    if (type === "disabled") return <DisabledPanelButton sourceType={sourceType}/>;
    if (type === "on") return <OnPanelButton onClick={onClick} sourceType={sourceType}/>
    if (type === "off") return <OffPanelButton onClick={onClick} sourceType={sourceType}/>
    return <></>;
}

type DisabledPanelButtonProps = {
    sourceType: "audio" | "video";
}

const DisabledPanelButton = ({sourceType}:DisabledPanelButtonProps) => {
    const icon = {audio: <MicrophoneDisabled/>, video: <CameraDisabled/>};
    return (<Button isDisabled borderRadius="500px"
                    backgroundColor="gray.300"
                    border="1px" 
                    borderColor={"grey"}>
            {icon[sourceType]}
        </Button>
    );
}

type OnOffPanelButtonProps = {
    sourceType: "audio" | "video";
    onClick: () => void;
}

const OnPanelButton = ({sourceType, onClick}:OnOffPanelButtonProps) => {
    const icon = {audio: <Microphone/>, video: <Camera/>};
    return (<Button borderRadius="500px"
                    backgroundColor="white" 
                    border="1px" 
                    borderColor="#BFCCF8"
                    onClick={onClick}>
            {icon[sourceType]}
        </Button>
    );
}

const OffPanelButton = ({sourceType, onClick}:OnOffPanelButtonProps) => {
    const icon = {audio: <MicrophoneDisabled/>, video: <CameraDisabled/>};
    return (<Button borderRadius="500px"
                    backgroundColor="red.300"
                    border="1px" 
                    borderColor="red"
                    onClick={onClick}>
            {icon[sourceType]}
        </Button>
    );
}

const ControlPanel = () => {
  const initialSources: Sources = {
    audio: { devices: [], selectedId: "", isActive: false},
    video: { devices: [], selectedId: "", isActive: false},
  };
  const [sources, setSources] = useState(initialSources);

  const filterDevices = (allDevices: MediaDeviceInfo[], type: String) => {
    return allDevices.filter((device) => device.deviceId != "default" && device.kind == type);
  };

  const getSources = async () => {
    let mediaDevices: MediaDeviceInfo[];
    try {
      mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const audio: SourceInfo = {...sources.audio, devices: filterDevices(mediaDevices, "audioinput")};
      const video: SourceInfo = {...sources.video, devices: filterDevices(mediaDevices, "videoinput")};
      const newSources: Sources = {audio: audio, video: video,};
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


  const changeSelectedSourceHandler = (deviceId: string, sourceType: 'audio' | 'video') => {
    const constraint = {[sourceType]: {deviceId}};
    navigator.mediaDevices
      .getUserMedia(constraint)
      .then(() => {
        const newSourceInfo: SourceInfo = {...sources[sourceType], selectedId: deviceId, isActive: true};
        const newSources: Sources = {...sources, [sourceType]: newSourceInfo};
        setSources(newSources);
      })
      .catch((err) => {
        alert(err.name + ": " + err.message);
      });
  };

  const toggleButton = (sourceType: 'audio' | 'video') => {
    const newActiveValue: boolean = !sources[sourceType].isActive;
    const newSourceInfo: SourceInfo = {...sources[sourceType], isActive: newActiveValue};
    const newSources: Sources = {...sources, [sourceType]: newSourceInfo};
    setSources(newSources);
  };

  const dispatchPanelButtonType = (sourceType: 'audio' | 'video') => {
    if (!sources[sourceType].selectedId) {
        return "disabled";
    } else if (sources[sourceType].isActive) {
        return "on";
    } else {
        return "off";
    }
  }

  return (
    <Box borderWidth="1px" width="100%" min-height="40px" padding="10px">
      <DropdownButton
        mainText="audio source"
        sources={sources.audio}
        onSelectSource={((deviceId: string) => changeSelectedSourceHandler(deviceId, 'audio'))}
      />
      <DropdownButton
        mainText="video source"
        sources={sources.video}
        onSelectSource={((deviceId: string) => changeSelectedSourceHandler(deviceId, 'video'))}
      />
      <PanelButton sourceType='audio' type={dispatchPanelButtonType('audio')} onClick={() => toggleButton('audio')}/>
      <PanelButton sourceType='video' type={dispatchPanelButtonType('video')} onClick={() => toggleButton('video')}/>
    </Box>
  );
};

export default ControlPanel;
