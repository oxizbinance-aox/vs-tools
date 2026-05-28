const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "50mb" }));

app.get("/", function (req, res) {
  res.send("VS Tools Render Engine Running");
});

app.get("/api/health", function (req, res) {
  res.json({
    ok: true,
    engine: "VS Tools Stable",
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, "0.0.0.0", function () {
  console.log("Server running on port " + PORT);
});
