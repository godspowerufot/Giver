import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { LightningBg } from "../components/LightningBg";
import { Sfx } from "../components/Sfx";
import { colors, fonts } from "../theme";

export const SceneEnd: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <LightningBg intensity={1.2} />
      <Sfx file="whoosh.wav" at={0} volume={0.4} />
      <Sfx file="success.wav" at={8} volume={0.35} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: interpolate(frame, [0, 10], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: 110,
            letterSpacing: "-0.05em",
            color: colors.white,
            scale: interpolate(frame, [0, 16], [0.9, 1], {
              extrapolateRight: "clamp",
              easing: Easing.spring({ damping: 180 }),
              output: "perceptual-scale",
            }),
          }}
        >
          Giver
        </div>
        <div
          style={{
            marginTop: 16,
            fontFamily: fonts.body,
            fontSize: 26,
            color: colors.zinc300,
            opacity: interpolate(frame, [10, 22], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Upload. Rank. Share the moment.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
