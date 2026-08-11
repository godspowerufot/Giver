import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AmbientBed } from "./components/Sfx";
import { FADE_FRAMES, FPS } from "./theme";
import { SceneLogo } from "./scenes/SceneLogo";
import { SceneUpload } from "./scenes/SceneUpload";
import { SceneDashboard } from "./scenes/SceneDashboard";
import { ScenePerson } from "./scenes/ScenePerson";
import { SceneCards } from "./scenes/SceneCards";
import { SceneEnd } from "./scenes/SceneEnd";
import { Audio } from "@remotion/media";

/**
 * Giver product demo — typed intro, UI clicks + zoom, layered SFX.
 * ~32s · 16:9 · slower intro + fades so product UI can be read
 */
export const GiverDemo: React.FC = () => {
  const fadeTransition = (
    <TransitionSeries.Transition
      presentation={fade()}
      timing={linearTiming({ durationInFrames: FADE_FRAMES })}
    />
  );

  return (
    <AbsoluteFill style={{ background: "#070708" }}>
      <AmbientBed volume={0.26} />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={12.0 * FPS} name="Logo">
          <SceneLogo />
        </TransitionSeries.Sequence>
        {fadeTransition}
        <TransitionSeries.Sequence durationInFrames={4.2 * FPS} name="Upload">
          <SceneUpload />
        </TransitionSeries.Sequence>
        {fadeTransition}
        <TransitionSeries.Sequence
          durationInFrames={6.2 * FPS}
          name="Dashboard"
        >
          <SceneDashboard />
        </TransitionSeries.Sequence>
        {fadeTransition}
        <TransitionSeries.Sequence durationInFrames={4.4 * FPS} name="Person">
          <ScenePerson />
        </TransitionSeries.Sequence>
        {fadeTransition}
        <TransitionSeries.Sequence durationInFrames={5.2 * FPS} name="Cards">
          <SceneCards />
        </TransitionSeries.Sequence>
        {fadeTransition}
        <TransitionSeries.Sequence durationInFrames={2.8 * FPS} name="End">
          <SceneEnd />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Audio src={staticFile("sfx/ambient.wav")} durationInFrames={660} />
    </AbsoluteFill>
  );
};
