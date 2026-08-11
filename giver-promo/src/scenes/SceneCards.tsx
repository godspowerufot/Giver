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
import {
  celebrationLine,
  thankYouLine,
  topRecipient,
  topSender,
} from "../data/fakeData";
import { colors, fonts } from "../theme";

const Card: React.FC<{
  eyebrow: string;
  initials: string;
  headline: string;
  line: string;
  stats: string[];
  footer: string;
  appearAt: number;
  clickAt: number;
}> = ({ eyebrow, initials, headline, line, stats, footer, appearAt, clickAt }) => {
  const frame = useCurrentFrame();
  const local = Math.max(0, frame - appearAt);
  const btnPulse =
    frame >= clickAt && frame < clickAt + 14
      ? interpolate(frame, [clickAt, clickAt + 6, clickAt + 14], [1, 0.93, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;

  return (
    <div
      style={{
        width: 420,
        borderRadius: 20,
        border: `1px solid rgba(255,255,255,0.2)`,
        background: "#0c0c0e",
        padding: "36px 28px 32px",
        textAlign: "center",
        opacity: interpolate(local, [0, 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        scale: interpolate(local, [0, 14], [0.9, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.spring({ damping: 160 }),
          output: "perceptual-scale",
        }),
        boxShadow: "0 0 80px rgba(255,255,255,0.1)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {Array.from({ length: 12 }).map((_, i) => {
        const spark = interpolate(local, [0, 18], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const angle = (i / 12) * Math.PI * 2;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "40%",
              width: 5,
              height: 5,
              borderRadius: 999,
              background: "#fff",
              opacity: interpolate(spark, [0, 0.3, 1], [0, 1, 0]),
              translate: `${Math.cos(angle) * 90 * spark}px ${Math.sin(angle) * 90 * spark - 40 * spark}px`,
            }}
          />
        );
      })}

      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: colors.zinc500,
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          margin: "18px auto 0",
          width: 64,
          height: 64,
          borderRadius: 999,
          background: colors.white,
          color: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.display,
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        {initials}
      </div>
      <div
        style={{
          marginTop: 18,
          fontFamily: fonts.display,
          fontSize: 28,
          color: colors.white,
          letterSpacing: "-0.03em",
        }}
      >
        {headline}
      </div>
      <div
        style={{
          marginTop: 14,
          fontSize: 15,
          lineHeight: 1.5,
          color: colors.zinc300,
        }}
      >
        “{line}”
      </div>
      <div
        style={{
          marginTop: 18,
          display: "flex",
          justifyContent: "center",
          gap: 16,
          fontSize: 12,
          color: colors.zinc500,
        }}
      >
        {stats.map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>
      <div
        style={{
          marginTop: 22,
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: colors.zinc600,
        }}
      >
        {footer}
      </div>
      <div
        style={{
          marginTop: 18,
          display: "inline-flex",
          padding: "10px 16px",
          borderRadius: 8,
          background: colors.white,
          color: "#000",
          fontWeight: 600,
          fontSize: 14,
          scale: btnPulse,
          boxShadow:
            frame >= clickAt && frame < clickAt + 12
              ? "0 0 0 6px rgba(255,255,255,0.14)"
              : "none",
        }}
      >
        Download & send
      </div>
    </div>
  );
};

export const SceneCards: React.FC = () => {
  const frame = useCurrentFrame();
  const showThanks = frame >= 70;
  const clickAt = showThanks ? 92 : 45;
  const zoomOrigin = { x: 1000, y: 820 };

  return (
    <AbsoluteFill>
      <LightningBg />
      <Sfx file="pop.wav" at={0} volume={0.55} />
      <Sfx file="click.wav" at={45} volume={0.6} />
      <Sfx file="whoosh.wav" at={68} volume={0.35} />
      <Sfx file="pop.wav" at={70} volume={0.5} />
      <Sfx file="click.wav" at={92} volume={0.6} />
      <Sfx file="success.wav" at={48} volume={0.4} />
      <Sfx file="success.wav" at={95} volume={0.4} />

      <ClickZoom
        clickAt={clickAt}
        originX={zoomOrigin.x}
        originY={zoomOrigin.y}
        amount={1.2}
      >
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {!showThanks ? (
            <Card
              appearAt={0}
              clickAt={45}
              eyebrow="Giver · top recipient"
              initials="AO"
              headline={`${topRecipient.name.split(" ")[0]}, you're my top recipient`}
              line={celebrationLine}
              stats={["22% of sends", "₦198k", "4 txns"]}
              footer="Check who you give the most"
            />
          ) : (
            <Card
              appearAt={70}
              clickAt={92}
              eyebrow="Giver · top sender"
              initials="BL"
              headline={`${topSender.name.split(" ")[0]}, thank you`}
              line={thankYouLine}
              stats={["38% of received", "₦215k", "14 txns"]}
              footer="With thanks · from Giver"
            />
          )}
        </AbsoluteFill>
      </ClickZoom>

      <Cursor
        path={
          showThanks
            ? [
                { x: 1100, y: 780, at: 70 },
                { x: zoomOrigin.x, y: zoomOrigin.y, at: 95 },
              ]
            : [
                { x: 900, y: 200, at: 0 },
                { x: zoomOrigin.x, y: zoomOrigin.y, at: 40 },
              ]
        }
        clickAt={clickAt}
      />
    </AbsoluteFill>
  );
};
