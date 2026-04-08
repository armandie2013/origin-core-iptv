import express from "express";
import cors from "cors";
import path from "path";
import { env } from "./config/env";
import healthRoutes from "./routes/health.routes";
import streamRoutes from "./routes/stream.routes";
import { logger } from "./lib/logger";
import { connectDB } from "./lib/db";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/hls", express.static(path.resolve(env.HLS_ROOT)));

app.use("/", healthRoutes);
app.use("/", streamRoutes);

async function start() {
  await connectDB();

  app.listen(env.PORT, () => {
    logger.info(`Origin iniciado`, {
      port: env.PORT,
      node: env.NODE_KEY,
      url: env.PUBLIC_BASE_URL,
    });
  });
}

start();