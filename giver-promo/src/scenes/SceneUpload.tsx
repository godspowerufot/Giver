import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { ClickZoom } from "../components/ClickZoom";
import { Cursor } from "../components/Cursor";
import { LightningBg } from "../components/LightningBg";
import { Sfx } from "../components/Sfx";
import { colors, fonts } from "../theme";

const CLICK_AT = 42;
const BUTTON_X = 1080;
const BUTTON_Y = 620;

export const SceneUpload: React.FC = () => {
  const frame = useCurrentFrame();
  const fileY = interpolate(frame, [20, 45], [-180, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const parsing = frame > 50;
  const progress = interpolate(frame, [52, 95], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const choosePulse =
    frame >= CLICK_AT && frame < CLICK_AT + 14
      ? interpolate(frame, [CLICK_AT, CLICK_AT + 6, CLICK_AT + 14], [1, 0.94, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;

  return (
    <AbsoluteFill>
      <LightningBg />
      <Sfx file="whoosh.wav" at={18} volume={0.35} />
      <Sfx file="click.wav" at={CLICK_AT} volume={0.65} />
      <Sfx file="success.wav" at={90} volume={0.5} />

      <ClickZoom clickAt={CLICK_AT} originX={BUTTON_X} originY={BUTTON_Y} amount={1.18}>
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
              width: 720,
              borderRadius: 24,
              border: `1.5px dashed ${frame > 40 ? "rgba(255,255,255,0.55)" : colors.line}`,
              background: "rgba(255,255,255,0.03)",
              padding: "56px 40px",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                fontFamily: fonts.display,
                fontSize: 42,
                color: colors.white,
              }}
            >
              Drop your statement
            </div>
            <div
              style={{
                marginTop: 14,
                fontSize: 18,
                color: colors.zinc400,
                lineHeight: 1.5,
              }}
            >
              CSV or Excel to see who you send the most to.
            </div>

            <div
              style={{
                marginTop: 36,
                display: "inline-flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  padding: "12px 20px",
                  borderRadius: 8,
                  background: colors.white,
                  color: "#000",
                  fontWeight: 600,
                  fontSize: 15,
                  scale: choosePulse,
                  boxShadow:
                    frame >= CLICK_AT && frame < CLICK_AT + 12
                      ? "0 0 0 6px rgba(255,255,255,0.12)"
                      : "none",
                }}
              >
                Choose file
              </div>
            </div>
            <div
              style={{
                marginTop: 18,
                fontSize: 13,
                color: colors.zinc500,
                lineHeight: 1.45,
              }}
            >
              Parsed in your browser only — never uploaded or saved.
            </div>

            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 120,
                translate: "-50% 0",
                transform: `translateY(${fileY}px)`,
                opacity: interpolate(frame, [18, 28], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                width: 220,
                borderRadius: 12,
                border: `1px solid ${colors.line}`,
                background: "#111113",
                padding: "14px 16px",
                textAlign: "left",
                boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
              }}
            >
              <div style={{ fontSize: 13, color: colors.zinc500 }}>FILE</div>
              <div style={{ marginTop: 4, fontSize: 16, color: colors.white }}>
                wallet-statement.csv
              </div>
            </div>

            {parsing ? (
              <div style={{ marginTop: 28 }}>
                <div style={{ fontSize: 14, color: colors.zinc400, marginBottom: 8 }}>
                  Reading locally…
                </div>
                <div
                  style={{
                    height: 4,
                    borderRadius: 99,
                    background: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${progress * 100}%`,
                      height: "100%",
                      background: colors.white,
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </AbsoluteFill>
      </ClickZoom>

      <Cursor
        path={[
          { x: 1500, y: 900, at: 0 },
          { x: BUTTON_X, y: BUTTON_Y, at: 18 },
          { x: 960, y: 520, at: 40 },
        ]}
        clickAt={CLICK_AT}
      />
    </AbsoluteFill>
  );
};
