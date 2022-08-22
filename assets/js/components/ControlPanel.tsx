import { Box, Button, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import { MembraneWebRTC } from "@membraneframework/membrane-webrtc-js";
import React, { useState, useEffect } from "react";
import { Cam, CamDisabled, Microphone, MicrophoneDisabled, Settings, PhoneDown, ScreenShare, MenuHorizontal, UserPlus} from "react-swm-icon-pack";
import {
  changeSource,
  changeTrackIsEnabled,
  findTrackByType,
  getCurrentDeviceName,
  getSources,
  Sources,
  SourceType,
} from "../utils/rtcUtils";
import "../../css/controlpanel.css"

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

const GenericButton = ({icon, onClick}: GenericButtonProps) => {
  return (
    <button
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

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

  const getMuteButton = (sourceType: SourceType, IconEnabled: any, IconDisabled: any) => {
    return (
      <GenericButton 
      icon={findTrackByType(clientName, sourceType)?.enabled ? <IconEnabled className="PanelButton Enabled"/> : <IconDisabled className="PanelButton Disabled"/>}
      onClick={() => {
        changeTrackIsEnabled(clientName, sourceType);
        rerender();
      }}
      />
    );
  };

  return (
    <div className="ControlPanel">
      <GenericButton
        icon={<Settings className="PanelButton"/>}
        onClick={() => {

        }}
      />
      <div className="CenterIcons">
        {getMuteButton("video", Cam, CamDisabled)}
        {getMuteButton("audio", Microphone, MicrophoneDisabled)}
        <GenericButton
          icon={<PhoneDown className="DisconnectButton" color="#FFFFFF"/>}
          onClick={() => {

          }}
        />
        <GenericButton
          icon={<ScreenShare className="PanelButton"/>}
          onClick={() => {

          }}
        />
        <GenericButton
          icon={<MenuHorizontal className="PanelButton"/>}
          onClick={() => {

          }}
        />
      </div>
      <GenericButton
        icon={<UserPlus className="PanelButton"/>}
        onClick={() => {

        }}
      />
    </div>
  );
};

export default ControlPanel;
