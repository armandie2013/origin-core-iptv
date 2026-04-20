// // import { Request, Response } from "express";
// // import mongoose from "mongoose";
// // import fs from "fs";
// // import Channel from "../models/Channel";
// // import { startFfmpegHls } from "../services/ffmpeg.service";
// // import {
// //   getActiveChannel,
// //   setActiveChannel,
// //   updateLastRequestAt,
// //   updateChannelStatus,
// // } from "../services/active-channel-registry.service";
// // import {
// //   getChannelPlaylistPath,
// //   getChannelPublicPlaylistUrl,
// // } from "../services/hls-path.service";
// // import { resolveBestSourceUrl } from "../services/source-resolver.service";

// // async function waitForPlaylist(
// //   playlistPath: string,
// //   timeoutMs = 15000,
// //   intervalMs = 500
// // ) {
// //   const startedAt = Date.now();

// //   while (Date.now() - startedAt < timeoutMs) {
// //     if (fs.existsSync(playlistPath)) {
// //       return true;
// //     }
// //     await new Promise((resolve) => setTimeout(resolve, intervalMs));
// //   }

// //   return false;
// // }

// // export async function streamController(req: Request, res: Response) {
// //   try {
// //     const rawChannelId = req.params.channelId;
// //     const channelId = Array.isArray(rawChannelId)
// //       ? rawChannelId[0]
// //       : rawChannelId;

// //     if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
// //       return res.status(400).json({
// //         ok: false,
// //         message: "Canal inválido",
// //       });
// //     }

// //     const existing = getActiveChannel(channelId);

// //     if (existing) {
// //       const processAlive =
// //         existing.process.exitCode === null && !existing.process.killed;

// //       if (processAlive) {
// //         updateLastRequestAt(channelId);
// //         return res.redirect(getChannelPublicPlaylistUrl(channelId));
// //       }
// //     }

// //     const channel = await Channel.findById(channelId).lean();

// //     if (!channel) {
// //       return res.status(404).json({
// //         ok: false,
// //         message: "Canal no encontrado",
// //       });
// //     }

// //     if (!(channel as any).estado) {
// //       return res.status(403).json({
// //         ok: false,
// //         message: "Canal inactivo",
// //       });
// //     }

// //     const sourceUrl = String((channel as any).urlOrigen || "").trim();

// //     if (!sourceUrl) {
// //       return res.status(400).json({
// //         ok: false,
// //         message: "Canal sin URL de origen",
// //       });
// //     }

// //     const resolvedSourceUrl = await resolveBestSourceUrl(sourceUrl);

// //     const process = startFfmpegHls(channelId, resolvedSourceUrl);

// //     setActiveChannel(channelId, {
// //       channelId,
// //       sourceUrl: resolvedSourceUrl,
// //       process,
// //       startedAt: Date.now(),
// //       lastRequestAt: Date.now(),
// //       status: "starting",
// //     });

// //     const playlistPath = getChannelPlaylistPath(channelId);
// //     const ready = await waitForPlaylist(playlistPath, 15000, 500);

// //     if (!ready) {
// //       updateChannelStatus(channelId, "error");

// //       return res.status(504).json({
// //         ok: false,
// //         message: "Timeout generando HLS",
// //       });
// //     }

// //     updateChannelStatus(channelId, "running");

// //     return res.redirect(getChannelPublicPlaylistUrl(channelId));
// //   } catch (error) {
// //     console.error(error);

// //     return res.status(500).json({
// //       ok: false,
// //       message: "Error interno",
// //     });
// //   }
// // }

// // import { Request, Response } from "express";
// // import mongoose from "mongoose";
// // import fs from "fs";
// // import Channel from "../models/Channel";
// // import { startFfmpegHls } from "../services/ffmpeg.service";
// // import {
// //   getActiveChannel,
// //   setActiveChannel,
// //   updateLastRequestAt,
// //   updateChannelStatus,
// // } from "../services/active-channel-registry.service";
// // import {
// //   getChannelPlaylistPath,
// //   getChannelPublicPlaylistUrl,
// // } from "../services/hls-path.service";
// // import { resolveBestSourceUrl } from "../services/source-resolver.service";

