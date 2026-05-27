import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import Replicate from "replicate";
import OpenAI from "openai";

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 1024 * 1024 * 500
  }
});

const jobs = new Map();

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
});

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.use(cors());
app.use(express.json({ limit: "150mb" }));
app.use("/outputs", express.static("outputs"));

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("outputs")) fs.mkdirSync("outputs");

const VIDEO_SIZES = {
  landscape: { width: 1280, height: 720 },
  portrait: { width: 720, height: 1280 },
  square: { width: 720, height: 720 },
  vertical: { width: 720, height: 900 },
  fullhd: { width: 1920, height: 1080 },
  cinematic: { width: 1920, height: 820 }
};

const BG_COLORS = {
  pinkSilver: "black",
  modern: "black",
  traditional: "0x1c1917",
  nature: "0x052e16",
  mountain: "0x0f172a",
  ocean: "0x082f49",
  forest: "0x022c22",
  sunset: "0x431407",
  technology: "0x020617",
  aiNeon: "black",
  blockchain: "0x02121a",
  cryptoNetwork: "0x02120a",
  cyberGrid: "black",
  minimalApple: "0x111827",
  luxuryDark: "black",
  goldLuxury: "0x161006",
  cleanWhite: "white",
  deepSpace: "black",
  cyberPink: "black",
  matrixGreen: "black",
  documentary: "0x111827",
  classicPaper: "0x2b2118",
  tropical: "0x064e3b",
  desert: "0x78350f",
  cityNight: "black"
};

function setJob(jobId, data) {
  const current = jobs.get(jobId) || {};
  jobs.set(jobId, {
    ...current,
    ...data,
    updatedAt: Date.now()
  });
}

function cleanup(files = []) {
  for (const file of files) {
    try {
      if (file && fs.existsSync(file)) fs.unlinkSync(file);
    } catch {}
  }
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args);

    child.stderr.on("data", (data) => {
      console.log(data.toString());
    });

    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} failed with code ${code}`));
    });
  });
}

function escapeDrawText(text = "") {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/,/g, "\\,")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]");
}

function buildSubtitleFilter(subtitles = [], width, height) {
  if (!subtitles.length) return "";

  return subtitles
    .filter((s) => s.text && Number.isFinite(Number(s.start)) && Number.isFinite(Number(s.end)))
    .map((s) => {
      const text = escapeDrawText(s.text);
      const fontSize = Math.max(28, Math.floor(width * 0.035));
      const y = Math.floor(height * 0.81);

      return `drawtext=text='${text}':fontcolor=white:fontsize=${fontSize}:box=1:boxcolor=black@0.58:boxborderw=18:x=(w-text_w)/2:y=${y}:enable='between(t,${Number(s.start)},${Number(s.end)})'`;
    })
    .join(",");
}

function buildWatermarkFilter(width, height) {
  const fontSize = Math.max(18, Math.floor(width * 0.018));
  const x = Math.floor(width * 0.035);
  const y = Math.floor(height * 0.045);

  return `drawtext=text='VS Tools PRO':fontcolor=white@0.72:fontsize=${fontSize}:x=${x}:y=${y}`;
}

function buildVideoFilter(size, slide = {}) {
  const bg = BG_COLORS[slide.background || "pinkSilver"] || "black";

  return (
    `scale=${size.width}:${size.height}:force_original_aspect_ratio=decrease,` +
    `pad=${size.width}:${size.height}:(ow-iw)/2:(oh-ih)/2:color=${bg},` +
    `format=yuv420p`
  );
}

app.get("/", (req, res) => {
  res.json({
    app: "VS Tools PRO Final Max Backend",
    status: "running",
    features: [
      "long render",
      "progress",
      "subtitle",
      "watermark",
      "remove object",
      "auto subtitle endpoint"
    ]
  });
});

app.get("/api/render-progress/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);

  if (!job) {
    return res.status(404).json({
      status: "not_found",
      message: "Job not found."
    });
  }

  res.json(job);
});

app.post(
  "/api/render-long-video",
  upload.fields([
    { name: "images", maxCount: 500 },
    { name: "audio", maxCount: 1 },
    { name: "project", maxCount: 1 }
  ]),
  async (req, res) => {
    const images = req.files.images || [];
    const audio = req.files.audio?.[0];
    const projectFile = req.files.project?.[0];

    if (!images.length || !audio || !projectFile) {
      return res.status(400).json({
        error: "Images, audio, and project are required."
      });
    }

    const jobId = String(Date.now());

    jobs.set(jobId, {
      status: "queued",
      progress: 0,
      message: "Render job queued.",
      file: null,
      createdAt: Date.now()
    });

    res.json({
      success: true,
      jobId
    });

    renderJob(jobId, req.files);
  }
);

async function renderJob(jobId, reqFiles) {
  const tempFiles = [];

  try {
    setJob(jobId, {
      status: "processing",
      progress: 5,
      message: "Preparing project..."
    });

    const images = reqFiles.images || [];
    const audio = reqFiles.audio?.[0];
    const projectFile = reqFiles.project?.[0];

    const project = JSON.parse(fs.readFileSync(projectFile.path, "utf8"));
    const slides = project.slides || [];
    const subtitles = project.subtitles || [];
    const size = VIDEO_SIZES[project.videoSize || "landscape"] || VIDEO_SIZES.landscape;

    const jobDir = path.join("uploads", `job-${jobId}`);
    fs.mkdirSync(jobDir, { recursive: true });

    const slideVideos = [];

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const img = images[i];
      if (!img) continue;

      setJob(jobId, {
        progress: Math.floor(8 + (i / Math.max(slides.length, 1)) * 45),
        message: `Rendering slide ${i + 1} of ${slides.length}...`
      });

      const duration = Math.max(Number(slide.end || 5) - Number(slide.start || 0), 0.5);
      const slidePath = path.join(jobDir, `slide-${i}.mp4`);
      tempFiles.push(slidePath);

      await runCommand("ffmpeg", [
        "-y",
        "-loop", "1",
        "-i", img.path,
        "-t", String(duration),
        "-vf", buildVideoFilter(size, slide),
        "-r", "24",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-pix_fmt", "yuv420p",
        slidePath
      ]);

      slideVideos.push(slidePath);
    }

    setJob(jobId, {
      progress: 58,
      message: "Merging slides..."
    });

    const concatPath = path.join(jobDir, `concat-${jobId}.txt`);
    tempFiles.push(concatPath);

    let concatContent = "";
    for (const slideVideo of slideVideos) {
      concatContent += `file '${path.resolve(slideVideo).replace(/\\/g, "/")}'\n`;
    }

    fs.writeFileSync(concatPath, concatContent);

    const slideshowPath = path.join(jobDir, `slideshow-${jobId}.mp4`);
    tempFiles.push(slideshowPath);

    await runCommand("ffmpeg", [
      "-y",
      "-f", "concat",
      "-safe", "0",
      "-i", concatPath,
      "-c", "copy",
      slideshowPath
    ]);

    setJob(jobId, {
      progress: 76,
      message: "Adding audio, subtitle, and watermark..."
    });

    const finalOutput = path.join("outputs", `vs-tools-final-max-${jobId}.mp4`);

    const filters = [
      buildWatermarkFilter(size.width, size.height),
      buildSubtitleFilter(subtitles, size.width, size.height)
    ].filter(Boolean).join(",");

    const args = [
      "-y",
      "-i", slideshowPath,
      "-i", audio.path
    ];

    if (filters) args.push("-vf", filters);

    args.push(
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-b:a", "192k",
      "-shortest",
      "-movflags", "faststart",
      finalOutput
    );

    await runCommand("ffmpeg", args);

    setJob(jobId, {
      status: "complete",
      progress: 100,
      message: "Render complete.",
      file: `http://localhost:${PORT}/outputs/${path.basename(finalOutput)}`
    });

    cleanup([
      projectFile.path,
      audio.path,
      ...images.map((f) => f.path),
      ...tempFiles
    ]);

    try {
      fs.rmSync(jobDir, { recursive: true, force: true });
    } catch {}
  } catch (error) {
    console.error(error);

    setJob(jobId, {
      status: "failed",
      progress: 100,
      message: error.message
    });
  }
}

