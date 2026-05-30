import React from "react";

function normalizeSlideImages(slide) {
  const images = Array.isArray(slide?.images) ? slide.images.filter(Boolean) : [];
  if (images.length > 0) return images;
  if (slide?.url) return [{ name: slide.name || "Image", url: slide.url }];
  return [];
}

function cellStyle(layoutType, index) {
  if (layoutType === "split2") {
    return {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: index === 0 ? 0 : "50%",
      width: "50%",
      overflow: "hidden",
    };
  }

  if (layoutType === "grid4") {
    return {
      position: "absolute",
      left: index % 2 === 0 ? 0 : "50%",
      top: index < 2 ? 0 : "50%",
      width: "50%",
      height: "50%",
      overflow: "hidden",
    };
  }

  if (layoutType === "collage") {
    const collage = [
      { left: "4%", top: "7%", width: "58%", height: "58%", zIndex: 3, rotate: "-2deg" },
      { right: "5%", top: "12%", width: "42%", height: "38%", zIndex: 4, rotate: "3deg" },
      { left: "12%", bottom: "7%", width: "38%", height: "34%", zIndex: 5, rotate: "2deg" },
      { right: "8%", bottom: "8%", width: "44%", height: "38%", zIndex: 2, rotate: "-3deg" },
    ];

    return {
      position: "absolute",
      overflow: "hidden",
      borderRadius: 18,
      border: "2px solid rgba(255,255,255,.18)",
      boxShadow: "0 18px 50px rgba(0,0,0,.42)",
      transform: `rotate(${collage[index]?.rotate || "0deg"})`,
      ...collage[index],
    };
  }

  return {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
  };
}

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

  const duration = Math.max(0.1, current.end - current.start);
  const progress = Math.max(0, Math.min(1, (audioTime - current.start) / duration));
  const zoom = Number(current.zoom || 1) + progress * 0.25;
  const images = normalizeSlideImages(current);
  const layoutType = current.layoutType || "single";
  const visibleImages = layoutType === "single" ? images.slice(0, 1) : images.slice(0, 4);

  return (
    <div
      style={{
        height: "100%",
        overflow: "hidden",
        position: "absolute",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
        background:
          layoutType === "collage"
            ? "radial-gradient(circle at top left, rgba(255,47,179,.18), transparent 35%), linear-gradient(135deg,#050008,#111,#000)"
            : "#000"
      }}
    >
      {visibleImages.map((image, index) => (
        <div key={`${image.url}-${index}`} style={cellStyle(layoutType, index)}>
          <img
            src={image.url}
            alt={image.name || current.name || `Slide image ${index + 1}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: current.fit === "contain" ? "contain" : "cover",
              transform: `
                translate(${Number(current.x || 0) / (layoutType === "single" ? 1 : 5)}px, ${Number(current.y || 0) / (layoutType === "single" ? 1 : 5)}px)
                scale(${layoutType === "single" ? zoom : Math.min(1.18, zoom)})
              `,
              transition: "transform .1s linear",
              background: "#000",
              display: "block"
            }}
          />
        </div>
      ))}

      {layoutType !== "single" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            boxShadow: "inset 0 0 120px rgba(0,0,0,.42)",
          }}
        />
      )}
    </div>
  );
}
