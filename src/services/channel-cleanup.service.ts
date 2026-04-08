import fs from "fs";
import { env } from "../config/env";
import { logger } from "../lib/logger";
import {
  getAllActiveChannels,
  removeActiveChannel,
} from "./active-channel-registry.service";
import { getChannelHlsDir } from "./hls-path.service";

function removeDirIfExists(dir: string) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export function stopChannel(channelId: string, reason: string) {
  const channels = getAllActiveChannels();
  const channel = channels.find((item) => item.channelId === channelId);

  if (!channel) {
    return false;
  }

  try {
    if (
      channel.process &&
      channel.process.exitCode === null &&
      !channel.process.killed
    ) {
      channel.process.kill("SIGTERM");
    }
  } catch (error) {
    logger.error("Error al detener proceso FFmpeg", { channelId, error });
  }

  try {
    const hlsDir = getChannelHlsDir(channelId);
    removeDirIfExists(hlsDir);
  } catch (error) {
    logger.error("Error al limpiar carpeta HLS", { channelId, error });
  }

  removeActiveChannel(channelId);

  logger.info("Canal cerrado", {
    channelId,
    reason,
  });

  return true;
}

export function startChannelCleanupLoop() {
  if (env.CHANNEL_IDLE_TIMEOUT_MS <= 0) {
    logger.info("Auto-cierre de canales desactivado", {
      timeoutMs: env.CHANNEL_IDLE_TIMEOUT_MS,
    });
    return;
  }

  const intervalMs = 30000;

  logger.info("Auto-cierre de canales activado", {
    timeoutMs: env.CHANNEL_IDLE_TIMEOUT_MS,
    checkEveryMs: intervalMs,
  });

  setInterval(() => {
    const now = Date.now();
    const activeChannels = getAllActiveChannels();

    for (const channel of activeChannels) {
      const idleMs = now - channel.lastRequestAt;

      if (idleMs >= env.CHANNEL_IDLE_TIMEOUT_MS) {
        stopChannel(
          channel.channelId,
          `idle-timeout-${env.CHANNEL_IDLE_TIMEOUT_MS}ms`
        );
      }
    }
  }, intervalMs);
}