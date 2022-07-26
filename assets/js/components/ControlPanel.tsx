import { Box, Button, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import React, { useState, useEffect } from "react";

type SourceInfo = {
  devices: MediaDeviceInfo[];
  selectedId: String;
  isActive: boolean;
};

type Sources = {
  audio: SourceInfo;
  video: SourceInfo;
};

const getDeviceLabel = (device: MediaDeviceInfo, selectedDeviceId: String) => {
  return device.deviceId === selectedDeviceId ? <b>{device.label}</b> : device.label;
};

const DropdownList = (props) => {
  const devices: MediaDeviceInfo[] = props.sources.devices;
  const selectedDeviceId: String = props.sources.selectedId;
  const changeSelectedDevice: (id: String) => void = props.itemSelectFunc;

  const menuItems = devices.map((device) => (
    <MenuItem key={device.deviceId} onClick={() => changeSelectedDevice(device.deviceId)}>
      {getDeviceLabel(device, selectedDeviceId)}
    </MenuItem>
  ));
  return <MenuList>{menuItems}</MenuList>;
};

const DropdownButton = (props) => {
  return (
    <Menu>
      <MenuButton as={Button}>{props.mainText}</MenuButton>
      <DropdownList sources={props.sources} itemSelectFunc={props.itemSelectFunc} />
    </Menu>
  );
};

const PauseResumeButton = (props) => {
    return (
        <Button>
            {props.label}
        </Button>
    )
}

const filterDevices = (allDevices: MediaDeviceInfo[], type: String) => {
  return allDevices.filter((device) => device.deviceId != "default" && device.kind == type);
};

const ControlPanel = () => {
  const initialSources: Sources = {
    audio: { devices: [], selectedId: "", isActive: false},
    video: { devices: [], selectedId: "", isActive: false},
  };
  const [sources, setSources] = useState(initialSources);

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

  navigator.mediaDevices.ondevicechange = (_event) => {
    getSources();
  };

  const changeSelectedAudio = (deviceId) => {
    navigator.mediaDevices
      .getUserMedia({ audio: { deviceId: deviceId } })
      .then(() => {
        const newAudio: SourceInfo = {...sources.audio, selectedId: deviceId};
        const newSources: Sources = {...sources, audio: newAudio};
        setSources(newSources);
      })
      .catch((err) => {
        alert(err.name + ": " + err.message);
      });
  };

  const changeSelectedVideo = (deviceId) => {
    navigator.mediaDevices
      .getUserMedia({ video: { deviceId: deviceId } })
      .then((stream) => {
        const newVideo: SourceInfo = { ...sources.video, selectedId: deviceId};
        const newSources: Sources = {...sources, video: newVideo};
        setSources(newSources);

        let videoElement = document.querySelector<HTMLVideoElement>("#local-video");
        if (videoElement) videoElement.srcObject = stream;
      })
      .catch((err) => {
        alert(err.name + ": " + err.message);
      });
  };

  return (
    <Box borderWidth="1px" width="100%" min-height="40px" padding="10px">
      <DropdownButton
        mainText="audio source"
        sources={sources.audio}
        itemSelectFunc={changeSelectedAudio}
      />
      <DropdownButton
        mainText="video source"
        sources={sources.video}
        itemSelectFunc={changeSelectedVideo}
      />
      <PauseResumeButton label="play/resume audio"/>
      <PauseResumeButton label="play/resume video"/>
      <video id="local-video" autoPlay></video>
    </Box>
  );
};

export default ControlPanel;
