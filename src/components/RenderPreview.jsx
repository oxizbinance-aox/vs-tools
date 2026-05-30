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

function subtitlePositionStyle(position) {
  if (position === "top") {
    return { top: "8%", bottom: "auto", transform: "translateX(-50%)" };
  }

  if (position === "center") {
    return { top: "50%", bottom: "auto", transform: "translate(-50%, -50%)" };
  }

  return { bottom: "9%", top: "auto", transform: "translateX(-50%)" };
}

function subtitleTextStyle(styleName, fontSize, boxEnabled) {
  const base = {
    fontSize: `clamp(18px, ${Math.max(2.6, Number(fontSize || 42) / 16)}vw, ${Number(fontSize || 42)}px)`,
    lineHeight: 1.14,
    textAlign: "center",
    maxWidth: "86%",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  };

  if (styleName === "documentary") {
    return {
      ...base,
      color: "#fff",
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontWeight: 700,
      letterSpacing: ".01em",
      padding: boxEnabled ? "14px 24px" : 0,
      background: boxEnabled ? "rgba(0,0,0,.48)" : "transparent",
      borderRadius: boxEnabled ? 18 : 0,
      textShadow: "0 3px 12px rgba(0,0,0,.85)",
      border: boxEnabled ? "1px solid rgba(255,255,255,.14)" : "none",
    };
  }

  if (styleName === "youtube") {
    return {
      ...base,
      color: "#ffffff",
      fontFamily: "Arial, Helvetica, sans-serif",
      fontWeight: 900,
      padding: boxEnabled ? "12px 22px" : 0,
      background: boxEnabled ? "rgba(0,0,0,.70)" : "transparent",
      borderRadius: boxEnabled ? 14 : 0,
      textShadow: "0 2px 0 #000, 0 5px 16px rgba(0,0,0,.9)",
    };
  }

  if (styleName === "minimal") {
    return {
      ...base,
      color: "rgba(255,255,255,.94)",
      fontFamily: "Inter, Arial, sans-serif",
      fontWeight: 700,
      padding: boxEnabled ? "10px 18px" : 0,
      background: boxEnabled ? "rgba(255,255,255,.10)" : "transparent",
      backdropFilter: boxEnabled ? "blur(10px)" : "none",
      borderRadius: boxEnabled ? 999 : 0,
      textShadow: "0 4px 18px rgba(0,0,0,.65)",
    };
  }

  return {
    ...base,
    color: "#ffffff",
    fontFamily: "Arial Black, Impact, Arial, sans-serif",
    fontWeight: 1000,
    textTransform: "uppercase",
    letterSpacing: ".02em",
    padding: boxEnabled ? "12px 22px" : 0,
    background: boxEnabled
      ? "linear-gradient(135deg, rgba(255,47,179,.92), rgba(0,0,0,.72))"
      : "transparent",
    borderRadius: boxEnabled ? 18 : 0,
    textShadow: "0 3px 0 #000, 0 8px 20px rgba(0,0,0,.85)",
    WebkitTextStroke: "1px rgba(0,0,0,.75)",
    boxShadow: boxEnabled ? "0 18px 48px rgba(0,0,0,.42)" : "none",
  };
}

export default function RenderPreview({
  slides,
  subtitles = [],
  audioTime,
  selectedSize,
  subtitleStyle = "tiktok",
  subtitlePosition = "bottom",
  subtitleFontSize = 42,
  subtitleBoxEnabled = true,
  focusPickMode = false,
  onSetFocusPoint,
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
  const focusX = Math.max(0, Math.min(100, Number(current.focusX ?? 50)));
  const focusY = Math.max(0, Math.min(100, Number(current.focusY ?? 50)));
  const images = normalizeSlideImages(current);
  const layoutType = current.layoutType || "single";
  const visibleImages = layoutType === "single" ? images.slice(0, 1) : images.slice(0, 4);
  const activeSubtitle = subtitles.find(
    subtitle => audioTime >= Number(subtitle.start || 0) && audioTime <= Number(subtitle.end || 0)
  );

  function handlePreviewClick(event) {
    if (!focusPickMode || typeof onSetFocusPoint !== "function") return;

    const rect = event.currentTarget.getBoundingClientRect();
    const nextFocusX = ((event.clientX - rect.left) / rect.width) * 100;
    const nextFocusY = ((event.clientY - rect.top) / rect.height) * 100;

    onSetFocusPoint(
      Math.max(0, Math.min(100, nextFocusX)),
      Math.max(0, Math.min(100, nextFocusY))
    );
  }

  return (
    <div
      style={{
        height: "100%",
        overflow: "hidden",
        position: "absolute",
        inset: 0,
        zIndex: 1,
        pointerEvents: focusPickMode ? "auto" : "none",
        cursor: focusPickMode ? "crosshair" : "default",
        background:
          layoutType === "collage"
            ? "radial-gradient(circle at top left, rgba(255,47,179,.18), transparent 35%), linear-gradient(135deg,#050008,#111,#000)"
            : "#000"
      }}
      onClick={handlePreviewClick}
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
              transformOrigin: `${focusX}% ${focusY}%`,
              transform: `
                translate(${Number(current.x || 0) / (layoutType === "single" ? 1 : 5)}px, ${Number(current.y || 0) / (layoutType === "single" ? 1 : 5)}px)
                scale(${layoutType === "single" ? zoom : Math.min(1.18, zoom)})
              `,
              transition: "transform .1s linear, transform-origin .18s ease",
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

      {focusPickMode && (
        <div
          style={{
            position: "absolute",
            left: `${focusX}%`,
            top: `${focusY}%`,
            width: 34,
            height: 34,
            borderRadius: "50%",
            border: "2px solid rgba(255,47,179,.95)",
            boxShadow: "0 0 0 9999px rgba(0,0,0,.18), 0 0 24px rgba(255,47,179,.85)",
            transform: "translate(-50%, -50%)",
            zIndex: 34,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: -12,
              bottom: -12,
              width: 2,
              background: "rgba(255,255,255,.85)",
              transform: "translateX(-50%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: -12,
              right: -12,
              height: 2,
              background: "rgba(255,255,255,.85)",
              transform: "translateY(-50%)",
            }}
          />
        </div>
      )}

      {activeSubtitle?.text && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            zIndex: 35,
            display: "flex",
            justifyContent: "center",
            width: "100%",
            padding: "0 18px",
            ...subtitlePositionStyle(subtitlePosition),
          }}
        >
          <div style={subtitleTextStyle(subtitleStyle, subtitleFontSize, subtitleBoxEnabled)}>
            {activeSubtitle.text}
          </div>
        </div>
      )}
    </div>
  );
}
