import { useState, useEffect, useCallback, useRef } from "react";
import { Channel } from "phoenix";
import "../../../../css/event/animation.css";

type HeartElement = {
  elem: JSX.Element;
  time: number;
  x: number;
  y: number;
  bound: number;
  direction: number;
  scale: number;
};

type HeartAnimationProps = {
  eventChannel?: Channel;
};

const duration = 5000;
const framerate = 30;
const speed = (0.2 * 1000) / framerate;
const cursorXOffset = 0;
const cursorYOffset = -5;

const HeartAnimation = ({ eventChannel }: HeartAnimationProps) => {
  const [hearts, setHearts] = useState<HeartElement[]>([]);

  const heartMessage = "animation_heart";

  const generateHeartElement = useCallback((left: number, top: number, scale: number) => {
    return (
      <div
        key={`${left}${top}${scale}`}
        className="heart"
        style={{
          left: `${left}px`,
          top: `${top}px`,
          transform: `scale(${scale},${scale})`,
        }}
      />
    );
  }, []);

  const generateHeart = useCallback(
    (x: number, y: number, xBound: number, xStart: number, scale: number) => {
      return {
        elem: generateHeartElement(x, y, scale),
        time: duration,
        x,
        y,
        bound: xBound,
        direction: xStart,
        scale,
      };
    },
    [generateHeartElement]
  );

  const before = useRef(Date.now());

  const frame = useCallback(() => {
    const current = Date.now();
    const deltaTime = current - before.current;
    before.current = current;
    if (hearts.length > 0) {
      const newHearts: HeartElement[] = hearts
        .filter((heart) => heart.time > 0)
        .map((heart: HeartElement) => {
          const newYPosition = heart.y - speed;
          const newXPosition =
            heart.x + ((heart.direction * heart.bound * Math.sin((heart.y * heart.scale) / 30)) / heart.y) * 100;
          const newElem = generateHeartElement(newXPosition, newYPosition, heart.scale);
          const newTime = heart.time - deltaTime;
          const newHeart = { ...heart, elem: newElem, time: newTime, y: newYPosition };
          return newHeart;
        });

      setHearts(newHearts);
    }
  }, [generateHeartElement, hearts]);

  const onEvent = useCallback(() => {
    const start = 1 - Math.round(Math.random()) * 2;
    const scale = Math.random() * Math.random() * 0.8 + 0.2;
    const bound = Math.random() * 200;
    const randomXFactor = Math.random() * 200 - 100;
    const randomYFactor = Math.random() * 20;

    return generateHeart(cursorXOffset + randomXFactor, 10 + cursorYOffset + randomYFactor, bound, start, scale);
  }, [generateHeart]);

  useEffect(() => {
    const ref = eventChannel?.on(heartMessage, () => {
      const newHearts = Array(5)
        .fill(null)
        .map(() => onEvent());
      setHearts((hearts) => {
        return [...hearts, ...newHearts];
      });
    });
    return () => eventChannel?.off(heartMessage, ref);
  }, [eventChannel, onEvent]);

  useEffect(() => {
    const interval = setInterval(() => {
      frame();
    }, 1000 / framerate);
    return () => clearInterval(interval);
  }, [frame, hearts]);

  return <div className="heartContainer">{hearts.map((heart) => heart.elem)}</div>;
};

export default HeartAnimation;
