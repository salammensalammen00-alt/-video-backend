const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const os = require("os");
const youtubedl = require("youtube-dl-exec");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Video backend işləyir!"
  });
});

app.post("/api/download", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      error: "Video linki daxil edilməyib."
    });
  }

  if (
    !url.includes("instagram.com") &&
    !url.includes("tiktok.com")
  ) {
    return res.status(400).json({
      error: "Yalnız Instagram və TikTok linkləri qəbul edilir."
    });
  }

  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "video-")
  );

  const output = path.join(tempDir, "video.%(ext)s");

  try {
    await youtubedl(url, {
      output: output,
      format: "best[ext=mp4]/best",
      noPlaylist: true,
      noWarnings: true
    });

    const files = fs
      .readdirSync(tempDir)
      .filter(file => file.startsWith("video."));

    if (files.length === 0) {
      throw new Error("Video tapılmadı.");
    }

    const filePath = path.join(tempDir, files[0]);

    res.download(filePath, "video.mp4", () => {
      fs.rmSync(tempDir, {
        recursive: true,
        force: true
      });
    });

  } catch (error) {
    console.error(error);

    fs.rmSync(tempDir, {
      recursive: true,
      force: true
    });

    res.status(500).json({
      error: "Video yüklənə bilmədi."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server ${PORT} portunda işləyir.`);
});
