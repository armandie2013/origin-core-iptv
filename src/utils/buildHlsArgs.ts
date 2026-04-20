export function buildHlsArgs(outputPath: string): string[] {
  return [
    "-muxdelay",
    "0",
    "-muxpreload",
    "0",

    "-c:v",
    "copy",

    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-ar",
    "48000",
    "-ac",
    "2",

    "-f",
    "hls",
    "-hls_time",
    "2",
    "-hls_list_size",
    "3",
    "-hls_flags",
    "delete_segments+independent_segments+omit_endlist",

    "-hls_allow_cache",
    "0",

    "-start_number",
    "1",

    "-hls_segment_filename",
    outputPath.replace("index.m3u8", "segment_%03d.ts"),

    outputPath,
  ];
}