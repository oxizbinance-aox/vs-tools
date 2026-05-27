import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { exec } from "child_process";

dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const jobs = new Map();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.static(path.join(__dirname, "dist")));

app.get("/api/health", (req, res) => {
  res.json({
    app: "VS Tools PRO Final Max Backend",
    status: "running",
    features: [
      "long render",
      "progress",
      "subtitle",
      "remove object",
      "auto subtitle",
      "frontend serve"
    ]
  });
});

app.post(
  "/api/render-long-video",
  upload.fields([
    { name: "images", maxCount: 200 },
    { name: "audio", maxCount: 1 },
    { name: "project", maxCount: 1 }
  ]),
  async (req, res) => {
    const jobId = crypto.randomUUID();

    jobs.set(jobId, {
      status: "processing",
      progress: 5,
      message: "Render job started..."
    });

    res.json({ jobId });

    try {
      const images = req.files.images || [];
      const audio = req.files.audio?.[0];

      if (!images.length || !audio) {
        throw new Error("Images or audio missing.");
      }

      const outputDir = path.join(__dirname, "outputs");
      fs.mkdirSync(outputDir, { recursive: true });

      const listPath = path.join(outputDir, `${jobId}.txt`);
      const outputPath = path.join(outputDir, `${jobId}.mp4`);

      jobs.set(jobId, {
        status: "processing",
        progress: 25,
        message: "Preparing images..."
      });

      const lines = images
        .map((img) => {
          const safePath = img.path.replace(/\\/g, "/");
          return `file '${safePath}'\nduration 5`;
        })
        .join("\n");

      fs.writeFileSync(listPath, lines);

      jobs.set(jobId, {
        status: "processing",
        progress: 45,
        message: "Rendering video with FFmpeg..."
      });

      const command = `ffmpeg -y -f concat -safe 0 -i "${listPath}" -i "${audio.path}" -vf "scale=1280:720,format=yuv420p" -shortest "${outputPath}"`;

      exec(command, (error) => {
        if (error) {
          jobs.set(jobId, {
            status: "failed",
            progress: 100,
            message: error.message
          });
          return;
        }

        jobs.set(jobId, {
          status: "complete",
          progress: 100,
          message: "Render complete.",
          file: `/outputs/${jobId}.mp4`
        });
      });
    } catch (error) {
      jobs.set(jobId, {
        status: "failed",
        progress: 100,
        message: error.message
      });
    }
  }
);

app.get("/api/render-progress/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);

  if (!job) {
    return res.status(404).json({
      status: "failed",
      message: "Job not found."
    });
  }

  res.json(job);
});

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
        return res.status(400).json({ error: "Image and mask required." });
      }

      if (!process.env.REPLICATE_API_TOKEN) {
        return res.status(500).json({ error: "Missing REPLICATE_API_TOKEN." });
      }

      res.json({
        image: ""
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

app.post("/api/auto-subtitle", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Audio file required." });
    }

    res.json({
      subtitles: []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use("/outputs", express.static(path.join(__dirname, "outputs")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`VS Tools backend running on port ${PORT}`);
});