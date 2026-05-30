import React, { useEffect, useRef, useState } from "react";
import {
  Upload, Music, Save, FolderOpen, Play, Pause, Download, Trash2,
  Move, Wand2, Scissors, Sparkles
} from "lucide-react";
import { removeBackground } from "@imgly/background-removal";

import {
  TEXT, VIDEO_SIZES, BACKGROUNDS, BACKGROUND_LABELS,
  TRANSITIONS, TRANSITION_LABELS, ANIMATIONS, ANIMATION_LABELS
} from "./presets";

import { styles } from "./styles";
import {
  fileToDataUrl, blobToDataUrl, saveProjectFile,
  loadProjectFile, buildProjectPayload
} from "./projectStorage";

import { startBackendRender, generateAutoSubtitle } from "./api";
import MaskEditor from "./components/MaskEditor";
import AuthPanel from "./components/AuthPanel";
import CloudProjects from "./components/CloudProjects";
import TemplateMarketplace from "./components/TemplateMarketplace";
import AdvancedWaveform from "./components/AdvancedWaveform";
import RenderPreview from "./components/RenderPreview";


const messyBrandStyles = {
  heroHeader: {
    position: "relative",
    maxWidth: 1360,
    margin: "0 auto 24px",
    padding: "34px 28px 28px",
    borderRadius: 34,
    overflow: "hidden",
    textAlign: "center",
    background:
      "radial-gradient(circle at top center, rgba(255,47,179,.30), transparent 34%), radial-gradient(circle at bottom left, rgba(255,255,255,.10), transparent 28%), linear-gradient(135deg, rgba(24,0,24,.92), rgba(9,0,18,.96), rgba(0,0,0,.96))",
    border: "1px solid rgba(255,255,255,.12)",
    boxShadow: "0 24px 80px rgba(0,0,0,.42)",
  },

  heroContent: {
    position: "relative",
    zIndex: 2,
  },

  heroLogoWrap: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  heroLogo: {
    width: 120,
    height: 120,
    objectFit: "contain",
    borderRadius: 26,
    filter:
      "drop-shadow(0 0 18px rgba(255,47,179,.75)) drop-shadow(0 0 34px rgba(255,47,179,.35))",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "4px auto 12px",
    padding: "9px 16px",
    borderRadius: 999,
    background: "rgba(255,47,179,.13)",
    border: "1px solid rgba(255,47,179,.42)",
    color: "#ff8bd8",
    fontSize: 13,
    fontWeight: 950,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },

  title: {
    margin: "0 auto 14px",
    maxWidth: 980,
    fontSize: "clamp(46px, 7.4vw, 102px)",
    lineHeight: 0.96,
    fontWeight: 1000,
    letterSpacing: "-0.055em",
    textAlign: "center",
    color: "#fff",
    textShadow: "0 10px 32px rgba(0,0,0,.55)",
    whiteSpace: "normal",
    overflow: "visible",
  },

  titleText: {
    display: "inline-block",
    background: "linear-gradient(180deg, #ffffff 0%, #eeeeff 55%, #cfcfe8 100%)",
    WebkitBackgroundClip: "text",
    color: "transparent",
  },

  titlePink: {
    display: "inline-block",
    marginLeft: 16,
    background: "linear-gradient(180deg, #ff80d4 0%, #ff2fb3 55%, #b50074 100%)",
    WebkitBackgroundClip: "text",
    color: "transparent",
    textShadow: "0 0 36px rgba(255,47,179,.35)",
  },

  subtitle: {
    maxWidth: 860,
    margin: "0 auto 26px",
    textAlign: "center",
    fontSize: "clamp(16px, 1.55vw, 22px)",
    lineHeight: 1.48,
    color: "rgba(255,255,255,.80)",
    textWrap: "balance",
  },

  actions: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
    marginTop: 10,
  },

  actionButton: {
    minHeight: 56,
    padding: "15px 22px",
    borderRadius: 18,
    fontSize: 16,
    boxShadow: "0 14px 34px rgba(0,0,0,.24)",
  },

  languageSelect: {
    minHeight: 56,
    borderRadius: 18,
    padding: "0 18px",
  },

  glowLine: {
    position: "absolute",
    left: "50%",
    top: 132,
    width: "min(680px, 72%)",
    height: 1,
    transform: "translateX(-50%)",
    background:
      "linear-gradient(90deg, transparent, rgba(255,47,179,.70), rgba(255,255,255,.80), rgba(255,47,179,.70), transparent)",
    opacity: .65,
  },

  mobileHint: {
    fontSize: 12,
    color: "rgba(255,255,255,.55)",
    marginTop: 8,
  },
};


