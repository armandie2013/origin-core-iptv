// import { spawn } from "child_process";
// import fs from "fs";
// import path from "path";
// import { env } from "../config/env";
// import { logger } from "../lib/logger";
// import { getChannelHlsDir, getChannelPlaylistPath } from "./hls-path.service";

// function ensureDir(dir: string) {
//   fs.mkdirSync(dir, { recursive: true });
// }

// function cleanDir(dir: string) {
//   if (fs.existsSync(dir)) {
//     fs.rmSync(dir, { recursive: true, force: true });
//   }
//   fs.mkdirSync(dir, { recursive: true });
// }

// export function startFfmpegHls(channelId: string, sourceUrl: string) {
//   const hlsDir = getChannelHlsDir(channelId);
//   const playlistPath = getChannelPlaylistPath(channelId);

//   cleanDir(hlsDir);
//   ensureDir(path.dirname(playlistPath));

//   const args = [
//   "-loglevel",
//   "warning",
//   "-fflags",
//   "+genpts+discardcorrupt",
//   "-reconnect",
//   "1",
//   "-reconnect_streamed",
//   "1",
//   "-reconnect_delay_max",
//   "2",
//   "-rw_timeout",
//   "15000000",
//   "-protocol_whitelist",
//   "file,http,https,tcp,tls",
//   "-i",
//   sourceUrl,
//   "-map",
//   "0:v:0",
//   "-map",
//   "0:a?",
//   "-c",
//   "copy",
//   "-muxdelay",
//   "0",
//   "-muxpreload",
//   "0",
//   "-f",
//   "hls",
//   "-hls_time",
//   "2",
//   "-hls_list_size",
//   "10",
//   "-hls_flags",
//   "delete_segments+append_list+omit_endlist+independent_segments",
//   "-start_number",
//   "0",
//   playlistPath,
// ];

//   logger.info("Iniciando FFmpeg", { channelId, sourceUrl, playlistPath });

//   logger.info("Usando FFMPEG_PATH", { ffmpegPath: env.FFMPEG_PATH });

//   const child = spawn(env.FFMPEG_PATH, args, {
//     stdio: ["ignore", "pipe", "pipe"],
//   });

//   child.stdout.on("data", (data) => {
//     logger.info(`FFmpeg stdout ${channelId}`, data.toString());
//   });

//   child.stderr.on("data", (data) => {
//   const text = data.toString();

//   if (
//     text.includes("Opening") ||
//     text.includes("frame=") ||
//     text.includes("time=") ||
//     text.includes("speed=")
//   ) {
//     return;
//   }

//   logger.info(`FFmpeg stderr ${channelId}`, text);
// });

//   child.on("exit", (code) => {
//     logger.info("FFmpeg finalizado", { channelId, code });
//   });

//   child.on("error", (error) => {
//     logger.error("Error al iniciar FFmpeg", { channelId, error });
//   });

//   return child;
// }

import { spawn, ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import { buildInputArgs } from "../utils/buildInputArgs";
import { buildHlsArgs } from "../utils/buildHlsArgs";

function ensureOutputDir(channelId: string) {
  const baseOutputDir = path.resolve(process.cwd(), "storage", "hls", channelId);
  fs.mkdirSync(baseOutputDir, { recursive: true });

  const outputPath = path.join(baseOutputDir, "index.m3u8");

  return {
    baseOutputDir,
    outputPath,
  };
}

export function getHlsOutputPath(channelId: string): string {
  const { outputPath } = ensureOutputDir(channelId);
  return outputPath;
}

export function startFfmpegStream(
  channelId: string,
  sourceUrl: string
): ChildProcess {
  const { outputPath } = ensureOutputDir(channelId);

  const inputArgs = buildInputArgs(sourceUrl);
  const outputArgs = buildHlsArgs(outputPath);

  const args = [
    "-y",
    "-loglevel",
    "warning",
    "-protocol_whitelist",
    "file,http,https,tcp,tls,udp,rtp",
    ...inputArgs,
    ...outputArgs,
  ];

  console.log("[FFMPEG] Iniciando proceso", {
    channelId,
    sourceUrl,
    args,
  });

  const ffmpeg = spawn("ffmpeg", args, {
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (ffmpeg.stdout) {
    ffmpeg.stdout.on("data", (data) => {
      console.log(`[FFMPEG:${channelId}:stdout] ${data.toString()}`);
    });
  }

  if (ffmpeg.stderr) {
    ffmpeg.stderr.on("data", (data) => {
      console.log(`[FFMPEG:${channelId}:stderr] ${data.toString()}`);
    });
  }

  ffmpeg.on("close", (code) => {
    console.log(`[FFMPEG:${channelId}] finalizó con código ${code}`);
  });

  ffmpeg.on("error", (error) => {
    console.error(`[FFMPEG:${channelId}] error`, error);
  });

  return ffmpeg;
}

export const startFfmpegHls = startFfmpegStream;