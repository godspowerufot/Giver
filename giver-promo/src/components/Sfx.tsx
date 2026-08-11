import React from "react";
import { Audio } from "@remotion/media";
import { Sequence, staticFile } from "remotion";

const src = (name: string) => staticFile(`sfx/${name}`);

/** One-shot UI sound at a local frame. */
export const Sfx: React.FC<{
  file: "click.wav" | "whoosh.wav" | "success.wav" | "type.wav" | "pop.wav";
  at: number;
  volume?: number;
  durationInFrames?: number;
}> = ({ file, at, volume = 0.55, durationInFrames = 20 }) => (
  <Sequence from={at} durationInFrames={durationInFrames} layout="none">
    <Audio src={src(file)} volume={volume} />
  </Sequence>
);

/** Typewriter ticks while characters appear. */
export const TypeSfx: React.FC<{
  from: number;
  chars: number;
  every?: number;
  volume?: number;
}> = ({ from, chars, every = 2, volume = 0.22 }) => (
  <>
    {Array.from({ length: Math.max(0, chars) }).map((_, i) => (
      <Sequence
        key={i}
        from={from + i * every}
        durationInFrames={3}
        layout="none"
      >
        <Audio src={src("type.wav")} volume={volume} />
      </Sequence>
    ))}
  </>
);

/** Soft ambient bed for the full composition. */
export const AmbientBed: React.FC<{ volume?: number }> = ({ volume = 0.28 }) => (
  <Audio src={src("ambient.wav")} volume={volume} loop />
);
