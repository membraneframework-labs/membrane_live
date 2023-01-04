import { Channel } from "phoenix";
import "../../../../css/event/animation.css";
import { useEffect, useState } from "react";
import ConfettiExplosion from "react-confetti-explosion";

type ConfettiAnimationProps = {
  eventChannel: Channel | undefined;
};

const ConfettiAnimation = ({ eventChannel }: ConfettiAnimationProps) => {
  const [isRun, setIsRun] = useState<boolean>(false);

  useEffect(() => {
    let timeoutRef: number | null = null;
    const ref = eventChannel?.on("animation_confetti", () => {
      setIsRun(true);
      timeoutRef = setTimeout(() => setIsRun(false), 2_500);
    });

    return () => {
      timeoutRef && clearTimeout(timeoutRef);
      eventChannel?.off("animation_confetti", ref);
    };
  }, [eventChannel]);

  return <div className="confettiContainer">{isRun ? <ConfettiExplosion /> : <></>}</div>;
};

export default ConfettiAnimation;
