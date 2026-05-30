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

  const audioBlob = await fetch(audioDataUrl).then((res) => res.blob());
  formData.append("audio", audioBlob, audioName || "audio.mp3");

  const projectBlob = new Blob(
    [JSON.stringify({ slides, subtitles, videoSize, language })],
    { type: "application/json" }
  );

  formData.append("project", projectBlob, "project.json");

  const response = await fetch(`${BACKEND_URL}/api/download/mp4`, {
    method: "POST",
    body: formData
  });

  const started = await response.json();

  if (!response.ok || !started.jobId) {
    throw new Error(started.error || "Backend render failed to start.");
  }

  return new Promise((resolve, reject) => {
    const timer = setInterval(async () => {
      try {
        const progressResponse = await fetch(
          `${BACKEND_URL}/api/render-progress/${started.jobId}`
        );

        const progress = await progressResponse.json();
        onProgress?.(progress);

        if (progress.status === "complete") {
          clearInterval(timer);
          resolve(progress);
        }

        if (progress.status === "failed") {
          clearInterval(timer);
          reject(new Error(progress.message || "Backend render failed."));
        }
      } catch (err) {
        clearInterval(timer);
        reject(err);
      }
    }, 1000);
  });
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