app.post(
  "/api/remove-object",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "mask", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const image = req.files.image?.[0];
      const mask = req.files.mask?.[0];

      if (!image || !mask) {
        return res.status(400).json({
          error: "Image and mask are required."
        });
      }

      if (!process.env.REPLICATE_API_TOKEN || !process.env.REPLICATE_INPAINT_VERSION) {
        return res.status(500).json({
          error: "Missing Replicate environment variables."
        });
      }

      const output = await replicate.run(process.env.REPLICATE_INPAINT_VERSION, {
        input: {
          image: fs.createReadStream(image.path),
          mask: fs.createReadStream(mask.path),
          prompt: "remove the selected object and naturally reconstruct the background"
        }
      });

      cleanup([image.path, mask.path]);

      res.json({
        success: true,
        image: Array.isArray(output) ? output[0] : output
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Remove Object AI failed.",
        detail: error.message
      });
    }
  }
);

app.post("/api/auto-subtitle", upload.single("audio"), async (req, res) => {
  try {
    if (!openai) {
      return res.status(500).json({
        error: "Missing OPENAI_API_KEY."
      });
    }

    const audio = req.file;

    if (!audio) {
      return res.status(400).json({
        error: "Audio file is required."
      });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audio.path),
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"]
    });

    cleanup([audio.path]);

    const subtitles = (transcription.segments || []).map((segment, index) => ({
      id: Date.now() + index,
      start: Number(segment.start.toFixed(2)),
      end: Number(segment.end.toFixed(2)),
      text: segment.text.trim()
    }));

    res.json({
      success: true,
      subtitles
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Auto subtitle failed.",
      detail: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`VS Tools PRO Final Max backend running on http://localhost:${PORT}`);
});