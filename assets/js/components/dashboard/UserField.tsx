import { User1 } from "react-swm-icon-pack";
import GoogleButton from "../helpers/GoogleButton";
import { rectangleGoogleButton } from "../../utils/const";
import { Channel } from "phoenix";
import "../../../css/dashboard/userfield.css";

type UserFieldProps = {
  picture: string;
  name: string;
  isAuthenticated: boolean;
  eventChannel?: Channel;
};

const UserField = ({ isAuthenticated, picture, name, eventChannel }: UserFieldProps) => {
  return isAuthenticated ? (
    <div className="UserField">
      {picture ? <img src={picture} className="UserIcon" /> : <User1 className="UserIcon" />}
      <div className="UserName">{name}</div>
    </div>
  ) : (
    <GoogleButton eventChannel={eventChannel} options={rectangleGoogleButton} />
  );
};

export default UserField;