// // function countMediaSegmentsInPlaylist(content: string) {
// //   return content
// //     .split(/\r?\n/)
// //     .map((line) => line.trim())
// //     .filter((line) => line && !line.startsWith("#") && line.endsWith(".ts"))
// //     .length;
// // }

// // function isPlaylistReady(playlistPath: string, minSegments = 2) {
// //   if (!fs.existsSync(playlistPath)) {
// //     return false;
// //   }

// //   try {
// //     const content = fs.readFileSync(playlistPath, "utf8");

// //     if (!content.includes("#EXTM3U")) {
// //       return false;
// //     }

// //     const segmentCount = countMediaSegmentsInPlaylist(content);

// //     return segmentCount >= minSegments;
// //   } catch {
// //     return false;
// //   }
// // }

// // async function waitForPlaylistReady(
// //   playlistPath: string,
// //   timeoutMs = 20000,
// //   intervalMs = 500,
// //   minSegments = 2
// // ) {
// //   const startedAt = Date.now();

// //   while (Date.now() - startedAt < timeoutMs) {
// //     if (isPlaylistReady(playlistPath, minSegments)) {
// //       return true;
// //     }

// //     await new Promise((resolve) => setTimeout(resolve, intervalMs));
// //   }

// //   return false;
// // }

// // export async function streamController(req: Request, res: Response) {
// //   try {
// //     const rawChannelId = req.params.channelId;
// //     const channelId = Array.isArray(rawChannelId)
// //       ? rawChannelId[0]
// //       : rawChannelId;

// //     if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
// //       return res.status(400).json({
// //         ok: false,
// //         message: "Canal inválido",
// //       });
// //     }

// //     const playlistPath = getChannelPlaylistPath(channelId);
// //     const publicPlaylistUrl = getChannelPublicPlaylistUrl(channelId);

// //     const existing = getActiveChannel(channelId);

// //     if (existing) {
// //       const processAlive =
// //         existing.process.exitCode === null && !existing.process.killed;

// //       if (processAlive) {
// //         updateLastRequestAt(channelId);

// //         if (existing.status === "running" && isPlaylistReady(playlistPath, 2)) {
// //           return res.redirect(publicPlaylistUrl);
// //         }

// //         const readyExisting = await waitForPlaylistReady(
// //           playlistPath,
// //           12000,
// //           500,
// //           2
// //         );

// //         if (readyExisting) {
// //           updateChannelStatus(channelId, "running");
// //           return res.redirect(publicPlaylistUrl);
// //         }
// //       }
// //     }

// //     const channel = await Channel.findById(channelId).lean();

// //     if (!channel) {
// //       return res.status(404).json({
// //         ok: false,
// //         message: "Canal no encontrado",
// //       });
// //     }

// //     if (!(channel as any).estado) {
// //       return res.status(403).json({
// //         ok: false,
// //         message: "Canal inactivo",
// //       });
// //     }

// //     const sourceUrl = String((channel as any).urlOrigen || "").trim();

// //     if (!sourceUrl) {
// //       return res.status(400).json({
// //         ok: false,
// //         message: "Canal sin URL de origen",
// //       });
// //     }

// //     const resolvedSourceUrl = await resolveBestSourceUrl(sourceUrl);
// //     const process = startFfmpegHls(channelId, resolvedSourceUrl);

// //     setActiveChannel(channelId, {
// //       channelId,
// //       sourceUrl: resolvedSourceUrl,
// //       process,
// //       startedAt: Date.now(),
// //       lastRequestAt: Date.now(),
// //       status: "starting",
// //     });

// //     const ready = await waitForPlaylistReady(playlistPath, 20000, 500, 2);

// //     if (!ready) {
// //       updateChannelStatus(channelId, "error");

// //       return res.status(504).json({
// //         ok: false,
// //         message: "Timeout generando HLS estable",
// //       });
// //     }

// //     updateChannelStatus(channelId, "running");

