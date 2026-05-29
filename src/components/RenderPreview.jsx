import React from "react";

export default function RenderPreview({
  slides,
  audioTime,
  selectedSize
}) {
  const current =
    slides.find(
      slide =>
        audioTime >= slide.start &&
        audioTime < slide.end
    ) || slides[0];

  if (!current) {
    return (
      <div style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff"
      }}>
        No Slides
      </div>
    );
  }

  const duration =
    current.end - current.start;

  const progress =
    Math.max(
      0,
      Math.min(
        1,
        (audioTime - current.start) /
        duration
      )
    );

  const zoom =
    current.zoom +
    progress * 0.25;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "absolute",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none"
      }}
    >
      <img
        src={current.url}
        alt={current.name}
        style={{
          width: "100%",
          height: "100%",
          objectFit:
            current.fit === "contain"
              ? "contain"
              : "cover",
          transform: `
            translate(${current.x}px, ${current.y}px)
            scale(${zoom})
          `,
          transition: "transform .1s linear"
        }}
      />
    </div>
  );
}
