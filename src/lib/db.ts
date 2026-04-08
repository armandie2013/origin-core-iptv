import mongoose from "mongoose";
import { env } from "../config/env";
import { logger } from "./logger";

export async function connectDB() {
  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info("Mongo conectado");
  } catch (error) {
    logger.error("Error conectando Mongo", error);
    process.exit(1);
  }
}