const LAYOUT_OPTIONS = [
  { value: "single", label: "Single Image" },
  { value: "split2", label: "Split Screen 2" },
  { value: "grid4", label: "Grid 4 Images" },
  { value: "collage", label: "Collage" },
];

const SUBTITLE_STYLE_OPTIONS = [
  { value: "tiktok", label: "TikTok Bold" },
  { value: "documentary", label: "Documentary" },
  { value: "youtube", label: "YouTube Clean" },
  { value: "minimal", label: "Minimal" },
];

const SUBTITLE_POSITION_OPTIONS = [
  { value: "top", label: "Top" },
  { value: "center", label: "Center" },
  { value: "bottom", label: "Bottom" },
];

function normalizeSlideImages(slide) {
  const images = Array.isArray(slide?.images) ? slide.images.filter(Boolean) : [];
  if (images.length > 0) return images;
  if (slide?.url) return [{ name: slide.name || "Image", url: slide.url }];
  return [];
}

export default function App() {
  const [language, setLanguage] = useState("id");
  const [slides, setSlides] = useState([]);
  const [active, setActive] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioDataUrl, setAudioDataUrl] = useState(null);
  const [audioName, setAudioName] = useState("");
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioTime, setAudioTime] = useState(0);
  const [videoSize, setVideoSize] = useState("landscape");
  const [subtitles, setSubtitles] = useState([]);
  const [subtitleStyle, setSubtitleStyle] = useState("tiktok");
  const [subtitlePosition, setSubtitlePosition] = useState("bottom");
  const [subtitleFontSize, setSubtitleFontSize] = useState(42);
  const [subtitleBoxEnabled, setSubtitleBoxEnabled] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState("");
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [maskOpen, setMaskOpen] = useState(false);
  const [user, setUser] = useState(null);

  const audioRef = useRef(null);
  const t = TEXT[language];
  const current =
  slides.find(
    (slide) =>
      audioTime >= slide.start &&
      audioTime < slide.end
  ) || slides[active];
  const selectedSize = VIDEO_SIZES[videoSize];

  useEffect(() => {
  if (!playing || !audioRef.current) return;

  const timer = setInterval(() => {
    const time = audioRef.current.currentTime;
    setAudioTime(time);

    const index = slides.findIndex(
      (s) => time >= s.start && time < s.end
    );

    if (index >= 0) {
      setActive(index);
    }

    if (audioRef.current.ended) {
      setPlaying(false);
    }
  }, 200);

  return () => clearInterval(timer);
}, [playing, slides]);

  function formatTime(sec) {
    if (!Number.isFinite(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function getProjectData() {
    return buildProjectPayload({
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
    });
  }

  function loadProjectData(project) {
    setLanguage(project.language || "id");
    setSlides(project.slides || []);
    setSubtitles(project.subtitles || []);
    setSubtitleStyle(project.subtitleStyle || "tiktok");
    setSubtitlePosition(project.subtitlePosition || "bottom");
    setSubtitleFontSize(Number(project.subtitleFontSize || 42));
    setSubtitleBoxEnabled(project.subtitleBoxEnabled !== false);
    setAudioDataUrl(project.audioDataUrl || null);
    setAudioUrl(project.audioDataUrl || null);
    setAudioName(project.audioName || "");
    setAudioDuration(project.audioDuration || 0);
    setVideoSize(project.videoSize || "landscape");
    setActive(0);
  }

  async function uploadImages(e) {
    const files = Array.from(e.target.files || []);
    const baseStart = slides.length ? slides[slides.length - 1].end : 0;
    const next = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;

      const url = await fileToDataUrl(file);
      const start = baseStart + i * 5;

      next.push({
        id: Date.now() + i,
        name: file.name,
        url,
        images: [{ name: file.name, url }],
        layoutType: "single",
        start,
        end: start + 5,
        fit: "cover",
        zoom: 1,
        x: 0,
        y: 0,
        transition: "fade",
        animation: "zoomIn",
        background: "pinkSilver",
      });
    }

    setSlides((prev) => [...prev, ...next]);
  }

  async function uploadAudio(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const dataUrl = await fileToDataUrl(file);
    setAudioDataUrl(dataUrl);
    setAudioUrl(dataUrl);
    setAudioName(file.name);

    const audio = new Audio(dataUrl);
    audio.onloadedmetadata = () => setAudioDuration(audio.duration || 0);
  }

  function updateSlide(key, value) {
    setSlides((prev) =>
      prev.map((slide, index) =>
        index === active ? { ...slide, [key]: value } : slide
      )
    );
  }

  function updateSlidePatch(patch) {
    setSlides((prev) =>
      prev.map((slide, index) =>
        index === active ? { ...slide, ...patch } : slide
      )
    );
  }

  async function addImagesToCurrentSlide(e) {
    const files = Array.from(e.target.files || []);
    if (!current) return alert("Pilih slide dulu.");
    if (!files.length) return;

    const currentImages = normalizeSlideImages(current);
    const nextImages = [...currentImages];

    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      if (nextImages.length >= 4) break;
      const url = await fileToDataUrl(file);
      nextImages.push({ name: file.name, url });
    }

    updateSlidePatch({
      images: nextImages,
      url: nextImages[0]?.url || current.url,
      name: nextImages[0]?.name || current.name,
      layoutType: nextImages.length >= 4 ? "grid4" : nextImages.length >= 2 ? "split2" : "single",
    });

    e.target.value = "";
  }

  function removeLayoutImage(indexToRemove) {
    if (!current) return;
    const nextImages = normalizeSlideImages(current).filter((_, index) => index !== indexToRemove);
    const fallback = nextImages[0] || { name: current.name, url: current.url };

    updateSlidePatch({
      images: nextImages.length ? nextImages : [fallback],
      url: fallback.url,
      name: fallback.name,
      layoutType: nextImages.length >= 4 ? "grid4" : nextImages.length >= 2 ? "split2" : "single",
    });
  }

  function updateSubtitle(index, key, value) {
    setSubtitles((prev) =>
      prev.map((sub, i) => (i === index ? { ...sub, [key]: value } : sub))
    );
  }

  function addSubtitle() {
    const start = Number((audioTime || 0).toFixed(2));
    setSubtitles((prev) => [
      ...prev,
      { id: Date.now(), start, end: Number((start + 4).toFixed(2)), text: "Tulis subtitle di sini" },
    ]);
  }

  function deleteSubtitle(id) {
    setSubtitles((prev) => prev.filter((s) => s.id !== id));
  }

  function autoFitToAudio() {
    if (!audioDuration || !slides.length) return alert("Upload audio dan gambar dulu.");

    const perSlide = audioDuration / slides.length;

    setSlides((prev) =>
      prev.map((slide, index) => ({
        ...slide,
        start: Number((index * perSlide).toFixed(2)),
        end: Number(((index + 1) * perSlide).toFixed(2)),
      }))
    );
  }

  function togglePlay() {
    if (!audioRef.current) return alert("Upload audio dulu.");

    setPlaying((prev) => !prev);

    setTimeout(() => {
      if (!audioRef.current) return;
      if (!playing) audioRef.current.play().catch(() => {});
      else audioRef.current.pause();
    }, 100);
  }

  async function removeBgCurrentSlide() {
    if (!current?.url) return alert("Pilih slide dulu.");

    try {
      setExporting(true);
      setExportStatus("Removing background...");
      setExportProgress(25);

      const blob = await removeBackground(current.url);
      const dataUrl = await blobToDataUrl(blob);

      updateSlide("url", dataUrl);

      setExportProgress(100);
      setExportStatus("Background removed.");
    } catch (err) {
      console.error(err);
      alert("Remove background gagal.");
    } finally {
      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
        setExportStatus("");
      }, 900);
    }
  }

  async function autoSubtitleAI() {
    if (!audioDataUrl) return alert("Upload audio dulu.");

    try {
      setExporting(true);
      setExportProgress(20);
      setExportStatus("Generating AI subtitle...");

      const audioBlob = await fetch(audioDataUrl).then((res) => res.blob());
      const result = await generateAutoSubtitle(audioBlob);

      setSubtitles(result);
      setExportProgress(100);
      setExportStatus("AI subtitle complete.");
    } catch (err) {
      console.error(err);
      alert("Auto subtitle AI gagal.");
    } finally {
      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
        setExportStatus("");
      }, 1200);
    }
  }

  async function backendRender() {
    if (!slides.length) return alert("Upload gambar dulu.");
    if (!audioDataUrl) return alert("Upload audio dulu.");

    try {
      setExporting(true);
      setExportStatus("Sending project to backend...");
      setExportProgress(5);

      await startBackendRender({
        slides,
        subtitles,
        videoSize: selectedSize,
        language,
        audioDataUrl,
        audioName,
        subtitleStyle,
        subtitlePosition,
        subtitleFontSize,
        subtitleBoxEnabled,
        onProgress: (progress) => {
          setExportStatus(progress.message || "Rendering...");
          setExportProgress(progress.progress || 0);
        },
      });

      setExportStatus("Download complete.");
      setExportProgress(100);
    } catch (err) {
      console.error(err);
      alert(err?.message || "Download gagal.");
    } finally {
      setTimeout(() => {
        setExporting(false);
        setExportStatus("");
        setExportProgress(0);
      }, 1200);
    }
  }

  function saveLocalProject() {
    saveProjectFile(getProjectData());
  }

  async function loadLocalProject(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const project = await loadProjectFile(file);
      loadProjectData(project);
      alert("Project berhasil diload.");
    } catch (err) {
      console.error(err);
      alert("File project tidak valid.");
    }
  }

  function deleteSlide(id) {
    const next = slides.filter((slide) => slide.id !== id);
    setSlides(next);
    if (active >= next.length) setActive(Math.max(next.length - 1, 0));
  }

  function onTimelineDragStart(index) {
    setDraggingIndex(index);
  }

  function onTimelineDragOver(e, overIndex) {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === overIndex) return;

    const next = [...slides];
    const dragged = next[draggingIndex];

    next.splice(draggingIndex, 1);
    next.splice(overIndex, 0, dragged);

    setSlides(next);
    setDraggingIndex(overIndex);
    setActive(overIndex);
  }

  function onTimelineDragEnd() {
    setDraggingIndex(null);
  }

  function moveSlideTiming(index, key, value) {
    setSlides((prev) =>
      prev.map((slide, i) => (i === index ? { ...slide, [key]: Number(value) } : slide))
    );
  }

  function applyTemplate(template) {
    setSlides((prev) =>
      prev.map((slide) => ({
        ...slide,
        background: template.background || slide.background,
        transition: template.transition || slide.transition,
        animation: template.animation || slide.animation,
      }))
    );
  }

  return (
    <div style={styles.page}>
      <section style={messyBrandStyles.heroHeader}>
        <div style={messyBrandStyles.glowLine} />

        <div style={messyBrandStyles.heroContent}>
          <div style={messyBrandStyles.heroLogoWrap}>
            <img
              src="/messy-logo.jpg"
              alt="Messy Logo"
              style={messyBrandStyles.heroLogo}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>

          <div style={messyBrandStyles.badge}>AI VIDEO PRODUCTION DASHBOARD</div>

          <h1 style={messyBrandStyles.title}>
            <span style={messyBrandStyles.titleText}>VS Tools</span>
            <span style={messyBrandStyles.titlePink}>PRO</span>
          </h1>

          <p style={messyBrandStyles.subtitle}>{t.subtitle}</p>

          <div style={messyBrandStyles.actions}>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{ ...styles.selectTop, ...messyBrandStyles.languageSelect }}
            >
              <option value="id">🇮🇩 Indonesia</option>
              <option value="en">🇺🇸 English</option>
              <option value="zh">🇨🇳 Mandarin</option>
            </select>

            <label style={{ ...styles.whiteButton, ...messyBrandStyles.actionButton }}>
              <Upload size={20} />
              {t.uploadImages}
              <input hidden multiple type="file" accept="image/*" onChange={uploadImages} />
            </label>

            <label style={{ ...styles.pinkButton, ...messyBrandStyles.actionButton }}>
              <Music size={20} />
              {t.uploadAudio}
              <input hidden type="file" accept="audio/*" onChange={uploadAudio} />
            </label>

            <button style={{ ...styles.whiteButton, ...messyBrandStyles.actionButton }} onClick={saveLocalProject}>
              <Save size={20} />
              {t.saveProject}
            </button>

            <label style={{ ...styles.pinkButton, ...messyBrandStyles.actionButton }}>
              <FolderOpen size={20} />
              {t.loadProject}
              <input hidden type="file" accept=".vstools,application/json" onChange={loadLocalProject} />
            </label>
          </div>
        </div>
      </section>

      <main style={styles.workspace}>
        <section style={styles.panel}>
          <div style={{ display: "flex", gap: 12, marginBottom: 12, position: "relative", zIndex: 100 }}>
            <button style={styles.whiteButton} onClick={togglePlay}>
              {playing ? <Pause size={18} /> : <Play size={18} />}
              {playing ? "Pause Preview" : "Play Preview"}
            </button>

            <button style={styles.pinkButton} onClick={backendRender}>
              <Download size={18} />
              Render MP4
            </button>
          </div>
          <div
            style={{
              ...styles.preview,
              aspectRatio: `${selectedSize.width} / ${selectedSize.height}`,
            }}
          >
            {current ? (
              <>
                <RenderPreview
                  slides={slides}
                  subtitles={subtitles}
                  audioTime={audioTime}
                  selectedSize={selectedSize}
                  subtitleStyle={subtitleStyle}
                  subtitlePosition={subtitlePosition}
                  subtitleFontSize={subtitleFontSize}
                  subtitleBoxEnabled={subtitleBoxEnabled}
                />

                <div
                  style={{
                    position: "absolute",
                    left: 16,
                    right: 16,
                    bottom: 16,
                    zIndex: 50,
                    display: "flex",
                    gap: 12,
                    justifyContent: "center"
                  }}
                >
                  <button style={styles.whiteButton} onClick={togglePlay}>
                    {playing ? <Pause size={18} /> : <Play size={18} />}
                    {playing ? "Pause Preview" : "Play Preview"}
                  </button>

                  <button style={styles.pinkButton} onClick={backendRender}>
                    <Download size={18} />
                    {t.exportBackend}
                  </button>
                </div>
              </>
            ) : (
              <div style={styles.empty}>Upload gambar dan audio untuk mulai membuat video.</div>
            )}
          </div>

          {audioUrl && (
            <div style={{ marginTop: 16 }}>
              <audio
                ref={audioRef}
                src={audioUrl}
                controls
                onTimeUpdate={(e) => setAudioTime(e.currentTarget.currentTime)}
                style={{ width: "100%" }}
              />

              <p style={styles.mutedSmall}>
                {audioName} · {formatTime(audioTime)} / {formatTime(audioDuration)}
              </p>

              <AdvancedWaveform
                audioUrl={audioUrl}
                audioTime={audioTime}
                slides={slides}
                subtitles={subtitles}
                onSeek={(time) => {
                  if (audioRef.current) audioRef.current.currentTime = time;
                  setAudioTime(time);
                }}
                onReady={(duration) => setAudioDuration(duration)}
              />
            </div>
          )}

          {exporting && (
            <div style={styles.progressBox}>
              <div style={styles.progressText}>
                <span>{exportStatus}</span>
                <span>{exportProgress}%</span>
              </div>

              <div style={styles.progressTrack}>
                <div style={{ ...styles.progressFill, width: `${exportProgress}%` }} />
              </div>
            </div>
          )}

          <section style={{ marginTop: 22 }}>
            <h2>Slide Timeline</h2>

            {slides.length === 0 && <p style={styles.muted}>Belum ada slide.</p>}

            {slides.map((slide, index) => (
              <div
                key={slide.id}
                draggable
                onDragStart={() => onTimelineDragStart(index)}
                onDragOver={(e) => onTimelineDragOver(e, index)}
                onDragEnd={onTimelineDragEnd}
                onClick={() => setActive(index)}
                style={{
                  ...styles.timelineItem,
                  border: active === index ? "2px solid #ff2fb3" : "1px solid rgba(255,255,255,.14)",
                  opacity: draggingIndex === index ? 0.55 : 1,
                }}
              >
                <Move size={18} />
                <img src={slide.url} alt={slide.name} style={styles.thumb} />

                <div style={{ flex: 1 }}>
                  <strong>
                    {index + 1}. {slide.name}
                  </strong>

                  <p style={styles.mutedSmall}>
                    {formatTime(slide.start)} - {formatTime(slide.end)} · {slide.transition} · {slide.animation}
                  </p>

                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <input
                      type="number"
                      step="0.1"
                      value={slide.start}
                      onChange={(e) => moveSlideTiming(index, "start", e.target.value)}
                      style={{ ...styles.input, marginBottom: 0, maxWidth: 110 }}
                    />

                    <input
                      type="number"
                      step="0.1"
                      value={slide.end}
                      onChange={(e) => moveSlideTiming(index, "end", e.target.value)}
                      style={{ ...styles.input, marginBottom: 0, maxWidth: 110 }}
                    />
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSlide(slide.id);
                  }}
                  style={styles.deleteButton}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </section>
        </section>

        <aside style={styles.panel}>
          <AuthPanel onUserChange={setUser} />

          <CloudProjects
            user={user}
            getProjectData={getProjectData}
            onLoadProject={loadProjectData}
          />

          <TemplateMarketplace onApplyTemplate={applyTemplate} />

          <h2 style={{ marginTop: 24 }}>{t.videoSize}</h2>
          <select value={videoSize} onChange={(e) => setVideoSize(e.target.value)} style={styles.input}>
            {Object.entries(VIDEO_SIZES).map(([key, item]) => (
              <option key={key} value={key}>
                {item.label}
              </option>
            ))}
          </select>

          <button style={styles.secondaryButton} onClick={autoFitToAudio}>
            {t.autoFit}
          </button>

          <button style={styles.secondaryButton} onClick={removeBgCurrentSlide}>
            <Wand2 size={16} />
            {t.removeBg}
          </button>

          <button
            style={styles.secondaryButton}
            onClick={() => {
              if (!current) return alert("Pilih slide dulu.");
              setMaskOpen(true);
            }}
          >
            <Scissors size={16} />
            {t.removeObject}
          </button>

          <h2 style={{ marginTop: 24 }}>{t.slideEditor}</h2>

          {!current ? (
            <p style={styles.muted}>Pilih slide dulu.</p>
          ) : (
            <>
              <label style={styles.label}>{t.background}</label>
              <select value={current.background} onChange={(e) => updateSlide("background", e.target.value)} style={styles.input}>
                {BACKGROUNDS.map((item) => (
                  <option key={item} value={item}>
                    {BACKGROUND_LABELS[item] || item}
                  </option>
                ))}
              </select>

              <label style={styles.label}>{t.transition}</label>
              <select value={current.transition} onChange={(e) => updateSlide("transition", e.target.value)} style={styles.input}>
                {TRANSITIONS.map((item) => (
                  <option key={item} value={item}>
                    {TRANSITION_LABELS[item] || item}
                  </option>
                ))}
              </select>

              <label style={styles.label}>{t.animation}</label>
              <select value={current.animation} onChange={(e) => updateSlide("animation", e.target.value)} style={styles.input}>
                {ANIMATIONS.map((item) => (
                  <option key={item} value={item}>
                    {ANIMATION_LABELS[item] || item}
                  </option>
                ))}
              </select>

              <label style={styles.label}>Layout Gambar</label>
              <select
                value={current.layoutType || "single"}
                onChange={(e) => updateSlide("layoutType", e.target.value)}
                style={styles.input}
              >
                {LAYOUT_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>

              <label style={styles.label}>Tambah Gambar ke Slide Ini</label>
              <label style={styles.secondaryButton}>
                <Upload size={16} />
                Add Images for Layout
                <input hidden multiple type="file" accept="image/*" onChange={addImagesToCurrentSlide} />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 10 }}>
                {normalizeSlideImages(current).map((image, imageIndex) => (
                  <div key={imageIndex} style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,.14)", background: "rgba(0,0,0,.35)" }}>
                    <img src={image.url} alt={image.name || `Image ${imageIndex + 1}`} style={{ width: "100%", height: 64, objectFit: "cover", display: "block" }} />
                    {imageIndex > 0 && (
                      <button
                        onClick={() => removeLayoutImage(imageIndex)}
                        style={{ position: "absolute", top: 4, right: 4, border: 0, borderRadius: 8, padding: "4px 6px", background: "rgba(0,0,0,.72)", color: "white", cursor: "pointer" }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <label style={styles.label}>{t.imageMode}</label>
              <select value={current.fit} onChange={(e) => updateSlide("fit", e.target.value)} style={styles.input}>
                <option value="cover">Crop / Cover</option>
                <option value="contain">Full Image</option>
              </select>

              <label style={styles.label}>{t.start}: {formatTime(current.start)}</label>
              <input type="number" value={current.start} step="0.1" onChange={(e) => updateSlide("start", Number(e.target.value))} style={styles.input} />

              <label style={styles.label}>{t.end}: {formatTime(current.end)}</label>
              <input type="number" value={current.end} step="0.1" onChange={(e) => updateSlide("end", Number(e.target.value))} style={styles.input} />

              <label style={styles.label}>{t.zoom}: {current.zoom}</label>
              <input type="range" min="0.5" max="5" step="0.1" value={current.zoom} onChange={(e) => updateSlide("zoom", Number(e.target.value))} style={styles.range} />

              <label style={styles.label}>Position X: {current.x}</label>
              <input type="range" min="-700" max="700" value={current.x} onChange={(e) => updateSlide("x", Number(e.target.value))} style={styles.range} />

              <label style={styles.label}>Position Y: {current.y}</label>
              <input type="range" min="-700" max="700" value={current.y} onChange={(e) => updateSlide("y", Number(e.target.value))} style={styles.range} />
            </>
          )}

          <h2 style={{ marginTop: 24 }}>{t.subtitleEditor}</h2>

          <label style={styles.label}>Subtitle Style</label>
          <select
            value={subtitleStyle}
            onChange={(e) => setSubtitleStyle(e.target.value)}
            style={styles.input}
          >
            {SUBTITLE_STYLE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>

          <label style={styles.label}>Subtitle Position</label>
          <select
            value={subtitlePosition}
            onChange={(e) => setSubtitlePosition(e.target.value)}
            style={styles.input}
          >
            {SUBTITLE_POSITION_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>

          <label style={styles.label}>Subtitle Font Size: {subtitleFontSize}px</label>
          <input
            type="range"
            min="20"
            max="90"
            value={subtitleFontSize}
            onChange={(e) => setSubtitleFontSize(Number(e.target.value))}
            style={styles.range}
          />

          <label style={{ ...styles.label, display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="checkbox"
              checked={subtitleBoxEnabled}
              onChange={(e) => setSubtitleBoxEnabled(e.target.checked)}
            />
            Subtitle Background Box
          </label>

          <button style={styles.secondaryButton} onClick={addSubtitle}>
            {t.addSubtitle}
          </button>

          <button style={styles.secondaryButton} onClick={autoSubtitleAI}>
            <Sparkles size={16} />
            {t.autoSubtitle}
          </button>

          {subtitles.map((subtitle, index) => (
            <div key={subtitle.id} style={styles.subtitleBox}>
              <label style={styles.label}>Subtitle Text</label>
              <textarea
                value={subtitle.text}
                onChange={(e) => updateSubtitle(index, "text", e.target.value)}
                style={styles.textarea}
              />

              <label style={styles.label}>Start</label>
              <input
                type="number"
                step="0.1"
                value={subtitle.start}
                onChange={(e) => updateSubtitle(index, "start", Number(e.target.value))}
                style={styles.input}
              />
              <label style={styles.label}>End</label>
              <input
                type="number"
                step="0.1"
                value={subtitle.end}
                onChange={(e) => updateSubtitle(index, "end", Number(e.target.value))}
                style={styles.input}
              />

              <button style={styles.secondaryButton} onClick={() => deleteSubtitle(subtitle.id)}>
                <Trash2 size={16} />
                Delete Subtitle
              </button>
            </div>
          ))}
        </aside>
      </main>

      {maskOpen && current && (
        <MaskEditor
          imageUrl={current.url}
          onClose={() => setMaskOpen(false)}
          onApply={(newUrl) => updateSlide("url", newUrl)}
        />
      )}
    </div>
  );
}