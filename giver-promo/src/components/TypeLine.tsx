import React from "react";
import { useCurrentFrame } from "remotion";

/** Typewriter — reveals `text` from `start` at ~charsPerFrame. */
export const useTypedText = (
  text: string,
  start: number,
  charsPerFrame = 0.55,
) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - start);
  const count = Math.min(text.length, Math.floor(elapsed * charsPerFrame));
  return {
    visible: text.slice(0, count),
    done: count >= text.length,
    count,
  };
};

export const TypeCaret: React.FC<{ show: boolean; color?: string }> = ({
  show,
  color = "rgba(255,255,255,0.75)",
}) => {
  const frame = useCurrentFrame();
  if (!show) return null;
  const on = Math.floor(frame / 8) % 2 === 0;
  return (
    <span
      style={{
        display: "inline-block",
        width: 2,
        height: "0.9em",
        marginLeft: 3,
        background: color,
        opacity: on ? 1 : 0,
        verticalAlign: "-0.08em",
      }}
    />
  );
};
