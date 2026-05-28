const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(express.static(path.join(__dirname, "public")));

function safeFilename(filename, fallback) {
  const clean = String(filename || fallback).replace(/[^a-zA-Z0-9._-]/g, "");
  return clean || fallback;
}

function downloadHeader(res, filename) {
  res.setHeader("Content-Disposition", 'attachment; filename="' + filename + '"');
}

function injectRenderEngineV2(html = "") {
  const css = `
<style>
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  margin:0;
  min-height:100vh;
  padding-top:96px!important;
  background:
    radial-gradient(circle at top left,rgba(120,80,255,.35),transparent 34%),
    radial-gradient(circle at bottom right,rgba(0,200,255,.22),transparent 35%),
    #05060f;
  color:#fff;
  font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,Arial,sans-serif;
  line-height:1.65;
  overflow-x:hidden;
  animation:vsBodyFade .7s ease both;
}
header,nav,.navbar,.topbar,.app-header,[class*="header"],[class*="navbar"],[class*="topbar"]{
  min-height:auto!important;
  max-height:86px!important;
  padding:14px 24px!important;
  backdrop-filter:blur(18px);
  background:rgba(5,6,15,.76)!important;
  border-bottom:1px solid rgba(255,255,255,.12);
  z-index:1000!important;
}
main,.container,.wrapper,.content,[class*="container"],[class*="wrapper"],[class*="content"]{
  width:min(1120px,calc(100% - 32px));
  margin-left:auto!important;
  margin-right:auto!important;
}
.hero,.hero-section,main>section:first-child,section:first-of-type,[class*="hero"],[class*="headline"],[class*="banner"]{
  padding-top:48px!important;
  padding-bottom:48px!important;
  min-height:auto!important;
  overflow:visible!important;
}
h1,.hero h1,[class*="hero"] h1,[class*="title"]{
  font-size:clamp(34px,5vw,68px)!important;
  line-height:1.08!important;
  letter-spacing:-.035em!important;
  margin:0 0 18px!important;
  max-width:980px!important;
  text-wrap:balance;
  overflow:visible!important;
  animation:vsTitleReveal .85s ease both;
}
h2{
  font-size:clamp(26px,3vw,42px)!important;
  line-height:1.18!important;
  margin-bottom:16px!important;
  text-wrap:balance;
  animation:vsTitleReveal .85s ease both;
}
h3{
  font-size:clamp(20px,2vw,28px)!important;
  line-height:1.25!important;
  animation:vsTitleReveal .85s ease both;
}
p,li,span{
  font-size:clamp(15px,1.2vw,18px);
  line-height:1.7;
  animation:vsTextFade .65s ease both;
}
p{
  max-width:760px;
  color:rgba(255,255,255,.78);
}
section,.card,.tool-card,.panel,.box,.container,.result,.preview,.output,
[class*="card"],[class*="tool"],[class*="panel"],[class*="preview"],[class*="result"]{
  animation:vsFadeUp .75s ease both;
  transition:transform .35s ease,opacity .35s ease,filter .35s ease,box-shadow .35s ease,border-color .35s ease;
}
.card,.tool-card,.panel,.box,[class*="card"],[class*="tool"],[class*="panel"]{
  padding:clamp(18px,2vw,32px)!important;
  border-radius:24px!important;
  background:rgba(255,255,255,.075);
  border:1px solid rgba(255,255,255,.14);
}
.card:hover,.tool-card:hover,button:hover,a:hover,[class*="card"]:hover,[class*="tool"]:hover{
  transform:translateY(-5px) scale(1.015);
  box-shadow:0 20px 60px rgba(0,0,0,.35),0 0 30px rgba(120,80,255,.55);
  border-color:rgba(255,255,255,.35);
}
button,.btn,a.button,input[type="submit"]{
  position:relative;
  overflow:hidden;
  border-radius:14px;
  transition:transform .25s ease,box-shadow .25s ease,filter .25s ease;
}
button::after,.btn::after,a.button::after{
  content:"";
  position:absolute;
  inset:0;
  background:linear-gradient(120deg,transparent,rgba(255,255,255,.35),transparent);
  transform:translateX(-120%);
  transition:transform .65s ease;
}
button:hover::after,.btn:hover::after,a.button:hover::after{
  transform:translateX(120%);
}
img,video,canvas,svg{
  max-width:100%;
  animation:vsSoftZoom .9s ease both;
  transition:transform .4s ease,filter .4s ease;
}
img:hover,video:hover{
  transform:scale(1.025);
  filter:saturate(1.15) contrast(1.05);
}
.vs-render-loading{
  position:fixed;
  inset:0;
  display:grid;
  place-items:center;
  background:rgba(5,6,15,.92);
  backdrop-filter:blur(18px);
  z-index:99999;
  transition:opacity .45s ease,visibility .45s ease;
}
.vs-render-loading.hide{
  opacity:0;
  visibility:hidden;
}
.vs-loader{
  width:64px;
  height:64px;
  border-radius:50%;
  border:4px solid rgba(255,255,255,.12);
  border-top-color:#fff;
  animation:vsSpin .8s linear infinite;
}
.vs-particle{
  position:fixed;
  width:8px;
  height:8px;
  border-radius:999px;
  background:rgba(255,255,255,.35);
  pointer-events:none;
  z-index:0!important;
  animation:vsFloat 8s ease-in-out infinite;
}
@keyframes vsBodyFade{from{opacity:0;filter:blur(8px)}to{opacity:1;filter:blur(0)}}
@keyframes vsFadeUp{from{opacity:0;transform:translateY(28px) scale(.98);filter:blur(8px)}to{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}}
@keyframes vsSoftZoom{from{opacity:0;transform:scale(.96);filter:blur(6px)}to{opacity:1;transform:scale(1);filter:blur(0)}}
@keyframes vsTitleReveal{from{opacity:0;letter-spacing:-.06em;transform:translateY(16px)}to{opacity:1;letter-spacing:normal;transform:translateY(0)}}
@keyframes vsTextFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes vsSpin{to{transform:rotate(360deg)}}
@keyframes vsFloat{0%,100%{transform:translate3d(0,0,0) scale(1);opacity:.25}50%{transform:translate3d(30px,-50px,0) scale(1.6);opacity:.75}}
@keyframes vsRipple{to{transform:scale(3);opacity:0}}
@media(max-width:768px){
  body{padding-top:82px!important}
  header,nav,.navbar,.topbar,.app-header,[class*="header"],[class*="navbar"],[class*="topbar"]{
    max-height:74px!important;
    padding:10px 16px!important;
  }
  h1,.hero h1,[class*="hero"] h1,[class*="title"]{
    font-size:clamp(30px,10vw,46px)!important;
    line-height:1.1!important;
  }
  main,.container,.wrapper,.content,[class*="container"],[class*="wrapper"],[class*="content"]{
    width:min(100% - 24px,100%);
  }
}
@media(prefers-reduced-motion:reduce){
  *{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
}
</style>
`;

  const js = `
<script>
(function(){
  function ready(fn){
    if(document.readyState!=="loading")fn();
    else document.addEventListener("DOMContentLoaded",fn);
  }
  ready(function(){
    var loader=document.createElement("div");
    loader.className="vs-render-loading";
    loader.innerHTML='<div class="vs-loader"></div>';
    document.body.appendChild(loader);

    setTimeout(function(){
      loader.classList.add("hide");
      setTimeout(function(){
        if(loader&&loader.parentNode)loader.parentNode.removeChild(loader);
      },600);
    },550);

    for(var i=0;i<16;i++){
      var p=document.createElement("div");
      p.className="vs-particle";
      p.style.left=Math.random()*100+"vw";
      p.style.top=Math.random()*100+"vh";
      p.style.animationDelay=Math.random()*6+"s";
      p.style.animationDuration=6+Math.random()*8+"s";
      document.body.appendChild(p);
    }

    document.addEventListener("click",function(e){
      var btn=e.target.closest("button,.btn,a.button");
      if(!btn)return;

      var ripple=document.createElement("span");
      var rect=btn.getBoundingClientRect();
      var size=Math.max(rect.width,rect.height);

      ripple.style.position="absolute";
      ripple.style.width=size+"px";
      ripple.style.height=size+"px";
      ripple.style.left=e.clientX-rect.left-size/2+"px";
      ripple.style.top=e.clientY-rect.top-size/2+"px";
      ripple.style.borderRadius="50%";
      ripple.style.background="rgba(255,255,255,.35)";
      ripple.style.transform="scale(0)";
      ripple.style.animation="vsRipple .65s ease-out";
      ripple.style.pointerEvents="none";

      btn.appendChild(ripple);
      setTimeout(function(){
        if(ripple&&ripple.parentNode)ripple.parentNode.removeChild(ripple);
      },700);
    });
  });
})();
</script>
`;

  let output = String(html || "");

  if (!output.includes("<html")) {
    output =
      "<!DOCTYPE html>" +
      "<html>" +
      "<head>" +
      '<meta charset="UTF-8" />' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0" />' +
      "<title>VS Tools Render</title>" +
      "</head>" +
      "<body>" +
      output +
      "</body>" +
      "</html>";
  }

  if (output.includes("</head>")) {
    output = output.replace("</head>", css + "</head>");
  } else {
    output = css + output;
  }

  if (output.includes("</body>")) {
    output = output.replace("</body>", js + "</body>");
  } else {
    output += js;
  }

  return output;
}

