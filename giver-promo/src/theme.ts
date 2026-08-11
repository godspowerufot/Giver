export const colors = {
  bg: "#070708",
  bgElevated: "#0a0a0c",
  panel: "rgba(255,255,255,0.03)",
  line: "rgba(255,255,255,0.12)",
  white: "#ffffff",
  zinc100: "#f4f4f5",
  zinc300: "#d4d4d8",
  zinc400: "#a1a1aa",
  zinc500: "#71717a",
  zinc600: "#52525b",
};

export const fonts = {
  display: '"Syne", sans-serif',
  body: '"Outfit", sans-serif',
};

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
/** Crossfade between scenes — slower so UI can be read */
export const FADE_FRAMES = 18;
/**
 * Scene frames: 360+126+186+132+156+84 = 1044
 * Minus 5 × 18f fade overlaps = 954 (~31.8s)
 */
export const DURATION = 954;
