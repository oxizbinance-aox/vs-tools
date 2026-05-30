export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(blob);
  });
}

export function saveProjectFile(project) {
  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "vs-tools-project.vstools";
  a.click();

  URL.revokeObjectURL(url);
}

export function loadProjectFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result));
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = reject;

    reader.readAsText(file);
  });
}

export function buildProjectPayload({
  language,
  slides,
  subtitles,
  audioDataUrl,
  audioName,
  audioDuration,
  videoSize,

  subtitleStyle,
  subtitlePosition,
  subtitleFontSize,
  subtitleBoxEnabled
}) {
  return {
    version: "vs-tools-final-max",
    language,
    slides,
    subtitles,
    audioDataUrl,
    audioName,
    audioDuration,
    videoSize,

    subtitleStyle,
    subtitlePosition,
    subtitleFontSize,
    subtitleBoxEnabled,

    savedAt: new Date().toISOString()
  };
}