async function getBrowser() {
  const puppeteer = require("puppeteer");

  return await puppeteer.launch({
    headless: "new",
    executablePath:
      process.env.PUPPETEER_EXECUTABLE_PATH ||
      process.env.CHROME_BIN ||
      "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--autoplay-policy=no-user-gesture-required"
    ],
    ignoreHTTPSErrors: true
  });
}

app.get("/api/health", function (req, res) {
  res.json({
    ok: true,
    engine: "VS Tools Render Engine V2 Final Stable",
    animations: true,
    transitions: true,
    typography: true,
    headerFix: true,
    htmlDownload: true,
    pngDownload: true,
    pdfDownload: true,
    mp4Download: true,
    timestamp: new Date().toISOString()
  });
});

app.post("/api/render/html", function (req, res) {
  try {
    const html = req.body.html;

    if (!html) {
      return res.status(400).json({
        ok: false,
        error: "HTML content is required"
      });
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(injectRenderEngineV2(html));
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.post("/api/download/html", function (req, res) {
  try {
    const html = req.body.html;
    const safeName = safeFilename(req.body.filename, "vs-tools-render.html");

    if (!html) {
      return res.status(400).json({
        ok: false,
        error: "HTML content is required"
      });
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    downloadHeader(res, safeName);
    res.send(injectRenderEngineV2(html));
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.post("/api/download/pdf", async function (req, res) {
  let browser;

  try {
    const html = req.body.html;
    const safeName = safeFilename(req.body.filename, "vs-tools-render.pdf");
    const width = Number(req.body.width || 1280);
    const height = Number(req.body.height || 720);

    if (!html) {
      return res.status(400).json({
        ok: false,
        error: "HTML content is required"
      });
    }

    browser = await getBrowser();
    const page = await browser.newPage();

    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 1
    });

    await page.setContent(injectRenderEngineV2(html), {
      waitUntil: "networkidle0",
      timeout: 60000
    });

    await page.waitForTimeout(1200);

    const pdf = await page.pdf({
      printBackground: true,
      width: String(width) + "px",
      height: String(height) + "px",
      margin: {
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px"
      }
    });

    res.setHeader("Content-Type", "application/pdf");
    downloadHeader(res, safeName);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  } finally {
    if (browser) await browser.close();
  }
});

app.post("/api/download/png", async function (req, res) {
  let browser;

  try {
    const html = req.body.html;
    const safeName = safeFilename(req.body.filename, "vs-tools-render.png");
    const width = Number(req.body.width || 1280);
    const height = Number(req.body.height || 720);

    if (!html) {
      return res.status(400).json({
        ok: false,
        error: "HTML content is required"
      });
    }

    browser = await getBrowser();
    const page = await browser.newPage();

    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 2
    });

    await page.setContent(injectRenderEngineV2(html), {
      waitUntil: "networkidle0",
      timeout: 60000
    });

    await page.waitForTimeout(1200);

    const png = await page.screenshot({
      type: "png",
      fullPage: true
    });

    res.setHeader("Content-Type", "image/png");
    downloadHeader(res, safeName);
    res.send(png);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  } finally {
    if (browser) await browser.close();
  }
});

app.post("/api/download/mp4", async function (req, res) {
  let browser;
  let outputPath;

  try {
    const html = req.body.html;
    const safeName = safeFilename(req.body.filename, "vs-tools-render.mp4");
    const width = Number(req.body.width || 1280);
    const height = Number(req.body.height || 720);
    const duration = Math.min(Number(req.body.duration || 8), 30);

    if (!html) {
      return res.status(400).json({
        ok: false,
        error: "HTML content is required"
      });
    }

    const PuppeteerScreenRecorder =
      require("puppeteer-screen-recorder").PuppeteerScreenRecorder;

    const tempDir = path.join(__dirname, "tmp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    outputPath = path.join(tempDir, String(Date.now()) + "-" + safeName);

    browser = await getBrowser();
    const page = await browser.newPage();

    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 1
    });

    await page.setContent(injectRenderEngineV2(html), {
      waitUntil: "networkidle0",
      timeout: 60000
    });

    await page.waitForTimeout(800);

    const recorder = new PuppeteerScreenRecorder(page, {
      followNewTab: false,
      fps: 30,
      videoFrame: {
        width,
        height
      },
      videoCrf: 18,
      videoCodec: "libx264",
      videoPreset: "veryfast",
      autopad: {
        color: "black"
      },
      aspectRatio: "16:9",
      ffmpeg_Path: "ffmpeg"
    });

    await recorder.start(outputPath);
    await page.waitForTimeout(duration * 1000);
    await recorder.stop();

    res.setHeader("Content-Type", "video/mp4");
    downloadHeader(res, safeName);

    const stream = fs.createReadStream(outputPath);
    stream.pipe(res);

    stream.on("close", function () {
      if (outputPath && fs.existsSync(outputPath)) {
        fs.unlink(outputPath, function () {});
      }
    });
  } catch (error) {
    if (outputPath && fs.existsSync(outputPath)) {
      fs.unlink(outputPath, function () {});
    }

    res.status(500).json({
      ok: false,
      error: error.message
    });
  } finally {
    if (browser) await browser.close();
  }
});

app.get("*", function (req, res) {
  const indexPath = path.join(__dirname, "public", "index.html");

  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send("<h1>VS Tools Render Engine V2 Final Stable</h1><p>Server is running.</p>");
  }
});

app.listen(PORT, function () {
  console.log("✅ VS Tools Render Engine V2 Final Stable running on port " + PORT);
});