// //     return res.redirect(publicPlaylistUrl);
// //   } catch (error) {
// //     console.error(error);

// //     return res.status(500).json({
// //       ok: false,
// //       message: "Error interno",
// //     });
// //   }
// // }

// import { Request, Response } from "express";
// import mongoose from "mongoose";
// import fs from "fs";
// import Channel from "../models/Channel";
// import { startFfmpegHls } from "../services/ffmpeg.service";
// import {
//   getActiveChannel,
//   setActiveChannel,
//   updateLastRequestAt,
//   updateChannelStatus,
// } from "../services/active-channel-registry.service";
// import {
//   getChannelPlaylistPath,
//   getChannelPublicPlaylistUrl,
// } from "../services/hls-path.service";
// import {
//   resolveBestSourceUrl,
//   isExternalHlsSource,
// } from "../services/source-resolver.service";
// import { logger } from "../lib/logger";

// type ExternalBypassEntry = {
//   channelId: string;
//   sourceUrl: string;
//   resolvedSourceUrl: string;
//   createdAt: number;
// };

// const externalBypassCache = new Map<string, ExternalBypassEntry>();

// function countMediaSegmentsInPlaylist(content: string) {
//   return content
//     .split(/\r?\n/)
//     .map((line) => line.trim())
//     .filter((line) => line && !line.startsWith("#") && line.endsWith(".ts"))
//     .length;
// }

// function isPlaylistReady(playlistPath: string, minSegments = 2) {
//   if (!fs.existsSync(playlistPath)) {
//     return false;
//   }

//   try {
//     const content = fs.readFileSync(playlistPath, "utf8");

//     if (!content.includes("#EXTM3U")) {
//       return false;
//     }

//     const segmentCount = countMediaSegmentsInPlaylist(content);

//     return segmentCount >= minSegments;
//   } catch {
//     return false;
//   }
// }

// async function waitForPlaylistReady(
//   playlistPath: string,
//   timeoutMs = 20000,
//   intervalMs = 500,
//   minSegments = 2
// ) {
//   const startedAt = Date.now();

//   while (Date.now() - startedAt < timeoutMs) {
//     if (isPlaylistReady(playlistPath, minSegments)) {
//       return true;
//     }

//     await new Promise((resolve) => setTimeout(resolve, intervalMs));
//   }

//   return false;
// }

// function getCachedExternalBypass(channelId: string, sourceUrl: string) {
//   const entry = externalBypassCache.get(channelId);

//   if (!entry) {
//     return null;
//   }

//   // Si cambió la URL original del canal, invalidamos automáticamente
//   if (entry.sourceUrl !== sourceUrl) {
//     externalBypassCache.delete(channelId);
//     return null;
//   }

//   return entry;
// }

// function setCachedExternalBypass(
//   channelId: string,
//   sourceUrl: string,
//   resolvedSourceUrl: string
// ) {
//   const entry: ExternalBypassEntry = {
//     channelId,
//     sourceUrl,
//     resolvedSourceUrl,
//     createdAt: Date.now(),
//   };

//   externalBypassCache.set(channelId, entry);
//   return entry;
// }

// function clearCachedExternalBypass(channelId: string) {
//   externalBypassCache.delete(channelId);
// }

// export async function streamController(req: Request, res: Response) {
//   try {
//     const rawChannelId = req.params.channelId;
//     const channelId = Array.isArray(rawChannelId)
//       ? rawChannelId[0]
//       : rawChannelId;

//     if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
//       return res.status(400).json({
//         ok: false,
//         message: "Canal inválido",
//       });
//     }

//     const channel = await Channel.findById(channelId).lean();

//     if (!channel) {
//       return res.status(404).json({
//         ok: false,
//         message: "Canal no encontrado",
//       });
//     }

//     if (!(channel as any).estado) {
//       return res.status(403).json({
//         ok: false,
//         message: "Canal inactivo",
//       });
//     }

//     const sourceUrl = String((channel as any).urlOrigen || "").trim();

