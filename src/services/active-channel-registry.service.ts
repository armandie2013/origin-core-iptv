import { ChildProcess } from "child_process";

export type ActiveChannel = {
  channelId: string;
  sourceUrl: string;
  process: ChildProcess;
  startedAt: number;
  lastRequestAt: number;
  status: "starting" | "running" | "error";
};

const activeChannels = new Map<string, ActiveChannel>();

export function getActiveChannel(channelId: string) {
  return activeChannels.get(channelId);
}

export function setActiveChannel(channelId: string, data: ActiveChannel) {
  activeChannels.set(channelId, data);
}

export function removeActiveChannel(channelId: string) {
  activeChannels.delete(channelId);
}

export function updateLastRequestAt(channelId: string) {
  const channel = activeChannels.get(channelId);
  if (!channel) return;
  channel.lastRequestAt = Date.now();
}

export function getAllActiveChannels() {
  return Array.from(activeChannels.values());
}