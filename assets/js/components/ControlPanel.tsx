import { Box, Button, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import React, { useState, useEffect } from "react";

type SourceInfo = {
  devices: MediaDeviceInfo[];
  selectedId: String;
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

const filterDevices = (allDevices: MediaDeviceInfo[], type: String) => {
  return allDevices.filter((device) => device.deviceId != "default" && device.kind == type);
};

const ControlPanel = () => {
  const initialSources: Sources = {
    audio: { devices: [], selectedId: "" },
    video: { devices: [], selectedId: "" },
  };
  const [sources, setSources] = useState(initialSources);

  const getSources = async () => {
    let mediaDevices: MediaDeviceInfo[];
    try {
      mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const audio: SourceInfo = {
        devices: filterDevices(mediaDevices, "audioinput"),
        selectedId: sources.audio.selectedId,
      };
      const video: SourceInfo = {
        devices: filterDevices(mediaDevices, "videoinput"),
        selectedId: sources.video.selectedId,
      };
      const newSources: Sources = {
        audio: audio,
        video: video,
      };
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
        const newAudio: SourceInfo = { selectedId: deviceId, devices: sources.audio.devices };
        const newSources: Sources = {
          audio: newAudio,
          video: sources.video,
        };
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
        const newVideo: SourceInfo = {
          selectedId: deviceId,
          devices: sources.video.devices,
        };
        const newSources: Sources = {
          audio: sources.audio,
          video: newVideo,
        };
        setSources(newSources);
      })
      .catch((err) => {
        alert(err.name + ": " + err.message);
      });
  };

  return (
    <Box borderWidth="1px" width="100%" height="10%" padding="10px">
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
    </Box>
  );
};

export default ControlPanel;
