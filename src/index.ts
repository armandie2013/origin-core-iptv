import express from "express";
import cors from "cors";
import path from "path";
import { env } from "./config/env";
import healthRoutes from "./routes/health.routes";
import streamRoutes from "./routes/stream.routes";
import channelsRoutes from "./routes/channels.routes";
import panelRoutes from "./routes/panel.routes";
import { logger } from "./lib/logger";
import { connectDB } from "./lib/db";
import { startChannelCleanupLoop } from "./services/channel-cleanup.service";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/hls", express.static(path.resolve(env.HLS_ROOT)));

// 👇 para servir CSS y otros archivos estáticos del panel
app.use("/public", express.static(path.resolve("src/public")));

app.use("/", healthRoutes);
app.use("/", streamRoutes);
app.use("/", channelsRoutes);
app.use("/", panelRoutes);

async function start() {
  await connectDB();

  startChannelCleanupLoop();

  app.listen(env.PORT, () => {
    logger.info("Origin iniciado", {
      port: env.PORT,
      node: env.NODE_KEY,
      url: env.PUBLIC_BASE_URL,
    });
  });
}

start();