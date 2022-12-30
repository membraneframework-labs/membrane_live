import React, { useContext } from "react";
import { Popover, PopoverArrow, PopoverBody, PopoverContent, PopoverTrigger } from "@chakra-ui/react";
import { MenuHorizontal } from "react-swm-icon-pack";
import GenericButton from "./GenericButton";
import { Mode } from "../../types/types";
import { ModeButton } from "../event/ModePanel";
import { ScreenTypeContext } from "../../utils/ScreenTypeContext";

type MenuPopoverProps = {
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  className?: string;
  children?: React.ReactNode;
};

const MenuPopover = ({ setMode, className, children }: MenuPopoverProps) => {
  const screenType = useContext(ScreenTypeContext);

  const switchMode = () => {
    setMode((mode) => (mode === "hls" ? "presenters" : "hls"));
  };

  return (
    <Popover>
      <PopoverTrigger>
        <GenericButton icon={<MenuHorizontal className="PanelButton" />} className={className} />
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverBody>
          {screenType.device === "mobile" && <ModeButton name={`Change view`} onClick={switchMode} />}
          {children}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default MenuPopover;
