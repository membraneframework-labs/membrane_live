declare module "react-swm-icon-pack" {
  import { FC } from "react";

  type IconProps = {
    color: string;
    strokeWidth: string | number;
    size: string | number;
    set: "broken" | "curved" | "duotone" | "outline";
  };

  export type Icon = FC<Partial<IconProps> & React.HTMLAttributes<HTMLDivElement>>;

  export const ArrowLeft: Icon;
  export const Calendar: Icon;
  export const CalendarClock: Icon;
  export const Cam: Icon;
  export const CamDisabled: Icon;
  export const Copy: Icon;
  export const Cross: Icon;
  export const CrossCircle: Icon;
  export const CrossSmall: Icon;
  export const Crown1: Icon;
  export const EmoteSmile: Icon;
  export const Fullscreen: Icon;
  export const InfoCircle: Icon;
  export const Logout: Icon;
  export const MenuHorizontal: Icon;
  export const MenuVertical: Icon;
  export const Microphone: Icon;
  export const MicrophoneDisabled: Icon;
  export const Minus: Icon;
  export const Package: Icon;
  export const Pause: Icon;
  export const PhoneDown: Icon;
  export const Play: Icon;
  export const Plus: Icon;
  export const QuestionCircle: Icon;
  export const Redo: Icon;
  export const RotateLeft: Icon;
  export const RotateRight: Icon;
  export const Screen: Icon;
  export const ScreenDisabled: Icon;
  export const ScreenShare: Icon;
  export const Search: Icon;
  export const Settings: Icon;
  export const Share1: Icon;
  export const Speaker0: Icon;
  export const Speaker1: Icon;
  export const Speaker2: Icon;
  export const SpeakerCross: Icon;
  export const Star1: Icon;
  export const User1: Icon;
  export const UserPlus: Icon;
  export const Users: Icon;
  export const WarningCircle: Icon;
}
