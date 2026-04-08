import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  getActiveChannel,
  getAllActiveChannels,
} from "../services/active-channel-registry.service";
import { stopChannel } from "../services/channel-cleanup.service";

export function getActiveChannelsController(_req: Request, res: Response) {
  const now = Date.now();

  const channels = getAllActiveChannels().map((channel) => {
    const processAlive =
      channel.process.exitCode === null && !channel.process.killed;

    return {
      channelId: channel.channelId,
      sourceUrl: channel.sourceUrl,
      status: channel.status,
      startedAt: new Date(channel.startedAt).toISOString(),
      lastRequestAt: new Date(channel.lastRequestAt).toISOString(),
      idleSeconds: Math.floor((now - channel.lastRequestAt) / 1000),
      processAlive,
      pid: channel.process.pid ?? null,
    };
  });

  return res.json({
    ok: true,
    count: channels.length,
    channels,
  });
}

export function getChannelStatusController(req: Request, res: Response) {
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

  const channel = getActiveChannel(channelId);

  if (!channel) {
    return res.status(404).json({
      ok: false,
      message: "Canal no activo",
      channelId,
    });
  }

  const processAlive =
    channel.process.exitCode === null && !channel.process.killed;

  return res.json({
    ok: true,
    channel: {
      channelId: channel.channelId,
      sourceUrl: channel.sourceUrl,
      status: channel.status,
      startedAt: new Date(channel.startedAt).toISOString(),
      lastRequestAt: new Date(channel.lastRequestAt).toISOString(),
      idleSeconds: Math.floor((Date.now() - channel.lastRequestAt) / 1000),
      processAlive,
      pid: channel.process.pid ?? null,
    },
  });
}

export function stopChannelController(req: Request, res: Response) {
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

  const stopped = stopChannel(channelId, "manual-stop");

  if (!stopped) {
    return res.status(404).json({
      ok: false,
      message: "Canal no activo",
    });
  }

  return res.json({
    ok: true,
    message: "Canal detenido correctamente",
    channelId,
  });
}