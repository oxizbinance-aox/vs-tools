const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { execFile } = require("child_process");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";

const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  "";

const supabaseAuth =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

app.use(cors());
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "dist")));

app.get("/api/health", function (req, res) {
  res.json({
    ok: true,
    engine: "VS-Tools Presentation Final",
    dashboard: true,
    auth: !!supabaseAuth,
    serviceRole: !!supabaseAdmin,
    supabaseUrlLoaded: !!SUPABASE_URL,
    supabaseAnonLoaded: !!SUPABASE_ANON_KEY,
    serviceRoleLoaded: !!SUPABASE_SERVICE_ROLE_KEY,
    envKeys: Object.keys(process.env).filter(function (key) {
      return key.includes("SUPABASE") || key.includes("RAILWAY") || key.includes("VITE");
    }),
    output: "mp4",
    endpoint: "/api/video/timeline",
    timestamp: new Date().toISOString()
  });
});

const uploadDir = path.join(__dirname, "uploads");
const outputDir = path.join(__dirname, "outputs");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 500 * 1024 * 1024,
    files: 200
  }
});

function filesByField(req, fieldName) {
  if (!req.files) return [];

  if (Array.isArray(req.files)) {
    return req.files.filter(function (file) {
      return file.fieldname === fieldName;
    });
  }

  return req.files[fieldName] || [];
}

function firstFileByField(req, fieldName) {
  const files = filesByField(req, fieldName);
  return files.length > 0 ? files[0] : null;
}

