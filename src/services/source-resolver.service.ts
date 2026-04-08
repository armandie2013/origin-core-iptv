import axios from "axios";
import { logger } from "../lib/logger";

type VariantStream = {
  bandwidth: number;
  resolution?: string;
  url: string;
};

function isAbsoluteUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

function buildAbsoluteUrl(baseUrl: string, relativeOrAbsolute: string) {
  if (isAbsoluteUrl(relativeOrAbsolute)) {
    return relativeOrAbsolute;
  }

  return new URL(relativeOrAbsolute, baseUrl).toString();
}

function looksLikeM3u8(contentType: string | undefined, body: string) {
  const ct = (contentType || "").toLowerCase();
  return (
    ct.includes("application/vnd.apple.mpegurl") ||
    ct.includes("application/x-mpegurl") ||
    body.includes("#EXTM3U")
  );
}

function parseBandwidth(line: string) {
  const match = line.match(/BANDWIDTH=(\d+)/i);
  return match ? Number(match[1]) : 0;
}

function parseResolution(line: string) {
  const match = line.match(/RESOLUTION=([\dx]+)/i);
  return match ? match[1] : undefined;
}

function parseMasterPlaylist(masterUrl: string, content: string): VariantStream[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const variants: VariantStream[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("#EXT-X-STREAM-INF:")) {
      const bandwidth = parseBandwidth(line);
      const resolution = parseResolution(line);
      const nextLine = lines[i + 1];

      if (nextLine && !nextLine.startsWith("#")) {
        variants.push({
          bandwidth,
          resolution,
          url: buildAbsoluteUrl(masterUrl, nextLine),
        });
      }
    }
  }

  return variants;
}

export async function resolveBestSourceUrl(sourceUrl: string): Promise<string> {
  logger.info("Resolviendo sourceUrl", { sourceUrl });

  const response = await axios.get<string>(sourceUrl, {
    responseType: "text",
    maxRedirects: 10,
    timeout: 15000,
    headers: {
      "User-Agent": "origin-core-iptv/1.0",
      Accept: "*/*",
    },
  });

  const finalUrl =
    response.request?.res?.responseUrl || sourceUrl;

  const body = typeof response.data === "string" ? response.data : "";
  const contentType = response.headers["content-type"];

  if (!looksLikeM3u8(contentType, body)) {
    logger.info("La fuente no parece ser un m3u8, se usa tal cual", {
      finalUrl,
      contentType,
    });
    return finalUrl;
  }

  const isMaster = body.includes("#EXT-X-STREAM-INF");

  if (!isMaster) {
    logger.info("La fuente ya es una media playlist", { finalUrl });
    return finalUrl;
  }

  const variants = parseMasterPlaylist(finalUrl, body);

  if (!variants.length) {
    logger.info("Master playlist sin variantes detectables, se usa finalUrl", {
      finalUrl,
    });
    return finalUrl;
  }

  variants.sort((a, b) => b.bandwidth - a.bandwidth);
  const best = variants[0];

  logger.info("Mejor variante HLS detectada", {
    finalUrl,
    selectedBandwidth: best.bandwidth,
    selectedResolution: best.resolution,
    selectedUrl: best.url,
  });

  return best.url;
}