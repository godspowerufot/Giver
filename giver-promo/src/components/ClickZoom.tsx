import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";

/**
 * Camera push-in toward a click target.
 * Wrap scene UI (not the cursor) so the pointer stays screen-locked.
 */
export const ClickZoom: React.FC<{
  clickAt: number;
  originX: number;
  originY: number;
  amount?: number;
  children: React.ReactNode;
}> = ({ clickAt, originX, originY, amount = 1.16, children }) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(
    frame,
    [clickAt, clickAt + 7, clickAt + 24],
    [1, amount, amount * 0.96],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    },
  );

  return (
    <AbsoluteFill
      style={{
        scale: zoom,
        transformOrigin: `${originX}px ${originY}px`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
