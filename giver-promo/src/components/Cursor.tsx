import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { colors } from "../theme";

type Point = { x: number; y: number; at: number };

export const Cursor: React.FC<{
  path: Point[];
  clickAt?: number;
}> = ({ path, clickAt }) => {
  const frame = useCurrentFrame();
  if (path.length === 0) return null;

  let x = path[0]!.x;
  let y = path[0]!.y;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i]!;
    const b = path[i + 1]!;
    if (frame >= a.at && frame <= b.at) {
      const t = interpolate(frame, [a.at, b.at], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      });
      x = a.x + (b.x - a.x) * t;
      y = a.y + (b.y - a.y) * t;
      break;
    }
    if (frame > b.at) {
      x = b.x;
      y = b.y;
    }
  }

  const clicking =
    clickAt !== undefined && frame >= clickAt && frame < clickAt + 8;
  const scale = clicking
    ? interpolate(frame, [clickAt!, clickAt! + 4, clickAt! + 8], [1, 0.85, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        scale,
        zIndex: 100,
        pointerEvents: "none",
        filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))",
      }}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 3L20 12.5L12.2 14.2L9.5 21.5L4 3Z"
          fill={colors.white}
          stroke="#111"
          strokeWidth="1"
        />
      </svg>
      {clicking ? (
        <div
          style={{
            position: "absolute",
            left: -6,
            top: -6,
            width: 22,
            height: 22,
            borderRadius: 999,
            border: "2px solid rgba(255,255,255,0.7)",
            opacity: interpolate(
              frame,
              [clickAt!, clickAt! + 8],
              [0.8, 0],
              { extrapolateRight: "clamp" },
            ),
            scale: interpolate(
              frame,
              [clickAt!, clickAt! + 8],
              [0.6, 1.6],
              { extrapolateRight: "clamp" },
            ),
          }}
        />
      ) : null}
    </div>
  );
};
