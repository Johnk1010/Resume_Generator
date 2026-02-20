import type { FontOption, ResumeTheme } from "@curriculo/shared";

export const fontFamilyMap: Record<FontOption, string> = {
  sourceSans: "'Source Sans 3', sans-serif",
  merriweather: "'Merriweather', serif",
  montserrat: "'Montserrat', sans-serif"
};

export const baseThemeStyle = (theme: ResumeTheme): React.CSSProperties => ({
  color: theme.textColor,
  fontFamily: fontFamilyMap[theme.font],
  fontSize: theme.fontSizeLevel === "large" ? 16 : 14,
  lineHeight: theme.spacing === "comfortable" ? 1.5 : 1.35
});

export const sectionGapClass = (theme: ResumeTheme): string =>
  theme.spacing === "comfortable" ? "space-y-4" : "space-y-2";

