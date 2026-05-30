import { BACKEND_URL } from "./presets";

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

  formData.append("timeline", JSON.stringify(slides || []));
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