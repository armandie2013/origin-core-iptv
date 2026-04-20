// import axios from "axios";
// import { logger } from "../lib/logger";

// type VariantStream = {
//   bandwidth: number;
//   resolution?: string;
//   url: string;
// };

// function isAbsoluteUrl(url: string) {
//   return /^https?:\/\//i.test(url);
// }

// function buildAbsoluteUrl(baseUrl: string, relativeOrAbsolute: string) {
//   if (isAbsoluteUrl(relativeOrAbsolute)) {
//     return relativeOrAbsolute;
//   }

//   return new URL(relativeOrAbsolute, baseUrl).toString();
// }

// function looksLikeM3u8(contentType: string | undefined, body: string) {
//   const ct = (contentType || "").toLowerCase();
//   return (
//     ct.includes("application/vnd.apple.mpegurl") ||
//     ct.includes("application/x-mpegurl") ||
//     body.includes("#EXTM3U")
//   );
// }

// function parseBandwidth(line: string) {
//   const match = line.match(/BANDWIDTH=(\d+)/i);
//   return match ? Number(match[1]) : 0;
// }

// function parseResolution(line: string) {
//   const match = line.match(/RESOLUTION=([\dx]+)/i);
//   return match ? match[1] : undefined;
// }

// function parseMasterPlaylist(masterUrl: string, content: string): VariantStream[] {
//   const lines = content
//     .split(/\r?\n/)
//     .map((line) => line.trim())
//     .filter(Boolean);

//   const variants: VariantStream[] = [];

//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i];

//     if (line.startsWith("#EXT-X-STREAM-INF:")) {
//       const bandwidth = parseBandwidth(line);
//       const resolution = parseResolution(line);
//       const nextLine = lines[i + 1];

//       if (nextLine && !nextLine.startsWith("#")) {
//         variants.push({
//           bandwidth,
//           resolution,
//           url: buildAbsoluteUrl(masterUrl, nextLine),
//         });
//       }
//     }
//   }

//   return variants;
// }

// export async function resolveBestSourceUrl(sourceUrl: string): Promise<string> {
//   logger.info("Resolviendo sourceUrl", { sourceUrl });

//   const response = await axios.get<string>(sourceUrl, {
//     responseType: "text",
//     maxRedirects: 10,
//     timeout: 15000,
//     headers: {
//       "User-Agent": "origin-core-iptv/1.0",
//       Accept: "*/*",
//     },
//   });

//   const finalUrl =
//     response.request?.res?.responseUrl || sourceUrl;

//   const body = typeof response.data === "string" ? response.data : "";
//   const contentType = response.headers["content-type"];

//   if (!looksLikeM3u8(contentType, body)) {
//     logger.info("La fuente no parece ser un m3u8, se usa tal cual", {
//       finalUrl,
//       contentType,
//     });
//     return finalUrl;
//   }

//   const isMaster = body.includes("#EXT-X-STREAM-INF");

//   if (!isMaster) {
//     logger.info("La fuente ya es una media playlist", { finalUrl });
//     return finalUrl;
//   }

//   const variants = parseMasterPlaylist(finalUrl, body);

//   if (!variants.length) {
//     logger.info("Master playlist sin variantes detectables, se usa finalUrl", {
//       finalUrl,
//     });
//     return finalUrl;
//   }

//   variants.sort((a, b) => b.bandwidth - a.bandwidth);
//   const best = variants[0];

//   logger.info("Mejor variante HLS detectada", {
//     finalUrl,
//     selectedBandwidth: best.bandwidth,
//     selectedResolution: best.resolution,
//     selectedUrl: best.url,
//   });

//   return best.url;
// }

import axios from "axios";
import { logger } from "../lib/logger";

function absolutizeUrl(baseUrl: string, maybeRelative: string) {
  if (/^https?:\/\//i.test(maybeRelative)) {
    return maybeRelative;
  }

  return new URL(maybeRelative, baseUrl).toString();
}

