const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { execFile } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

const uploadDir = path.join(__dirname, "uploads");
const outputDir = path.join(__dirname, "outputs");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 150 * 1024 * 1024 }
});

function safeName(name) {
  return String(name || "result.mp4").split(/[\\\/:*?"<>| ]/).join("") || "result.mp4";
}

function escapeText(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, " ");
}

function runFFmpeg(args) {
  return new Promise(function (resolve, reject) {
    execFile("ffmpeg", args, function (error, stdout, stderr) {
      if (error) return reject(new Error(stderr || error.message));
      resolve({ stdout, stderr });
    });
  });
}

function buildVideoFilter(effect, transition, width, height, fps, title, subtitle, titleAnimation, titlePosition) {
  const base =
    "scale=" +
    width +
    ":" +
    height +
    ":force_original_aspect_ratio=increase,crop=" +
    width +
    ":" +
    height;

  let motion = "";

  if (effect === "zoom_in") {
    motion =
      "zoompan=z='min(zoom+0.0018,1.22)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',scale=" +
      width +
      ":" +
      height;
  } else if (effect === "zoom_out") {
    motion =
      "zoompan=z='if(lte(zoom,1.0),1.22,max(1.001,zoom-0.0018))':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',scale=" +
      width +
      ":" +
      height;
  } else if (effect === "pan_left") {
    motion =
      "zoompan=z='1.12':d=1:x='iw-(iw/zoom)-on*2':y='ih/2-(ih/zoom/2)',scale=" +
      width +
      ":" +
      height;
  } else if (effect === "pan_right") {
    motion =
      "zoompan=z='1.12':d=1:x='on*2':y='ih/2-(ih/zoom/2)',scale=" +
      width +
      ":" +
      height;
  } else if (effect === "pan_up") {
    motion =
      "zoompan=z='1.12':d=1:x='iw/2-(iw/zoom/2)':y='ih-(ih/zoom)-on*1.5',scale=" +
      width +
      ":" +
      height;
  } else if (effect === "pan_down") {
    motion =
      "zoompan=z='1.12':d=1:x='iw/2-(iw/zoom/2)':y='on*1.5',scale=" +
      width +
      ":" +
      height;
  } else if (effect === "pulse") {
    motion =
      "zoompan=z='1.04+0.035*sin(on/12)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',scale=" +
      width +
      ":" +
      height;
  } else if (effect === "rotate_zoom") {
    motion =
      "zoompan=z='min(zoom+0.0013,1.16)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',rotate='0.006*sin(n/30)':fillcolor=black,scale=" +
      width +
      ":" +
      height;
  } else if (effect === "kenburns") {
    motion =
      "zoompan=z='min(zoom+0.0015,1.20)':d=1:x='iw/2-(iw/zoom/2)+on*0.45':y='ih/2-(ih/zoom/2)-on*0.25',scale=" +
      width +
      ":" +
      height;
  } else if (effect === "blur_zoom") {
    motion =
      "zoompan=z='min(zoom+0.0016,1.18)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',scale=" +
      width +
      ":" +
      height +
      ",unsharp=5:5:0.8";
  } else if (effect === "cinematic") {
    motion =
      "zoompan=z='min(zoom+0.0012,1.16)':d=1:x='iw/2-(iw/zoom/2)+sin(on/35)*18':y='ih/2-(ih/zoom/2)+cos(on/40)*12',scale=" +
      width +
      ":" +
      height;
  } else {
    motion = "scale=" + width + ":" + height;
  }

  let filter = base + "," + motion + ",fps=" + fps;

  if (transition === "fade_in") {
    filter += ",fade=t=in:st=0:d=0.8";
  } else if (transition === "fade_out") {
    filter += ",fade=t=out:st=4:d=0.8";
  } else if (transition === "fade_both") {
    filter += ",fade=t=in:st=0:d=0.8,fade=t=out:st=4:d=0.8";
  }

  const safeTitle = escapeText(title);
  const safeSubtitle = escapeText(subtitle);

  const titleSize = Math.max(34, Math.floor(width / 17));
  const subtitleSize = Math.max(20, Math.floor(width / 38));

  let titleY = "(h-text_h)/2-55";
  let subtitleY = "(h-text_h)/2+45";

  if (titlePosition === "top") {
    titleY = "h*0.16";
    subtitleY = "h*0.16+95";
  } else if (titlePosition === "bottom") {
    titleY = "h*0.68";
    subtitleY = "h*0.68+90";
  }

  let titleAlpha = "1";
  let subtitleAlpha = "0.92";

  if (titleAnimation === "cinematic") {
    titleAlpha = "if(lt(t,0.3),0,if(lt(t,1.1),(t-0.3)/0.8,1))";
    subtitleAlpha = "if(lt(t,0.7),0,if(lt(t,1.5),(t-0.7)/0.8,0.92))";
  }

  if (titleAnimation === "slide_up") {
    titleY = "(" + titleY + ")+max(0\\,60-t*60)";
    subtitleY = "(" + subtitleY + ")+max(0\\,70-t*60)";
  }

  if (safeTitle.length > 0) {
    filter +=
      ",drawtext=text='" +
      safeTitle +
      "'" +
      ":fontcolor=white@" +
      titleAlpha +
      ":fontsize=" +
      titleSize +
      ":x=(w-text_w)/2" +
      ":y=" +
      titleY +
      ":shadowcolor=black@0.95" +
      ":shadowx=4" +
      ":shadowy=4" +
      ":borderw=2" +
      ":bordercolor=black@0.65";
  }

  if (safeSubtitle.length > 0) {
    filter +=
      ",drawtext=text='" +
      safeSubtitle +
      "'" +
      ":fontcolor=white@" +
      subtitleAlpha +
      ":fontsize=" +
      subtitleSize +
      ":x=(w-text_w)/2" +
      ":y=" +
      subtitleY +
      ":shadowcolor=black@0.9" +
      ":shadowx=3" +
      ":shadowy=3" +
      ":borderw=1" +
      ":bordercolor=black@0.55";
  }

  filter += ",format=yuv420p";
  return filter;
}

app.get("/", function (req, res) {
  res.send("VS Tools Professional Video Engine Running");
});

app.get("/api/health", function (req, res) {
  res.json({
    ok: true,
    engine: "VS Tools Professional Video Engine Final",
    mp4Only: true,
    endpoint: "/api/video/create",
    effects: [
      "cinematic",
      "kenburns",
      "zoom_in",
      "zoom_out",
      "pan_left",
      "pan_right",
      "pan_up",
      "pan_down",
      "pulse",
      "rotate_zoom",
      "blur_zoom",
      "none"
    ],
    transitions: ["fade_in", "fade_out", "fade_both", "none"],
    titleAnimations: ["cinematic", "slide_up", "none"],
    titlePositions: ["center", "top", "bottom"],
    timestamp: new Date().toISOString()
  });
});

app.post(
  "/api/video/create",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "audio", maxCount: 1 }
  ]),
  async function (req, res) {
    let imagePath;
    let audioPath;
    let outputPath;

    try {
      if (!req.files || !req.files.image || !req.files.audio) {
        return res.status(400).json({
          ok: false,
          error: "Image and audio files are required"
        });
      }

      imagePath = req.files.image[0].path;
      audioPath = req.files.audio[0].path;

      const filename = safeName(req.body.filename || "result.mp4");
      const width = Number(req.body.width || 1280);
      const height = Number(req.body.height || 720);
      const fps = Number(req.body.fps || 30);

      const effect = req.body.effect || "cinematic";
      const transition = req.body.transition || "fade_both";

      const title = req.body.title || "";
      const subtitle = req.body.subtitle || "";
      const titleAnimation = req.body.title_animation || "cinematic";
      const titlePosition = req.body.title_position || "center";

      outputPath = path.join(outputDir, Date.now() + "-" + filename);

      const videoFilter = buildVideoFilter(
        effect,
        transition,
        width,
        height,
        fps,
        title,
        subtitle,
        titleAnimation,
        titlePosition
      );

      const args = [
        "-y",
        "-loop",
        "1",
        "-framerate",
        String(fps),
        "-i",
        imagePath,
        "-i",
        audioPath,
        "-vf",
        videoFilter,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-tune",
        "stillimage",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-pix_fmt",
        "yuv420p",
        "-shortest",
        "-movflags",
        "+faststart",
        outputPath
      ];

      await runFFmpeg(args);

      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Disposition", "attachment; filename=" + filename);

      const stream = fs.createReadStream(outputPath);
      stream.pipe(res);

      stream.on("close", function () {
        if (imagePath && fs.existsSync(imagePath)) fs.unlink(imagePath, function () {});
        if (audioPath && fs.existsSync(audioPath)) fs.unlink(audioPath, function () {});
        if (outputPath && fs.existsSync(outputPath)) fs.unlink(outputPath, function () {});
      });
    } catch (error) {
      if (imagePath && fs.existsSync(imagePath)) fs.unlink(imagePath, function () {});
      if (audioPath && fs.existsSync(audioPath)) fs.unlink(audioPath, function () {});
      if (outputPath && fs.existsSync(outputPath)) fs.unlink(outputPath, function () {});

      res.status(500).json({
        ok: false,
        error: error.message
      });
    }
  }
);

app.listen(PORT, "0.0.0.0", function () {
  console.log("VS Tools Professional Video Engine Final running on port " + PORT);
});
