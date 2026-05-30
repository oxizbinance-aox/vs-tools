import React from "react";

function normalizeSlideImages(slide) {
  const images = Array.isArray(slide?.images) ? slide.images.filter(Boolean) : [];
  if (images.length > 0) return images;
  if (slide?.url) return [{ name: slide.name || "Image", url: slide.url }];
  return [];
}

function easeInOut(t) {
  const x = Math.max(0, Math.min(1, Number(t) || 0));
  return x * x * (3 - 2 * x);
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
      background: "#000",
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
      background: "#000",
    };
  }

  if (layoutType === "collage") {
    const collage = [
      { left: "4%", top: "6%", width: "58%", height: "57%", zIndex: 3, rotate: "-2deg" },
      { right: "5%", top: "11%", width: "42%", height: "37%", zIndex: 4, rotate: "3deg" },
      { left: "12%", bottom: "7%", width: "38%", height: "33%", zIndex: 5, rotate: "2deg" },
      { right: "8%", bottom: "8%", width: "44%", height: "37%", zIndex: 2, rotate: "-3deg" },
    ];

    return {
      position: "absolute",
      overflow: "hidden",
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,.16)",
      boxShadow: "0 10px 28px rgba(0,0,0,.18)",
      transform: `rotate(${collage[index]?.rotate || "0deg"})`,
      background: "#000",
      ...collage[index],
    };
  }

  return {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    background: "#000",
  };
}

function subtitlePositionStyle(position) {
  if (position === "top") {
    return {
      top: "5%",
      bottom: "auto",
      transform: "translateX(-50%)",
    };
  }

  if (position === "center") {
    return {
      top: "50%",
      bottom: "auto",
      transform: "translate(-50%, -50%)",
    };
  }

  return {
    bottom: "4.5%",
    top: "auto",
    transform: "translateX(-50%)",
  };
}

function getSafeFontSize(text, fontSize) {
  const base = Number(fontSize || 42);
  const length = String(text || "").length;

  if (length > 120) return Math.max(18, Math.round(base * 0.58));
  if (length > 85) return Math.max(20, Math.round(base * 0.68));
  if (length > 55) return Math.max(22, Math.round(base * 0.78));
  return base;
}

function subtitleTextStyle(styleName, fontSize, boxEnabled, text) {
  const safeFontSize = getSafeFontSize(text, fontSize);

  const base = {
    fontSize: `clamp(16px, ${Math.max(2.0, safeFontSize / 18)}vw, ${safeFontSize}px)`,
    lineHeight: 1.12,
    textAlign: "center",
    maxWidth: "78%",
    maxHeight: "26%",
    overflow: "hidden",
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
      padding: boxEnabled ? "10px 18px" : 0,
      background: boxEnabled ? "rgba(0,0,0,.34)" : "transparent",
      borderRadius: boxEnabled ? 14 : 0,
      textShadow: "0 2px 10px rgba(0,0,0,.78)",
      border: boxEnabled ? "1px solid rgba(255,255,255,.10)" : "none",
    };
  }

  if (styleName === "youtube") {
    return {
      ...base,
      color: "#ffffff",
      fontFamily: "Arial, Helvetica, sans-serif",
      fontWeight: 900,
      padding: boxEnabled ? "9px 18px" : 0,
      background: boxEnabled ? "rgba(0,0,0,.46)" : "transparent",
      borderRadius: boxEnabled ? 12 : 0,
      textShadow: "0 2px 0 #000, 0 4px 12px rgba(0,0,0,.78)",
    };
  }

  if (styleName === "minimal") {
    return {
      ...base,
      color: "rgba(255,255,255,.95)",
      fontFamily: "Inter, Arial, sans-serif",
      fontWeight: 750,
      padding: boxEnabled ? "8px 16px" : 0,
      background: boxEnabled ? "rgba(0,0,0,.22)" : "transparent",
      backdropFilter: boxEnabled ? "blur(8px)" : "none",
      borderRadius: boxEnabled ? 999 : 0,
      textShadow: "0 3px 14px rgba(0,0,0,.62)",
    };
  }

  return {
    ...base,
    color: "#ffffff",
    fontFamily: "Arial Black, Impact, Arial, sans-serif",
    fontWeight: 1000,
    textTransform: "uppercase",
    letterSpacing: ".015em",
    padding: boxEnabled ? "9px 18px" : 0,
    background: boxEnabled
      ? "linear-gradient(135deg, rgba(255,47,179,.78), rgba(0,0,0,.42))"
      : "transparent",
    borderRadius: boxEnabled ? 14 : 0,
    textShadow: "0 2px 0 #000, 0 6px 16px rgba(0,0,0,.78)",
    WebkitTextStroke: "0.7px rgba(0,0,0,.65)",
    boxShadow: boxEnabled ? "0 10px 26px rgba(0,0,0,.24)" : "none",
  };
}

function backgroundForLayout(layoutType) {
  if (layoutType === "collage") {
    return "radial-gradient(circle at top left, rgba(255,47,179,.08), transparent 35%), linear-gradient(135deg,#09000d,#101010,#070707)";
  }

  return "#070707";
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

  const duration = Math.max(0.1, Number(current.end || 0) - Number(current.start || 0));
  const rawProgress = (Number(audioTime || 0) - Number(current.start || 0)) / duration;
  const progress = Math.max(0, Math.min(1, rawProgress));
  const smoothProgress = easeInOut(progress);

  const baseZoom = Number(current.zoom || 1);
  const zoom = baseZoom + smoothProgress * 0.18;

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
        background: backgroundForLayout(layoutType)
      }}
      onClick={handlePreviewClick}
    >
      {visibleImages.map((image, index) => {
        const isSingle = layoutType === "single";
        const safeTranslateX = Number(current.x || 0) / (isSingle ? 1 : 6);
        const safeTranslateY = Number(current.y || 0) / (isSingle ? 1 : 6);
        const safeZoom = isSingle ? zoom : Math.min(1.12, zoom);

        return (
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
                  translate(${safeTranslateX}px, ${safeTranslateY}px)
                  scale(${safeZoom})
                `,
                transition: "transform .55s cubic-bezier(.22,.61,.36,1), transform-origin .55s ease",
                willChange: "transform, transform-origin",
                background: "transparent",
                display: "block",
                backfaceVisibility: "hidden",
              }}
            />
          </div>
        );
      })}

      {layoutType !== "single" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            boxShadow: "inset 0 0 18px rgba(0,0,0,.05)",
            pointerEvents: "none",
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
            boxShadow: "0 0 0 9999px rgba(0,0,0,.04), 0 0 24px rgba(255,47,179,.75)",
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
            pointerEvents: "none",
            ...subtitlePositionStyle(subtitlePosition),
          }}
        >
          <div style={subtitleTextStyle(subtitleStyle, subtitleFontSize, subtitleBoxEnabled, activeSubtitle.text)}>
            {activeSubtitle.text}
          </div>
        </div>
      )}
    </div>
  );
}
