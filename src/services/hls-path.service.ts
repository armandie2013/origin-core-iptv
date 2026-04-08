import path from "path";
import { env } from "../config/env";

export function getChannelHlsDir(channelId: string) {
  return path.resolve(env.HLS_ROOT, channelId);
}

export function getChannelPlaylistPath(channelId: string) {
  return path.resolve(getChannelHlsDir(channelId), "index.m3u8");
}

export function getChannelPublicPlaylistUrl(channelId: string) {
  return `${env.PUBLIC_BASE_URL}/hls/${channelId}/index.m3u8`;
}