function parseBandwidth(value: string | null) {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseResolution(value: string | null) {
  if (!value) return { width: 0, height: 0 };

  const match = value.match(/^(\d+)x(\d+)$/i);

  if (!match) {
    return { width: 0, height: 0 };
  }

  return {
    width: Number(match[1]),
    height: Number(match[2]),
  };
}

function isLikelyM3u8(url: string) {
  return /\.m3u8($|\?)/i.test(url);
}

function isMasterPlaylist(content: string) {
  return content.includes("#EXT-X-STREAM-INF");
}

function isMediaPlaylist(content: string) {
  return content.includes("#EXTINF") || content.includes("#EXT-X-TARGETDURATION");
}

type Variant = {
  url: string;
  bandwidth: number;
  resolutionText: string;
  width: number;
  height: number;
};

export async function resolveBestSourceUrl(sourceUrl: string) {
  logger.info("Resolviendo sourceUrl", { sourceUrl });

  if (!isLikelyM3u8(sourceUrl)) {
    logger.info("La fuente no es HLS, se usa directa", {
      finalUrl: sourceUrl,
    });
    return sourceUrl;
  }

  try {
    const response = await axios.get<string>(sourceUrl, {
      responseType: "text",
      timeout: 15000,
      headers: {
        "User-Agent": "origin-core-iptv/1.0",
        Accept: "*/*",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      validateStatus: (status) => status >= 200 && status < 400,
    });

    const content = response.data;

    if (isMediaPlaylist(content)) {
      logger.info("La fuente ya es una media playlist", {
        finalUrl: sourceUrl,
      });
      return sourceUrl;
    }

    if (!isMasterPlaylist(content)) {
      logger.info("HLS sin variantes detectables, se usa URL original", {
        finalUrl: sourceUrl,
      });
      return sourceUrl;
    }

    const lines = content.split(/\r?\n/);
    const variants: Variant[] = [];

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i]?.trim() || "";

      if (!line.startsWith("#EXT-X-STREAM-INF:")) {
        continue;
      }

      const attrs = line.replace("#EXT-X-STREAM-INF:", "");
      const bandwidthMatch = attrs.match(/BANDWIDTH=(\d+)/i);
      const resolutionMatch = attrs.match(/RESOLUTION=([^,]+)/i);

      let nextUrl = "";

      for (let j = i + 1; j < lines.length; j += 1) {
        const candidate = (lines[j] || "").trim();
        if (!candidate || candidate.startsWith("#")) {
          continue;
        }
        nextUrl = candidate;
        break;
      }

      if (!nextUrl) {
        continue;
      }

      const bandwidth = parseBandwidth(bandwidthMatch?.[1] || null);
      const resolutionText = resolutionMatch?.[1] || "";
      const resolution = parseResolution(resolutionText);

      variants.push({
        url: absolutizeUrl(sourceUrl, nextUrl),
        bandwidth,
        resolutionText,
        width: resolution.width,
        height: resolution.height,
      });
    }

    if (variants.length === 0) {
      logger.info("Master playlist sin variantes útiles, se usa URL original", {
        finalUrl: sourceUrl,
      });
      return sourceUrl;
    }

    variants.sort((a, b) => {
      if (a.height !== b.height) {
        return a.height - b.height;
      }

      return a.bandwidth - b.bandwidth;
    });

    const selected = variants[0];

    logger.info("Mejor variante HLS detectada", {
      finalUrl: sourceUrl,
      selectedBandwidth: selected.bandwidth,
      selectedResolution: selected.resolutionText || "unknown",
      selectedUrl: selected.url,
    });

    return selected.url;
  } catch (error) {
    logger.info("No se pudo inspeccionar HLS, se usa URL original", {
      sourceUrl,
      error: error instanceof Error ? error.message : "unknown",
    });

    return sourceUrl;
  }
}

export function isExternalHlsSource(url: string) {
  return /^https?:\/\//i.test(url) && /\.m3u8($|\?)/i.test(url);
}