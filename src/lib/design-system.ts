const rasterEmbeddedSvgProvenance =
  "Copied from docs/website/assets/; SVG wrapper embeds source PNG data rather than native path geometry.";

export const brandAssets = {
  lockup: {
    src: "/brand/glaux-lockup.svg",
    width: 270,
    height: 88,
    alt: "Glaux logo",
    minWidth: 120,
    kind: "raster-embedded-svg",
    provenance: `${rasterEmbeddedSvgProvenance} Source: docs/website/assets/glaux-lockup.svg.`,
    geometryPolicy: "preserve-source-geometry",
  },
  mark: {
    src: "/brand/glaux-mark.svg",
    width: 334,
    height: 549,
    alt: "Glaux owl mark",
    minWidth: 24,
    kind: "raster-embedded-svg",
    provenance: `${rasterEmbeddedSvgProvenance} Source: docs/website/assets/glaux-mark.svg.`,
    geometryPolicy: "preserve-source-geometry",
  },
  reversedMark: {
    src: "/brand/glaux-mark-reversed.svg",
    width: 334,
    height: 549,
    alt: "Glaux owl mark reversed",
    minWidth: 24,
    kind: "raster-embedded-svg",
    provenance: `${rasterEmbeddedSvgProvenance} Source: docs/website/assets/glaux-mark-reversed.svg.`,
    geometryPolicy: "preserve-source-geometry",
  },
} as const;

export const previewBadges = [
  { label: "Skill Hub Preview" },
  { label: "Enterprise MCP Preview" },
  { label: "Observability Preview" },
  { label: "Build your own model Coming soon" },
] as const;
