import React, { useEffect, useRef, useState } from "react";
import { X, Eraser, Brush, Wand2, RotateCcw } from "lucide-react";
import { removeObjectWithBackend } from "../api";

export default function MaskEditor({ imageUrl, onClose, onApply }) {
  const imageCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const drawing = useRef(false);

  const [brushSize, setBrushSize] = useState(38);
  const [mode, setMode] = useState("brush");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadImageToCanvas();
  }, [imageUrl]);

  function loadImageToCanvas() {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      const imageCanvas = imageCanvasRef.current;
      const maskCanvas = maskCanvasRef.current;

      const maxW = 940;
      const scale = Math.min(maxW / img.width, 1);
      const w = Math.floor(img.width * scale);
      const h = Math.floor(img.height * scale);

      imageCanvas.width = w;
      imageCanvas.height = h;
      maskCanvas.width = w;
      maskCanvas.height = h;

      const imageCtx = imageCanvas.getContext("2d");
      const maskCtx = maskCanvas.getContext("2d");

      imageCtx.clearRect(0, 0, w, h);
      imageCtx.drawImage(img, 0, 0, w, h);

      maskCtx.clearRect(0, 0, w, h);
      maskCtx.fillStyle = "black";
      maskCtx.fillRect(0, 0, w, h);
    };
  }

  function getPoint(e) {
    const canvas = maskCanvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const clientX = e.touches?.[0]?.clientX ?? e.clientX;
    const clientY = e.touches?.[0]?.clientY ?? e.clientY;

    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  }

  function draw(e) {
    if (!drawing.current) return;

    e.preventDefault?.();

    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const p = getPoint(e);

    ctx.beginPath();
    ctx.arc(p.x, p.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = mode === "brush" ? "white" : "black";
    ctx.fill();
  }

  function startDraw(e) {
    drawing.current = true;
    draw(e);
  }

  function stopDraw() {
    drawing.current = false;
  }

  function clearMask() {
    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }

  async function applyRemoveObject() {
    try {
      setProcessing(true);

      const imageBlob = await canvasToBlob(imageCanvasRef.current);
      const maskBlob = await canvasToBlob(maskCanvasRef.current);

      const resultUrl = await removeObjectWithBackend(imageBlob, maskBlob);

      onApply(resultUrl);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Remove Object AI gagal. Pastikan backend aktif dan Replicate API sudah benar.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div>
            <div style={styles.badge}>AI OBJECT REMOVAL</div>
            <h2 style={styles.title}>Remove Object AI</h2>
            <p style={styles.subtitle}>
              Brush area objek yang ingin dihapus. Area putih akan diproses AI.
            </p>
          </div>

          <button onClick={onClose} style={styles.iconButton}>
            <X size={20} />
          </button>
        </div>

        <div style={styles.toolbar}>
          <button
            onClick={() => setMode("brush")}
            style={{
              ...styles.toolButton,
              background:
                mode === "brush"
                  ? "linear-gradient(135deg,#ff2fb3,#8b0057)"
                  : "rgba(255,255,255,.1)"
            }}
          >
            <Brush size={18} />
            Brush
          </button>

          <button
            onClick={() => setMode("erase")}
            style={{
              ...styles.toolButton,
              background:
                mode === "erase"
                  ? "linear-gradient(135deg,#ff2fb3,#8b0057)"
                  : "rgba(255,255,255,.1)"
            }}
          >
            <Eraser size={18} />
            Erase
          </button>

          <label style={styles.label}>
            Brush Size: {brushSize}
            <input
              type="range"
              min="8"
              max="130"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              style={styles.range}
            />
          </label>

          <button onClick={clearMask} style={styles.clearButton}>
            <RotateCcw size={17} />
            Clear Mask
          </button>

          <button
            onClick={applyRemoveObject}
            disabled={processing}
            style={{
              ...styles.applyButton,
              opacity: processing ? 0.55 : 1
            }}
          >
            <Wand2 size={18} />
            {processing ? "Processing..." : "Apply Remove Object"}
          </button>
        </div>

        <div style={styles.tipBox}>
          Tips: gunakan brush hanya pada objek yang ingin dihapus. Jangan brush terlalu luas agar background terlihat natural.
        </div>

        <div style={styles.canvasWrap}>
          <canvas ref={imageCanvasRef} style={styles.imageCanvas} />

          <canvas
            ref={maskCanvasRef}
            style={styles.maskCanvas}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(0,0,0,.86)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },

  modal: {
    width: "min(1160px, 96vw)",
    maxHeight: "94vh",
    overflow: "auto",
    background:
      "radial-gradient(circle at top left, rgba(255,47,179,.24), transparent 28%), radial-gradient(circle at bottom right, rgba(255,255,255,.12), transparent 24%), linear-gradient(135deg,#08000d,#050008,#000)",
    border: "1px solid rgba(255,255,255,.16)",
    borderRadius: 30,
    padding: 22,
    color: "#f5f5f7",
    boxShadow: "0 30px 100px rgba(0,0,0,.55)"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start"
  },

  badge: {
    display: "inline-block",
    marginBottom: 10,
    padding: "7px 10px",
    borderRadius: 999,
    background: "rgba(255,47,179,.16)",
    border: "1px solid rgba(255,47,179,.42)",
    color: "#ff8bd8",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1
  },

  title: {
    margin: 0,
    fontSize: 32,
    fontWeight: 950,
    background: "linear-gradient(90deg,#fff,#ff2fb3,#d9d9e3)",
    WebkitBackgroundClip: "text",
    color: "transparent"
  },

  subtitle: {
    marginTop: 8,
    color: "rgba(255,255,255,.65)"
  },

  iconButton: {
    border: 0,
    borderRadius: 12,
    padding: 10,
    background: "rgba(255,255,255,.12)",
    color: "white",
    cursor: "pointer"
  },

  toolbar: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 14
  },

  toolButton: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    border: "1px solid rgba(255,255,255,.16)",
    borderRadius: 14,
    padding: "12px 14px",
    color: "white",
    fontWeight: 850,
    cursor: "pointer"
  },

  label: {
    display: "grid",
    gap: 6,
    minWidth: 220,
    color: "rgba(255,255,255,.8)",
    fontWeight: 850
  },

  range: {
    accentColor: "#ff2fb3"
  },

  clearButton: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    border: "1px solid rgba(255,255,255,.16)",
    borderRadius: 14,
    padding: "12px 14px",
    background: "rgba(255,255,255,.1)",
    color: "white",
    fontWeight: 850,
    cursor: "pointer"
  },

  applyButton: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    border: 0,
    borderRadius: 14,
    padding: "12px 16px",
    background: "linear-gradient(135deg,#ff2fb3,#ffffff)",
    color: "#08000d",
    fontWeight: 950,
    cursor: "pointer"
  },

  tipBox: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
    background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(255,255,255,.12)",
    color: "rgba(255,255,255,.72)",
    fontSize: 13
  },

  canvasWrap: {
    position: "relative",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    background: "rgba(0,0,0,.38)",
    borderRadius: 22,
    padding: 12,
    overflow: "auto",
    border: "1px solid rgba(255,255,255,.1)"
  },

  imageCanvas: {
    maxWidth: "100%",
    height: "auto",
    borderRadius: 16,
    display: "block"
  },

  maskCanvas: {
    position: "absolute",
    top: 12,
    maxWidth: "calc(100% - 24px)",
    height: "auto",
    borderRadius: 16,
    opacity: 0.42,
    mixBlendMode: "screen",
    cursor: "crosshair",
    touchAction: "none"
  }
};