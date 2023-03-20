import React from "react";
import { Popover, PopoverArrow, PopoverBody, PopoverContent, PopoverTrigger } from "@chakra-ui/react";
import { MenuHorizontal } from "react-swm-icon-pack";
import GenericButton from "./GenericButton";

type MenuPopoverProps = {
  className?: string;
  children?: React.ReactNode;
};

const MenuPopover = ({ className, children }: MenuPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger>
        <GenericButton icon={<MenuHorizontal className="PanelButton" />} className={className} />
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverBody>{children}</PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default MenuPopover;
