import React, { useState, useEffect } from "react";
import "../../../css/event/animation.css";
import { Channel } from "phoenix";

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
  eventChannel: Channel | undefined;
};

const AnimationComponent = ({ eventChannel }: HeartAnimationProps) => {
  const [hearts, setHearts] = useState<HeartElement[]>([]);

  const duration = 5000;
  const speed = 1;
  const cursorXOffset = 0;
  const cursorYOffset = -5;

  const generateHeartElement = (left, top, scale) => {
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
  };

  const generateHeart = (x, y, xBound, xStart, scale) => {
    return {
      elem: generateHeartElement(x, y, scale),
      time: duration,
      x,
      y,
      bound: xBound,
      direction: xStart,
      scale,
    };
  };

  let before = Date.now();

  const frame = () => {
    const current = Date.now();
    const deltaTime = current - before;
    before = current;
    if (hearts.length > 0) {
      const newHearts: HeartElement[] = hearts
        .filter((heart) => heart.time > 0)
        .map((heart: HeartElement) => {
          const newYPosition = heart.y - speed;
          const newXPosition =
            heart.x +
            ((heart.direction * heart.bound * Math.sin((heart.y * heart.scale) / 30)) / heart.y) *
            100;
          const newElem = generateHeartElement(newXPosition, newYPosition, heart.scale);
          const newTime = heart.time - deltaTime;
          const newHeart = { ...heart, elem: newElem, time: newTime, y: newYPosition };
          return newHeart;
        });

      setHearts(newHearts);
    }
  };

  useEffect(() => {
    const ref = eventChannel.on("animation", () => {
      const newHeart = onEvent();
      setHearts((hearts) => [...hearts, newHeart]);
    });
    return () => eventChannel.off("animation", ref);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      frame();
    }, 5);
    return () => clearInterval(interval);
  }, [hearts]);

  const onEvent = () => {
    const start = 1 - Math.round(Math.random()) * 2;
    const scale = Math.random() * Math.random() * 0.8 + 0.2;
    const bound = 30 + Math.random() * 200;
    return generateHeart(200 + cursorXOffset, 10 + cursorYOffset, bound, start, scale);
  };

  return (
    <div className={"animatedContainer"}>
      {hearts.length}: {hearts.map((heart) => heart.elem)}
    </div>
  );
};

export default AnimationComponent;
