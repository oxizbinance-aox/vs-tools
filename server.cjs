const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { execFile } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "300mb" }));
app.use(express.urlencoded({ extended: true, limit: "300mb" }));

const uploadDir = path.join(__dirname, "uploads");
const outputDir = path.join(__dirname, "outputs");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 300 * 1024 * 1024,
    files: 130
  }
});

function safeName(name) {
  return String(name || "result.mp4").split(/[\\\/:*?"<>| ]/).join("") || "result.mp4";
}

function run(cmd, args) {
  return new Promise(function (resolve, reject) {
    execFile(cmd, args, { maxBuffer: 1024 * 1024 * 20 }, function (error, stdout, stderr) {
      if (error) return reject(new Error(stderr || error.message));
      resolve({ stdout, stderr });
    });
  });
}

async function getAudioDuration(audioPath) {
  try {
    const result = await run("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      audioPath
    ]);

    const duration = parseFloat(String(result.stdout).trim());
    if (!duration || Number.isNaN(duration)) return 10;
    return duration;
  } catch (error) {
    return 10;
  }
}

function motionFilter(effect, width, height, fps) {
  const base =
    "scale=" + width + ":" + height + ":force_original_aspect_ratio=increase," +
    "crop=" + width + ":" + height;

  if (effect === "zoom_in") {
    return base + ",zoompan=z='min(zoom+0.0018,1.22)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',scale=" + width + ":" + height + ",fps=" + fps + ",format=yuv420p";
  }

  if (effect === "zoom_out") {
    return base + ",zoompan=z='if(lte(zoom,1.0),1.22,max(1.001,zoom-0.0018))':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',scale=" + width + ":" + height + ",fps=" + fps + ",format=yuv420p";
  }

  if (effect === "pan_left") {
    return base + ",zoompan=z='1.12':d=1:x='iw-(iw/zoom)-on*2':y='ih/2-(ih/zoom/2)',scale=" + width + ":" + height + ",fps=" + fps + ",format=yuv420p";
  }

  if (effect === "pan_right") {
    return base + ",zoompan=z='1.12':d=1:x='on*2':y='ih/2-(ih/zoom/2)',scale=" + width + ":" + height + ",fps=" + fps + ",format=yuv420p";
  }

  if (effect === "pulse") {
    return base + ",zoompan=z='1.04+0.035*sin(on/12)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',scale=" + width + ":" + height + ",fps=" + fps + ",format=yuv420p";
  }

  return base + ",zoompan=z='min(zoom+0.0012,1.16)':d=1:x='iw/2-(iw/zoom/2)+sin(on/35)*18':y='ih/2-(ih/zoom/2)+cos(on/40)*12',scale=" + width + ":" + height + ",fps=" + fps + ",format=yuv420p";
}

async function createScene(imagePath, scenePath, duration, effect, width, height, fps) {
  const vf =
    motionFilter(effect, width, height, fps) +
    ",fade=t=in:st=0:d=0.35" +
    ",fade=t=out:st=" + Math.max(0.1, duration - 0.45).toFixed(2) + ":d=0.35";

  await run("ffmpeg", [
    "-y",
    "-loop", "1",
    "-framerate", String(fps),
    "-t", String(duration),
    "-i", imagePath,
    "-vf", vf,
    "-an",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-pix_fmt", "yuv420p",
    scenePath
  ]);
}

async function concatScenes(scenePaths, concatFile, videoOnlyPath) {
  const list = scenePaths.map(function (p) {
    return "file '" + p.replace(/\\/g, "/") + "'";
  }).join("\n");

  fs.writeFileSync(concatFile, list);

  await run("ffmpeg", [
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", concatFile,
    "-c", "copy",
    videoOnlyPath
  ]);
}

async function mergeAudio(videoOnlyPath, audioPath, outputPath) {
  await run("ffmpeg", [
    "-y",
    "-i", videoOnlyPath,
    "-i", audioPath,
    "-c:v", "copy",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    "-movflags", "+faststart",
    outputPath
  ]);
}

function cleanup(paths) {
  paths.forEach(function (p) {
    if (p && fs.existsSync(p)) {
      fs.unlink(p, function () {});
    }
  });
}

app.get("/", function (req, res) {
  res.send("VS Tools Multi Scene Video Engine Running");
});

app.get("/api/health", function (req, res) {
  res.json({
    ok: true,
    engine: "VS Tools Multi Scene Video Engine",
    output: "mp4",
    endpoint: "/api/video/scenes",
    maxImages: 100,
    maxUploadSizeMB: 300,
    duration: "auto from audio",
    effects: ["cinematic", "zoom_in", "zoom_out", "pan_left", "pan_right", "pulse"],
    transitions: ["fade_per_scene"],
    timestamp: new Date().toISOString()
  });
});

app.post(
  "/api/video/scenes",
  upload.fields([
    { name: "images", maxCount: 100 },
    { name: "audio", maxCount: 1 }
  ]),
  async function (req, res) {
    const tempFiles = [];
    let outputPath = "";

    try {
      if (!req.files || !req.files.images || !req.files.audio) {
        return res.status(400).json({
          ok: false,
          error: "images and audio are required"
        });
      }

      const images = req.files.images;
      const audioPath = req.files.audio[0].path;
      tempFiles.push(audioPath);

      if (!images.length) {
        return res.status(400).json({
          ok: false,
          error: "At least one image is required"
        });
      }

      images.forEach(function (img) {
        tempFiles.push(img.path);
      });

      const filename = safeName(req.body.filename || "result.mp4");
      const width = Number(req.body.width || 1280);
      const height = Number(req.body.height || 720);
      const fps = Number(req.body.fps || 30);
      const effect = req.body.effect || "cinematic";

      const audioDuration = await getAudioDuration(audioPath);
      const sceneDuration = Math.max(1.5, audioDuration / images.length);

      const jobId = String(Date.now());
      const scenePaths = [];
      const concatFile = path.join(outputDir, jobId + "-concat.txt");
      const videoOnlyPath = path.join(outputDir, jobId + "-video.mp4");
      outputPath = path.join(outputDir, jobId + "-" + filename);

      tempFiles.push(concatFile, videoOnlyPath, outputPath);

      for (let i = 0; i < images.length; i++) {
        const scenePath = path.join(outputDir, jobId + "-scene-" + i + ".mp4");
        scenePaths.push(scenePath);
        tempFiles.push(scenePath);

        const selectedEffect =
          effect === "auto"
            ? ["cinematic", "zoom_in", "zoom_out", "pan_left", "pan_right", "pulse"][i % 6]
            : effect;

        await createScene(
          images[i].path,
          scenePath,
          sceneDuration,
          selectedEffect,
          width,
          height,
          fps
        );
      }

      await concatScenes(scenePaths, concatFile, videoOnlyPath);
      await mergeAudio(videoOnlyPath, audioPath, outputPath);

      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Disposition", "attachment; filename=" + filename);

      const stream = fs.createReadStream(outputPath);
      stream.pipe(res);

      stream.on("close", function () {
        cleanup(tempFiles);
      });
    } catch (error) {
      cleanup(tempFiles);

      res.status(500).json({
        ok: false,
        error: error.message
      });
    }
  }
);

app.listen(PORT, "0.0.0.0", function () {
  console.log("VS Tools Multi Scene Video Engine running on port " + PORT);
});
