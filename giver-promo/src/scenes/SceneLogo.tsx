import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { LightningBg } from "../components/LightningBg";
import { Sfx, TypeSfx } from "../components/Sfx";
import { TypeCaret, useTypedText } from "../components/TypeLine";
import { colors, fonts } from "../theme";

const LINE1 = "wallet-statement.csv";
const LINE2 = "Ranking who you send to…";
const LINE3 = "#1  Ada Okonkwo  ·  ₦198,400";
const TAG = "Check who you give the most.";

/** Beat markers — spaced for readable type + hold */
const T = {
  l1: 14,
  l2: 88,
  l3: 175,
  holdEnd: 275,
  productOut: 278,
  brand: 282,
  tag: 300,
} as const;

/**
 * Product-first intro: slow typed parse story, hold the #1 result, then brand.
 */
export const SceneLogo: React.FC = () => {
  const frame = useCurrentFrame();

  const l1 = useTypedText(LINE1, T.l1, 0.36);
  const l2 = useTypedText(LINE2, T.l2, 0.34);
  const l3 = useTypedText(LINE3, T.l3, 0.34);
  const tag = useTypedText(TAG, T.tag, 0.36);

  const productOut = interpolate(
    frame,
    [T.productOut, T.productOut + 22],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const brandIn = interpolate(frame, [T.brand, T.brand + 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const brandScale = interpolate(frame, [T.brand, T.brand + 28], [0.88, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.spring({ damping: 180 }),
    output: "perceptual-scale",
  });
  const terminalZoom = interpolate(
    frame,
    [0, T.holdEnd, T.productOut + 22],
    [1.03, 1.08, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    },
  );

  return (
    <AbsoluteFill>
      <LightningBg intensity={1.1} />

      <TypeSfx from={T.l1} chars={LINE1.length} every={3} />
      <TypeSfx from={T.l2} chars={LINE2.length} every={3} />
      <TypeSfx from={T.l3} chars={LINE3.length} every={3} />
      <TypeSfx from={T.tag} chars={TAG.length} every={3} volume={0.18} />
      <Sfx file="success.wav" at={T.l3 + 78} volume={0.45} />
      <Sfx file="whoosh.wav" at={T.brand} volume={0.4} />

      {/* Product terminal — types the story before the brand */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: productOut,
          scale: terminalZoom,
        }}
      >
        <div
          style={{
            width: 820,
            borderRadius: 18,
            border: `1px solid ${colors.line}`,
            background: "rgba(10,10,12,0.92)",
            padding: "36px 40px",
            boxShadow: "0 40px 100px rgba(0,0,0,0.55)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: colors.zinc500,
              marginBottom: 22,
              fontFamily: fonts.body,
            }}
          >
            Giver · live parse
          </div>

          <div
            style={{
              fontFamily: fonts.body,
              fontSize: 28,
              color: colors.zinc300,
              lineHeight: 1.55,
            }}
          >
            <div>
              <span style={{ color: colors.zinc600 }}>{"> "}</span>
              {l1.visible}
              <TypeCaret show={!l1.done && frame >= T.l1} />
            </div>
            <div style={{ marginTop: 10, opacity: frame >= T.l2 ? 1 : 0.25 }}>
              <span style={{ color: colors.zinc600 }}>{"> "}</span>
              {l2.visible}
              <TypeCaret show={l1.done && !l2.done && frame >= T.l2} />
            </div>
            <div
              style={{
                marginTop: 18,
                fontFamily: fonts.display,
                fontSize: 34,
                color: colors.white,
                letterSpacing: "-0.03em",
                opacity: frame >= T.l3 ? 1 : 0,
              }}
            >
              {l3.visible}
              <TypeCaret show={l2.done && !l3.done && frame >= T.l3} />
            </div>
          </div>
        </div>
      </AbsoluteFill>

      {/* Brand settle */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: brandIn,
        }}
      >
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: 120,
            letterSpacing: "-0.05em",
            color: colors.white,
            scale: brandScale,
          }}
        >
          Giver
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: fonts.body,
            fontSize: 22,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: colors.zinc400,
            minHeight: 28,
          }}
        >
          {tag.visible}
          <TypeCaret show={frame >= T.tag && !tag.done} color={colors.zinc400} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
