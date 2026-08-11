import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colors } from "../theme";

export const LightningBg: React.FC<{ intensity?: number }> = ({
  intensity = 1,
}) => {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame % 90, [0, 45, 90], [0, 0.75, 0.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, #0b0b0d 0%, ${colors.bg} 45%, #050506 100%)`,
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 50% at 10% -10%, rgba(255,255,255,${0.1 * intensity}), transparent 50%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 40% at 90% 0%, rgba(255,255,255,${0.06 * intensity}), transparent 45%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: sweep * intensity,
          backgroundImage: `linear-gradient(
            115deg,
            transparent 0%,
            transparent 42%,
            rgba(255,255,255,0.04) 46%,
            rgba(255,255,255,0.14) 50%,
            rgba(255,255,255,0.04) 54%,
            transparent 58%,
            transparent 100%
          )`,
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
};
