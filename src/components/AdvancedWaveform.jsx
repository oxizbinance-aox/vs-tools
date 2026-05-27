import React, { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

export default function AdvancedWaveform({
  audioUrl,
  audioTime,
  slides = [],
  subtitles = [],
  onSeek,
  onReady
}) {
  const containerRef = useRef(null);
  const waveRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    if (waveRef.current) {
      waveRef.current.destroy();
      waveRef.current = null;
    }

    const wave = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "rgba(255,255,255,.28)",
      progressColor: "#ff2fb3",
      cursorColor: "#ffffff",
      cursorWidth: 2,
      height: 90,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      normalize: true,
      url: audioUrl
    });

    wave.on("ready", () => {
      onReady?.(wave.getDuration());
    });

    wave.on("interaction", () => {
      onSeek?.(wave.getCurrentTime());
    });

    waveRef.current = wave;

    return () => {
      wave.destroy();
    };
  }, [audioUrl]);

  useEffect(() => {
    if (!waveRef.current) return;

    const current = waveRef.current.getCurrentTime();
    if (Math.abs(current - audioTime) > 0.4) {
      waveRef.current.setTime(audioTime || 0);
    }
  }, [audioTime]);

  const duration = waveRef.current?.getDuration?.() || 0;

  return (
    <div style={styles.box}>
      <div style={styles.header}>
        <strong>Advanced Waveform</strong>
        <span>{formatTime(audioTime)} / {formatTime(duration)}</span>
      </div>

      <div ref={containerRef} style={styles.wave} />

      <div style={styles.markerBar}>
        {duration > 0 &&
          slides.map((slide, index) => {
            const left = (slide.start / duration) * 100;
            const width = Math.max(((slide.end - slide.start) / duration) * 100, 0.7);

            return (
              <div
                key={slide.id}
                title={`Slide ${index + 1}`}
                style={{
                  ...styles.slideMarker,
                  left: `${left}%`,
                  width: `${width}%`
                }}
              >
                {index + 1}
              </div>
            );
          })}

        {duration > 0 &&
          subtitles.map((subtitle) => {
            const left = (subtitle.start / duration) * 100;
            const width = Math.max(((subtitle.end - subtitle.start) / duration) * 100, 0.7);

            return (
              <div
                key={subtitle.id}
                title={subtitle.text}
                style={{
                  ...styles.subtitleMarker,
                  left: `${left}%`,
                  width: `${width}%`
                }}
              />
            );
          })}
      </div>
    </div>
  );
}

function formatTime(sec) {
  if (!Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const styles = {
  box: {
    marginTop: 16,
    padding: 14,
    borderRadius: 18,
    background: "rgba(0,0,0,.32)",
    border: "1px solid rgba(255,47,179,.25)"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 10,
    color: "rgba(255,255,255,.85)"
  },
  wave: {
    width: "100%",
    overflow: "hidden",
    borderRadius: 12
  },
  markerBar: {
    position: "relative",
    height: 42,
    marginTop: 10,
    borderRadius: 12,
    background: "rgba(255,255,255,.08)",
    overflow: "hidden"
  },
  slideMarker: {
    position: "absolute",
    top: 7,
    bottom: 7,
    borderRadius: 8,
    background: "linear-gradient(135deg,#ff2fb3,#ffffff)",
    color: "#050008",
    fontWeight: 900,
    fontSize: 11,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  subtitleMarker: {
    position: "absolute",
    bottom: 2,
    height: 4,
    borderRadius: 999,
    background: "#ffffff"
  }
};