function safeName(name) {
  return String(name || "result.mp4").split(/[\\\/:*?"<>| ]/).join("") || "result.mp4";
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function normalizePercentOrUnit(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n > 1) return clampNumber(n / 100, 0, 1, fallback);
  return clampNumber(n, 0, 1, fallback);
}

function cleanup(paths) {
  paths.forEach(function (p) {
    if (p && fs.existsSync(p)) fs.unlink(p, function () {});
  });
}

function run(cmd, args) {
  return new Promise(function (resolve, reject) {
    execFile(cmd, args, { maxBuffer: 1024 * 1024 * 30 }, function (error, stdout, stderr) {
      if (error) return reject(new Error(stderr || error.message));
      resolve({ stdout, stderr });
    });
  });
}

function escapeText(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/\n/g, " ");
}

function parseTimeline(raw) {
  try {
    const data = JSON.parse(raw || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function parseSubtitles(raw) {
  try {
    const data = JSON.parse(raw || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function normalizeBoolean(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  const text = String(value).toLowerCase();
  if (text === "false" || text === "0" || text === "no") return false;
  if (text === "true" || text === "1" || text === "yes") return true;
  return fallback;
}

function subtitleFontSize(width, requestedSize, text) {
  const requested = clampNumber(requestedSize, 20, 90, 42);
  const maxByWidth = Math.max(22, Math.floor(width / 18));
  let size = Math.min(requested, maxByWidth);

  const length = String(text || "").length;
  if (length > 90) size = Math.floor(size * 0.72);
  else if (length > 65) size = Math.floor(size * 0.80);
  else if (length > 45) size = Math.floor(size * 0.90);

  return Math.max(18, size);
}

function subtitleYExpression(position) {
  if (position === "top") return "h*0.08";
  if (position === "center") return "(h-text_h)/2";
  return "h-text_h-h*0.075";
}

function subtitleStyleSettings(styleName, boxEnabled) {
  if (styleName === "documentary") {
    return {
      fontcolor: "white@0.96",
      borderw: 1,
      bordercolor: "black@0.60",
      shadow: ":shadowcolor=black@0.78:shadowx=2:shadowy=2",
      box: boxEnabled ? ":box=1:boxcolor=black@0.30:boxborderw=14" : ""
    };
  }

  if (styleName === "youtube") {
    return {
      fontcolor: "white",
      borderw: 3,
      bordercolor: "black@0.82",
      shadow: ":shadowcolor=black@0.70:shadowx=2:shadowy=2",
      box: boxEnabled ? ":box=1:boxcolor=black@0.34:boxborderw=12" : ""
    };
  }

  if (styleName === "minimal") {
    return {
      fontcolor: "white@0.94",
      borderw: 1,
      bordercolor: "black@0.45",
      shadow: ":shadowcolor=black@0.62:shadowx=2:shadowy=2",
      box: boxEnabled ? ":box=1:boxcolor=black@0.20:boxborderw=12" : ""
    };
  }

  return {
    fontcolor: "white",
    borderw: 3,
    bordercolor: "black@0.84",
    shadow: ":shadowcolor=black@0.76:shadowx=2:shadowy=3",
    box: boxEnabled ? ":box=1:boxcolor=black@0.28:boxborderw=14" : ""
  };
}

function buildSubtitleFilters(filter, item, width, duration) {
  const subtitles = Array.isArray(item.subtitles) ? item.subtitles : [];
  if (!subtitles.length) return filter;

  const sceneStart = Number(item.start || 0);
  const position = item.subtitlePosition || "bottom";
  const styleName = item.subtitleStyle || "tiktok";
  const boxEnabled = item.subtitleBoxEnabled !== false;
  const style = subtitleStyleSettings(styleName, boxEnabled);
  const yExpr = subtitleYExpression(position);

  subtitles.forEach(function (subtitle) {
    const text = escapeText(subtitle.text || "");
    if (!text) return;

    const absoluteStart = Number(subtitle.start || 0);
    const absoluteEnd = Number(subtitle.end || 0);
    const relativeStart = Math.max(0, absoluteStart - sceneStart);
    const relativeEnd = Math.min(duration, absoluteEnd - sceneStart);

    if (relativeEnd <= 0 || relativeStart >= duration || relativeEnd <= relativeStart) return;

    const fontSize = subtitleFontSize(width, item.subtitleFontSize, text);
    const enable =
      ":enable='between(t\\," +
      relativeStart.toFixed(2) +
      "\\," +
      relativeEnd.toFixed(2) +
      ")'";

    filter +=
      ",drawtext=text='" +
      text +
      "':fontcolor=" +
      style.fontcolor +
      ":fontsize=" +
      fontSize +
      ":x=(w-text_w)/2:y=" +
      yExpr +
      ":line_spacing=8:borderw=" +
      style.borderw +
      ":bordercolor=" +
      style.bordercolor +
      style.shadow +
      style.box +
      enable;
  });

  return filter;
}

function buildMotionFilter(item, width, height, fps) {
  const effect = item.effect || "cinematic";
  const duration = clampNumber(item.duration, 0.2, 36000, 5);
  const totalFrames = Math.max(1, Math.floor(duration * fps));

  const zoomStart = clampNumber(item.zoomStart, 1, 5, 1);
  const zoomEnd = clampNumber(item.zoomEnd, 1, 5, 1.18);
  const focusX = normalizePercentOrUnit(item.focusX, 0.5);
  const focusY = normalizePercentOrUnit(item.focusY, 0.5);

  const prep =
    "scale=" +
    width +
    ":" +
    height +
    ":force_original_aspect_ratio=increase,crop=" +
    width +
    ":" +
    height;

  if (effect === "none") {
    return (
      "scale=" +
      width +
      ":" +
      height +
      ":force_original_aspect_ratio=decrease,pad=" +
      width +
      ":" +
      height +
      ":(ow-iw)/2:(oh-ih)/2,format=yuv420p"
    );
  }

  let zoomExpr = "'min(1.06\\,1+0.06*on/" + totalFrames + ")'";
  let xExpr = "'(iw-iw/zoom)*0.5+sin(on/120)*4'";
  let yExpr = "'(ih-ih/zoom)*0.5+cos(on/140)*3'";

  if (effect === "manual_zoom") {
    zoomExpr = "'" + zoomStart + "+(" + (zoomEnd - zoomStart) + ")*on/" + totalFrames + "'";
    xExpr = "'(iw-iw/zoom)*" + focusX + "'";
    yExpr = "'(ih-ih/zoom)*" + focusY + "'";
  } else if (effect === "zoom_in") {
    zoomExpr = "'min(1.12\\,1+0.12*on/" + totalFrames + ")'";
  } else if (effect === "zoom_out") {
    zoomExpr = "'max(1.0\\,1.12-0.12*on/" + totalFrames + ")'";
  } else if (effect === "pan_left") {
    zoomExpr = "'1.18'";
    xExpr = "'(iw-iw/zoom)*(1-on/" + totalFrames + ")'";
  } else if (effect === "pan_right") {
    zoomExpr = "'1.18'";
    xExpr = "'(iw-iw/zoom)*(on/" + totalFrames + ")'";
  } else if (effect === "pan_up") {
    zoomExpr = "'1.18'";
    yExpr = "'(ih-ih/zoom)*(1-on/" + totalFrames + ")'";
  } else if (effect === "pan_down") {
    zoomExpr = "'1.18'";
    yExpr = "'(ih-ih/zoom)*(on/" + totalFrames + ")'";
  } else if (effect === "pulse") {
    zoomExpr = "'1.06+0.035*sin(on/10)'";
  } else if (effect === "rotate_zoom") {
    zoomExpr = "'min(1.18\\,1+0.18*on/" + totalFrames + ")'";
  } else if (effect === "blur_zoom") {
    zoomExpr = "'min(1.20\\,1+0.20*on/" + totalFrames + ")'";
  }

  let filter =
    prep +
    ",zoompan=z=" +
    zoomExpr +
    ":x=" +
    xExpr +
    ":y=" +
    yExpr +
    ":d=1:s=" +
    width +
    "x" +
    height +
    ":fps=" +
    fps;

  if (effect === "rotate_zoom") {
    filter += ",rotate='0.006*sin(n/30)':fillcolor=black";
  }

  if (effect === "blur_zoom") {
    filter += ",boxblur=2:1,unsharp=5:5:0.8";
  }

  filter += ",format=yuv420p";
  return filter;
}

function applyTransitionAndText(filter, item, width, duration) {
  let transition = item.transition || "fade";

  const transitionAliases = {
    zoom: "fade",
    slideLeft: "fade",
    slideRight: "fade",
    slideUp: "fade",
    slideDown: "fade",
    rise: "fade",
    rotateIn: "fade",
    blurReveal: "dark",
    glitch: "flash",
    filmBurn: "flash",
    flashCut: "flash",
    glassFade: "fade",
    cinematicFade: "fade",
    softFlash: "flash",
    wipeLeft: "fade",
    wipeRight: "fade",
    wipeUp: "fade",
    wipeDown: "fade",
    pushLeft: "fade",
    pushRight: "fade",
    spinZoom: "fade",
    dreamBlur: "dark",
    matrixGlitch: "flash",
    neonSwipe: "fade",
    paperSlide: "fade",
    classicDissolve: "fade",
    cameraFlash: "flash",
    vhsNoise: "flash",
    luxuryReveal: "dark"
  };

  transition = transitionAliases[transition] || transition;
  const title = escapeText(item.title || "");
  const subtitle = escapeText(item.subtitle || "");

  if (transition === "fade") {
    filter +=
      ",fade=t=in:st=0:d=0.35,fade=t=out:st=" +
      Math.max(0.1, duration - 0.4).toFixed(2) +
      ":d=0.35";
  } else if (transition === "fade_in") {
    filter += ",fade=t=in:st=0:d=0.45";
  } else if (transition === "fade_out") {
    filter +=
      ",fade=t=out:st=" +
      Math.max(0.1, duration - 0.5).toFixed(2) +
      ":d=0.45";
  } else if (transition === "flash") {
    filter +=
      ",fade=t=in:st=0:d=0.15:color=white,fade=t=out:st=" +
      Math.max(0.1, duration - 0.2).toFixed(2) +
      ":d=0.15:color=white";
  } else if (transition === "dark") {
    filter +=
      ",fade=t=in:st=0:d=0.35:color=black,fade=t=out:st=" +
      Math.max(0.1, duration - 0.4).toFixed(2) +
      ":d=0.35:color=black";
  }

  const titleSize = Math.max(34, Math.floor(width / 18));
  const subtitleSize = Math.max(20, Math.floor(width / 40));

  let titleY = "(h-text_h)/2-55";
  let subtitleY = "(h-text_h)/2+45";

  if (item.title_position === "top") {
    titleY = "h*0.14";
    subtitleY = "h*0.14+85";
  } else if (item.title_position === "bottom") {
    titleY = "h*0.68";
    subtitleY = "h*0.68+85";
  }

  if (title.length > 0) {
    filter +=
      ",drawtext=text='" +
      title +
      "':fontcolor=white:fontsize=" +
      titleSize +
      ":x=(w-text_w)/2:y=" +
      titleY +
      ":shadowcolor=black@0.95:shadowx=4:shadowy=4:borderw=2:bordercolor=black@0.65";
  }

  if (subtitle.length > 0) {
    filter +=
      ",drawtext=text='" +
      subtitle +
      "':fontcolor=white@0.9:fontsize=" +
      subtitleSize +
      ":x=(w-text_w)/2:y=" +
      subtitleY +
      ":shadowcolor=black@0.9:shadowx=3:shadowy=3:borderw=1:bordercolor=black@0.55";
  }

  filter = buildSubtitleFilters(filter, item, width, duration);

  return filter;
}

async function createScene(imagePath, scenePath, item, width, height, fps) {
  const duration = clampNumber(item.duration, 0.2, 36000, 5);
  let filter = buildMotionFilter(item, width, height, fps);
  filter = applyTransitionAndText(filter, item, width, duration);

  await run("ffmpeg", [
    "-y",
    "-loop",
    "1",
    "-framerate",
    String(fps),
    "-t",
    String(duration),
    "-i",
    imagePath,
    "-vf",
    filter,
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-pix_fmt",
    "yuv420p",
    "-r",
    String(fps),
    scenePath
  ]);
}

async function concatScenes(scenePaths, concatFile, videoOnlyPath, fps) {
  const list = scenePaths
    .map(function (p) {
      return "file '" + p.replace(/\\/g, "/") + "'";
    })
    .join("\n");

  fs.writeFileSync(concatFile, list);

  await run("ffmpeg", [
  "-y",
  "-f",
  "concat",
  "-safe",
  "0",
  "-i",
  concatFile,
  "-r",
  String(fps),
  "-fps_mode",
  "cfr",
  "-c:v",
  "libx264",
  "-preset",
  "veryfast",
  "-crf",
  "20",
  "-pix_fmt",
  "yuv420p",
  "-video_track_timescale",
  "90000",
  "-movflags",
  "+faststart",
  videoOnlyPath
]);
}

async function mergeAudio(videoOnlyPath, audioPath, outputPath) {
  if (!audioPath) {
    fs.copyFileSync(videoOnlyPath, outputPath);
    return;
  }

  await run("ffmpeg", [
    "-y",
    "-i",
    videoOnlyPath,
    "-i",
    audioPath,
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-shortest",
    "-movflags",
    "+faststart",
    outputPath
  ]);
}

async function getUserFromAuth(req) {
  if (!supabaseAuth) throw new Error("Supabase auth is not configured");

  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "");

  if (!token) throw new Error("Missing auth token");

  const result = await supabaseAuth.auth.getUser(token);

  if (result.error || !result.data.user) {
    throw new Error("Invalid auth token");
  }

  return {
    user: result.data.user,
    token: token
  };
}

async function uploadToStorage(localPath, storagePath, contentType) {
  if (!supabaseAdmin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }

  const buffer = fs.readFileSync(localPath);

  const result = await supabaseAdmin.storage
    .from("project-assets")
    .upload(storagePath, buffer, {
      upsert: true,
      contentType: contentType || "application/octet-stream"
    });

  if (result.error) throw result.error;

  return supabaseAdmin.storage
    .from("project-assets")
    .getPublicUrl(storagePath).data.publicUrl;
}

app.post("/api/auth/signup", async function (req, res) {
  try {
    if (!supabaseAuth) {
      return res.status(500).json({
        ok: false,
        error: "Supabase is not configured"
      });
    }

    const email = req.body.email;
    const password = req.body.password;

    const result = await supabaseAuth.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: req.headers.origin || ""
      }
    });

    if (result.error) {
      return res.status(400).json({
        ok: false,
        error: result.error.message
      });
    }

    res.json({
      ok: true,
      message: "Account created. Please check your email inbox to verify your account before logging in.",
      user: result.data.user
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.post("/api/auth/login", async function (req, res) {
  try {
    if (!supabaseAuth) {
      return res.status(500).json({
        ok: false,
        error: "Supabase is not configured"
      });
    }

    const email = req.body.email;
    const password = req.body.password;

    const result = await supabaseAuth.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (result.error) {
      return res.status(400).json({
        ok: false,
        error: result.error.message
      });
    }

    res.json({
      ok: true,
      user: result.data.user,
      session: result.data.session
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.get("/api/projects", async function (req, res) {
  try {
    const auth = await getUserFromAuth(req);

    if (!supabaseAdmin) {
      return res.status(500).json({
        ok: false,
        error: "SUPABASE_SERVICE_ROLE_KEY is not configured"
      });
    }

    const result = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("updated_at", { ascending: false });

    if (result.error) throw result.error;

    res.json({
      ok: true,
      projects: result.data
    });
  } catch (error) {
    res.status(401).json({
      ok: false,
      error: error.message
    });
  }
});

app.post(
  "/api/projects/save",
  upload.any(),
  async function (req, res) {
    const tempFiles = [];

    try {
      const auth = await getUserFromAuth(req);

      if (!supabaseAdmin) {
        return res.status(500).json({
          ok: false,
          error: "SUPABASE_SERVICE_ROLE_KEY is not configured"
        });
      }

      const projectId = req.body.projectId || crypto.randomUUID();
      const name = req.body.name || "Untitled Project";
      const oldAssets = JSON.parse(req.body.oldAssets || '{"images":[],"audio":null}');
      const timeline = JSON.parse(req.body.timeline || "[]");

      const assets = {
        images: oldAssets.images || [],
        audio: oldAssets.audio || null
      };

      const images = filesByField(req, "images");
      const audio = firstFileByField(req, "audio");

      if (images.length > 0) {
        assets.images = [];

        for (let i = 0; i < images.length; i++) {
          tempFiles.push(images[i].path);

          const storagePath =
            auth.user.id +
            "/" +
            projectId +
            "/images/" +
            i +
            "-" +
            images[i].originalname;

          const url = await uploadToStorage(
            images[i].path,
            storagePath,
            images[i].mimetype
          );

          assets.images.push({
            name: images[i].originalname,
            path: storagePath,
            url: url,
            type: images[i].mimetype
          });
        }
      }

      if (audio) {
        tempFiles.push(audio.path);

        const storagePath =
          auth.user.id + "/" + projectId + "/audio/" + audio.originalname;

        const url = await uploadToStorage(
          audio.path,
          storagePath,
          audio.mimetype
        );

        assets.audio = {
          name: audio.originalname,
          path: storagePath,
          url: url,
          type: audio.mimetype
        };
      }

      const data = {
        filename: req.body.filename || "result.mp4",
        resolution: req.body.resolution || "1280x720",
        timeline: timeline,
        assets: assets
      };

      const result = await supabaseAdmin
        .from("projects")
        .upsert({
          id: projectId,
          user_id: auth.user.id,
          name: name,
          data: data,
          updated_at: new Date().toISOString()
        })
        .select("*")
        .single();

      if (result.error) throw result.error;

      cleanup(tempFiles);

      res.json({
        ok: true,
        project: result.data
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

app.delete("/api/projects/:id", async function (req, res) {
  try {
    const auth = await getUserFromAuth(req);

    if (!supabaseAdmin) {
      return res.status(500).json({
        ok: false,
        error: "SUPABASE_SERVICE_ROLE_KEY is not configured"
      });
    }

    const result = await supabaseAdmin
      .from("projects")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", auth.user.id);

    if (result.error) throw result.error;

    res.json({
      ok: true
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.get("/api/health", function (req, res) {
  res.json({
    ok: true,
    engine: "VS-Tools Presentation Final",
    dashboard: true,
    auth: Boolean(supabaseAuth),
    serviceRole: Boolean(supabaseAdmin),

    supabaseUrlLoaded: Boolean(SUPABASE_URL),
    supabaseAnonLoaded: Boolean(SUPABASE_ANON_KEY),
    serviceRoleLoaded: Boolean(SUPABASE_SERVICE_ROLE_KEY),

    envKeys: Object.keys(process.env).filter(function (k) {
      return k.includes("SUPABASE") || k.includes("SERVICE");
    }),

    output: "mp4",
    endpoint: "/api/video/timeline",
    timestamp: new Date().toISOString()
  });
});

app.post(
  "/api/video/timeline",
  upload.any(),
  async function (req, res) {
    const tempFiles = [];
    let outputPath = "";

    try {
      const images = filesByField(req, "images").concat(filesByField(req, "image"));
      const audio = firstFileByField(req, "audio");
      const audioPath = audio ? audio.path : "";

      if (!images.length) {
        return res.status(400).json({
          ok: false,
          error: "images are required"
        });
      }

      images.forEach(function (img) {
        tempFiles.push(img.path);
      });

      if (audioPath) tempFiles.push(audioPath);

      const filename = safeName(req.body.filename || "result.mp4");
      const width = clampNumber(req.body.width, 360, 3840, 1280);
      const height = clampNumber(req.body.height, 360, 2160, 720);
      const fps = clampNumber(req.body.fps, 30, 30, 30);
      const timeline = parseTimeline(req.body.timeline);
      const subtitles = parseSubtitles(req.body.subtitles);
      const subtitleStyle = req.body.subtitleStyle || "tiktok";
      const subtitlePosition = req.body.subtitlePosition || "bottom";
      const subtitleFontSize = clampNumber(req.body.subtitleFontSize, 20, 90, 42);
      const subtitleBoxEnabled = normalizeBoolean(req.body.subtitleBoxEnabled, true);

      const jobId = String(Date.now());
      const scenePaths = [];
      const concatFile = path.join(outputDir, jobId + "-concat.txt");
      const videoOnlyPath = path.join(outputDir, jobId + "-video.mp4");
      outputPath = path.join(outputDir, jobId + "-" + filename);

      tempFiles.push(concatFile, videoOnlyPath, outputPath);

      for (let i = 0; i < images.length; i++) {
        const item = timeline[i] || {};

        const itemStart = Number(item.start || 0);
        const itemEnd = Number(item.end || 0);
        const computedDuration = itemEnd > itemStart ? itemEnd - itemStart : 5;

        item.duration = clampNumber(item.duration || computedDuration, 0.2, 36000, computedDuration);
        if (!item.effect) item.effect = i % 2 === 0 ? "cinematic" : "zoom_in";
        if (!item.transition) item.transition = "fade";

        item.subtitles = subtitles.filter(function (subtitle) {
          const subStart = Number(subtitle.start || 0);
          const subEnd = Number(subtitle.end || 0);
          const sceneStart = Number(item.start || 0);
          const sceneEnd = sceneStart + Number(item.duration || 5);
          return subEnd > sceneStart && subStart < sceneEnd;
        });

        item.subtitleStyle = subtitleStyle;
        item.subtitlePosition = subtitlePosition;
        item.subtitleFontSize = subtitleFontSize;
        item.subtitleBoxEnabled = subtitleBoxEnabled;

        const scenePath = path.join(
          outputDir,
          jobId + "-scene-" + i + ".mp4"
        );

        scenePaths.push(scenePath);
        tempFiles.push(scenePath);

        await createScene(images[i].path, scenePath, item, width, height, fps);
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

app.use(function (req, res) {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      ok: false,
      error: "API endpoint not found"
    });
  }

  const distIndex = path.join(__dirname, "dist", "index.html");
  const publicIndex = path.join(__dirname, "public", "index.html");

  if (fs.existsSync(distIndex)) {
    return res.sendFile(distIndex);
  }

  if (fs.existsSync(publicIndex)) {
    return res.sendFile(publicIndex);
  }

  return res.send("<h1>VS-Tools Presentation Final</h1><p>Server is running.</p>");
});

app.listen(PORT, "0.0.0.0", function () {
  console.log("VS-Tools Presentation Final running on port " + PORT);
});
