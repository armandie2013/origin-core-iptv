import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT || 4001),
  NODE_KEY: process.env.NODE_KEY || "origin-unknown",
  NODE_TYPE: process.env.NODE_TYPE || "origin",
  NODE_NAME: process.env.NODE_NAME || "Origin",
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL || "",
  MONGO_URI: process.env.MONGO_URI || "",
  HLS_ROOT: process.env.HLS_ROOT || "./storage/hls",
  FFMPEG_PATH: process.env.FFMPEG_PATH || "ffmpeg",
  CHANNEL_IDLE_TIMEOUT_MS: Number(
    process.env.CHANNEL_IDLE_TIMEOUT_MS || 120000
  ),
};