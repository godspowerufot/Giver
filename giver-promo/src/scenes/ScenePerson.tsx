import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { AppChrome } from "../components/AppChrome";
import { ClickZoom } from "../components/ClickZoom";
import { Cursor } from "../components/Cursor";
import { LightningBg } from "../components/LightningBg";
import { Sfx } from "../components/Sfx";
import { personTxns, topRecipient } from "../data/fakeData";
import { colors, fonts } from "../theme";

const CLICK_AT = 10;
const CLICK_X = 1100;
const CLICK_Y = 480;

export const ScenePerson: React.FC = () => {
  const frame = useCurrentFrame();
  const drawerX = interpolate(frame, [8, 28], [520, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });

  return (
    <AbsoluteFill>
      <LightningBg intensity={0.65} />
      <Sfx file="click.wav" at={CLICK_AT} volume={0.6} />
      <Sfx file="whoosh.wav" at={CLICK_AT + 2} volume={0.4} />

      <ClickZoom clickAt={CLICK_AT} originX={CLICK_X} originY={CLICK_Y} amount={1.14}>
        <AbsoluteFill style={{ padding: 28 }}>
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 18,
              overflow: "hidden",
              border: `1px solid ${colors.line}`,
              position: "relative",
            }}
          >
            <AppChrome>
              <div style={{ opacity: 0.35, fontFamily: fonts.display, fontSize: 34 }}>
                Overview
              </div>
              <div style={{ marginTop: 20, color: colors.zinc500, fontSize: 16 }}>
                Tap a person to open details…
              </div>
            </AppChrome>

            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.55)",
                opacity: interpolate(frame, [6, 18], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            />

            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                width: 520,
                background: "#0b0b0d",
                borderLeft: `1px solid ${colors.line}`,
                translate: `${drawerX}px 0`,
                padding: "22px 24px",
                boxShadow: "-24px 0 80px rgba(0,0,0,0.55)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: colors.zinc500,
                }}
              >
                Person detail
              </div>
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 999,
                    border: `1px solid ${colors.line}`,
                    background: "rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: fonts.display,
                    color: colors.white,
                  }}
                >
                  AO
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: fonts.display,
                      fontSize: 28,
                      color: colors.white,
                    }}
                  >
                    {topRecipient.name}
                  </div>
                  <div style={{ fontSize: 14, color: colors.zinc400 }}>
                    4 transfers in this statement
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 18,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                {[
                  ["Sent", "₦198,000"],
                  ["Received", "₦3,500"],
                  ["Net", "+₦194,500"],
                  ["Avg send", "₦49,500"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      border: `1px solid ${colors.line}`,
                      borderRadius: 10,
                      padding: "10px 12px",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: colors.zinc500,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        fontFamily: fonts.display,
                        fontSize: 18,
                        color: colors.white,
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: 18,
                  border: `1px solid ${colors.line}`,
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "12px 14px",
                    borderBottom: `1px solid ${colors.line}`,
                    fontFamily: fonts.display,
                    color: colors.white,
                  }}
                >
                  Transactions
                </div>
                {personTxns.map((tx, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      borderBottom:
                        i < personTxns.length - 1
                          ? "1px solid rgba(255,255,255,0.05)"
                          : "none",
                      opacity: interpolate(frame, [30 + i * 6, 40 + i * 6], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      }),
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, color: colors.zinc500 }}>
                        {tx.dir.toUpperCase()} · {tx.when}
                      </div>
                      <div style={{ marginTop: 2, fontSize: 14, color: colors.zinc400 }}>
                        {tx.note}
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: fonts.display,
                        fontSize: 18,
                        color: colors.white,
                      }}
                    >
                      {tx.amount}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AbsoluteFill>
      </ClickZoom>

      <Cursor
        path={[
          { x: CLICK_X, y: CLICK_Y, at: 0 },
          { x: 1500, y: 220, at: 12 },
        ]}
        clickAt={CLICK_AT}
      />
    </AbsoluteFill>
  );
};