//     if (!sourceUrl) {
//       return res.status(400).json({
//         ok: false,
//         message: "Canal sin URL de origen",
//       });
//     }

//     const cachedBypass = getCachedExternalBypass(channelId, sourceUrl);

//     if (cachedBypass) {
//       logger.info("Bypass HLS externo cacheado", {
//         channelId,
//         sourceUrl: cachedBypass.sourceUrl,
//         resolvedSourceUrl: cachedBypass.resolvedSourceUrl,
//       });

//       return res.redirect(cachedBypass.resolvedSourceUrl);
//     }

//     const resolvedSourceUrl = await resolveBestSourceUrl(sourceUrl);

//     if (isExternalHlsSource(resolvedSourceUrl)) {
//       setCachedExternalBypass(channelId, sourceUrl, resolvedSourceUrl);

//       logger.info("Bypass HLS externo activado", {
//         channelId,
//         sourceUrl,
//         resolvedSourceUrl,
//       });

//       return res.redirect(resolvedSourceUrl);
//     }

//     clearCachedExternalBypass(channelId);

//     const playlistPath = getChannelPlaylistPath(channelId);
//     const publicPlaylistUrl = getChannelPublicPlaylistUrl(channelId);

//     const existing = getActiveChannel(channelId);

//     if (existing) {
//       const processAlive =
//         existing.process.exitCode === null && !existing.process.killed;

//       if (processAlive) {
//         updateLastRequestAt(channelId);

//         if (existing.status === "running" && isPlaylistReady(playlistPath, 2)) {
//           return res.redirect(publicPlaylistUrl);
//         }

//         const readyExisting = await waitForPlaylistReady(
//           playlistPath,
//           12000,
//           500,
//           2
//         );

//         if (readyExisting) {
//           updateChannelStatus(channelId, "running");
//           return res.redirect(publicPlaylistUrl);
//         }
//       }
//     }

//     const process = startFfmpegHls(channelId, resolvedSourceUrl);

//     setActiveChannel(channelId, {
//       channelId,
//       sourceUrl: resolvedSourceUrl,
//       process,
//       startedAt: Date.now(),
//       lastRequestAt: Date.now(),
//       status: "starting",
//     });

//     const ready = await waitForPlaylistReady(playlistPath, 20000, 500, 2);

//     if (!ready) {
//       updateChannelStatus(channelId, "error");

//       return res.status(504).json({
//         ok: false,
//         message: "Timeout generando HLS estable",
//       });
//     }

//     updateChannelStatus(channelId, "running");

//     return res.redirect(publicPlaylistUrl);
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       ok: false,
//       message: "Error interno",
//     });
//   }
// }

import { Request, Response } from "express";
import mongoose from "mongoose";
import fs from "fs";
import Channel from "../models/Channel";
import { startFfmpegHls } from "../services/ffmpeg.service";
import {
  getActiveChannel,
  setActiveChannel,
  updateLastRequestAt,
  updateChannelStatus,
} from "../services/active-channel-registry.service";
import {
  getChannelPlaylistPath,
  getChannelPublicPlaylistUrl,
} from "../services/hls-path.service";
import {
  resolveBestSourceUrl,
  isExternalHlsSource,
} from "../services/source-resolver.service";
import { logger } from "../lib/logger";

type ExternalBypassEntry = {
  channelId: string;
  sourceUrl: string;
  resolvedSourceUrl: string;
  createdAt: number;
};

const externalBypassCache = new Map<string, ExternalBypassEntry>();

function countMediaSegmentsInPlaylist(content: string) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.endsWith(".ts"))
    .length;
}

function isPlaylistReady(playlistPath: string, minSegments = 2) {
  if (!fs.existsSync(playlistPath)) {
    return false;
  }

  try {
    const content = fs.readFileSync(playlistPath, "utf8");

    if (!content.includes("#EXTM3U")) {
      return false;
    }

    const segmentCount = countMediaSegmentsInPlaylist(content);

    return segmentCount >= minSegments;
  } catch {
    return false;
  }
}

