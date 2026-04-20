export function buildInputArgs(sourceUrl: string): string[] {
  const normalized = sourceUrl.trim().toLowerCase();

  if (normalized.startsWith("udp://")) {
    return [
      "-fflags",
      "+genpts+discardcorrupt+nobuffer",
      "-flags",
      "low_delay",
      "-analyzeduration",
      "1000000",
      "-probesize",
      "1000000",
      "-i",
      sourceUrl,
    ];
  }

  if (normalized.startsWith("rtsp://")) {
    return [
      "-rtsp_transport",
      "tcp",
      "-fflags",
      "+genpts",
      "-i",
      sourceUrl,
    ];
  }

  return ["-i", sourceUrl];
}