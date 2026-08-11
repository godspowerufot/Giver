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
import {
  metrics,
  recipients,
  senders,
} from "../data/fakeData";
import { colors, fonts } from "../theme";

const CLICK_AT = 100;
const CLICK_X = 1280;
const CLICK_Y = 720;

const Panel: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ title, subtitle, children, style }) => (
  <div
    style={{
      border: `1px solid ${colors.line}`,
      borderRadius: 14,
      background: colors.panel,
      overflow: "hidden",
      ...style,
    }}
  >
    <div
      style={{
        borderBottom: `1px solid ${colors.line}`,
        padding: "14px 18px",
      }}
    >
      <div
        style={{
          fontFamily: fonts.display,
          fontSize: 20,
          color: colors.white,
        }}
      >
        {title}
      </div>
      {subtitle ? (
        <div style={{ marginTop: 4, fontSize: 13, color: colors.zinc500 }}>
          {subtitle}
        </div>
      ) : null}
    </div>
    <div style={{ padding: 16 }}>{children}</div>
  </div>
);

export const SceneDashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const rise = (delay: number) =>
    interpolate(frame, [delay, delay + 14], [24, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  const fade = (delay: number) =>
    interpolate(frame, [delay, delay + 12], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const barProgress = interpolate(frame, [20, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill>
      <LightningBg intensity={0.7} />
      <Sfx file="whoosh.wav" at={2} volume={0.3} />
      <Sfx file="pop.wav" at={16} volume={0.35} />
      <Sfx file="click.wav" at={CLICK_AT} volume={0.55} />

      <ClickZoom clickAt={CLICK_AT} originX={CLICK_X} originY={CLICK_Y} amount={1.12}>
      <AbsoluteFill
        style={{
          opacity: fade(0),
          translate: `0 ${rise(0)}px`,
          padding: 28,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 18,
            overflow: "hidden",
            border: `1px solid ${colors.line}`,
            boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
          }}
        >
          <AppChrome>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div
                style={{
                  fontFamily: fonts.display,
                  fontSize: 34,
                  color: colors.white,
                }}
              >
                Overview
              </div>

              {/* Metrics — NICE */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 10,
                  opacity: fade(8),
                }}
              >
                {[
                  ["Transfer out", metrics.transferOut],
                  ["Transfer in", metrics.transferIn],
                  ["Counterparties", metrics.people],
                  ["Period", metrics.period],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      border: `1px solid ${colors.line}`,
                      borderRadius: 12,
                      padding: "12px 14px",
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.07), transparent)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: colors.zinc500,
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        fontFamily: fonts.display,
                        fontSize: 22,
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
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1fr",
                  gap: 14,
                  opacity: fade(16),
                }}
              >
                <Panel
                  title="Top senders"
                  subtitle="Who sends you the most"
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {senders.map((s) => (
                      <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 90, fontSize: 13, color: colors.zinc300 }}>
                          {s.short}
                        </div>
                        <div
                          style={{
                            flex: 1,
                            height: 10,
                            borderRadius: 99,
                            background: "rgba(255,255,255,0.06)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${s.pct * 100 * barProgress}%`,
                              height: "100%",
                              background: "rgba(161,161,170,0.85)",
                              borderRadius: 99,
                            }}
                          />
                        </div>
                        <div style={{ width: 70, textAlign: "right", fontSize: 12, color: colors.zinc400 }}>
                          ₦{(s.amount / 1000).toFixed(0)}k
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel title="Person transfer volume" subtitle="Out vs in">
                  <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                    <div
                      style={{
                        width: 140,
                        height: 140,
                        borderRadius: 999,
                        background: `conic-gradient(#fff 0 ${39 * barProgress}%, #71717a ${39 * barProgress}% 100%)`,
                        mask: "radial-gradient(circle 42px, transparent 98%, #000 100%)",
                        WebkitMask:
                          "radial-gradient(circle 42px, transparent 98%, #000 100%)",
                      }}
                    />
                    <div style={{ fontSize: 14, color: colors.zinc300, lineHeight: 1.7 }}>
                      <div>Transfer out · {metrics.transferOut}</div>
                      <div>Transfer in · {metrics.transferIn}</div>
                    </div>
                  </div>
                </Panel>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                  opacity: fade(28),
                }}
              >
                <Panel title="Spend-down suggestions" subtitle="When one person dominates">
                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 10,
                      padding: 14,
                      background: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: colors.zinc500,
                      }}
                    >
                      warn
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontFamily: fonts.display,
                        fontSize: 18,
                        color: colors.white,
                      }}
                    >
                      Heavy concentration on {recipients[0]!.name.split(" ")[0]}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, color: colors.zinc400 }}>
                      About 22% of transfer spend sits with one person. Spread next month.
                    </div>
                  </div>
                </Panel>

                <Panel title="Top recipients" subtitle="Core of Giver">
                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {recipients.slice(0, 4).map((r) => (
                      <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 90, fontSize: 13, color: colors.zinc300 }}>
                          {r.short}
                        </div>
                        <div
                          style={{
                            flex: 1,
                            height: 10,
                            borderRadius: 99,
                            background: "rgba(255,255,255,0.06)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, (r.amount / recipients[0]!.amount) * 100 * barProgress)}%`,
                              height: "100%",
                              background: "rgba(255,255,255,0.75)",
                              borderRadius: 99,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            </div>
          </AppChrome>
        </div>
      </AbsoluteFill>
      </ClickZoom>

      <Cursor
        path={[
          { x: 400, y: 200, at: 0 },
          { x: 1280, y: 420, at: 40 },
          { x: CLICK_X, y: CLICK_Y, at: 90 },
        ]}
        clickAt={CLICK_AT}
      />
    </AbsoluteFill>
  );
};
