const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

function injectEngine(html) {
  const css = "<style>body{margin:0;background:#05060f;color:white;font-family:Arial,sans-serif;padding:40px;line-height:1.6}h1{font-size:48px;line-height:1.1}p{color:rgba(255,255,255,.8)}.card,.tool-card,section{animation:fadeUp .6s ease both}@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}</style>";

  let output = String(html || "");

  if (output.indexOf("<html") === -1) {
    output = "<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1.0'><title>VS Tools Render</title></head><body>" + output + "</body></html>";
  }

  if (output.indexOf("</head>") !== -1) {
    output = output.replace("</head>", css + "</head>");
  } else {
    output = css + output;
  }

  return output;
}

app.get("/", function (req, res) {
  res.send("VS Tools Render Engine Running");
});

app.get("/api/health", function (req, res) {
  res.json({
    ok: true,
    engine: "VS Tools Render Step 1",
    htmlRender: true,
    animations: true,
    timestamp: new Date().toISOString()
  });
});

app.post("/api/render/html", function (req, res) {
  const html = req.body.html;

  if (!html) {
    return res.status(400).json({
      ok: false,
      error: "HTML content is required"
    });
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(injectEngine(html));
});

app.listen(PORT, "0.0.0.0", function () {
  console.log("Server running on port " + PORT);
});
