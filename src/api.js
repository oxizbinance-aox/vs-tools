import { BACKEND_URL } from "./presets";

function mapAnimationToEffect(animation) {
  const map = {
    none: "none",
    zoomIn: "zoom_in",
    zoomOut: "zoom_out",
    panLeft: "pan_left",
    panRight: "pan_right",
    panUp: "pan_up",
    panDown: "pan_down",
    pulse: "pulse",
    rotateSlow: "rotate_zoom",
    blurReveal: "blur_zoom",

    kenBurns: "manual_zoom",
    cinematicPush: "zoom_in",
    documentaryMove: "cinematic",
    heroZoom: "zoom_in",
    dramaticPull: "zoom_out",
    smoothSlide: "pan_right",
    parallaxLeft: "pan_left",
    parallaxRight: "pan_right",
    luxuryFloat: "pulse",
    techScan: "pan_right",
    blockchainPulse: "pulse",
    natureSway: "pan_left",
    paperFloat: "pan_down",
    vhsJitter: "pulse",
    slowDrift: "cinematic",
    floating: "cinematic",
    softBreath: "pulse",
    orbit: "rotate_zoom",
    tiltLeft: "rotate_zoom",
    tiltRight: "rotate_zoom",
    microShake: "pulse"
  };

  return map[animation] || "cinematic";
}

function prepareTimelineForBackend(slides = []) {
  return slides.map((slide) => {
    const duration = Math.max(0.2, Number(slide.end || 0) - Number(slide.start || 0));

    return {
      ...slide,
      duration,
      effect: mapAnimationToEffect(slide.animation),
      zoomStart: Number(slide.zoomStart || 1),
      zoomEnd: Number(slide.zoomEnd || Math.max(1.12, Number(slide.zoom || 1) + 0.18)),
      focusX: Number(slide.focusX ?? 0.5),
      focusY: Number(slide.focusY ?? 0.5),
      transition: slide.transition || "fade"
    };
  });
}

export async function startBackendRender({
  slides,
  subtitles,
  videoSize,
  language,
  audioDataUrl,
  audioName,
  onProgress
}) {
  const formData = new FormData();

  for (let i = 0; i < slides.length; i++) {
    const imageBlob = await fetch(slides[i].url).then((res) => res.blob());
    formData.append("images", imageBlob, `slide-${i + 1}.png`);
  }

  if (audioDataUrl) {
    const audioBlob = await fetch(audioDataUrl).then((res) => res.blob());
    formData.append("audio", audioBlob, audioName || "audio.mp3");
  }

  formData.append("timeline", JSON.stringify(prepareTimelineForBackend(slides || [])));
  formData.append("subtitles", JSON.stringify(subtitles || []));
  formData.append("language", language || "id");
  formData.append("filename", "result.mp4");

  if (videoSize) {
    formData.append("width", String(videoSize.width || 1280));
    formData.append("height", String(videoSize.height || 720));
  }

  onProgress?.({
    status: "rendering",
    progress: 10,
    message: "Rendering video..."
  });

  const response = await fetch(`${BACKEND_URL}/api/video/timeline`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Backend render failed.");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "result.mp4";
  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);

  onProgress?.({
    status: "complete",
    progress: 100,
    message: "Download complete"
  });

  return {
    status: "complete",
    progress: 100
  };
}

export async function removeObjectWithBackend(imageBlob, maskBlob) {
  const formData = new FormData();

  formData.append("image", imageBlob, "image.png");
  formData.append("mask", maskBlob, "mask.png");

  const response = await fetch(`${BACKEND_URL}/api/remove-object`, {
    method: "POST",
    body: formData
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Remove object failed.");
  }

  return result.image;
}

export async function generateAutoSubtitle(audioBlob) {
  const formData = new FormData();

  formData.append("audio", audioBlob, "audio.mp3");

  const response = await fetch(`${BACKEND_URL}/api/auto-subtitle`, {
    method: "POST",
    body: formData
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Auto subtitle failed.");
  }

  return result.subtitles || [];
}