async function waitForPlaylistReady(
  playlistPath: string,
  timeoutMs = 20000,
  intervalMs = 500,
  minSegments = 2
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (isPlaylistReady(playlistPath, minSegments)) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return false;
}

function getCachedExternalBypass(channelId: string, sourceUrl: string) {
  const entry = externalBypassCache.get(channelId);

  if (!entry) {
    return null;
  }

  if (entry.sourceUrl !== sourceUrl) {
    externalBypassCache.delete(channelId);
    return null;
  }

  return entry;
}

function setCachedExternalBypass(
  channelId: string,
  sourceUrl: string,
  resolvedSourceUrl: string
) {
  const entry: ExternalBypassEntry = {
    channelId,
    sourceUrl,
    resolvedSourceUrl,
    createdAt: Date.now(),
  };

  externalBypassCache.set(channelId, entry);
  return entry;
}

function clearCachedExternalBypass(channelId: string) {
  externalBypassCache.delete(channelId);
}

export async function streamController(req: Request, res: Response) {
  try {
    const rawChannelId = req.params.channelId;
    const channelId = Array.isArray(rawChannelId)
      ? rawChannelId[0]
      : rawChannelId;

    if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({
        ok: false,
        message: "Canal inválido",
      });
    }

    const channel = await Channel.findById(channelId).lean();

    if (!channel) {
      return res.status(404).json({
        ok: false,
        message: "Canal no encontrado",
      });
    }

    if (!(channel as any).estado) {
      return res.status(403).json({
        ok: false,
        message: "Canal inactivo",
      });
    }

    const sourceUrl = String((channel as any).urlOrigen || "").trim();

    if (!sourceUrl) {
      return res.status(400).json({
        ok: false,
        message: "Canal sin URL de origen",
      });
    }

    const cachedBypass = getCachedExternalBypass(channelId, sourceUrl);

    if (cachedBypass) {
      logger.info("Bypass HLS externo cacheado", {
        channelId,
        sourceUrl: cachedBypass.sourceUrl,
        resolvedSourceUrl: cachedBypass.resolvedSourceUrl,
      });

      return res.redirect(cachedBypass.resolvedSourceUrl);
    }

    const resolvedSourceUrl = await resolveBestSourceUrl(sourceUrl);

    if (isExternalHlsSource(resolvedSourceUrl)) {
      setCachedExternalBypass(channelId, sourceUrl, resolvedSourceUrl);

      logger.info("Bypass HLS externo activado", {
        channelId,
        sourceUrl,
        resolvedSourceUrl,
      });

      return res.redirect(resolvedSourceUrl);
    }

    clearCachedExternalBypass(channelId);

    const playlistPath = getChannelPlaylistPath(channelId);
    const publicPlaylistUrl = getChannelPublicPlaylistUrl(channelId);

    const existing = getActiveChannel(channelId);

    if (existing) {
      const processAlive =
        existing.process.exitCode === null && !existing.process.killed;

      if (processAlive) {
        updateLastRequestAt(channelId);

        if (existing.status === "running" && isPlaylistReady(playlistPath, 2)) {
          return res.redirect(publicPlaylistUrl);
        }

        const readyExisting = await waitForPlaylistReady(
          playlistPath,
          12000,
          500,
          2
        );

        if (readyExisting) {
          updateChannelStatus(channelId, "running");
          return res.redirect(publicPlaylistUrl);
        }
      }
    }

    const process = startFfmpegHls(channelId, resolvedSourceUrl);

    setActiveChannel(channelId, {
      channelId,
      sourceUrl: resolvedSourceUrl,
      process,
      startedAt: Date.now(),
      lastRequestAt: Date.now(),
      status: "starting",
    });

    const ready = await waitForPlaylistReady(playlistPath, 20000, 500, 2);

    if (!ready) {
      updateChannelStatus(channelId, "error");

      return res.status(504).json({
        ok: false,
        message: "Timeout generando HLS estable",
      });
    }

    updateChannelStatus(channelId, "running");

    return res.redirect(publicPlaylistUrl);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      message: "Error interno",
    });
  }
}