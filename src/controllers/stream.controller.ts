import { Request, Response } from "express";
import mongoose from "mongoose";
import fs from "fs";
import Channel from "../models/Channel";
import { startFfmpegHls } from "../services/ffmpeg.service";
import {
  getActiveChannel,
  setActiveChannel,
  updateLastRequestAt,
} from "../services/active-channel-registry.service";
import {
  getChannelPlaylistPath,
  getChannelPublicPlaylistUrl,
} from "../services/hls-path.service";
import { resolveBestSourceUrl } from "../services/source-resolver.service";

async function waitForPlaylist(
  playlistPath: string,
  timeoutMs = 15000,
  intervalMs = 500
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (fs.existsSync(playlistPath)) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return false;
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

    const existing = getActiveChannel(channelId);

    if (existing) {
      const processAlive =
        existing.process.exitCode === null && !existing.process.killed;

      if (processAlive) {
        updateLastRequestAt(channelId);
        return res.redirect(getChannelPublicPlaylistUrl(channelId));
      }
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

    const resolvedSourceUrl = await resolveBestSourceUrl(sourceUrl);

    const process = startFfmpegHls(channelId, resolvedSourceUrl);

    setActiveChannel(channelId, {
      channelId,
      sourceUrl: resolvedSourceUrl,
      process,
      startedAt: Date.now(),
      lastRequestAt: Date.now(),
      status: "starting",
    });

    const playlistPath = getChannelPlaylistPath(channelId);
    const ready = await waitForPlaylist(playlistPath, 15000, 500);

    if (!ready) {
      return res.status(504).json({
        ok: false,
        message: "Timeout generando HLS",
      });
    }

    return res.redirect(getChannelPublicPlaylistUrl(channelId));
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      message: "Error interno",
    });
  }
}